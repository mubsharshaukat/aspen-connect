// Two-way sync with ASPEN:
// - every record opens as an ASPEN form; status changes in ASPEN post to the record's conversation
// - decisions and tasks in Messaging update the ASPEN record (e.g. PO approved -> stator line "On order")
// - Messaging knows which ASPEN record is on screen (context bar, Assist uses it)
// - Universal Search, the Dashboard and the status-bar location are wired to Messaging
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const ME = () => A.USERS[A.ME].name;

  // ---------- ASPEN record data ----------
  const RO = A.RECORDS['RO 48213'];
  RO.lines = [
    { n: 1, code: 'LABOR', desc: 'Diagnose charging system', qty: '1.0', status: 'Done', amt: '$129.00' },
    { n: 2, code: '4014029', desc: 'Stator assembly', qty: '1', status: 'Backordered', amt: '$642.40' },
    { n: 3, code: 'LABOR', desc: 'Replace stator', qty: '2.4', status: 'Pending', amt: '$415.00' }];
  A.RECORDS['PO 1234'].lines = [{ n: 1, code: '4014029', desc: 'Stator assembly', qty: '1', status: 'Awaiting approval', amt: '$642.40' }, { n: 2, code: '0453318', desc: 'Regulator / rectifier', qty: '1', status: 'Awaiting approval', amt: '$289.95' }, { n: 3, code: '…', desc: '4 more lines', qty: '', status: '', amt: '$1,547.65' }];
  const STATUSES = { RO: ['Open', 'In progress', 'Waiting on parts', 'Ready for pickup', 'Closed'], DEAL: ['Working', 'Pending F&I', 'Contracted', 'Delivered'], PO: ['Draft', 'Awaiting approval', 'Approved', 'Ordered', 'Received'], UNIT: ['In stock', 'Sold - pending', 'Delivered'], WAR: ['Draft', 'Submitted', 'Approved', 'Paid'] };
  const tone = (s) => /closed|delivered|received|approved|ready|paid|posted|done/i.test(s) ? 'g' : /wait|awaiting|pending|backorder|draft/i.test(s) ? 'a' : 'b';

  const recConv = (k) => { let c = A.conv('rec-' + k); if (!c) { c = { id: 'rec-' + k, kind: 'record', rec: k, unread: 0, members: [A.ME], msgs: [] }; A.CONVS.push(c); } return c; };
  const note = (k, text) => { const c = recConv(k); c.msgs.push({ id: A.nextId(), kind: 'sys', t: Date.now(), text, reactions: {}, thread: [] }); if (A.S.convId !== c.id) c.unread = (c.unread || 0) + 1; };

  // ASPEN -> Messaging
  A.recordStatus = (k, st, who) => A.set(() => {
    const r = A.RECORDS[k]; if (!r || r.status === st) return; const old = r.status; r.status = st; r.tone = tone(st);
    note(k, (who === 'sys' ? 'ASPEN' : who ? A.uname(who) : 'You') + ' changed the status in ASPEN: ' + old + ' → ' + st);
  });

  // Messaging -> ASPEN
  const decide0 = A.decide;
  A.decide = (w, status, reason, who) => {
    decide0(w, status, reason, who);
    if (!w.rec || !A.RECORDS[w.rec]) return;
    A.set(() => {
      if (w.rec === 'PO 1234' && status === 'Approved') {
        A.RECORDS['PO 1234'].status = 'Ordered'; A.RECORDS['PO 1234'].tone = 'g';
        A.RECORDS['PO 1234'].lines.forEach((l) => { if (l.status) l.status = 'Ordered'; });
        const line = RO.lines[1]; line.status = 'On order, ETA Tue';
        note('PO 1234', 'Approved by ' + (who ? A.uname(who) : ME()) + ' in Messaging. ASPEN sent the order to Polaris.');
        note('RO 48213', 'PO 1234 approved. Stator 4014029 is on order (ETA Tue). The RO line was updated in ASPEN.');
      } else if (status === 'Approved' || status === 'Rejected') {
        note(w.rec, w.title + ': ' + status.toLowerCase() + ' by ' + (who ? A.uname(who) : ME()) + ' in Messaging' + (reason ? ' (' + reason + ')' : '') + '.');
      }
    });
  };
  const setStatus0 = A.setStatus;
  A.setStatus = (w, status, who) => { setStatus0(w, status, who); if (w.rec && A.RECORDS[w.rec] && status === 'Done') A.set(() => note(w.rec, 'Task done: ' + w.title + ' (' + (who ? A.uname(who) : ME()) + ').')); };

  // ---------- which ASPEN record is on screen ----------
  A.aspenRecord = () => { const v = A.S.aspenView; if (v === 'ro') return 'RO 48213'; if (v && v.startsWith('rec:') && A.RECORDS[v.slice(4)]) return v.slice(4); return null; };
  A.openInAspen = (k) => A.set({ aspenShown: true, aspenView: k === 'RO 48213' ? 'ro' : 'rec:' + k });
  const NOFORM = ['COPY', 'WEB', 'IMG', 'FILE', 'RPT', 'RPKG'];
  const openLink0 = A.openLink;
  A.openLink = (k) => { const r = A.RECORDS[k]; if (!r || NOFORM.includes(r.kind) || A.S.mobile) return openLink0(k); A.openInAspen(k); A.snack('Opened ' + k + ' in ASPEN.'); };
  const parse0 = A.aiParse;
  A.aiParse = (text, ctx) => parse0(text, Object.assign({}, ctx, { rec: (ctx && ctx.rec) || A.aspenRecord() || undefined }));

  // ---------- ASPEN form for any record ----------
  A.AspenRecordForm = function AspenRecordForm({ k }) {
    const r = A.RECORDS[k], kk = A.RECKIND[r.kind], c = A.conv('rec-' + k);
    const n = c ? c.msgs.filter((m) => m.from).length : 0, work = A.WORK.filter((w) => w.rec === k && !A.isClosed(w));
    const last = c && [...c.msgs].reverse().find((m) => m.text);
    const sts = STATUSES[r.kind] || [r.status];
    return html`<div className="form">
      <div className="ftitle"><span className="recband" style=${{ background: kk.color, width: 18, height: 18, fontSize: 7 }}>${r.kind}</span><b>${kk.label} ${r.id}</b><span style=${{ color: 'var(--fg2)' }}>· ${r.title}</span>${k === 'RO 48213' && A.LockNote ? html`<${A.LockNote} />` : null}<span className="grow"></span><button className="ib" style=${{ width: 22, height: 22 }} aria-label="Close" onClick=${() => A.set({ aspenView: 'dashboard' })}><${I} n="close" s="12" /></button></div>
      <div className="fbar"><button className="btn sm ghost"><${I} n="files" />Save</button><button className="btn sm ghost">Print</button><span className="tsep"></span>
        <label className="fstatus">Status <select id=${'st-' + k} value=${sts.includes(r.status) ? r.status : ''} onChange=${(e) => A.recordStatus(k, e.target.value)}>${!sts.includes(r.status) ? html`<option value="">${r.status}</option>` : null}${sts.map((s) => html`<option>${s}</option>`)}</select></label>
        <span className="grow"></span><span className=${'pill ' + r.tone}>${r.status}</span>
        <button className="btn sm" title="Attach this record to a message" onClick=${() => A.sendFromAspen(k)}><${I} n="send" />Send Message</button>
        <button className="btn sm pri" onClick=${() => { A.openRecordConv(k); A.set({ connect: 'docked' }); }}><${I} n="chat" />Discuss (${n})${c && c.unread ? ' •' : ''}</button></div>
      <div className="aspenbody"><div style=${{ flex: 1, minWidth: 0 }}>
        <div className="fgrid">${r.fields.map(([a, b]) => html`<label>${a}</label><div className="v" style=${{ display: 'flex', justifyContent: 'space-between' }}>${b}${a === 'Advisor' && b === 'Dana Ortiz' ? html`<button className="link" style=${{ fontSize: 11.5 }} onClick=${() => A.dmWith('u2')}>Message</button>` : null}</div>`)}</div>
        ${r.lines ? html`<div className="lines"><table><thead><tr><th>Line</th><th>Part / Labor</th><th>Description</th><th>Qty</th><th>Status</th><th style=${{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>${r.lines.map((l) => html`<tr><td>${l.n}</td><td>${l.code}</td><td>${l.desc}</td><td>${l.qty}</td><td>${l.status ? html`<span className=${'pill ' + tone(l.status)}>${l.status}</span>` : ''}</td><td style=${{ textAlign: 'right' }}>${l.amt}</td></tr>`)}</tbody></table></div>` : null}</div>
        <aside className="msgside" aria-label="From Messaging"><div className="msgsideh"><${I} n="chat" s="12" />From Messaging</div>
          ${work.length ? work.map((w) => html`<button className="msgwork" onClick=${() => { A.set((s) => { if (s.connect === 'closed') s.connect = 'docked'; }); A.openItem(w.id); }}><${A.Shape} type=${w.type} /><span style=${{ flex: 1, minWidth: 0 }}><b>${w.title}</b><small>${A.uname(w.type === 'approval' ? w.approver : w.owner)} · ${A.dueLabel(w)}</small></span><${A.Pill} w=${w} /></button>`) : html`<div className="msgnone">No open tasks or approvals on this ${kk.label.toLowerCase()}.</div>`}
          ${last ? html`<div className="msglast"><small>Latest in its conversation</small><div>${A.USERS[last.from] ? html`<b>${A.USERS[last.from].name.split(' ')[0]}:</b> ` : null}${last.text.slice(0, 120)}</div></div>` : null}
          <button className="btn sm" style=${{ width: '100%', justifyContent: 'center' }} onClick=${() => { A.openRecordConv(k); A.set({ connect: 'docked' }); }}>${c ? 'Open conversation' : 'Start a conversation'}</button></aside></div>
    </div>`;
  };
  A.ROForm = function ROForm() { return html`<${A.AspenRecordForm} k="RO 48213" />`; };

  // ---------- Dashboard with live numbers ----------
  A.DashLive = function DashLive() {
    const need = A.needsMe(), un = A.unreadTotals(), cnt = A.counts();
    const ros = Object.keys(A.RECORDS).filter((k) => A.RECORDS[k].kind === 'RO'), waiting = ros.filter((k) => /waiting/i.test(A.RECORDS[k].status)).length;
    const recent = A.CONVS.filter((c) => c.kind === 'record').sort((a, b) => (A.lastMsg(b) || { t: 0 }).t - (A.lastMsg(a) || { t: 0 }).t).slice(0, 5);
    return html`<div className="dash"><h1>Good morning, ${A.USERS[A.ME].name.split(' ')[0]}</h1><p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${A.S.location === 'All locations' ? '01 - Main Location' : A.S.location}</p>
      <div className="tiles">
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.go('inbox')}><b style=${{ color: 'var(--orange)' }}>${need.length}</b><span>Waiting on you in Messaging · ${cnt.approvals} approvals</span></button>
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.go('mywork')}><b style=${{ color: cnt.overdue ? 'var(--red)' : undefined }}>${cnt.overdue}</b><span>Overdue work items</span></button>
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.go('inbox')}><b>${un.chat}</b><span>Unread messages</span></button>
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.openInAspen('RO 48213')}><b>${12 + ros.length}</b><span>Open repair orders · ${waiting + 2} waiting on parts</span></button></div>
      <h3 className="dashh">Records being discussed</h3>
      <div className="dashlist">${recent.map((c) => { const r = A.RECORDS[c.rec], last = A.lastMsg(c); return html`<button className="dashrow" onClick=${() => A.openInAspen(c.rec)}><span className="recband" style=${{ background: A.RECKIND[r.kind].color }}>${r.kind}</span><span style=${{ flex: 1, minWidth: 0 }}><b>${c.rec} · ${r.title}</b><small>${last && last.text ? last.text.slice(0, 80) : ''}</small></span><span className=${'pill ' + r.tone}>${r.status}</span>${c.unread ? html`<span className="badge">${c.unread}</span>` : null}</button>`; })}</div></div>`;
  };
  A.AspenView = function AspenView() { const k = A.aspenRecord(); return k ? html`<${A.AspenRecordForm} k=${k} />` : html`<${A.DashLive} />`; };

  // ---------- context bar in Messaging ----------
  A.CtxBar = function CtxBar() {
    const S = A.S, k = A.aspenRecord(); if (!k || S.mobile || S.ctxOff === k) return null;
    const r = A.RECORDS[k], c = A.conv('rec-' + k), viewing = S.convId === 'rec-' + k;
    return html`<div className="ctxbar" role="status"><span className="recband" style=${{ background: A.RECKIND[r.kind].color, width: 26, height: 26 }}>${r.kind}</span>
      <span style=${{ minWidth: 0 }}>In ASPEN you're viewing <b>${k} · ${r.title}</b> <span className=${'pill ' + r.tone}>${r.status}</span></span><span className="grow"></span>
      ${!viewing ? html`<button className="btn sm" onClick=${() => A.openRecordConv(k)}><${I} n="chat" s="12" />${c ? 'Open its conversation' : 'Start a conversation'}</button>` : null}
      <button className="btn sm" onClick=${() => A.set((s) => { if (!s.pendingLinks.includes(k)) s.pendingLinks.push(k); })}><${I} n="attach" s="12" />Attach to message</button>
      <button className="btn sm" onClick=${() => A.set({ modal: { type: 'task', wtype: 'task', c: { rec: k } } })}><${A.Shape} type="task" />New task on it</button>
      <button className="ib" aria-label="Hide" title="Hide for this record" onClick=${() => A.set({ ctxOff: k })}><${I} n="close" s="12" /></button></div>`;
  };

  // ---------- Universal Search and location ----------
  A.universalSearch = (q) => {
    const ql = q.toLowerCase();
    const key = Object.keys(A.RECORDS).find((k) => !NOFORM.includes(A.RECORDS[k].kind) && (k.toLowerCase().includes(ql) || A.RECORDS[k].title.toLowerCase().includes(ql) || A.RECORDS[k].id.toLowerCase() === ql));
    if (key) { A.openInAspen(key); A.snack('Opened ' + key + ' in ASPEN. Its conversation and work are linked in Messaging.'); }
    else { A.set((s) => { s.q = q; s.section = 'inbox'; if (s.connect === 'closed') s.connect = 'open'; }); A.snack('No ASPEN record matched "' + q + '". Showing Messaging results.'); }
  };
  A.switchLocation = () => { const L = A.LOCATIONS, cur = A.S.location === 'All locations' ? L[0] : A.S.location, next = L[(L.indexOf(cur) + 1) % L.length]; A.set({ location: next }); A.snack('ASPEN location is now ' + next + '. Messaging follows it.'); };
  A.S.aspenView = 'ro'; A.S.location = A.LOCATIONS[0];
  A.set({});
})();
