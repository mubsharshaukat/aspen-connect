// Work items from the deck: Task = responsibility, Approval = decision, Request = ask of another team.
// Each one can be born in a conversation and is visible there and in My Work / Work Console.
(function () {
  const A = window.A;
  const H = 3600000, now = Date.now();
  const at = (dayOffset, h, m) => { const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
  A.TYPES = {
    message: { label: 'Message', shape: 'circle', color: 'var(--fg3)' },
    task: { label: 'Task', shape: 'square', color: 'var(--accent)' },
    approval: { label: 'Approval', shape: 'diamond', color: 'var(--orange)' },
    request: { label: 'Request', shape: 'triangle', color: 'var(--settings)' },
    status: { label: 'Workflow', shape: 'bar', color: '#69797e' },
  };
  const hist = (t, who, text) => ({ t, who, text });
  A.WORK = [
    { id: 'w1', type: 'approval', title: 'Approve parts order PO 1234', amount: '$2,480.00', requester: 'u4', approver: 'u1', owner: 'u1', due: at(-1, 17), status: 'Pending', priority: 'High', rec: 'PO 1234', conv: 'dm-u3', workflow: 'Parts order approval', rule: 'Orders over $1,500 need a manager',
      history: [hist(now - 26 * 60000, 'u4', 'Requested approval from Parts order approval workflow'), hist(now - 25 * 60000, 'sys', 'Routed to Mubshar Shaukat')] },
    { id: 'w2', type: 'task', title: 'Review backordered item 4014029', owner: 'u1', requester: 'bot', due: now + 5 * H, status: 'Open', priority: 'Normal', rec: 'PART 4014029', conv: 'rec-RO 48213', workflow: 'Backorder notification',
      history: [hist(now - 34 * 60000, 'sys', 'Created by Backorder notification workflow')] },
    { id: 'w3', type: 'request', title: 'Credit exception: Ridgeline Excavating', owner: 'u1', requester: 'u5', due: at(-2, 12), status: 'Pending', priority: 'Normal', rec: null, conv: 'dm-u5', workflow: 'Credit limit alert',
      history: [hist(at(-3, 10), 'u5', 'Asked for a $3,000 credit exception for 30 days')] },
    { id: 'w4', type: 'task', title: 'Call Harlan Pruitt about stator ETA', owner: 'u2', requester: 'u1', due: now + 2 * H, status: 'In progress', priority: 'High', rec: 'RO 48213', conv: 'rec-RO 48213', msgFrom: 'Stator is bad. Part 4014029 is backordered, ETA Tuesday.',
      history: [hist(now - 30 * 60000, 'u1', 'Created from a message in RO 48213'), hist(now - 20 * 60000, 'u2', 'Started')] },
    { id: 'w5', type: 'task', title: 'Schedule PDI for UNIT C4471', owner: 'u1', requester: 'u6', due: at(1, 10), status: 'Open', priority: 'Normal', rec: 'UNIT C4471', conv: 'dm-u6',
      history: [hist(at(-2, 11, 9), 'u6', 'Created from a message in chat with Jess Ramos')] },
    { id: 'w6', type: 'task', title: 'Fix lift 3 grinding noise', owner: 'u1', requester: 'u9', due: at(-1, 16), status: 'Open', priority: 'High', rec: null, conv: 'team-service',
      history: [hist(now - 70 * 60000, 'u9', 'Created from a message in Service Team')] },
    { id: 'w7', type: 'approval', title: 'Approve 3-year service plan on DEAL 7741', amount: '$1,295.00', requester: 'u5', approver: 'u1', owner: 'u1', due: now + 3 * H, status: 'Pending', priority: 'Normal', rec: 'DEAL 7741', conv: 'dm-u5', workflow: 'F&I product approval',
      history: [hist(now - 13 * 60000, 'u5', 'Asked for approval in chat')] },
    { id: 'w8', type: 'task', title: 'Order replacement lift cable', owner: null, requester: 'u2', due: at(2, 12), status: 'Open', priority: 'Normal', rec: null, conv: 'team-parts', history: [hist(at(0, 8), 'u2', 'Created, not assigned yet')] },
    { id: 'w9', type: 'approval', title: 'Approve trade-in value on DEAL 7741', amount: '$8,200.00', requester: 'u6', approver: 'u10', owner: 'u10', due: at(-1, 12), status: 'Pending', priority: 'High', rec: 'DEAL 7741', conv: 'rec-DEAL 7741', workflow: 'Trade appraisal', history: [hist(at(-1, 15, 2), 'u6', 'Requested approval')] },
    { id: 'w10', type: 'task', title: 'Warranty claim photos for RO 48230', owner: 'u9', requester: 'u2', due: now + 4 * H, status: 'Open', priority: 'Normal', rec: 'RO 48230', conv: 'team-service', history: [hist(at(0, 9), 'u2', 'Created')] },
    { id: 'w11', type: 'task', title: 'Update open ROs before inventory', owner: 'u2', requester: 'u1', due: at(-2, 12), status: 'Done', priority: 'Normal', rec: null, conv: 'team-service', history: [hist(at(-3, 9), 'u1', 'Created'), hist(at(-2, 11), 'u2', 'Marked done')] },
    { id: 'w12', type: 'request', title: 'Stock transfer: 2 stators from Lakeside', owner: 'u9', requester: 'u4', due: at(1, 12), status: 'Pending', priority: 'Normal', rec: 'PART 4014029', conv: 'team-parts', workflow: 'Stock transfer', history: [hist(at(0, 10), 'u4', 'Requested transfer from 02 - Lakeside')] },
  ];

  // seed the timelines with work events so items show up where they were born
  A.WORK.forEach((w) => { const c = A.conv(w.conv); if (c) c.msgs.push({ id: 'ev-' + w.id, kind: 'work', work: w.id, act: 'created', t: w.history[0].t, reactions: {}, thread: [] }); });
  A.CONVS.forEach((c) => c.msgs.sort((a, b) => a.t - b.t));

  const closed = (w) => ['Done', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'].includes(w.status);
  A.isClosed = closed;
  A.isOverdue = (w) => !closed(w) && w.due < Date.now();
  A.dueLabel = (w) => {
    const d = new Date(w.due), n = new Date(); const t = A.fmtTime(w.due).replace(':00 ', ' ');
    if (d.toDateString() === n.toDateString()) return 'Today ' + t;
    const y = new Date(); y.setDate(n.getDate() - 1); if (d.toDateString() === y.toDateString()) return 'Yesterday';
    const tm = new Date(); tm.setDate(n.getDate() + 1); if (d.toDateString() === tm.toDateString()) return 'Tomorrow ' + t;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  A.statusTone = (w) => A.isOverdue(w) ? 'r' : w.status === 'Done' || w.status === 'Approved' || w.status === 'Fulfilled' ? 'g' : w.status === 'Rejected' ? 'r' : w.status === 'In progress' ? 'b' : 'a';
  A.statusText = (w) => A.isOverdue(w) ? 'Overdue' : w.status;
  A.mine = (w) => w.owner === A.ME || (w.type === 'approval' && w.approver === A.ME);
  A.needsMe = () => A.WORK.filter((w) => !closed(w) && A.mine(w) && (w.type === 'approval' || A.isOverdue(w) || new Date(w.due).toDateString() === new Date().toDateString() || w.type === 'request'));
  A.counts = () => { const m = A.WORK.filter((w) => A.mine(w) && !closed(w));
    return { open: m.filter((w) => w.type === 'task').length, overdue: m.filter(A.isOverdue).length, approvals: m.filter((w) => w.type === 'approval').length, requests: m.filter((w) => w.type === 'request').length }; };
  A.workIn = (convId) => A.WORK.filter((w) => w.conv === convId);
  A.uname = (u) => u === 'sys' ? 'Workflow' : u === 'bot' ? 'ASPEN' : u ? A.USERS[u].name : 'Unassigned';

  // ---------- actions ----------
  const event = (w, act, text) => { const c = A.conv(w.conv); if (c) c.msgs.push({ id: A.nextId(), kind: 'work', work: w.id, act, text, t: Date.now(), reactions: {}, thread: [] }); };
  A.createWork = (fields) => {
    const w = Object.assign({ id: A.nextId(), status: 'Pending', priority: 'Normal', requester: A.ME, history: [] }, fields);
    if (w.type === 'task') w.status = 'Open';
    w.history.push({ t: Date.now(), who: A.ME, text: 'Created' + (fields.fromMsg ? ' from a message' : '') + (w.conv ? ' in ' + A.convName(A.conv(w.conv)) : '') });
    if (w.type === 'approval') w.history.push({ t: Date.now() + 1000, who: 'sys', text: 'Routed to ' + A.uname(w.approver) + (w.workflow ? ' by ' + w.workflow : '') });
    A.set(() => { A.WORK.unshift(w); event(w, 'created'); });
    const to = w.type === 'approval' ? w.approver : w.owner;
    A.snack((w.type === 'approval' ? 'Approval requested from ' : w.type === 'request' ? 'Request sent to ' : 'Task created for ') + (to === A.ME ? 'you' : A.uname(to)) + '.');
    // simulate the other person acting on it
    if (to && to !== A.ME && w.type !== 'task') setTimeout(() => A.decide(w, 'Approved', null, to), 7000);
    if (to && to !== A.ME && w.type === 'task') setTimeout(() => A.setStatus(w, 'In progress', to), 6000);
    return w;
  };
  A.setStatus = (w, status, who) => A.set(() => { w.status = status; w.history.push({ t: Date.now(), who: who || A.ME, text: status === 'Done' ? 'Marked done' : status === 'In progress' ? 'Started' : 'Status: ' + status }); event(w, 'status', (who ? A.uname(who) : 'You') + (status === 'Done' ? ' completed' : status === 'In progress' ? ' started' : ' changed') + ' this'); });
  A.decide = (w, status, reason, who) => A.set(() => { w.status = status; w.reason = reason; w.history.push({ t: Date.now(), who: who || A.ME, text: status + (reason ? ': ' + reason : '') }); w.history.push({ t: Date.now() + 1000, who: 'sys', text: status === 'Approved' ? (w.workflow ? w.workflow + ' continued' : 'Requester notified') : 'Requester notified' }); event(w, 'status', (who ? A.uname(who) : 'You') + ' ' + status.toLowerCase() + ' this' + (reason ? ': ' + reason : ''));
    const al = A.ALERTS.find((a) => a.rec && a.rec === w.rec && a.state === 'pending'); if (al) { al.state = status === 'Approved' ? 'approved' : 'rejected'; al.by = who ? A.uname(who) : 'You'; } });
  A.reassign = (w, u) => A.set(() => { const before = A.uname(w.owner); w.owner = u; if (w.type === 'approval') w.approver = u; w.history.push({ t: Date.now(), who: A.ME, text: 'Reassigned from ' + before + ' to ' + A.uname(u) }); event(w, 'status', 'You reassigned this to ' + A.uname(u)); });
  // approving from an ASPEN System card also closes the matching work item
  const al1 = A.ALERTS.find((a) => a.id === 'al1'); if (al1) al1.rec = 'PO 1234';
})();
