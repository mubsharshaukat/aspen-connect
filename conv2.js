// Simple conversation view: chat bubbles, ASPEN link chips, a plain composer, details panel, ASPEN System feed.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef, useLayoutEffect } = React;
  const cwBox = () => (document.querySelector('.cwin') || document.body).getBoundingClientRect();
  A.popAt = (type, e, extra, dx) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(), b = cwBox(); A.set({ pop: Object.assign({ type, x: Math.max(8, r.left - b.left + (dx || 0)), y: r.bottom - b.top + 2 }, extra || {}) }); };

  // ---------- avatars for any conversation ----------
  A.Av2 = function Av2({ c, size }) {
    const sz = size || 32;
    if (c.kind === 'dm') return html`<${A.Av} u=${c.with} size=${size} />`;
    if (c.kind === 'system') return html`<${A.GroupPic} c=${{ id: 'sys' }} size=${size} />`;
    if (c.kind === 'record') { const r = A.RECORDS[c.rec]; return html`<span className="recband" style=${{ background: A.RECKIND[r.kind].color, width: sz, height: sz }}>${r.kind}</span>`; }
    const gp = A.GroupPic({ c, size }); if (gp) return gp;
    const ini = c.kind === 'team' ? c.name.split(' ').map((w) => w[0]).join('').slice(0, 2) : c.members.filter((m) => m !== A.ME).slice(0, 2).map((m) => A.USERS[m].ini[0]).join('');
    return html`<span className="av sq" style=${{ width: sz, height: sz, background: c.kind === 'team' ? '#4a6274' : '#5c6bc0', fontSize: 11 }}>${ini}</span>`;
  };
  A.convSub = (c) => {
    if (c.kind === 'dm') { const u = A.USERS[c.with]; return u.title + ' · ' + A.presLabel(u.pres) + (u.note ? ' · ' + u.note : ''); }
    if (c.kind === 'team') return 'ASPEN team · ' + c.members.length + ' members';
    if (c.kind === 'system') return 'Reports, tasks, approvals and alerts from ASPEN';
    if (c.kind === 'record') return A.RECKIND[A.RECORDS[c.rec].kind].label + ' · ' + c.members.length + ' people';
    return c.members.length + ' people';
  };

  // ---------- ASPEN link chip (the old <aspenlink>) ----------
  A.openLink = (k) => {
    const r = A.RECORDS[k]; if (!r) return;
    if (k === 'RO 48213') A.set({ aspenView: 'ro' });
    A.snack(r.kind === 'RPT' ? 'Opening ' + r.title + ' in the report viewer…' : 'Opening ' + A.RECKIND[r.kind].label + ' ' + r.id + ' in ASPEN…');
  };
  A.LinkChip = function LinkChip({ k, onRemove }) {
    const r = A.RECORDS[k]; if (!r) return null; const kk = A.RECKIND[r.kind];
    return html`<span className="rchip" title=${'Open ' + kk.label + ' in ASPEN'} onClick=${() => !onRemove && A.openLink(k)}><span className="k" style=${{ background: kk.color }}>${r.kind}</span><span className="rct">${r.kind === 'RPT' ? r.title : k.replace(/^\w+ /, kk.label + ' ') + ' · ' + r.title}</span>
      ${onRemove ? html`<button aria-label=${'Remove ' + k} onClick=${(e) => { e.stopPropagation(); onRemove(); }}><${I} n="close" s="12" /></button>` : null}</span>`;
  };

  // ---------- conversation ----------
  A.Conv2 = function Conv2({ c, docked }) {
    const S = A.S;
    const live = S.call && S.call.conv === c.id;
    return html`<div className="main">
      <div className="mh"><span style=${{ cursor: c.kind === 'dm' ? 'pointer' : 'default' }} onClick=${(e) => c.kind === 'dm' && A.openProfile(c.with, e)}><${A.Av2} c=${c} /></span>
        <div className="tt"><b>${A.convName(c)}${c.muted ? html`<${I} n="belloff" s="12" />` : null}</b><small>${A.convSub(c)}</small></div><span className="grow"></span>
        <span className="acts" style=${{ display: 'flex', gap: 2 }}>
        ${c.kind !== 'system' && !docked ? html`<button className="ib" title="Voice call" onClick=${() => A.startCall(c.id, false, c.kind === 'team')}><${I} n="phone" /></button><button className="ib" title="Video call" onClick=${() => A.startCall(c.id, true)}><${I} n="video" /></button>` : null}
        <button className=${'ib' + (S.panel ? ' on' : '')} title="Details" onClick=${() => A.set({ panel: S.panel ? null : { type: 'details' } })}><${I} n="info" /></button>
        <button className="ib" title="More" onClick=${(e) => A.popAt('s-conv', e, { c }, -190)}><${I} n="more" /></button></span></div>
      ${live && S.call.mini ? null : c.huddle && !live ? html`<div className="banner call"><${I} n="phone" /><b>Team call in progress</b><span className="grow"></span><button className="btn sm pri" onClick=${() => A.startCall(c.id, false, true)}>Join</button></div>` : null}
      ${S.pendingLinks.length && c.kind !== 'system' ? html`<div className="hint"><${I} n="attach" />${S.pendingLinks.length} ASPEN ${S.pendingLinks.length === 1 ? 'link is' : 'links are'} attached below. Send here, or pick someone else on the left.</div>` : null}
      ${c.kind === 'system' ? html`<${SysFeed} c=${c} />` : html`<${Bubbles} c=${c} />`}
      <div className="typing" style=${{ padding: '0 20px' }} aria-live="polite">${S.typing[c.id] ? A.USERS[S.typing[c.id]].name.split(' ')[0] + ' is typing…' : ''}</div>
      ${c.kind === 'system' ? html`<div className="readonly"><${I} n="info" />These messages come from ASPEN. You can't reply here, but you can act on them.</div>`
        : !S.perms.send ? html`<div className="readonly"><${I} n="lock" />You can read messages but can't send them. Ask your ASPEN administrator for the Send Message permission.</div>`
        : html`<${A.Comp2} key=${c.id} c=${c} />`}
    </div>`;
  };

  function Bubbles({ c }) {
    const S = A.S, ref = useRef();
    useLayoutEffect(() => { const el = ref.current; if (!el) return; const t = S.highlight && el.querySelector('[data-id="' + S.highlight + '"]'); if (t) t.scrollIntoView({ block: 'center' }); else el.scrollTop = el.scrollHeight; }, [c.id, c.msgs.length, S.highlight]);
    useEffect(() => { if (S.highlight) { const t = setTimeout(() => A.set({ highlight: null }), 2600); return () => clearTimeout(t); } }, [S.highlight]);
    const msgs = c.msgs.filter((m) => !m.hiddenForMe);
    if (!msgs.length) return html`<div className="bwrap" ref=${ref}><div className="empty"><div><${A.Av2} c=${c} size="48" /><b>${A.convName(c)}</b>Say hello. Messages you send here are only seen by the people in this conversation.</div></div></div>`;
    const out = []; let prev = null;
    const lastMine = [...msgs].reverse().find((m) => m.from === A.ME);
    msgs.forEach((m) => {
      if (!prev || A.dayKey(prev.t) !== A.dayKey(m.t)) out.push(html`<div className="day" key=${'d' + m.id}>${A.fmtDay(m.t)}</div>`);
      if (m.kind === 'sys') out.push(html`<div key=${m.id} style=${{ textAlign: 'center', color: 'var(--fg2)', fontSize: 12, margin: '6px 0' }}>${m.text} · ${A.fmtTime(m.t)}</div>`);
      else out.push(html`<${Bubble} key=${m.id} m=${m} c=${c} showName=${c.kind !== 'dm' && m.from !== A.ME && (!prev || prev.from !== m.from || prev.kind)} last=${m === lastMine} />`);
      prev = m;
    });
    return html`<div className="bwrap" ref=${ref}>${out}</div>`;
  }

  function Bubble({ m, c, showName, last }) {
    const S = A.S, mine = m.from === A.ME, u = A.USERS[m.from];
    const recs = [...(m.links || []), ...A.recordsIn(m.text).filter((k) => k !== c.rec && !(m.links || []).includes(k))];
    if (m.card && m.card.type === 'task') { const t = m.card.task;
      return html`<div className=${'brow' + (mine ? ' mine' : '')} data-id=${m.id}><div className="bcol"><div className="sysnote" style=${{ margin: 0 }}><div style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><${I} n="task" style=${{ color: 'var(--accent)' }} /><b style=${{ flex: 1 }}>${t.title}</b><span className=${'pill ' + (t.status === 'Done' ? 'g' : 'a')}>${t.status}</span></div>
        <div style=${{ color: 'var(--fg2)', fontSize: 12, margin: '4px 0 6px' }}>Task for ${A.USERS[t.owner] ? A.USERS[t.owner].name : t.owner} · due ${t.due}${t.rec ? ' · ' + t.rec : ''}</div>
        ${t.status !== 'Done' ? html`<button className="btn sm" onClick=${() => A.set(() => { t.status = 'Done'; })}><${I} n="check" s="12" />Mark done</button>` : null}</div><div className="bmeta">${A.fmtTime(m.t)}</div></div></div>`; }
    if (!u) { const d = m.card || {}; // ASPEN bot posts (backorders etc.) show as a system note
      return html`<div className="sysnote" data-id=${m.id}><div style=${{ display: 'flex', gap: 8 }}><${I} n="info" style=${{ color: 'var(--parts)' }} /><div style=${{ flex: 1 }}><b>${d.title || m.text}</b>${(d.lines || []).map((l) => html`<div>${l}</div>`)}
        ${d.actions ? html`<div style=${{ display: 'flex', gap: 6, marginTop: 6 }}>${d.done ? html`<span className="pill g">${d.done}</span>` : d.actions.map((a) => html`<button className="btn sm" onClick=${() => A.set(() => { d.done = a === 'Notify customer' ? 'Customer notified by text · ' + A.fmtTime(Date.now()) : 'No substitute found'; })}>${a}</button>`)}</div>` : null}</div><small style=${{ color: 'var(--fg3)' }}>${A.fmtTime(m.t)}</small></div></div>`; }
    return html`<div className=${'brow' + (mine ? ' mine' : '')} data-id=${m.id}>
      ${!mine && c.kind !== 'dm' ? (showName ? html`<${A.Av} u=${m.from} size="24" pres=${false} onClick=${(e) => A.openProfile(m.from, e)} />` : html`<span className="sp"></span>`) : null}
      <div className="bcol">
        ${showName ? html`<div className="bname">${u.name}</div>` : null}
        ${m.broadcast ? html`<div className="bctag"><${I} n="megaphone" s="12" />Broadcast sent to ${m.broadcast}</div>` : null}
        <div className=${'bub' + (S.highlight === m.id ? ' flash' : '')}>
          ${m.quote ? html`<div className="quote" style=${{ margin: '0 0 5px', background: 'rgba(255,255,255,.6)' }}><span><b>${A.USERS[m.quote.from].name.split(' ')[0]}</b>: ${m.quote.text}</span></div>` : null}
          ${m.deleted ? html`<i style=${{ color: 'var(--fg3)' }}>This message was deleted.</i>` : html`${A.rich(m.text, S.searchHl)}${m.edited ? html` <span style=${{ color: 'var(--fg3)', fontSize: 11 }}>(edited)</span>` : null}`}
          ${!m.deleted && (m.links || []).length ? html`<div className="acards">${m.links.map((k) => html`<${A.AspenCard} key=${k} k=${k} />`)}</div>` : null}${!m.deleted && recs.some((k) => !(m.links || []).includes(k)) ? html`<div className="chips">${recs.filter((k) => !(m.links || []).includes(k)).map((k) => html`<${A.LinkChip} k=${k} />`)}</div>` : null}
          ${!m.deleted && m.file ? html`<${A.FileChip} f=${m.file} />` : null}${!m.deleted && m.files ? m.files.map((f) => html`<${A.FileChip} f=${f} />`) : null}
        </div>
        ${Object.keys(m.reactions).length ? html`<div className="reacts">${Object.entries(m.reactions).map(([e, us]) => html`<button className=${us.includes(A.ME) ? 'me' : ''} title=${us.map((x) => A.USERS[x].name).join(', ')} onClick=${() => A.react(m.id, e)}>${e} ${us.length}</button>`)}</div>` : null}
        <div className="bmeta">${A.fmtTime(m.t)}${mine && last ? html` · ${m.state === 'sending' ? 'Sending…' : m.state === 'sent' ? 'Sent' : 'Seen'}` : ''}</div>
      </div>
      ${!m.deleted ? html`<div className="bact"><button title="Reply" onClick=${() => A.set({ replyTo: { conv: c.id, m } })}><${I} n="reply" /></button><button title="Like" onClick=${() => A.react(m.id, '👍')}>👍</button><button title="More" onClick=${(e) => A.popAt('s-msg', e, { m, c }, -150)}><${I} n="more" /></button></div>` : null}
    </div>`;
  }

  A.SysFeed = SysFeed;
  function SysFeed({ c }) {
    const ref = useRef();
    useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [c.msgs.length]);
    let prev = null;
    return html`<div className="bwrap" ref=${ref} style=${{ background: 'var(--chrome2)' }}>${c.msgs.map((m) => {
      const day = !prev || A.dayKey(prev.t) !== A.dayKey(m.t) ? html`<div className="day">${A.fmtDay(m.t)}</div>` : null; prev = m;
      if (m.kind === 'alert') { const a = A.ALERTS.find((x) => x.id === m.alert); return html`${day}<div key=${m.id}><${A.AlertCard} a=${a} /></div>`; }
      return html`${day}<div className="sysnote" key=${m.id}><div style=${{ display: 'flex', gap: 8 }}><${I} n="info" style=${{ color: 'var(--accent)' }} /><div style=${{ flex: 1 }}>${m.text}${m.links ? html`<div className="chips">${m.links.map((k) => html`<${A.LinkChip} k=${k} />`)}</div>` : null}</div><small style=${{ color: 'var(--fg3)' }}>${A.fmtTime(m.t)}</small></div></div>`;
    })}</div>`;
  }

  // ---------- composer ----------
  const SSN = /\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]?){15,16}\b/;
  A.Comp2 = function Comp2({ c }) {
    const S = A.S;
    const [v, setV] = useState(A.drafts[c.id] || ''); const [files, setFiles] = useState([]); const [dlp, setDlp] = useState(false); const [at, setAt] = useState(null);
    const ta = useRef();
    const reply = S.replyTo && S.replyTo.conv === c.id ? S.replyTo.m : null;
    useEffect(() => { if (ta.current) ta.current.focus(); }, [c.id, reply]);
    const put = (x) => { setV(x); A.drafts[c.id] = x; };
    const send = (force) => {
      const text = v.trim(), links = S.pendingLinks.slice();
      if (!text && !files.length && !links.length) return;
      if (!force && SSN.test(text)) { setDlp(true); return; }
      A.send(c.id, text, { files: files.length ? files : undefined, quote: reply ? { from: reply.from, text: reply.text } : undefined });
      A.set((s) => { const last = c.msgs[c.msgs.length - 1]; if (links.length) last.links = links; s.pendingLinks = []; s.replyTo = null; });
      put(''); setFiles([]); setDlp(false); setAt(null); delete A.drafts[c.id];
    };
    const key = (e) => {
      if (at && atOpts.length && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); pick(atOpts[0]); return; }
      if ((e.key === 'Enter' && !e.shiftKey && S.settings.enterSends) || (e.ctrlKey && (e.key === 's' || e.key === 'S'))) { e.preventDefault(); send(); }
    };
    const change = (e) => { put(e.target.value); const mm = e.target.value.slice(0, e.target.selectionStart).match(/(^|\s)@(\w*)$/); setAt(mm ? mm[2].toLowerCase() : null); };
    const atOpts = at === null ? [] : Object.keys(A.USERS).filter((u) => u !== A.ME && A.USERS[u].name.toLowerCase().includes(at)).slice(0, 6);
    const pick = (u) => { const el = ta.current, pos = el.selectionStart; const before = v.slice(0, pos).replace(/@\w*$/, ''); put(before + '@' + A.USERS[u].name + ' ' + v.slice(pos)); setAt(null); setTimeout(() => el.focus(), 0); };
    const mask = () => v.replace(/\b\d{3}-\d{2}-(\d{4})\b/g, '***-**-$1').replace(/\b(?:\d[ -]?){11,12}(\d{4})\b/g, '**** **** **** $1');
    A._addFile = () => { const pool = [{ name: 'IMG_4417-stator.jpg', size: '2.1 MB', type: 'JPG' }, { name: 'warranty-claim-48213.pdf', size: '96 KB', type: 'PDF' }, { name: 'october-backorders.xlsx', size: '48 KB', type: 'XLSX' }]; setFiles((f) => [...f, pool[f.length % 3]]); };
    const n = v.length;
    return html`<div className="comp2">
      ${dlp ? html`<div className="dlp" style=${{ borderRadius: 4, marginBottom: 6 }}><${I} n="shield" /><div style=${{ flex: 1 }}><b>This looks like a Social Security or card number.</b> Everyone in this conversation will see it.
        <div style=${{ display: 'flex', gap: 6, marginTop: 6 }}><button className="btn sm pri" onClick=${() => { const mv = mask(); A.send(c.id, mv.trim()); put(''); setDlp(false); delete A.drafts[c.id]; }}>Hide the number and send</button><button className="btn sm" onClick=${() => send(true)}>Send anyway</button><button className="btn sm ghost" onClick=${() => setDlp(false)}>Edit</button></div></div></div>` : null}
      ${reply ? html`<div className="quote" style=${{ margin: '0 0 6px' }}><${I} n="reply" s="12" /><span style=${{ flex: 1 }}>Replying to <b>${A.USERS[reply.from].name.split(' ')[0]}</b>: ${reply.text}</span><button aria-label="Cancel reply" onClick=${() => A.set({ replyTo: null })}><${I} n="close" s="12" /></button></div>` : null}
      <div className="box">
        ${S.pendingLinks.length || files.length ? html`<div className="att">${S.pendingLinks.map((k) => html`<${A.LinkChip} k=${k} onRemove=${() => A.set((s) => { s.pendingLinks = s.pendingLinks.filter((x) => x !== k); })} />`)}
          ${files.map((f, i) => html`<span className="rchip"><span className="k" style=${{ background: 'var(--fg3)' }}>${f.type}</span>${f.name}<button aria-label="Remove file" onClick=${() => setFiles(files.filter((_, j) => j !== i))}><${I} n="close" s="12" /></button></span>`)}
          <button className="link" style=${{ fontSize: 12, marginLeft: 4 }} onClick=${() => { setFiles([]); A.set({ pendingLinks: [] }); }}>Clear attachments</button></div>` : null}
        <textarea id=${'c2-' + c.id} ref=${ta} value=${v} onChange=${change} onKeyDown=${key} maxLength="4000" placeholder=${'Message ' + A.convName(c)}></textarea>
      </div>
      ${atOpts.length ? html`<div className="pop" style=${{ bottom: '100%', left: 16, marginBottom: -4, width: 300 }}>${atOpts.map((u, i) => html`<div className=${'pi' + (i === 0 ? ' on' : '')} onMouseDown=${(e) => { e.preventDefault(); pick(u); }}><${A.Av} u=${u} size="24" /><span style=${{ flex: 1 }}>${A.USERS[u].name}</span><small>${A.USERS[u].title}</small></div>`)}</div>` : null}
      <div className="row2">
        <button className="btn sm ghost" onClick=${(e) => A.popAt('s-attach', e, {}, 0)}><${I} n="attach" />Attach</button>
        <button className="ib" title="Emoji" onClick=${(e) => { e.stopPropagation(); const b = cwBox(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'emoji', insert: (x) => put(v + x), x: r.left - b.left, y: r.top - b.top - 150 } }); }}><${I} n="emoji" /></button>
        <button className="ib" title="Mention someone" onClick=${() => { put(v + (v && !v.endsWith(' ') ? ' @' : '@')); setAt(''); ta.current.focus(); }}><${I} n="mention" /></button>
        <span className="grow"></span>
        <small style=${{ color: n > 3800 ? 'var(--red)' : 'var(--fg3)' }}>${n > 3500 ? n + ' / 4000 · ' : ''}Enter to send · Shift+Enter for a new line</small>
        <button className="btn pri" onClick=${() => send()} disabled=${!v.trim() && !files.length && !S.pendingLinks.length}><${I} n="send" />Send</button>
      </div></div>`;
  };

  // ---------- details panel ----------
  A.Details2 = function Details2({ c }) {
    const S = A.S, files = [];
    c.msgs.forEach((m) => { if (m.file) files.push(m.file); (m.files || []).forEach((f) => files.push(f)); });
    const team = c.kind === 'team' ? A.TEAMS.find((t) => t.id === c.id) : null;
    const rec = c.kind === 'record' ? A.RECORDS[c.rec] : null;
    return html`<div className="panel"><div className="phd"><b>Details</b><button className="ib" aria-label="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div><div className="pbd">
      ${c.kind === 'dm' ? html`<div style=${{ textAlign: 'center' }}><div style=${{ display: 'inline-block' }}><${A.Av} u=${c.with} size="72" /></div><div style=${{ fontWeight: 600, fontSize: 15, marginTop: 6 }}>${A.USERS[c.with].name}</div><div style=${{ color: 'var(--fg2)' }}>${A.USERS[c.with].title} · Ext. ${A.USERS[c.with].ext}</div><div style=${{ fontSize: 12 }}>${A.USERS[c.with].clock}</div></div>` : null}
      ${rec ? html`<div style=${{ display: 'flex', gap: 10, alignItems: 'center' }}><${A.Av2} c=${c} size="40" /><div><b>${c.rec}</b><div style=${{ color: 'var(--fg2)' }}>${rec.title}</div></div></div><div style=${{ margin: '8px 0' }}><span className=${'pill ' + rec.tone}>${rec.status}</span></div><div className="kv">${rec.fields.map(([a, b]) => html`<span>${a}</span><span>${b}</span>`)}</div><button className="btn pri" style=${{ width: '100%', marginTop: 10 }} onClick=${() => A.openLink(c.rec)}><${I} n="ext" s="12" />Open in ASPEN</button>` : null}
      ${team ? html`<p style=${{ color: 'var(--fg2)', fontSize: 12, marginTop: 0 }}>Members come from the ASPEN team "${team.name}". Change them in ASPEN under Workflow › Teams.</p>` : null}
      ${c.kind !== 'dm' && c.kind !== 'system' ? html`<div className="sect">People (${c.members.length})</div>${c.members.map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0', cursor: 'pointer' }} onClick=${(e) => A.openProfile(u, e)}><${A.Av} u=${u} size="24" /><span style=${{ flex: 1 }}>${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</span><small style=${{ color: 'var(--fg2)' }}>${A.USERS[u].title}</small></div>`)}${c.kind === 'group' || c.kind === 'record' ? html`<button className="btn sm" onClick=${() => A.set({ modal: { type: 'add', c } })}><${I} n="adduser" s="12" />Add people</button>` : null}` : null}
      <div className="sect">Files (${files.length})</div>${files.length ? files.map((f) => html`<${A.FileChip} f=${f} />`) : html`<div style=${{ color: 'var(--fg2)' }}>No files shared yet.</div>`}
      <div className="sect">Notifications</div>
      <label className="check"><button role="switch" aria-checked=${!c.muted} className=${'sw' + (!c.muted ? ' on' : '')} onClick=${() => A.set(() => { c.muted = !c.muted; })}></button>${c.muted ? 'Muted' : 'On'}</label>
      ${c.kind !== 'system' ? html`<div className="sect">Conversation</div><div style=${{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}><button className="btn sm" onClick=${() => A.printConv(c)}>Print conversation</button><button className="btn sm" style=${{ color: 'var(--red)' }} onClick=${() => A.clearHistory(c)}>Delete my history</button></div>` : null}
    </div></div>`;
  };
  A.printConv = (c) => A.snack('Print preview opened for ' + A.convName(c) + ' (' + c.msgs.length + ' messages)');
  A.clearHistory = (c) => A.set({ modal: { type: 'confirm', title: 'Delete your history with ' + A.convName(c) + '?', body: 'Messages are removed from your view only. Others keep their copy, and your administrator\'s retention rules still apply.', ok: 'Delete history', act: () => { A.set(() => { c.msgs.forEach((m) => { m.hiddenForMe = true; }); }); A.snack('History deleted from your view'); } } });
})();
