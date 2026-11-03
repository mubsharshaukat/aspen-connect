// Appearance (light / dark / match system) and the phone layout (automatic on narrow screens, or "Preview on phone").
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useEffect } = React;
  const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // ---------- theme ----------
  A.S.theme = get('aspen-theme', 'light') === 'dark' ? 'dark' : 'light';
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  A.applyTheme = () => { const t = A.S.theme, dark = t === 'dark' || (t === 'system' && mq && mq.matches); document.documentElement.classList.toggle('dark', !!dark); A.S.isDark = !!dark; };
  A.setTheme = (t) => { A.set({ theme: t }); put('aspen-theme', t); A.applyTheme(); A.set({}); };
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { A.applyTheme(); A.set({}); });
  A.applyTheme();

  // ---------- mobile detection ----------
  A.S.phonePreview = get('aspen-phone', '0') === '1';
  A.S.mView = 'list';
  const calc = () => { A.S.mobile = A.S.phonePreview || window.innerWidth < 760; };
  calc(); if (A.S.mobile) A.S.panel = null; window.addEventListener('resize', () => { const was = A.S.mobile; calc(); if (was !== A.S.mobile) A.set({}); });
  A.setPhonePreview = (on) => { A.set({ phonePreview: on, mView: 'list', panel: null, pop: null }); put('aspen-phone', on ? '1' : '0'); calc(); A.set({}); };
  const open0 = A.openConv;
  A.openConv = (id, msgId) => { open0(id, msgId); if (A.S.mobile) A.set({ mView: 'conv', section: 'inbox' }); };

  // ---------- phone app ----------
  function TabBar() {
    const S = A.S, un = A.unreadTotals(), need = A.needsMe().length, n = A.counts();
    const notes = (S.notes || []).filter((x) => !x.read).length;
    const tabs = [['activity', 'Activity', 'bell', notes], ['inbox', 'Chat', 'chat', un.chat], ['tasks', 'Tasks', 'task', A.myOpenTasks ? A.myOpenTasks() : 0], ['newtask', 'New task', 'plus'], ['people', 'People', 'people', A.CALLS.filter((x) => x.dir === 'missed').length], ['more', 'More', 'more']];
    return html`<nav className="mtabs" aria-label="Sections">${tabs.map(([k, l, ic, b, b2]) => html`<button className=${'mtab' + (k === 'activity' ? (S.panel && S.panel.type === 'notes' ? ' on' : '') : S.section === k || (k === 'inbox' && S.section === 'chat') ? ' on' : '')} aria-current=${S.section === k ? 'page' : undefined}
      onClick=${(e) => { if (k === 'more') { const r = e.currentTarget.getBoundingClientRect(), b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'x-gear', x: b.width - 290, y: r.top - b.top - 540 } }); } else if (k === 'newtask') A.newTask(); else if (k === 'activity') A.set({ panel: S.panel && S.panel.type === 'notes' ? null : { type: 'notes' } }); else A.set({ section: k, mView: 'list', panel: null }); }}>
      <span className="mtabic"><${I} n=${ic} s="20" />${b ? html`<span className="badge">${b}</span>` : null}${b2 ? html`<span className="badge needb mb2">${b2}</span>` : null}</span>${l}</button>`)}</nav>`;
  }
  function AppBar() {
    const S = A.S; const titles = { inbox: 'Messages', chat: 'Messages', people: 'People', tasks: 'Tasks', console: 'Work Console', settings: 'Settings', admin: 'Administration' };
    return html`<header className="mbar"><div className="mbart"><span className="logo mlogo">A</span><b>${titles[S.section] || 'Messages'}</b></div>
      <button className="ib" aria-label="Search" title="Search" onClick=${() => A.set({ msearch: !S.msearch, section: 'inbox', mView: 'list' })}><${I} n="search" s="20" /></button>
      <button className="ib" aria-label="New" title="New message or task" onClick=${(e) => { const r = e.currentTarget.getBoundingClientRect(), b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'x-new', x: r.left - b.left - 250, y: r.bottom - b.top + 4 } }); }}><${I} n="compose" s="20" /></button>
      <button aria-label="Your status" onClick=${(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(), b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'status', x: r.left - b.left - 210, y: r.bottom - b.top + 4 } }); }}><${A.Av} u=${A.ME} /></button>
      ${S.msearch ? html`<div className="msearch"><label className="sbox"><${I} n="search" /><input id="m-q" value=${S.q} autoFocus onChange=${(e) => A.set({ q: e.target.value })} placeholder="Search people, messages, work" /></label><button className="link" onClick=${() => A.set({ msearch: false, q: '' })}>Cancel</button></div>` : null}</header>`;
  }
  function MobileApp() {
    const S = A.S, c = A.conv(S.convId);
    const inConv = (S.section === 'inbox' || S.section === 'chat') && S.mView === 'conv' && c;
    let body;
    if (A.ExtraViews && A.ExtraViews[S.section]) body = html`<div className="mpage"><${A.ExtraViews[S.section]} /></div>`;
    else if (S.section === 'mywork') body = html`<${A.MyWorkView} />`;
    else if (S.section === 'console') body = html`<${A.ConsoleView} />`;
    else if (S.section === 'settings' || S.section === 'admin') body = html`<div className="mpage"><${A.Page} /></div>`;
    else if (S.section === 'people') body = html`<div className="sb mfull"><div className="sbpanel"><div className="sbbody"><div className="band">Recent calls</div><${A.CallList} /><div className="band">People and teams</div><${A.PeopleList} /></div></div></div>`;
    else if (inConv) body = html`<${A.Conv3} c=${c} />`;
    else body = html`<div className="sb mfull"><${A.SidebarPanel} /></div>`;
    const sheet = S.panel && A.ExtraPanels && A.ExtraPanels[S.panel.type] ? html`<${A.ExtraPanels[S.panel.type]} p=${S.panel} />` : S.panel && S.panel.type === 'item' ? html`<${A.ItemPanel} key=${S.panel.id} id=${S.panel.id} />` : S.panel && S.panel.type === 'summary' && A.conv(S.panel.conv) ? html`<${A.SummaryPanel} key=${S.panel.key} k=${S.panel.key} c=${A.conv(S.panel.conv)} />` : S.panel && S.panel.type === 'details' && c ? html`<${A.Details2} c=${c} />` : null;
    const popEl = S.pop ? (S.pop.type.startsWith('x-') ? html`<${A.XPop} />` : S.pop.type.startsWith('s-') ? html`<${A.SPop} />` : html`<${A.Pop} />`) : null;
    const modalEl = S.modal ? (S.modal.type.startsWith('s-') ? html`<${A.SModal} />` : html`<${A.Modal} />`) : null;
    return html`<div className=${'cwin m' + (inConv ? ' inconv' : '')} onClick=${(e) => { if (S.pop && !e.target.closest('.pop')) A.set({ pop: null }); }}>
      ${!inConv ? html`<${AppBar} />` : null}
      ${A.NetBanner ? html`<${A.NetBanner} />` : null}
      ${S.urgent && !S.acks[S.urgent.id] ? html`<div className="banner urgent"><${I} n="megaphone" /><b>${S.urgent.title}</b><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set((s) => { s.acks[s.urgent.id] = true; })}>Got it</button></div>` : null}
      <div className="mbody">${body}</div>
      ${!inConv ? html`<${TabBar} />` : null}
      ${sheet ? html`<div className="msheet" role="dialog" aria-modal="true"><div className="mgrab" onClick=${() => A.set({ panel: null })} aria-label="Close"></div>${sheet}</div>` : null}
      ${S.call && !S.call.mini ? html`<${A.CallView} />` : null}${S.call && S.call.mini ? html`<${A.MiniCall} />` : null}
      ${modalEl}${popEl}
      <div className="mtoasts">${S.toasts.map((t) => html`<${A.WinToast} key=${t.id} t=${t} />`)}</div>
      ${S.snack ? html`<div className="snack" role="status">${S.snack.text}${S.snack.undo ? html`<span className="link" onClick=${() => { S.snack.undo(); A.set({ snack: null }); }}>Undo</span>` : null}</div>` : null}
    </div>`;
  }
  const Desktop0 = A.Desktop;
  A.Desktop = function Desktop() {
    const S = A.S;
    useEffect(() => { A.applyTheme(); }, []);
    if (!S.mobile) return html`<${Desktop0} />`;
    if (S.phonePreview && window.innerWidth >= 760) return html`<div className="phonestage">
      <div className="phonecap"><b>Phone preview</b><span>The same app on a 390 × 844 phone screen.</span><button className="btn sm" onClick=${() => A.setPhonePreview(false)}><${I} n="close" s="12" />Back to desktop</button>
        <button className="btn sm" onClick=${() => A.setTheme(S.isDark ? 'light' : 'dark')}>${S.isDark ? 'Light mode' : 'Dark mode'}</button></div>
      <div className="phone"><div className="pnotch"></div><div className="pstatus"><span>9:41</span><span>●●● 5G ▮</span></div><${MobileApp} /></div></div>`;
    return html`<div className="mroot"><${MobileApp} /></div>`;
  };

  A.ThemeSeg = function ThemeSeg() {
    const S = A.S;
    return html`<div className="themeseg" role="radiogroup" aria-label="Theme">${[['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => html`<button role="radio" aria-checked=${S.theme === k} className=${S.theme === k ? 'on' : ''} onClick=${(e) => { e.stopPropagation(); A.setTheme(k); }}>${l}</button>`)}</div>`;
  };
  A.set({});
})();
