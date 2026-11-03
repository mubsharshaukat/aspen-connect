// Gaps found against the old ASPEN Messaging (ChatConsole.vb, Console.vb, DrilldownConstants.vb):
// every drill-down link type, copy/web links, stored images and files, doc-lock "send message",
// integration and utility messages from System, the tray icon and its combined "new messages / new tasks" balloon.
(function () {
  const A = window.A, html = A.html, I = A.Icon;

  // ---------- all 30 DrilldownConstants link types ----------
  Object.assign(A.RECKIND, {
    ASL: { label: 'ASL Transaction', color: 'var(--parts)' }, PTR: { label: 'Part Transaction', color: 'var(--parts)' }, PA: { label: 'Part Analysis', color: 'var(--parts)' },
    PCL: { label: 'Part Count List', color: 'var(--parts)' }, SHELF: { label: 'Part Shelving', color: 'var(--parts)' }, RCPT: { label: 'Parts Receipt', color: 'var(--parts)' },
    UORD: { label: 'Unit Order', color: 'var(--units)' }, UTRF: { label: 'Unit Transfer', color: 'var(--units)' }, UTPL: { label: 'Unit Template', color: 'var(--units)' },
    RCU: { label: 'Unit Receipt', color: 'var(--units)' }, DEPR: { label: 'Depreciation Posting', color: 'var(--acct)' }, JE: { label: 'Journal Entry', color: 'var(--acct)' },
    VCH: { label: 'Voucher', color: 'var(--acct)' }, CHK: { label: 'Check Run', color: 'var(--acct)' }, SVC: { label: 'Service Charge', color: 'var(--acct)' },
    VEND: { label: 'Vendor', color: 'var(--cust)' }, WAR: { label: 'Warranty Claim', color: 'var(--service)' }, NOTE: { label: 'Note', color: '#69797e' },
    COMM: { label: 'Communication', color: '#69797e' }, RPKG: { label: 'Report Package', color: '#69797e' }, IMG: { label: 'Image', color: '#8764b8' },
    FILE: { label: 'File', color: '#8764b8' }, COPY: { label: 'Copy to clipboard', color: '#605e5c' }, WEB: { label: 'Web link', color: 'var(--accent)' },
  });
  const R = (k, kind, id, title, status, fields) => { A.RECORDS[k] = { kind, id, title, status: status || 'Open', tone: 'g', fields: fields || [] }; };
  R('ASL 88120', 'ASL', '88120', 'ASL transfer to Lakeside', 'Posted'); R('PTR 551204', 'PTR', '551204', 'Sale of 4014029', 'Posted');
  R('PA 10-26', 'PA', '10-26', 'Stocking analysis, Polaris', 'Ready'); R('PCL 31', 'PCL', '31', 'Cycle count, aisle B', 'Counting');
  R('SHELF 12', 'SHELF', '12', 'Shelving list, Polaris truck', 'Open'); R('RCPT 7712', 'RCPT', '7712', 'Polaris receipt, 6 lines', 'Received');
  R('UORD 4410', 'UORD', '4410', 'Can-Am stock order, 4 units', 'Ordered'); R('UTRF 302', 'UTRF', '302', 'Maverick X3 to Lakeside', 'In transit');
  R('UTPL 18', 'UTPL', '18', 'RZR XP 1000 template', 'Active'); R('RCU 990', 'RCU', '990', 'Can-Am unit receipt', 'Received');
  R('DEPR 2026-10', 'DEPR', '2026-10', 'Rental fleet depreciation, Oct', 'Posted'); R('JE 40213', 'JE', '40213', 'Floor plan payoff', 'Posted');
  R('VCH 18830', 'VCH', '18830', 'Polaris invoice 556120', 'Open'); R('CHK 221', 'CHK', '221', 'Weekly AP check run', 'Printed');
  R('SVC 2026-10', 'SVC', '2026-10', 'October service charges', 'Calculated'); R('VEND Polaris', 'VEND', '114', 'Polaris Industries', 'Active');
  R('WAR 3391', 'WAR', '3391', 'Stator warranty, RO 48213', 'Submitted'); R('NOTE 9021', 'NOTE', '9021', 'Customer called about ETA', 'Note');
  R('COMM 5510', 'COMM', '5510', 'Text to Harlan Pruitt', 'Sent'); R('RPKG Month-end', 'RPKG', 'ME', 'Month-end report package', 'Ready');
  R('IMG stator-photo', 'IMG', '1182', 'stator-burn.jpg (stored on RO 48213)', 'Image'); R('FILE warranty-form', 'FILE', '1183', 'polaris-warranty-form.pdf', 'File');
  R('COPY VIN', 'COPY', '3NSRAE99XMF014417', 'VIN 3NSRAE99XMF014417', 'Copy'); R('WEB Polaris parts', 'WEB', 'https://www.polaris.com', 'Polaris dealer parts lookup', 'Link');

  const open0 = A.openLink;
  A.openLink = (k) => {
    const r = A.RECORDS[k]; if (!r) return;
    if (r.kind === 'COPY') { try { navigator.clipboard.writeText(r.id); } catch (e) {} return A.snack('Copied ' + r.title + ' to the clipboard'); }
    if (r.kind === 'WEB') return A.snack('Opening ' + r.id + ' in your browser…');
    if (r.kind === 'IMG' || r.kind === 'FILE') return A.set({ modal: { type: 'preview', f: { name: r.title.split(' (')[0], size: r.kind === 'IMG' ? '1.8 MB' : '220 KB', type: r.kind === 'IMG' ? 'JPG' : 'PDF' } } });
    if (r.kind === 'RPKG') return A.snack('Opening ' + r.title + ' in Reports…');
    return open0(k);
  };

  // ---------- System messages from integrations, utilities and ASPEN itself ----------
  const sys = A.conv('sys'), t = Date.now();
  if (sys) {
    sys.msgs.push(
      { id: 'sx1', kind: 'note', t: t - 9 * 3600000, text: 'Polaris API price update finished: 4,182 parts updated, 3 rejected. See the log for the rejected part numbers.', links: ['FILE warranty-form'], reactions: {}, thread: [] },
      { id: 'sx2', kind: 'note', t: t - 8 * 3600000, text: 'DealerSpike upload finished: 18 units sent, 0 errors.', reactions: {}, thread: [] },
      { id: 'sx3', kind: 'note', t: t - 3 * 3600000, text: 'Parts have been received for INV 220981. It was open for editing, so it was skipped. Close it and receive again.', links: ['INV 220981'], reactions: {}, thread: [] },
      { id: 'sx4', kind: 'note', t: t - 2 * 3600000, text: 'Scheduled message (ASPEN SendMsg): Month-end close starts Friday 6 PM. Post all ROs by 5 PM.', links: ['RPKG Month-end'], reactions: {}, thread: [] });
    sys.msgs.sort((a, b) => a.t - b.t);
  }

  // ---------- Doc lock: message the person who has the record open (DocLockManageDlg "Send Message") ----------
  A.LockNote = function LockNote() {
    return html`<span className="locknote"><${I} n="lock" s="12" />Open for editing by Dana Ortiz since 9:12 AM
      <button className="link" onClick=${() => { A.dmWith('u2'); A.drafts['dm-u2'] = 'You have RO 48213 open for editing. Can you close it so I can update the parts?'; A.set({ pendingLinks: ['RO 48213'] }); }}>Send Message</button></span>`;
  };

  // ---------- Tray icon and the combined balloon ("You have 2 new messages, 1 new task") ----------
  A.S.trayNew = { msgs: 0, tasks: 0 };
  const balloon = () => {
    const S = A.S, n = S.trayNew; if (S.connect !== 'closed' || (!n.msgs && !n.tasks)) return;
    const parts = []; if (n.msgs) parts.push(n.msgs + ' new message' + (n.msgs > 1 ? 's' : '')); if (n.tasks) parts.push(n.tasks + ' new task' + (n.tasks > 1 ? 's' : ''));
    S.toasts = S.toasts.filter((x) => x.kind !== 'tray');
    A.toast({ kind: 'tray', text: 'You have ' + parts.join(' and ') });
  };
  const arrive0 = A.arrive;
  A.arrive = (c, m) => { arrive0(c, m); if (A.S.connect === 'closed') { A.S.trayNew.msgs++; balloon(); } };
  A.demoTaskForMe = () => A.set(() => {
    const w = { id: A.nextId(), type: 'task', title: 'Sign the warranty claim for RO 48230', owner: A.ME, requester: 'u2', due: Date.now() + 3 * 3600000, status: 'Open', priority: 'Normal', rec: 'RO 48230', conv: 'team-service', history: [{ t: Date.now(), who: 'u2', text: 'Created and assigned to you' }], no: 'T-' + (1100 + A.WORK.length) };
    A.WORK.unshift(w); A.conv('team-service').msgs.push({ id: A.nextId(), kind: 'work', work: w.id, act: 'created', t: Date.now(), reactions: {}, thread: [] });
    if (A.S.connect === 'closed') { A.S.trayNew.tasks++; balloon(); } else A.toast({ kind: 'msg', conv: 'team-service', from: 'u2', text: 'New task for you: ' + w.title });
  });
  const WinToast0 = A.WinToast;
  A.WinToast = function WinToast({ t }) {
    if (t.kind !== 'tray') return html`<${WinToast0} t=${t} />`;
    const go = () => { const n = A.S.trayNew; A.dismiss(t.id); A.set((s) => { s.trayNew = { msgs: 0, tasks: 0 }; }); if (!n.msgs && n.tasks) A.go('mywork'); else A.go('inbox'); };
    return html`<div className="wtoast" role="button" tabIndex="0" style=${{ cursor: 'pointer' }} onClick=${go}><div className="th"><span className="logo" style=${{ width: 14, height: 14, borderRadius: 3, background: '#3a9a3e' }}></span>ASPEN Messaging for MUBASHIR<span className="grow"></span><button onClick=${(e) => { e.stopPropagation(); A.dismiss(t.id); }} aria-label="Dismiss"><${I} n="close" s="12" /></button></div><b>${t.text}</b><div style=${{ color: 'var(--fg2)', marginTop: 4 }}>Click to open ${A.S.trayNew.msgs ? 'your Inbox' : 'My Work'}.</div></div>`;
  };
  A.Tray = function Tray() {
    const S = A.S, total = A.unreadTotals().chat + A.needsMe().length;
    return html`<button className="trayicon" title=${'ASPEN Messaging · ' + total + ' waiting. Double-click to open.'} onDoubleClick=${() => A.go('inbox')} onClick=${(e) => e.stopPropagation()}><${I} n="chat" s="12" />${total ? html`<b>${total}</b>` : null}</button>`;
  };
  A.set({});
})();
