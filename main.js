// Popovers, dialogs, prototype demo triggers, and the mount.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef } = React;
  const close = () => A.set({ pop: null });
  const PI = ({ icon, label, onClick, danger, sub }) => html`<div className="pi" role="menuitem" tabIndex="0" style=${danger ? { color: 'var(--red)' } : null} onClick=${(e) => { e.stopPropagation(); close(); onClick && onClick(); }} onKeyDown=${(e) => { if (e.key === 'Enter') { close(); onClick && onClick(); } }}>${icon ? html`<${I} n=${icon} />` : null}<span style=${{ flex: 1 }}>${label}</span>${sub ? html`<small>${sub}</small>` : null}</div>`;

  // ---------- popovers ----------
  A.Pop = function Pop() {
    const p = A.S.pop, S = A.S;
    const st = { left: Math.max(8, p.x), top: Math.max(8, p.y) };
    let body = null;
    if (p.type === 'row') { const c = p.c;
      body = html`<${PI} icon="pin" label=${c.pinned ? 'Unpin' : 'Pin'} onClick=${() => A.set(() => { c.pinned = !c.pinned; })} />
        <${PI} icon="chat" label="Mark as unread" onClick=${() => A.set(() => { c.markedUnread = true; })} />
        <hr /><div className="ph">Mute notifications</div>
        ${c.muted ? html`<${PI} icon="bell" label="Unmute" onClick=${() => A.set(() => { c.muted = false; })} />` : [['For 1 hour'], ['Until 8:00 AM tomorrow'], ['Until I turn it back on']].map(([l]) => html`<${PI} icon="belloff" label=${l} onClick=${() => { A.set(() => { c.muted = true; }); A.snack(A.convName(c) + ' muted ' + l.toLowerCase().replace('for ', 'for ')); }} />`)}
        <hr /><${PI} icon="popout" label="Open in new window" onClick=${() => A.snack('Opened in a new window')} /><${PI} icon="copy" label="Copy link" onClick=${() => A.snack('Link copied')} />`; }
    if (p.type === 'status') {
      body = html`<div style=${{ display: 'flex', gap: 10, padding: '8px 12px 10px', alignItems: 'center' }}><${A.Av} u=${A.ME} size="48" /><div><b>${A.USERS[A.ME].name}</b><div style=${{ color: 'var(--fg2)', fontSize: 12 }}>${A.USERS[A.ME].title}</div><div style=${{ fontSize: 12 }}>${A.USERS[A.ME].clock}</div></div></div><hr />
        ${['on', 'busy', 'dnd', 'brb', 'away', 'off'].map((k) => html`<div className=${'pi' + (S.myPres === k ? ' on' : '')} onClick=${(e) => { e.stopPropagation(); A.set({ myPres: k, pop: null }); if (k === 'dnd') A.snack('Do not disturb is on. Notifications are paused.'); }}><span className=${'pres ' + k} style=${{ position: 'static', border: 0, width: 10, height: 10 }}></span><span style=${{ flex: 1 }}>${k === 'off' ? 'Appear offline' : A.presLabel(k)}</span>${S.myPres === k ? html`<${I} n="check" s="12" />` : null}</div>`)}
        <hr />${A.StatusItems ? A.StatusItems(PI) : null}<${PI} icon="edit" label=${S.myNote ? 'Status note: ' + S.myNote : 'Set status note'} onClick=${() => A.set({ modal: { type: 'note' } })} />
        <${PI} icon="saved" label="Saved items" onClick=${() => A.go('saved')} /><${PI} icon="settings" label="Settings" onClick=${() => A.go('settings')} /><${PI} icon="help" label="Keyboard shortcuts" sub="Ctrl+/" onClick=${() => A.set({ modal: { type: 'keys' } })} />`; }
    if (p.type === 'loc') body = ['All locations', ...A.LOCATIONS].map((l) => html`<div className=${'pi' + (S.location === l ? ' on' : '')} onClick=${(e) => { e.stopPropagation(); A.set({ location: l, pop: null }); }}><${I} n="location" /><span style=${{ flex: 1 }}>${l}</span>${S.location === l ? html`<${I} n="check" s="12" />` : null}</div>`);
    if (p.type === 'chanplus') body = html`<${PI} icon="plus" label="Create a channel" onClick=${() => A.set({ modal: { type: 'newchannel' } })} /><${PI} icon="search" label="Browse channels" onClick=${() => A.set({ modal: { type: 'browse' } })} /><${PI} icon="megaphone" label="New announcement" onClick=${() => A.set({ modal: { type: 'announce' } })} />`;
    if (p.type === 'emoji') body = html`<div style=${{ display: 'grid', gridTemplateColumns: 'repeat(6, 32px)', gap: 2, padding: 6 }}>${A.EMOJI.map((e) => html`<button style=${{ height: 32, fontSize: 18, borderRadius: 4 }} onClick=${(ev) => { ev.stopPropagation(); close(); p.insert ? p.insert(e) : A.react(p.m.id, e); }}>${e}</button>`)}</div>`;
    if (p.type === 'msgmore') { const m = p.m, c = p.c, mine = m.from === A.ME;
      body = html`${c.kind === 'dm' ? null : html`<${PI} icon="thread" label="Reply in thread" onClick=${() => A.set({ panel: { type: 'thread', id: m.id } })} />`}
        <${PI} icon="reply" label="Quote reply" onClick=${() => A.set({ replyTo: { conv: c.id, m } })} />
        <${PI} icon="forward" label="Forward" onClick=${() => A.set({ modal: { type: 'forward', m } })} />
        <${PI} icon="copy" label="Copy text" onClick=${() => { try { navigator.clipboard.writeText(m.text || ''); } catch (e) {} A.snack('Copied'); }} />
        <${PI} icon="pin" label=${m.pinned ? 'Unpin' : 'Pin to conversation'} onClick=${() => A.set(() => { m.pinned = !m.pinned; })} />
        <${PI} icon="saved" label=${S.saved.includes(m.id) ? 'Remove from saved' : 'Save'} onClick=${() => { A.set((s) => { s.saved = s.saved.includes(m.id) ? s.saved.filter((x) => x !== m.id) : [m.id, ...s.saved]; }); A.snack('Saved. Find it under Saved.'); }} />
        <${PI} icon="clock" label="Remind me in 1 hour" onClick=${() => A.snack('We will remind you at ' + A.fmtTime(Date.now() + 3600000))} />
        <${PI} icon="task" label="Create task" onClick=${() => A.set({ modal: { type: 'task', m, c } })} />
        <${PI} icon="info" label="Message info" onClick=${() => A.set({ modal: { type: 'info', m, c } })} />
        ${mine ? html`<hr /><${PI} icon="edit" label="Edit" onClick=${() => A._edit && A._edit()} /><${PI} icon="trash" label="Delete" danger=${true} onClick=${() => A.set({ modal: { type: 'confirm', title: 'Delete this message?', body: 'It will be removed for everyone in the conversation.', ok: 'Delete', act: () => { A.set(() => { m.deleted = true; }); A.snack('Message deleted', () => A.set(() => { m.deleted = false; })); } } })} />` : null}`; }
    if (p.type === 'profile') { const u = A.USERS[p.u];
      return html`<div className="pop" style=${{ left: Math.max(8, p.x), top: Math.max(8, p.y), width: 320, padding: 0 }} onClick=${(e) => e.stopPropagation()}>
        <div style=${{ display: 'flex', gap: 12, padding: 16, alignItems: 'center', borderBottom: '1px solid var(--line)' }}><${A.Av} u=${p.u} size="72" /><div><b style=${{ fontSize: 16 }}>${u.name}</b><div style=${{ color: 'var(--fg2)' }}>${u.title}</div><div style=${{ fontSize: 12 }}>${p.u === A.ME ? A.presLabel(S.myPres) : A.presLabel(u.pres)}${u.note ? ' · ' + u.note : ''}</div></div></div>
        ${p.u !== A.ME ? html`<div style=${{ display: 'flex', gap: 6, padding: '10px 16px' }}><button className="btn pri" onClick=${() => { close(); A.dmWith(p.u); }}><${I} n="chat" s="12" />Message</button><button className="btn" onClick=${() => { close(); A.dmWith(p.u); A.startCall('dm-' + p.u, false); }}><${I} n="phone" s="12" />Call</button></div>` : null}
        <div className="kv" style=${{ padding: '4px 16px 16px' }}><span>Location</span><span>${u.loc}</span><span>Department</span><span>${u.dept}</span>${u.mgr ? html`<span>Reports to</span><span>${u.mgr}</span>` : null}<span>Extension</span><span>${u.ext}</span>${u.clock ? html`<span>Time clock</span><span>${u.clock}</span>` : null}<span>Local time</span><span>${A.fmtTime(Date.now())}</span></div></div>`; }
    return html`<div className="pop" role="menu" style=${st} onClick=${(e) => e.stopPropagation()}>${body}</div>`;
  };

  // ---------- dialogs ----------
  function Dlg({ title, children, foot, width }) {
    return html`<div className="scrim" onClick=${(e) => e.target === e.currentTarget && A.set({ modal: null })}><div className="dlg" role="dialog" aria-modal="true" aria-label=${title} style=${width ? { width } : null}>
      <div className="dh"><b>${title}</b><button className="ib" aria-label="Close" onClick=${() => A.set({ modal: null })}><${I} n="close" /></button></div><div className="db">${children}</div>${foot ? html`<div className="df">${foot}</div>` : null}</div></div>`;
  }
  function PeoplePick({ sel, setSel, exclude }) {
    const [q, setQ] = useState('');
    const opts = Object.keys(A.USERS).filter((u) => u !== A.ME && !sel.includes(u) && !(exclude || []).includes(u) && A.USERS[u].name.toLowerCase().includes(q.toLowerCase()));
    return html`<div className="fld"><label htmlFor="pp">To</label><div style=${{ display: 'flex', flexWrap: 'wrap', gap: 4, border: '1px solid var(--line2)', borderRadius: 4, padding: 4 }}>
      ${sel.map((u) => html`<span className="chip on">${A.USERS[u].name}<button aria-label=${'Remove ' + A.USERS[u].name} onClick=${() => setSel(sel.filter((x) => x !== u))}><${I} n="close" s="12" /></button></span>`)}
      <input id="pp" value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="Type a name" style=${{ border: 0, outline: 0, flex: 1, minWidth: 120, minHeight: 24 }} /></div>
      ${q || !sel.length ? html`<div style=${{ border: '1px solid var(--line)', borderRadius: 4, maxHeight: 190, overflow: 'auto' }}>${opts.map((u) => html`<div className="pi" style=${{ display: 'flex', gap: 10, padding: '6px 10px', cursor: 'pointer', alignItems: 'center' }} onClick=${() => { setSel([...sel, u]); setQ(''); }}><${A.Av} u=${u} size="24" /><span style=${{ flex: 1 }}>${A.USERS[u].name}</span><small style=${{ color: 'var(--fg2)' }}>${A.USERS[u].title} · ${A.USERS[u].loc}</small></div>`)}</div>` : null}</div>`;
  }

  A.Modal = function Modal() {
    const md = A.S.modal;
    const F = { task: TaskDlg, taskview: TaskView, newchat: NewChat, add: AddPeople, announce: Announce, newchannel: NewChannel, browse: Browse, preview: Preview, confirm: Confirm, ackreport: AckReport, forward: Forward, note: Note, keys: Keys, info: Info }[md.type];
    return F ? html`<${F} md=${md} />` : null;
  };
  function TaskDlg({ md }) {
    const m = md.m, c = md.c;
    const mention = m && m.text && Object.keys(A.USERS).find((u) => m.text.includes('@' + A.USERS[u].name.split(' ')[0]) && u !== A.ME);
    const [t, setT] = useState({ title: m && m.text ? m.text.slice(0, 80) : '', owner: mention || (c && c.kind === 'dm' ? c.with : 'u2'), due: 'Today 5:00 PM', rec: (c && c.rec) || (m && A.recordsIn(m.text)[0]) || '', pri: 'Normal', notes: m && m.text ? '"' + m.text + '" (from ' + (A.USERS[m.from] ? A.USERS[m.from].name : 'bot') + ')' : '' });
    const up = (k) => (e) => setT(Object.assign({}, t, { [k]: e.target.value }));
    const save = () => { A.createTask({ title: t.title, owner: t.owner, due: t.due, rec: t.rec || null, status: t.owner === A.ME ? 'Due today' : 'Open' }, m, c && c.id); A.snack('Task created and ' + (t.owner === A.ME ? 'added to My Work' : A.USERS[t.owner].name.split(' ')[0] + ' was notified')); };
    return html`<${Dlg} title="Create task" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!t.title.trim()} onClick=${save}>Create task</button>`}>
      <div className="fld"><label htmlFor="tk-t">Title</label><input id="tk-t" value=${t.title} onChange=${up('title')} /></div>
      <div className="frow"><div className="fld"><label htmlFor="tk-o">Owner</label><select id="tk-o" value=${t.owner} onChange=${up('owner')}>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}${u === A.ME ? ' (me)' : ''}</option>`)}</select></div>
        <div className="fld"><label htmlFor="tk-d">Due</label><select id="tk-d" value=${t.due} onChange=${up('due')}><option>Today 12:00 PM</option><option>Today 5:00 PM</option><option>Tomorrow 9:00 AM</option><option>Fri Oct 30</option></select></div></div>
      <div className="frow"><div className="fld"><label htmlFor="tk-r">Linked record</label><select id="tk-r" value=${t.rec} onChange=${up('rec')}><option value="">None</option>${Object.keys(A.RECORDS).map((k) => html`<option value=${k}>${k} · ${A.RECORDS[k].title}</option>`)}</select></div>
        <div className="fld"><label htmlFor="tk-p">Priority</label><select id="tk-p" value=${t.pri} onChange=${up('pri')}><option>Low</option><option>Normal</option><option>High</option></select></div></div>
      <div className="fld"><label htmlFor="tk-n">Notes</label><textarea id="tk-n" value=${t.notes} onChange=${up('notes')}></textarea></div>
      <label className="check"><input type="checkbox" id="tk-ap" />Needs manager approval before it's done</label></${Dlg}>`;
  }
  function TaskView({ md }) { const t = md.t;
    return html`<${Dlg} title=${t.title} foot=${html`${t.rec ? html`<button className="btn" onClick=${() => A.openRecordConv(t.rec)}>Discuss ${t.rec}</button>` : null}<button className="btn" onClick=${() => A.set({ modal: null })}>Close</button>${t.status !== 'Done' ? html`<button className="btn pri" onClick=${() => { A.set((s) => { t.status = 'Done'; s.modal = null; }); A.snack('Marked done'); }}>Mark done</button>` : null}`}>
      <div className="kv"><span>Type</span><span>${t.type}</span><span>Status</span><span>${t.status}</span><span>Due</span><span>${t.due}</span><span>From</span><span>${t.from}</span><span>Record</span><span>${t.rec || '-'}</span></div>
      <div className="sect">History</div><div style=${{ fontSize: 12, color: 'var(--fg2)' }}>Created by ${t.from} · Assigned to you</div></${Dlg}>`; }
  function NewChat({ md }) {
    const [sel, setSel] = useState([]); const [name, setName] = useState(''); const [msg, setMsg] = useState('');
    const go = () => {
      if (sel.length === 1) { A.dmWith(sel[0]); if (md.call) A.startCall('dm-' + sel[0], false); else if (msg.trim()) A.send('dm-' + sel[0], msg.trim()); }
      else { const c = { id: 'grp-' + A.nextId(), kind: 'group', name: name.trim() || null, members: [A.ME, ...sel], unread: 0, msgs: [{ id: A.nextId(), kind: 'sys', t: Date.now(), text: 'You created the group', reactions: {}, thread: [] }] }; A.CONVS.push(c); A.openConv(c.id); if (md.call) A.startCall(c.id, false); else if (msg.trim()) A.send(c.id, msg.trim()); }
      A.set({ modal: null });
    };
    return html`<${Dlg} title=${md.call ? 'New call' : 'New chat'} foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!sel.length} onClick=${go}>${md.call ? 'Call' : sel.length > 1 ? 'Create group' : 'Start chat'}</button>`}>
      <${PeoplePick} sel=${sel} setSel=${setSel} />
      ${sel.length > 1 ? html`<div className="fld"><label htmlFor="gn">Group name (optional)</label><input id="gn" value=${name} onChange=${(e) => setName(e.target.value)} placeholder="e.g. Saturday open house" /></div>` : null}
      ${!md.call ? html`<div className="fld"><label htmlFor="fm">First message</label><textarea id="fm" value=${msg} onChange=${(e) => setMsg(e.target.value)}></textarea></div>` : null}</${Dlg}>`;
  }
  function AddPeople({ md }) { const [sel, setSel] = useState([]); const c = md.c;
    return html`<${Dlg} title=${'Add people to ' + A.convName(c)} foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!sel.length} onClick=${() => { A.set((s) => { c.members.push(...sel); c.msgs.push({ id: A.nextId(), kind: 'sys', t: Date.now(), text: 'You added ' + sel.map((u) => A.USERS[u].name).join(', '), reactions: {}, thread: [] }); s.modal = null; }); }}>Add</button>`}>
      <${PeoplePick} sel=${sel} setSel=${setSel} exclude=${c.members} /><div className="fld"><label htmlFor="hist">History</label><select id="hist"><option>Show all chat history</option><option>Show history from the last 7 days</option><option>Don't show history</option></select></div></${Dlg}>`; }
  function Announce() {
    const [a, setA] = useState({ aud: 'service-techs', title: '', body: '', pri: 'urgent', ack: true });
    const g = A.GROUPS.find((x) => x.key === a.aud); const n = a.aud === 'everyone' ? Object.keys(A.USERS).length : g ? g.members.length : 0;
    const send = () => { const c = A.conv('ch-announcements'); A.set((s) => { const m = { id: A.nextId(), kind: 'card', from: A.ME, t: Date.now(), reactions: {}, thread: [], card: { type: 'announce', title: a.title, body: a.body, ack: { need: a.ack, done: [A.ME], total: n } } }; c.msgs.push(m); s.modal = null; }); A.snack('Announcement sent to ' + n + ' people'); A.openConv('ch-announcements');
      setTimeout(() => A.set(() => { const m = A.lastMsg(c); if (m.card) m.card.ack.done.push(...(g ? g.members : ['u2', 'u3']).filter((u) => !m.card.ack.done.includes(u)).slice(0, 1)); }), 3000); };
    const up = (k) => (e) => setA(Object.assign({}, a, { [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    return html`<${Dlg} title="New announcement" width="540px" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!a.title.trim()} onClick=${send}>Send to ${n} people</button>`}>
      <div className="fld"><label htmlFor="an-a">Audience</label><select id="an-a" value=${a.aud} onChange=${up('aud')}><option value="everyone">Everyone at Ridgeline Powersports</option>${A.GROUPS.map((x) => html`<option value=${x.key}>${x.label} (${x.members.length})</option>`)}</select></div>
      <div className="fld"><label htmlFor="an-t">Title</label><input id="an-t" value=${a.title} onChange=${up('title')} placeholder="e.g. Shop closes at 3 PM Friday for inventory" /></div>
      <div className="fld"><label htmlFor="an-b">Message</label><textarea id="an-b" value=${a.body} onChange=${up('body')}></textarea></div>
      <div className="frow"><div className="fld"><label htmlFor="an-p">Priority</label><select id="an-p" value=${a.pri} onChange=${up('pri')}><option value="normal">Normal</option><option value="important">Important (notification)</option><option value="urgent">Urgent (banner until acknowledged)</option></select></div>
        <div className="fld"><label htmlFor="an-s">Send</label><select id="an-s"><option>Now</option><option>Tomorrow 7:00 AM</option><option>Pick a date and time…</option></select></div></div>
      <label className="check"><input type="checkbox" id="an-k" checked=${a.ack} onChange=${up('ack')} />Ask people to acknowledge</label></${Dlg}>`;
  }
  function NewChannel() { const [n, setN] = useState(''); const [d, setD] = useState(''); const [priv, setPriv] = useState(false); const [loc, setLoc] = useState(A.LOCATIONS[0]);
    const nm = n.toLowerCase().replace(/[^a-z0-9-]+/g, '-'); const taken = A.CONVS.some((c) => c.kind === 'channel' && c.name === nm);
    return html`<${Dlg} title="Create a channel" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!nm || taken} onClick=${() => { const c = { id: 'ch-' + nm, kind: 'channel', name: nm, topic: d, private: priv, loc, members: [A.ME], unread: 0, msgs: [{ id: A.nextId(), kind: 'sys', t: Date.now(), text: 'You created #' + nm, reactions: {}, thread: [] }] }; A.CONVS.push(c); A.set({ modal: null }); A.openConv(c.id); }}>Create</button>`}>
      <div className="fld"><label htmlFor="cn">Name</label><input id="cn" value=${n} onChange=${(e) => setN(e.target.value)} placeholder="e.g. used-inventory" />${taken ? html`<small style=${{ color: 'var(--red)' }}>#${nm} already exists. Pick another name.</small>` : nm ? html`<small style=${{ color: 'var(--fg2)' }}>Will be #${nm}</small>` : null}</div>
      <div className="fld"><label htmlFor="cd">Description</label><input id="cd" value=${d} onChange=${(e) => setD(e.target.value)} /></div>
      <div className="fld"><label htmlFor="cl">Location</label><select id="cl" value=${loc} onChange=${(e) => setLoc(e.target.value)}>${[...A.LOCATIONS, 'All locations'].map((l) => html`<option>${l}</option>`)}</select></div>
      <label className="check"><input type="checkbox" id="cp" checked=${priv} onChange=${(e) => setPriv(e.target.checked)} />Private: only invited people can find and join</label></${Dlg}>`; }
  function Browse() { const all = A.CONVS.filter((c) => c.kind === 'channel');
    return html`<${Dlg} title="Browse channels" width="600px"><div className="tbl"><table><thead><tr><th>Channel</th><th>Location</th><th>Members</th><th></th></tr></thead><tbody>
      ${[...all, { id: 'ch-used-inventory', kind: 'channel', name: 'used-inventory', loc: 'All locations', topic: 'Trade-ins and used units', members: ['u6', 'u10'], unread: 0, msgs: [], _new: true }].map((c) => { const member = c.members.includes(A.ME);
        return html`<tr><td><b>#${c.name}</b><div style=${{ color: 'var(--fg2)', fontSize: 12 }}>${c.topic}</div></td><td>${c.loc}</td><td>${c.members.length}</td><td style=${{ textAlign: 'right' }}>${member ? html`<button className="btn sm" onClick=${() => { A.set({ modal: null }); A.openConv(c.id); }}>Open</button>` : html`<button className="btn sm pri" onClick=${() => { if (c._new && !A.conv(c.id)) { delete c._new; A.CONVS.push(c); } c.members.push(A.ME); A.set({ modal: null }); A.openConv(c.id); }}>Join</button>`}</td></tr>`; })}</tbody></table></div></${Dlg}>`; }
  function Preview({ md }) { const f = md.f;
    return html`<${Dlg} title=${f.name} width="640px" foot=${html`<button className="btn" onClick=${() => A.snack('Attached to RO 48213 in ASPEN')}>Attach to ASPEN record</button><button className="btn pri" onClick=${() => A.snack('Downloading ' + f.name)}><${I} n="download" s="12" />Download</button>`}>
      <div style=${{ height: 300, background: 'var(--chrome)', display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--fg2)' }}>${f.type === 'M4A' ? html`<div style=${{ display: 'flex', gap: 10, alignItems: 'center' }}><button className="btn pri"><${I} n="play" /></button><${I} n="wave" s="24" /><span>0:12</span></div>` : html`<div style=${{ textAlign: 'center' }}><span className="ficon" style=${{ width: 56, height: 64, background: f.type === 'PDF' ? '#c50f1f' : f.type === 'XLSX' ? '#107c10' : '#8764b8', margin: '0 auto 8px', fontSize: 13 }}>${f.type}</span>Preview of ${f.name}<br /><small>${f.size} · Scanned, no threats found</small></div>`}</div></${Dlg}>`; }
  function Confirm({ md }) { return html`<${Dlg} title=${md.title} foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn dan" onClick=${() => { A.set({ modal: null }); md.act(); }}>${md.ok}</button>`}><p style=${{ margin: 0 }}>${md.body}</p></${Dlg}>`; }
  function AckReport({ md }) { const d = md.d; const all = Object.keys(A.USERS).slice(0, d.ack.total);
    return html`<${Dlg} title="Acknowledgment report" width="520px" foot=${html`<button className="btn" onClick=${() => A.snack('Reminder sent to ' + (d.ack.total - d.ack.done.length) + ' people')}>Remind those who haven't</button><button className="btn pri" onClick=${() => A.set({ modal: null })}>Done</button>`}>
      <p style=${{ marginTop: 0 }}><b>${d.title}</b><br />${d.ack.done.length} of ${d.ack.total} acknowledged</p>
      <div className="tbl"><table><tbody>${all.map((u) => html`<tr><td style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><${A.Av} u=${u} size="24" pres=${false} />${A.USERS[u].name}</td><td>${d.ack.done.includes(u) ? html`<span className="pill g">Acknowledged</span>` : html`<span className="pill">Seen, not acknowledged</span>`}</td></tr>`)}</tbody></table></div></${Dlg}>`; }
  function Forward({ md }) { const [to, setTo] = useState(''); const [note, setNote] = useState('');
    return html`<${Dlg} title="Forward message" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null })}>Cancel</button><button className="btn pri" disabled=${!to} onClick=${() => { A.send(to, (note ? note + '\n' : '') + '↪ Forwarded from ' + A.USERS[md.m.from].name + ': ' + md.m.text); A.set({ modal: null }); A.snack('Forwarded'); }}>Forward</button>`}>
      <div className="fld"><label htmlFor="fw-to">To</label><select id="fw-to" value=${to} onChange=${(e) => setTo(e.target.value)}><option value="">Choose a conversation</option>${A.CONVS.filter((c) => !c.readonly).map((c) => html`<option value=${c.id}>${c.kind === 'channel' ? '#' : ''}${A.convName(c)}</option>`)}</select></div>
      <div className="quote" style=${{ margin: '0 0 12px' }}>${md.m.text}</div><div className="fld"><label htmlFor="fw-n">Add a note</label><input id="fw-n" value=${note} onChange=${(e) => setNote(e.target.value)} /></div></${Dlg}>`; }
  function Note() { const [v, setV] = useState(A.S.myNote);
    return html`<${Dlg} title="Set status note" foot=${html`<button className="btn" onClick=${() => A.set({ modal: null, myNote: '' })}>Clear</button><button className="btn pri" onClick=${() => A.set((s) => { s.myNote = v; A.USERS[A.ME].note = v; s.modal = null; })}>Done</button>`}>
      <div className="fld"><label htmlFor="sn">What are you working on?</label><input id="sn" value=${v} maxLength="100" onChange=${(e) => setV(e.target.value)} placeholder="e.g. On the lot with a customer until 2" /></div>
      <div className="fld"><label htmlFor="sc">Clear after</label><select id="sc"><option>Today</option><option>1 hour</option><option>This week</option><option>Never</option></select></div></${Dlg}>`; }
  function Info({ md }) { const m = md.m, c = md.c;
    return html`<${Dlg} title="Message info"><div className="kv"><span>Sent</span><span>${A.fmtDay(m.t)} ${A.fmtTime(m.t)}</span><span>Edited</span><span>${m.edited ? 'Yes' : 'No'}</span></div><div className="sect">Seen by</div>
      ${c.members.filter((u) => u !== m.from).map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0' }}><${A.Av} u=${u} size="24" pres=${false} />${A.USERS[u].name}<small style=${{ marginLeft: 'auto', color: 'var(--fg2)' }}>${A.USERS[u].pres === 'off' ? 'Delivered' : 'Seen ' + A.fmtTime(m.t + 90000)}</small></div>`)}</${Dlg}>`; }
  function Keys() { const k = [['Ctrl+K', 'Search and jump'], ['Ctrl+N', 'New chat'], ['Enter', 'Send'], ['Shift+Enter', 'New line'], ['@', 'Mention someone'], ['#', 'Link an ASPEN record'], ['Esc', 'Close panel or dialog'], ['Ctrl+Shift+M', 'Mute in a call'], ['Ctrl+Shift+O', 'Camera on or off'], ['Ctrl+Shift+H', 'Hang up']];
    return html`<${Dlg} title="Keyboard shortcuts"><div className="tbl"><table><tbody>${k.map(([a, b]) => html`<tr><td><span className="sk">${a}</span></td><td>${b}</td></tr>`)}</tbody></table></div></${Dlg}>`; }

  // ---------- prototype triggers (status bar) ----------
  A.demoMessage = () => { const c = A.conv('dm-u3'); const m = A.post(c.id, 'u3', 'Stator just showed up on the second Polaris truck after all. Starting the RZR now.'); A.set(() => A.arrive(c, m)); };
  A.demoMention = () => { const c = A.conv('ch-sales-floor'); const m = A.post(c.id, 'u10', '@Mubshar can service do a PDI on UNIT C4471 by 3 today? Customer is coming at 4.'); A.set(() => A.arrive(c, m)); };
  A.demoCall = () => { if (A.S.call) return A.snack('End your current call first'); A.set(() => A.toast({ kind: 'call', from: 'u5', video: false, ctx: 'DEAL 7741' })); };
  A.demoApproval = () => { A.set(() => { A.ALERTS.unshift({ id: A.nextId(), bot: 'Parts approval', ini: 'PA', color: 'var(--parts)', t: Date.now(), state: 'pending', title: 'Approve parts order PO 1240', rec: null, lines: ['Kubota, 3 lines, $1,764.90', 'Requested by Tom Baker for RO 48230', 'Rule: orders over $1,500 need a manager'] }); A.toast({ kind: 'msg', conv: 'dm-u4', from: 'u4', text: 'Approval needed: parts order PO 1240 ($1,764.90)' }); }); };
  A.demoUrgent = () => A.set((s) => { s.urgent = { id: A.nextId(), title: 'Shop closes at 3 PM today for inventory.', body: 'Update all open ROs by noon.' }; if (s.connect === 'closed') s.connect = 'open'; });

  // ---------- mount ----------
  function App() {
    const [, f] = useState(0);
    useEffect(() => A.sub(() => f((x) => x + 1)), []);
    useEffect(() => { const k = (e) => { if (e.ctrlKey && e.key === '/') A.set({ modal: { type: 'keys' } }); if (e.ctrlKey && (e.key === 'n' || e.key === 'N') && A.S.connect !== 'closed') { e.preventDefault(); A.set({ modal: { type: 'newchat' } }); } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
    return html`<${A.Desktop} />`;
  }
  // Mount only after every module script has run; an early render can hit a component that isn't defined yet.
  const mount = () => ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
  if (document.readyState === 'complete') mount(); else window.addEventListener('load', mount);
})();
