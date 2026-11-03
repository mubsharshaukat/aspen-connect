// Tasks app (left bar), a calmer task details panel, and the app bar with Tasks.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;
  const H = 3600e3, now = () => Date.now();
  const first = (u) => (A.USERS[u] ? A.USERS[u].name.split(' ')[0] : A.uname(u));
  const owner = (w) => (w.type === 'approval' ? w.approver : w.owner);

  // ---------- Tasks app ----------
  const FILTERS = [
    ['mine', 'Assigned to me', (w) => A.mine(w) && !A.isClosed(w)],
    ['approvals', 'Approvals', (w) => w.type === 'approval' && w.approver === A.ME && !A.isClosed(w)],
    ['created', 'Created by me', (w) => w.requester === A.ME && !A.isClosed(w)],
    ['all', 'All open', (w) => !A.isClosed(w)],
    ['done', 'Completed', (w) => A.isClosed(w)],
  ];
  const locOf = (w) => {
    for (const k of (w.recs || (w.rec ? [w.rec] : []))) { const r = A.RECORDS[k], f = r && (r.fields || []).find((x) => x[0] === 'Location'); if (f && A.LOCATIONS.includes(f[1])) return f[1]; }
    const u = A.USERS[owner(w)] || A.USERS[w.requester]; return u ? u.loc : A.LOCATIONS[0];
  };
  const atLoc = (w) => A.S.location === 'All locations' || locOf(w) === A.S.location;
  A.taskLocation = locOf;
  Object.assign(A.S, { tf: 'mine', tq: '', tkCol: {} });
  A.myOpenTasks = () => A.WORK.filter(FILTERS[0][2]).length;
  const groupOf = (w) => {
    if (!w.due) return [5, 'No due date'];
    if (!A.isClosed(w) && A.isOverdue(w)) return [0, 'Overdue'];
    const t = new Date(); t.setHours(0, 0, 0, 0); const diff = Math.floor((w.due - t.getTime()) / 864e5);
    return diff <= 0 ? [1, 'Today'] : diff === 1 ? [2, 'Tomorrow'] : diff < 7 ? [3, 'This week'] : [4, 'Later'];
  };
  function TaskRow({ w }) {
    const S = A.S, closed = A.isClosed(w), on = S.panel && S.panel.id === w.id, done = closed && w.type === 'task';
    const recs = w.recs || (w.rec ? [w.rec] : []), c = w.conv && A.conv(w.conv);
    const open = () => A.set({ panel: { type: 'item', id: w.id } });
    const canAct = !closed && A.mine(w);
    const act = w.type === 'approval' ? ['Approve', () => A.decide(w, 'Approved')] : w.type === 'request' ? ['Fulfilled', () => A.decide(w, 'Fulfilled')] : ['Done', () => A.setStatus(w, 'Done')];
    return html`<div className=${'tkrow' + (on ? ' on' : '') + (closed ? ' closed' : '')} role="button" tabIndex="0" onClick=${open} onKeyDown=${(e) => e.key === 'Enter' && open()}>
      ${w.type === 'task' ? html`<button className=${'tdchk' + (done ? ' on' : '')} title=${done ? 'Done' : 'Mark done'} aria-label=${done ? 'Done' : 'Mark done'} disabled=${!canAct && !done} onClick=${(e) => { e.stopPropagation(); if (canAct) A.setStatus(w, 'Done'); }}><${I} n="check" s="12" /></button>`
        : html`<span className="tkshape" title=${A.TYPES[w.type].label}><${A.Shape} type=${w.type} size="13" /></span>`}
      <div className="tkmain"><div className="tkt">${w.title}</div>
        <div className="tkm"><span>${A.TYPES[w.type].label}</span><span>from ${w.requester === A.ME ? 'you' : first(w.requester)}</span>${c ? html`<span>in ${A.convName(c)}</span>` : null}${S.location === 'All locations' ? html`<span>${locOf(w).split(' - ')[1] || locOf(w)}</span>` : null}
          ${recs.slice(0, 2).map((k) => html`<span className="tkrec">${k}</span>`)}${recs.length > 2 ? html`<span>+${recs.length - 2}</span>` : null}</div></div>
      ${w.priority === 'High' && !closed ? html`<span className="tkpri" title="High priority">High</span>` : null}
      ${canAct && w.type !== 'task' ? html`<button className="btn sm tkact" onClick=${(e) => { e.stopPropagation(); act[1](); }}><${I} n="check" s="12" />${act[0]}</button>` : null}
      <span className=${'tkdue' + (!closed && A.isOverdue(w) ? ' late' : '')}>${closed ? A.statusText(w) : A.dueLabel(w)}</span>
      ${A.USERS[owner(w)] ? html`<span title=${A.uname(owner(w))}><${A.Av} u=${owner(w)} size="24" pres=${false} /></span>` : null}</div>`;
  }
  A.TasksView = function TasksView() {
    const S = A.S, f = FILTERS.find((x) => x[0] === S.tf) || FILTERS[0], q = S.tq.trim().toLowerCase();
    let list = A.WORK.filter((w) => f[2](w) && atLoc(w));
    if (q) list = list.filter((w) => (w.title + ' ' + (w.recs || [w.rec]).join(' ') + ' ' + A.uname(owner(w)) + ' ' + A.uname(w.requester)).toLowerCase().includes(q));
    list.sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
    const groups = {}; if (S.tf !== 'done') list.forEach((w) => { const [k, n] = groupOf(w); (groups[k] = groups[k] || { n, items: [] }).items.push(w); });
    const sec = (key, name, items) => { const col = S.tkCol[key];
      return html`<section key=${key} className="tkgrp"><button className=${'tkgh' + (key === '0' ? ' late' : '')} aria-expanded=${!col} onClick=${() => A.set((s) => { s.tkCol = Object.assign({}, s.tkCol, { [key]: !col }); })}><${I} n="down" s="12" />${name}<span>${items.length}</span></button>
        ${col ? null : items.map((w) => html`<${TaskRow} key=${w.id} w=${w} />`)}</section>`; };
    return html`<div className="main tkview">
      <div className="tkhead"><div className="tkh1"><h1>Tasks</h1><small>${A.myOpenTasks()} open for you</small></div><span className="grow"></span>
        <label className="tkloc" title="Location (same as ASPEN)"><${I} n="location" s="14" /><select aria-label="Location" value=${S.location} onChange=${(e) => A.set({ location: e.target.value })}>${['All locations', ...A.LOCATIONS].map((l) => html`<option key=${l}>${l}</option>`)}</select></label>
        <label className="tksearch"><${I} n="search" /><input id="tk-q" value=${S.tq} onChange=${(e) => A.set({ tq: e.target.value })} placeholder="Filter by title, record or person" aria-label="Filter tasks" /></label>
        <button className="btn pri tknew" onClick=${() => A.newTask()}><${I} n="plus" s="12" />New task</button></div>
      <div className="tktabs" role="tablist">${FILTERS.map(([k, l, fn]) => html`<button role="tab" aria-selected=${S.tf === k} className=${S.tf === k ? 'on' : ''} onClick=${() => A.set({ tf: k })}>${l}<span>${A.WORK.filter((w) => fn(w) && atLoc(w)).length}</span></button>`)}</div>
      <div className="tklist">${!list.length ? html`<div className="tkempty"><${A.Shape} type="task" size="22" /><b>${q ? 'No tasks match "' + S.tq + '"' : S.tf === 'done' ? 'Nothing completed yet' : 'You are all caught up'}</b><span>Create a task here, or turn any chat message into one with Make it a task.</span><button className="btn pri" onClick=${() => A.newTask()}><${I} n="plus" s="12" />New task</button></div>`
        : S.tf === 'done' ? sec('done', 'Completed', list) : Object.keys(groups).sort().map((k) => sec(k, groups[k].n, groups[k].items))}</div></div>`;
  };
  A.ExtraViews = Object.assign(A.ExtraViews || {}, { tasks: A.TasksView });

  // My Work now lives in Tasks.
  const go1 = A.go;
  A.go = (section) => { if (section === 'mywork') { A.set({ tf: 'mine' }); go1('tasks'); } else go1(section); };

  // ---------- app bar with Tasks ----------
  A.AppRail = function AppRail() {
    const S = A.S, un = A.unreadTotals(), notes = (S.notes || []).filter((x) => !x.read).length, missed = A.CALLS.filter((x) => x.dir === 'missed').length, tk = A.myOpenTasks();
    const sec = S.section === 'chat' ? 'inbox' : S.section, act = !!(S.panel && S.panel.type === 'notes');
    const item = (l, ic, b, on, fn, tip) => html`<button className=${'ri' + (on ? ' on' : '')} title=${tip || l} aria-label=${(tip || l) + (b ? ', ' + b : '')} aria-current=${on ? 'page' : undefined} onClick=${fn}><${I} n=${ic} s="20" /><span>${l}</span>${b ? html`<span className="badge">${b > 99 ? '99+' : b}</span>` : null}</button>`;
    const newPop = (e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(), b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: S.pop && S.pop.type === 'x-new' ? null : { type: 'x-new', x: r.right - b.left + 6, y: r.top - b.top } }); };
    return html`<nav className="rail apprail" aria-label="Apps">
      <button className="ri rinew" title="New message or task" aria-haspopup="menu" onClick=${newPop}><span className="rinewic"><${I} n="plus" s="16" /></span><span>New</span></button>
      ${item('Activity', 'bell', notes, act, () => A.set({ panel: act ? null : { type: 'notes' } }), 'Activity and notifications')}
      ${item('Chat', 'chat', un.chat, sec === 'inbox' && !act, () => A.go('inbox'))}
      ${item('Tasks', 'task', tk, sec === 'tasks' && !act, () => A.go('tasks'), 'Tasks and approvals')}
      ${item('Calls', 'calls', missed, sec === 'calls', () => A.go('calls'), 'Calls and call history')}
      ${item('People', 'people', 0, sec === 'people', () => A.go('people'), 'People and teams')}
      ${item('Saved', 'saved', 0, sec === 'saved', () => A.go('saved'), 'Saved messages')}
      <span className="sp"></span>
      ${item('Settings', 'settings', 0, sec === 'settings' || sec === 'admin', () => A.go('settings'))}</nav>`;
  };

  // ---------- task details: calm, Planner-style ----------
  const STEPS = { task: ['Discussed', 'Task created', 'Assigned', 'In progress', 'Done'], approval: ['Discussed', 'Requested', 'Routed', 'Decision', 'Notified'], request: ['Discussed', 'Requested', 'Accepted', 'Fulfilled', 'Notified'] };
  const stepAt = (w) => w.type === 'task' ? (w.status === 'Done' ? 5 : w.status === 'In progress' ? 3 : w.owner ? 2 : 1) : A.isClosed(w) ? 5 : 2;
  const left = (ms) => { if (ms <= 60000) return 'under a minute'; const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  const person = (u) => A.USERS[u] ? html`<span className="tdperson"><${A.Av} u=${u} size="24" pres=${false} />${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</span>` : html`<span>${A.uname(u)}</span>`;
  A.ItemPanel = function ItemPanel({ id }) {
    const S = A.S, w = A.WORK.find((x) => x.id === id);
    const [reason, setReason] = useState(''); const [rej, setRej] = useState(false); const [add, setAdd] = useState('');
    if (!w) return null;
    const t = A.TYPES[w.type], at = stepAt(w), steps = STEPS[w.type], closed = A.isClosed(w), who = owner(w);
    const canDecide = !closed && w.type === 'approval' && w.approver === A.ME;
    const canWork = !closed && w.type !== 'approval' && w.owner === A.ME;
    const canManage = S.perms.manageWork, canReassign = !closed && (canManage || w.requester === A.ME);
    const done = w.type === 'task' && w.status === 'Done';
    const e = A.escInfo ? A.escInfo(w) : null, ck = w.checklist, ckDone = ck ? ck.filter((x) => x.done).length : 0;
    const snoozable = !closed && A.mine(w), snoozed = w.snoozeUntil > now();
    const snooze = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); A.set(() => { w.snoozeUntil = d.getTime(); w.history.push({ t: now(), who: A.ME, text: 'Snoozed until tomorrow 8 AM' }); }); A.snack('Snoozed until tomorrow 8 AM.'); };
    return html`<div className="panel tdp" style=${{ width: 360 }}>
      <div className="tdhd"><span className="tdtype"><${A.Shape} type=${w.type} size="12" />${t.label}</span><${A.WNo} w=${w} /><span className="grow"></span>
        <button className="ib" aria-label="Close" title="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div>
      <div className="pbd tdbody">
        <div className="tdtitle">${w.type === 'task' ? html`<button className=${'tdchk' + (done ? ' on' : '')} disabled=${!canWork && !done} title=${done ? 'Done' : 'Mark done'} aria-label=${done ? 'Done' : 'Mark done'} onClick=${() => canWork && A.setStatus(w, 'Done')}><${I} n="check" s="12" /></button>` : null}<h2 className=${done ? 'done' : ''}>${w.title}</h2></div>
        <div className="tdmeta"><${A.Pill} w=${w} />${w.priority !== 'Normal' ? html`<span className=${'tdflag' + (w.priority === 'High' ? ' hi' : '')}>${w.priority} priority</span>` : null}${w.workflow ? html`<span className="tdwf">${w.workflow}</span>` : null}</div>
        <div className="tdprog" title=${steps.join(' → ')}><div className="tdbar">${steps.map((s, i) => html`<i key=${s} className=${i < at ? 'd' : i === at ? 'c' : ''}></i>`)}</div><small>Step ${Math.min(at + 1, 5)} of 5 · <b>${steps[Math.min(at, 4)]}</b></small></div>
        ${canDecide ? rej ? html`<div className="tdact col"><label htmlFor="rj">Reason for rejecting <span>(required, the requester sees it)</span></label><textarea id="rj" value=${reason} onChange=${(ev) => setReason(ev.target.value)} placeholder="Why are you rejecting this?"></textarea><div className="tdbtns"><button className="btn dan" disabled=${!reason.trim()} onClick=${() => { A.decide(w, 'Rejected', reason); setRej(false); }}>Reject</button><button className="btn" onClick=${() => setRej(false)}>Cancel</button></div></div>`
          : html`<div className="tdact"><button className="btn pri" onClick=${() => A.decide(w, 'Approved')}><${I} n="check" s="12" />Approve</button><button className="btn" onClick=${() => setRej(true)}>Reject…</button></div>` : null}
        ${canWork ? html`<div className="tdact">${w.type === 'request' ? html`<button className="btn pri" onClick=${() => A.decide(w, 'Fulfilled')}><${I} n="check" s="12" />Mark fulfilled</button>` : html`${w.status === 'Open' ? html`<button className="btn" onClick=${() => A.setStatus(w, 'In progress')}>Start</button>` : null}<button className="btn pri" onClick=${() => A.setStatus(w, 'Done')}><${I} n="check" s="12" />Mark done</button>`}</div>` : null}
        <dl className="tddl">
          <dt>${w.type === 'approval' ? 'Approver' : 'Assigned to'}</dt><dd>${canReassign
            ? html`<label className="tdpick" title="Change who this is assigned to">${A.USERS[who] ? html`<${A.Av} u=${who} size="24" pres=${false} />` : null}<select id="ra" aria-label="Reassign" value=${who || ''} onChange=${(ev) => A.reassign(w, ev.target.value)}><option value="" disabled>Unassigned</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</option>`)}</select><${I} n="down" s="12" /></label>`
            : person(who)}</dd>
          <dt>Requested by</dt><dd>${person(w.requester)}</dd>
          <dt>Due</dt><dd><span className=${!closed && A.isOverdue(w) ? 'late' : ''}>${A.dueLabel(w)}${!closed && A.isOverdue(w) ? ' · overdue' : ''}</span>
            ${e ? html`<small className=${'tdesc' + (e.done ? ' hot' : '')}>${e.done ? html`Escalated to ${A.uname(e.to)}. They can decide too.` : now() > e.at - 2 * H ? html`Escalates to ${A.uname(e.to)} in ${left(e.at - now())}` : html`Escalates to ${A.uname(e.to)} if not decided by ${A.dueLabel({ due: e.at })}`}</small>` : null}</dd>
          ${w.amount ? html`<dt>Amount</dt><dd>${w.amount}</dd>` : null}
          ${w.rule ? html`<dt>Rule</dt><dd>${w.rule}</dd>` : null}
          <dt>Records</dt><dd><${A.RecField} dialog=${true} value=${w.recs || (w.rec ? [w.rec] : [])} convId=${w.conv} onChange=${(r) => A.set(() => { w.recs = r; w.rec = r[0] || null; })} /></dd>
          ${w.conv && A.conv(w.conv) ? html`<dt>Discussed in</dt><dd><button className="link" onClick=${() => { A.openConv(w.conv); A.set({ section: 'inbox', panel: { type: 'item', id: w.id } }); }}>${A.convName(A.conv(w.conv))}</button></dd>` : null}
          ${w.reason ? html`<dt>Reason</dt><dd>${w.reason}</dd>` : null}
          ${w.delegatedFrom ? html`<dt>Delegated</dt><dd>From ${A.uname(w.delegatedFrom)} (out of office)</dd>` : null}
          ${w.repeat ? html`<dt>Repeats</dt><dd>${w.repeat}. Finishing it schedules the next one.</dd>` : null}</dl>
        ${ck ? html`<div className="tdck"><div className="tdckh"><b>Checklist</b><span>${ckDone} of ${ck.length}</span></div><div className="tdckbar"><i style=${{ width: (ck.length ? (ckDone / ck.length) * 100 : 0) + '%' }}></i></div>
          ${ck.map((x, i) => html`<label key=${i} className=${'tdckrow' + (x.done ? ' done' : '')}><input type="checkbox" id=${'ck-' + w.id + '-' + i} checked=${x.done} onChange=${() => A.set(() => { x.done = !x.done; })} /><span>${x.t}</span></label>`)}
          <form onSubmit=${(ev) => { ev.preventDefault(); if (!add.trim()) return; A.set(() => { ck.push({ t: add.trim(), done: false }); }); setAdd(''); }}><input className="tdckadd" id=${'ckadd-' + w.id} value=${add} onChange=${(ev) => setAdd(ev.target.value)} placeholder="+ Add a step" /></form></div>`
          : !closed && w.type === 'task' ? html`<button className="tdlink" onClick=${() => A.set(() => { w.checklist = []; })}><${I} n="plus" s="12" />Add a checklist</button>` : null}
        ${!canManage && !canDecide && !canWork && w.requester !== A.ME ? html`<p className="tdnote">You can see this item. Only the owner, the requester or someone with Manage Work can change it.</p>` : null}
        ${!closed ? html`<div className="tdlinks">
          ${snoozable ? snoozed ? html`<span className="tdlink static"><${I} n="clock" s="12" />Snoozed until ${A.dueLabel({ due: w.snoozeUntil })}<button className="link" onClick=${() => A.set(() => { w.snoozeUntil = 0; })}>Unsnooze</button></span>`
            : html`<button className="tdlink" onClick=${snooze}><${I} n="clock" s="12" />Snooze until tomorrow</button>` : null}</div>` : null}
        <details className="tdhist"><summary><${I} n="down" s="12" />Activity <span>${w.history.length}</span></summary><div className="hist">${w.history.slice().reverse().map((h) => html`<div><b>${A.uname(h.who)}</b> ${h.text}<small>${A.fmtList(h.t) === A.fmtTime(h.t) ? A.fmtTime(h.t) : A.fmtList(h.t) + ' ' + A.fmtTime(h.t)}</small></div>`)}</div></details>
      </div></div>`;
  };

  // ---------- menus open upward (or shift left) when there is no room ----------
  const popAt0 = A.popAt;
  A.popAt = (type, e, extra, dx) => { A._anchor = e.currentTarget.getBoundingClientRect(); popAt0(type, e, extra, dx); };
  const fitPop = () => { const p = document.querySelector('.cwin > .pop'); if (!p) return; const c = p.parentElement.getBoundingClientRect(), r = p.getBoundingClientRect();
    if (r.bottom > c.bottom - 6) { const a = A._anchor; p.style.top = Math.max(8, (a ? a.top - c.top : c.height) - r.height - 4) + 'px'; }
    if (r.right > c.right - 6) p.style.left = Math.max(8, c.width - r.width - 8) + 'px'; };
  const setFit = A.set; A.set = (x) => { setFit(x); requestAnimationFrame(fitPop); };
  A.set({});
})();
