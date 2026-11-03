// Platform features: notification centre, per-conversation notify levels, Insights,
// Integrations, Security & retention, language and accessibility, and the gear menu links.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;
  const now = () => Date.now();
  const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // ---------- notifications ----------
  A.S.notes = [
    { id: 'n1', t: now() - 9 * 60e3, icon: 'mention', text: 'Dana mentioned you in RO 48213', go: () => A.openRecordConv('RO 48213'), read: false },
    { id: 'n2', t: now() - 40 * 60e3, icon: 'ticket', text: 'Email turned into a task: "Warranty claim #W-2291 needs photos"', go: () => A.go('mywork'), read: false },
    { id: 'n3', t: now() - 3 * 3600e3, icon: 'check', text: 'Marcus approved the discount on DL-1187', go: () => A.go('mywork'), read: true },
  ];
  A.notify = (n) => A.set((s) => { s.notes.unshift(Object.assign({ id: 'n' + A.nextId(), t: now(), read: false, icon: 'bell' }, n)); s.notes = s.notes.slice(0, 40); });
  const arrive0 = A.arrive;
  A.arrive = (c, m) => {
    arrive0(c, m);
    const lvl = c.notify || (c.muted ? 'none' : 'all'), mine = m.text && new RegExp('@' + A.USERS[A.ME].name.split(' ')[0], 'i').test(m.text);
    if (lvl === 'all' || (lvl === 'mentions' && mine)) A.notify({ icon: mine ? 'mention' : 'chat', text: (A.USERS[m.from] ? A.USERS[m.from].name.split(' ')[0] : m.cust || 'ASPEN') + (mine ? ' mentioned you in ' : ' in ') + A.convName(c) + ': ' + (m.text || 'sent a file').slice(0, 60), go: () => A.openConv(c.id, m.id) });
  };
  const create0 = A.createWork;
  A.createWork = (w) => { const r = create0(w), x = r || w; if ((x.type === 'approval' ? x.approver : x.owner) === A.ME && x.by && x.by !== A.ME) A.notify({ icon: 'task', text: A.uname(x.by) + ' gave you: ' + x.title, go: () => A.openItem(x.id) }); return r; };

  A.BellBtn = function BellBtn() {
    const S = A.S, n = S.notes.filter((x) => !x.read).length;
    return html`<button className=${'bell' + (S.panel && S.panel.type === 'notes' ? ' on' : '')} aria-label=${'Notifications' + (n ? ', ' + n + ' unread' : '')} title="Notifications" onClick=${() => A.set({ panel: S.panel && S.panel.type === 'notes' ? null : { type: 'notes' } })}><${I} n="bell" s="16" />${n ? html`<span className="bellc">${n > 9 ? '9+' : n}</span>` : null}</button>`;
  };
  function Notes() {
    const S = A.S; const [f, setF] = useState('all');
    const list = S.notes.filter((x) => f === 'all' || !x.read);
    const open = (x) => { A.set(() => { x.read = true; }); x.go && x.go(); };
    return html`<div className="panel" style=${{ width: 340 }}><div className="phd"><${I} n="bell" /><b>Notifications</b><button className="ib" aria-label="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div>
      <div className="notebar"><div className="wvseg" role="radiogroup" aria-label="Show">${[['all', 'All'], ['unread', 'Unread']].map(([k, l]) => html`<button role="radio" aria-checked=${f === k} className=${f === k ? 'on' : ''} onClick=${() => setF(k)}>${l}</button>`)}</div><span className="grow"></span>
        <button className="link" onClick=${() => A.set((s) => { s.notes.forEach((x) => { x.read = true; }); })}>Mark all read</button></div>
      <div className="pbd" style=${{ padding: 0 }}>${list.length ? list.map((x) => html`<button className=${'note' + (x.read ? '' : ' un')} onClick=${() => open(x)}><span className="noteic"><${I} n=${x.icon} s="14" /></span><span className="notet">${x.text}<small>${A.fmtList(x.t)}</small></span></button>`)
        : html`<div className="emptyv">You're all caught up.</div>`}</div>
      <div className="notefoot"><button className="link" onClick=${() => A.go('settings')}>Notification settings</button></div></div>`;
  }
  A.ExtraPanels = Object.assign(A.ExtraPanels || {}, { notes: Notes });

  // per-conversation level: All / Mentions only / Nothing
  A.NotifyLevelItems = (PI, c) => { const lvl = c.notify || (c.muted ? 'none' : 'all'); const setL = (l) => A.set(() => { c.notify = l; c.muted = l === 'none'; });
    return html`<div className="pisub">Notify me about</div>${[['all', 'bell', 'Every message'], ['mentions', 'mention', 'Only @mentions'], ['none', 'belloff', 'Nothing (mute)']].map(([k, ic, l]) => html`<${PI} icon=${ic} label=${l + (lvl === k ? '  ✓' : '')} onClick=${() => setL(k)} />`)}`; };

  // ---------- language & accessibility ----------
  const DICT = {
    es: { 'Needs you': 'Te necesita', 'My work': 'Mi trabajo', 'Messages': 'Mensajes', 'Send': 'Enviar', 'Search': 'Buscar', 'Notifications': 'Notificaciones', 'Settings': 'Configuración', 'Insights': 'Estadísticas' },
    fr: { 'Needs you': 'Pour vous', 'My work': 'Mon travail', 'Messages': 'Messages', 'Send': 'Envoyer', 'Search': 'Rechercher', 'Notifications': 'Notifications', 'Settings': 'Paramètres', 'Insights': 'Statistiques' },
  };
  A.S.lang = get('aspen-lang', 'en'); A.S.contrast = get('aspen-hc', '') === '1'; A.S.textSize = get('aspen-ts', 'm');
  A.t = (s) => (DICT[A.S.lang] && DICT[A.S.lang][s]) || s;
  const applyA11y = () => { const d = document.documentElement; d.classList.toggle('hc', A.S.contrast); d.dataset.ts = A.S.textSize; d.lang = A.S.lang === 'fr' ? 'fr-CA' : A.S.lang; };
  applyA11y();
  A.setPref = (k, v) => { A.set((s) => { s[k] = v; }); put({ lang: 'aspen-lang', contrast: 'aspen-hc', textSize: 'aspen-ts' }[k], k === 'contrast' ? (v ? '1' : '') : v); applyA11y(); };
  // translate the visible labels the dictionary knows (nav, buttons), without touching user content
  const walk = () => { if (A.S.lang === 'en' && !A._tr) return; A._tr = true; document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = A.t(el.dataset.i18n); });
    document.querySelectorAll('nav button, .navi, .tab, .cmpsend, .seg button').forEach((el) => { if (el.children.length > 2) return; el.childNodes.forEach((n) => { if (n.nodeType !== 3) return; const k = n._en || n.textContent.trim(); if (!k) return; n._en = k; const t = A.t(k); if (n.textContent.trim() !== t) n.textContent = t; }); }); };
  const set0 = A.set; A.set = (p) => { set0(p); if (A.S.lang !== 'en' || A._tr) requestAnimationFrame(walk); };

  // ---------- pages ----------
  const Page = ({ title, sub, children }) => html`<div className="main"><div className="page"><h1>${title}</h1><p className="sub">${sub}</p>${children}</div></div>`;
  const Sw = ({ on, label, set }) => html`<button role="switch" aria-checked=${!!on} aria-label=${label} className=${'sw' + (on ? ' on' : '')} onClick=${set}></button>`;
  const Bar = ({ v, max, c }) => html`<span className="ibar"><i style=${{ width: Math.round((v / max) * 100) + '%', background: c || 'var(--accent)' }}></i></span>`;

  A.InsightsView = function InsightsView() {
    const W = A.WORK, closed = W.filter(A.isClosed), open = W.filter((w) => !A.isClosed(w)), late = open.filter(A.isOverdue);
    const ap = W.filter((w) => w.type === 'approval' && w.history && w.history.length > 1);
    const people = Object.keys(A.USERS).map((u) => ({ u, n: open.filter((w) => (w.type === 'approval' ? w.approver : w.owner) === u).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...people.map((x) => x.n)); const msgs = A.CONVS.reduce((n, c) => n + c.msgs.length, 0);
    const kpi = (v, l, hint) => html`<div className="kpi"><b>${v}</b><span>${l}</span>${hint ? html`<small>${hint}</small>` : null}</div>`;
    return html`<${Page} title="Insights" sub="How work moves through the store this week. Numbers come from messages and work items in ASPEN.">
      <div className="kpis">${kpi(open.length, 'Open items', late.length ? late.length + ' overdue' : 'none overdue')}${kpi(closed.length, 'Done this week')}${kpi('2.4 h', 'Median approval time', ap.length + (ap.length === 1 ? ' approval' : ' approvals') + ' this week')}${kpi('11 min', 'Median first reply', msgs + ' messages')}</div>
      <h2 className="h2">Open work by person</h2>
      <div className="ilist">${people.map((x) => html`<div className="irow"><span>${A.uname(x.u)}</span><${Bar} v=${x.n} max=${max} /><b>${x.n}</b></div>`)}</div>
      <h2 className="h2">Approvals: time to decide</h2>
      <div className="ilist">${[['Discounts over 10%', 3.1, 'var(--orange)'], ['Warranty write-offs', 5.6, 'var(--orange)'], ['Parts over $500', 1.2, 'var(--orange)'], ['Trade-in appraisals', 0.8, 'var(--orange)']].map(([l, h, c]) => html`<div className="irow"><span>${l}</span><${Bar} v=${h} max=${6} c=${c} /><b>${h} h</b></div>`)}</div>
      <p className="hintline">Approvals that wait longer than the rule's escalation time are shown in Approval rules.</p></${Page}>`;
  };

  A.IntegrationsView = function IntegrationsView() {
    const S = A.S; S.integ = S.integ || { outlook: true, email: true, sms: true, teams: false };
    const tog = (k) => A.set((s) => { s.integ[k] = !s.integ[k]; });
    const row = (k, ic, name, desc, extra) => html`<div className="intg"><span className="intgic"><${I} n=${ic} s="18" /></span><div className="intgt"><b>${name}</b><span>${desc}</span>${S.integ[k] && extra ? html`<code>${extra}</code>` : null}</div><${Sw} on=${S.integ[k]} label=${name} set=${() => tog(k)} /></div>`;
    return html`<${Page} title="Integrations" sub="Connect ASPEN Messaging to the tools your store already uses.">
      ${row('outlook', 'calendar', 'Outlook calendar', 'Work items with a due time can be added to your Outlook calendar.', 'Signed in as ' + A.USERS[A.ME].name)}
      ${row('email', 'mail', 'Email to task', 'Forward an email and it becomes a task in My work, with the email attached.', 'tasks+lakeside@aspen.chartersoftware.cloud')}
      ${row('sms', 'phone', 'Customer texting', 'Text customers from a record conversation. Replies come back into the same thread.', '(555) 201-4410 · Lakeside Powersports')}
      ${row('teams', 'chat', 'Microsoft Teams', 'Mirror record conversations into a Teams channel for staff who live there.')}
      <p className="hintline">Single sign-on, multi-factor sign-in, and retention are in Security.</p></${Page}>`;
  };

  A.SecurityView = function SecurityView() {
    const S = A.S; S.sec = S.sec || { mfa: true, ret: '7', holds: [{ rec: 'RO 48213', who: 'Dana Ruiz', why: 'Warranty dispute' }], sessions: [{ id: 's1', d: 'ASPEN desktop · Service-PC-04', t: 'Active now', me: true }, { id: 's2', d: 'iPhone · Safari', t: '2 hours ago' }, { id: 's3', d: 'Chrome · Windows', t: 'Yesterday' }] };
    const sec = S.sec;
    return html`<${Page} title="Security & data" sub="Who can sign in, from where, and how long messages are kept.">
      <h2 className="h2">Sign-in</h2>
      <div className="intg"><span className="intgic"><${I} n="lock" s="18" /></span><div className="intgt"><b>Single sign-on with your ASPEN account</b><span>People sign in once with ASPEN. Removing someone in ASPEN signs them out here too.</span></div><span className="okpill">On</span></div>
      <div className="intg"><span className="intgic"><${I} n="lock" s="18" /></span><div className="intgt"><b>Ask for a code on new devices</b><span>Multi-factor sign-in for phones and browsers outside the store.</span></div><${Sw} on=${sec.mfa} label="Multi-factor sign-in" set=${() => A.set(() => { sec.mfa = !sec.mfa; })} /></div>
      <h2 className="h2">Where you're signed in</h2>
      <div className="tbl"><table><tbody>${sec.sessions.map((x) => html`<tr><td>${x.d}</td><td>${x.t}</td><td style=${{ textAlign: 'right' }}>${x.me ? html`<span className="okpill">This device</span>` : html`<button className="btn sm" onClick=${() => A.set(() => { sec.sessions = sec.sessions.filter((y) => y !== x); A.snack('Signed out of ' + x.d); })}>Sign out</button>`}</td></tr>`)}</tbody></table></div>
      <h2 className="h2">Keep messages for</h2>
      <div className="fld" style=${{ maxWidth: 280 }}><label htmlFor="sec-ret">Store policy</label><select id="sec-ret" value=${sec.ret} onChange=${(e) => A.set(() => { sec.ret = e.target.value; })}><option value="3">3 years</option><option value="7">7 years (recommended for service records)</option><option value="0">Forever</option></select></div>
      <h2 className="h2">Legal holds</h2>
      <p className="hintline" style=${{ marginTop: 0 }}>Conversations on hold are never deleted, even after the retention period.</p>
      <div className="tbl"><table><thead><tr><th>Record</th><th>Placed by</th><th>Reason</th><th></th></tr></thead><tbody>${sec.holds.map((h) => html`<tr><td>${h.rec}</td><td>${h.who}</td><td>${h.why}</td><td style=${{ textAlign: 'right' }}><button className="btn sm" onClick=${() => A.set(() => { sec.holds = sec.holds.filter((y) => y !== h); A.snack('Hold released on ' + h.rec); })}>Release</button></td></tr>`)}</tbody></table></div>
      <p className="hintline">Every message edit and delete is kept in the audit log for managers.</p></${Page}>`;
  };

  A.PrefsView = function PrefsView() {
    const S = A.S;
    return html`<${Page} title="Language & accessibility" sub="Applies to this device only.">
      <div className="fld" style=${{ maxWidth: 280 }}><label htmlFor="pf-lang">Language</label><select id="pf-lang" value=${S.lang} onChange=${(e) => A.setPref('lang', e.target.value)}><option value="en">English</option><option value="es">Español</option><option value="fr">Français (Canada)</option></select></div>
      <h2 className="h2">Text size</h2>
      <div className="themeseg" role="radiogroup" aria-label="Text size">${[['s', 'Smaller'], ['m', 'Default'], ['l', 'Larger'], ['xl', 'Largest']].map(([k, l]) => html`<button role="radio" aria-checked=${S.textSize === k} className=${S.textSize === k ? 'on' : ''} onClick=${() => A.setPref('textSize', k)}>${l}</button>`)}</div>
      <div className="intg" style=${{ marginTop: 18 }}><div className="intgt"><b>High contrast</b><span>Stronger borders and text for bright shop floors and low vision.</span></div><${Sw} on=${S.contrast} label="High contrast" set=${() => A.setPref('contrast', !S.contrast)} /></div>
      <div className="intg"><div className="intgt"><b>Translate messages</b><span>Messages in another language show a "Translate" link.</span></div><span className="okpill">On</span></div>
      <p className="hintline">Keyboard: Ctrl+K search · Alt+↑/↓ next conversation · Ctrl+Enter send.</p></${Page}>`;
  };
  A.ExtraViews = Object.assign(A.ExtraViews || {}, { insights: A.InsightsView, integrations: A.IntegrationsView, security: A.SecurityView, prefs: A.PrefsView });

  A.GearItems = (Item) => html`<hr />
    <${Item} icon="star" label="Saved messages" onClick=${() => A.go('saved')} />
    <${Item} icon="activity" label="Insights" onClick=${() => A.go('insights')} />
    <${Item} icon="shield" label="Approval rules" onClick=${() => A.go('rules')} />
    <${Item} icon="ext" label="Integrations" onClick=${() => A.go('integrations')} />
    <${Item} icon="lock" label="Security & data" onClick=${() => A.go('security')} />
    <${Item} icon="help" label="Language & accessibility" onClick=${() => A.go('prefs')} />`;
  A.set({});
})();
