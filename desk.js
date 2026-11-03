// ASPEN Messaging "desk": Inbox (Needs me + Conversations), My Work, People, Calls, Work Console.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;
  Object.assign(A.S, { section: 'inbox', convId: 'dm-u3', panel: { type: 'item', id: 'w1' }, workFilter: 'all', consoleType: 'all', consoleTile: 'all', cf: { owner: '', status: '', priority: '', workflow: '' }, picked: [] });
  A.S.perms.manageWork = true;
  const close = () => A.set({ pop: null });

  const openConv1 = A.openConv;
  A.openConv = (id, msgId) => { openConv1(id, msgId); A.set((s) => { s.section = 'inbox'; }); };
  A.go = (section) => A.set((s) => { s.section = section; s.pop = null; s.panel = null; if (s.connect === 'closed') s.connect = 'open'; });
  A.sendFromAspen = (k) => A.set((s) => { if (!s.pendingLinks.includes(k) && s.pendingLinks.length < 10) s.pendingLinks.push(k); if (s.connect === 'closed') s.connect = 'open'; s.section = 'people'; A.snack(k + ' attached. Pick who to send it to.'); });

  // ---------- Inbox ----------
  function NeedCard({ w }) {
    const S = A.S, t = A.TYPES[w.type];
    return html`<div className=${'need' + (S.panel && S.panel.id === w.id ? ' on' : '')} style=${{ '--tc': t.color }} role="button" tabIndex="0" onClick=${() => { if (w.conv && A.conv(w.conv)) A.openConv(w.conv); A.openItem(w.id); }}>
      <div className="nt"><${A.Shape} type=${w.type} /><${A.WNo} w=${w} /><span style=${{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${w.title}</span><${A.Pill} w=${w} /></div>
      <div className="nm2">${t.label} from ${A.uname(w.requester)} · due ${A.dueLabel(w)}${w.amount ? ' · ' + w.amount : ''}</div>
      <div className="na" onClick=${(e) => e.stopPropagation()}>${w.type === 'approval' ? html`<button className="btn sm pri" onClick=${() => A.decide(w, 'Approved')}>Approve</button><button className="btn sm" onClick=${() => { if (w.conv) A.openConv(w.conv); A.openItem(w.id); }}>Reject…</button>`
        : w.type === 'request' ? html`<button className="btn sm pri" onClick=${() => A.decide(w, 'Fulfilled')}>Fulfilled</button>` : html`<button className="btn sm pri" onClick=${() => A.setStatus(w, 'Done')}>Done</button>`}
        <button className="btn sm ghost" onClick=${() => { if (w.conv) A.openConv(w.conv); A.openItem(w.id); }}>Open</button></div></div>`;
  }
  function ConvRow({ c }) {
    const S = A.S, last = A.lastMsg(c), on = S.convId === c.id;
    const open = A.workIn(c.id).filter((w) => !A.isClosed(w)), byType = (t) => open.filter((w) => w.type === t).length;
    const prev = !last ? '' : last.kind === 'work' ? (A.WORK.find((w) => w.id === last.work) || {}).title : last.kind === 'alert' ? A.ALERTS.find((a) => a.id === last.alert).title : last.file ? '📎 ' + last.file.name : last.text || '';
    const who = last && last.from === A.ME ? 'You: ' : last && c.kind !== 'dm' && A.USERS[last.from] ? A.USERS[last.from].name.split(' ')[0] + ': ' : '';
    return html`<div className=${'li' + (on ? ' on' : '') + (c.unread ? ' unread' : '') + (c.muted ? ' muted' : '')} role="button" tabIndex="0" onClick=${() => A.openConv(c.id)} onKeyDown=${(e) => e.key === 'Enter' && A.openConv(c.id)} onContextMenu=${(e) => { e.preventDefault(); const b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'row', c, x: e.clientX - b.left, y: e.clientY - b.top } }); }}>
      <${A.Av2} c=${c} /><div className="nm"><div className="t1"><b>${A.convName(c)}</b><small>${last ? A.fmtList(last.t) : ''}</small></div>
      <div className="t2">${S.typing[c.id] ? html`<i style=${{ color: 'var(--accent)' }}>typing…</i>` : A.drafts[c.id] ? html`<span style=${{ color: 'var(--red)' }}>Draft:</span> ${A.drafts[c.id]}` : who + prev}</div>
      ${open.length ? html`<div style=${{ marginTop: 2 }}>${['task', 'approval', 'request'].filter(byType).map((t) => html`<span className="wcount"><${A.Shape} type=${t} size="9" />${byType(t)} ${A.TYPES[t].label.toLowerCase()}${byType(t) > 1 ? 's' : ''}</span>`)}</div>` : null}</div>
      ${c.unread ? html`<span className=${'badge' + (c.muted ? ' grey' : '') + (c.mentions ? ' men' : '')} title=${c.mentions ? 'Mentions you' : c.unread + ' unread'}>${c.mentions ? '@' : ''}${c.unread}</span>` : null}</div>`;
  }
  function Inbox() {
    const S = A.S, need = A.needsMe(), f = S.chatFilter;
    let list = A.CONVS.filter((c) => c.kind !== 'channel');
    if (f === 'unread') list = list.filter((c) => c.unread); if (f === 'work') list = list.filter((c) => A.workIn(c.id).some((w) => !A.isClosed(w))); if (f === 'records') list = list.filter((c) => c.kind === 'record');
    const t = (c) => (A.lastMsg(c) || { t: 0 }).t; list.sort((a, b) => t(b) - t(a));
    return html`<div className="inbox"><div className="lscroll">
      ${S.q ? html`<${A.SearchResults} q=${S.q.trim().toLowerCase()} />` : html`
      <div className="band"><${A.Shape} type="approval" size="10" />Needs me <span className="badge" style=${{ background: 'var(--orange)' }}>${need.length}</span></div>
      ${(S.needAll ? need : need.slice(0, 3)).map((w) => html`<${NeedCard} key=${w.id} w=${w} />`)}
      ${need.length > 3 ? html`<button className="link" style=${{ margin: '2px 14px 4px', fontSize: 12.5 }} onClick=${() => A.set({ needAll: !S.needAll })}>${S.needAll ? 'Show fewer' : 'Show all ' + need.length}</button>` : null}
      ${!need.length ? html`<div style=${{ padding: '4px 14px 8px', color: 'var(--fg2)', fontSize: 12.5 }}>Nothing waiting on you.</div>` : null}
      <div className="band" style=${{ marginTop: 6 }}><${A.Shape} type="message" size="10" />Conversations</div>
      <div className="lfilter"><label className="showsel">Show <select aria-label="Which conversations" value=${f} onChange=${(e) => A.set({ chatFilter: e.target.value })}>${[['all', 'All conversations'], ['unread', 'Unread'], ['work', 'With open work'], ['records', 'ASPEN records']].map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></label></div>
      ${list.map((c) => html`<${ConvRow} key=${c.id} c=${c} />`)}`}</div></div>`;
  }

  // ---------- My Work (deck slide 14) ----------
  function WorkTable({ list, selectable }) {
    const S = A.S;
    return html`<div className="tbl wtable"><table><thead><tr>${selectable ? html`<th style=${{ width: 28 }}><input type="checkbox" aria-label="Select all" checked=${list.length && list.every((w) => S.picked.includes(w.id))} onChange=${(e) => A.set((s) => { s.picked = e.target.checked ? list.map((w) => w.id) : []; })} /></th>` : null}<th>Item</th><th>Type</th><th>${selectable ? 'Owner' : 'From'}</th><th>Due</th><th>Record</th><th>Priority</th><th>Status</th></tr></thead><tbody>
      ${list.map((w) => html`<tr className=${'click' + (S.panel && S.panel.id === w.id ? ' sel' : '')} onClick=${() => A.openItem(w.id)}>
        ${selectable ? html`<td onClick=${(e) => e.stopPropagation()}><input type="checkbox" aria-label=${'Select ' + w.title} checked=${S.picked.includes(w.id)} onChange=${() => A.set((s) => { s.picked = s.picked.includes(w.id) ? s.picked.filter((x) => x !== w.id) : [...s.picked, w.id]; })} /></td>` : null}
        <td><span style=${{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><${A.Shape} type=${w.type} /><${A.WNo} w=${w} />${w.title}</span></td><td>${A.TYPES[w.type].label}</td>
        <td>${selectable ? A.uname(w.type === 'approval' ? w.approver : w.owner) : A.uname(w.requester)}</td><td style=${{ color: A.isOverdue(w) ? 'var(--red)' : undefined, whiteSpace: 'nowrap' }}>${A.dueLabel(w)}</td>
        <td>${w.rec || '—'}</td><td>${w.priority}</td><td><${A.Pill} w=${w} /></td></tr>`)}
      ${!list.length ? html`<tr><td colSpan="8" style=${{ color: 'var(--fg2)', padding: 16 }}>No items match.</td></tr>` : null}</tbody></table></div>`;
  }
  function MyWork() {
    const S = A.S, n = A.counts(), f = S.workFilter; const [done, setDone] = useState(false);
    let list = A.WORK.filter(A.mine).filter((w) => done || !A.isClosed(w));
    if (f === 'tasks') list = list.filter((w) => w.type === 'task'); if (f === 'overdue') list = list.filter(A.isOverdue); if (f === 'approvals') list = list.filter((w) => w.type === 'approval'); if (f === 'requests') list = list.filter((w) => w.type === 'request');
    list.sort((a, b) => (A.isOverdue(b) - A.isOverdue(a)) || a.due - b.due);
    const tiles = [['tasks', n.open, 'Open tasks', 'var(--accent)'], ['overdue', n.overdue, 'Overdue', 'var(--red)'], ['approvals', n.approvals, 'My approvals', 'var(--orange)'], ['requests', n.requests, 'Open requests', 'var(--settings)']];
    return html`<div className="main"><div className="page">
      <h1>My Work</h1><p className="sub">Everything waiting on you: tasks you own, approvals you decide, and requests sent to you. Click a number to see those items.</p>
      <div className="kpis">${tiles.map(([k, v, l, col]) => html`<button className=${'kpi' + (f === k ? ' on' : '')} style=${{ '--tc': col }} onClick=${() => A.set({ workFilter: f === k ? 'all' : k })}><b style=${{ color: col }}>${v}</b><span>${l}</span></button>`)}</div>
      <${A.PlanCard} />
      <div className="fbar2"><b style=${{ fontSize: 14 }}>${f === 'all' ? 'Needs attention' : tiles.find((x) => x[0] === f)[2]}</b><span className="grow"></span>
        <button className=${'btn sm aibtn' + (S.ai.busy.plan ? ' busy' : '')} disabled=${!!S.ai.busy.plan} onClick=${A.planDay} title="Put your open work in the best order for today, with a reason for each"><${A.Spark} />${S.ai.busy.plan ? 'Planning…' : 'Plan my day'}</button><label className="check" style=${{ margin: 0 }}><input type="checkbox" id="mw-done" checked=${done} onChange=${(e) => setDone(e.target.checked)} />Show completed</label>
        <button className="btn sm pri" onClick=${() => A.set({ modal: { type: 'task' } })}><${A.Shape} type="task" color="#1e3a2b" />New task</button></div>
      ${A.WorkViewBar ? html`<${A.WorkViewBar} list=${list} />` : null}
      ${S.workView === 'board' && A.WorkBoard ? html`<${A.WorkBoard} list=${list} />` : S.workView === 'calendar' && A.WorkCal ? html`<${A.WorkCal} list=${list} />` : html`<${WorkTable} list=${list} selectable=${!!A.WorkViewBar} />`}</div></div>`;
  }

  // ---------- Work Console (deck slide 15, admin) ----------
  function Console() {
    const S = A.S, cf = S.cf, all = A.WORK;
    const tiles = [['all', all.length, 'All work items', 'var(--accent)'], ['overdue', all.filter(A.isOverdue).length, 'Overdue', 'var(--red)'], ['awaiting', all.filter((w) => w.type === 'approval' && w.status === 'Pending').length, 'Awaiting approval', 'var(--orange)'], ['unassigned', all.filter((w) => !w.owner && !A.isClosed(w)).length, 'Unassigned', 'var(--settings)']];
    let list = all;
    if (S.consoleTile === 'overdue') list = list.filter(A.isOverdue); if (S.consoleTile === 'awaiting') list = list.filter((w) => w.type === 'approval' && w.status === 'Pending'); if (S.consoleTile === 'unassigned') list = list.filter((w) => !w.owner && !A.isClosed(w));
    if (S.consoleType !== 'all') list = list.filter((w) => w.type === S.consoleType);
    if (cf.owner) list = list.filter((w) => (w.type === 'approval' ? w.approver : w.owner) === cf.owner);
    if (cf.status) list = list.filter((w) => A.statusText(w) === cf.status); if (cf.priority) list = list.filter((w) => w.priority === cf.priority); if (cf.workflow) list = list.filter((w) => (w.workflow || 'Manual') === cf.workflow);
    const setCf = (k) => (e) => A.set((s) => { s.cf[k] = e.target.value; });
    const wfs = [...new Set(all.map((w) => w.workflow || 'Manual'))];
    return html`<div className="main"><div className="page">
      <h1>Work Console</h1><p className="sub">Every task, request and approval across Ridgeline Powersports. You can view all work. You can reassign because you have the Manage Work permission.</p>
      <div className="kpis">${tiles.map(([k, v, l, col]) => html`<button className=${'kpi' + (S.consoleTile === k ? ' on' : '')} style=${{ '--tc': col }} onClick=${() => A.set({ consoleTile: k })}><b style=${{ color: col }}>${v}</b><span>${l}</span></button>`)}</div>
      <div className="fbar2"><div className="seg" style=${{ margin: 0, width: 320 }}>${[['all', 'All'], ['task', 'Tasks'], ['request', 'Requests'], ['approval', 'Approvals']].map(([k, l]) => html`<button className=${S.consoleType === k ? 'on' : ''} onClick=${() => A.set({ consoleType: k })}>${l}</button>`)}</div>
        <select aria-label="Owner" value=${cf.owner} onChange=${setCf('owner')}><option value="">Any owner</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select>
        <select aria-label="Status" value=${cf.status} onChange=${setCf('status')}><option value="">Any status</option>${['Open', 'In progress', 'Pending', 'Overdue', 'Done', 'Approved', 'Rejected', 'Fulfilled'].map((x) => html`<option>${x}</option>`)}</select>
        <select aria-label="Priority" value=${cf.priority} onChange=${setCf('priority')}><option value="">Any priority</option><option>High</option><option>Normal</option><option>Low</option></select>
        <select aria-label="Workflow" value=${cf.workflow} onChange=${setCf('workflow')}><option value="">Any workflow</option>${wfs.map((x) => html`<option>${x}</option>`)}</select>
        <span className="grow"></span>
        ${S.picked.length ? html`<span style=${{ fontSize: 12.5 }}>${S.picked.length} selected</span><select aria-label="Reassign selected" value="" onChange=${(e) => { const u = e.target.value; S.picked.forEach((id) => A.reassign(A.WORK.find((w) => w.id === id), u)); A.set({ picked: [] }); A.snack('Reassigned to ' + A.uname(u)); }}><option value="">Reassign to…</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select>` : null}</div>
      <${WorkTable} list=${list} selectable=${true} /></div></div>`;
  }

  // ---------- window ----------
  A.ConnectWin = function ConnectWin({ docked }) {
    const S = A.S, c = A.conv(S.convId), n = A.counts(), un = A.unreadTotals(), need = A.needsMe().length;
    const right = S.panel && A.ExtraPanels && A.ExtraPanels[S.panel.type] ? html`<${A.ExtraPanels[S.panel.type]} p=${S.panel} />` : S.panel && S.panel.type === 'summary' && A.conv(S.panel.conv) ? html`<${A.SummaryPanel} key=${S.panel.key} k=${S.panel.key} c=${A.conv(S.panel.conv)} />` : S.panel && S.panel.type === 'item' ? html`<${A.ItemPanel} key=${S.panel.id} id=${S.panel.id} />` : S.panel && S.panel.type === 'details' && c ? html`<${A.Details2} c=${c} />` : null;
    const popEl = S.pop ? (S.pop.type.startsWith('x-') ? html`<${A.XPop} />` : S.pop.type.startsWith('s-') ? html`<${A.SPop} />` : html`<${A.Pop} />`) : null;
    const modalEl = S.modal ? (S.modal.type.startsWith('s-') ? html`<${A.SModal} />` : html`<${A.Modal} />`) : null;
    const snack = S.snack ? html`<div className="snack" role="status">${S.snack.text}${S.snack.undo ? html`<span className="link" onClick=${() => { S.snack.undo(); A.set({ snack: null }); }}>Undo</span>` : null}</div>` : null;
    const outside = (e) => { if (S.pop && !e.target.closest('.pop')) close(); };
    if (docked) return html`<div className="cwin dock" onClick=${outside}><div className="ctitle"><span className="logo" style=${{ width: 16, height: 16, borderRadius: 3, background: '#3a9a3e' }}></span><b style=${{ fontWeight: 600 }}>ASPEN Messaging</b><span className="grow"></span>
        <button className="wb" title="Open full window" onClick=${() => A.set({ connect: 'open' })}><${I} n="popout" s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      ${c ? html`<${A.Conv3} c=${c} docked=${true} />` : null}${modalEl}${popEl}${snack}</div>`;
    let body;
    if (A.ExtraViews && A.ExtraViews[S.section]) body = html`<${A.ExtraViews[S.section]} />${right}`;
    else if (S.section === 'mywork') body = html`<${MyWork} />${right}`;
    else if (S.section === 'console') body = html`<${Console} />${right}`;
    else if (S.section === 'settings' || S.section === 'admin') body = html`<${A.Page} />`;
    else {
      const left = html`<${A.Sidebar} />`;
      body = html`${left}${c ? html`<${A.Conv3} c=${c} />` : html`<div className="main"><div className="empty"><div><b>Pick a conversation</b></div></div></div>`}${right}`;
    }
    const tabs = [['inbox', 'Inbox', un.chat, need, un.chat + ' unread messages, ' + need + ' items need you'], ['mywork', 'My Work', n.overdue, 0, n.overdue + ' overdue'], ['people', 'People', A.CALLS.filter((x) => x.dir === 'missed').length, 0, 'missed calls']];
    return html`<div className=${'cwin' + (S.max ? ' max' : '')} onClick=${outside} onKeyDown=${(e) => { if (e.key === 'Escape') A.set({ pop: null, modal: null }); }}>
      <div className="ctitle" onDoubleClick=${() => A.set({ max: !S.max })}><span className="logo" style=${{ width: 16, height: 16, borderRadius: 3, background: '#3a9a3e', color: '#fff', display: 'grid', placeItems: 'center', font: '700 10px/1 var(--font)' }}>A</span><b className="ttl">Messaging</b><button className="locbtn" title="Location (same as ASPEN). Channels and people follow it." onClick=${(e) => A.popAt('loc', e, {}, 0)}><${I} n="location" s="12" />${S.location}<${I} n="down" s="12" /></button><span className="grow"></span>
        <label className="sbox"><${I} n="search" /><input id="desk-q" value=${S.q} onChange=${(e) => A.set({ q: e.target.value, section: 'inbox' })} placeholder="Search people, messages, work" />${S.q ? html`<button aria-label="Clear search" onClick=${() => A.set({ q: '' })}><${I} n="close" s="12" /></button>` : null}</label>
        <button style=${{ alignSelf: 'center', marginLeft: 8 }} title="Your status" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'status', x: r.left - b.left - 200, y: r.bottom - b.top + 4 } }); }}><${A.Av} u=${A.ME} /></button>
        <button className="wb" title="Dock beside the ASPEN form" onClick=${() => A.set({ connect: 'docked' })}><${I} n="dock" s="12" /></button><button className="wb" title="Minimize" onClick=${() => A.set({ connect: 'closed' })}><${I} n="min" s="12" /></button>
        <button className="wb" title=${S.max ? 'Restore' : 'Maximize'} onClick=${() => A.set({ max: !S.max })}><${I} n=${S.max ? 'restore' : 'max'} s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      ${A.NetBanner ? html`<${A.NetBanner} />` : null}
      ${S.v2 ? null : A.CtxBar ? html`<${A.CtxBar} />` : null}
      ${S.urgent && !S.acks[S.urgent.id] ? html`<div className="banner urgent"><${I} n="megaphone" /><b>${S.urgent.title}</b><span>${S.urgent.body}</span><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set((s) => { s.acks[s.urgent.id] = true; })}>Got it</button></div>` : null}
      ${S.call && S.call.mini ? html`<div className="banner call"><${I} n="phone" /><b>On a call with ${S.call.title}</b><${A.CallTimer} /><span className="grow"></span><button className="btn sm" onClick=${() => A.set((s) => { s.call.mini = false; })}>Return to call</button></div>` : null}
      <div className="cbody">${A.AppRail ? html`<${A.AppRail} />` : null}${body}</div>
      ${S.call && !S.call.mini ? html`<${A.CallView} />` : null}${S.call && S.call.mini ? html`<${A.MiniCall} />` : null}
      ${S.qs ? html`<${A.QuickSwitch} />` : null}
      ${modalEl}${popEl}${S.tour !== null && S.tour !== undefined && !S.modal ? html`<${A.Tour} />` : null}${snack}</div>`;
  };

  // "New task" from My Work and "Create ASPEN task" from a message both create work items now
  const Modal0 = A.Modal;
  A.Modal = function Modal() { const md = A.S.modal; return md.type === 'task' ? html`<${NewWork} md=${md} />` : html`<${Modal0} />`; };
  function NewWork({ md }) {
    const c = md.c || null;
    const [w, setW] = useState({ type: md.wtype || 'task', title: md.m && md.m.text ? md.m.text.slice(0, 100) : '', owner: c && c.kind === 'dm' ? c.with : 'u2', due: 'today', priority: 'Normal', rec: (c && c.rec) || '', recs: [...new Set([...(md.recs || []), ...(c && c.rec ? [c.rec] : []), ...(md.m ? A.recordsIn(md.m.text).concat(md.m.links || []) : [])])] });
    const up = (k) => (e) => setW(Object.assign({}, w, { [k]: e.target.value }));
    const save = () => { const d = new Date(); if (w.due === 'tomorrow') d.setDate(d.getDate() + 1); d.setHours(17, 0, 0, 0);
      A.createWork({ type: w.type, title: w.title, owner: w.owner, approver: w.type === 'approval' ? w.owner : undefined, due: d.getTime(), priority: w.priority, rec: w.recs[0] || null, recs: w.recs, conv: c ? c.id : null, checklist: w.checklist && w.checklist.length ? w.checklist.map((t) => ({ t, done: false })) : undefined, repeat: w.repeat && w.repeat !== 'none' ? w.repeat : undefined }); A.set({ modal: null }); };
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg" role="dialog" aria-label="New work item">
      <div className="dh"><b>${w.type === 'task' ? 'New task' : 'New ' + A.TYPES[w.type].label.toLowerCase()}</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div><div className="db">
      <div className="modes">${['task', 'approval', 'request'].map((k) => html`<button className=${'mode' + (w.type === k ? ' on' : '')} style=${{ '--tc': A.TYPES[k].color }} onClick=${() => setW(Object.assign({}, w, { type: k }))}><${A.Shape} type=${k} />${A.TYPES[k].label}</button>`)}</div>
      <div className="fld"><label htmlFor="nw-t">Title</label><input id="nw-t" value=${w.title} onChange=${up('title')} /></div>
      <div className="frow"><div className="fld"><label htmlFor="nw-o">${w.type === 'approval' ? 'Approver' : 'Owner'}</label><select id="nw-o" value=${w.owner} onChange=${up('owner')}>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select></div>
        <div className="fld"><label htmlFor="nw-d">Due</label><select id="nw-d" value=${w.due} onChange=${up('due')}><option value="today">Today 5 PM</option><option value="tomorrow">Tomorrow 5 PM</option></select></div></div>
      <div className="frow"><div className="fld"><label htmlFor="nw-p">Priority</label><select id="nw-p" value=${w.priority} onChange=${up('priority')}><option>Low</option><option>Normal</option><option>High</option></select></div>
        </div>
      <div className="fld"><label>ASPEN records <span style=${{ fontWeight: 400, color: 'var(--fg2)' }}>work orders, invoices, reports, deals and more</span></label><${A.RecField} value=${w.recs} convId=${(c && c.id) || md.ctxConv} onChange=${(r) => setW(Object.assign({}, w, { recs: r }))} /></div>${A.NewWorkExtras ? html`<${A.NewWorkExtras} w=${w} setW=${setW} />` : null}</div>
      <div className="df"><button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!w.title.trim()} onClick=${save}>Create</button></div></div></div>`;
  }

  Object.assign(A, { NeedCard, ConvRowD: ConvRow, MyWorkView: MyWork, ConsoleView: Console });
  A.set({});
})();
