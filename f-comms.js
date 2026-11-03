// Communication features: customer SMS, photos and voice notes (with transcript), translate, suggested replies,
// polls, formatting, "Seen by", link previews, send later, undo send, pinned and saved messages.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect } = React;
  const close = () => A.set({ pop: null });
  const now = () => Date.now();

  // ---------- customers on records ----------
  A.CUSTOMERS = {
    'RO 48213': { name: 'Harlan Pruitt', phone: '(555) 014-2290', optIn: 'Opted in Oct 2' },
    'DEAL 7741': { name: 'Harlan Pruitt', phone: '(555) 014-2290', optIn: 'Opted in Oct 2' },
    'RO 48230': { name: 'Bill Ortega (Ridgeline Excavating)', phone: '(555) 220-4411', optIn: 'Opted in Sep 14' },
    'INV 220981': { name: 'Bell Rentals', phone: '(555) 301-7788', optIn: null },
  };
  A.custOf = (c) => (c && c.rec && A.CUSTOMERS[c.rec]) || null;
  const custReply = (t) => /ready|pick ?up|done/i.test(t) ? "Great, I'll swing by after 4. Thanks!" : /eta|tuesday|backorder|part/i.test(t) ? 'OK, thanks for letting me know. Any chance of a loaner until then?' : /approve|estimate|\$/i.test(t) ? 'Yes, go ahead with the repair.' : 'Got it, thank you.';
  A.sendSms = (c, text, files) => {
    const cu = A.custOf(c); if (!cu || !cu.optIn) { A.snack(cu ? cu.name + " hasn't agreed to texts. Call them instead." : 'No customer on this conversation.'); return; }
    const m = { id: A.nextId(), from: A.ME, channel: 'sms', dir: 'out', t: now(), text, files, reactions: {}, thread: [], smsState: 'Sending' };
    A.set(() => { c.msgs.push(m); });
    setTimeout(() => A.set(() => { m.smsState = 'Delivered'; }), 1200);
    setTimeout(() => A.set(() => { c.msgs.push({ id: A.nextId(), channel: 'sms', dir: 'in', cust: cu.name, t: now(), text: custReply(text), reactions: {}, thread: [] }); if (A.S.convId !== c.id) { c.unread = (c.unread || 0) + 1; } A.notify && A.notify({ kind: 'sms', conv: c.id, title: cu.name + ' replied by text', text: custReply(text) }); }), 6500);
  };
  A.SmsEv = function SmsEv({ m, c }) {
    const cu = A.custOf(c) || { name: m.cust || 'Customer', phone: '' };
    return html`<div tabIndex="-1" className=${'ev sms ' + m.dir} data-id=${m.id}>
      <span className="node smsnode"><${I} n="phone" s="12" /></span>
      <div className="who"><b>${m.dir === 'out' ? (m.from === A.ME ? 'You' : A.uname(m.from)) + ' → ' + cu.name : cu.name}</b><span className="smstag">Text message</span><small>${A.fmtTime(m.t)}</small></div>
      <div className="smsbub">${m.text}</div>${A.MsgExtras ? html`<${A.MsgExtras} m=${m} c=${c} />` : null}
      ${m.dir === 'out' ? html`<div className="smsst">${m.smsState === 'Delivered' ? html`<${I} n="checks" s="12" />` : html`<${I} n="clock" s="12" />`}${m.smsState} to ${cu.phone}</div>` : null}</div>`;
  };

  // ---------- seeds: a Spanish message, a web link, a group message of mine ----------
  (() => {
    const t = now();
    const ts = A.conv('team-service'); if (ts) ts.msgs.push({ id: 'es1', from: 'u9', t: t - 4 * 60000, text: 'Ya terminé el diagnóstico del RZR. El estator está quemado y el arnés también necesita cambio.', reactions: {}, thread: [] });
    const tp = A.conv('team-parts'); if (tp) tp.msgs.push({ id: 'lk1', from: 'u4', t: t - 30 * 60000, text: 'Polaris service bulletin for the stator failures: https://www.polaris.com/service/bulletins/SB-2026-114', reactions: {}, thread: [] },
      { id: 'my1', from: A.ME, t: t - 25 * 60000, text: 'Thanks Tom. Let\'s order two so we have one on the shelf.', reactions: {}, thread: [], state: 'sent' });
    const ro = A.conv('rec-RO 48213'); if (ro) ro.msgs.push({ id: 'sms0', channel: 'sms', dir: 'out', from: 'u2', t: t - 28 * 60000, text: 'Hi Harlan, this is Dana at Ridgeline Powersports. The stator for your RZR is on backorder, ETA Tuesday. We will text you when it arrives.', reactions: {}, thread: [], smsState: 'Delivered' },
      { id: 'sms1', channel: 'sms', dir: 'in', cust: 'Harlan Pruitt', t: t - 22 * 60000, text: 'Thanks for the heads up. Any chance of a loaner until then?', reactions: {}, thread: [] });
    A.CONVS.forEach((c) => c.msgs.sort((a, b) => a.t - b.t));
  })();

  // ---------- translate ----------
  const TR = { es1: 'I finished the diagnosis on the RZR. The stator is burnt and the harness also needs replacing.' };
  const isSpanish = (t) => (t.match(/\b(el|la|los|las|está|también|necesita|ya|terminé|del|por favor|gracias|cambio)\b/gi) || []).length >= 3;
  A.translate = async (m) => {
    A.set(() => { m.trBusy = true; });
    let out = TR[m.id];
    if (!out && A.sampleFn && A.S.ai.engine === 'cloud') { try { out = (await A.sampleFn('Translate this dealership chat message to plain English. Reply with only the translation.\n\n' + m.text, { modelTier: 'quick' })).text; } catch (e) {} }
    A.set(() => { m.trBusy = false; m.tr = out || '(Translation needs ASPEN Assist with ASPEN in this view.)'; m.showTr = true; });
  };

  // ---------- message extras: photos, voice notes, polls, link previews, translate, seen by ----------
  const LINKS = { 'polaris.com': ['Polaris Dealer Service', 'SB-2026-114: Stator failures on 2021 RZR XP 1000. Replace stator and inspect regulator harness.'] };
  A.MsgExtras = function MsgExtras({ m, c }) {
    const S = A.S, out = [];
    (m.files || []).filter((f) => f.photo).forEach((f, i) => out.push(html`<button className="photo" key=${'p' + i} title="Open photo" onClick=${() => A.set({ modal: { type: 'preview', f: Object.assign({}, f, { type: 'JPG' }) } })}><span className="photoimg" style=${{ '--h': f.hue || 18 }}><${I} n="video" s="20" /></span><span className="photocap">${f.name}</span></button>`));
    (m.files || []).filter((f) => f.voice).forEach((f, i) => out.push(html`<${Voice} key=${'v' + i} f=${f} m=${m} />`));
    if (m.poll) out.push(html`<${Poll} key="poll" m=${m} />`);
    const url = (m.text || '').match(/https?:\/\/[^\s]+/);
    if (url) { const host = url[0].replace(/^https?:\/\/(www\.)?/, '').split('/')[0]; const info = LINKS[host] || [host, url[0]]; out.push(html`<a className="linkprev" key="lp" href=${url[0]} target="_blank" rel="noopener"><span className="lpbar"></span><span><small>${host}</small><b>${info[0]}</b><span>${info[1]}</span></span></a>`); }
    if (m.text && isSpanish(m.text)) out.push(m.showTr ? html`<div className="trans" key="tr"><small><${A.Spark} s="10" /> Translated from Spanish · <button className="link" onClick=${() => A.set(() => { m.showTr = false; })}>Show original only</button></small>${m.tr}</div>` : html`<button className="link trlink" key="trb" onClick=${() => A.translate(m)}>${m.trBusy ? 'Translating…' : 'Translate to English'}</button>`);
    if (m.from === A.ME && !m.kind && m.channel !== 'sms' && c.kind !== 'dm' && c.kind !== 'system') {
      const lastMine = [...c.msgs].reverse().find((x) => x.from === A.ME && !x.kind && x.channel !== 'sms');
      if (lastMine === m) { const seen = c.members.filter((u) => u !== A.ME && A.USERS[u] && A.USERS[u].pres !== 'off');
        if (seen.length) out.push(html`<div className="seenby" key="sb" title=${'Seen by ' + seen.map((u) => A.USERS[u].name).join(', ')}><span className="seenav">${seen.slice(0, 3).map((u) => html`<${A.Av} u=${u} size="20" pres=${false} />`)}</span>Seen by ${seen.slice(0, 2).map((u) => A.USERS[u].name.split(' ')[0]).join(', ')}${seen.length > 2 ? ' and ' + (seen.length - 2) + ' more' : ''}</div>`); }
    }
    if (m.pinned) out.push(html`<span className="pinmark" key="pm"><${I} n="pin" s="12" />Pinned</span>`);
    return out.length ? html`<div className="mx">${out}</div>` : null;
  };
  function Voice({ f, m }) {
    const [play, setPlay] = useState(false);
    useEffect(() => { if (!play) return; const t = setTimeout(() => setPlay(false), (f.dur || 12) * 120); return () => clearTimeout(t); }, [play]);
    const bars = [6, 12, 9, 16, 11, 7, 14, 18, 10, 6, 13, 9, 15, 8, 12, 17, 9, 6, 11, 14, 8, 12, 7, 10];
    return html`<div className="voice"><button className="vplay" aria-label=${play ? 'Pause' : 'Play voice note'} onClick=${() => setPlay(!play)}><${I} n=${play ? 'pause' : 'play'} s="12" /></button>
      <span className=${'wave' + (play ? ' on' : '')}>${bars.map((h, i) => html`<i style=${{ height: h + 'px', animationDelay: i * 40 + 'ms' }}></i>`)}</span><span className="vdur">0:${String(f.dur || 12).padStart(2, '0')}</span>
      <div className="vtrans">${m.transcribing ? html`<span className="spin"></span> Writing transcript…` : m.transcript ? html`<small><${A.Spark} s="10" /> Transcript</small>${m.transcript}` : null}</div></div>`;
  }
  function Poll({ m }) {
    const p = m.poll, total = p.opts.reduce((s, o) => s + o.votes.length, 0) || 1, mine = p.opts.findIndex((o) => o.votes.includes(A.ME));
    return html`<div className="poll"><b>${p.q}</b>${p.opts.map((o, i) => html`<button className=${'popt' + (mine === i ? ' me' : '')} onClick=${() => A.set(() => { p.opts.forEach((x) => { x.votes = x.votes.filter((u) => u !== A.ME); }); if (mine !== i) o.votes.push(A.ME); })}>
      <span className="pfill" style=${{ width: Math.round((o.votes.length / total) * 100) + '%' }}></span><span className="ptxt">${o.t}</span><span className="pcount">${o.votes.length}</span></button>`)}<small>${p.opts.reduce((s, o) => s + o.votes.length, 0)} votes · tap to vote, tap again to change</small></div>`;
  }
  const FC0 = A.FileChip;
  A.FileChip = function FileChip(p) { return p.f && (p.f.photo || p.f.voice) ? null : html`<${FC0} f=${p.f} />`; };

  // ---------- formatting (**bold**, _italic_, "- " bullets) ----------
  const rich0 = A.rich;
  A.rich = (text, q) => {
    if (!text) return rich0(text, q);
    const t = text.replace(/^- /gm, '• ');
    const parts = rich0(t, q); const fmt = (s, k) => s.split(/(\*\*[^*]+\*\*|_[^_\s][^_]*_)/g).map((x, i) => /^\*\*.+\*\*$/.test(x) ? html`<b key=${k + 'b' + i}>${x.slice(2, -2)}</b>` : /^_.+_$/.test(x) ? html`<i key=${k + 'i' + i}>${x.slice(1, -1)}</i>` : x);
    return (Array.isArray(parts) ? parts : [parts]).map((p, i) => typeof p === 'string' ? fmt(p, i) : p);
  };

  // ---------- composer: tools row, suggestions, recorder, send later ----------
  const SUGGEST = (msg, sms) => {
    const t = (msg && msg.text) || '';
    if (sms) return /loaner/i.test(t) ? ['Yes, we can set you up with a loaner', 'Let me check loaner availability', "We'll text you when it's ready"] : ["Thanks, we'll keep you posted", 'Your unit is ready for pickup', 'Can you call the store when you get a minute?'];
    if (/approve|ok the|sign off/i.test(t)) return ['Approved ✓', 'Let me check the numbers first', 'Can we talk for a minute?'];
    if (/eta|backorder|tuesday|part/i.test(t)) return ['Thanks for the update', 'Can you expedite it?', 'Please let the customer know'];
    if (/@Mubshar|\?/.test(t)) return ['On it', 'Checking now', 'Yes'];
    return ['👍 Got it', 'Thanks!', 'On my way'];
  };
  A.CompAbove = function CompAbove({ c, api }) {
    const S = A.S, out = [];
    const cu = A.custOf(c);
    if (cu && api.sms && api.mode === 'message') out.push(html`<div className=${'smsnote' + (cu.optIn ? '' : ' warn')} key="sn"><${I} n="phone" s="12" />${cu.optIn ? html`Texting <b>${cu.name}</b> at ${cu.phone} · ${cu.optIn}. Replies come back here.` : html`<b>${cu.name}</b> hasn't agreed to receive texts. Call instead.`}<span className="grow"></span><button className="link" onClick=${() => api.setSms(false)}>Back to team chat</button></div>`);
    if (S.rec && S.rec.conv === c.id) out.push(html`<div className="recorder" key="rec"><span className="recdot"></span>Recording voice note… <${RecTimer} /><span className="grow"></span><button className="btn sm" onClick=${() => A.set({ rec: null })}>Cancel</button><button className="btn sm pri" onClick=${() => A.stopVoice(c)}>Stop and send</button></div>`);
    if (S.sendLater && S.sendLater.conv === c.id) out.push(html`<div className="laternote" key="sl"><${I} n="clock" s="12" />Your next message will send <b>${S.sendLater.label}</b><span className="grow"></span><button className="link" onClick=${() => A.set({ sendLater: null })}>Send now instead</button></div>`);
    if (S.fmt === c.id) out.push(html`<div className="fmtbar" key="fmt">${[['B', '**', '**', 'Bold'], ['I', '_', '_', 'Italic'], ['•', '- ', '', 'Bullet list']].map(([l, a, b, tip]) => html`<button title=${tip} style=${{ fontWeight: l === 'B' ? 700 : 400, fontStyle: l === 'I' ? 'italic' : 'normal' }} onClick=${() => { const el = api.ta.current; const s = el.selectionStart, e = el.selectionEnd, v = api.v; const sel = v.slice(s, e) || (l === '•' ? '' : 'text'); api.put(v.slice(0, s) + a + sel + b + v.slice(e)); setTimeout(() => el.focus(), 0); }}>${l}</button>`)}<span className="fmthint">**bold** · _italic_ · - list</span></div>`);
    const last = [...c.msgs].reverse().find((x) => x.text && (x.from && x.from !== A.ME && A.USERS[x.from] || x.channel === 'sms' && x.dir === 'in'));
    if (!api.v && api.mode === 'message' && last && c.msgs[c.msgs.length - 1] === last && !S.rec) out.push(html`<div className="suggest" key="sg"><${A.Spark} s="10" />${SUGGEST(last, api.sms || last.channel === 'sms').map((s) => html`<button onClick=${() => { if (last.channel === 'sms' && !api.sms) api.setSms(true); api.put(s); setTimeout(() => api.ta.current && api.ta.current.focus(), 0); }}>${s}</button>`)}</div>`);
    return out.length ? html`<div className="cmpabove">${out}</div>` : null;
  };
  function RecTimer() { const [s, setS] = useState(0); useEffect(() => { const i = setInterval(() => setS((x) => x + 1), 1000); return () => clearInterval(i); }, []); return html`<span className="rectime">0:${String(s).padStart(2, '0')}</span>`; }
  A.stopVoice = (c) => {
    const dur = Math.max(4, Math.round((now() - A.S.rec.at) / 1000)); A.set({ rec: null });
    A.send(c.id, '', { files: [{ name: 'Voice note', type: 'M4A', size: '0:' + dur, voice: true, dur }] });
    const m = c.msgs[c.msgs.length - 1]; A.set(() => { m.transcribing = true; });
    setTimeout(() => A.set(() => { m.transcribing = false; m.transcript = c.rec === 'RO 48213' ? 'Stator is out. The connector on the harness is melted too, so we need a new harness, about an hour and a half extra labor.' : 'Quick update: I checked it, it\'s good to go. I\'ll leave the paperwork on your desk.'; }), 1800);
  };
  A.CompTools = function CompTools({ c, api }) {
    const S = A.S, cu = A.custOf(c);
    if (api.mode !== 'message') return null;
    return html`${cu ? html`<button className=${'cmpto' + (api.sms ? ' on' : '')} title=${api.sms ? 'Switch back to the team chat' : 'Text ' + cu.name + ' by SMS'} onClick=${() => api.setSms(!api.sms)}><${I} n="phone" s="12" />${api.sms ? 'SMS' : 'Text customer'}</button>` : null}
      <button className="cmpic" title="Take or attach a photo" aria-label="Photo" onClick=${() => api.setFiles([...api.files, { name: 'IMG_' + (4417 + api.files.length) + '.jpg', size: '2.4 MB', type: 'JPG', photo: true, hue: 18 + api.files.length * 40 }])}><${I} n="camera" /></button>
      <button className=${'cmpic' + (S.rec ? ' rec' : '')} title="Record a voice note" aria-label="Voice note" onClick=${() => A.set({ rec: { conv: c.id, at: now() } })}><${I} n="mic" /></button>
      <span className="cmpx"><button className=${'cmpic' + (S.fmt === c.id ? ' on' : '')} title="Formatting" aria-label="Formatting" style=${{ fontWeight: 700, fontSize: 13 }} onClick=${() => A.set({ fmt: S.fmt === c.id ? null : c.id })}>Aa</button>
      <button className="cmpic" title="Create a poll" aria-label="Poll" onClick=${() => A.set({ modal: { type: 'v3-poll', c } })}><${I} n="grid" /></button>
      <button className=${'cmpic' + (S.sendLater && S.sendLater.conv === c.id ? ' on' : '')} title="Send later" aria-label="Send later" onClick=${(e) => A.popAt('x3-later', e, { c }, 0)}><${I} n="clock" /></button></span>
      <button className="cmpic cmpmore" title="More tools" aria-label="More tools: formatting, poll, send later" onClick=${(e) => A.popAt('x3-tools', e, { c }, 0)}><${I} n="more" /></button>`;
  };

  // ---------- send later, undo send ----------
  A.S.scheduled = [];
  A.scheduleSend = (c, text, at) => { A.set((s) => { s.scheduled.push({ id: A.nextId(), conv: c.id, text, at }); }); A.snack('Scheduled for ' + A.dueLabel({ due: at }) + '.'); };
  A.ConvBanners = function ConvBanners({ c }) {
    const list = A.S.scheduled.filter((x) => x.conv === c.id); if (!list.length) return null;
    return html`<div className="schedbar">${list.map((x) => html`<div className="schedrow"><${I} n="clock" s="12" /><span className="grow" style=${{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><b>Scheduled · ${A.dueLabel({ due: x.at })}</b> ${x.text}</span>
      <button className="link" onClick=${() => { A.set((s) => { s.scheduled = s.scheduled.filter((y) => y !== x); }); A.send(c.id, x.text); }}>Send now</button><button className="link" onClick=${() => A.set((s) => { s.scheduled = s.scheduled.filter((y) => y !== x); })}>Cancel</button></div>`)}</div>`;
  };
  const send0 = A.send;
  A.send = (convId, text, opts) => {
    send0(convId, text, opts);
    if (A.S.net !== 'online') return;
    const c = A.conv(convId), m = c && c.msgs[c.msgs.length - 1];
    if (m && m.from === A.ME && !(opts && opts.files && opts.files.some((f) => f.voice))) A.snack('Message sent', () => A.set(() => { const i = c.msgs.indexOf(m); if (i >= 0) c.msgs.splice(i, 1); A.drafts[convId] = m.text; A.snack('Unsent. Your text is back in the message box.'); }));
  };

  // ---------- pins, saved, menus ----------
  A.togglePin = (m) => A.set(() => { m.pinned = !m.pinned; });
  A.toggleSave = (m) => A.set((s) => { s.saved = s.saved.includes(m.id) ? s.saved.filter((x) => x !== m.id) : [m.id, ...s.saved]; });
  A.MsgMenuItems = (Item, m, c) => html`
    <${Item} icon="pin" label=${m.pinned ? 'Unpin' : 'Pin to this conversation'} onClick=${() => A.togglePin(m)} />
    <${Item} icon="saved" label=${A.S.saved.includes(m.id) ? 'Remove from saved' : 'Save for later'} onClick=${() => { A.toggleSave(m); A.snack(A.S.saved.includes(m.id) ? 'Saved. Find it under ⚙ › Saved messages.' : 'Removed from saved.'); }} />
    ${m.text ? html`<${Item} icon="chat" label="Translate" onClick=${() => A.translate(m)} />` : null}`;
  A.ConvHeadExtras = function ConvHeadExtras({ c }) {
    const pins = c.msgs.filter((m) => m.pinned); if (!pins.length) return null;
    return html`<button className="workbtn" title="Pinned messages" onClick=${(e) => A.popAt('x3-pins', e, { c }, -220)}><${I} n="pin" s="12" />${pins.length}</button>`;
  };
  const XPop0 = A.XPop;
  A.XPop = function XPop() {
    const p = A.S.pop;
    if (p.type === 'x3-later') {
      const d = (days, h) => { const x = new Date(); x.setDate(x.getDate() + days); x.setHours(h, 0, 0, 0); return x.getTime(); };
      const mon = () => { const x = new Date(); x.setDate(x.getDate() + ((8 - x.getDay()) % 7 || 7)); x.setHours(8, 0, 0, 0); return x.getTime(); };
      const opts = [['In 1 hour', now() + 3600000], ['Tomorrow 8:00 AM', d(1, 8)], ['Monday 8:00 AM', mon()]];
      return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x), top: Math.max(8, p.y - 170), width: 240 }} onClick=${(e) => e.stopPropagation()}><div className="ph">Send later</div>
        ${opts.map(([l, at]) => html`<div className="pi" role="menuitem" tabIndex="0" onClick=${() => { A.set({ pop: null, sendLater: { conv: p.c.id, at, label: l } }); }}><${I} n="clock" /><span>${l}</span></div>`)}</div>`;
    }
    if (p.type === 'x3-tools') return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x - 120), top: Math.max(8, p.y - 150), width: 220 }} onClick=${(e) => e.stopPropagation()}>
      ${[['edit', 'Formatting', () => A.set({ pop: null, fmt: p.c.id })], ['grid', 'Create a poll', () => A.set({ pop: null, modal: { type: 'v3-poll', c: p.c } })], ['clock', 'Send later…', () => A.set((s) => { s.pop = Object.assign({}, p, { type: 'x3-later' }); })]].map(([ic, l, go]) => html`<div className="pi" role="menuitem" tabIndex="0" onClick=${go} onKeyDown=${(e) => e.key === 'Enter' && go()}><${I} n=${ic} /><span>${l}</span></div>`)}</div>`;
    if (p.type === 'x3-pins') return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x), top: p.y, width: 320 }} onClick=${(e) => e.stopPropagation()}><div className="ph">Pinned in ${A.convName(p.c)}</div>
      ${p.c.msgs.filter((m) => m.pinned).map((m) => html`<div className="pi" role="menuitem" tabIndex="0" onClick=${() => A.set({ pop: null, highlight: m.id })}><${I} n="pin" /><span style=${{ flex: 1, minWidth: 0, whiteSpace: 'normal' }}><b style=${{ fontWeight: 600 }}>${m.from && A.USERS[m.from] ? A.USERS[m.from].name.split(' ')[0] : 'ASPEN'}:</b> ${(m.text || '').slice(0, 80)}</span></div>`)}</div>`;
    return html`<${XPop0} />`;
  };

  // ---------- poll dialog, saved view ----------
  const Modal0 = A.Modal;
  A.Modal = function Modal() {
    const md = A.S.modal;
    if (md.type === 'v3-poll') return html`<${PollDlg} c=${md.c} />`;
    return html`<${Modal0} />`;
  };
  function PollDlg({ c }) {
    const [q, setQ] = useState('Who can cover Saturday 8 to noon?'); const [opts, setOpts] = useState(['I can', "Can't this week", 'Only until 10']);
    const post = () => { A.send(c.id, '', {}); A.set((s) => { const m = c.msgs[c.msgs.length - 1]; m.poll = { q, opts: opts.filter((x) => x.trim()).map((t) => ({ t, votes: [] })) }; s.modal = null; });
      setTimeout(() => A.set(() => { const m = [...c.msgs].reverse().find((x) => x.poll); if (m) { m.poll.opts[0].votes.push('u2'); if (m.poll.opts[1]) m.poll.opts[1].votes.push('u3'); m.poll.opts[0].votes.push('u9'); } }), 3000); };
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg" role="dialog" aria-label="Create a poll">
      <div className="dh"><b>Create a poll</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div><div className="db">
      <div className="fld"><label htmlFor="pq">Question</label><input id="pq" value=${q} onChange=${(e) => setQ(e.target.value)} /></div>
      ${opts.map((o, i) => html`<div className="fld"><label htmlFor=${'po' + i}>Option ${i + 1}</label><input id=${'po' + i} value=${o} onChange=${(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} /></div>`)}
      ${opts.length < 5 ? html`<button className="link" onClick=${() => setOpts([...opts, ''])}>+ Add option</button>` : null}</div>
      <div className="df"><button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!q.trim() || opts.filter((x) => x.trim()).length < 2} onClick=${post}>Post poll</button></div></div></div>`;
  }
  A.SavedView = function SavedView() {
    const S = A.S, items = S.saved.map((id) => A.findMsg(id)).filter(Boolean);
    return html`<div className="main"><div className="page"><h1>Saved messages</h1><p className="sub">Messages you saved for later. They stay here until you remove them.</p>
      ${!items.length ? html`<div className="emptyv"><${I} n="saved" s="24" /><b>Nothing saved yet</b>Use ⋯ on any message, then Save for later.</div>` : items.map(({ c, m }) => html`<div className="savedrow" onClick=${() => A.openConv(c.id, m.id)}>${A.USERS[m.from] ? html`<${A.Av} u=${m.from} size="24" pres=${false} />` : null}<div style=${{ flex: 1, minWidth: 0 }}><b>${A.USERS[m.from] ? A.USERS[m.from].name : 'ASPEN'}</b> <small>in ${A.convName(c)} · ${A.fmtList(m.t)}</small><div>${(m.text || '').slice(0, 160)}</div></div><button className="btn sm ghost" onClick=${(e) => { e.stopPropagation(); A.toggleSave(m); }}>Remove</button></div>`)}</div></div>`;
  };
  A.ExtraViews = Object.assign(A.ExtraViews || {}, { saved: A.SavedView });
  A.set({});
})();
