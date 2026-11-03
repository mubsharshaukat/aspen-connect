// Simple ASPEN Messaging window: one list on the left (Chats / People / Calls), the conversation on the right.
// Loaded last; replaces the earlier multi-section window.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;
  Object.assign(A.S, { convId: 'dm-u5', sideTab: 'chats', chatFilter: 'all', pendingLinks: [], perms: { send: true, broadcast: true }, open: { online: true, teams: true, sales: false, techs: false, clock: false, all: false }, q: '' });
  const close = () => A.set({ pop: null });

  // ---------- left pane ----------
  function Side() {
    const S = A.S, un = A.unreadTotals();
    const q = S.q.trim().toLowerCase();
    return html`<div className="side2">
      <div className="top"><h2>Messages</h2>
        <button className="btn sm" title="New message (Ctrl+N)" onClick=${() => A.set({ modal: { type: 'newchat' } })}><${I} n="compose" s="12" />New</button>
        ${S.perms.broadcast ? html`<button className="btn sm" title="Send one message to a whole team" onClick=${() => A.set({ modal: { type: 's-broadcast' } })}><${I} n="megaphone" s="12" />Broadcast</button>` : null}</div>
      <label className="sbox"><${I} n="search" /><input id="side-q" value=${S.q} onChange=${(e) => A.set({ q: e.target.value })} placeholder="Search people and messages" />${S.q ? html`<button aria-label="Clear search" onClick=${() => A.set({ q: '' })}><${I} n="close" s="12" /></button>` : null}</label>
      ${!q ? html`<div className="seg" role="tablist">${[['chats', 'Chats', un.chat], ['people', 'People', 0], ['calls', 'Calls', A.CALLS.filter((c) => c.dir === 'missed').length]].map(([k, l, b]) => html`<button role="tab" aria-selected=${S.sideTab === k} className=${S.sideTab === k ? 'on' : ''} onClick=${() => A.set({ sideTab: k })}>${l}${b ? html`<span className="badge">${b}</span>` : null}</button>`)}</div>` : null}
      <div className="lscroll">${q ? html`<${SearchResults} q=${q} />` : S.sideTab === 'chats' ? html`<${Chats} />` : S.sideTab === 'people' ? html`<${People} />` : html`<${CallList} />`}</div>
      <div className="me2"><button title="Change your status" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'status', x: r.left - b.left, y: r.top - b.top - 330 } }); }}><${A.Av} u=${A.ME} /></button>
        <div className="nm"><b>${A.USERS[A.ME].name}</b><small>${A.presLabel(S.myPres)}${S.myNote ? ' · ' + S.myNote : ''}</small></div>
        <button className="ib" title="Settings" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 's-gear', x: r.left - b.left - 200, y: r.top - b.top - 180 } }); }}><${I} n="settings" /></button></div>
    </div>`;
  }
  function ConvRow({ c }) {
    const S = A.S, last = A.lastMsg(c), on = S.section === 'chat' && S.convId === c.id;
    const who = last && last.from === A.ME ? 'You: ' : last && c.kind !== 'dm' && A.USERS[last.from] ? A.USERS[last.from].name.split(' ')[0] + ': ' : '';
    const prev = !last ? '' : last.kind === 'alert' ? A.ALERTS.find((a) => a.id === last.alert).title : last.file ? '📎 ' + last.file.name : last.text || (last.links ? '🔗 ' + last.links[0] : last.card ? (last.card.task ? 'Task: ' + last.card.task.title : last.card.title) : '');
    const draft = A.drafts[c.id];
    return html`<div className=${'li' + (on ? ' on' : '') + (c.unread ? ' unread' : '') + (c.muted ? ' muted' : '')} role="button" tabIndex="0" onClick=${() => A.openConv(c.id)} onKeyDown=${(e) => e.key === 'Enter' && A.openConv(c.id)} onContextMenu=${(e) => { e.preventDefault(); const b = document.querySelector('.cwin').getBoundingClientRect(); A.set({ pop: { type: 'row', c, x: e.clientX - b.left, y: e.clientY - b.top } }); }}>
      <${A.Av2} c=${c} /><div className="nm"><div className="t1"><b>${A.convName(c)}</b><small>${last ? A.fmtList(last.t) : ''}</small></div>
      <div className="t2">${S.typing[c.id] ? html`<i style=${{ color: 'var(--accent)' }}>typing…</i>` : draft ? html`<span style=${{ color: 'var(--red)' }}>Draft:</span> ${draft}` : who + prev}</div></div>
      ${c.unread ? html`<span className=${'badge' + (c.muted ? ' grey' : '')}>${c.mentions ? '@' : ''}${c.unread}</span>` : null}</div>`;
  }
  function Chats() {
    const S = A.S, f = S.chatFilter;
    let list = A.CONVS.filter((c) => c.kind !== 'channel');
    if (f === 'unread') list = list.filter((c) => c.unread);
    if (f === 'teams') list = list.filter((c) => c.kind === 'team' || c.kind === 'group');
    if (f === 'records') list = list.filter((c) => c.kind === 'record');
    const t = (c) => (A.lastMsg(c) || { t: 0 }).t;
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || t(b) - t(a));
    return html`<div className="lfilter">${[['all', 'All'], ['unread', 'Unread'], ['teams', 'Teams & groups'], ['records', 'ASPEN records']].map(([k, l]) => html`<button className=${'chip' + (f === k ? ' on' : '')} onClick=${() => A.set({ chatFilter: k })}>${l}</button>`)}</div>
      ${list.map((c) => html`<${ConvRow} key=${c.id} c=${c} />`)}
      ${!list.length ? html`<div className="empty" style=${{ height: 180 }}><div>${f === 'unread' ? 'You are all caught up.' : 'Nothing here yet.'}</div></div>` : null}`;
  }
  function PersonRow({ u }) {
    const x = A.USERS[u];
    return html`<div className="li" role="button" tabIndex="0" onClick=${() => A.dmWith(u)} onKeyDown=${(e) => e.key === 'Enter' && A.dmWith(u)}><${A.Av} u=${u} size="24" /><div className="nm"><div className="t1"><b>${x.name}</b></div><div className="t2">${x.title} · ${x.loc.split(' - ')[1] || x.loc} · ${A.presLabel(x.pres)}</div></div>
      <span className="acts"><button className="ib" title=${'Call ' + x.name} onClick=${(e) => { e.stopPropagation(); A.dmWith(u); A.startCall('dm-' + u, false); }}><${I} n="phone" /></button></span></div>`;
  }
  function People() {
    const S = A.S, everyone = Object.keys(A.USERS).filter((u) => u !== A.ME).sort((a, b) => A.USERS[a].name.localeCompare(A.USERS[b].name));
    const online = everyone.filter((u) => A.USERS[u].pres !== 'off' && A.USERS[u].pres !== 'away');
    const Grp = ({ k, label, n, children }) => html`<div><div className="pgrp" role="button" tabIndex="0" aria-expanded=${!!S.open[k]} onClick=${() => A.set((s) => { s.open[k] = !s.open[k]; })}><${I} n=${S.open[k] ? 'down' : 'chev'} s="12" />${label}<span style=${{ fontWeight: 400 }}>(${n})</span></div>${S.open[k] ? children : null}</div>`;
    return html`
      <${Grp} k="online" label="Online now" n=${online.length}>${online.map((u) => html`<${PersonRow} u=${u} />`)}</${Grp}>
      <${Grp} k="teams" label="Teams" n=${A.TEAMS.length}>${A.TEAMS.map((t) => html`<div className="li" role="button" tabIndex="0" onClick=${() => A.openTeam(t)}><${A.Av2} c=${{ id: t.id, kind: 'team', name: t.name, members: t.members }} size="24" /><div className="nm"><div className="t1"><b>${t.name}</b></div><div className="t2">${t.members.length} people · ASPEN Workflow team</div></div></div>`)}</${Grp}>
      ${A.PEOPLE_GROUPS.map((g) => html`<${Grp} k=${g.key} label=${g.label} n=${g.members.length}>${g.members.map((u) => html`<${PersonRow} u=${u} />`)}</${Grp}>`)}
      ${A.LOCATIONS.map((l) => { const m = everyone.filter((u) => A.USERS[u].loc === l); return html`<${Grp} k=${'loc:' + l} label=${l} n=${m.length}>${m.map((u) => html`<${PersonRow} u=${u} />`)}</${Grp}>`; })}
      ${[...new Set(everyone.map((u) => A.USERS[u].dept))].map((dp) => { const m = everyone.filter((u) => A.USERS[u].dept === dp); return html`<${Grp} k=${'dept:' + dp} label=${dp + ' department'} n=${m.length}>${m.map((u) => html`<${PersonRow} u=${u} />`)}</${Grp}>`; })}
      <${Grp} k="all" label="All Users" n=${everyone.length}>${everyone.map((u) => html`<${PersonRow} u=${u} />`)}</${Grp}>
      <div className="li" role="button" tabIndex="0" onClick=${() => A.openConv('sys')}><${A.Av2} c=${{ id: 'sys', kind: 'system' }} size="24" /><div className="nm"><div className="t1"><b>ASPEN System</b></div><div className="t2">Reports, tasks and alerts</div></div></div>`;
  }
  function CallList() {
    return html`${A.CALLS.map((x) => { const isU = !!A.USERS[x.who], c = isU ? null : A.conv(x.who); const name = isU ? A.USERS[x.who].name : A.convName(c);
      return html`<div className="li" role="button" tabIndex="0" onClick=${() => (isU ? A.dmWith(x.who) : A.openConv(x.who))}>${isU ? html`<${A.Av} u=${x.who} size="24" pres=${false} />` : html`<${A.Av2} c=${c} size="24" />`}
        <div className="nm"><div className="t1"><b style=${{ color: x.dir === 'missed' ? 'var(--red)' : undefined }}>${name}</b><small>${A.fmtList(x.t)}</small></div><div className="t2">${x.dir === 'missed' ? 'Missed' : x.dir === 'in' ? 'Incoming' : 'Outgoing'} ${x.kind.toLowerCase()}${x.dur ? ' · ' + x.dur : ''}</div></div>
        <span className="acts"><button className="ib" title="Call back" onClick=${(e) => { e.stopPropagation(); if (isU) { A.dmWith(x.who); A.startCall('dm-' + x.who, x.kind === 'Video'); } else A.startCall(x.who, false, true); }}><${I} n="phone" /></button></span></div>`; })}`;
  }
  function SearchResults({ q }) {
    const people = Object.keys(A.USERS).filter((u) => u !== A.ME && A.USERS[u].name.toLowerCase().includes(q));
    const convs = A.CONVS.filter((c) => c.kind !== 'dm' && c.kind !== 'channel' && A.convName(c).toLowerCase().includes(q));
    const hits = []; A.CONVS.forEach((c) => c.msgs.forEach((m) => { if (m.text && !m.hiddenForMe && m.text.toLowerCase().includes(q)) hits.push({ c, m }); }));
    return html`${people.length || convs.length ? html`<div className="lgrp">People and conversations</div>` : null}
      ${people.map((u) => html`<${PersonRow} u=${u} />`)}${convs.map((c) => html`<${ConvRow} c=${c} />`)}
      <div className="lgrp">Messages (${hits.length})</div>
      ${hits.slice(0, 30).map(({ c, m }) => html`<div className="li" role="button" tabIndex="0" onClick=${() => { A.openConv(c.id, m.id); A.set({ searchHl: q }); }}><${A.Av2} c=${c} size="24" /><div className="nm"><div className="t1"><b>${A.convName(c)}</b><small>${A.fmtList(m.t)}</small></div><div className="t2" style=${{ whiteSpace: 'normal' }}>${A.rich(m.text, q)}</div></div></div>`)}
      ${!hits.length ? html`<div style=${{ padding: '4px 14px', color: 'var(--fg2)' }}>No messages contain "${q}".</div>` : null}`;
  }
  A.openTeam = (t) => { let c = A.conv(t.id); if (!c) { c = { id: t.id, kind: 'team', name: t.name, members: t.members, unread: 0, msgs: [] }; A.CONVS.push(c); } A.openConv(c.id); };

  // ---------- the window ----------
  A.ConnectWin = function ConnectWin({ docked }) {
    const S = A.S, c = A.conv(S.convId);
    const main = S.section === 'settings' || S.section === 'admin' ? html`<${A.Page} />` : c ? html`<${A.Conv2} c=${c} docked=${docked} />${S.panel && !docked ? html`<${A.Details2} c=${c} />` : null}` : html`<div className="main"><div className="empty"><div><${I} n="chat" s="24" /><b>Pick someone to message</b>Choose a chat or a person on the left.</div></div></div>`;
    const popEl = S.pop ? (S.pop.type.startsWith('s-') ? html`<${SPop} />` : html`<${A.Pop} />`) : null;
    const modalEl = S.modal ? (S.modal.type.startsWith('s-') ? html`<${SModal} />` : html`<${A.Modal} />`) : null;
    if (docked) return html`<div className="cwin dock" onClick=${(e) => { if (S.pop && !e.target.closest('.pop')) close(); }}>
      <div className="ctitle"><span className="logo" style=${{ width: 16, height: 16, borderRadius: 3, background: '#3a9a3e' }}></span><b style=${{ fontWeight: 600 }}>ASPEN Messaging</b><span className="grow"></span>
        <button className="wb" title="Open full window" onClick=${() => A.set({ connect: 'open' })}><${I} n="popout" s="12" /></button><button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      ${c ? html`<${A.Conv2} c=${c} docked=${true} />` : null}${modalEl}${popEl}${S.snack ? html`<div className="snack">${S.snack.text}</div>` : null}</div>`;
    return html`<div className=${'cwin' + (S.max ? ' max' : '')} onClick=${(e) => { if (S.pop && !e.target.closest('.pop')) close(); }} onKeyDown=${(e) => { if (e.key === 'Escape') A.set({ pop: null, modal: null }); }}>
      <div className="ctitle" onDoubleClick=${() => A.set({ max: !S.max })}><span className="logo" style=${{ width: 16, height: 16, borderRadius: 3, background: '#3a9a3e', color: '#fff', display: 'grid', placeItems: 'center', font: '700 10px/1 var(--font)' }}>A</span>ASPEN Messaging for MUBASHIR<span className="grow"></span>
        <button className="wb" title="Dock beside the ASPEN form" onClick=${() => A.set({ connect: 'docked' })}><${I} n="dock" s="12" /></button>
        <button className="wb" title="Minimize" onClick=${() => A.set({ connect: 'closed' })}><${I} n="min" s="12" /></button>
        <button className="wb" title=${S.max ? 'Restore' : 'Maximize'} onClick=${() => A.set({ max: !S.max })}><${I} n=${S.max ? 'restore' : 'max'} s="12" /></button>
        <button className="wb x" title="Close" onClick=${() => A.set({ connect: 'closed' })}><${I} n="close" s="12" /></button></div>
      ${S.urgent && !S.acks[S.urgent.id] ? html`<div className="banner urgent"><${I} n="megaphone" /><b>${S.urgent.title}</b><span>${S.urgent.body}</span><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set((s) => { s.acks[s.urgent.id] = true; })}>Got it</button></div>` : null}
      ${S.call && S.call.mini ? html`<div className="banner call"><${I} n="phone" /><b>On a call with ${S.call.title}</b><${A.CallTimer} /><span className="grow"></span><button className="btn sm" onClick=${() => A.set((s) => { s.call.mini = false; })}>Return to call</button></div>` : null}
      <div className="cbody"><${Side} />${main}</div>
      ${S.call && !S.call.mini ? html`<${A.CallView} />` : null}${S.call && S.call.mini ? html`<${A.MiniCall} />` : null}
      ${modalEl}${popEl}
      ${S.snack ? html`<div className="snack" role="status">${S.snack.text}${S.snack.undo ? html`<span className="link" onClick=${() => { S.snack.undo(); A.set({ snack: null }); }}>Undo</span>` : null}</div>` : null}
    </div>`;
  };
  // every conversation lives in one list now
  const openConv0 = A.openConv;
  A.openConv = (id, msgId) => { openConv0(id, msgId); A.set((s) => { s.section = 'chat'; s.panel = null; s.q = msgId ? s.q : ''; }); };
  A.go = (section) => A.set((s) => { s.section = section; s.pop = null; if (s.connect === 'closed') s.connect = 'open'; });

  // ---------- popovers ----------
  const PI = ({ icon, label, onClick, danger }) => html`<div className="pi" role="menuitem" tabIndex="0" style=${danger ? { color: 'var(--red)' } : null} onClick=${(e) => { e.stopPropagation(); close(); onClick(); }} onKeyDown=${(e) => { if (e.key === 'Enter') { close(); onClick(); } }}><${I} n=${icon} /><span>${label}</span></div>`;
  function SPop() {
    const p = A.S.pop, S = A.S; let body = null;
    if (p.type === 's-conv') { const c = p.c; body = html`
      ${A.S.mobile && c.kind !== 'system' ? html`<${PI} icon="phone" label=${c.kind === 'team' ? 'Start a team call' : 'Voice call'} onClick=${() => A.startCall(c.id, false, c.kind === 'team')} /><hr />` : null}
      <${PI} icon="info" label="Details" onClick=${() => A.set({ panel: { type: 'details' } })} />
      <${PI} icon="files" label="Print conversation" onClick=${() => A.printConv(c)} />
      ${A.NotifyLevelItems ? A.NotifyLevelItems(PI, c) : html`<${PI} icon=${c.muted ? 'bell' : 'belloff'} label=${c.muted ? 'Turn notifications on' : 'Mute notifications'} onClick=${() => A.set(() => { c.muted = !c.muted; })} />`}
      ${c.kind === 'group' || c.kind === 'record' ? html`<${PI} icon="adduser" label="Add people" onClick=${() => A.set({ modal: { type: 'add', c } })} />` : null}
      ${c.kind !== 'system' ? html`<hr /><${PI} icon="trash" label="Delete my history" danger=${true} onClick=${() => A.clearHistory(c)} />` : null}`; }
    if (p.type === 's-msg') { const m = p.m, c = p.c, mine = m.from === A.ME; body = html`
      <${PI} icon="reply" label="Reply" onClick=${() => A.set({ replyTo: { conv: c.id, m } })} />
      <${PI} icon="emoji" label="React…" onClick=${() => setTimeout(() => A.set({ pop: { type: 'emoji', m, x: p.x, y: p.y } }), 0)} />
      <${PI} icon="copy" label="Copy text" onClick=${() => { try { navigator.clipboard.writeText(m.text || ''); } catch (e) {} A.snack('Copied'); }} />
      <${PI} icon="forward" label="Forward" onClick=${() => A.set({ modal: { type: 'forward', m } })} />
      <${PI} icon="task" label="Create ASPEN task" onClick=${() => A.set({ modal: { type: 'task', m, c } })} />
      ${mine ? html`<hr /><${PI} icon="edit" label="Edit" onClick=${() => A.set({ modal: { type: 's-edit', m } })} /><${PI} icon="trash" label="Delete" danger=${true} onClick=${() => A.set({ modal: { type: 'confirm', title: 'Delete this message?', body: 'It will be removed for everyone in the conversation.', ok: 'Delete', act: () => { A.set(() => { m.deleted = true; }); A.snack('Message deleted', () => A.set(() => { m.deleted = false; })); } } })} />` : null}`; }
    if (p.type === 's-attach') body = html`<div className="ph">Attach</div><${PI} icon="files" label="Upload from PC" onClick=${() => A.uploadFromPC()} /><${PI} icon="record" label="From ASPEN (work order, invoice, report…)" onClick=${() => A.set({ modal: { type: 's-recpick' } })} /><${PI} icon="report" label="ASPEN report (live, Excel or PDF)" onClick=${() => A.set({ modal: { type: 's-recpick', kind: 'RPT', title: 'Share an ASPEN report' } })} />${A.aspenRecord && A.aspenRecord() ? html`<${PI} icon="ext" label=${'On screen in ASPEN: ' + A.aspenRecord()} onClick=${() => A.set((s) => { const k = A.aspenRecord(); s.pop = null; if (!s.pendingLinks.includes(k)) s.pendingLinks.push(k); })} />` : null}`;
    if (p.type === 's-gear') body = html`<${PI} icon="settings" label="Settings" onClick=${() => A.go('settings')} />${A.ME === 'u1' ? html`<${PI} icon="admin" label="Messaging administration" onClick=${() => A.go('admin')} />` : null}<${PI} icon="help" label="Keyboard shortcuts" onClick=${() => A.set({ modal: { type: 'keys' } })} /><hr />
      <div className="ph">Prototype: try permissions</div>
      <${PI} icon="lock" label=${(S.perms.send ? 'Remove' : 'Give back') + ' Send Message permission'} onClick=${() => A.set((s) => { s.perms.send = !s.perms.send; })} />
      <${PI} icon="megaphone" label=${(S.perms.broadcast ? 'Remove' : 'Give back') + ' Broadcast permission'} onClick=${() => A.set((s) => { s.perms.broadcast = !s.perms.broadcast; })} />`;
    return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x), top: Math.max(8, p.y) }} onClick=${(e) => e.stopPropagation()}>${body}</div>`;
  }

  // ---------- dialogs ----------
  function Dlg({ title, children, foot, width }) {
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg" role="dialog" aria-modal="true" aria-label=${title} style=${width ? { width } : null}>
      <div className="dh"><b>${title}</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div><div className="db">${children}</div>${foot ? html`<div className="df">${foot}</div>` : null}</div></div>`;
  }
  function Broadcast() {
    const S = A.S;
    const [to, setTo] = useState(''); const [text, setText] = useState(A.drafts[S.convId] || ''); const [urgent, setUrgent] = useState(false); const [ack, setAck] = useState(false);
    const opts = [...A.TEAMS.map((t) => ({ k: t.id, label: t.name, members: t.members })), ...A.PEOPLE_GROUPS.map((g) => ({ k: g.key, label: g.label, members: g.members })), { k: 'everyone', label: 'Everyone', members: Object.keys(A.USERS) }];
    const sel = opts.find((o) => o.k === to); const rec = sel ? sel.members.filter((u) => u !== A.ME) : [];
    const send = () => {
      A.set((s) => {
        rec.forEach((u) => { let c = A.CONVS.find((x) => x.kind === 'dm' && x.with === u); if (!c) { c = { id: 'dm-' + u, kind: 'dm', with: u, unread: 0, members: [A.ME, u], msgs: [] }; A.CONVS.push(c); }
          c.msgs.push({ id: A.nextId(), from: A.ME, t: Date.now(), text, reactions: {}, thread: [], state: 'sent', broadcast: sel.label, links: s.pendingLinks.length ? s.pendingLinks.slice() : undefined }); });
        s.pendingLinks = []; s.modal = null;
      });
      A.snack('Broadcast sent to ' + rec.length + ' people in ' + sel.label + (urgent ? '. They will see a banner until they click Got it.' : ''));
    };
    return html`<${Dlg} title="Broadcast a message" width="520px" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!sel || !text.trim()} onClick=${send}>Send to ${rec.length || ''} ${rec.length === 1 ? 'person' : 'people'}</button>`}>
      <div className="fld"><label htmlFor="bc-to">Send to</label><select id="bc-to" value=${to} onChange=${(e) => setTo(e.target.value)}><option value="">Choose a team or group</option><optgroup label="ASPEN teams">${A.TEAMS.map((t) => html`<option value=${t.id}>${t.name}</option>`)}</optgroup><optgroup label="Groups">${A.PEOPLE_GROUPS.map((g) => html`<option value=${g.key}>${g.label}</option>`)}<option value="everyone">Everyone</option></optgroup></select></div>
      ${sel ? html`<div className="fld"><label>This will send the message to the following users:</label><div style=${{ border: '1px solid var(--line)', borderRadius: 4, padding: '6px 8px', background: 'var(--chrome2)', fontSize: 12.5 }}>${rec.map((u) => A.USERS[u].name).join(', ')}</div><small style=${{ color: 'var(--fg2)' }}>Inactive users and you are left out. Each person gets it in their chat with you.</small></div>` : null}
      <div className="fld"><label htmlFor="bc-t">Message</label><textarea id="bc-t" value=${text} onChange=${(e) => setText(e.target.value)} maxLength="4000"></textarea></div>
      ${S.pendingLinks.length ? html`<div className="chips" style=${{ marginBottom: 10 }}>${S.pendingLinks.map((k) => html`<${A.LinkChip} k=${k} onRemove=${() => A.set((s) => { s.pendingLinks = s.pendingLinks.filter((x) => x !== k); })} />`)}</div>` : null}
      <details><summary style=${{ cursor: 'pointer', color: 'var(--accent)', marginBottom: 6 }}>More options</summary>
        <label className="check"><input type="checkbox" id="bc-u" checked=${urgent} onChange=${(e) => setUrgent(e.target.checked)} />Urgent: show a banner until they click "Got it"</label>
        <label className="check"><input type="checkbox" id="bc-a" checked=${ack} onChange=${(e) => setAck(e.target.checked)} />Ask them to confirm they read it</label></details></${Dlg}>`;
  }
  function RecPick() {
    const [q, setQ] = useState('');
    const list = Object.keys(A.RECORDS).filter((k) => (k + ' ' + A.RECORDS[k].title).toLowerCase().includes(q.toLowerCase()));
    const add = (k) => { A.set((s) => { if (s.pendingLinks.length >= 10) { s.modal = null; return; } if (!s.pendingLinks.includes(k)) s.pendingLinks.push(k); s.modal = null; }); if (A.S.pendingLinks.length >= 10) A.snack('You can attach up to 10 ASPEN links to one message'); };
    return html`<${Dlg} title="Attach an ASPEN record"><div className="fld"><label htmlFor="rp-q">Number or name</label><input id="rp-q" value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="e.g. 48213, Pruitt, 4014029" autoFocus /></div>
      <div style=${{ border: '1px solid var(--line)', borderRadius: 4, maxHeight: 260, overflow: 'auto' }}>${list.map((k) => { const r = A.RECORDS[k]; return html`<div className="pi" style=${{ display: 'flex', gap: 10, padding: '7px 10px', cursor: 'pointer', alignItems: 'center' }} onClick=${() => add(k)}><span className="rchip" style=${{ pointerEvents: 'none', border: 0, padding: 0 }}><span className="k" style=${{ background: A.RECKIND[r.kind].color }}>${r.kind}</span></span><span style=${{ flex: 1 }}>${k} · ${r.title}</span><span className=${'pill ' + r.tone}>${r.status}</span></div>`; })}</div>
      <p style=${{ color: 'var(--fg2)', fontSize: 12 }}>Tip: the Send Message link on any ASPEN form attaches that record for you.</p></${Dlg}>`;
  }
  function Edit({ m }) {
    const [v, setV] = useState(m.text);
    return html`<${Dlg} title="Edit message" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" onClick=${() => A.set((s) => { m.text = v; m.edited = true; s.modal = null; })}>Save</button>`}><div className="fld"><textarea id="ed-m" value=${v} onChange=${(e) => setV(e.target.value)} aria-label="Message text"></textarea></div></${Dlg}>`;
  }
  function SModal() { const md = A.S.modal; return md.type === 's-broadcast' ? html`<${Broadcast} />` : md.type === 's-recpick' ? html`<${RecPick} />` : md.type === 's-edit' ? html`<${Edit} m=${md.m} />` : null; }

  // ---------- ASPEN form: "Send Message" and "Discuss" (the old SendMessageLink path) ----------
  A.sendFromAspen = (k) => A.set((s) => {
    if (!s.pendingLinks.includes(k) && s.pendingLinks.length < 10) s.pendingLinks.push(k);
    if (s.connect === 'closed') s.connect = 'open';
    s.section = 'chat'; s.sideTab = 'people';
    A.snack(k + ' attached. Pick who to send it to.');
  });

  // ---------- prototype triggers that now land in ASPEN System ----------
  A.demoApproval = () => A.set(() => {
    const a = { id: A.nextId(), bot: 'Parts approval', ini: 'PA', color: 'var(--parts)', t: Date.now(), state: 'pending', title: 'Approve parts order PO 1240', rec: null, lines: ['Kubota, 3 lines, $1,764.90', 'Requested by Tom Baker for RO 48230', 'Rule: orders over $1,500 need a manager'] };
    A.ALERTS.unshift(a); const c = A.conv('sys'); c.msgs.push({ id: A.nextId(), kind: 'alert', alert: a.id, t: Date.now(), reactions: {}, thread: [] }); c.unread = (c.unread || 0) + 1;
    A.toast({ kind: 'msg', conv: 'sys', from: 'u4', text: 'Approval needed: parts order PO 1240 ($1,764.90)' });
  });
  A.demoMention = () => { const c = A.conv('team-service'); const m = A.post(c.id, 'u2', '@Mubshar can you sign off on the warranty claim for RO 48230 before 3?'); A.set(() => A.arrive(c, m)); };
  Object.assign(A, { SPop, SModal, Side, PeopleList: People, ChatsList: Chats, ConvRow, PersonRow, SearchResults, CallList });
  A.set({});
})();
