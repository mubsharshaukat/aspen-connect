// Ledger design: the Connect window gets a masthead and a row of text tabs instead of an icon rail.
// Every feature, view, panel, popover and dialog is the same code as before; only the chrome is new.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect } = React;
  const close = () => A.set({ pop: null });

  const TABS = () => {
    const S = A.S, un = A.unreadTotals(), notes = (S.notes || []).filter((x) => !x.read).length, missed = A.CALLS.filter((x) => x.dir === 'missed').length, tk = A.myOpenTasks ? A.myOpenTasks() : 0;
    const sec = S.section === 'chat' ? 'inbox' : S.section, act = !!(S.panel && S.panel.type === 'notes');
    return [
      ['activity', 'Activity', notes, act, () => A.set({ panel: act ? null : { type: 'notes' } }), 'Activity and notifications', 'rust', 'bell'],
      ['inbox', 'Chat', un.chat, sec === 'inbox' && !act, () => A.go('inbox'), 'Conversations', '', 'chat'],
      ['tasks', 'Tasks', tk, sec === 'tasks' && !act, () => A.go('tasks'), 'Tasks and approvals', '', 'task'],
      ['calls', 'Calls', missed, sec === 'calls', () => A.go('calls'), 'Calls and call history', 'rust', 'calls'],
      ['people', 'People', 0, sec === 'people', () => A.go('people'), 'People and teams', '', 'people'],
      ['saved', 'Bookmarks', 0, sec === 'saved', () => A.go('saved'), 'Bookmarked messages', '', 'saved'],
    ];
  };

  // The tab row. It keeps the apprail/ri class names so the first-run tour and keyboard code still find it.
  A.AppRail = function AppRail() {
    const S = A.S;
    const newPop = (e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(), b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: S.pop && S.pop.type === 'x-new' ? null : { type: 'x-new', x: r.left - b.left, y: r.bottom - b.top + 4 } }); };
    const sec = S.section === 'chat' ? 'inbox' : S.section;
    return html`<nav className="apprail lgtabs" aria-label="Sections">
      <button className="ri rinew" title="New message or task" aria-haspopup="menu" onClick=${newPop}><span className="rinewic"><${I} n="plus" s="12" /></span><span>New</span></button>
      ${TABS().map(([k, l, b, on, fn, tip, tone, ic]) => html`<button key=${k} className=${'ri' + (on ? ' on' : '')} title=${tip} aria-label=${tip + (b ? ', ' + b : '')} aria-current=${on ? 'page' : undefined} onClick=${fn}><${I} n=${ic} s="16" /><span>${l}</span>${b ? html`<b className=${'stamp ' + tone}>${b > 99 ? '99+' : b}</b>` : null}</button>`)}
      <span className="sp"></span>
      <button className=${'ri' + (sec === 'settings' || sec === 'admin' || sec === 'insights' || sec === 'integrations' || sec === 'security' || sec === 'prefs' || sec === 'rules' ? ' on' : '')} title="Settings" onClick=${() => A.go('settings')}><${I} n="settings" s="16" /><span>Settings</span></button>
    </nav>`;
  };

  // ---------- window ----------
  const Win0 = A.ConnectWin;
  A.ConnectWin = function ConnectWin({ docked }) {
    const S = A.S, c = A.conv(S.convId);
    const right = S.panel && A.ExtraPanels && A.ExtraPanels[S.panel.type] ? html`<${A.ExtraPanels[S.panel.type]} p=${S.panel} />` : S.panel && S.panel.type === 'summary' && A.conv(S.panel.conv) ? html`<${A.SummaryPanel} key=${S.panel.key} k=${S.panel.key} c=${A.conv(S.panel.conv)} />` : S.panel && S.panel.type === 'item' ? html`<${A.ItemPanel} key=${S.panel.id} id=${S.panel.id} />` : S.panel && S.panel.type === 'details' && c ? html`<${A.Details2} c=${c} />` : null;
    const popEl = S.pop ? (S.pop.type.startsWith('x-') ? html`<${A.XPop} />` : S.pop.type.startsWith('s-') ? html`<${A.SPop} />` : html`<${A.Pop} />`) : null;
    const modalEl = S.modal ? (S.modal.type.startsWith('s-') ? html`<${A.SModal} />` : html`<${A.Modal} />`) : null;
    const snack = S.snack ? html`<div className="snack" role="status">${S.snack.text}${S.snack.undo ? html`<span className="link" onClick=${() => { S.snack.undo(); A.set({ snack: null }); }}>Undo</span>` : null}</div>` : null;
    const outside = (e) => { if (S.pop && !e.target.closest('.pop')) close(); };
    const mark = html`<span className="lgmark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M9.5 3h13A6.5 6.5 0 0 1 29 9.5v12a6.5 6.5 0 0 1-6.5 6.5H13.4L7.5 32.5V27.3A6.5 6.5 0 0 1 3 21.5v-12A6.5 6.5 0 0 1 9.5 3z" fill="#3a9a3e"/><text x="16" y="21.6" textAnchor="middle" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="700" fontSize="17" fill="#fff">A</text></svg></span>`;
    if (docked) return html`<div className="cwin dock" onClick=${outside}><div className="ctitle lgdock">${mark}<b className="ttl">Aspen Messaging</b><span className="grow"></span>
        <button className="wb" title="Open full window" onClick=${() => A.set({ connect: 'open' })}><${I} n="popout" s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      ${c ? html`<${A.Conv3} c=${c} docked=${true} />` : null}${modalEl}${popEl}${snack}</div>`;
    let body;
    if (A.ExtraViews && A.ExtraViews[S.section]) body = html`<${A.ExtraViews[S.section]} />${right}`;
    else if (S.section === 'mywork') body = html`<${A.MyWorkView} />${right}`;
    else if (S.section === 'console') body = html`<${A.ConsoleView} />${right}`;
    else if (S.section === 'settings' || S.section === 'admin') body = html`<${A.Page} />`;
    else {
      body = html`<${A.Sidebar} />${c ? html`<${A.Conv3} c=${c} />` : html`<div className="main"><div className="empty"><div><b>Pick a conversation</b></div></div></div>`}${right}`;
    }
    return html`<div className=${'cwin' + (S.max ? ' max' : '')} onClick=${outside} onKeyDown=${(e) => { if (e.key === 'Escape') A.set({ pop: null, modal: null, qs: false }); }}>
      <div className="ctitle lgmast" onDoubleClick=${() => A.set({ max: !S.max })}>
        ${mark}<b className="ttl">Aspen Messaging</b>
        <button className="locbtn" title="Location (same as ASPEN). Channels and people follow it." onClick=${(e) => A.popAt('loc', e, {}, 0)}><${I} n="location" s="12" />${S.location}<${I} n="down" s="12" /></button>
        <label className="sbox"><${I} n="search" /><input id="desk-q" value=${S.q} onChange=${(e) => A.set({ q: e.target.value, section: 'inbox' })} placeholder="Search people, messages, records, work" />${S.q ? html`<button aria-label="Clear search" onClick=${() => A.set({ q: '' })}><${I} n="close" s="12" /></button>` : null}<kbd>Ctrl K</kbd></label>
        <span className="grow"></span>
        ${A.BellBtn ? html`<${A.BellBtn} />` : null}
        <button className="lgme" title="Your status" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'status', x: r.right - b.left - 300, y: r.bottom - b.top + 4 } }); }}><${A.Av} u=${A.ME} size="24" /><span className="lgmename">${A.USERS[A.ME].name.split(' ')[0]}</span></button>
        <span className="tsep"></span>
        <button className="wb" title="Dock beside the ASPEN form" onClick=${() => A.set({ connect: 'docked' })}><${I} n="dock" s="12" /></button><button className="wb" title="Minimize" onClick=${() => A.set({ connect: 'closed' })}><${I} n="min" s="12" /></button>
        <button className="wb" title=${S.max ? 'Restore' : 'Maximize'} onClick=${() => A.set({ max: !S.max })}><${I} n=${S.max ? 'restore' : 'max'} s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      <${A.AppRail} />
      ${A.NetBanner ? html`<${A.NetBanner} />` : null}
      ${S.urgent && !S.acks[S.urgent.id] ? html`<div className="banner urgent"><${I} n="megaphone" /><b>${S.urgent.title}</b><span>${S.urgent.body}</span><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set((s) => { s.acks[s.urgent.id] = true; })}>Got it</button></div>` : null}
      ${S.call && S.call.mini ? html`<div className="banner call"><${I} n="phone" /><b>On a call with ${S.call.title}</b><${A.CallTimer} /><span className="grow"></span><button className="btn sm" onClick=${() => A.set((s) => { s.call.mini = false; })}>Return to call</button></div>` : null}
      <div className="cbody">${body}</div>
      ${S.call && !S.call.mini ? html`<${A.CallView} />` : null}${S.call && S.call.mini ? html`<${A.MiniCall} />` : null}
      ${S.qs ? html`<${A.QuickSwitch} />` : null}
      ${modalEl}${popEl}${S.tour !== null && S.tour !== undefined && !S.modal ? html`<${A.Tour} />` : null}${snack}</div>`;
  };

  // ---------- first-run tour, same steps, worded for the new chrome ----------
  const TOUR = [
    { t: 'Tasks', b: 'All your tasks and approvals are under Tasks in the top row. Create one there, from New, or with Make it a task in any chat.', sel: '.apprail .ri:nth-child(4)' },
    { t: 'Turn talk into work', b: 'Use the Message ▾ button to send a Task, Approval or Request instead. Or type naturally and click Make it a task to have the details filled in.', sel: '.cmpkindbtn' },
    { t: 'Everything in one row', b: 'Activity, Chat, Tasks, Calls, People, Bookmarks and Settings sit in the row under the masthead. Ctrl+B collapses the chat list. Ctrl+K jumps anywhere.', sel: '.apprail' },
  ];
  A.Tour = function Tour() {
    const S = A.S, i = S.tour; const [box, setBox] = useState(null);
    useEffect(() => { const t = setTimeout(measure, 420); window.addEventListener('resize', measure); return () => { clearTimeout(t); window.removeEventListener('resize', measure); }; }, [i, S.section]);
    function measure() { const el = document.querySelector(TOUR[i].sel), cw = document.querySelector('.cwin'); if (el && cw) { const r = el.getBoundingClientRect(), b = cw.getBoundingClientRect(); setBox({ x: Math.min(Math.max(12, r.left - b.left), b.width - 340), y: r.bottom - b.top + 10 > b.height - 170 ? r.top - b.top - 170 : r.bottom - b.top + 10, hl: { left: r.left - b.left - 4, top: r.top - b.top - 4, width: r.width + 8, height: r.height + 8 } }); } else setBox({ x: 40, y: 80 }); }
    const end = () => { try { localStorage.setItem('aspen-msg-tour', '1'); } catch (e) {} A.set({ tour: null }); };
    if (!box) return null;
    return html`<div className="tourwrap">${box.hl ? html`<div className="tourhl" style=${box.hl}></div>` : null}
      <div className="tour" role="dialog" aria-label=${TOUR[i].t} style=${{ left: box.x, top: box.y }}><div className="tstep">${i + 1} of ${TOUR.length}</div><b>${TOUR[i].t}</b><p>${TOUR[i].b}</p>
        <div style=${{ display: 'flex', gap: 6 }}><button className="btn sm ghost" onClick=${end}>Skip</button><span className="grow"></span>${i > 0 ? html`<button className="btn sm" onClick=${() => A.set({ tour: i - 1 })}>Back</button>` : null}<button className="btn sm pri" onClick=${() => (i < TOUR.length - 1 ? A.set({ tour: i + 1 }) : end())}>${i < TOUR.length - 1 ? 'Next' : 'Done'}</button></div></div></div>`;
  };

  // ---------- calls: a call sheet in the window's own colours ----------
  // Same state and the same actions as calls.js (startCall / answer / endCall / CallTimer are untouched).
  // Only the screen, its layout and its words are new: people are name cards, not video tiles in a dark room.
  const first = (u) => A.USERS[u].name.split(' ')[0];
  const Sig = () => html`<span className="lgsig" title="Line quality: good" aria-label="Line quality: good"><i style=${{ height: 4 }}></i><i style=${{ height: 7 }}></i><i style=${{ height: 10 }}></i><i style=${{ height: 12 }}></i></span>`;
  const Level = () => html`<span className="lglevel" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
  const isMuted = (u, call) => (u === A.ME ? call.mute : u === 'u4');
  function Card({ u, me, spk, big }) {
    const call = A.S.call, x = A.USERS[u];
    const muted = isMuted(u, call);
    return html`<div className=${'lgcard' + (spk ? ' spk' : '')}>
      <div className="lgplate"><${A.Av} u=${u} size=${big ? 96 : 56} pres=${false} /></div>
      <div className="lgwho"><div style=${{ flex: 1, minWidth: 0 }}><div className="lgname">${me ? 'You' : x.name}</div>
        <div className=${'lgstate' + (muted ? ' mute' : spk ? ' spk' : '')}>${muted ? html`<${I} n="micoff" s="11" />Muted` : spk ? html`<${Level} />Talking` : 'On the line'}${me && call.hand ? html`<span>· Hand up</span>` : null}</div></div></div></div>`;
  }

  A.CallView = function CallView() {
    const S = A.S, call = S.call;
    const panel = call.panel || null, setPanel = (v) => A.set((s) => { s.call.panel = v; });
    const [spk, setSpk] = useState(0);
    const [q, setQ] = useState('');
    const ring = (u) => { A.snack('Calling ' + first(u) + '…'); setTimeout(() => A.set((s) => { if (s.call && !s.call.joined.includes(u)) s.call.joined.push(u); }), 2000); };
    const addToCall = (u) => {
      A.set((s) => { if (!s.call.invited.includes(u)) s.call.invited.push(u); if (s.call.with) { s.call.joined.includes(s.call.with) || s.call.joined.push(s.call.with); s.call.with = null; } s.call.title = [...s.call.invited].map((x) => first(x)).join(', '); });
      ring(u); setQ('');
    };
    const others = Object.keys(A.USERS).filter((u) => u !== A.ME && !call.joined.includes(u) && !call.invited.includes(u) && (!q || A.USERS[u].name.toLowerCase().includes(q.toLowerCase())));
    useEffect(() => { const i = setInterval(() => setSpk((x) => x + 1), 2500); return () => clearInterval(i); }, []);
    const set = (k, v) => A.set((s) => { s.call[k] = v === undefined ? !s.call[k] : v; });
    if (call.state === 'ringing') {
      const u = call.with;
      return html`<div className="callv" role="dialog" aria-label="Calling"><div className="lgring"><div>
        ${u ? html`<div style=${{ display: 'inline-block' }}><${A.Av} u=${u} size="96" pres=${false} /></div>` : html`<${A.ConvAv} c=${A.conv(call.conv)} />`}
        <div className="ttl">${call.title}</div><div className="meta">Calling…</div>
        <div className="lgctl"><button className=${'lgcb' + (call.mute ? ' on' : '')} onClick=${() => set('mute')}><${I} n=${call.mute ? 'micoff' : 'mic'} s="14" /><span>${call.mute ? 'Unmute' : 'Mute'}</span></button><button className="lgcb end" onClick=${A.endCall}><${I} n="close" s="14" /><span>Cancel</span></button></div></div></div></div>`;
    }
    const people = call.joined, all = [A.ME, ...people];
    const speaker = people.length ? people[spk % people.length] : null;
    const cols = all.length === 1 ? 1 : all.length <= 4 ? 2 : 3;
    const card = (u, big) => html`<${Card} key=${u} u=${u} me=${u === A.ME} spk=${u === speaker} big=${big} />`;
    const stage = call.share
      ? html`<div className="lgstage" style=${{ gridTemplateColumns: 'minmax(0,1fr) 220px' }}>
          <div className="lgshare"><span className="lgsharetag">You are showing your screen</span><h3>Repair Order 48213 · Harlan Pruitt</h3><div className="kv"><span>Unit</span><span>2021 Polaris RZR XP 1000</span><span>Complaint</span><span>Battery not charging, dash flickers</span><span>Part</span><span>4014029 Stator · Backordered</span><span>Labor</span><span>2.4 h</span></div></div>
          <div className="lgstack">${all.map((u) => card(u))}</div></div>`
      : call.layout === 'speaker' && speaker
        ? html`<div className="lgstage" style=${{ gridTemplateColumns: 'minmax(0,1fr)', gridTemplateRows: 'minmax(0,1fr) 120px' }}>${card(speaker, true)}<div className="lgrow2">${all.filter((u) => u !== speaker).map((u) => card(u))}</div></div>`
        : html`<div className="lgstage" style=${{ gridTemplateColumns: 'repeat(' + cols + ', minmax(0,1fr))' }}>${all.map((u) => card(u, all.length <= 2))}</div>`;
    const row = (u, right) => html`<div key=${u} className="lgrow"><${A.Av} u=${u} size="24" pres=${false} /><span>${u === A.ME ? 'You' : A.USERS[u].name}</span>${right}</div>`;
    const waiting = call.invited.filter((u) => !people.includes(u));
    return html`<div className="callv" role="dialog" aria-label="Call">
      <div className="lgch"><${I} n="phone" /><span className="ttl">${call.title}</span>
        <span className="meta">${all.length} on the line · <${A.CallTimer} /> · <${Sig} /></span>
        ${call.rec ? html`<span className="lgrec">On the record</span>` : null}<span className="grow"></span>
        <button className="btn sm" title="Show everyone, or just whoever is talking" onClick=${() => set('layout', call.layout === 'gallery' ? 'speaker' : 'gallery')}><${I} n="grid" s="12" /><span>${call.layout === 'gallery' ? 'Everyone' : 'Whoever talks'}</span></button>
        <button className=${'btn sm' + (panel === 'people' ? ' pri' : '')} title="Who is on the line" onClick=${() => setPanel(panel === 'people' ? null : 'people')}><${I} n="people" s="12" /><span>Who's on</span></button>
        <button className="btn sm" title="Open the conversation; the call keeps going in a corner" onClick=${() => A.set((s) => { s.call.mini = true; s.convId = call.conv; s.section = A.conv(call.conv).kind === 'channel' ? 'channels' : 'chat'; })}><${I} n="chat" s="12" /><span>Messages</span></button>
        <button className="ib" title="Shrink the call to a corner" onClick=${() => set('mini', true)}><${I} n="min" /></button></div>
      <div className="lgbody">${stage}
        ${panel === 'people' ? html`<div className="lgside">
          <input className="cadd" placeholder="Bring someone in…" aria-label="Bring someone into the call" value=${q} onInput=${(e) => setQ(e.target.value)} />
          ${q ? html`<div>${others.length ? others.slice(0, 6).map((u) => row(u, html`<button className="btn sm" onClick=${() => addToCall(u)}>Bring in</button>`)) : html`<div className="lgrow" style=${{ color: 'var(--lg-ink3)' }}>No one by that name</div>`}</div>` : null}
          <div className="sect">On the line (${all.length})</div>
          ${all.map((u) => row(u, isMuted(u, call) ? html`<small className="mute">Muted</small>` : html`<small>Live</small>`))}
          ${waiting.length ? html`<div className="sect">Not picked up yet</div>${waiting.map((u) => row(u, html`<button className="btn sm" onClick=${() => ring(u)}>Try again</button>`))}` : null}</div>` : null}</div>
      <div className="lgctl">
        <button className=${'lgcb' + (call.mute ? ' on' : '')} onClick=${() => set('mute')} title="Ctrl+Alt+M"><${I} n=${call.mute ? 'micoff' : 'mic'} s="14" /><span>${call.mute ? 'Unmute' : 'Mute'}</span></button>
        <button className=${'lgcb' + (call.share ? ' on' : '')} onClick=${() => set('share')}><${I} n="share" s="14" /><span>${call.share ? 'Stop showing' : 'Show my screen'}</span></button>
        <button className=${'lgcb' + (call.hand ? ' on' : '')} onClick=${() => set('hand')}><${I} n="hand" s="14" /><span>${call.hand ? 'Hand down' : 'Hand up'}</span></button>
        <button className="lgcb" onClick=${() => A.snack('👍 sent to everyone on the line')}><${I} n="emoji" s="14" /><span>Thumbs up</span></button>
        <button className="lgcb" onClick=${() => setPanel('people')}><${I} n="adduser" s="14" /><span>Bring in</span></button>
        <button className="lgcb end" onClick=${A.endCall} title="Ctrl+Alt+E"><${I} n="phone" s="14" /><span>End call</span></button>
      </div></div>`;
  };

  A.MiniCall = function MiniCall() {
    const call = A.S.call;
    return html`<div className="mini"><div className="lgminihd">${call.with ? html`<${A.Av} u=${call.with} size="36" pres=${false} />` : html`<${I} n="phone" />`}<div style=${{ flex: 1, minWidth: 0 }}><b>${call.title}</b><small>On the line · <${A.CallTimer} /></small></div></div>
      <div className="lgminibar"><button className=${'lgcb' + (call.mute ? ' on' : '')} title=${call.mute ? 'Unmute' : 'Mute'} onClick=${() => A.set((s) => { s.call.mute = !s.call.mute; })}><${I} n=${call.mute ? 'micoff' : 'mic'} s="14" /></button>
        <button className="lgcb back" onClick=${() => A.set((s) => { s.call.mini = false; })}><${I} n="popout" s="14" /><span>Back to the call</span></button>
        <button className="lgcb end" title="End call" onClick=${A.endCall}><${I} n="phone" s="14" /></button></div></div>`;
  };

  // Call shortcuts listed under Keyboard shortcuts: Ctrl+Alt+M mute, Ctrl+Alt+E end.
  window.addEventListener('keydown', (e) => {
    if (!A.S.call || !e.ctrlKey || !e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'm') A.set((s) => { s.call.mute = !s.call.mute; });
    else if (k === 'e') A.endCall();
    else return;
    e.preventDefault();
  });

  A.set({});
})();
