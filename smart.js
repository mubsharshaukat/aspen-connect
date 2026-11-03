// Smart-task UI (suggestion tray, catch-me-up, plan my day) and the "smooth" layer: undo, shortcuts, first-run tour.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef } = React;

  A.Spark = ({ s }) => html`<svg className="spark" width=${s || 13} height=${s || 13} viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .8c.4 3.4 1.8 4.8 5.2 5.2-3.4.4-4.8 1.8-5.2 5.2C7.6 7.8 6.2 6.4 2.8 6 6.2 5.6 7.6 4.2 8 .8Z" /><path d="M13 10.2c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3Z" /></svg>`;

  // seed: work items already created from these messages
  [['w1', 'approve the order'], ['w7', '3-year service plan'], ['w4', 'backordered, ETA'], ['w5', 'PDI'], ['w6', 'grinding noise']].forEach(([wid, snip]) => {
    const w = A.WORK.find((x) => x.id === wid), c = w && A.conv(w.conv); const m = c && c.msgs.find((x) => x.text && x.text.includes(snip)); if (m) w.fromMsgId = m.id;
  });

  // sample untracked asks so "Find tasks" and the inline hints have something to show
  (() => { const c = A.conv('team-service'); if (!c) return; const t = Date.now() - 6 * 60000;
    c.msgs.push({ id: 'ask1', from: 'u2', t, text: 'Can you make sure someone calls Bell Rentals about INV 220981 before Friday? They disputed the labor line.', reactions: {}, thread: [] },
      { id: 'ask2', from: 'u9', t: t + 60000, text: 'Please approve the loaner for Harlan Pruitt while RO 48213 waits on the stator, about $45 a day.', reactions: {}, thread: [] }); })();

  // ---------- undo for one-click actions ----------
  const wrap = (name, verb) => { const fn = A[name]; A[name] = (w, ...rest) => {
    const before = { status: w.status, owner: w.owner, approver: w.approver, reason: w.reason, h: w.history.length }; const c = A.conv(w.conv); const n = c ? c.msgs.length : 0;
    fn(w, ...rest); if (name === 'decide' ? rest[2] : rest[1]) return; // actions by other people (simulated) have no undo
    A.snack(verb(w), () => A.set(() => { Object.assign(w, { status: before.status, owner: before.owner, approver: before.approver, reason: before.reason }); w.history.length = before.h; if (c) c.msgs.length = n; }));
  }; };
  wrap('decide', (w) => w.title + ': ' + w.status.toLowerCase());
  wrap('setStatus', (w) => w.title + ': ' + (w.status === 'Done' ? 'done' : w.status.toLowerCase()));

  // ---------- 1. Find tasks → suggestion tray ----------
  A.findTasks = async (c) => {
    A.aiBusy('find' + c.id, true);
    try { const list = await A.aiFindTasks(c); A.set((s) => { s.sugg = Object.assign({}, s.sugg, { [c.id]: list }); }); }
    finally { A.aiBusy('find' + c.id, false); }
  };
  const accept = (c, sg) => {
    A.createWork({ type: sg.type, title: sg.title, owner: sg.owner, approver: sg.type === 'approval' ? sg.owner : undefined, due: sg.due, priority: sg.priority, rec: sg.rec, amount: sg.amount, conv: c.id, fromMsg: !!sg.msgId, fromMsgId: sg.msgId, aiMade: sg.engine });
    A.set((s) => { s.sugg[c.id] = s.sugg[c.id].filter((x) => x.id !== sg.id); });
  };
  A.SuggestTray = function SuggestTray({ c }) {
    const S = A.S, list = S.sugg[c.id]; const [edit, setEdit] = useState(null);
    const close = () => A.set((s) => { const x = Object.assign({}, s.sugg); delete x[c.id]; s.sugg = x; });
    return html`<div className="tray" role="region" aria-label="Suggested work">
      <div className="trayh"><${A.Spark} /><b>${list.length ? 'ASPEN Assist found ' + list.length + ' item' + (list.length > 1 ? 's' : '') + ' to track' : 'No new work found'}</b><span className="muted">${list.length ? 'Nothing is created until you accept it.' : 'Everything asked here is already tracked.'}</span><span className="grow"></span>
        ${list.length > 1 ? html`<button className="btn sm" onClick=${() => list.slice().forEach((sg) => accept(c, sg))}>Accept all</button>` : null}<button className="ib" aria-label="Close suggestions" onClick=${close}><${I} n="close" /></button></div>
      ${list.map((sg) => { const t = A.TYPES[sg.type]; const src = sg.msgId && c.msgs.find((m) => m.id === sg.msgId);
        return html`<div className="sg" key=${sg.id} style=${{ '--tc': t.color }}>
          <${A.Shape} type=${sg.type} size="14" />
          <div style=${{ flex: 1, minWidth: 0 }}>
            ${edit === sg.id ? html`<input id=${'sg-' + sg.id} className="sginput" value=${sg.title} onChange=${(e) => A.set(() => { sg.title = e.target.value; })} onKeyDown=${(e) => e.key === 'Enter' && setEdit(null)} autoFocus />` : html`<b>${sg.title}</b>`}
            <div className="sgm"><span className="tlabel" style=${{ '--tc': t.color }}>${t.label}</span>
              <label>${sg.type === 'approval' ? 'Approver' : 'Owner'} <select value=${sg.owner} onChange=${(e) => A.set(() => { sg.owner = e.target.value; })}>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select></label>
              <span>Due ${A.dueLabel(sg)}</span>${sg.priority !== 'Normal' ? html`<span>${sg.priority}</span>` : null}${sg.rec ? html`<span>${sg.rec}</span>` : null}${sg.amount ? html`<span>${sg.amount}</span>` : null}</div>
            <div className="why">${sg.why}${src ? html` <button className="link" onClick=${() => A.set({ highlight: src.id })}>Show message</button>` : null}</div></div>
          <div className="sga"><button className="btn sm pri" style=${{ background: t.color, borderColor: t.color }} onClick=${() => accept(c, sg)}>${sg.type === 'approval' ? 'Request' : 'Create'}</button>
            <button className="btn sm ghost" onClick=${() => setEdit(edit === sg.id ? null : sg.id)}>${edit === sg.id ? 'Done' : 'Edit'}</button>
            <button className="btn sm ghost" onClick=${() => A.set((s) => { s.sugg[c.id] = list.filter((x) => x.id !== sg.id); })}>Dismiss</button></div></div>`; })}
      <div className="trayf">${S.ai.engine === 'cloud' ? 'Suggested by ASPEN. Always review before creating.' : 'Suggested by the built-in helper. Open this page in ASPEN to use ASPEN for better suggestions.'}</div></div>`;
  };

  // ---------- 2. Brief me ----------
  A.SummaryPanel = function SummaryPanel({ c, k }) {
    const [txt, setTxt] = useState(''); const [state, setState] = useState('thinking'); const ctl = useRef();
    useEffect(() => { ctl.current = new AbortController(); A.aiSummary(c, (t) => { setTxt(t); setState('writing'); }, ctl.current.signal).then((t) => { if (t) setTxt(t); setState('done'); }); return () => ctl.current.abort(); }, [k]);
    const open = A.workIn(c.id).filter((w) => !A.isClosed(w));
    return html`<div className="panel" style=${{ width: 360 }}><div className="phd" style=${{ borderTop: '3px solid var(--ai)' }}><${A.Spark} /><b>Brief me</b><button className="ib" aria-label="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div><div className="pbd">
      <div style=${{ color: 'var(--fg2)', fontSize: 12, marginBottom: 8 }}>${A.convName(c)} · ${c.msgs.filter((m) => m.text).length} messages</div>
      ${state === 'thinking' ? html`<div className="shimmer"></div><div className="shimmer" style=${{ width: '80%' }}></div><div className="shimmer" style=${{ width: '60%' }}></div>` : html`<div className="sumtxt">${txt}${state === 'writing' ? html`<span className="caret"></span>` : null}</div>`}
      ${state === 'done' && open.length ? html`<div className="sect">Open work here</div>${open.map((w) => html`<div className="sumrow" onClick=${() => A.openItem(w.id)}><${A.Shape} type=${w.type} /><span style=${{ flex: 1 }}>${w.title}</span><${A.Pill} w=${w} /></div>`)}` : null}
      ${state === 'done' ? html`<div style=${{ display: 'flex', gap: 6, marginTop: 14 }}><button className="btn sm aibtn" onClick=${() => A.findTasks(c)}><${A.Spark} />Find tasks</button><button className="btn sm ghost" onClick=${() => A.set({ panel: { type: 'summary', conv: c.id, key: A.nextId() } })}>Refresh</button></div>` : null}
      <p className="trayf" style=${{ marginTop: 14 }}>${A.S.ai.engine === 'cloud' ? 'Written by ASPEN from the messages in this conversation.' : 'Built-in summary. In ASPEN, this uses ASPEN.'}</p></div></div>`;
  };

  // ---------- 3. Plan my day ----------
  A.PlanCard = function PlanCard() {
    const S = A.S, p = S.plan;
    if (!p) return null;
    return html`<div className="plan"><div className="trayh"><${A.Spark} /><b>Your plan for today</b><span className="muted">${p.engine === 'cloud' ? 'Ordered by ASPEN' : 'Ordered by urgency, approvals that block others, and priority'}</span><span className="grow"></span><button className="ib" aria-label="Close plan" onClick=${() => A.set({ plan: null })}><${I} n="close" /></button></div>
      <ol>${p.order.map((o, i) => { const w = A.WORK.find((x) => x.id === o.id); if (!w) return null; return html`<li className=${A.isClosed(w) ? 'done' : ''} onClick=${() => A.openItem(w.id)}><span className="num">${i + 1}</span><${A.Shape} type=${w.type} /><span style=${{ flex: 1 }}><b>${w.title}</b><small>${o.reason}</small></span><${A.Pill} w=${w} /></li>`; })}</ol></div>`;
  };
  A.planDay = async () => {
    A.aiBusy('plan', true);
    try { const items = A.WORK.filter(A.mine).filter((w) => !A.isClosed(w)); const p = await A.aiPlanDay(items); A.set({ plan: p }); }
    finally { A.aiBusy('plan', false); }
  };

  // ---------- 4. First-run tour ----------
  const TOUR = [
    { t: 'Tasks', b: 'All your tasks and approvals are in Tasks on the left bar. Create one there, from New, or with Make it a task in any chat.', sel: '.apprail .ri:nth-child(4)' },
    { t: 'Turn talk into work', b: 'Use the Message ▾ button to send a Task, Approval or Request instead. Or type naturally and click Make it a task to have the details filled in.', sel: '.cmpkindbtn' },
    { t: 'Everything in one place', b: 'Activity, Chat, Calls, People and Settings are on the left bar. Ctrl+B collapses the chat list. Ctrl+K jumps anywhere.', sel: '.apprail' },
  ];
  A.Tour = function Tour() {
    const S = A.S, i = S.tour; const [box, setBox] = useState(null);
    useEffect(() => { const t = setTimeout(measure, 420); window.addEventListener('resize', measure); return () => { clearTimeout(t); window.removeEventListener('resize', measure); }; }, [i, S.section]);
    function measure() { const el = document.querySelector(TOUR[i].sel), cw = document.querySelector('.cwin'); if (el && cw) { const r = el.getBoundingClientRect(), b = cw.getBoundingClientRect(); setBox({ x: Math.min(Math.max(12, r.left - b.left), b.width - 340), y: r.bottom - b.top + 10 > b.height - 170 ? r.top - b.top - 170 : r.bottom - b.top + 10, hl: { left: r.left - b.left - 4, top: r.top - b.top - 4, width: r.width + 8, height: r.height + 8 } }); } else setBox({ x: 40, y: 80 }); }
    const end = () => { try { localStorage.setItem('aspen-msg-tour', '1'); } catch (e) {} A.set({ tour: null }); };
    if (!box) return null;
    return html`<div className="tourwrap">${box.hl ? html`<div className="tourhl" style=${box.hl}></div>` : null}
      <div className="tour" role="dialog" aria-label=${TOUR[i].t} style=${{ left: box.x, top: box.y }}><div className="tstep">${i + 1} of ${TOUR.length}</div><b>${TOUR[i].t}</b><p>${TOUR[i].b}</p>
        <div style=${{ display: 'flex', gap: 6 }}><button className="btn sm ghost" onClick=${end}>Skip</button><span className="grow"></span>${i > 0 ? html`<button className="btn sm" onClick=${() => A.set({ tour: i - 1 })}>Back</button>` : null}<button className="btn sm pri" onClick=${() => (i < TOUR.length - 1 ? A.set({ tour: i + 1 }) : end())}>${i < TOUR.length - 1 ? 'Next' : 'Got it'}</button></div></div></div>`;
  };
  let seen = false; try { seen = localStorage.getItem('aspen-msg-tour') === '1'; } catch (e) {}
  if (!seen) setTimeout(() => A.set({ tour: 0 }), 900);

  // ---------- 5. Keyboard ----------
  window.addEventListener('keydown', (e) => {
    const S = A.S; if (S.connect === 'closed') return;
    if (e.ctrlKey && /^[1-3]$/.test(e.key)) { e.preventDefault(); A.go(['inbox', 'mywork', 'people'][+e.key - 1]); }
    if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); A.set({ qs: true }); }
    if (e.key === 'Escape' && !S.modal && !S.pop && !S.qs) A.set({ panel: null, tour: null });
  });
})();
