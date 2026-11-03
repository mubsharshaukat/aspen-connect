// Gaps found in the design review: connection status and offline queue (H1 visibility of system status, H9 recovery),
// reminders and snooze (H7 flexibility), @Me mentions, and a "New" divider where unread starts.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  A.S.net = 'online';

  // ---------- where unread starts ----------
  const open0 = A.openConv;
  A.openConv = (id, msgId) => { const c = A.conv(id); if (c) { const n = c.unread || 0; const real = c.msgs.filter((m) => !m.hiddenForMe); c.newFromId = n > 0 && real.length >= n ? real[real.length - n].id : null; } open0(id, msgId); };

  // ---------- @Me ----------
  A.mentionConvs = () => A.CONVS.filter((c) => c.mentions || c.msgs.some((m) => m.from !== A.ME && /@Mubshar/.test(m.text || '') && m.t > Date.now() - 2 * 864e5));

  // ---------- connection status and offline queue ----------
  const send0 = A.send;
  A.send = (convId, text, opts) => {
    if (A.S.net === 'online') return send0(convId, text, opts);
    const m = { id: A.nextId(), from: A.ME, t: Date.now(), text, reactions: {}, thread: [], state: 'queued', files: opts && opts.files, quote: opts && opts.quote };
    A.set(() => { A.conv(convId).msgs.push(m); });
  };
  A.goOffline = (secs) => {
    A.set({ net: 'offline' });
    setTimeout(() => A.set({ net: 'reconnecting' }), secs * 1000);
    setTimeout(() => {
      A.set((s) => { s.net = 'online'; A.CONVS.forEach((c) => c.msgs.forEach((m) => { if (m.state === 'queued') m.state = 'sent'; })); });
      A.snack('Back online. Queued messages were sent.');
      setTimeout(() => A.set({ net: 'online-ok' }), 10); setTimeout(() => A.set((s) => { if (s.net === 'online-ok') s.net = 'online'; }), 2500);
    }, secs * 1000 + 1800);
  };
  A.NetBanner = function NetBanner() {
    const n = A.S.net; if (n === 'online') return null;
    if (n === 'online-ok') return html`<div className="banner netok" role="status"><${I} n="check" />Connected</div>`;
    return html`<div className="banner neterr" role="status">${n === 'offline' ? html`<${I} n="signal" />You're offline. You can keep typing; messages will send when the connection is back.` : html`<span className="spin"></span>Reconnecting…`}</div>`;
  };

  // ---------- reminders and snooze ----------
  A.remindMe = (m, c, mins) => {
    A.snack('OK, I\'ll remind you ' + (mins >= 900 ? 'tomorrow at 8 AM' : 'in ' + (mins >= 60 ? mins / 60 + ' hour' + (mins > 60 ? 's' : '') : mins + ' minutes')) + '. (Prototype: it fires in 8 seconds.)');
    setTimeout(() => A.set(() => A.toast({ kind: 'msg', conv: c.id, from: A.USERS[m.from] && m.from !== A.ME ? m.from : (c.with || 'u2'), text: 'Reminder: ' + (m.text || '').slice(0, 90) })), 8000); // demo: fires after 8 s
  };
  const needs0 = A.needsMe;
  A.needsMe = () => needs0().filter((w) => !(w.snoozeUntil > Date.now()));
  A.SnoozeBtn = function SnoozeBtn({ w }) {
    if (A.isClosed(w) || !A.mine(w)) return null;
    const until = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return d.getTime(); };
    return w.snoozeUntil > Date.now()
      ? html`<div className="snoozed"><${I} n="clock" s="12" />Snoozed until ${A.dueLabel({ due: w.snoozeUntil })}<button className="link" onClick=${() => A.set(() => { w.snoozeUntil = 0; })}>Unsnooze</button></div>`
      : html`<button className="btn sm ghost" style=${{ marginTop: 10 }} title="Hide this until tomorrow morning" onClick=${() => { A.set(() => { w.snoozeUntil = until(); w.history.push({ t: Date.now(), who: A.ME, text: 'Snoozed until tomorrow 8 AM' }); }); A.snack('Snoozed until tomorrow 8 AM.'); }}><${I} n="clock" s="12" />Snooze until tomorrow</button>`;
  };

  A.set({});
})();
