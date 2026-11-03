// Full-width pages (Activity, Alerts, Calls, My Work, Files, People, Saved, Search, Settings, Admin).
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState } = React;

  A.Page = function Page() {
    const S = A.S;
    const P = { activity: Activity, alerts: Alerts, calls: Calls, work: Work, files: Files, people: People, saved: Saved, search: Search, settings: Settings, admin: Admin }[S.section];
    return P ? html`<${P} />` : null;
  };

  // ---------- Activity ----------
  function Activity() {
    const S = A.S, f = S.actFilter;
    let items = A.activityItems();
    if (f === 'unread') items = items.filter((x) => !S.activityRead[x.id]);
    if (f !== 'all' && f !== 'unread') items = items.filter((x) => x.type === f);
    const sel = items.find((x) => x.id === S.actSel) || items[0];
    const open = (x) => A.set((s) => { s.actSel = x.id; s.activityRead[x.id] = true; });
    return html`<div className="list">
      <div className="lh"><h2>Activity</h2><button className="ib" title="Mark all as read" onClick=${() => A.set((s) => { A.activityItems().forEach((x) => (s.activityRead[x.id] = true)); })}><${I} n="checks" /></button></div>
      <div className="lfilter">${[['all', 'All'], ['unread', 'Unread'], ['mention', '@Mentions'], ['reply', 'Replies'], ['reaction', 'Reactions'], ['approval', 'Approvals'], ['call', 'Missed calls']].map(([k, l]) => html`<button className=${'chip' + (f === k ? ' on' : '')} onClick=${() => A.set({ actFilter: k })}>${l}</button>`)}</div>
      <div className="lscroll">${items.map((x) => html`<div className=${'li' + (sel && sel.id === x.id ? ' on' : '') + (!S.activityRead[x.id] ? ' unread' : '')} onClick=${() => open(x)}>
        ${x.alert ? html`<span className="av sq" style=${{ background: x.alert.color }}>${x.alert.ini}</span>` : html`<${A.Av} u=${x.actor} pres=${false} />`}
        <div className="nm"><div className="t1"><b>${x.text}</b><small>${A.rel(x.t)}</small></div><div className="t2">${x.alert ? x.alert.title : x.call ? x.call.kind + ' call' : (x.c.kind === 'channel' ? '#' : '') + A.convName(x.c) + ' · ' + (x.m.text || '')}</div></div></div>`)}
        ${!items.length ? html`<div className="empty" style=${{ height: 260 }}><div><${I} n="activity" s="24" /><b>Nothing new for you</b>Mentions, replies and approvals show up here.</div></div>` : null}</div></div>
      <div className="main">${!sel ? null : sel.alert ? html`<div className="page"><${AlertCard} a=${sel.alert} /></div>`
        : sel.call ? html`<div className="empty"><div><${A.Av} u=${sel.call.who} size="72" /><b>Missed call from ${A.USERS[sel.call.who].name}</b>${A.fmtList(sel.call.t)} at ${A.fmtTime(sel.call.t)}<div style=${{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}><button className="btn pri" onClick=${() => { A.dmWith(sel.call.who); A.startCall('dm-' + sel.call.who, false); }}><${I} n="phone" />Call back</button><button className="btn" onClick=${() => A.dmWith(sel.call.who)}>Message</button></div></div></div>`
        : html`<div className="mh"><${A.ConvAv} c=${sel.c} /><div className="tt"><b>${sel.c.kind === 'channel' ? '#' : ''}${A.convName(sel.c)}</b><small>${sel.root ? 'Thread reply' : 'Message in context'}</small></div><span className="grow"></span><button className="btn sm" onClick=${() => sel.root ? (A.openConv(sel.c.id), A.set({ panel: { type: 'thread', id: sel.root.id } })) : A.openConv(sel.c.id, sel.m.id)}>Go to conversation</button></div>
          <div className="feed">${(sel.root ? [sel.root, ...sel.root.thread] : sel.c.msgs.slice(Math.max(0, sel.c.msgs.indexOf(sel.m) - 3), sel.c.msgs.indexOf(sel.m) + 3)).filter((m) => m.text && A.USERS[m.from]).map((m) => html`<div className=${'m first' + (m.id === sel.m.id ? ' flash' : '')} key=${m.id}><div className="gut"><${A.Av} u=${m.from} pres=${false} /></div><div className="bd"><div className="who"><b>${m.from === A.ME ? 'You' : A.USERS[m.from].name}</b><small>${A.fmtTime(m.t)}</small></div><div className="tx">${A.rich(m.text)}</div>${Object.keys(m.reactions).length ? html`<div className="reacts">${Object.entries(m.reactions).map(([e, us]) => html`<button>${e} ${us.length}</button>`)}</div>` : null}</div></div>`)}</div>
          <${A.Composer} key=${'act' + sel.c.id + (sel.root ? sel.root.id : '')} c=${sel.c} threadRoot=${sel.root ? sel.root.id : undefined} />`}</div>`;
  }

  // ---------- Alerts ----------
  function AlertCard({ a }) {
    const [reason, setReason] = useState(''); const [rej, setRej] = useState(false);
    const pill = a.state === 'pending' ? html`<span className="pill a">Waiting on you</span>` : a.state === 'approved' ? html`<span className="pill g">Approved by ${a.by} · ${a.at || '4:51 PM'}</span>` : a.state === 'rejected' ? html`<span className="pill r">Rejected by ${a.by}</span>` : null;
    return html`<div className="m first" style=${{ padding: '8px 0' }}><div className="gut"><span className="av sq" style=${{ background: a.color }}>${a.ini}</span></div><div className="bd">
      <div className="who"><b>${a.bot}</b><span className="pill">Bot</span><small>${A.dayKey(a.t) === A.dayKey(Date.now()) ? '' : A.fmtDay(a.t) + ' '}${A.fmtTime(a.t)}</small></div>
      <div className="card" style=${{ maxWidth: 560, borderLeft: '3px solid ' + (a.state === 'pending' ? 'var(--orange)' : a.state === 'info' ? 'var(--line2)' : a.state === 'approved' ? 'var(--green)' : 'var(--red)') }}>
        <div className="chd"><b style=${{ flex: 1 }}>${a.title}</b>${pill}</div>
        <div className="cbd">${a.lines.map((l) => html`<div>${l}</div>`)}${a.reason ? html`<div style=${{ marginTop: 6, color: 'var(--fg2)' }}>Reason: ${a.reason}</div>` : null}</div>
        ${a.state === 'pending' ? rej ? html`<div className="cbd"><div className="fld" style=${{ marginBottom: 6 }}><label htmlFor=${'rr' + a.id}>Reason for rejecting (required)</label><textarea id=${'rr' + a.id} value=${reason} onChange=${(e) => setReason(e.target.value)} placeholder="e.g. Use the aftermarket stator from Rick's, $180 cheaper"></textarea></div>
            <div style=${{ display: 'flex', gap: 6 }}><button className="btn sm dan" disabled=${!reason.trim()} onClick=${() => { A.set(() => { a.state = 'rejected'; a.by = 'You'; a.reason = reason; (A.WORK || []).forEach((w) => { if (a.rec && w.rec === a.rec && w.type === 'approval' && w.status === 'Pending') { w.status = a.state === 'approved' ? 'Approved' : 'Rejected'; w.history.push({ t: Date.now(), who: A.ME, text: w.status + ' from ASPEN System' }); } }); }); A.snack('Rejected. Tom Baker was notified.'); }}>Reject order</button><button className="btn sm" onClick=${() => setRej(false)}>Cancel</button></div></div>`
          : html`<div className="cft"><button className="btn sm pri" onClick=${() => { A.set(() => { a.state = 'approved'; a.by = 'You'; a.at = A.fmtTime(Date.now()); (A.WORK || []).forEach((w) => { if (a.rec && w.rec === a.rec && w.type === 'approval' && w.status === 'Pending') { w.status = a.state === 'approved' ? 'Approved' : 'Rejected'; w.history.push({ t: Date.now(), who: A.ME, text: w.status + ' from ASPEN System' }); } }); }); A.snack('PO approved. Workflow continued: order sent to vendor.'); }}><${I} n="check" s="12" />Approve</button><button className="btn sm" onClick=${() => setRej(true)}>Reject…</button>${a.rec ? html`<button className="btn sm" onClick=${() => A.openRecordConv(a.rec)}>Discuss</button><button className="btn sm ghost" onClick=${() => A.snack('Opening ' + a.rec + ' in ASPEN…')}>View order</button>` : null}</div>`
        : a.state === 'info' ? html`<div className="cft"><button className="btn sm" onClick=${() => A.snack('Opening report in ASPEN…')}>Review</button><button className="btn sm ghost" onClick=${() => { A.set(() => { a.muted = true; }); A.snack('Muted until tomorrow'); }}>${a.muted ? 'Muted today' : 'Mute today'}</button></div>` : null}
      </div></div></div>`;
  }
  function Alerts() {
    const S = A.S, f = S.alertFilter;
    let list = A.ALERTS; if (f === 'pending') list = list.filter((a) => a.state === 'pending'); else if (f !== 'all') list = list.filter((a) => a.bot === f);
    const bots = [...new Set(A.ALERTS.map((a) => a.bot))];
    return html`<div className="main"><div className="mh"><span className="av sq" style=${{ background: 'var(--orange)' }}><${I} n="alerts" /></span><div className="tt"><b>Alerts</b><small>From Workflow Studio and ASPEN jobs</small></div><span className="grow"></span><button className="btn sm ghost" onClick=${() => A.go('settings', { setTab: 'notify' })}><${I} n="settings" s="12" />Alert settings</button></div>
      <div className="lfilter" style=${{ padding: '10px 16px' }}>${[['pending', 'Needs action (' + A.ALERTS.filter((a) => a.state === 'pending').length + ')'], ['all', 'All'], ...bots.map((b) => [b, b])].map(([k, l]) => html`<button className=${'chip' + (f === k ? ' on' : '')} onClick=${() => A.set({ alertFilter: k })}>${l}</button>`)}</div>
      <div className="page" style=${{ paddingTop: 0 }}>${list.map((a) => html`<${AlertCard} key=${a.id} a=${a} />`)}${!list.length ? html`<div className="empty" style=${{ height: 260 }}><div><${I} n="check" s="24" /><b>Nothing needs your action</b>Approvals and alerts will appear here.</div></div>` : null}</div></div>`;
  }
  A.AlertCard = AlertCard;

  // ---------- Calls ----------
  function Calls() {
    const favs = ['u2', 'u3', 'u4', 'u5'];
    return html`<div className="main"><div className="mh"><div className="tt"><b>Calls</b><small>Voice and video with your team</small></div><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set({ modal: { type: 'newchat', call: true } })}><${I} n="phone" s="12" />New call</button></div>
      <div className="page"><div className="sect" style=${{ marginTop: 0 }}>Speed dial</div><div className="grid-people" style=${{ marginBottom: 20 }}>${favs.map((u) => html`<div className="pc"><${A.Av} u=${u} /><div style=${{ flex: 1, minWidth: 0 }}><b>${A.USERS[u].name}</b><small>${A.presLabel(A.USERS[u].pres)}</small></div><button className="ib" title="Call" onClick=${() => { A.dmWith(u); A.startCall('dm-' + u, false); }}><${I} n="phone" /></button></div>`)}</div>
        <div className="sect">History</div><div className="tbl"><table><thead><tr><th>Name</th><th>Type</th><th>When</th><th>Duration</th><th></th></tr></thead><tbody>
        ${A.CALLS.map((c) => { const isU = !!A.USERS[c.who]; const name = isU ? A.USERS[c.who].name : A.convName(A.conv(c.who));
          return html`<tr><td style=${{ display: 'flex', gap: 8, alignItems: 'center', color: c.dir === 'missed' ? 'var(--red)' : undefined }}>${isU ? html`<${A.Av} u=${c.who} size="24" pres=${false} />` : html`<${A.ConvAv} c=${A.conv(c.who)} size="24" />`}${name}</td><td>${c.dir === 'missed' ? 'Missed' : c.dir === 'in' ? 'Incoming' : 'Outgoing'} ${c.kind.toLowerCase()}</td><td>${A.fmtList(c.t)} ${A.fmtTime(c.t)}</td><td>${c.dur || '-'}</td>
            <td style=${{ textAlign: 'right' }}><button className="btn sm" onClick=${() => { if (isU) { A.dmWith(c.who); A.startCall('dm-' + c.who, c.kind === 'Video'); } else A.startCall(c.who, false); }}><${I} n="phone" s="12" />Call back</button></td></tr>`; })}</tbody></table></div></div></div>`;
  }

  // ---------- My Work ----------
  function Work() {
    const S = A.S, f = S.workFilter, n = A.counts();
    let list = A.TASKS;
    if (f === 'overdue') list = list.filter((t) => t.status === 'Overdue'); if (f === 'approvals') list = list.filter((t) => t.type === 'Approval'); if (f === 'requests') list = list.filter((t) => t.type === 'Request'); if (f === 'all') list = list.filter((t) => t.status !== 'Done' || t._showDone);
    const tone = (t) => t.status === 'Done' ? 'g' : t.status === 'Overdue' ? 'r' : t.status === 'Due today' ? 'a' : t.status === 'Pending' ? 'b' : '';
    return html`<div className="main"><div className="mh"><div className="tt"><b>My Work</b><small>Tasks, requests and approvals you own</small></div><span className="grow"></span><button className="btn sm pri" onClick=${() => A.set({ modal: { type: 'task' } })}><${I} n="plus" s="12" />New task</button></div>
      <div className="page"><div className="stats">${[['all', n.open, 'Open tasks'], ['overdue', n.overdue, 'Overdue', 'var(--red)'], ['approvals', n.approvals, 'My approvals', 'var(--orange)'], ['requests', n.requests, 'Open requests']].map(([k, v, l, col]) => html`<button className=${'stat' + (f === k ? ' on' : '')} onClick=${() => A.set({ workFilter: k })}><b style=${{ color: col }}>${v}</b><span>${l}</span></button>`)}</div>
      <div className="tbl"><table><thead><tr><th style=${{ width: 30 }}></th><th>Item</th><th>Type</th><th>Due</th><th>From</th><th>Record</th><th>Status</th></tr></thead><tbody>
      ${list.map((t) => html`<tr className="click" onClick=${() => A.set({ modal: { type: 'taskview', t } })}><td><input type="checkbox" aria-label=${'Mark done: ' + t.title} checked=${t.status === 'Done'} onClick=${(e) => e.stopPropagation()} onChange=${() => { A.set(() => { t.status = t.status === 'Done' ? 'Open' : 'Done'; t._showDone = true; }); }} /></td>
        <td style=${{ textDecoration: t.status === 'Done' ? 'line-through' : 'none' }}>${t.title}</td><td>${t.type}</td><td>${t.due}</td><td>${t.from}</td><td>${t.rec ? html`<span className="link" onClick=${(e) => { e.stopPropagation(); A.openRecordConv(t.rec); }}>${t.rec}</span>` : '-'}</td><td><span className=${'pill ' + tone(t)}>${t.status}</span></td></tr>`)}
      </tbody></table></div></div></div>`;
  }

  // ---------- Files ----------
  function Files() {
    const S = A.S, rows = [];
    A.CONVS.forEach((c) => c.msgs.forEach((m) => { if (m.file) rows.push([m.file, m, c]); (m.files || []).forEach((f) => rows.push([f, m, c])); }));
    rows.push([{ name: 'october-service-specials.pdf', size: '1.2 MB', type: 'PDF' }, { from: 'u7', t: Date.now() - 4 * 864e5 }, A.conv('ch-general')]);
    rows.push([{ name: 'lift3-noise.jpg', size: '3.4 MB', type: 'JPG' }, { from: 'u9', t: Date.now() - 70 * 60000 }, A.conv('ch-service-shop')]);
    const f = S.filesFilter, list = rows.filter(([x]) => f === 'all' || (f === 'img' ? /JPG|PNG/.test(x.type) : x.type === f));
    return html`<div className="main"><div className="mh"><div className="tt"><b>Files</b><small>Everything shared in your conversations</small></div></div>
      <div className="lfilter" style=${{ padding: '10px 16px' }}>${[['all', 'All'], ['PDF', 'PDF'], ['img', 'Images'], ['XLSX', 'Spreadsheets'], ['M4A', 'Voice notes']].map(([k, l]) => html`<button className=${'chip' + (f === k ? ' on' : '')} onClick=${() => A.set({ filesFilter: k })}>${l}</button>`)}</div>
      <div className="page" style=${{ paddingTop: 0 }}><div className="tbl"><table><thead><tr><th>Name</th><th>Shared by</th><th>In</th><th>Date</th><th>Size</th></tr></thead><tbody>
      ${list.map(([x, m, c]) => html`<tr className="click" onClick=${() => A.set({ modal: { type: 'preview', f: x } })}><td style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="ficon" style=${{ width: 20, height: 24, background: x.type === 'PDF' ? '#c50f1f' : x.type === 'XLSX' ? '#107c10' : '#8764b8' }}>${x.type}</span>${x.name}</td><td>${A.USERS[m.from].name}</td><td>${c.kind === 'channel' ? '#' : ''}${A.convName(c)}</td><td>${A.fmtList(m.t)}</td><td>${x.size}</td></tr>`)}
      </tbody></table></div></div></div>`;
  }

  // ---------- People ----------
  function People() {
    const [q, setQ] = useState(''); const [d, setD] = useState('All');
    const S = A.S;
    const list = Object.keys(A.USERS).filter((u) => u !== A.ME).filter((u) => { const x = A.USERS[u]; return (!q || (x.name + x.title + x.ext).toLowerCase().includes(q.toLowerCase())) && (d === 'All' || x.dept === d) && (S.location === 'All locations' || x.loc === S.location); });
    return html`<div className="main"><div className="mh"><div className="tt"><b>People</b><small>${Object.keys(A.USERS).length} people at Ridgeline Powersports</small></div><span className="grow"></span>
        <input id="people-q" value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="Search name, title or extension" style=${{ border: '1px solid var(--line2)', borderRadius: 4, height: 28, padding: '0 8px', width: 240 }} /></div>
      <div className="lfilter" style=${{ padding: '10px 16px' }}>${['All', 'Service', 'Parts', 'Sales', 'Management', 'Accounting'].map((k) => html`<button className=${'chip' + (d === k ? ' on' : '')} onClick=${() => setD(k)}>${k}</button>`)}</div>
      <div className="page" style=${{ paddingTop: 0 }}><div className="grid-people">${list.map((u) => { const x = A.USERS[u]; return html`<div className="pc" onClick=${(e) => A.openProfile(u, e)}><${A.Av} u=${u} size="48" /><div style=${{ minWidth: 0 }}><b>${x.name}</b><small>${x.title}</small><small>${A.presLabel(x.pres)} · Ext. ${x.ext}</small></div></div>`; })}</div></div></div>`;
  }

  // ---------- Saved ----------
  function Saved() {
    const S = A.S, items = S.saved.map((id) => A.findMsg(id)).filter(Boolean);
    return html`<div className="main"><div className="mh"><div className="tt"><b>Saved</b><small>Messages you saved for later</small></div></div>
      <div className="page">${!items.length ? html`<div className="empty" style=${{ height: 300 }}><div><${I} n="saved" s="24" /><b>Nothing saved yet</b>Hover a message, choose More, then Save.</div></div>`
        : items.map(({ c, m }) => html`<div className="m first" style=${{ borderBottom: '1px solid var(--line)', paddingBottom: 10, cursor: 'pointer' }} onClick=${() => A.openConv(c.id, m.id)}><div className="gut"><${A.Av} u=${m.from} pres=${false} /></div><div className="bd"><div className="who"><b>${A.USERS[m.from].name}</b><small>${c.kind === 'channel' ? '#' : ''}${A.convName(c)} · ${A.fmtList(m.t)}</small></div><div className="tx">${A.rich(m.text)}</div></div>
          <button className="btn sm ghost" onClick=${(e) => { e.stopPropagation(); A.set((s) => { s.saved = s.saved.filter((x) => x !== m.id); }); }}>Remove</button></div>`)}</div></div>`;
  }

  // ---------- Search results ----------
  function Search() {
    const S = A.S; const [q, setQ] = useState(S.searchQ || ''); const [from, setFrom] = useState('');
    const ql = q.trim().toLowerCase(); const hits = [];
    if (ql) A.CONVS.forEach((c) => c.msgs.forEach((m) => { if (A.USERS[m.from] && m.text && m.text.toLowerCase().includes(ql) && (!from || m.from === from)) hits.push({ c, m }); }));
    return html`<div className="list" style=${{ padding: '12px 14px', gap: 12 }}><h2 style=${{ font: '600 16px var(--font)', margin: 0 }}>Filters</h2>
        <div className="fld"><label htmlFor="sf-from">From</label><select id="sf-from" value=${from} onChange=${(e) => setFrom(e.target.value)}><option value="">Anyone</option>${Object.keys(A.USERS).map((u) => html`<option value=${u}>${A.USERS[u].name}</option>`)}</select></div>
        <div className="fld"><label htmlFor="sf-date">Date</label><select id="sf-date"><option>Any time</option><option>Last 7 days</option><option>Last 30 days</option></select></div>
        <label className="check"><input type="checkbox" id="sf-rec" />Has record</label><label className="check"><input type="checkbox" id="sf-file" />Has file</label><label className="check"><input type="checkbox" id="sf-me" />Mentions me</label></div>
      <div className="main"><div className="mh"><input id="search-q" value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="Search messages" style=${{ flex: 1, border: '1px solid var(--line2)', borderRadius: 4, height: 30, padding: '0 10px', fontSize: 14 }} /></div>
        <div className="tabs"><span className="tab on">Messages ${hits.length}</span><span className="tab">Files</span><span className="tab">People</span><span className="tab">Records</span></div>
        <div className="feed">${hits.map(({ c, m }) => html`<div className="m first" style=${{ cursor: 'pointer' }} onClick=${() => A.openConv(c.id, m.id)}><div className="gut"><${A.Av} u=${m.from} pres=${false} /></div><div className="bd"><div className="who"><b>${A.USERS[m.from].name}</b><small>in ${c.kind === 'channel' ? '#' : ''}${A.convName(c)} · ${A.fmtList(m.t)}</small></div><div className="tx">${A.rich(m.text, q.trim())}</div></div></div>`)}
          ${ql && !hits.length ? html`<div className="empty" style=${{ height: 240 }}><div><b>No messages match "${q}"</b>Try fewer words or clear the filters.</div></div>` : null}</div></div>`;
  }

  // ---------- Settings ----------
  const setTextSize = (v) => { A.S.settings.textSize = v; document.documentElement.style.setProperty('--tz', v / 100); try { localStorage.setItem('aspen-textsize', v); } catch (e) {} };
  let tz0 = 100; try { tz0 = +localStorage.getItem('aspen-textsize') || 100; } catch (e) {}
  setTextSize(tz0);
  const photo0 = A.USERS[A.ME] && A.USERS[A.ME].photo;
  try { const ph = localStorage.getItem('aspen-photo'); if (ph && A.USERS[A.ME]) A.USERS[A.ME].photo = ph; } catch (e) {}
  const setPhoto = (src) => { A.USERS[A.ME].photo = src || photo0 || null; try { src ? localStorage.setItem('aspen-photo', src) : localStorage.removeItem('aspen-photo'); } catch (e) {} A.set({}); };
  const pickPhoto = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f || !/^image\//.test(f.type)) return A.snack('Choose an image file');
    const img = new Image(); img.onload = () => { const n = 192, c = document.createElement('canvas'), k = Math.min(img.width, img.height); c.width = c.height = n; c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, n, n); setPhoto(c.toDataURL('image/jpeg', 0.85)); URL.revokeObjectURL(img.src); A.snack('Profile picture updated'); };
    img.onerror = () => A.snack('That image could not be read'); img.src = URL.createObjectURL(f);
  };
  function Settings() {
    const S = A.S, st = S.settings, tab = S.setTab || 'profile';
    const Sw = ({ k, label, desc }) => html`<div style=${{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}><div style=${{ flex: 1 }}><div>${label}</div>${desc ? html`<small style=${{ color: 'var(--fg2)' }}>${desc}</small>` : null}</div><button role="switch" aria-checked=${!!st[k]} aria-label=${label} className=${'sw' + (st[k] ? ' on' : '')} onClick=${() => A.set(() => { st[k] = !st[k]; })}></button></div>`;
    const tabs = [['profile', 'Profile'], ['notify', 'Notifications'], ['appear', 'Appearance'], ['msgs', 'Messages'], ['av', 'Audio'], ['tools', 'Tools'], ['help', 'Help']];
    const Go = ({ icon, label, desc, onClick }) => html`<button className="setrow" onClick=${onClick}><${I} n=${icon} /><span><b>${label}</b>${desc ? html`<small>${desc}</small>` : null}</span><${I} n="chev" s="12" /></button>`;
    return html`<div className="adminnav">${tabs.map(([k, l]) => html`<div className=${'li' + (tab === k ? ' on' : '')} onClick=${() => A.set({ setTab: k })}>${l}</div>`)}</div>
      <div className="main"><div className="mh"><div className="tt"><b>Settings</b><small>${tabs.find((t) => t[0] === tab)[1]}</small></div></div><div className="page" style=${{ maxWidth: 640 }}>
      ${tab === 'profile' ? html`<div className="profset"><${A.Av} u=${A.ME} size="72" pres=${false} /><div><b>${A.USERS[A.ME].name}</b><small>${A.USERS[A.ME].title || ''}</small>
        <div className="profbtns"><label className="btn pri">Upload photo<input type="file" accept="image/*" hidden onChange=${pickPhoto} /></label>${A.USERS[A.ME].photo !== photo0 ? html`<button className="btn" onClick=${() => setPhoto(null)}>Remove</button>` : null}</div><small>JPG or PNG. Everyone in Messaging sees it.</small></div></div>` : null}
      ${tab === 'notify' ? html`<${Sw} k="toasts" label="Show Windows notifications" desc="When ASPEN is in the background or Connect is closed" /><${Sw} k="sounds" label="Play sounds" /><${Sw} k="preview" label="Show message text in notifications" desc="Turn off if customers can see your screen" /><${Sw} k="quiet" label="Quiet hours 7 PM - 7 AM" desc="Calls from your breakthrough list still ring" />` : null}
      ${tab === 'appear' ? html`<div className="fld"><label>Theme</label><${A.ThemeSeg} /></div><${Sw} k="compact" label="Compact density" desc="Smaller avatars and tighter spacing" /><div style=${{ height: 14 }}></div><div className="fld"><label htmlFor="fs">Text size <b className="tzval">${st.textSize}%</b></label><div className="tzrow"><span style=${{ fontSize: 11 }}>A</span><input id="fs" type="range" min="90" max="130" step="10" value=${st.textSize} onChange=${(e) => { setTextSize(+e.target.value); A.set({}); }} /><span style=${{ fontSize: 17 }}>A</span>${st.textSize !== 100 ? html`<button className="link" onClick=${() => { setTextSize(100); A.set({}); }}>Reset</button>` : null}</div></div>` : null}
      ${tab === 'msgs' ? html`<${Sw} k="enterSends" label="Enter sends the message" desc="Off: Ctrl+Enter sends, Enter adds a line" />` : null}
      ${tab === 'av' ? html`<div className="fld"><label htmlFor="mic">Microphone</label><select id="mic"><option>Headset (Jabra Evolve2 40)</option><option>Microphone Array (Realtek)</option></select></div><div className="fld"><label htmlFor="spk">Speaker</label><select id="spk"><option>Headset (Jabra Evolve2 40)</option><option>Speakers (Realtek)</option></select></div><div className="fld"><label htmlFor="ring">Ring on</label><select id="ring"><option>Speakers (Realtek)</option><option>Headset</option></select></div><button className="btn" onClick=${() => A.snack('Playing test sound…')}>Play test sound</button>` : null}
      ${tab === 'tools' ? html`<${Go} icon="saved" label="Saved messages" onClick=${() => A.go('saved')} /><${Go} icon="activity" label="Insights" desc="How your team uses Messaging" onClick=${() => A.go('insights')} />
        ${A.ME === 'u1' ? html`<${Go} icon="admin" label="Messaging administration" onClick=${() => A.go('admin')} />` : null}` : null}
      ${tab === 'help' ? html`<${Go} icon="play" label="Take a tour" desc="A short walk through Chat, Tasks and the left bar" onClick=${() => { A.go('inbox'); setTimeout(() => A.set({ tour: 0 }), 50); }} /><${Go} icon="help" label="Keyboard shortcuts" onClick=${() => A.set({ modal: { type: 'keys' } })} />` : null}
      </div></div>`;
  }

  // ---------- Admin ----------
  function Admin() {
    const S = A.S, pg = S.adminPage;
    const pages = [['overview', 'Overview'], ['users', 'Users & sync'], ['channels', 'Channels'], ['policies', 'Policies'], ['calls', 'Calls'], ['retention', 'Retention & holds'], ['audit', 'Audit log'], ['export', 'Export'], ['bots', 'Bots & alerts']];
    const pol = S.policies || (S.policies = { createCh: true, gifs: false, dlp: 'warn', edit: '24h', video: true, share: true, rec: false });
    const Tog = ({ k, l }) => html`<div style=${{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}><span style=${{ flex: 1 }}>${l}</span><button role="switch" aria-checked=${!!pol[k]} aria-label=${l} className=${'sw' + (pol[k] ? ' on' : '')} onClick=${() => A.set(() => { pol[k] = !pol[k]; })}></button></div>`;
    const body = {
      overview: html`<div className="stats">${[['312', 'Active users (7 days)'], ['18,420', 'Messages (7 days)'], ['146', 'Calls (7 days)'], ['2', 'Sync warnings', 'var(--orange)']].map(([v, l, c]) => html`<div className="stat"><b style=${{ color: c }}>${v}</b><span>${l}</span></div>`)}</div>
        <div className="banner warn" style=${{ borderRadius: 4 }}><${I} n="alerts" /><span><b>2 users failed to sync from ASPEN.</b> jdoe2 has no location assigned.</span><span className="grow"></span><button className="btn sm" onClick=${() => A.set({ adminPage: 'users' })}>Review</button></div>
        <div className="sect">Adoption by location</div><div className="tbl"><table><thead><tr><th>Location</th><th>Users</th><th>Active this week</th><th>Messages</th></tr></thead><tbody><tr><td>01 - Main Location</td><td>214</td><td>188</td><td>14,102</td></tr><tr><td>02 - Lakeside</td><td>98</td><td>71</td><td>4,318</td></tr></tbody></table></div>`,
      users: html`<div style=${{ marginBottom: 12, display: 'flex', gap: 8 }}><button className="btn sm pri" onClick=${() => A.snack('Sync started. Users are read from ASPEN.')}>Sync now</button><span style=${{ color: 'var(--fg2)', alignSelf: 'center' }}>Last sync 6:00 AM · 312 users</span></div>
        <div className="tbl"><table><thead><tr><th>User</th><th>ASPEN login</th><th>Location</th><th>Connect role</th><th>Sync</th></tr></thead><tbody>${Object.keys(A.USERS).map((u) => html`<tr><td>${A.USERS[u].name}</td><td>${A.USERS[u].name.split(' ')[0].toLowerCase()}</td><td>${A.USERS[u].loc}</td><td>${u === 'u1' || u === 'u7' ? 'Admin' : 'Member'}</td><td><span className="pill g">OK</span></td></tr>`)}<tr><td>J. Doe</td><td>jdoe2</td><td>-</td><td>Member</td><td><span className="pill r">No location</span></td></tr></tbody></table></div>`,
      channels: html`<div className="tbl"><table><thead><tr><th>Channel</th><th>Visibility</th><th>Location</th><th>Members</th><th></th></tr></thead><tbody>${A.CONVS.filter((c) => c.kind === 'channel').map((c) => html`<tr><td>#${c.name}</td><td>${c.private ? 'Private' : c.readonly ? 'Announcements' : 'Public'}</td><td>${c.loc}</td><td>${c.members.length}</td><td><button className="btn sm ghost" onClick=${() => A.snack('#' + c.name + ' archived')}>Archive</button></td></tr>`)}</tbody></table></div>`,
      policies: html`<div style=${{ maxWidth: 560 }}><${Tog} k="createCh" l="Anyone can create channels" /><${Tog} k="gifs" l="Allow GIFs" /><div className="fld" style=${{ marginTop: 12 }}><label htmlFor="dlp">Customer data check (SSN, card numbers)</label><select id="dlp" value=${pol.dlp} onChange=${(e) => A.set(() => { pol.dlp = e.target.value; })}><option value="off">Off</option><option value="warn">Warn the sender</option><option value="block">Block the message</option></select></div><div className="fld"><label htmlFor="ed">Editing window</label><select id="ed" value=${pol.edit} onChange=${(e) => A.set(() => { pol.edit = e.target.value; })}><option value="15m">15 minutes</option><option value="24h">24 hours</option><option value="always">Always</option></select></div></div>`,
      calls: html`<div style=${{ maxWidth: 560 }}><${Tog} k="video" l="Allow video" /><${Tog} k="share" l="Allow screen sharing" /><${Tog} k="rec" l="Allow call recording" /><div className="fld" style=${{ marginTop: 12 }}><label htmlFor="mx">Max people in a call</label><select id="mx"><option>25</option><option>50</option></select></div></div>`,
      retention: html`<div className="fld" style=${{ maxWidth: 360 }}><label htmlFor="ret">Keep messages and files</label><select id="ret"><option>7 years</option><option>3 years</option><option>1 year</option><option>Forever</option></select></div><div className="sect">Legal holds</div><div className="tbl"><table><thead><tr><th>Scope</th><th>Reason</th><th>Placed by</th><th>Since</th></tr></thead><tbody><tr><td>Kim Lee</td><td>Customer dispute DEAL 7612</td><td>Rob Hale</td><td>Sep 30, 2026</td></tr></tbody></table></div><button className="btn sm" style=${{ marginTop: 10 }} onClick=${() => A.snack('Choose a person or conversation to hold')}>Add hold</button>`,
      audit: html`<div className="tbl"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th></tr></thead><tbody>${[['Today 8:02 AM', 'Rob Hale', 'Changed policy', 'Customer data check: Warn'], ['Yesterday 4:51 PM', 'Mubshar Shaukat', 'Approved', 'PO 1229'], ['Oct 21 2:10 PM', 'Rob Hale', 'Exported', 'Kim Lee, Sep 1 - Oct 21'], ['Oct 20 9:00 AM', 'System', 'Retention run', '0 items removed']].map((r) => html`<tr>${r.map((x) => html`<td>${x}</td>`)}</tr>`)}</tbody></table></div>`,
      export: html`<div style=${{ maxWidth: 480 }}><div className="fld"><label htmlFor="ex-p">Person or conversation</label><input id="ex-p" placeholder="e.g. Kim Lee, #sales-floor" /></div><div className="frow"><div className="fld"><label htmlFor="ex-f">From</label><input id="ex-f" type="date" /></div><div className="fld"><label htmlFor="ex-t">To</label><input id="ex-t" type="date" /></div></div><div className="fld"><label htmlFor="ex-r">Reason (logged)</label><input id="ex-r" placeholder="e.g. Customer complaint 2026-118" /></div><button className="btn pri" onClick=${() => A.snack('Export queued. You will get a link when it is ready.')}>Create export</button></div>`,
      bots: html`<div className="tbl"><table><thead><tr><th>Bot</th><th>Posts to</th><th>Users can mute</th><th>Enabled</th></tr></thead><tbody>${[['Parts approval', 'Alerts + record conversation', 'No'], ['Backorders', 'Record conversation', 'Yes'], ['Credit limit', 'Alerts', 'Yes'], ['eSign', 'Alerts', 'Yes'], ['Task due', 'Alerts', 'Yes']].map((r) => html`<tr>${r.map((x) => html`<td>${x}</td>`)}<td><span className="pill g">On</span></td></tr>`)}</tbody></table></div>`,
    }[pg];
    return html`<div className="adminnav">${pages.map(([k, l]) => html`<div className=${'li' + (pg === k ? ' on' : '')} onClick=${() => A.set({ adminPage: k })}>${l}</div>`)}</div>
      <div className="main"><div className="mh"><span className="av sq" style=${{ background: 'var(--settings)' }}><${I} n="admin" /></span><div className="tt"><b>Admin</b><small>${pages.find((p) => p[0] === pg)[1]} · Ridgeline Powersports</small></div></div><div className="page">${body}</div></div>`;
  }
})();
