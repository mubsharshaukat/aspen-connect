// Messaging sidebar: expanded panel with collapsible sections, or a collapsed icon rail with hover-peek.
// Resizable; collapsed state and width are remembered per viewer.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useEffect, useRef } = React;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('aspen-sb') || '{}'); } catch (e) {}
  A.S.sb = { col: !!saved.col, w: saved.w || 320, peek: false, open: { need: true, pinned: true, convs: true, calls: true, people: true } };
  const save = () => { try { localStorage.setItem('aspen-sb', JSON.stringify({ col: A.S.sb.col, w: A.S.sb.w })); } catch (e) {} };
  A.toggleSidebar = () => { A.set((s) => { s.sb.col = !s.sb.col; s.sb.peek = false; }); save(); };
  window.addEventListener('keydown', (e) => { if (e.ctrlKey && (e.key === 'b' || e.key === 'B') && A.S.connect !== 'closed') { e.preventDefault(); A.toggleSidebar(); } });

  const sectionOf = () => (A.S.section === 'people' || A.S.section === 'calls' ? A.S.section : 'inbox');
  const convList = () => { const S = A.S, f = S.chatFilter; let l = A.CONVS.filter((c) => c.kind !== 'channel');
    if (f === 'unread') l = l.filter((c) => c.unread); if (f === 'mentions') l = l.filter((c) => A.mentionConvs().includes(c)); if (f === 'work') l = l.filter((c) => A.workIn(c.id).some((w) => !A.isClosed(w))); if (f === 'records') l = l.filter((c) => c.kind === 'record');
    const t = (c) => (A.lastMsg(c) || { t: 0 }).t; return l.sort((a, b) => t(b) - t(a)); };

  function Sec({ k, label, count, tone, children, action }) {
    const S = A.S, open = S.sb.open[k] !== false;
    return html`<section className="sbsec"><div className="sech" role="button" tabIndex="0" aria-expanded=${open} onClick=${() => A.set((s) => { s.sb.open[k] = !open; })} onKeyDown=${(e) => e.key === 'Enter' && A.set((s) => { s.sb.open[k] = !open; })}>
      <svg className=${'chev' + (open ? ' open' : '')} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span>${label}</span>${count ? html`<span className=${'scount ' + (tone || '')}>${count}</span>` : null}<span className="grow"></span>${action || null}</div>
      <div className=${'secbody' + (open ? ' open' : '')}><div>${children}</div></div></section>`;
  }

  // ---------- expanded panel ----------
  function Panel({ overlay }) {
    const S = A.S, sec = sectionOf(), need = A.needsMe(), un = A.unreadTotals();
    const titles = { inbox: ['Chat', un.chat + ' unread'], people: ['People', Object.keys(A.USERS).length - 1 + ' people · ' + A.TEAMS.length + ' teams'], calls: ['Calls', A.CALLS.length + ' recent'] };
    let body;
    const ctx = html`${A.BriefCard && sec === 'inbox' && !S.q ? html`<${A.BriefCard} />` : null}${A.CtxChip && sec === 'inbox' && !S.q ? html`<${A.CtxChip} />` : null}`;
    if (S.q) body = html`${A.AskCard ? html`<${A.AskCard} q=${S.q.trim()} />` : null}<${A.SearchResults} q=${S.q.trim().toLowerCase()} />`;
    else if (sec === 'inbox') {
      const list = convList(), pinned = list.filter((c) => c.pinned), rest = list.filter((c) => !c.pinned);
      body = html`
        <div className="seg2" role="tablist" aria-label="Filter conversations">${[['all', 'All'], ['unread', 'Unread', un.chat], ['mentions', '@Me', A.mentionConvs().length], ['work', 'Work'], ['records', 'Records']].map(([k, l, n]) => html`<button role="tab" aria-selected=${S.chatFilter === k} className=${S.chatFilter === k ? 'on' : ''} onClick=${() => A.set({ chatFilter: k })}>${l}${n ? html`<b>${n}</b>` : null}</button>`)}</div>
        ${pinned.length ? html`<${Sec} k="pinned" label="Pinned" count=${pinned.length}>${pinned.map((c) => html`<${A.ConvRowD} key=${c.id} c=${c} />`)}</${Sec}>` : null}
        <${Sec} k="convs" label="Recent" count=${rest.length}>${rest.map((c) => html`<${A.ConvRowD} key=${c.id} c=${c} />`)}${!rest.length ? html`<div className="sbempty">Nothing here.</div>` : null}</${Sec}>`;
    } else if (sec === 'people') body = html`<${Sec} k="calls" label="Recent calls" count=${A.CALLS.filter((x) => x.dir === 'missed').length} tone="bad"><${A.CallList} /></${Sec}><${Sec} k="people" label="People and teams"><${A.PeopleList} /></${Sec}>`;
    else body = html`<${A.CallList} />`;
    return html`<div className=${'sbpanel' + (overlay ? ' peek' : '')} onMouseLeave=${() => overlay && A.set((s) => { s.sb.peek = false; })}>
      <div className="sbh"><div style=${{ flex: 1, minWidth: 0 }}><h3>${titles[sec][0]}</h3><small>${titles[sec][1]}</small></div>
        ${overlay ? html`<button className="sbbtn" title="Keep the sidebar open" onClick=${() => { A.set((s) => { s.sb.col = false; s.sb.peek = false; }); save(); }}><${I} n="pin" s="12" /></button>` : null}
        <button className="sbbtn" title=${(overlay ? 'Close' : 'Collapse sidebar') + ' (Ctrl+B)'} aria-label="Collapse sidebar" onClick=${() => (overlay ? A.set((s) => { s.sb.peek = false; }) : A.toggleSidebar())}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 2.5v11" stroke="currentColor" strokeWidth="1.3" /><path d="M11 6 9 8l2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
      <div className="sbbody">${ctx}${body}</div>
      <div className="sbfoot"><span><kbd>Ctrl</kbd>+<kbd>B</kbd> collapse</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> jump</span></div></div>`;
  }

  // ---------- collapsed rail ----------
  function RItem({ tip, on, badge, tone, onClick, children }) {
    return html`<button className=${'ritem' + (on ? ' on' : '')} data-tip=${tip} aria-label=${tip} onClick=${onClick}>${children}${badge ? html`<span className=${'dot ' + (tone || '')}>${badge > 99 ? '99+' : badge}</span>` : null}</button>`;
  }
  function Rail() {
    const S = A.S, sec = sectionOf(), timer = useRef();
    const enter = () => { clearTimeout(timer.current); timer.current = setTimeout(() => A.set((s) => { s.sb.peek = true; }), 550); };
    const leave = () => clearTimeout(timer.current);
    useEffect(() => () => clearTimeout(timer.current), []);
    let items;
    if (sec === 'inbox') {
      const need = A.needsMe(), list = convList(), pinned = list.filter((c) => c.pinned), rest = list.filter((c) => !c.pinned).slice(0, 9);
      items = html`${pinned.map((c) => html`<${RItem} key=${c.id} tip=${A.convName(c)} on=${S.convId === c.id} badge=${c.unread} onClick=${() => A.openConv(c.id)}><${A.Av2} c=${c} /></${RItem}>`)}
        ${pinned.length ? html`<i className="rsep"></i>` : null}
        ${rest.map((c) => html`<${RItem} key=${c.id} tip=${A.convName(c)} on=${S.convId === c.id} badge=${c.unread} onClick=${() => A.openConv(c.id)}><${A.Av2} c=${c} /></${RItem}>`)}`;
    } else if (sec === 'people') {
      const online = Object.keys(A.USERS).filter((u) => u !== A.ME && A.USERS[u].pres !== 'off').slice(0, 8);
      items = html`${A.TEAMS.map((t) => html`<${RItem} key=${t.id} tip=${t.name} onClick=${() => A.openTeam(t)}><${A.Av2} c=${{ id: t.id, kind: 'team', name: t.name, members: t.members }} /></${RItem}>`)}<i className="rsep"></i>
        ${online.map((u) => html`<${RItem} key=${u} tip=${A.USERS[u].name + ' · ' + A.presLabel(A.USERS[u].pres)} onClick=${() => A.dmWith(u)}><${A.Av} u=${u} /></${RItem}>`)}`;
    } else items = A.CALLS.slice(0, 9).map((x) => html`<${RItem} key=${x.id} tip=${(A.USERS[x.who] ? A.USERS[x.who].name : A.convName(A.conv(x.who))) + ' · ' + (x.dir === 'missed' ? 'missed' : x.kind)} badge=${x.dir === 'missed' ? 1 : 0} onClick=${() => (A.USERS[x.who] ? A.dmWith(x.who) : A.openConv(x.who))}>${A.USERS[x.who] ? html`<${A.Av} u=${x.who} pres=${false} />` : html`<${A.Av2} c=${A.conv(x.who)} />`}</${RItem}>`);
    return html`<nav className="rail2" aria-label="Collapsed sidebar" onMouseEnter=${enter} onMouseLeave=${leave}>
      <button className="ritem expand" data-tip="Expand sidebar (Ctrl+B)" aria-label="Expand sidebar" onClick=${A.toggleSidebar}><svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 2.5v11" stroke="currentColor" strokeWidth="1.3" /><path d="M9 6l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      ${items}</nav>`;
  }

  // ---------- container with resize handle ----------
  A.SidebarPanel = Panel;
  A.Sidebar = function Sidebar() {
    const S = A.S, sb = S.sb, drag = useRef(null);
    const down = (e) => { e.preventDefault(); drag.current = { x: e.clientX, w: sb.w }; e.currentTarget.setPointerCapture(e.pointerId); A.set((s) => { s.sb.dragging = true; }); };
    const move = (e) => { if (!drag.current) return; const w = Math.max(260, Math.min(460, drag.current.w + e.clientX - drag.current.x)); if (w !== A.S.sb.w) A.set((s) => { s.sb.w = w; }); };
    const up = () => { if (!drag.current) return; drag.current = null; A.set((s) => { s.sb.dragging = false; }); save(); };
    return html`<aside className=${'sb' + (sb.col ? ' col' : '') + (sb.dragging ? ' dragging' : '')} style=${{ '--sbw': sb.w + 'px' }}>
      ${sb.col ? html`<${Rail} />${sb.peek ? html`<${Panel} overlay=${true} />` : null}` : html`<${Panel} />`}
      ${!sb.col ? html`<div className="sbres" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" title="Drag to resize · double-click to reset" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onDoubleClick=${() => { A.set((s) => { s.sb.w = 320; }); save(); }}></div>` : null}
    </aside>`;
  };
  A.set({});
})();
