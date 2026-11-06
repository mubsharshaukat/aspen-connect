// Sample dealership: "Ridgeline Powersports", two locations. All people and records are examples.
(function () {
  const A = window.A;
  const now = Date.now();
  const ago = (min) => now - min * 60000;
  const day = (d, h, m) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x.getTime(); };

  A.ME = 'u1';
  A.LOCATIONS = ['01 - Main Location', '02 - Lakeside'];
  A.USERS = {
    u1: { name: 'Mubshar Shaukat', ini: 'MS', title: '', dept: 'Service', loc: '01 - Main Location', color: '#0063b1', pres: 'on', ext: '201', clock: 'Clocked in 7:48 AM', mgr: 'Rob Hale' },
    u2: { name: 'Dana Ortiz', ini: 'DO', title: 'Service Advisor', dept: 'Service', loc: '01 - Main Location', color: '#008575', pres: 'on', ext: '212', clock: 'Clocked in 7:55 AM', mgr: 'Mubshar Shaukat' },
    u3: { name: 'Sam Whitfield', ini: 'SW', title: 'Service Technician', dept: 'Service', loc: '01 - Main Location', color: '#8764b8', pres: 'busy', note: 'On RO 48213 until 11', ext: '214', clock: 'Clocked in 7:02 AM', mgr: 'Mubshar Shaukat' },
    u4: { name: 'Tom Baker', ini: 'TB', title: 'Parts Counter', dept: 'Parts', loc: '01 - Main Location', color: '#ca5010', pres: 'away', ext: '230', clock: 'Clocked in 8:00 AM', mgr: 'Rob Hale' },
    u5: { name: 'Kim Lee', ini: 'KL', title: 'F&I Manager', dept: 'Sales', loc: '01 - Main Location', color: '#c239b3', pres: 'on', ext: '240', clock: 'Clocked in 9:01 AM', mgr: 'Ann Cole' },
    u6: { name: 'Jess Ramos', ini: 'JR', title: 'Salesperson', dept: 'Sales', loc: '01 - Main Location', color: '#498205', pres: 'on', ext: '244', clock: 'Clocked in 9:15 AM', mgr: 'Ann Cole' },
    u7: { name: 'Rob Hale', ini: 'RH', title: 'General Manager', dept: 'Management', loc: '01 - Main Location', color: '#4a6274', pres: 'dnd', note: 'Factory rep meeting', ext: '200', clock: '', mgr: '' },
    u8: { name: 'Priya Nair', ini: 'PN', title: 'Office Manager', dept: 'Accounting', loc: '01 - Main Location', color: '#107c10', pres: 'off', ext: '205', clock: 'Clocked out', mgr: 'Rob Hale' },
    u9: { name: 'Luis Romero', ini: 'LR', title: 'Service Technician', dept: 'Service', loc: '02 - Lakeside', color: '#038387', pres: 'on', ext: '314', clock: 'Clocked in 7:30 AM', mgr: 'Mubshar Shaukat' },
    u10: { name: 'Ann Cole', ini: 'AC', title: 'Sales Manager', dept: 'Sales', loc: '01 - Main Location', color: '#a4262c', pres: 'away', ext: '241', clock: 'Clocked in 8:40 AM', mgr: 'Rob Hale' },
  };
  // Illustrated portrait photos for some people (others keep initials).
  const face = ({ bg, skin, hair, shirt, style }) => {
    const back = { long: `<path d="M14 34c0-14 7-23 18-23s18 9 18 23v16H14z" fill="${hair}"/>`, bun: `<circle cx="32" cy="10" r="7" fill="${hair}"/>` }[style] || '';
    const top = { short: `<path d="M19 27c0-10 6-15 13-15s13 5 13 15c-2-5-6-7-13-7s-11 2-13 7z" fill="${hair}"/>`, long: `<path d="M19 29c0-11 6-16 13-16s13 5 13 16c-4-6-9-9-13-9s-9 3-13 9z" fill="${hair}"/>`, bun: `<path d="M19 28c0-10 6-15 13-15s13 5 13 15c-3-5-7-8-13-8s-10 3-13 8z" fill="${hair}"/>`, bald: `<path d="M20 25c1-7 6-11 12-11s11 4 12 11c-2-3-6-5-12-5s-10 2-12 5z" fill="${hair}" opacity=".55"/>`, beard: `<path d="M19 27c0-10 6-15 13-15s13 5 13 15c-2-5-6-7-13-7s-11 2-13 7z" fill="${hair}"/><path d="M22 33c1 9 5 13 10 13s9-4 10-13c-2 4-5 6-10 6s-8-2-10-6z" fill="${hair}"/>` }[style];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>${back}<path d="M8 64c2-11 11-16 24-16s22 5 24 16z" fill="${shirt}"/><rect x="27" y="38" width="10" height="11" rx="4" fill="${skin}"/><ellipse cx="32" cy="30" rx="12" ry="14" fill="${skin}"/>${top}<circle cx="27.5" cy="30" r="1.4" fill="#2b2b2b"/><circle cx="36.5" cy="30" r="1.4" fill="#2b2b2b"/><path d="M28 36.5q4 3 8 0" stroke="#7a4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };
  Object.assign(A.USERS.u2, { photo: face({ bg: '#cfe3f5', skin: '#e8b48f', hair: '#4a2c1d', shirt: '#2f6f9f', style: 'long' }) });
  Object.assign(A.USERS.u3, { photo: face({ bg: '#dde8d5', skin: '#f1c7a5', hair: '#b07a3c', shirt: '#4b5a3a', style: 'short' }) });
  Object.assign(A.USERS.u5, { photo: face({ bg: '#f3dbe6', skin: '#f0cfae', hair: '#1d1a1a', shirt: '#8a3d6b', style: 'bun' }) });
  Object.assign(A.USERS.u7, { photo: face({ bg: '#e4e1f2', skin: '#d9a07a', hair: '#8c8c8c', shirt: '#303a4f', style: 'bald' }) });
  Object.assign(A.USERS.u8, { photo: face({ bg: '#f6e3c9', skin: '#b97b55', hair: '#1f1410', shirt: '#c0632f', style: 'long' }) });
  Object.assign(A.USERS.u4, { photo: face({ bg: '#f5ddd0', skin: '#f2c9a8', hair: '#c4622d', shirt: '#7a4b2a', style: 'short' }) });
  Object.assign(A.USERS.u6, { photo: face({ bg: '#e2efd9', skin: '#a8714f', hair: '#2b1a12', shirt: '#4f8a2e', style: 'long' }) });
  Object.assign(A.USERS.u10, { photo: face({ bg: '#efe0f2', skin: '#f3d0b5', hair: '#d9b25f', shirt: '#7b4a9e', style: 'bun' }) });
  Object.assign(A.USERS.u9, { photo: face({ bg: '#d6ecea', skin: '#c88a62', hair: '#2a1d16', shirt: '#2f7d6f', style: 'beard' }) });

  A.GROUPS = [
    { key: 'service-techs', label: 'Service Techs', members: ['u3', 'u9'] },
    { key: 'salespeople', label: 'Salespersons', members: ['u6', 'u10'] },
    { key: 'parts', label: 'Parts', members: ['u4'] },
    { key: 'managers', label: 'Managers', members: ['u1', 'u7', 'u10'] },
    { key: 'clock-users', label: 'Clock Users', members: ['u2', 'u3', 'u4', 'u9'] },
  ];
  // ASPEN Workflow teams: the same list the old Broadcast tab used.
  A.TEAMS = [
    { id: 'team-service', name: 'Service Team', members: ['u1', 'u2', 'u3', 'u9'] },
    { id: 'team-parts', name: 'Parts Team', members: ['u1', 'u4', 'u2'] },
    { id: 'team-sales', name: 'Sales Team', members: ['u5', 'u6', 'u10'] },
    { id: 'team-managers', name: 'Managers', members: ['u1', 'u7', 'u10'] },
  ];
  // People groups carried over from the old tree (IsSales, IsServiceTech, ClockPIN).
  A.PEOPLE_GROUPS = [
    { key: 'sales', label: 'Salespersons', members: ['u5', 'u6', 'u10'] },
    { key: 'techs', label: 'Service Techs', members: ['u3', 'u9'] },
    { key: 'clock', label: 'Clock Users', members: ['u2', 'u3', 'u4', 'u9'] },
  ];
  A.RECKIND = {
    RO: { label: 'Repair Order', color: 'var(--service)' },
    DEAL: { label: 'Deal', color: 'var(--sales)' },
    PO: { label: 'Parts Order', color: 'var(--parts)' },
    CUST: { label: 'Customer', color: 'var(--cust)' },
    UNIT: { label: 'Unit', color: 'var(--units)' },
    INV: { label: 'Invoice', color: 'var(--acct)' },
    PART: { label: 'Part', color: 'var(--parts)' },
    RPT: { label: 'Report', color: '#69797e' },
  };
  A.RECORDS = {
    'RO 48213': { kind: 'RO', id: '48213', title: 'Harlan Pruitt', status: 'Waiting on parts', tone: 'a',
      fields: [['Customer', 'Harlan Pruitt'], ['Unit', '2021 Polaris RZR XP 1000'], ['VIN', '3NSRAE99XMF...4417'], ['Advisor', 'Dana Ortiz'], ['Technician', 'Sam Whitfield'], ['Promised', 'Wed Oct 28'], ['Total', '$1,186.40']] },
    'DEAL 7741': { kind: 'DEAL', id: '7741', title: 'Harlan Pruitt', status: 'Pending F&I', tone: 'b',
      fields: [['Buyer', 'Harlan Pruitt'], ['Unit', '2025 Can-Am Maverick X3'], ['Stock #', 'C4471'], ['Salesperson', 'Jess Ramos'], ['F&I', 'Kim Lee'], ['Price', '$27,499.00']] },
    'PO 1234': { kind: 'PO', id: '1234', title: 'Polaris Industries', status: 'Awaiting approval', tone: 'a',
      fields: [['Vendor', 'Polaris Industries'], ['Lines', '6'], ['Total', '$2,480.00'], ['Requested by', 'Tom Baker'], ['For', 'RO 48213']] },
    'RO 48230': { kind: 'RO', id: '48230', title: 'Ridgeline Excavating', status: 'In progress', tone: 'g',
      fields: [['Customer', 'Ridgeline Excavating'], ['Unit', '2019 Kubota RTV-X1100C'], ['Advisor', 'Dana Ortiz'], ['Technician', 'Luis Romero']] },
    'UNIT C4471': { kind: 'UNIT', id: 'C4471', title: '2025 Can-Am Maverick X3', status: 'Sold - pending', tone: 'b',
      fields: [['Stock #', 'C4471'], ['Year', '2025'], ['Make', 'Can-Am'], ['Model', 'Maverick X3 DS Turbo'], ['Location', '01 - Main Location']] },
    'INV 220981': { kind: 'INV', id: '220981', title: 'Bell Rentals', status: 'Posted', tone: 'g',
      fields: [['Customer', 'Bell Rentals'], ['Date', '10/21/2026'], ['Total', '$412.75'], ['Salesperson', 'Tom Baker']] },
    'PART 4014029': { kind: 'PART', id: '4014029', title: 'Stator assembly (Polaris)', status: 'On order', tone: 'a',
      fields: [['Part #', '4014029'], ['On hand', '0'], ['On order', '1, ETA Tue'], ['Bin', 'B-14-02'], ['List', '$642.40']] },
    'CUST Pruitt': { kind: 'CUST', id: '1882', title: 'Harlan Pruitt', status: 'Active', tone: 'g',
      fields: [['Customer #', '1882'], ['Phone', '(555) 014-2290'], ['Credit limit', '$5,000'], ['Balance', '$1,186.40']] },
  };

  let n = 0; const id = () => 'm' + (++n);
  const msg = (from, t, text, extra) => Object.assign({ id: id(), from, t, text, reactions: {}, thread: [] }, extra || {});
  const sys = (t, text) => ({ id: id(), kind: 'sys', t, text, reactions: {}, thread: [] });

  A.CONVS = [
    { id: 'dm-u5', kind: 'dm', with: 'u5', pinned: true, unread: 2, members: ['u1', 'u5'], msgs: [
      msg('u5', day(1, 16, 20), 'Customer on 7741 wants the extended warranty quote before signing.'),
      msg('u1', day(1, 16, 31), 'Send me the options, I will check with the service side on coverage.'),
      msg('u5', ago(14), 'Bank came back on DEAL 7741, approved at 6.9% for 60 months.', { reactions: {} }),
      msg('u5', ago(13), 'Can you OK the 3-year service plan so I can add it to the contract?'),
    ] },
    { id: 'grp-sp', kind: 'group', name: 'Service + Parts Team', pinned: true, unread: 0, members: ['u1', 'u2', 'u3', 'u4'], msgs: [
      msg('u2', day(0, 8, 2), 'Morning. 14 ROs on the board today, 3 waiting on parts.'),
      msg('u4', day(0, 8, 9), 'Polaris truck is due at 10. I will post what comes in.', { reactions: { '👍': ['u1', 'u2'] } }),
      msg('u4', ago(41), 'Units are on the lot. Stator for RO 48213 was NOT on the truck.'),
    ] },
    { id: 'dm-u3', kind: 'dm', with: 'u3', unread: 1, members: ['u1', 'u3'], msgs: [
      msg('u3', ago(28), 'Stator on the Pruitt RZR is bad, part is backordered. Can you approve the order so Tom can expedite it?'),
    ] },
    { id: 'rec-RO 48213', kind: 'record', rec: 'RO 48213', unread: 0, members: ['u1', 'u2', 'u3', 'u4'], msgs: [
      sys(day(0, 9, 20), 'Dana Ortiz started a conversation about RO 48213'),
      msg('u3', ago(35), 'Stator is bad. Part 4014029 is backordered, ETA Tuesday.'),
      { id: id(), kind: 'card', from: 'bot-parts', t: ago(34), reactions: {}, thread: [], card: { type: 'backorder', title: 'Backorder: 4014029 Stator', lines: ['Qty 1, ETA Tue Oct 27', 'Supplier: Polaris Industries'], actions: ['Notify customer', 'Find substitute'] } },
      msg('u2', ago(30), "I'll call the customer."),
    ] },
    { id: 'rec-DEAL 7741', kind: 'record', rec: 'DEAL 7741', unread: 0, members: ['u1', 'u5', 'u6'], msgs: [
      msg('u6', day(1, 15, 2), 'Trade appraisal for Pruitt is in, $8,200 on the Ranger.'),
      msg('u5', day(1, 15, 40), 'Submitted to Sheffield and Synchrony.'),
    ] },
    { id: 'dm-u6', kind: 'dm', with: 'u6', unread: 0, members: ['u1', 'u6'], msgs: [
      msg('u6', day(2, 11, 5), 'Do you have a tech free Thursday for a PDI on the Maverick?'),
      msg('u1', day(2, 11, 9), 'Luis can take it at Lakeside, 10 AM.'),
      msg('u6', day(2, 11, 10), 'Perfect, thanks!'),
    ] },
    { id: 'dm-u4', kind: 'dm', with: 'u4', unread: 0, muted: false, members: ['u1', 'u4'], msgs: [
      msg('u4', day(4, 14, 0), 'Here is the delivery checklist we talked about.', { file: { name: 'delivery-checklist.pdf', size: '184 KB', type: 'PDF' } }),
    ] },
    { id: 'ch-general', kind: 'channel', name: 'general', loc: 'All locations', topic: 'Company-wide news and questions', members: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'], unread: 0, msgs: [
      msg('u7', day(1, 8, 0), 'Reminder: open house Saturday 9-2. Wear your Ridgeline shirts.', { reactions: { '👍': ['u2', 'u5', 'u6'], '🎉': ['u10'] } }),
    ] },
    { id: 'ch-service-shop', kind: 'channel', name: 'service-shop', loc: '01 - Main Location', topic: 'Shop floor coordination', members: ['u1', 'u2', 'u3', 'u4', 'u9'], unread: 3, mentions: 1, msgs: [
      msg('u4', day(0, 8, 15), 'Who has the diagnostic laptop?', { thread: [msg('u6', day(0, 8, 20), 'Bay 2, on the cart.'), msg('u4', day(0, 8, 31), 'Got it, thanks.')] }),
      msg('u9', ago(70), 'Lift 3 is making the grinding noise again.'),
      msg('u3', ago(9), '@Mubshar is lift 3 fixed? I have the RZR waiting on it.', { mentionsMe: true, reactions: { '👀': ['u2', 'u9'] } }),
      msg('u2', ago(8), 'Moving the RZR to lift 1 for now.'),
    ] },
    { id: 'ch-sales-floor', kind: 'channel', name: 'sales-floor', loc: '01 - Main Location', topic: 'Ups, deliveries, inventory questions', members: ['u1', 'u5', 'u6', 'u10'], unread: 4, msgs: [
      msg('u10', day(0, 9, 5), 'Two deliveries at noon, keep the front row clear.'),
      msg('u6', ago(55), 'Customer asking about UNIT C4471 colors, do we have the gray?'),
      msg('u10', ago(50), 'Only the red at Main. Lakeside has a gray.'),
      msg('u6', ago(48), 'Thanks'),
    ] },
    { id: 'ch-parts-counter', kind: 'channel', name: 'parts-counter', loc: '01 - Main Location', topic: 'Special orders and backorders', members: ['u1', 'u4', 'u2'], unread: 0, msgs: [
      msg('u4', day(1, 13, 10), 'Kubota order is in. Pickup tickets are on the board.'),
    ] },
    { id: 'ch-managers', kind: 'channel', name: 'managers', private: true, loc: 'All locations', topic: 'Managers only', members: ['u1', 'u7', 'u10'], unread: 0, msgs: [
      msg('u7', day(2, 17, 0), 'October numbers review Monday 8 AM, my office.'),
    ] },
    { id: 'ch-announcements', kind: 'channel', name: 'announcements', readonly: true, loc: 'All locations', topic: 'Official announcements', members: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'], unread: 0, msgs: [
      { id: id(), kind: 'card', from: 'u7', t: day(3, 7, 30), reactions: {}, thread: [], card: { type: 'announce', title: 'New eSign process starts Monday', body: 'All F&I contracts go through ASPEN eSign starting Monday. Paper contracts only with GM approval.', ack: { need: true, done: ['u1', 'u5', 'u6', 'u10'], total: 10 } } },
    ] },
  ];
  // Team chats come from ASPEN Workflow teams instead of free-form channels.
  const shop = A.CONVS.find((c) => c.id === 'ch-service-shop');
  A.CONVS = A.CONVS.filter((c) => c.kind !== 'channel');
  A.CONVS.push(
    Object.assign(shop, { id: 'team-service', kind: 'team', name: 'Service Team', members: A.TEAMS[0].members }),
    { id: 'team-parts', kind: 'team', name: 'Parts Team', members: A.TEAMS[1].members, unread: 0, msgs: [msg('u4', day(1, 13, 10), 'Kubota order is in. Pickup tickets are on the board.')] },
    { id: 'team-managers', kind: 'team', name: 'Managers', members: A.TEAMS[3].members, unread: 0, msgs: [msg('u7', day(2, 17, 0), 'October numbers review Monday 8 AM, my office.')] },
    { id: 'dm-u7', kind: 'dm', with: 'u7', unread: 0, members: ['u1', 'u7'], msgs: [msg('u7', day(3, 7, 30), 'All F&I contracts go through ASPEN eSign starting Monday. Paper contracts only with my approval.', { broadcast: 'Managers' })] },
    // The old "System" node: messages from ASPEN itself. Nobody can reply here.
    { id: 'sys', kind: 'system', name: 'ASPEN System', pinned: true, unread: 2, members: [A.ME], msgs: [
      { id: id(), kind: 'alert', alert: 'al3', t: day(1, 16, 51), reactions: {}, thread: [] },
      { id: id(), kind: 'note', t: day(1, 17, 5), text: 'Your report is ready: Service Gross Profit, October 2026.', links: ['RPT Service GP'], reactions: {}, thread: [] },
      { id: id(), kind: 'note', t: day(1, 15, 12), text: 'Parts received on PO 1229: 2 lines. 1 special-order part is waiting for pickup.', links: ['PART 4014029'], reactions: {}, thread: [] },
      { id: id(), kind: 'alert', alert: 'al4', t: day(1, 12, 4), reactions: {}, thread: [] },
      { id: id(), kind: 'alert', alert: 'al2', t: day(0, 6, 0), reactions: {}, thread: [] },
      { id: id(), kind: 'note', t: day(0, 7, 0), text: 'Task due today: Review backordered item 4014029.', reactions: {}, thread: [] },
      { id: id(), kind: 'alert', alert: 'al1', t: ago(26), reactions: {}, thread: [] },
    ] },
  );
  A.CONVS.find((c) => c.id === 'dm-u5').pinned = false;
  A.CONVS.find((c) => c.id === 'grp-sp').pinned = false;
  A.RECORDS['RPT Service GP'] = { kind: 'RPT', id: 'GP-10', title: 'Service Gross Profit, Oct 2026', status: 'PDF ready', tone: 'g', fields: [['Format', 'PDF'], ['Pages', '6'], ['Run by', 'Scheduler']] };

  A.ALERTS = [
    { id: 'al1', bot: 'Parts approval', ini: 'PA', color: 'var(--parts)', t: ago(26), state: 'pending', title: 'Approve parts order PO 1234', rec: 'PO 1234',
      lines: ['Polaris Industries, 6 lines, $2,480.00', 'Requested by Tom Baker for RO 48213', 'Rule: orders over $1,500 need a manager'] },
    { id: 'al2', bot: 'Credit limit', ini: 'CL', color: 'var(--cust)', t: day(0, 6, 0), state: 'info', title: '3 customers over credit limit',
      lines: ['Ridgeline Excavating: $12,410 of $10,000', 'Pruitt Farms: $5,880 of $5,000', 'Bell Rentals: $3,120 of $3,000'] },
    { id: 'al3', bot: 'Parts approval', ini: 'PA', color: 'var(--parts)', t: day(1, 16, 51), state: 'approved', by: 'You', title: 'Approve parts order PO 1229', rec: null,
      lines: ['Kubota, 2 lines, $1,912.30'] },
    { id: 'al4', bot: 'eSign', ini: 'ES', color: 'var(--sales)', t: day(1, 12, 4), state: 'info', title: 'Contract signed: DEAL 7702', lines: ['Signed by Maria Gutierrez on the Clover device'] },
  ];

  A.TASKS = [
    { id: 't1', title: 'Approve parts order PO 1234', type: 'Approval', due: 'Yesterday', dueTone: 'r', from: 'Tom Baker', status: 'Overdue', rec: 'PO 1234', owner: 'u1' },
    { id: 't2', title: 'Review backordered item 4014029', type: 'Task', due: 'Today', dueTone: 'a', from: 'Parts bot', status: 'Due today', rec: 'RO 48213', owner: 'u1' },
    { id: 't3', title: 'Credit exception: Ridgeline Excavating', type: 'Request', due: 'Oct 21', dueTone: 'b', from: 'Kim Lee', status: 'Pending', rec: null, owner: 'u1' },
    { id: 't4', title: 'Schedule PDI for UNIT C4471', type: 'Task', due: 'Thu', dueTone: '', from: 'Jess Ramos', status: 'Open', rec: 'UNIT C4471', owner: 'u1' },
    { id: 't5', title: 'Fix lift 3 grinding noise', type: 'Task', due: 'Fri', dueTone: '', from: 'Luis Romero', status: 'In progress', rec: null, owner: 'u1' },
  ];

  A.CALLS = [
    { id: 'c1', who: 'u6', dir: 'missed', kind: 'Call', t: ago(62), dur: '' },
    { id: 'c2', who: 'grp-sp', dir: 'out', kind: 'Team call', t: day(1, 10, 2), dur: '18 min' },
    { id: 'c3', who: 'u5', dir: 'in', kind: 'Call', t: day(1, 15, 12), dur: '6 min' },
    { id: 'c4', who: 'u3', dir: 'out', kind: 'Call', t: day(2, 9, 40), dur: '2 min' },
  ];

  A.REPLIES = {
    u5: ['Thanks! Adding it to the contract now.', 'Perfect, I will send it to eSign.'],
    u3: ['Great, thanks. I will start on the next RO.', 'Got it.'],
    u6: ['Sounds good.', 'Thanks!'],
    u4: ['On it.', 'I will call Polaris now.'],
    u2: ['Thanks, I will let the customer know.'],
  };
  // Illustrated pictures for groups and teams.
  const pic = (c1, c2, glyph) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`);
  const GPICS = {
    'grp-sp': pic('#5c6bc0', '#26a69a', '<circle cx="24" cy="26" r="6"/><circle cx="41" cy="26" r="6"/><path d="M13 46c1-7 5-11 11-11s10 4 11 11M30 46c1-7 5-11 11-11s10 4 11 11"/>'),
    'team-service': pic('#1e88e5', '#0d47a1', '<path d="M40 14a9 9 0 0 0-11 11L15 39a4 4 0 0 0 6 6l14-14a9 9 0 0 0 11-11l-6 6-5-1-1-5z"/>'),
    'team-parts': pic('#fb8c00', '#c62828', '<path d="M32 13l17 9v20l-17 9-17-9V22z"/><path d="M15 22l17 9 17-9M32 31v20"/>'),
    'team-sales': pic('#8e24aa', '#4a148c', '<path d="M12 40v-7l5-9h22l9 9h4v7z"/><circle cx="21" cy="41" r="4"/><circle cx="43" cy="41" r="4"/>'),
    sys: pic('#43a047', '#1b5e20', '<path d="M32 12c-11 9-15 20-11 29 3 6 8 8 11 8s8-2 11-8c4-9 0-20-11-29z"/><path d="M32 22v30M32 33l-6-5M32 40l7-6"/>'),
    'team-managers': pic('#43a047', '#1b5e20', '<path d="M14 48h36"/><path d="M19 48V36M28 48V28M37 48V32M46 48V20"/>'),
  };
  A.GPICS = GPICS;
  A.CONVS.forEach((c) => { if (GPICS[c.id]) c.photo = GPICS[c.id]; });
  A.EMOJI = ['👍', '✅', '👀', '😂', '🎉', '🙏', '❤️', '😮', '👏', '🔥', '🚚', '🔧'];
})();
