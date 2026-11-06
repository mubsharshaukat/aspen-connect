// MVP feedback round: My Work and Needs me removed, New task button, video calls removed,
// Teams-style app bar, any ASPEN record (work orders, invoices, reports…) on tasks, upload from PC or from ASPEN.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;

  // ---------- more ASPEN document types ----------
  Object.assign(A.RECKIND, {
    WO: { label: 'Work Order', color: '#00796b' },
    QT: { label: 'Quote', color: '#4f6bed' },
    SO: { label: 'Special Order', color: '#a4262c' },
  });
  const R = (kind, id, title, status, tone, fields) => ({ kind, id, title, status, tone, fields });
  Object.assign(A.RECORDS, {
    'WO 5102': R('WO', '5102', 'Bell Rentals', 'Scheduled', 'b', [['Customer', 'Bell Rentals'], ['Unit', '2022 Honda Pioneer 1000'], ['Job', '100-hour service'], ['Technician', 'Sam Whitfield'], ['Scheduled', 'Thu 9:00 AM']]),
    'WO 5108': R('WO', '5108', 'Ridgeline Excavating', 'In shop', 'a', [['Customer', 'Ridgeline Excavating'], ['Unit', '2019 Kubota RTV-X1100C'], ['Job', 'Hydraulic leak'], ['Technician', 'Luis Romero']]),
    'INV 221017': R('INV', '221017', 'Ridgeline Excavating', 'Past due', 'a', [['Customer', 'Ridgeline Excavating'], ['Date', '09/14/2026'], ['Total', '$3,904.10'], ['Balance', '$3,904.10'], ['Terms', 'Net 30']]),
    'INV 221004': R('INV', '221004', 'Harlan Pruitt', 'Open', 'a', [['Customer', 'Harlan Pruitt'], ['Date', '10/26/2026'], ['Total', '$300.00'], ['For', 'Deposit on RO 48213']]),
    'RPT Parts Aging': R('RPT', 'PA-02', 'Parts Aging, week of Oct 26', 'Excel ready', 'g', [['Format', 'Excel'], ['Locations', 'All'], ['Run by', 'Scheduler']]),
    'RPT Open ROs': R('RPT', 'RO-07', 'Open Repair Orders by Technician', 'Live', 'b', [['Format', 'On screen'], ['Location', '01 - Main Location']]),
    'RPT Credit Limit': R('RPT', 'CL-01', 'Customers over Credit Limit', 'PDF ready', 'a', [['Format', 'PDF'], ['Customers', '3']]),
    'QT 3381': R('QT', '3381', 'Maria Gutierrez', 'Sent', 'b', [['Customer', 'Maria Gutierrez'], ['Item', '3-year extended service plan'], ['Total', '$1,149.00'], ['Expires', 'Nov 8']]),
    'SO 772': R('SO', '772', 'Harlan Pruitt', 'On order', 'a', [['Customer', 'Harlan Pruitt'], ['Part', '4014029 Stator assembly'], ['ETA', 'Tuesday'], ['Deposit', '$100.00']]),
  });
  // Find any record number in text, for every document type.
  A.recordsIn = (text) => {
    const keys = Object.keys(A.RECORDS).filter((k) => /\d/.test(k)).sort((a, b) => b.length - a.length);
    const re = new RegExp('\\b(' + keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(' ', ' ?')).join('|') + ')\\b', 'gi');
    const out = []; (text || '').replace(re, (x) => { const k = keys.find((y) => y.replace(' ', '').toLowerCase() === x.replace(' ', '').toLowerCase()); if (k && !out.includes(k)) out.push(k); return x; });
    return out;
  };
  const kindOrder = () => ['RO', 'WO', 'INV', 'RPT', 'DEAL', 'QT', 'PO', 'SO', 'CUST', 'UNIT', 'PART', ...Object.keys(A.RECKIND)].filter((k, i, a) => a.indexOf(k) === i && Object.keys(A.RECORDS).some((r) => A.RECORDS[r].kind === k));
  const plural = (k) => { const l = A.RECKIND[k].label; return /s$/.test(l) ? l : l.replace(/y$/, 'ie') + 's'; };
  const ctxRecs = (convId) => { const c = convId && A.conv(convId); if (!c) return []; const out = c.rec ? [c.rec] : []; c.msgs.forEach((m) => out.push(...A.recordsIn(m.text), ...(m.links || []))); return [...new Set(out)].filter((k) => A.RECORDS[k]); };

  // ---------- record browser: search, type filter, multi-select ----------
  function RecBrowser({ picked, onToggle, convId, onDone, doneLabel, initKind }) {
    const [q, setQ] = useState(''); const [kind, setKind] = useState(initKind || 'all');
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    const match = (k) => { const r = A.RECORDS[k], hay = (k + ' ' + r.id + ' ' + r.title + ' ' + r.status + ' ' + A.RECKIND[r.kind].label).toLowerCase(); return toks.every((t) => hay.includes(t)); };
    const byQ = Object.keys(A.RECORDS).filter(match);
    const list = byQ.filter((k) => kind === 'all' || A.RECORDS[k].kind === kind);
    const sugg = !q && kind === 'all' ? ctxRecs(convId).filter((k) => list.includes(k)) : [];
    const row = (k) => { const r = A.RECORDS[k], kk = A.RECKIND[r.kind], on = picked.includes(k);
      return html`<button type="button" key=${k} className=${'rbrow' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => onToggle(k)}>
        <span className="rbbox">${on ? html`<${I} n="check" s="12" />` : null}</span><span className="rbk" style=${{ background: kk.color }}>${r.kind}</span>
        <span className="rbt"><b>${r.kind === 'RPT' ? r.title : kk.label + ' ' + r.id}</b><small>${r.kind === 'RPT' ? 'Report · ' + (r.fields[0] ? r.fields[0][1] : '') : r.title}</small></span><span className=${'pill ' + r.tone}>${r.status}</span></button>`; };
    return html`<div className="rbrowse" onClick=${(e) => e.stopPropagation()}>
      <div className="rbtop"><label className="rbsearch"><${I} n="search" /><input autoFocus value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="Search number, customer or name" aria-label="Search ASPEN records" /></label>
        <select className="rbtype" aria-label="Document type" value=${kind} onChange=${(e) => setKind(e.target.value)}>${['all', ...kindOrder()].map((k) => { const n = k === 'all' ? byQ.length : byQ.filter((x) => A.RECORDS[x].kind === k).length;
          return html`<option key=${k} value=${k}>${k === 'all' ? 'All types' : plural(k)} (${n})</option>`; })}</select></div>
      <div className="rblist">${sugg.length ? html`<div className="rbh">In this conversation</div>${sugg.map(row)}<div className="rbh">All records</div>` : null}
        ${list.filter((k) => !sugg.includes(k)).map(row)}${!list.length ? html`<div className="rbempty">No records match. Try a number like 48213 or a customer name.</div>` : null}</div>
      ${onDone ? html`<div className="rbfoot"><span>${picked.length ? picked.length + ' selected' : 'Pick one or more'}</span><button type="button" className="btn sm pri" onClick=${onDone}>${doneLabel || 'Done'}</button></div>` : null}</div>`;
  }
  // Chips + "Add ASPEN record" with the browser opening in place (task form, task panel).
  A.RecField = function RecField({ value, onChange, convId, dialog }) {
    const [open, setOpen] = useState(false); const v = value || [];
    const sugg = ctxRecs(convId).filter((k) => !v.includes(k)).slice(0, 4);
    return html`<div className="recfield">
      <div className="rfchips">${v.map((k) => html`<${A.LinkChip} key=${k} k=${k} onRemove=${() => onChange(v.filter((x) => x !== k))} />`)}
        <button type="button" className="rfadd" aria-expanded=${open} onClick=${() => (dialog ? A.set({ modal: { type: 's-recpick', convId, picked: v, onPick: onChange, title: 'ASPEN records on this task' } }) : setOpen(!open))}><${I} n=${open ? 'close' : 'plus'} s="12" />${open ? 'Close' : v.length ? 'Add more' : 'Add ASPEN record'}</button></div>
      ${sugg.length && !open && !dialog ? html`<div className="rfsugg"><span>Suggested:</span>${sugg.map((k) => html`<button type="button" key=${k} onClick=${() => onChange([...v, k])}><${I} n="plus" s="12" />${k}</button>`)}</div>` : null}
      ${open ? html`<${RecBrowser} picked=${v} convId=${convId} onToggle=${(k) => onChange(v.includes(k) ? v.filter((x) => x !== k) : [...v, k])} onDone=${() => setOpen(false)} />` : null}</div>`;
  };
  // Compact version for the message box: chips + Add opens the picker dialog.
  A.RecPills = function RecPills({ value, onChange, c }) {
    const v = value || [];
    return html`<span className="fpill recpill"><span>Records</span>${v.map((k) => html`<${A.LinkChip} key=${k} k=${k} onRemove=${() => onChange(v.filter((x) => x !== k))} />`)}
      <button type="button" className="rfadd" onClick=${() => A.set({ modal: { type: 's-recpick', convId: c.id, picked: v, onPick: onChange, title: 'Add ASPEN records to this task' } })}><${I} n="plus" s="12" />Add</button></span>`;
  };
  // Picker dialog: used by Attach > From ASPEN and by the message box task fields.
  function RecPickDlg({ md }) {
    const S = A.S; const [sel, setSel] = useState(md.picked ? md.picked.slice() : []); const [as, setAs] = useState('link');
    const done = () => {
      if (md.onPick) md.onPick(sel);
      else if (as === 'copy' && A._addRealFiles) { A._addRealFiles(sel.map((k) => { const d = A.docOf(k); return { name: d.name, size: d.size, type: d.ext.toUpperCase() }; })); A.snack(sel.length + (sel.length === 1 ? ' document' : ' documents') + ' from ASPEN ready to send.'); }
      else A.set((s) => { sel.forEach((k) => { if (!s.pendingLinks.includes(k) && s.pendingLinks.length < 10) s.pendingLinks.push(k); }); });
      A.set({ modal: null });
    };
    const n = md.onPick ? sel.length : sel.filter((k) => !S.pendingLinks.includes(k)).length;
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg recdlg" role="dialog" aria-label=${md.title || 'Attach from ASPEN'}>
      <div className="dh"><b>${md.title || 'Attach from ASPEN'}</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div>
      <div className="db"><${RecBrowser} initKind=${md.kind} picked=${sel} convId=${md.convId || S.convId} onToggle=${(k) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])} /></div>
      <div className="df"><span style=${{ flex: 1, color: 'var(--fg2)', fontSize: 12.5 }}>${sel.length ? sel.length + ' selected' : 'Pick one or more'}</span><button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button>
        <button className="btn pri" disabled=${!md.onPick && !(as === 'copy' ? sel.length : n)} onClick=${done}>${md.onPick ? 'Done' : 'Attach ' + (as === 'copy' ? sel.length || '' : n || '') + ((as === 'copy' ? sel.length : n) === 1 ? ' item' : ' items')}</button></div></div></div>`;
  }
  const SModal0 = A.SModal;
  A.SModal = function SModal() { const md = A.S.modal; return md.type === 's-recpick' ? html`<${RecPickDlg} md=${md} />` : html`<${SModal0} />`; };

  // ---------- attach: upload from this PC ----------
  const size = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  A.uploadFromPC = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
    inp.onchange = () => { const fl = [...inp.files].map((f) => ({ name: f.name, size: size(f.size), type: ((f.name.split('.').pop() || 'file').slice(0, 4)).toUpperCase() }));
      if (fl.length && A._addRealFiles) { A._addRealFiles(fl); A.snack(fl.length + (fl.length === 1 ? ' file' : ' files') + ' ready to send. Add a note and press Send.'); } };
    inp.click();
  };

  // ---------- My Work removed: anything that pointed there opens chats with open work ----------
  const go0 = A.go;
  A.go = (section) => { if (section === 'mywork') { go0('inbox'); A.set({ chatFilter: 'work' }); } else go0(section); };
  if (A.S.section === 'mywork') A.S.section = 'inbox';
  A.S.max = true; // open full-size so the chat has room
  A.newTask = () => A.set({ pop: null, modal: { type: 'task', wtype: 'task', ctxConv: A.S.section === 'inbox' || A.S.section === 'chat' ? A.S.convId : null } });

  // ---------- video calls removed: every call is a voice call ----------
  const start0 = A.startCall; A.startCall = (id, video, huddle) => start0(id, false, huddle);
  const answer0 = A.answer; A.answer = (t) => answer0(t, false);
  A.demoCall = () => { if (A.S.call) return A.snack('End your current call first'); A.set(() => A.toast({ kind: 'call', from: 'u5', video: false, ctx: 'DEAL 7741' })); };
  A.CALLS.forEach((x) => { if (x.kind === 'Video') x.kind = 'Voice'; });

  // ---------- Teams-style app bar ----------
  A.AppRail = function AppRail() {
    const S = A.S, un = A.unreadTotals(), notes = (S.notes || []).filter((x) => !x.read).length, missed = A.CALLS.filter((x) => x.dir === 'missed').length;
    const sec = S.section === 'chat' ? 'inbox' : S.section, act = !!(S.panel && S.panel.type === 'notes');
    const item = (l, ic, b, on, fn, tip) => html`<button className=${'ri' + (on ? ' on' : '')} title=${tip || l} aria-label=${tip || l} aria-current=${on ? 'page' : undefined} onClick=${fn}><${I} n=${ic} s="20" /><span>${l}</span>${b ? html`<span className="badge">${b > 99 ? '99+' : b}</span>` : null}</button>`;
    return html`<nav className="rail apprail" aria-label="Apps">
      ${item('Activity', 'bell', notes, act, () => A.set({ panel: act ? null : { type: 'notes' } }), 'Activity and notifications')}
      ${item('Chat', 'chat', un.chat, sec === 'inbox' && !act, () => A.go('inbox'))}
      ${item('Calls', 'calls', missed, sec === 'calls', () => A.go('calls'), 'Calls and call history')}
      ${item('People', 'people', 0, sec === 'people', () => A.go('people'), 'People and teams')}
      ${item('Bookmarks', 'saved', 0, sec === 'saved', () => A.go('saved'), 'Bookmarked messages')}
      <span className="sp"></span>
      ${item('Help', 'help', 0, false, () => A.set({ tour: 0 }), 'Take the quick tour')}
      ${item('Settings', 'settings', 0, sec === 'settings' || sec === 'admin', () => A.go('settings'))}</nav>`;
  };

  // ---------- Task details, Teams/Planner style: same contents, cleaner layout ----------
  const STEPS = { task: ['Discussed', 'Task created', 'Assigned', 'In progress', 'Done'], approval: ['Discussed', 'Requested', 'Routed', 'Decision', 'Notified'], request: ['Discussed', 'Requested', 'Accepted', 'Fulfilled', 'Notified'] };
  const stepAt = (w) => w.type === 'task' ? (w.status === 'Done' ? 5 : w.status === 'In progress' ? 3 : w.owner ? 2 : 1) : A.isClosed(w) ? 5 : 2;
  const person = (u) => A.USERS[u] ? html`<span className="tdperson"><${A.Av} u=${u} size="24" pres=${false} /><span>${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</span></span>` : html`<span>${A.uname(u)}</span>`;
  const Row = ({ ic, label, children }) => html`<div className="tdrow"><span className="tdic"><${I} n=${ic} s="16" /></span><div className="tdf"><small>${label}</small><div className="tdv">${children}</div></div></div>`;
  A.ItemPanel = function ItemPanel({ id }) {
    const S = A.S, w = A.WORK.find((x) => x.id === id); const [reason, setReason] = useState(''); const [rej, setRej] = useState(false);
    if (!w) return null;
    const t = A.TYPES[w.type], at = stepAt(w), closed = A.isClosed(w);
    const canDecide = !closed && w.type === 'approval' && w.approver === A.ME;
    const canWork = !closed && w.type !== 'approval' && w.owner === A.ME;
    const canManage = S.perms.manageWork;
    const canReassign = !closed && (canManage || w.requester === A.ME);
    const who = w.type === 'approval' ? w.approver : w.owner;
    const done = w.type === 'task' && w.status === 'Done';
    return html`<div className="panel tdp" style=${{ width: 380 }}>
      <div className="tdhd"><span className="tdtype" style=${{ '--tc': t.color }}><${A.Shape} type=${w.type} size="12" />${t.label}</span><${A.WNo} w=${w} /><span className="grow"></span>
        <button className="ib" aria-label="Close" title="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div>
      <div className="pbd tdbody">
        <div className="tdtitle">${w.type === 'task' ? html`<button className=${'tdchk' + (done ? ' on' : '')} disabled=${!canWork && !done} title=${done ? 'Done' : 'Mark done'} aria-label=${done ? 'Done' : 'Mark done'} onClick=${() => canWork && A.setStatus(w, 'Done')}><${I} n="check" s="12" /></button>` : null}<h2 className=${done ? 'done' : ''}>${w.title}</h2></div>
        <div className="tdpills"><${A.Pill} w=${w} /><span className=${'pill' + (w.priority === 'High' ? ' r' : '')}>${w.priority} priority</span>${w.workflow ? html`<span className="pill">${w.workflow}</span>` : null}</div>
        <ol className="tdsteps" aria-label=${'Progress: ' + (STEPS[w.type][Math.min(at, 4)])}>${STEPS[w.type].map((s, i) => html`<li className=${i < at ? 'done' : i === at ? 'cur' : ''}><i></i><span>${s}</span></li>`)}</ol>
        ${canDecide ? rej ? html`<div className="tdact col"><label htmlFor="rj">Reason for rejecting <span>(required, the requester sees it)</span></label><textarea id="rj" value=${reason} onChange=${(e) => setReason(e.target.value)} placeholder="Why are you rejecting this?"></textarea><div className="tdbtns"><button className="btn dan" disabled=${!reason.trim()} onClick=${() => { A.decide(w, 'Rejected', reason); setRej(false); }}>Reject</button><button className="btn" onClick=${() => setRej(false)}>Cancel</button></div></div>`
          : html`<div className="tdact"><button className="btn pri" onClick=${() => A.decide(w, 'Approved')}><${I} n="check" s="12" />Approve</button><button className="btn" onClick=${() => setRej(true)}>Reject…</button></div>` : null}
        ${canWork ? html`<div className="tdact">${w.type === 'request' ? html`<button className="btn pri" onClick=${() => A.decide(w, 'Fulfilled')}><${I} n="check" s="12" />Mark fulfilled</button>` : html`${w.status === 'Open' ? html`<button className="btn" onClick=${() => A.setStatus(w, 'In progress')}>Start</button>` : null}<button className="btn pri" onClick=${() => A.setStatus(w, 'Done')}><${I} n="check" s="12" />Mark done</button>`}</div>` : null}
        <div className="tdfields">
          <${Row} ic="people" label=${w.type === 'approval' ? 'Approver' : 'Assigned to'}>${canReassign
            ? html`<label className="tdpick" title="Reassign">${who && A.USERS[who] ? html`<${A.Av} u=${who} size="24" pres=${false} />` : null}<select id="ra" aria-label="Reassign" value=${who || ''} onChange=${(e) => A.reassign(w, e.target.value)}><option value="" disabled>Unassigned</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</option>`)}</select><${I} n="down" s="12" /></label>`
            : person(who)}</${Row}>
          <${Row} ic="adduser" label="Requested by">${person(w.requester)}</${Row}>
          <${Row} ic="clock" label="Due"><span style=${{ color: A.isOverdue(w) ? 'var(--red)' : undefined, fontWeight: A.isOverdue(w) ? 600 : undefined }}>${A.dueLabel(w)}${A.isOverdue(w) ? ' · overdue' : ''}</span></${Row}>
          ${w.amount ? html`<${Row} ic="ticket" label="Amount">${w.amount}</${Row}>` : null}
          ${w.rule ? html`<${Row} ic="shield" label="Rule">${w.rule}</${Row}>` : null}
          <${Row} ic="record" label="ASPEN records"><${A.RecField} value=${w.recs || (w.rec ? [w.rec] : [])} convId=${w.conv} onChange=${(r) => A.set(() => { w.recs = r; w.rec = r[0] || null; })} /></${Row}>
          ${w.conv && A.conv(w.conv) ? html`<${Row} ic="chat" label="Discussed in"><button className="link" onClick=${() => { A.openConv(w.conv); A.set({ section: 'inbox', panel: { type: 'item', id: w.id } }); }}>${A.convName(A.conv(w.conv))}</button></${Row}>` : null}
          ${w.reason ? html`<${Row} ic="info" label="Reason">${w.reason}</${Row}>` : null}</div>
        ${!canManage && !canDecide && !canWork && w.requester !== A.ME ? html`<p className="tdnote">You can see this item. Only the owner, the requester or someone with Manage Work can change it.</p>` : null}
        <div className="tdmore">${A.ItemExtras ? html`<${A.ItemExtras} w=${w} />` : null}${A.SnoozeBtn ? html`<${A.SnoozeBtn} w=${w} />` : null}</div>
        <details className="tdhist"><summary><${I} n="down" s="12" />Activity <span>${w.history.length}</span></summary><div className="hist">${w.history.slice().reverse().map((h) => html`<div><b>${A.uname(h.who)}</b> ${h.text}<small>${A.fmtList(h.t) === A.fmtTime(h.t) ? A.fmtTime(h.t) : A.fmtList(h.t) + ' ' + A.fmtTime(h.t)}</small></div>`)}</div></details>
      </div></div>`;
  };
  A.set({});
})();
