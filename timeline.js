// Conversation as a work timeline: one spine, four shapes. Message ●  Task ■  Approval ◆  Request ▲  Workflow ▬
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef, useLayoutEffect } = React;

  A.Shape = function Shape({ type, size, color }) {
    const t = A.TYPES[type], s = size || 12, c = color || t.color;
    const d = { circle: html`<circle cx="6" cy="6" r="4.5" />`, square: html`<rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />`, diamond: html`<path d="M6 .8 11.2 6 6 11.2.8 6Z" />`, triangle: html`<path d="M6 1 11.3 10.5H.7Z" />`, bar: html`<rect x="1" y="4.5" width="10" height="3" rx="1.5" />` }[t.shape];
    return html`<svg width=${s} height=${s} viewBox="0 0 12 12" style=${{ fill: c, flex: 'none' }} aria-label=${t.label}>${d}</svg>`;
  };
  A.Pill = ({ w }) => html`<span className=${'pill ' + A.statusTone(w)}>${A.statusText(w)}</span>`;
  A.openItem = (id) => A.set({ panel: { type: 'item', id } });

  A.WorkCard = function WorkCard({ w, act }) {
    const t = A.TYPES[w.type], S = A.S;
    const forMe = !A.isClosed(w) && ((w.type === 'approval' && w.approver === A.ME) || (w.type !== 'approval' && w.owner === A.ME));
    return html`<div className="wcard" style=${{ '--tc': t.color }} onClick=${() => A.openItem(w.id)}>
      <div className="wh"><${A.Shape} type=${w.type} size="13" /><span className="tlabel" style=${{ '--tc': t.color }}>${t.label}${act === 'created' ? ' created' : ''}</span><${A.WNo} w=${w} /><b>${w.title}</b>${w.aiMade ? html`<span className="aitag" title="Drafted with AI, confirmed by a person"><${A.Spark} s="10" />Assist</span>` : null}<${A.Pill} w=${w} /></div>
      <div className="wm"><span>${w.type === 'approval' ? 'Approver' : 'Owner'}: <b style=${{ color: 'var(--fg)', fontWeight: 600 }}>${A.uname(w.type === 'approval' ? w.approver : w.owner)}</b></span><span>Due: ${A.dueLabel(w)}</span>${w.amount ? html`<span>${w.amount}</span>` : null}${(w.recs || (w.rec ? [w.rec] : [])).length ? html`<span>${(w.recs || [w.rec]).join(', ')}</span>` : null}${w.checklist ? html`<span className="ckprog">☑ ${w.checklist.filter((x) => x.done).length}/${w.checklist.length}</span>` : null}${w.repeat ? html`<span>↻ ${w.repeat}</span>` : null}</div>
      ${forMe ? html`<div className="wa" onClick=${(e) => e.stopPropagation()}>${w.type === 'approval' ? html`<button className="btn sm pri" onClick=${() => A.decide(w, 'Approved')}><${I} n="check" s="12" />Approve</button><button className="btn sm" onClick=${() => A.openItem(w.id)}>Reject…</button>`
        : w.type === 'request' ? html`<button className="btn sm pri" onClick=${() => A.decide(w, 'Fulfilled')}>Mark fulfilled</button>`
        : html`${w.status === 'Open' ? html`<button className="btn sm" onClick=${() => A.setStatus(w, 'In progress')}>Start</button>` : null}<button className="btn sm pri" onClick=${() => A.setStatus(w, 'Done')}><${I} n="check" s="12" />Done</button>`}</div>` : null}
    </div>`;
  };

  // ---------- conversation ----------
  A.Conv3 = function Conv3({ c, docked }) {
    const S = A.S, work = A.workIn(c.id).filter((w) => !A.isClosed(w));
    return html`<div className=${"main" + (S.dragOver === c.id ? " dragging" : "")} onDragOver=${(e) => { e.preventDefault(); if (S.dragOver !== c.id) A.set({ dragOver: c.id }); }} onDragLeave=${(e) => { if (!e.currentTarget.contains(e.relatedTarget)) A.set({ dragOver: null }); }} onDrop=${(e) => { e.preventDefault(); A.set({ dragOver: null }); const fl = e.dataTransfer ? [...e.dataTransfer.files] : []; const n = fl.length || 1; if (fl.length && A._addRealFiles) A._addRealFiles(fl.map((x) => ({ name: x.name, size: Math.max(1, Math.round(x.size / 1024)) + ' KB', type: (x.name.split('.').pop() || 'file').slice(0, 4).toUpperCase() }))); else A._addFile && A._addFile(); A.snack(n + " file" + (n > 1 ? "s" : "") + " attached. Add a note and press Send."); }}>
      ${S.dragOver === c.id ? html`<div className="dropzone"><div><${I} n="attach" s="24" /><b>Drop to attach to ${A.convName(c)}</b><span>Files go in the message box. Nothing is sent until you press Send.</span></div></div>` : null}
      <div className="mh">${A.S.mobile ? html`<button className="ib mback" aria-label="Back to conversations" onClick=${() => A.set({ mView: 'list', panel: null })}><${I} n="back" /></button>` : null}<span style=${{ cursor: c.kind === 'dm' ? 'pointer' : 'default' }} onClick=${(e) => c.kind === 'dm' && A.openProfile(c.with, e)}><${A.Av2} c=${c} /></span>
        <div className="tt"><b>${A.convName(c)}</b><small>${A.convSub(c)}</small></div><span className="grow"></span>
        ${A.ConvHeadExtras ? html`<${A.ConvHeadExtras} c=${c} />` : null}
        ${work.length ? html`<button className=${"workbtn" + (S.workOpen === c.id ? " on" : "")} title="Open tasks, approvals and requests from this conversation" aria-expanded=${S.workOpen === c.id} onClick=${() => A.set({ workOpen: S.workOpen === c.id ? null : c.id })}>${[...new Set(work.map((w) => w.type))].map((ty) => html`<${A.Shape} type=${ty} size="10" />`)}${work.length} open<${I} n="down" s="12" /></button>` : null}
        ${c.kind !== 'system' && !docked && !A.S.mobile ? html`<button className="btn sm" title=${c.kind === 'team' ? 'Start a team call' : 'Voice call'} onClick=${() => A.startCall(c.id, false, c.kind === 'team')}><${I} n="phone" s="12" />Call</button>` : null}
        ${false ? html`<button className=${'btn sm aibtn' + (S.ai.busy['find' + c.id] ? ' busy' : '')} title="ASPEN Assist: summarize this conversation or find work in it" onClick=${(e) => A.popAt('x-assist', e, { c }, -150)}><${A.Spark} />${S.ai.busy['find' + c.id] ? 'Reading…' : 'Assist'}</button>` : null}
        <button className="ib" title="Details, print, mute and more" onClick=${(e) => A.popAt('s-conv', e, { c }, -190)}><${I} n="more" /></button></div>
      ${c.kind !== 'system' && work.length && S.workOpen === c.id ? html`<div className="wstrip"><span className="lbl">Open work</span>${work.map((w) => html`<button className=${'wchip' + (S.panel && S.panel.id === w.id ? ' on' : '')} onClick=${() => A.openItem(w.id)}><${A.Shape} type=${w.type} />${w.title.length > 34 ? w.title.slice(0, 32) + '…' : w.title}<${A.Pill} w=${w} /></button>`)}</div>` : null}
      ${c.kind !== 'system' && S.sugg && S.sugg[c.id] ? html`<${A.SuggestTray} c=${c} />` : null}
      ${A.ConvBanners ? html`<${A.ConvBanners} c=${c} />` : null}
      ${S.pendingLinks.length && c.kind !== 'system' ? html`<div className="hint"><${I} n="attach" />${S.pendingLinks.length} ASPEN ${S.pendingLinks.length === 1 ? 'link is' : 'links are'} attached below. Send here, or pick someone else.</div>` : null}
      ${c.kind === 'system' ? html`<${A.SysFeed} c=${c} />` : html`<${Timeline} c=${c} />`}
      <div className="typing" style=${{ padding: '0 20px 0 64px' }} aria-live="polite">${S.typing[c.id] ? A.USERS[S.typing[c.id]].name.split(' ')[0] + ' is typing…' : ''}</div>
      ${c.kind === 'system' ? html`<div className="readonly"><${I} n="info" />These come from ASPEN. You can't reply, but you can act on them.</div>`
        : !S.perms.send ? html`<div className="readonly"><${I} n="lock" />You can read messages but can't send them. Ask your ASPEN administrator for the Send Message permission.</div>`
        : html`<${A.Comp3} key=${c.id} c=${c} />`}
    </div>`;
  };

  function Timeline({ c }) {
    const S = A.S, ref = useRef(); const [away, setAway] = React.useState(0); const seenLen = useRef(c.msgs.length); const awayRef = useRef(false);
    useLayoutEffect(() => { const el = ref.current; if (!el) return; awayRef.current = false; setAway(0); seenLen.current = c.msgs.length;
      const t = S.highlight && el.querySelector('[data-id="' + S.highlight + '"]'); const nd = el.querySelector('.newdiv');
      const within = (x, off) => { el.scrollTop += x.getBoundingClientRect().top - el.getBoundingClientRect().top - off; }; if (t) within(t, el.clientHeight / 2 - 40); else if (nd) within(nd, 12); else el.scrollTop = el.scrollHeight; }, [c.id, S.highlight]);
    useLayoutEffect(() => { const el = ref.current; if (!el) return; const last = c.msgs[c.msgs.length - 1];
      if (!awayRef.current || (last && last.from === A.ME)) { el.scrollTop = el.scrollHeight; seenLen.current = c.msgs.length; setAway(0); } else setAway(c.msgs.length - seenLen.current); }, [c.msgs.length]);
    useEffect(() => { const el = ref.current; if (!el || !window.ResizeObserver) return; const ro = new ResizeObserver(() => { if (!awayRef.current) el.scrollTop = el.scrollHeight; }); ro.observe(el); return () => ro.disconnect(); }, [c.id]);
    const onScroll = (e) => { const el = e.currentTarget; const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60; awayRef.current = !atBottom; if (atBottom) { seenLen.current = c.msgs.length; if (away) setAway(0); } else if (!away) setAway(-1); };
    useEffect(() => { if (S.highlight) { const t = setTimeout(() => A.set({ highlight: null }), 2600); return () => clearTimeout(t); } }, [S.highlight]);
    const msgs = c.msgs.filter((m) => !m.hiddenForMe); let prev = null; const out = [];
    msgs.forEach((m) => {
      if (c.newFromId === m.id) out.push(html`<div className="newdiv" key="newdiv" role="separator" aria-label="New messages"><span>New</span></div>`);
      if (!prev || A.dayKey(prev.t) !== A.dayKey(m.t)) out.push(html`<div className="day" key=${'d' + m.id} style=${{ marginLeft: 64 }}>${A.fmtDay(m.t)}</div>`);
      out.push(html`<${Ev} key=${m.id} m=${m} c=${c} grouped=${prev && prev.from === m.from && !prev.kind && !m.kind && m.t - prev.t < 300000} />`);
      prev = m;
    });
    if (!msgs.length) out.push(html`<div className="ev"><div className="txt" style=${{ color: 'var(--fg2)' }}>No messages yet. Say hello, or create a task for ${A.convName(c)}.</div></div>`);
    return html`<div className="tlwrap"><div className="tl" ref=${ref} onScroll=${onScroll} aria-live="polite">${out}</div>
      ${away ? html`<button className="jump" onClick=${() => { const el = ref.current; el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }}>${away > 0 ? away + ' new message' + (away > 1 ? 's' : '') : 'Jump to latest'}<${I} n="down" s="12" /></button>` : null}</div>`;
  }

  function Ev({ m, c, grouped }) {
    const S = A.S;
    if (m.channel === 'sms' && A.SmsEv) return html`<${A.SmsEv} m=${m} c=${c} />`;
    if (m.kind === 'work') { const w = A.WORK.find((x) => x.id === m.work); if (!w) return null;
      if (m.act === 'created') return html`<div className="ev" data-id=${m.id}><span className="node"><${A.Shape} type=${w.type} size="14" /></span><div className="who"><b>${A.uname(w.requester === 'bot' ? 'bot' : w.history[0].who)}</b><small>${A.fmtTime(m.t)}</small></div><${A.WorkCard} w=${w} act="created" /></div>`;
      return html`<div className="ev flow" data-id=${m.id}><span className="node"><${A.Shape} type="status" /></span><div className="txt"><${A.Shape} type=${w.type} size="10" /> <b style=${{ color: 'var(--fg)' }}>${w.title}</b>: ${m.text} · ${A.fmtTime(m.t)}</div></div>`; }
    if (m.kind === 'sys') return html`<div className="ev flow" data-id=${m.id}><span className="node"><${A.Shape} type="status" /></span><div className="txt">${m.text} · ${A.fmtTime(m.t)}</div></div>`;
    const u = A.USERS[m.from];
    if (!u) { const d = m.card || {}; return html`<div className="ev flow" data-id=${m.id}><span className="node"><${A.Shape} type="status" /></span><div className="txt"><b style=${{ color: 'var(--fg)' }}>${d.title || ''}</b> ${(d.lines || []).join(' · ')} · ${A.fmtTime(m.t)}</div></div>`; }
    if (m.card && m.card.type === 'task') return null;
    const mine = m.from === A.ME;
    const recs = [...(m.links || []), ...A.recordsIn(m.text).filter((k) => k !== c.rec && !(m.links || []).includes(k))];
    return html`<div tabIndex="-1" className=${'ev' + (mine ? ' mine' : '')} data-id=${m.id} style=${grouped ? { paddingTop: 0 } : null}>
      ${!grouped ? html`<span className="node" style=${{ left: 32, top: 6, width: 24, height: 24 }}><${A.Av} u=${m.from} size="24" pres=${false} /></span>` : null}
      ${!grouped ? html`<div className="who"><b>${mine ? 'You' : u.name}</b><small>${A.fmtTime(m.t)}</small>${m.broadcast ? html`<small style=${{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><${I} n="megaphone" s="12" />Broadcast to ${m.broadcast}</small>` : null}</div>` : null}
      <div className=${'txt' + (S.highlight === m.id ? ' bub flash' : '')}>
        ${m.quote ? html`<div className="quote" style=${{ margin: '2px 0 4px' }}><span><b>${A.USERS[m.quote.from].name.split(' ')[0]}</b>: ${m.quote.text}</span></div>` : null}
        ${m.deleted ? html`<i style=${{ color: 'var(--fg3)' }}>This message was deleted.</i>` : html`${A.rich(m.text, S.searchHl)}${m.edited ? html` <span style=${{ color: 'var(--fg3)', fontSize: 11 }}>(edited)</span>` : null}`}</div>
      ${!m.deleted && (m.links || []).length ? html`<div className="acards">${m.links.map((k) => html`<${A.AspenCard} key=${k} k=${k} />`)}</div>` : null}${!m.deleted && recs.some((k) => !(m.links || []).includes(k)) ? html`<div className="chips">${recs.filter((k) => !(m.links || []).includes(k)).map((k) => html`<${A.LinkChip} k=${k} />`)}</div>` : null}
      ${!m.deleted && m.file ? html`<${A.FileChip} f=${m.file} />` : null}${!m.deleted && m.files ? m.files.map((f) => html`<${A.FileChip} f=${f} />`) : null}
      ${A.MsgExtras && !m.deleted ? html`<${A.MsgExtras} m=${m} c=${c} />` : null}
      ${Object.keys(m.reactions).length ? html`<div className="reacts">${Object.entries(m.reactions).map(([e, us]) => html`<button className=${us.includes(A.ME) ? 'me' : ''} title=${us.map((x) => A.USERS[x].name).join(', ')} onClick=${() => A.react(m.id, e)}>${e} ${us.length}</button>`)}</div>` : null}
      ${mine && m.state === 'sending' ? html`<div className="state">Sending…</div>` : mine && m.state === 'queued' ? html`<div className="state queued"><${I} n="clock" s="12" />Waiting for connection. It will send automatically.</div>` : null}
      ${A.looksLikeTask(m) && !(S.hintOff || {})[m.id] && c.kind !== 'system' ? html`<div className="aihint"><${A.Spark} />Looks like ${/approve|sign off|ok the/i.test(m.text) ? 'an approval' : 'a task'}
        <button className="link" onClick=${async () => { const p = await A.aiParse(m.text, { defaultOwner: /\b(you|mubshar)\b/i.test(m.text) || c.kind === 'dm' ? A.ME : undefined, rec: c.rec }); A.set({ draftWork: { conv: c.id, type: p.type, fields: p, m } }); }}>Create it</button>
        <button className="ib" style=${{ width: 24, height: 24 }} title="Not a task" onClick=${() => A.set((s) => { s.hintOff = Object.assign({}, s.hintOff, { [m.id]: true }); })}><${I} n="close" s="12" /></button></div>` : null}
      ${!m.deleted ? html`<div className="eact">
        <button onClick=${async () => { const p = await A.aiParse(m.text || '', { defaultOwner: c.kind === 'dm' && m.from === A.ME ? c.with : A.ME, rec: c.rec }); A.set({ draftWork: { conv: c.id, type: p.type, fields: p, m } }); }} title="Turn this message into a task, approval or request"><${A.Spark} s="11" />Make task</button>
        <button onClick=${() => A.set({ replyTo: { conv: c.id, m } })} title="Reply"><${I} n="reply" s="12" />Reply</button>
        <button onClick=${(e) => A.popAt('x-msg', e, { m, c }, -170)} title="React, approval, copy, forward and more"><${I} n="more" s="12" /></button></div>` : null}
    </div>`;
  }

  // ---------- composer: one box, four modes ----------
  const SSN = /\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]?){15,16}\b/;
  const MODES = [['message', 'Message'], ['task', 'Task'], ['approval', 'Approval'], ['request', 'Request']];
  A.Comp3 = function Comp3({ c }) {
    const S = A.S, dw = S.draftWork && S.draftWork.conv === c.id ? S.draftWork : null;
    const [mode, setMode] = useState('message');
    const [v, setV] = useState(A.drafts[c.id] || '');
    const others = c.members.filter((u) => u !== A.ME);
    const [f, setF] = useState({ owner: others[0] || A.ME, approver: 'u1' === A.ME ? 'u7' : 'u1', due: 'today', priority: 'Normal', rec: c.rec || '', recs: c.rec ? [c.rec] : [] });
    const [files, setFiles] = useState([]); const [dlp, setDlp] = useState(false); const ta = useRef();
    const [aiNote, setAiNote] = useState(null); const [aiBusy, setAiBusy] = useState(false);
    const applyAi = (p, srcMsg) => {
      setMode(p.type); setV(p.title); A.drafts[c.id] = p.title;
      setF((old) => Object.assign({}, old, { owner: p.type === 'approval' ? old.owner : p.owner, approver: p.type === 'approval' ? p.owner : old.approver, due: 'custom', dueTs: p.due, priority: p.priority, rec: p.rec || old.rec || '', recs: [...new Set([...(old.recs || []), ...(p.rec ? [p.rec] : []), ...A.recordsIn(p.title), ...(srcMsg ? A.recordsIn(srcMsg.text).concat(srcMsg.links || []) : []), ...A.S.pendingLinks])].filter((k) => A.RECORDS[k]) }));
      setAiNote(Object.assign({ srcMsg }, p)); setTimeout(() => ta.current && ta.current.focus(), 0);
    };
    const smart = async (text, type, srcMsg) => {
      if (!text.trim() || aiBusy) return; setAiBusy(true);
      try { applyAi(await A.aiParse(text, { type, defaultOwner: c.kind === 'dm' ? c.with : undefined, rec: c.rec }), srcMsg); } finally { setAiBusy(false); }
    };
    useEffect(() => { if (dw) { if (dw.fields) applyAi(dw.fields, dw.m); else { setMode(dw.type); if (dw.m) setV(dw.m.text.slice(0, 120)); } A.set({ draftWork: null }); setTimeout(() => ta.current && ta.current.focus(), 0); } }, [dw]);
    const reply = S.replyTo && S.replyTo.conv === c.id ? S.replyTo.m : null;
    const put = (x) => { setV(x); A.drafts[c.id] = x; };
    const [at, setAt] = useState(null); const [atI, setAtI] = useState(0);
    const atOpts = at === null ? [] : [...c.members.filter((u) => u !== A.ME), ...Object.keys(A.USERS).filter((u) => u !== A.ME && !c.members.includes(u))].filter((u) => A.USERS[u].name.toLowerCase().includes(at)).slice(0, 6);
    const pickAt = (u) => { const el = ta.current, pos = el.selectionStart; const before = v.slice(0, pos).replace(/@\w*$/, ''); const nv = before + '@' + A.USERS[u].name.split(' ')[0] + ' ' + v.slice(pos); put(nv); setAt(null); setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = before.length + A.USERS[u].name.split(' ')[0].length + 2; }, 0); };
    const atKey = (e) => { if (!atOpts.length) return false; if (e.key === 'ArrowDown') { setAtI((atI + 1) % atOpts.length); e.preventDefault(); return true; } if (e.key === 'ArrowUp') { setAtI((atI - 1 + atOpts.length) % atOpts.length); e.preventDefault(); return true; } if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickAt(atOpts[atI] || atOpts[0]); return true; } if (e.key === 'Escape') { setAt(null); return true; } return false; };
    useEffect(() => { const el = ta.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; } }, [v, mode]);
    const dueAt = () => { if (f.due === 'custom' && f.dueTs) return f.dueTs; const d = new Date(); if (f.due === 'tomorrow') d.setDate(d.getDate() + 1); if (f.due === 'week') d.setDate(d.getDate() + 4); d.setHours(f.due === 'today' ? 17 : 12, 0, 0, 0); return d.getTime(); };
    const [sms, setSms] = useState(false);
    const submit = (force) => {
      const text = v.trim();
      if (sms && mode === 'message' && A.sendSms) { if (!text && !files.length) return; A.sendSms(c, text, files); put(''); setFiles([]); delete A.drafts[c.id]; return; }
      if (mode === 'message' && A.S.sendLater && A.S.sendLater.conv === c.id && A.scheduleSend) { if (!text) return; A.scheduleSend(c, text, A.S.sendLater.at); A.set({ sendLater: null }); put(''); delete A.drafts[c.id]; return; }
      if (mode === 'message') {
        const links = S.pendingLinks.slice(); if (!text && !files.length && !links.length) return;
        if (!force && SSN.test(text)) { setDlp(true); return; }
        A.send(c.id, text, { files: files.length ? files : undefined, quote: reply ? { from: reply.from, text: reply.text } : undefined });
        A.set((s) => { const last = c.msgs[c.msgs.length - 1]; if (links.length) last.links = links; s.pendingLinks = []; s.replyTo = null; });
        setFiles([]); setDlp(false);
      } else {
        if (!text) return;
        A.createWork({ type: mode, title: text, conv: c.id, owner: mode === 'approval' ? f.approver : f.owner, approver: mode === 'approval' ? f.approver : undefined, due: dueAt(), priority: f.priority, rec: (f.recs && f.recs[0]) || f.rec || null, recs: f.recs, fromMsg: !!(reply || (aiNote && aiNote.srcMsg)), fromMsgId: aiNote && aiNote.srcMsg ? aiNote.srcMsg.id : undefined, amount: aiNote ? aiNote.amount : undefined, aiMade: aiNote ? aiNote.engine : undefined });
        setMode('message'); setAiNote(null);
      }
      put(''); delete A.drafts[c.id];
    };
    const up = (k) => (e) => setF(Object.assign({}, f, { [k]: e.target.value }));
    const people = [...others, ...Object.keys(A.USERS).filter((u) => !others.includes(u) && u !== A.ME), A.ME];
    const t = A.TYPES[mode];
    A._addRealFiles = (fl) => setFiles((x) => [...x, ...fl]);
    A._addFile = () => { const pool = [{ name: 'IMG_4417-stator.jpg', size: '2.1 MB', type: 'JPG' }, { name: 'warranty-claim-48213.pdf', size: '96 KB', type: 'PDF' }]; setFiles((x) => [...x, pool[x.length % 2]]); };
    const placeholder = { message: 'Message ' + A.convName(c), task: 'What needs to be done? e.g. Call Harlan about the stator ETA', approval: 'What needs approval? e.g. Approve parts order PO 1240 ($1,764.90)', request: 'What are you asking for? e.g. Transfer 2 stators from Lakeside' }[mode];
    const [modeMenu, setModeMenu] = useState(false);
    const HELP = { task: 'Becomes an ASPEN task for them.', approval: 'They get Approve and Reject buttons.', request: 'Ask another person or team for something.' };
    const ownerLabel = mode === 'approval' ? 'Approver' : mode === 'request' ? 'Ask' : 'Owner';
    const canSend = mode === 'message' ? !!(v.trim() || files.length || S.pendingLinks.length) : !!v.trim();
    const pickMode = (k) => { setMode(k); setModeMenu(false); if (k === 'message') setAiNote(null); setTimeout(() => ta.current && ta.current.focus(), 0); };
    const api = { v, put, mode, setMode, files, setFiles, ta, submit, sms, setSms };
    return html`<div className=${'cmp' + (mode !== 'message' ? ' work' : '') + (sms && mode === 'message' ? ' sms' : '')} style=${{ '--tc': t.color }}>
      ${A.CompAbove ? html`<${A.CompAbove} c=${c} api=${api} />` : null}
      ${dlp ? html`<div className="cmpnote warn"><${I} n="shield" /><div style=${{ flex: 1 }}><b>This looks like a Social Security or card number.</b> Everyone in this conversation will see it.<div className="cmpnoteact"><button className="btn sm pri" onClick=${() => { A.send(c.id, v.replace(/\b\d{3}-\d{2}-(\d{4})\b/g, '***-**-$1')); put(''); setDlp(false); }}>Hide the number and send</button><button className="btn sm" onClick=${() => submit(true)}>Send anyway</button></div></div></div>` : null}
      ${reply && mode === 'message' ? html`<div className="cmpnote"><${I} n="reply" s="12" /><span style=${{ flex: 1, minWidth: 0 }}>Replying to <b>${A.USERS[reply.from].name.split(' ')[0]}</b> · <span className="cmpquote">${reply.text}</span></span><button className="cmpx" aria-label="Cancel reply" onClick=${() => A.set({ replyTo: null })}><${I} n="close" s="12" /></button></div>` : null}
      ${aiNote && mode !== 'message' ? html`<div className="cmpnote ai"><${A.Spark} /><div style=${{ flex: 1 }}><b>${aiNote.engine === 'cloud' ? 'ASPEN filled this in.' : 'Filled in from your words.'}</b> ${aiNote.why} Check it, then ${mode === 'approval' ? 'request it' : 'create it'}.</div><button className="link" onClick=${() => { setAiNote(null); setMode('message'); put(aiNote.srcMsg ? '' : v); }}>Undo</button></div>` : null}
      ${atOpts.length ? html`<div className="pop mentionpop" role="listbox" aria-label="Mention someone"><div className="ph">Mention someone · ↑↓ then Enter</div>${atOpts.map((u, i) => html`<div role="option" aria-selected=${i === atI} className=${'pi' + (i === atI ? ' on' : '')} onMouseEnter=${() => setAtI(i)} onMouseDown=${(e) => { e.preventDefault(); pickAt(u); }}><${A.Av} u=${u} size="24" /><span style=${{ flex: 1 }}>${A.USERS[u].name}</span><small>${c.members.includes(u) ? A.USERS[u].title : 'Not in this chat'}</small></div>`)}</div>` : null}
      ${modeMenu ? html`<div className="pop modepop" role="menu" onMouseLeave=${() => setModeMenu(false)}>${MODES.filter(([k]) => k === 'message' || k === 'task').map(([k, l]) => html`<div role="menuitemradio" aria-checked=${mode === k} tabIndex="0" className=${'pi' + (mode === k ? ' on' : '')} onClick=${() => pickMode(k)} onKeyDown=${(e) => e.key === 'Enter' && pickMode(k)}><${A.Shape} type=${k} size="13" /><span style=${{ flex: 1 }}><b style=${{ fontWeight: 600 }}>${l}</b><small style=${{ display: 'block', color: 'var(--fg2)' }}>${k === 'message' ? 'A normal chat message' : HELP[k]}</small></span>${mode === k ? html`<${I} n="check" s="12" />` : null}</div>`)}</div>` : null}
      <div className="cmpcard">
        ${mode !== 'message' ? html`<div className="cmphead"><span className="cmpkind"><${A.Shape} type=${mode} size="13" />New ${t.label.toLowerCase()}</span><span className="cmphelp">${HELP[mode]}</span><span className="grow"></span><button className="cmpx" title="Back to a normal message (Esc)" aria-label="Back to a normal message" onClick=${() => pickMode('message')}><${I} n="close" s="12" /></button></div>
          <div className="cmpfields">
            <label className="fpill"><span>${ownerLabel}</span><select id=${'wf-o' + c.id} value=${mode === 'approval' ? f.approver : f.owner} onChange=${up(mode === 'approval' ? 'approver' : 'owner')}>${people.map((u) => html`<option value=${u}>${A.USERS[u].name}${u === A.ME ? ' (me)' : ''}</option>`)}</select></label>
            <label className="fpill"><span>Due</span><select id=${'wf-d' + c.id} value=${f.due} onChange=${up('due')}>${f.dueTs ? html`<option value="custom">${A.dueLabel({ due: f.dueTs })}</option>` : null}<option value="today">Today 5 PM</option><option value="tomorrow">Tomorrow noon</option><option value="week">In 4 days</option></select></label>
            <label className="fpill"><span>Priority</span><select id=${'wf-p' + c.id} value=${f.priority} onChange=${up('priority')}><option>Low</option><option>Normal</option><option>High</option></select></label>
            <${A.RecPills} value=${f.recs} c=${c} onChange=${(r) => setF((old) => Object.assign({}, old, { recs: r, rec: r[0] || '' }))} /></div>` : null}
        ${mode === 'message' && (S.pendingLinks.length || files.length) ? html`<div className="cmpatt">${S.pendingLinks.map((k) => html`<${A.LinkChip} k=${k} onRemove=${() => A.set((s) => { s.pendingLinks = s.pendingLinks.filter((x) => x !== k); })} />`)}${files.map((x, i) => html`<span className="rchip"><span className="k" style=${{ background: 'var(--fg3)' }}>${x.type}</span>${x.name}<button aria-label="Remove file" onClick=${() => setFiles(files.filter((_, j) => j !== i))}><${I} n="close" s="12" /></button></span>`)}<button className="link" style=${{ fontSize: 12 }} onClick=${() => { setFiles([]); A.set({ pendingLinks: [] }); }}>Clear all</button></div>` : null}
        <textarea className="cmpinput" id=${'c3-' + c.id} ref=${ta} value=${v} rows="1" aria-label=${placeholder} onChange=${(e) => { const x = e.target.value; const sl = x.match(/^\/(task|approve|approval|request)\s/i); if (sl) { const k = sl[1].toLowerCase().startsWith('approv') ? 'approval' : sl[1].toLowerCase(); setMode(k); put(x.slice(sl[0].length)); } else put(x); const mm = x.slice(0, e.target.selectionStart).match(/(^|\s)@(\w*)$/); setAt(mm ? mm[2].toLowerCase() : null); setAtI(0); }} maxLength="4000" placeholder=${sms && mode === 'message' ? 'Text ' + (A.custOf ? A.custOf(c).name : 'the customer') + ' (SMS)' : placeholder}
          onKeyDown=${(e) => { if (atKey(e)) return; if ((e.key === 'Enter' && !e.shiftKey && S.settings.enterSends) || (e.ctrlKey && (e.key === 's' || e.key === 'S'))) { e.preventDefault(); submit(); } if (e.key === 'Escape' && mode !== 'message') pickMode('message'); }}></textarea>
        <div className="cmpbar">
          <button className="cmpkindbtn" aria-haspopup="menu" aria-expanded=${modeMenu} title="Send as a message or a task" onClick=${() => setModeMenu(!modeMenu)}><${A.Shape} type=${mode} size="11" />${t.label}<${I} n="down" s="12" /></button>
          <span className="cmpsep"></span>
          ${mode === 'message' ? html`<button className="cmpic" title="Attach a file or ASPEN record" aria-label="Attach" onClick=${(e) => A.popAt('s-attach', e, {}, 0)}><${I} n="attach" /></button>
            <button className="cmpic" title="Emoji" aria-label="Emoji" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'emoji', insert: (x) => put(v + x), x: r.left - b.left, y: r.top - b.top - 150 } }); }}><${I} n="emoji" /></button>
            <button className="cmpic" title="Mention someone" aria-label="Mention someone" onClick=${() => { put(v + (v && !v.endsWith(' ') ? ' @' : '@')); setAt(''); ta.current && ta.current.focus(); }}><${I} n="mention" /></button>` : null}
          ${A.CompTools ? html`<${A.CompTools} c=${c} api=${api} />` : null}
          <button className=${'cmpai' + (aiBusy ? ' busy' : '')} disabled=${!v.trim() || aiBusy} title="Turns what you typed into a task with owner, due date and priority filled in" onClick=${() => smart(v, mode === 'message' ? undefined : mode)}><${I} n="task" s="14" />${aiBusy ? 'Thinking…' : mode === 'message' ? 'Make it a task' : 'Fill from my words'}</button>
          <span className="grow"></span>
          <span className="cmphint"><kbd>Enter</kbd> ${mode === 'message' ? 'send' : 'create'}<span className="dotsep">·</span><kbd>Shift</kbd>+<kbd>Enter</kbd> new line</span>
          <button className="cmpsend" disabled=${!canSend} onClick=${() => submit()} aria-label=${mode === 'message' ? 'Send' : t.label}>
            ${mode === 'message' ? html`<${I} n="send" />${sms ? 'Send text' : 'Send'}` : html`<${A.Shape} type=${mode} color="#fff" size="11" />${mode === 'task' ? 'Create task' : mode === 'approval' ? 'Request approval' : 'Send request'}`}</button>
        </div>
      </div></div>`;
  };

  // ---------- item panel: details, workflow route, history, actions ----------
  const STEPS = { task: ['Discussed', 'Task created', 'Assigned', 'In progress', 'Done'], approval: ['Discussed', 'Requested', 'Routed', 'Decision', 'Notified'], request: ['Discussed', 'Requested', 'Accepted', 'Fulfilled', 'Notified'] };
  const stepAt = (w) => w.type === 'task' ? (w.status === 'Done' ? 5 : w.status === 'In progress' ? 3 : w.owner ? 2 : 1) : A.isClosed(w) ? 5 : 2;
  A.ItemPanel = function ItemPanel({ id }) {
    const S = A.S, w = A.WORK.find((x) => x.id === id); const [reason, setReason] = useState(''); const [rej, setRej] = useState(false);
    if (!w) return null; const t = A.TYPES[w.type], at = stepAt(w);
    const canDecide = !A.isClosed(w) && w.type === 'approval' && w.approver === A.ME;
    const canWork = !A.isClosed(w) && w.type !== 'approval' && w.owner === A.ME;
    const canManage = S.perms.manageWork;
    return html`<div className="panel" style=${{ width: 360 }}><div className="phd" style=${{ borderTop: '3px solid ' + t.color }}><${A.Shape} type=${w.type} size="14" /><b>${t.label}</b><button className="ib" aria-label="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div><div className="pbd">
      <div className="wohead"><${A.WNo} w=${w} big=${true} /><span>Work order · ${A.TYPES[w.type].label}</span></div><div style=${{ font: '600 16px/1.3 var(--font)' }}>${w.title}</div>
      <div style=${{ margin: '6px 0 2px', display: 'flex', gap: 6, flexWrap: 'wrap' }}><${A.Pill} w=${w} /><span className="pill">${w.priority} priority</span>${w.workflow ? html`<span className="pill">${w.workflow}</span>` : null}</div>
      <div className="steps">${STEPS[w.type].map((s, i) => html`<div className=${'step' + (i < at ? ' done' : i === at ? ' cur' : '')}>${s}</div>`)}</div>
      <div className="kv" style=${{ marginTop: 10 }}>
        <span>${w.type === 'approval' ? 'Approver' : 'Owner'}</span><span>${A.uname(w.type === 'approval' ? w.approver : w.owner)}</span>
        <span>Requested by</span><span>${A.uname(w.requester)}</span><span>Due</span><span style=${{ color: A.isOverdue(w) ? 'var(--red)' : undefined }}>${A.dueLabel(w)}</span>
        ${w.amount ? html`<span>Amount</span><span>${w.amount}</span>` : null}${w.rule ? html`<span>Rule</span><span>${w.rule}</span>` : null}
        <span>Records</span><span><${A.RecField} value=${w.recs || (w.rec ? [w.rec] : [])} convId=${w.conv} onChange=${(r) => A.set(() => { w.recs = r; w.rec = r[0] || null; })} /></span>
        ${w.conv && A.conv(w.conv) ? html`<span>Discussed in</span><span className="link" onClick=${() => { A.openConv(w.conv); A.set({ section: 'inbox', panel: { type: 'item', id: w.id } }); }}>${A.convName(A.conv(w.conv))}</span>` : null}
        ${w.reason ? html`<span>Reason</span><span>${w.reason}</span>` : null}</div>
      ${canDecide ? rej ? html`<div className="fld" style=${{ marginTop: 12 }}><label htmlFor="rj">Reason for rejecting (required)</label><textarea id="rj" value=${reason} onChange=${(e) => setReason(e.target.value)} placeholder="The requester will see this"></textarea><div style=${{ display: 'flex', gap: 6 }}><button className="btn sm dan" disabled=${!reason.trim()} onClick=${() => { A.decide(w, 'Rejected', reason); setRej(false); }}>Reject</button><button className="btn sm" onClick=${() => setRej(false)}>Cancel</button></div></div>`
        : html`<div style=${{ display: 'flex', gap: 6, marginTop: 12 }}><button className="btn pri" onClick=${() => A.decide(w, 'Approved')}><${I} n="check" s="12" />Approve</button><button className="btn" onClick=${() => setRej(true)}>Reject…</button></div>` : null}
      ${canWork ? html`<div style=${{ display: 'flex', gap: 6, marginTop: 12 }}>${w.type === 'request' ? html`<button className="btn pri" onClick=${() => A.decide(w, 'Fulfilled')}>Mark fulfilled</button>` : html`${w.status === 'Open' ? html`<button className="btn" onClick=${() => A.setStatus(w, 'In progress')}>Start</button>` : null}<button className="btn pri" onClick=${() => A.setStatus(w, 'Done')}><${I} n="check" s="12" />Mark done</button>`}</div>` : null}
      ${!A.isClosed(w) && (canManage || w.requester === A.ME) ? html`<details className="more"><summary>Reassign</summary><div className="fld" style=${{ marginTop: 8 }}><label htmlFor="ra">New owner</label><select id="ra" value=${(w.type === 'approval' ? w.approver : w.owner) || ''} onChange=${(e) => A.reassign(w, e.target.value)}><option value="" disabled>Unassigned</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select></div></details>` : null}
      ${!canManage && !canDecide && !canWork && w.requester !== A.ME ? html`<p style=${{ color: 'var(--fg2)', fontSize: 12 }}>You can see this item. Only the owner, the requester or someone with Manage Work can change it.</p>` : null}
      ${A.ItemExtras ? html`<${A.ItemExtras} w=${w} />` : null}
      ${A.SnoozeBtn ? html`<${A.SnoozeBtn} w=${w} />` : null}
      <details className="more"><summary>History (${w.history.length})</summary><div className="hist">${w.history.slice().reverse().map((h) => html`<div><b>${A.uname(h.who)}</b> ${h.text}<small>${A.fmtList(h.t) === A.fmtTime(h.t) ? A.fmtTime(h.t) : A.fmtList(h.t) + " " + A.fmtTime(h.t)}</small></div>`)}</div></details>
    </div></div>`;
  };
})();
