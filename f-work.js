// Work features: templates and checklists, recurring tasks, out-of-office delegation, escalation timers,
// approval rules, board and calendar views of My Work, bulk actions, add to Outlook.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;
  const H = 3600000, now = () => Date.now();

  // ---------- templates ----------
  { const w2 = A.WORK.find((w) => w.id === 'w2'); if (w2) w2.status = 'In progress'; }
  A.TEMPLATES = {
    pdi: { label: 'Pre-delivery inspection (PDI)', title: 'PDI for ', steps: ['Check fluids and torque specs', 'Charge and test battery', 'Install accessories', 'Road test', 'Wash and detail', 'Sign PDI sheet'] },
    delivery: { label: 'Customer delivery', title: 'Delivery for ', steps: ['Confirm funding with F&I', 'Walk-around with customer', 'Explain warranty and service plan', 'Register unit with OEM', 'Schedule first service'] },
    warranty: { label: 'Warranty claim', title: 'Warranty claim for ', steps: ['Photos of failed part', 'Tech story written', 'Part number and labor time entered', 'Submit to OEM portal', 'Track claim payment'] },
  };
  // seed: a checklist on the PDI task and a recurring inspection
  (() => {
    const w5 = A.WORK.find((w) => w.id === 'w5'); if (w5) w5.checklist = A.TEMPLATES.pdi.steps.map((t, i) => ({ t, done: i < 2 }));
    const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); d.setHours(9, 0, 0, 0);
    A.WORK.push({ id: 'w20', no: 'T-1020', type: 'task', title: 'Weekly lift safety inspection', owner: A.ME, requester: A.ME, due: d.getTime(), status: 'Open', priority: 'Normal', rec: null, conv: 'team-service', repeat: 'Weekly', checklist: ['Lift 1', 'Lift 2', 'Lift 3', 'Lift 4'].map((t) => ({ t: t + ' arms, pads and locks', done: false })), history: [{ t: now() - 7 * 24 * H, who: A.ME, text: 'Created · repeats weekly' }] });
  })();
  A.NewWorkExtras = function NewWorkExtras({ w, setW }) {
    return html`<div className="frow"><div className="fld"><label htmlFor="nw-tpl">Start from a template</label><select id="nw-tpl" value=${w.tpl || ''} onChange=${(e) => { const t = A.TEMPLATES[e.target.value]; setW(Object.assign({}, w, { tpl: e.target.value, checklist: t ? t.steps.slice() : [], title: t && !w.title ? t.title + (w.rec || 'UNIT C4471') : w.title, type: t ? 'task' : w.type })); }}><option value="">None</option>${Object.keys(A.TEMPLATES).map((k) => html`<option value=${k}>${A.TEMPLATES[k].label}</option>`)}</select></div>
      <div className="fld"><label htmlFor="nw-rep">Repeat</label><select id="nw-rep" value=${w.repeat || 'none'} onChange=${(e) => setW(Object.assign({}, w, { repeat: e.target.value }))}><option value="none">Doesn't repeat</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div></div>
      ${w.checklist && w.checklist.length ? html`<div className="fld"><label>Checklist (${w.checklist.length} steps)</label><div className="cklist">${w.checklist.map((t) => html`<div>☐ ${t}</div>`)}</div></div>` : null}`;
  };
  // recurring: completing creates the next one
  const setStatus0 = A.setStatus;
  A.setStatus = (w, status, who) => {
    setStatus0(w, status, who);
    if (status === 'Done' && w.repeat && !w.nextMade) A.set(() => {
      w.nextMade = true; const step = { Daily: 24 * H, Weekly: 7 * 24 * H, Monthly: 30 * 24 * H }[w.repeat] || 7 * 24 * H;
      const n = Object.assign({}, w, { id: A.nextId(), no: w.no.replace(/\d+$/, (x) => String(+x + 1)), status: 'Open', due: w.due + step, nextMade: false, checklist: w.checklist ? w.checklist.map((x) => ({ t: x.t, done: false })) : undefined, history: [{ t: now(), who: 'sys', text: 'Next ' + w.repeat.toLowerCase() + ' occurrence created' }] });
      A.WORK.unshift(n); A.snack('Next one is scheduled for ' + A.dueLabel(n) + '.');
    });
  };

  // ---------- out of office and delegation ----------
  A.S.ooo = null;
  A.StatusItems = (PI) => html`<${PI} icon="clock" label=${A.S.ooo ? 'Out of office · until ' + A.S.ooo.untilLabel : 'Out of office…'} onClick=${() => A.set({ modal: { type: 'v3-ooo' } })} />`;
  const create0 = A.createWork;
  A.createWork = (f) => {
    const o = A.S.ooo;
    if (o && f.type === 'approval' && f.approver === A.ME) { f = Object.assign({}, f, { approver: o.delegate, owner: o.delegate, delegatedFrom: A.ME }); }
    const w = create0(f);
    if (w.delegatedFrom) A.set(() => { w.history.push({ t: now(), who: 'sys', text: 'Delegated to ' + A.uname(w.approver) + ' while ' + A.uname(A.ME) + ' is out of office' }); });
    return w;
  };
  const Net0 = A.NetBanner;
  A.NetBanner = function NetBanner() {
    const o = A.S.ooo;
    return html`${Net0 ? html`<${Net0} />` : null}${o ? html`<div className="banner oooban"><${I} n="clock" />You're out of office until <b>${o.untilLabel}</b>. New approvals go to ${A.uname(o.delegate)}.<span className="grow"></span><button className="btn sm" onClick=${() => { A.set({ ooo: null }); A.snack('Welcome back. Approvals come to you again.'); }}>I'm back</button></div>` : null}`;
  };

  // ---------- escalation timers (approval SLA) ----------
  A.RULES = [
    { id: 'r1', name: 'Parts orders over $1,500', approver: 'Service Manager', backup: 'u7', sla: 24, on: true },
    { id: 'r2', name: 'F&I products on a deal', approver: 'Sales Manager', backup: 'u7', sla: 4, on: true },
    { id: 'r3', name: 'Credit exceptions', approver: 'General Manager', backup: 'u8', sla: 48, on: true },
    { id: 'r4', name: 'Trade-in values over book', approver: 'Sales Manager', backup: 'u7', sla: 8, on: false },
  ];
  const slaFor = (w) => (w.workflow && /F&I/.test(w.workflow) ? 4 : w.workflow && /Credit/.test(w.workflow) ? 48 : 24) * H;
  const mgrOf = (u) => { const m = u && A.USERS[u] && A.USERS[u].mgr; return Object.keys(A.USERS).find((k) => A.USERS[k].name === m) || 'u7'; };
  A.escInfo = (w) => { if (w.type !== 'approval' || A.isClosed(w)) return null; const at = w.due + slaFor(w); return { at, to: mgrOf(w.approver), done: !!w.escalated }; };
  setInterval(() => A.WORK.forEach((w) => { const e = A.escInfo(w); if (e && !e.done && now() > e.at) A.set(() => { w.escalated = true; w.watchers = [e.to]; w.history.push({ t: now(), who: 'sys', text: 'Escalated to ' + A.uname(e.to) + ' (no decision within ' + slaFor(w) / H + ' h)' }); A.notify && A.notify({ kind: 'approval', title: 'Escalated: ' + w.title, text: 'Now also with ' + A.uname(e.to), work: w.id }); }); }), 15000);
  const left = (ms) => { if (ms <= 60000) return 'under a minute'; const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };

  // ---------- item panel extras: checklist, timers, repeat, Outlook ----------
  A.ItemExtras = function ItemExtras({ w }) {
    const [add, setAdd] = useState('');
    const e = A.escInfo(w), ck = w.checklist, doneN = ck ? ck.filter((x) => x.done).length : 0;
    return html`<div className="itemx">
      ${ck ? html`<div className="ckbox"><div className="ckhead"><b>Checklist</b><span>${doneN} of ${ck.length}</span></div><div className="ckbar"><i style=${{ width: (doneN / ck.length) * 100 + '%' }}></i></div>
        ${ck.map((x, i) => html`<label className=${'ckrow' + (x.done ? ' done' : '')}><input type="checkbox" id=${'ck-' + w.id + '-' + i} checked=${x.done} onChange=${() => A.set(() => { x.done = !x.done; if (ck.every((y) => y.done) && !A.isClosed(w)) A.snack('All steps done. Mark the task done?', () => {}); })} />${x.t}</label>`)}
        <form className="ckadd" onSubmit=${(ev) => { ev.preventDefault(); if (!add.trim()) return; A.set(() => { ck.push({ t: add.trim(), done: false }); }); setAdd(''); }}><input id=${'ckadd-' + w.id} value=${add} onChange=${(ev) => setAdd(ev.target.value)} placeholder="Add a step" /></form></div>` : !A.isClosed(w) && w.type === 'task' ? html`<button className="link" style=${{ marginTop: 10, fontSize: 12.5 }} onClick=${() => A.set(() => { w.checklist = []; })}>+ Add a checklist</button>` : null}
      ${e ? html`<div className=${'escrow' + (e.done ? ' hot' : '')}><${I} n="clock" s="12" />${e.done ? html`Escalated to <b>${A.uname(e.to)}</b>. They can decide too.` : now() > e.at - 2 * H ? html`Escalates to <b>${A.uname(e.to)}</b> in ${left(e.at - now())}` : html`Escalates to ${A.uname(e.to)} if not decided by ${A.dueLabel({ due: e.at })}`}</div>` : null}
      ${w.delegatedFrom ? html`<div className="escrow"><${I} n="people" s="12" />Delegated from ${A.uname(w.delegatedFrom)} (out of office)</div>` : null}
      ${w.repeat ? html`<div className="escrow"><${I} n="clock" s="12" />Repeats ${w.repeat.toLowerCase()}. Finishing it schedules the next one.</div>` : null}
      ${!A.isClosed(w) ? html`<button className=${'btn sm ghost outlookbtn' + (w.outlook ? ' on' : '')} onClick=${() => { A.set(() => { w.outlook = !w.outlook; }); A.snack(w.outlook ? 'Added to your Outlook calendar for ' + A.dueLabel(w) + '.' : 'Removed from your Outlook calendar.'); }}><${I} n=${w.outlook ? 'check' : 'clock'} s="12" />${w.outlook ? 'In your Outlook calendar' : 'Add to Outlook calendar'}</button>` : null}</div>`;
  };

  // ---------- My Work: list / board / calendar + bulk actions ----------
  A.S.workView = 'list';
  A.WorkViewBar = function WorkViewBar({ list }) {
    const S = A.S, picked = S.picked.filter((id) => list.some((w) => w.id === id));
    return html`<div className="wvbar"><div className="seg2 wvseg" role="tablist" aria-label="View">${[['list', 'List'], ['board', 'Board'], ['calendar', 'Calendar']].map(([k, l]) => html`<button role="tab" aria-selected=${S.workView === k} className=${S.workView === k ? 'on' : ''} onClick=${() => A.set({ workView: k, picked: [] })}>${l}</button>`)}</div>
      ${picked.length && S.workView === 'list' ? html`<div className="bulk"><b>${picked.length} selected</b>
        <button className="btn sm" onClick=${() => { picked.forEach((id) => { const w = A.WORK.find((x) => x.id === id); if (w.type === 'task') A.setStatus(w, 'Done'); }); A.set({ picked: [] }); }}><${I} n="check" s="12" />Mark tasks done</button>
        <button className="btn sm" onClick=${() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); A.set((s) => { picked.forEach((id) => { const w = A.WORK.find((x) => x.id === id); w.snoozeUntil = d.getTime(); }); s.picked = []; }); A.snack(picked.length + ' items snoozed until tomorrow 8 AM.'); }}><${I} n="clock" s="12" />Snooze</button>
        <select aria-label="Reassign selected" value="" onChange=${(e) => { const u = e.target.value; picked.forEach((id) => A.reassign(A.WORK.find((x) => x.id === id), u)); A.set({ picked: [] }); A.snack('Reassigned to ' + A.uname(u)); }}><option value="">Reassign to…</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select>
        <button className="link" onClick=${() => A.set({ picked: [] })}>Clear</button></div>` : null}</div>`;
  };
  const COLS = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
  const colOf = (w) => (A.isClosed(w) ? 'done' : w.status === 'In progress' ? 'doing' : 'todo');
  A.WorkBoard = function WorkBoard({ list }) {
    const S = A.S, mine = A.WORK.filter(A.mine).filter((w) => list.includes(w) || A.isClosed(w));
    const drop = (col, id) => { const w = A.WORK.find((x) => x.id === id); if (!w || colOf(w) === col) return;
      if (col === 'done') { if (w.type === 'approval') A.decide(w, 'Approved'); else if (w.type === 'request') A.decide(w, 'Fulfilled'); else A.setStatus(w, 'Done'); }
      else if (col === 'doing') { if (w.type === 'task') A.setStatus(w, 'In progress'); else A.snack('Approvals and requests go straight to a decision.'); }
      else A.snack('Reopening is done from the item panel.'); };
    return html`<div className="board">${COLS.map(([k, l]) => { const items = mine.filter((w) => colOf(w) === k);
      return html`<div className=${'bcol2' + (S.dragCol === k ? ' over' : '')} onDragOver=${(e) => { e.preventDefault(); if (S.dragCol !== k) A.set({ dragCol: k }); }} onDragLeave=${() => A.set({ dragCol: null })} onDrop=${(e) => { e.preventDefault(); A.set({ dragCol: null }); drop(k, e.dataTransfer.getData('text/plain')); }}>
        <div className="bhead"><b>${l}</b><span>${items.length}</span></div>
        ${items.map((w) => html`<div className="bcard" style=${{ '--tc': A.TYPES[w.type].color }} draggable="true" onDragStart=${(e) => e.dataTransfer.setData('text/plain', w.id)} onClick=${() => A.openItem(w.id)} role="button" tabIndex="0" onKeyDown=${(e) => e.key === 'Enter' && A.openItem(w.id)}>
          <div className="bct"><${A.Shape} type=${w.type} size="11" /><b>${w.title}</b></div>
          <div className="bcm"><${A.Pill} w=${w} /><span>${A.dueLabel(w)}</span>${w.checklist ? html`<span>☑ ${w.checklist.filter((x) => x.done).length}/${w.checklist.length}</span>` : null}${w.repeat ? html`<span>↻</span>` : null}</div></div>`)}
        ${!items.length ? html`<div className="bempty">Drop items here</div>` : null}</div>`; })}</div>
      <p className="hintline">Drag a card to change its status. Dropping an approval on Done approves it.</p>`;
  };
  A.WorkCal = function WorkCal({ list }) {
    const S = A.S; const off = S.calWeek || 0;
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + off * 7);
    const days = [...Array(7)].map((_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
    const items = A.WORK.filter(A.mine).filter((w) => !A.isClosed(w));
    const earlier = items.filter((w) => w.due < start.getTime());
    return html`<div className="calbar"><button className="btn sm" onClick=${() => A.set({ calWeek: off - 1 })}>‹ Previous</button><b>${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b><button className="btn sm" onClick=${() => A.set({ calWeek: off + 1 })}>Next ›</button>${off ? html`<button className="link" onClick=${() => A.set({ calWeek: 0 })}>This week</button>` : null}</div>
      <div className="cal">${off === 0 && earlier.length ? html`<div className="calday late"><div className="calh">Overdue</div>${earlier.map((w) => html`<button className="calitem" style=${{ '--tc': A.TYPES[w.type].color }} onClick=${() => A.openItem(w.id)}><${A.Shape} type=${w.type} size="10" />${w.title}</button>`)}</div>` : null}
        ${days.map((d) => { const isToday = d.toDateString() === new Date().toDateString(); const di = items.filter((w) => new Date(w.due).toDateString() === d.toDateString());
          return html`<div className=${'calday' + (isToday ? ' today' : '')}><div className="calh">${d.toLocaleDateString('en-US', { weekday: 'short' })} <b>${d.getDate()}</b></div>${di.map((w) => html`<button className="calitem" style=${{ '--tc': A.TYPES[w.type].color }} onClick=${() => A.openItem(w.id)}><${A.Shape} type=${w.type} size="10" /><span>${A.fmtTime(w.due).replace(':00', '')}</span> ${w.title}</button>`)}</div>`; })}</div>`;
  };

  // ---------- approval rules view and the out-of-office dialog ----------
  A.RulesView = function RulesView() {
    return html`<div className="main"><div className="page"><h1>Approval rules</h1><p className="sub">Who approves what, the backup when they're away, and how long before it escalates.</p>
      <div className="tbl"><table><thead><tr><th>Rule</th><th>Approver</th><th>Backup</th><th>Escalate after</th><th>On</th></tr></thead><tbody>
      ${A.RULES.map((r) => html`<tr><td>${r.name}</td><td>${r.approver}</td><td><select aria-label=${'Backup for ' + r.name} value=${r.backup} onChange=${(e) => A.set(() => { r.backup = e.target.value; })}>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select></td>
        <td><select aria-label=${'Escalation time for ' + r.name} value=${r.sla} onChange=${(e) => A.set(() => { r.sla = +e.target.value; })}>${[2, 4, 8, 24, 48].map((h) => html`<option value=${h}>${h} hours</option>`)}</select></td>
        <td><button role="switch" aria-checked=${r.on} aria-label=${'Rule on: ' + r.name} className=${'sw' + (r.on ? ' on' : '')} onClick=${() => A.set(() => { r.on = !r.on; })}></button></td></tr>`)}</tbody></table></div>
      <p className="hintline">Rules come from ASPEN Workflow Studio. Changes here are saved there.</p></div></div>`;
  };
  A.ExtraViews = Object.assign(A.ExtraViews || {}, { rules: A.RulesView });
  const Modal0 = A.Modal;
  A.Modal = function Modal() {
    const md = A.S.modal; if (md.type !== 'v3-ooo') return html`<${Modal0} />`;
    return html`<${OOO} />`;
  };
  function OOO() {
    const [del, setDel] = useState('u7'); const [days, setDays] = useState('1'); const [hand, setHand] = useState(true);
    const mine = A.WORK.filter((w) => w.type === 'approval' && w.approver === A.ME && !A.isClosed(w));
    const save = () => { const d = new Date(); d.setDate(d.getDate() + +days); d.setHours(8, 0, 0, 0);
      A.set((s) => { s.ooo = { delegate: del, until: d.getTime(), untilLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }; s.myPres = 'away'; s.modal = null; });
      if (hand) mine.forEach((w) => A.set(() => { w.approver = del; w.owner = del; w.delegatedFrom = A.ME; w.history.push({ t: now(), who: A.ME, text: 'Handed to ' + A.uname(del) + ' (out of office)' }); }));
      A.snack('Out of office is on. ' + (hand && mine.length ? mine.length + ' approvals handed to ' + A.uname(del) + '.' : '')); };
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg" role="dialog" aria-label="Out of office">
      <div className="dh"><b>Out of office</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div><div className="db">
      <p style=${{ marginTop: 0, color: 'var(--fg2)' }}>While you're away, approvals that would come to you go to someone else, and people see you're out.</p>
      <div className="frow"><div className="fld"><label htmlFor="ooo-d">Send my approvals to</label><select id="ooo-d" value=${del} onChange=${(e) => setDel(e.target.value)}>${Object.keys(A.USERS).filter((u) => u !== A.ME).map((u) => html`<option value=${u}>${A.USERS[u].name} · ${A.USERS[u].title}</option>`)}</select></div>
        <div className="fld"><label htmlFor="ooo-u">Until</label><select id="ooo-u" value=${days} onChange=${(e) => setDays(e.target.value)}><option value="1">Tomorrow morning</option><option value="3">In 3 days</option><option value="7">Next week</option></select></div></div>
      ${mine.length ? html`<label className="check"><input type="checkbox" id="ooo-h" checked=${hand} onChange=${(e) => setHand(e.target.checked)} />Also hand over the ${mine.length} approvals waiting on me now</label>` : null}</div>
      <div className="df"><button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" onClick=${save}>Turn on</button></div></div></div>`;
  }
  A.set({});
})();
