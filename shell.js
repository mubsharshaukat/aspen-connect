// ASPEN Desktop frame, Connect window chrome, rail, quick switcher, toasts, small shared bits.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef } = React;

  A.Av = function Av({ u, size, pres, sq, onClick }) {
    const x = A.USERS[u];
    if (!x) return html`<div className=${'av ' + (size ? 's' + size : '')} style=${{ background: 'var(--fg3)' }}>?</div>`;
    const p = pres === false ? null : (u === A.ME ? A.S.myPres : (A.S.call && A.S.call.with === u ? 'call' : x.pres));
    return html`<div className=${'av ' + (size ? 's' + size : '') + (sq ? ' sq' : '')} style=${{ background: x.color, cursor: onClick ? 'pointer' : undefined }} onClick=${onClick} title=${x.name}>
      ${x.photo ? html`<img className="avimg" src=${x.photo} alt="" />` : x.ini}${p ? html`<span className=${'pres ' + p} title=${A.presLabel(p)}></span>` : null}</div>`;
  };
  A.presLabel = (p) => ({ on: 'Free', busy: 'Busy', dnd: 'No interruptions', away: 'Away', brb: 'Back shortly', off: 'Off', call: 'On a call' })[p] || p;
  A.GroupPic = function GroupPic({ c, size }) {
    const ph = c.photo || A.GPICS[c.id], sz = size || 32;
    if (ph) return html`<span className="av sq" style=${{ width: sz, height: sz }}><img className="avimg" src=${ph} alt="" /></span>`;
    const ms = (c.members || []).filter((m) => m !== A.ME && A.USERS[m] && A.USERS[m].photo).slice(0, 2);
    if (!ms.length) return null;
    return html`<span className="av sq gcomp" style=${{ width: sz, height: sz }}>${ms.map((m) => html`<img src=${A.USERS[m].photo} alt="" />`)}</span>`;
  };
  A.ConvAv = function ConvAv({ c, size }) {
    if (c.kind === 'dm') return html`<${A.Av} u=${c.with} size=${size} />`;
    if (c.kind === 'record') { const r = A.RECORDS[c.rec]; return html`<span className="recband" style=${{ background: A.RECKIND[r.kind].color, width: size === 24 ? 24 : 32, height: size === 24 ? 24 : 32 }}>${r.kind}</span>`; }
    if (c.kind === 'channel') return html`<span className="av sq" style=${{ background: 'var(--chrome)', color: 'var(--fg2)', width: size || 32, height: size || 32 }}><${I} n=${c.readonly ? 'megaphone' : c.private ? 'lock' : 'hash'} /></span>`;
    const gp = A.GroupPic({ c, size }); if (gp) return gp;
    const others = c.members.filter((m) => m !== A.ME).slice(0, 2);
    return html`<span className="av sq" style=${{ background: '#5c6bc0', width: size || 32, height: size || 32, fontSize: 11 }}>${others.map((o) => A.USERS[o].ini[0]).join('')}</span>`;
  };
  A.openProfile = (u, e) => { const r = e.currentTarget.getBoundingClientRect(); const box = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'profile', u, x: Math.min(r.left - box.left, box.width - 330), y: Math.min(r.bottom - box.top + 4, box.height - 330) } }); e.stopPropagation(); };

  // ---------- ASPEN Desktop ----------
  A.Desktop = function Desktop() {
    const S = A.S, un = A.unreadTotals();
    const NAV = [
      ['favorites', 'Favorites', 'star', '#e8a317', []],
      ['dashboard', 'Dashboard', 'home', '#2b7cd3', [['Executive Dashboard'], ['Analytics', 1], ['Dealer Portal'], ['Audit Logs', 0, 1], ['ASPEN eSign'], ['Calendar'], ['Workflow', 1], ['CRM', 1], ['Test Harness']]],
      ['accounting', 'Accounting', 'acct', '#2e7d32', [['Invoices', 0, 0, 'INV 220981'], ['Accounts Receivable'], ['General Ledger']]],
      ['customers', 'Customers', 'cust', '#d83b01', [['Customers', 0, 0, 'CUST Pruitt'], ['Leads']]],
      ['parts', 'Parts', 'parts', '#d83b01', [['Parts Inventory'], ['Purchase Orders', 0, 0, 'PO 1234'], ['Special Orders']]],
      ['units', 'Units', 'units', '#424242', [['Unit Inventory', 0, 0, 'UNIT C4471'], ['Unit Orders']]],
      ['sales', 'Sales', 'sales', '#0063b1', [['Deals', 0, 0, 'DEAL 7741'], ['Quotes', 0, 0, 'QT 3381']]],
      ['service', 'Service', 'wrench', '#008575', [['Repair Orders', 0, 1, 'RO 48213'], ['Work Orders', 0, 0, 'WO 5102'], ['Service Schedule']]],
      ['rental', 'Rental', 'car', '#c50f1f', [['Rental Contracts']]],
      ['reports', 'Reports', 'report', '#424242', [['Report Center']]],
      ['settings', 'Settings', 'settings', '#8764b8', [['System Settings'], ['Users and Roles']]]];
    NAV[0][4] = NAV.flatMap((m) => m[4].filter((x) => x[2]));
    const nopen = S.navOpen || (S.navOpen = { dashboard: true });
    const view = (rec) => (rec === 'RO 48213' ? 'ro' : rec ? 'rec:' + rec : 'dashboard');
    const leaf = ([t, grp, fav, rec]) => html`<div key=${t} className=${'an2i' + (grp ? ' grp' : '') + (rec && S.aspenView === view(rec) ? ' on' : '')} onClick=${() => (A.S.aspenShown = true) && (rec && A.RECORDS[rec] ? A.openInAspen(rec) : A.set({ aspenView: 'dashboard' }))}>${t}${grp ? html`<${I} n="chev" s="12" />` : html`<span className=${'an2star' + (fav ? ' fav' : '')}><${I} n="star" s="12" /></span>`}</div>`;
    const docked = S.connect === 'docked';
    return html`<div className="desk aspen2" onClick=${() => S.pop && A.set({ pop: null })}>
      <div className="wtitle"><span className="leaf"><${I} n="leaf" /></span><span>ASPEN Desktop - 26.3.0.4c8c850c - 26023-ESign-Full-Module</span><span className="grow"></span><span className="wbtns"><span><${I} n="min" s="12"/></span><span><${I} n="max" s="12"/></span><span><${I} n="close" s="12"/></span></span></div>
      <div className="atool">
        <button className="tb" title="New window"><${I} n="popout" /></button><button className="tb" title="Sign out"><${I} n="signout" /></button><button className="tb" title="Lock ASPEN"><${I} n="lockclosed" /></button><span className="tsep"></span>
        <span className="tb">Switch to Classic <span className="toggle on"></span></span><button className="tb" title="Layout"><${I} n="layout" /></button><button className="tb" title="Full screen"><${I} n="full" /></button><span className="tsep"></span>
        <button className="tb" title="Settings"><${I} n="settings" /></button><span className="tsep"></span>
        <span className="tb"><${I} n="star" style=${{ color: '#e8a317' }} /> <b style=${{ fontWeight: 600 }}>Universal Search:</b><input className="usearch" id="aspen-usearch" aria-label="Universal Search" placeholder="RO, deal, part, person…" onKeyDown=${(e) => { if (e.key === 'Enter' && e.target.value.trim()) { A.universalSearch(e.target.value.trim()); } }} /><${I} n="search" /></span>
        <span className="tb"><span className="leaf"><${I} n="leaf" /></span>Open Point of Sale <${I} n="down" s="12" /></span>
        <span className="grow"></span>
        <button className="tb"><${I} n="ticket" style=${{ color: '#0063b1' }} />Support Ticket</button>
        <button className=${'tb' + (S.connect !== 'closed' ? ' on' : '')} title="ASPEN Messaging (Ctrl+click to dock)" onClick=${(e) => A.set({ connect: e.ctrlKey ? 'docked' : (S.connect === 'open' ? 'closed' : 'open') })}>
          <${I} n="chat" style=${{ color: '#0063b1' }} />Messages ${un.chat ? html`<span className="badge">${un.chat}</span>` : null}</button>
        <button className="tb" onClick=${() => { A.set((s) => { if (s.connect === 'closed') s.connect = 'open'; }); A.go('tasks'); }}><${I} n="task" style=${{ color: '#0063b1' }} />Tasks ${A.myOpenTasks && A.myOpenTasks() ? html`<span className="badge" style=${{ background: 'var(--orange)' }}>${A.myOpenTasks()}</span>` : null}</button>
        <button className="tb"><${I} n="help" style=${{ color: '#0063b1' }} />Help <${I} n="down" s="12" /></button>
      </div>
      <div className="abody">
        <nav className="anav2" aria-label="ASPEN navigator">${NAV.map(([k, t, ic, col, kids]) => html`<div key=${k} className="an2m">
          <div className=${'an2h' + (nopen[k] ? ' open' : '')} role="button" tabIndex="0" aria-expanded=${!!nopen[k]} onClick=${() => A.set((s) => { s.navOpen[k] = !s.navOpen[k]; })}><span className="an2ic" style=${{ color: col }}><${I} n=${ic} /></span>${t}${k === 'favorites' ? html`<span className="an2info"><${I} n="info" s="12" /></span>` : null}<span className="grow"></span><${I} n=${nopen[k] ? 'down' : 'chev'} s="12" /></div>
          ${nopen[k] ? html`<div className="an2kids">${kids.length ? kids.map(leaf) : html`<div className="an2none">Star a screen to add it here</div>`}</div>` : null}</div>`)}</nav>
        <div className="mdi">
          <div className="mdimain">${!S.aspenShown ? null : A.AspenView ? html`<${A.AspenView} />` : S.aspenView === 'ro' ? html`<${A.ROForm} />` : html`<${A.Dash} />`}
            ${S.connect === 'open' ? html`<${A.ConnectWin} />` : null}</div>
          ${docked ? html`<${A.ConnectWin} docked=${true} />` : null}
          <div className="toastzone">${S.toasts.map((t) => html`<${A.WinToast} key=${t.id} t=${t} />`)}</div>
        </div>
      </div>
      <div className="sbar">
        <span className="r"><span><${I} n="signal" s="12" />ASPENAPIST</span><span><${I} n="db" s="12" />ASPENST</span><span><${I} n="people" s="12" />mubashir</span><button className="sbloc" title="Switch ASPEN location (Messaging follows)" onClick=${() => A.switchLocation()}><${I} n="location" s="12" />${S.location === 'All locations' ? '01 - Main Location' : S.location}</button><span><${I} n="shield" s="12" />QA</span></span>
      </div>
    </div>`;
  };

  A.Dash = function Dash() {
    const c = A.counts();
    return html`<div className="dash"><h1>Good morning, Mubshar</h1><p>Friday, October 23 · 01 - Main Location</p>
      <div className="tiles">
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.set({ aspenView: 'ro' })}><b>14</b><span>Open repair orders · 3 waiting on parts</span></button>
        <button className="tile2" style=${{ textAlign: 'left' }} onClick=${() => A.go('work')}><b>${c.open}</b><span>My open work items · ${c.overdue} overdue</span></button>
        <div className="tile2"><b>6</b><span>Deals in F&I today</span></div></div>
      <p style=${{ marginTop: 18 }}>Open <span className="link" onClick=${() => A.set({ aspenView: 'ro' })}>Repair Order 48213</span> to try the <b>Discuss</b> button, or use <b>Messages</b> in the toolbar.</p></div>`;
  };

  A.ROForm = function ROForm() {
    const c = A.conv('rec-RO 48213'), n = c ? c.msgs.filter((m) => m.kind !== 'sys').length : 0;
    return html`<div className="form">
      <div className="ftitle"><${I} n="record" style=${{ color: 'var(--service)' }} /><b>Repair Order 48213</b>${A.LockNote ? html`<${A.LockNote} />` : null}<span className="grow"></span><${I} n="close" s="12" /></div>
      <div className="fbar"><button className="btn sm ghost"><${I} n="files" />Save</button><button className="btn sm ghost">Print</button><button className="btn sm ghost">Invoice</button><span className="tsep"></span>
        <button className="btn sm ghost">Parts</button><button className="btn sm ghost">Labor</button><span className="grow"></span>
        <span className="pill a">Waiting on parts</span><button className="btn sm" title="Attach this RO to a message" onClick=${() => A.sendFromAspen("RO 48213")}><${I} n="send" />Send Message</button>
        <button className="btn sm pri" onClick=${() => { A.set({ connect: 'docked' }); A.openRecordConv('RO 48213'); A.set({ connect: 'docked' }); }}><${I} n="chat" />Discuss (${n})${c && c.unread ? ' •' : ''}</button></div>
      <div className="fgrid"><label>Customer</label><div className="v">Harlan Pruitt</div><label>RO Date</label><div className="v">10/22/2026</div>
        <label>Unit</label><div className="v">2021 Polaris RZR XP 1000</div><label>Promised</label><div className="v">10/28/2026</div>
        <label>VIN</label><div className="v">3NSRAE99XMF014417</div><label>Advisor</label><div className="v" style=${{ display: 'flex', justifyContent: 'space-between' }}>Dana Ortiz<button className="link" style=${{ fontSize: 11.5 }} onClick=${() => A.dmWith('u2')}>Message</button></div>
        <label>Complaint</label><div className="v">Battery not charging, dash flickers</div><label>Technician</label><div className="v">Sam Whitfield</div></div>
      <div className="lines"><table><thead><tr><th>Line</th><th>Part / Labor</th><th>Description</th><th>Qty</th><th>Status</th><th style=${{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>
        <tr><td>1</td><td>LABOR</td><td>Diagnose charging system</td><td>1.0</td><td>Done</td><td style=${{ textAlign: 'right' }}>$129.00</td></tr>
        <tr><td>2</td><td>4014029</td><td>Stator assembly</td><td>1</td><td><span className="pill a">Backordered</span></td><td style=${{ textAlign: 'right' }}>$642.40</td></tr>
        <tr><td>3</td><td>LABOR</td><td>Replace stator</td><td>2.4</td><td>Pending</td><td style=${{ textAlign: 'right' }}>$415.00</td></tr></tbody></table></div>
    </div>`;
  };

  // ---------- Windows-style toast ----------
  A.WinToast = function WinToast({ t }) {
    if (t.kind === 'call') {
      const u = A.USERS[t.from];
      return html`<div className="wtoast" role="alertdialog"><div className="th"><span className="logo" style=${{ width: 14, height: 14, borderRadius: 3, background: '#3a9a3e' }}></span>Aspen Messaging<span className="grow"></span><button onClick=${() => A.dismiss(t.id)}><${I} n="close" s="12" /></button></div>
        <div className="tb2"><${A.Av} u=${t.from} size="48" /><div><b style=${{ fontSize: 14 }}>${u.name}</b><div style=${{ color: 'var(--fg2)' }}>Incoming ${t.video ? 'video' : 'voice'} call${t.ctx ? ' · ' + t.ctx : ''}</div></div></div>
        <div className="ta"><button className="btn dan" onClick=${() => { A.dismiss(t.id); A.CALLS.unshift({ id: A.nextId(), who: t.from, dir: 'missed', kind: t.video ? 'Video' : 'Voice', t: Date.now(), dur: '' }); A.snack('Call declined'); }}>Decline</button>
          <button className="btn pri" onClick=${() => { A.dismiss(t.id); A.answer(t, false); }}><${I} n="phone" />Answer</button></div></div>`;
    }
    const c = A.conv(t.conv), u = A.USERS[t.from];
    return html`<div className="wtoast"><div className="th"><span className="logo" style=${{ width: 14, height: 14, borderRadius: 3, background: '#3a9a3e' }}></span>Aspen Messaging<span className="grow"></span><button onClick=${() => A.dismiss(t.id)} aria-label="Dismiss"><${I} n="close" s="12" /></button></div>
      <div className="tb2" style=${{ cursor: 'pointer' }} onClick=${() => { A.dismiss(t.id); A.openConv(t.conv); }}><${A.Av} u=${t.from} pres=${false} /><div style=${{ minWidth: 0 }}><b>${u.name}${c.kind !== 'dm' ? ' in ' + (c.kind === 'channel' ? '#' : '') + A.convName(c) : ''}</b><div style=${{ color: 'var(--fg2)' }}>${A.S.settings.preview ? t.text : 'New message'}</div></div></div>
      ${c.kind === 'dm' ? html`<${ToastReply} t=${t} />` : null}</div>`;
  };
  function ToastReply({ t }) {
    const [v, setV] = useState('');
    return html`<form style=${{ display: 'flex', gap: 6, marginTop: 10 }} onSubmit=${(e) => { e.preventDefault(); if (!v.trim()) return; A.send(t.conv, v.trim()); A.dismiss(t.id); A.snack('Reply sent to ' + A.USERS[t.from].name.split(' ')[0]); }}>
      <input id=${'tr' + t.id} value=${v} onChange=${(e) => setV(e.target.value)} placeholder="Type a reply" style=${{ flex: 1, border: '1px solid var(--line2)', borderRadius: 4, padding: '4px 8px' }} /><button className="btn sm pri">Send</button></form>`;
  }

  // ---------- Connect window ----------
  const RAIL = [['activity', 'activity', 'Activity'], ['chat', 'chat', 'Chat'], ['channels', 'channels', 'Channels'], ['alerts', 'alerts', 'Alerts'], ['calls', 'calls', 'Calls'], ['work', 'work', 'My Work'], ['files', 'files', 'Files'], ['people', 'people', 'People']];
  A.ConnectWin = function ConnectWin({ docked }) {
    const S = A.S, un = A.unreadTotals();
    const badge = { activity: un.activity, chat: un.chat, channels: un.mentions ? '@' + un.mentions : 0, alerts: un.alerts, calls: A.CALLS.filter((c) => c.dir === 'missed').length, work: A.counts().overdue };
    useEffect(() => {
      const k = (e) => { if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); A.set({ qs: true }); } if (e.key === 'Escape') A.set({ qs: false, pop: null, modal: null }); };
      window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
    }, []);
    if (docked) {
      const c = A.conv(S.convId);
      return html`<div className="cwin dock">
        <div className="ctitle"><${I} n="chat" style=${{ color: 'var(--accent)' }} /><b style=${{ fontWeight: 600 }}>Aspen Messaging</b><span className="grow"></span>
          <button className="wb" title="Open full window" onClick=${() => A.set({ connect: 'open' })}><${I} n="popout" s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
        ${c ? html`<${A.Conversation} c=${c} compact=${true} />` : null}
        ${S.modal ? html`<${A.Modal} />` : null}${S.pop ? html`<${A.Pop} />` : null}</div>`;
    }
    return html`<div className=${'cwin' + (S.max ? ' max' : '')} onClick=${(e) => { if (S.pop && !e.target.closest('.pop')) A.set({ pop: null }); }}>
      <div className="ctitle" onDoubleClick=${() => A.set({ max: !S.max })}><span className="logo" style=${{ width: 16, height: 16, borderRadius: 3, background: '#3a9a3e', color: '#fff', display: 'grid', placeItems: 'center', font: '700 10px/1 var(--font)' }}>A</span>Aspen Messaging for MUBASHIR<span className="grow"></span>
        <button className="wb" title="Dock beside ASPEN" onClick=${() => A.set({ connect: 'docked' })}><${I} n="dock" s="12" /></button>
        <button className="wb" title="Minimize" onClick=${() => A.set({ connect: 'closed' })}><${I} n="min" s="12" /></button>
        <button className="wb" title=${S.max ? 'Restore' : 'Maximize'} onClick=${() => A.set({ max: !S.max })}><${I} n=${S.max ? 'restore' : 'max'} s="12" /></button>
        <button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      <div className="ctop">
        <button className="ib" title="Back (Alt+Left)" onClick=${A.back} disabled=${!S.history.length}><${I} n="back" /></button>
        <div className="gsearch" role="button" tabIndex="0" onClick=${() => A.set({ qs: true })} onKeyDown=${(e) => e.key === 'Enter' && A.set({ qs: true })}><${I} n="search" />Search messages, people, records<kbd>Ctrl+K</kbd></div>
        <button className="locsel" onClick=${(e) => { e.stopPropagation(); A.set({ pop: { type: 'loc', x: e.currentTarget.offsetLeft - 60, y: 72 } }); }}><${I} n="location" />${S.location}<${I} n="down" s="12" /></button>
        <button className="ib" title="New chat (Ctrl+N)" onClick=${() => A.set({ modal: { type: 'newchat' } })}><${I} n="compose" /></button>
      </div>
      ${S.urgent && !S.acks[S.urgent.id] ? html`<div className="banner urgent"><${I} n="megaphone" /><b>${S.urgent.title}</b><span>${S.urgent.body}</span><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set((s) => { s.acks[s.urgent.id] = true; })}>Got it</button></div>` : null}
      ${S.call && S.call.mini ? html`<div className="banner call"><${I} n="phone" /><b>On a call with ${S.call.title}</b><${A.CallTimer} /><span className="grow"></span><button className="btn sm" onClick=${() => A.set((s) => { s.call.mini = false; })}>Return to call</button></div>` : null}
      <div className="cbody">
        <div className="rail" role="navigation" aria-label="Sections">
          ${RAIL.map(([k, ic, l]) => html`<button className=${'ri' + (S.section === k ? ' on' : '')} onClick=${() => A.go(k)} aria-current=${S.section === k ? 'page' : undefined}><${I} n=${ic} s="20" />${l}${badge[k] ? html`<span className=${'badge' + (k === 'channels' ? ' blue' : '')}>${badge[k]}</span>` : null}</button>`)}
          <span className="sp"></span>
          <button className=${'ri' + (S.section === 'saved' ? ' on' : '')} onClick=${() => A.go('saved')}><${I} n="saved" s="20" />Bookmarks</button>
          <button className=${'ri' + (S.section === 'admin' ? ' on' : '')} onClick=${() => A.go('admin')}><${I} n="admin" s="20" />Admin</button>
          <button className="me" title="Status and settings" onClick=${(e) => { e.stopPropagation(); A.set({ pop: { type: 'status', x: 62, y: e.currentTarget.getBoundingClientRect().top - document.querySelector('.cwin').getBoundingClientRect().top - 300 } }); }}><${A.Av} u=${A.ME} /></button>
        </div>
        <${A.SectionView} />
      </div>
      ${S.qs ? html`<${A.QuickSwitch} />` : null}
      ${S.call && !S.call.mini ? html`<${A.CallView} />` : null}
      ${S.call && S.call.mini ? html`<${A.MiniCall} />` : null}
      ${S.modal ? html`<${A.Modal} />` : null}
      ${S.pop ? html`<${A.Pop} />` : null}
      ${S.snack ? html`<div className="snack" role="status">${S.snack.text}${S.snack.undo ? html`<span className="link" onClick=${() => { S.snack.undo(); A.set({ snack: null }); }}>Undo</span>` : null}</div>` : null}
    </div>`;
  };

  // ---------- quick switcher ----------
  A.QuickSwitch = function QuickSwitch() {
    const [q, setQ] = useState(''); const [i, setI] = useState(0); const ref = useRef();
    useEffect(() => ref.current && ref.current.focus(), []);
    const ql = q.trim().toLowerCase();
    const convs = A.CONVS.filter((c) => !ql || A.convName(c).toLowerCase().includes(ql)).slice(0, ql ? 6 : 5);
    const people = ql ? Object.keys(A.USERS).filter((u) => u !== A.ME && A.USERS[u].name.toLowerCase().includes(ql)).slice(0, 4) : [];
    const recs = ql ? Object.keys(A.RECORDS).filter((k) => k.toLowerCase().includes(ql) || A.RECORDS[k].title.toLowerCase().includes(ql)).slice(0, 4) : [];
    const items = [
      ...convs.map((c) => ({ k: 'c' + c.id, el: html`<${A.ConvAv} c=${c} size="24" />`, t: (c.kind === 'channel' ? '#' : '') + A.convName(c), s: c.kind === 'dm' ? A.USERS[c.with].title : c.kind, go: () => A.openConv(c.id) })),
      ...people.filter((u) => !convs.some((c) => c.with === u)).map((u) => ({ k: 'u' + u, el: html`<${A.Av} u=${u} size="24" />`, t: A.USERS[u].name, s: A.USERS[u].title + ' · ' + A.USERS[u].loc, go: () => A.dmWith(u) })),
      ...recs.map((k) => ({ k: 'r' + k, el: html`<span className="recband" style=${{ background: A.RECKIND[A.RECORDS[k].kind].color, width: 24, height: 24 }}>${A.RECORDS[k].kind}</span>`, t: k + ' · ' + A.RECORDS[k].title, s: A.RECORDS[k].status, go: () => A.openRecordConv(k) })),
      ...(ql ? [{ k: 'search', el: html`<${I} n="search" />`, t: 'Search messages for "' + q + '"', s: 'Enter', go: () => A.go('search', { searchQ: q }) }] : []),
    ];
    const key = (e) => { if (e.key === 'ArrowDown') { setI(Math.min(i + 1, items.length - 1)); e.preventDefault(); } if (e.key === 'ArrowUp') { setI(Math.max(i - 1, 0)); e.preventDefault(); } if (e.key === 'Enter' && items[i]) items[i].go(); };
    return html`<div className="scrim" style=${{ background: 'rgba(0,0,0,.12)', placeItems: 'start center' }} onClick=${(e) => e.target === e.currentTarget && A.set({ qs: false })}>
      <div className="qs" role="dialog" aria-label="Search"><input id="qs-input" ref=${ref} value=${q} onChange=${(e) => { setQ(e.target.value); setI(0); }} onKeyDown=${key} placeholder="Jump to a conversation, person or record (try RO 48213)" />
        <div className="res">${!ql ? html`<div className="pop" style=${{ position: 'static', boxShadow: 'none', border: 0 }}><div className="ph">Recent</div></div>` : null}
          ${items.map((it, j) => html`<div key=${it.k} className=${'pop-row'} style=${{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 14px', cursor: 'pointer', background: j === i ? 'var(--sel)' : undefined }} onMouseEnter=${() => setI(j)} onClick=${it.go}>${it.el}<span style=${{ flex: 1 }}>${it.t}</span><small style=${{ color: 'var(--fg2)' }}>${it.s}</small></div>`)}
          ${ql && !items.length ? html`<div style=${{ padding: 14, color: 'var(--fg2)' }}>No matches.</div>` : null}</div></div></div>`;
  };
  A.dmWith = (u) => { let c = A.CONVS.find((x) => x.kind === 'dm' && x.with === u); if (!c) { c = { id: 'dm-' + u, kind: 'dm', with: u, unread: 0, members: [A.ME, u], msgs: [] }; A.CONVS.push(c); } A.openConv(c.id); };
})();
