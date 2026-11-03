// One mutable store; any change re-renders the app. Small enough that this is fine.
(function () {
  const A = window.A;
  const subs = new Set();
  A.S = {
    connect: 'open', max: false, aspenView: 'dashboard',
    section: 'chat', convId: 'dm-u5', panel: null, tab: 'chat',
    chatFilter: 'all', actFilter: 'all', alertFilter: 'pending', workFilter: 'all', filesFilter: 'all',
    modal: null, pop: null, qs: false, call: null, toasts: [], snack: null,
    myPres: 'on', myNote: '', location: 'All locations', highlight: null, typing: {},
    settings: { toasts: true, sounds: true, preview: true, enterSends: true, compact: false, receipts: true, digest: 'off', quiet: false, noise: true, blur: false },
    saved: [], acks: {}, urgent: null, adminPage: 'overview', history: [],
    activityRead: {},
  };
  A.sub = (f) => { subs.add(f); return () => subs.delete(f); };
  A.set = (patch) => { if (typeof patch === 'function') patch(A.S); else Object.assign(A.S, patch); subs.forEach((f) => f()); };

  // ---------- lookups ----------
  A.conv = (id) => A.CONVS.find((c) => c.id === id);
  A.user = (id) => A.USERS[id];
  A.convName = (c) => c.kind === 'dm' ? A.USERS[c.with].name : c.kind === 'record' ? c.rec + ' · ' + A.RECORDS[c.rec].title : c.kind === 'channel' ? c.name : c.name || c.members.filter((m) => m !== A.ME).map((m) => A.USERS[m].name.split(' ')[0]).join(', ');
  A.lastMsg = (c) => c.msgs.filter((m) => !m.deleted).slice(-1)[0];
  A.findMsg = (msgId) => { for (const c of A.CONVS) { for (const m of c.msgs) { if (m.id === msgId) return { c, m }; for (const r of m.thread) if (r.id === msgId) return { c, m: r, root: m }; } } return null; };
  A.unreadTotals = () => {
    let chat = 0, mentions = 0, channels = 0;
    A.CONVS.forEach((c) => { if (c.muted) return; if (c.kind === 'channel') { channels += c.unread ? 1 : 0; mentions += c.mentions || 0; } else chat += c.unread || 0; });
    const alerts = A.ALERTS.filter((a) => a.state === 'pending').length;
    const activity = A.activityItems().filter((x) => !A.S.activityRead[x.id]).length;
    return { chat, mentions, channels, alerts, activity, total: chat + mentions + alerts };
  };

  // ---------- time ----------
  const pad = (n) => (n < 10 ? '0' : '') + n;
  A.fmtTime = (t) => { const d = new Date(t); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(d.getMinutes()) + ' ' + ap; };
  A.dayKey = (t) => new Date(t).toDateString();
  A.fmtDay = (t) => { const d = new Date(t), n = new Date(); const y = new Date(); y.setDate(n.getDate() - 1);
    if (d.toDateString() === n.toDateString()) return 'Today'; if (d.toDateString() === y.toDateString()) return 'Yesterday';
    if (n - d < 6 * 864e5) return d.toLocaleDateString('en-US', { weekday: 'long' });
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); };
  A.fmtList = (t) => { const d = new Date(t), n = new Date(); if (d.toDateString() === n.toDateString()) return A.fmtTime(t);
    const y = new Date(); y.setDate(n.getDate() - 1); if (d.toDateString() === y.toDateString()) return 'Yesterday';
    if (n - d < 6 * 864e5) return d.toLocaleDateString('en-US', { weekday: 'short' }); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  A.rel = (t) => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'now'; if (m < 60) return m + 'm'; if (m < 1440) return Math.round(m / 60) + 'h'; return A.fmtList(t); };

  // ---------- activity feed (derived) ----------
  A.activityItems = () => {
    const out = [];
    A.CONVS.forEach((c) => c.msgs.forEach((m) => {
      if (m.mentionsMe || (m.text && m.from !== A.ME && /@Mubshar/.test(m.text))) out.push({ id: 'a-' + m.id, type: 'mention', c, m, t: m.t, actor: m.from, text: A.USERS[m.from].name.split(' ')[0] + ' mentioned you' });
      if (m.from === A.ME) Object.entries(m.reactions).forEach(([e, us]) => us.filter((u) => u !== A.ME).forEach((u) => out.push({ id: 'r-' + m.id + u + e, type: 'reaction', c, m, t: m.t + 60000, actor: u, text: A.USERS[u].name.split(' ')[0] + ' reacted ' + e })));
      m.thread.forEach((r) => { if (r.from !== A.ME && m.thread.some((x) => x.from === A.ME)) out.push({ id: 'th-' + r.id, type: 'reply', c, m: r, root: m, t: r.t, actor: r.from, text: A.USERS[r.from].name.split(' ')[0] + ' replied in a thread' }); });
    }));
    A.ALERTS.filter((a) => a.state === 'pending').forEach((a) => out.push({ id: 'al-' + a.id, type: 'approval', alert: a, t: a.t, text: 'Approval needed' }));
    A.CALLS.filter((x) => x.dir === 'missed').forEach((x) => out.push({ id: 'mc-' + x.id, type: 'call', call: x, t: x.t, actor: x.who, text: 'Missed call from ' + A.USERS[x.who].name.split(' ')[0] }));
    return out.sort((a, b) => b.t - a.t);
  };

  // ---------- navigation ----------
  A.go = (section, extra) => A.set((s) => { s.history.push({ section: s.section, convId: s.convId }); Object.assign(s, { section, panel: null, pop: null, qs: false }, extra || {}); if (s.connect === 'closed') s.connect = 'open'; });
  A.openConv = (id, msgId) => A.set((s) => {
    const c = A.conv(id); if (!c) return;
    s.history.push({ section: s.section, convId: s.convId });
    s.section = c.kind === 'channel' ? 'channels' : 'chat';
    s.convId = id; s.tab = 'chat'; s.pop = null; s.qs = false;
    s.panel = c.kind === 'record' ? { type: 'record' } : null;
    c.unread = 0; c.mentions = 0; c.markedUnread = false;
    s.highlight = msgId || null;
    if (s.connect === 'closed') s.connect = 'open';
  });
  A.back = () => A.set((s) => { const h = s.history.pop(); if (h) Object.assign(s, h, { panel: null }); });
  A.snack = (text, undo) => { A.set({ snack: { text, undo } }); clearTimeout(A._sn); A._sn = setTimeout(() => A.set({ snack: null }), 4000); };

  // ---------- messaging ----------
  A.nextId = (() => { let i = 1000; return () => 'x' + (++i); })();
  A.post = (convId, from, text, extra) => {
    const c = A.conv(convId); const m = Object.assign({ id: A.nextId(), from, t: Date.now(), text, reactions: {}, thread: [] }, extra || {});
    c.msgs.push(m); return m;
  };
  A.send = (convId, text, opts) => {
    opts = opts || {};
    const m = { id: A.nextId(), from: A.ME, t: Date.now(), text, reactions: {}, thread: [], state: 'sending', file: opts.file, files: opts.files, quote: opts.quote };
    A.set((s) => {
      if (opts.threadRoot) { const f = A.findMsg(opts.threadRoot); f.m.thread.push(m); if (opts.alsoSend) A.conv(convId).msgs.push(Object.assign({}, m, { id: A.nextId(), alsoFrom: f.m.id })); }
      else A.conv(convId).msgs.push(m);
    });
    setTimeout(() => A.set(() => { m.state = 'sent'; }), 450);
    const c = A.conv(convId);
    if (c.kind === 'dm' && A.REPLIES[c.with] && !opts.threadRoot) {
      const who = c.with;
      setTimeout(() => A.set(() => { m.state = 'seen'; }), 1600);
      setTimeout(() => A.set((s) => { s.typing[convId] = who; }), 2200);
      setTimeout(() => {
        const list = A.REPLIES[who]; const reply = list[(c.msgs.length) % list.length];
        A.set((s) => { delete s.typing[convId]; const r = A.post(convId, who, reply); A.arrive(c, r); });
      }, 4600);
    }
  };
  // called when someone else's message arrives
  A.arrive = (c, m) => {
    const s = A.S;
    const viewing = s.connect !== 'closed' && s.convId === c.id && (s.section === 'chat' || s.section === 'channels') && !s.call;
    if (!viewing) { c.unread = (c.unread || 0) + 1; if (/@Mubshar/.test(m.text || '')) c.mentions = (c.mentions || 0) + 1; }
    if (!viewing && s.settings.toasts && !c.muted && s.myPres !== 'dnd') A.toast({ kind: 'msg', conv: c.id, from: m.from, text: m.text });
  };
  A.toast = (t) => { t.id = A.nextId(); A.S.toasts.push(t); if (t.kind !== 'call') setTimeout(() => A.set((s) => { s.toasts = s.toasts.filter((x) => x.id !== t.id); }), 8000); };
  A.dismiss = (id) => A.set((s) => { s.toasts = s.toasts.filter((x) => x.id !== id); });
  A.react = (msgId, e) => A.set(() => { const { m } = A.findMsg(msgId); const l = m.reactions[e] || (m.reactions[e] = []); const i = l.indexOf(A.ME); if (i >= 0) l.splice(i, 1); else l.push(A.ME); if (!l.length) delete m.reactions[e]; });
  A.recordsIn = (text) => { const out = []; (text || '').replace(/\b(RO|DEAL|PO) ?(\d{4,5})\b|\bUNIT (C\d{4})\b/gi, (_, k, n, u) => { const key = u ? 'UNIT ' + u.toUpperCase() : k.toUpperCase() + ' ' + n; if (A.RECORDS[key] && !out.includes(key)) out.push(key); }); return out; };
  A.openRecordConv = (key) => {
    let c = A.conv('rec-' + key);
    if (!c) { c = { id: 'rec-' + key, kind: 'record', rec: key, unread: 0, members: [A.ME], msgs: [{ id: A.nextId(), kind: 'sys', t: Date.now(), text: 'You started a conversation about ' + key, reactions: {}, thread: [] }] }; A.CONVS.push(c); }
    A.openConv(c.id);
  };
  A.createTask = (t, srcMsg, convId) => A.set((s) => {
    const task = Object.assign({ id: A.nextId(), type: 'Task', from: 'You', status: 'Open', dueTone: 'a' }, t);
    A.TASKS.unshift(task);
    if (convId) A.conv(convId).msgs.push({ id: A.nextId(), kind: 'card', from: A.ME, t: Date.now(), reactions: {}, thread: [], card: { type: 'task', task } });
    s.modal = null;
  });
  A.counts = () => { const t = A.TASKS.filter((x) => x.status !== 'Done'); return { open: t.length, overdue: t.filter((x) => x.status === 'Overdue').length, approvals: t.filter((x) => x.type === 'Approval').length, requests: t.filter((x) => x.type === 'Request').length }; };
})();
