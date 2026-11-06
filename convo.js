// Chat and channel lists, conversation view, messages, composer, side panels.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect, useRef, useLayoutEffect } = React;

  A.SectionView = function SectionView() {
    const S = A.S;
    switch (S.section) {
      case 'chat': case 'channels': {
        const c = A.conv(S.convId);
        const ok = c && (S.section === 'channels' ? c.kind === 'channel' : c.kind !== 'channel');
        return html`${S.section === 'chat' ? html`<${ChatList} />` : html`<${ChannelList} />`}
          ${ok ? html`<${A.Conversation} c=${c} />` : html`<div className="main"><div className="empty"><div><${I} n=${S.section === 'chat' ? 'chat' : 'channels'} s="24" /><b>Pick a conversation</b>Select one on the left, or start a new one.</div></div></div>`}
          ${ok && S.panel ? html`<${Panel} c=${c} />` : null}`;
      }
      default: return A.Page ? html`<${A.Page} />` : null;
    }
  };

  // ---------- lists ----------
  function Row({ c }) {
    const S = A.S, last = A.lastMsg(c), on = S.convId === c.id;
    const who = last && last.from && last.kind !== 'sys' ? (last.from === A.ME ? 'You: ' : c.kind !== 'dm' && A.USERS[last.from] ? A.USERS[last.from].name.split(' ')[0] + ': ' : '') : '';
    const preview = !last ? 'No messages yet' : last.kind === 'card' ? (last.card.title || 'Card') : last.file ? '📎 ' + last.file.name : last.text;
    const draft = A.drafts && A.drafts[c.id];
    const typing = S.typing[c.id];
    const unread = c.unread || c.markedUnread;
    return html`<div className=${'li' + (on ? ' on' : '') + (unread ? ' unread' : '') + (c.muted ? ' muted' : '')} onClick=${() => A.openConv(c.id)} onContextMenu=${(e) => { e.preventDefault(); rowMenu(e, c); }} role="button" tabIndex="0" onKeyDown=${(e) => e.key === 'Enter' && A.openConv(c.id)}>
      <${A.ConvAv} c=${c} />
      <div className="nm"><div className="t1"><b>${c.kind === 'channel' ? '' : ''}${A.convName(c)}</b><small>${last ? A.fmtList(last.t) : ''}</small></div>
        <div className="t2">${typing ? html`<i style=${{ color: 'var(--accent)' }}>typing…</i>` : draft ? html`<span style=${{ color: 'var(--red)' }}>Draft:</span> ${draft}` : who + preview}</div></div>
      ${c.muted ? html`<${I} n="belloff" s="12" />` : null}
      ${c.unread ? html`<span className=${'badge' + (c.muted ? ' grey' : '')}>${c.mentions ? '@' : ''}${c.unread}</span>` : c.markedUnread ? html`<span className="badge" style=${{ minWidth: 8, height: 8, padding: 0 }}></span>` : null}
      <span className="acts"><button className="ib" title="More options" onClick=${(e) => { e.stopPropagation(); rowMenu(e, c); }}><${I} n="more" /></button></span>
    </div>`;
  }
  function rowMenu(e, c) {
    const box = document.querySelector('.cwin').getBoundingClientRect();
    A.set({ pop: { type: 'row', c, x: e.clientX - box.left, y: e.clientY - box.top } });
  }
  function ChatList() {
    const S = A.S, f = S.chatFilter;
    let list = A.CONVS.filter((c) => c.kind !== 'channel');
    if (f === 'unread') list = list.filter((c) => c.unread || c.markedUnread);
    if (f === 'groups') list = list.filter((c) => c.kind === 'group');
    if (f === 'records') list = list.filter((c) => c.kind === 'record');
    const byT = (a, b) => ((A.lastMsg(b) || { t: 0 }).t - (A.lastMsg(a) || { t: 0 }).t);
    const pinned = list.filter((c) => c.pinned).sort(byT), rest = list.filter((c) => !c.pinned).sort(byT);
    return html`<div className="list">
      <div className="lh"><h2>Chat</h2><button className="ib" title="Filter"><${I} n="filter" /></button><button className="ib" title="New chat" onClick=${() => A.set({ modal: { type: 'newchat' } })}><${I} n="compose" /></button></div>
      <div className="lfilter">${[['all', 'All'], ['unread', 'Unread'], ['groups', 'Groups'], ['records', 'Records']].map(([k, l]) => html`<button className=${'chip' + (f === k ? ' on' : '')} onClick=${() => A.set({ chatFilter: k })}>${l}</button>`)}</div>
      <div className="lscroll">
        ${pinned.length ? html`<div className="lgrp"><${I} n="pin" s="12" />Pinned</div>${pinned.map((c) => html`<${Row} key=${c.id} c=${c} />`)}` : null}
        ${rest.length ? html`<div className="lgrp">Recent</div>${rest.map((c) => html`<${Row} key=${c.id} c=${c} />`)}` : null}
        ${!list.length ? html`<div className="empty" style=${{ height: 200 }}><div>${f === 'unread' ? 'You are all caught up.' : 'Nothing here yet.'}</div></div>` : null}
      </div></div>`;
  }
  function ChannelList() {
    const S = A.S;
    const chans = A.CONVS.filter((c) => c.kind === 'channel' && (S.location === 'All locations' || c.loc === S.location || c.loc === 'All locations'));
    const groups = {}; chans.forEach((c) => (groups[c.loc] = groups[c.loc] || []).push(c));
    return html`<div className="list">
      <div className="lh"><h2>Channels</h2><button className="ib" title="Create or browse" onClick=${(e) => { e.stopPropagation(); const box = document.querySelector('.cwin').getBoundingClientRect(); const r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'chanplus', x: r.left - box.left - 180, y: r.bottom - box.top + 2 } }); }}><${I} n="plus" /></button></div>
      <div className="lscroll">${Object.keys(groups).sort().map((g) => html`<div className="lgrp">${g}</div>${groups[g].map((c) => html`<${Row} key=${c.id} c=${c} />`)}`)}</div></div>`;
  }

  // ---------- conversation ----------
  A.Conversation = function Conversation({ c, compact }) {
    const S = A.S;
    const rec = c.kind === 'record' ? A.RECORDS[c.rec] : null;
    const dmU = c.kind === 'dm' ? A.USERS[c.with] : null;
    const sub = dmU ? dmU.title + ' · ' + A.presLabel(dmU.pres) + (dmU.note ? ' · ' + dmU.note : '') : rec ? A.RECKIND[rec.kind].label + ' · ' + c.members.length + ' members' : c.kind === 'channel' ? (c.topic || '') + ' · ' + c.members.length + ' members' : c.members.length + ' members';
    const tabs = [['chat', 'Chat'], ['files', 'Files'], ['pinned', 'Pinned']];
    const pins = c.msgs.filter((m) => m.pinned).length;
    const live = S.call && S.call.conv === c.id;
    const huddle = c.huddle;
    return html`<div className="main">
      <div className="mh">${dmU ? html`<${A.Av} u=${c.with} onClick=${(e) => A.openProfile(c.with, e)} />` : html`<${A.ConvAv} c=${c} />`}
        <div className="tt"><b>${c.kind === 'channel' ? '' : ''}${A.convName(c)}${c.muted ? html`<${I} n="belloff" s="12" />` : null}</b><small>${sub}</small></div>
        <span className="grow"></span>
        ${rec ? html`<button className="btn sm" onClick=${() => A.snack('Opening ' + c.rec + ' in ASPEN…')}><${I} n="ext" s="12" />Open in ASPEN</button>` : null}
        ${!compact ? html`
          ${c.kind === 'channel' ? html`<button className="btn sm" onClick=${() => A.startCall(c.id, false, true)}><${I} n="phone" />Team call</button>` : html`
            <button className="ib" title="Voice call" onClick=${() => A.startCall(c.id, false)}><${I} n="phone" /></button>
            `}
          ${c.kind !== 'dm' ? html`<button className="ib" title="Add people" onClick=${() => A.set({ modal: { type: 'add', c } })}><${I} n="adduser" /></button>` : null}
          <button className=${'ib' + (S.panel && S.panel.type === (rec ? 'record' : 'info') ? ' on' : '')} title=${rec ? 'Record details' : 'Conversation info'} onClick=${() => A.set({ panel: S.panel ? null : { type: rec ? 'record' : 'info' } })}><${I} n=${rec ? 'record' : 'info'} /></button>` : null}
      </div>
      ${!compact ? html`<div className="tabs">${tabs.map(([k, l]) => html`<button className=${'tab' + (S.tab === k ? ' on' : '')} onClick=${() => A.set({ tab: k })}>${l}${k === 'pinned' && pins ? ' ' + pins : ''}${k === 'files' ? ' ' + c.msgs.filter((m) => m.file || (m.files && m.files.length)).length : ''}</button>`)}</div>` : null}
      ${(huddle || live) && !compact ? html`<div className="banner call"><${I} n="phone" /><b>${c.kind === 'channel' ? 'Team call' : 'Call'} in progress</b><span>${live ? 'You are in this call' : ''}</span><span className="grow"></span>${!live ? html`<button className="btn sm pri" onClick=${() => A.startCall(c.id, false, true)}>Join</button>` : null}</div>` : null}
      ${S.tab === 'files' && !compact ? html`<${ConvFiles} c=${c} />` : S.tab === 'pinned' && !compact ? html`<${ConvPinned} c=${c} />` : html`<${Feed} c=${c} />`}
      <div className="typing" aria-live="polite">${S.typing[c.id] ? A.USERS[S.typing[c.id]].name.split(' ')[0] + ' is typing…' : ''}</div>
      ${c.readonly && c.kind === 'channel' ? html`<div className="composer" style=${{ padding: '10px 12px', color: 'var(--fg2)', display: 'flex', alignItems: 'center', gap: 10 }}>Only managers can post here.<span className="grow"></span><button className="btn sm pri" onClick=${() => A.set({ modal: { type: 'announce' } })}><${I} n="megaphone" />New announcement</button></div>` : html`<${A.Composer} key=${c.id} c=${c} />`}
    </div>`;
  };

  function Feed({ c }) {
    const S = A.S, ref = useRef(), firstUnreadIdx = useRef(null);
    const msgs = c.msgs;
    useLayoutEffect(() => { const el = ref.current; if (!el) return;
      if (S.highlight) { const t = el.querySelector('[data-id="' + S.highlight + '"]'); if (t) { t.scrollIntoView({ block: 'center' }); return; } }
      el.scrollTop = el.scrollHeight; }, [c.id, msgs.length, S.highlight]);
    useEffect(() => { if (S.highlight) { const t = setTimeout(() => A.set({ highlight: null }), 2600); return () => clearTimeout(t); } }, [S.highlight]);
    let prev = null; const out = [];
    msgs.forEach((m, i) => {
      if (!prev || A.dayKey(prev.t) !== A.dayKey(m.t)) out.push(html`<div className="day" key=${'d' + m.id}>${A.fmtDay(m.t)}</div>`);
      const grouped = prev && prev.from === m.from && !prev.kind && !m.kind && m.t - prev.t < 5 * 60000 && A.dayKey(prev.t) === A.dayKey(m.t);
      out.push(html`<${Msg} key=${m.id} m=${m} c=${c} grouped=${grouped} isLastMine=${m.from === A.ME && !msgs.slice(i + 1).some((x) => x.from === A.ME)} />`);
      prev = m;
    });
    if (!msgs.length) return html`<div className="feed" ref=${ref}><div className="empty"><div>${c.kind === 'dm' ? html`<${A.Av} u=${c.with} size="72" />` : html`<${A.ConvAv} c=${c} />`}<b>${A.convName(c)}</b>This is the start of your conversation.</div></div></div>`;
    return html`<div className="feed" ref=${ref} aria-live="polite">${out}</div>`;
  }

  // text with mentions, records and line breaks
  A.rich = function (text, q) {
    if (!text) return null;
    const parts = text.split(/(@[A-Z][a-z]+(?: [A-Z][a-z]+)?|\b(?:RO|DEAL|PO) ?\d{4,5}\b|\bUNIT C\d{4}\b)/g);
    return parts.map((p, i) => {
      if (i % 2) {
        if (p[0] === '@') return html`<span key=${i} className=${'mention' + (/Mubshar/.test(p) ? ' me' : '')}>${p}</span>`;
        const key = A.recordsIn(p)[0];
        return key ? html`<span key=${i} className="link" onClick=${() => A.openRecordConv(key)} title=${'Open ' + key + ' conversation'}>${p}</span>` : p;
      }
      if (q) { const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'); return p.split(re).map((x, j) => j % 2 ? html`<mark key=${i + '-' + j} className="hl">${x}</mark>` : x); }
      return p;
    });
  };

  A.RecCard = function RecCard({ k }) {
    const r = A.RECORDS[k]; if (!r) return null; const kk = A.RECKIND[r.kind];
    return html`<div className="card"><div className="chd"><span className="ty" style=${{ background: kk.color }}>${r.kind}</span><div style=${{ flex: 1, minWidth: 0 }}><b>${k} · ${r.title}</b><div style=${{ fontSize: 12, color: 'var(--fg2)' }}>${kk.label}</div></div><span className=${'pill ' + r.tone}>${r.status}</span></div>
      <div className="cbd"><div className="kv">${r.fields.slice(0, 3).map(([a, b]) => html`<span>${a}</span><span>${b}</span>`)}</div></div>
      <div className="cft"><button className="btn sm" onClick=${() => A.snack('Opening ' + k + ' in ASPEN…')}><${I} n="ext" s="12" />Open in ASPEN</button><button className="btn sm" onClick=${() => A.openRecordConv(k)}><${I} n="chat" s="12" />Discuss</button></div></div>`;
  };

  function Card({ m, c }) {
    const d = m.card;
    if (d.type === 'task') { const t = d.task; const done = t.status === 'Done';
      return html`<div className="card"><div className="chd"><span className="ty" style=${{ background: 'var(--accent)' }}><${I} n="task" /></span><div style=${{ flex: 1 }}><b>${t.title}</b><div style=${{ fontSize: 12, color: 'var(--fg2)' }}>Task · Owner ${A.USERS[t.owner] ? A.USERS[t.owner].name : t.owner} · Due ${t.due}</div></div><span className=${'pill ' + (done ? 'g' : 'a')}>${t.status}</span></div>
        <div className="cft" style=${{ paddingTop: 8 }}>${!done ? html`<button className="btn sm" onClick=${() => A.set(() => { t.status = 'Done'; })}><${I} n="check" s="12" />Mark done</button>` : null}<button className="btn sm" onClick=${() => A.go('work')}>Open in My Work</button></div></div>`; }
    if (d.type === 'announce') { const S = A.S; const acked = d.ack.done.includes(A.ME) || S.acks[m.id];
      return html`<div className="card" style=${{ maxWidth: 560 }}><div className="chd"><span className="ty" style=${{ background: 'var(--red)' }}><${I} n="megaphone" /></span><b style=${{ flex: 1 }}>${d.title}</b></div><div className="cbd">${d.body}</div>
        <div className="cft">${acked ? html`<span className="pill g"><${I} n="check" s="12" /> Acknowledged</span>` : html`<button className="btn sm pri" onClick=${() => A.set((s) => { d.ack.done.push(A.ME); })}>Got it</button>`}
        <span style=${{ color: 'var(--fg2)', fontSize: 12, alignSelf: 'center' }}>${d.ack.done.length} of ${d.ack.total} acknowledged</span>
        ${m.from === A.ME || A.ME === 'u1' ? html`<button className="btn sm ghost" onClick=${() => A.set({ modal: { type: 'ackreport', d } })}>View report</button>` : null}</div></div>`; }
    if (d.type === 'backorder') return html`<div className="card"><div className="chd"><span className="ty" style=${{ background: 'var(--parts)' }}>PO</span><b style=${{ flex: 1 }}>${d.title}</b><span className="pill a">Backorder</span></div><div className="cbd">${d.lines.map((l) => html`<div>${l}</div>`)}</div>
      <div className="cft">${d.done ? html`<span className="pill g">${d.done}</span>` : d.actions.map((a) => html`<button className="btn sm" onClick=${() => A.set(() => { d.done = a === 'Notify customer' ? 'Customer notified by text · ' + A.fmtTime(Date.now()) : 'No substitute found in Polaris catalog'; })}>${a}</button>`)}</div></div>`;
    return null;
  }

  function Msg({ m, c, grouped, isLastMine }) {
    const S = A.S;
    if (m.kind === 'sys') return html`<div className="m sys" data-id=${m.id}><div className="gut"><${I} n="info" s="12" /></div><div className="bd">${m.text} · ${A.fmtTime(m.t)}</div></div>`;
    const bot = m.from && m.from.startsWith('bot');
    const u = bot ? { name: 'Parts bot', ini: 'PB', color: 'var(--parts)' } : A.USERS[m.from];
    const recs = m.text ? A.recordsIn(m.text).filter((k) => k !== c.rec).slice(0, 1) : [];
    const [menu, setMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [ev, setEv] = useState(m.text);
    const box = () => document.querySelector('.cwin') ? document.querySelector('.cwin').getBoundingClientRect() : { left: 0, top: 0 };
    const pop = (type, e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(), b = box(); A.set({ pop: { type, m, c, x: Math.max(8, r.right - b.left - 240), y: r.bottom - b.top + 2 } }); };
    return html`<div className=${'m' + (grouped ? '' : ' first') + (S.highlight === m.id ? ' flash' : '')} data-id=${m.id}>
      <div className="gut">${grouped ? html`<span className="ht">${A.fmtTime(m.t).replace(/ [AP]M/, '')}</span>` : bot ? html`<span className="av sq" style=${{ background: u.color }}>${u.ini}</span>` : html`<${A.Av} u=${m.from} pres=${false} onClick=${(e) => A.openProfile(m.from, e)} />`}</div>
      <div className="bd">
        ${!grouped ? html`<div className="who"><b style=${{ cursor: bot ? 'default' : 'pointer' }} onClick=${(e) => !bot && A.openProfile(m.from, e)}>${m.from === A.ME ? 'You' : u.name}</b>${bot ? html`<span className="pill">Bot</span>` : null}<small>${A.fmtTime(m.t)}</small>${m.pinned ? html`<small style=${{ display: 'inline-flex', gap: 3 }}><${I} n="pin" s="12" />Pinned</small>` : null}</div>` : null}
        ${m.quote ? html`<div className="quote" style=${{ margin: '2px 0 4px' }}><${I} n="reply" s="12" /><span><b>${A.USERS[m.quote.from].name.split(' ')[0]}</b>: ${m.quote.text}</span></div>` : null}
        ${m.deleted ? html`<div className="tx" style=${{ color: 'var(--fg3)', fontStyle: 'italic' }}>This message was deleted.</div>`
          : editing ? html`<div className="composer" style=${{ margin: '4px 0' }}><textarea id=${'edit-' + m.id} value=${ev} onChange=${(e) => setEv(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); A.set(() => { m.text = ev; m.edited = true; }); setEditing(false); } if (e.key === 'Escape') setEditing(false); }} autoFocus></textarea><div className="ctools"><small style=${{ color: 'var(--fg2)' }}>Enter to save · Esc to cancel</small><span className="grow"></span><button className="btn sm" onClick=${() => setEditing(false)}>Cancel</button><button className="btn sm pri" onClick=${() => { A.set(() => { m.text = ev; m.edited = true; }); setEditing(false); }}>Save</button></div></div>`
          : html`${m.text ? html`<div className="tx">${A.rich(m.text, S.searchHl)}${m.edited ? html` <span className="edited">(edited)</span>` : null}</div>` : null}
            ${m.card ? html`<${Card} m=${m} c=${c} />` : null}
            ${m.file ? html`<${A.FileChip} f=${m.file} />` : null}${m.files ? m.files.map((f) => html`<${A.FileChip} f=${f} />`) : null}
            ${recs.map((k) => html`<${A.RecCard} k=${k} />`)}`}
        ${Object.keys(m.reactions).length ? html`<div className="reacts">${Object.entries(m.reactions).map(([e, us]) => html`<button className=${us.includes(A.ME) ? 'me' : ''} title=${us.map((x) => A.USERS[x].name).join(', ')} onClick=${() => A.react(m.id, e)}>${e} ${us.length}</button>`)}<button title="Add reaction" onClick=${(e) => pop('emoji', e)}><${I} n="emoji" s="12" /></button></div>` : null}
        ${m.thread.length ? html`<div className="thr" onClick=${() => A.set({ panel: { type: 'thread', id: m.id } })}><span style=${{ display: 'flex' }}>${[...new Set(m.thread.map((r) => r.from))].slice(0, 3).map((u2) => html`<${A.Av} u=${u2} size="20" pres=${false} />`)}</span>${m.thread.length} ${m.thread.length === 1 ? 'reply' : 'replies'} · last ${A.fmtTime(m.thread[m.thread.length - 1].t)}</div>` : null}
        ${m.from === A.ME && isLastMine && !m.deleted ? html`<div className=${'state' + (m.state === 'failed' ? ' fail' : '')}>${m.state === 'sending' ? html`<${I} n="clock" s="12" />Sending` : m.state === 'seen' || (m.state !== 'sent' && c.kind === 'dm' && !m.state) ? html`<${I} n="checks" s="12" />Seen` : html`<${I} n="check" s="12" />Sent`}</div>` : null}
      </div>
      ${!m.deleted && !editing ? html`<div className=${'mhover' + (menu ? ' open' : '')}>
        ${['👍', '✅', '👀', '😂'].map((e) => html`<button title=${'React ' + e} onClick=${() => A.react(m.id, e)}>${e}</button>`)}
        <button title="More reactions" onClick=${(e) => pop('emoji', e)}><${I} n="emoji" /></button>
        ${c.kind !== 'dm' ? html`<button title="Reply in thread" onClick=${() => A.set({ panel: { type: 'thread', id: m.id } })}><${I} n="thread" /></button>` : html`<button title="Reply" onClick=${() => A.set((s) => { s.replyTo = { conv: c.id, m }; })}><${I} n="reply" /></button>`}
        <button title="Create task" onClick=${() => A.set({ modal: { type: 'task', m, c } })}><${I} n="task" /></button>
        <button title="More" onClick=${(e) => { A._edit = () => { setEv(m.text); setEditing(true); }; pop('msgmore', e); }}><${I} n="more" /></button></div>` : null}
    </div>`;
  }

  A.FileChip = function FileChip({ f }) {
    const col = { PDF: '#c50f1f', XLSX: '#107c10', JPG: '#8764b8', PNG: '#8764b8', DOCX: '#0063b1', M4A: '#038387' }[f.type] || 'var(--fg3)';
    return html`<div className="file" onClick=${() => A.set({ modal: { type: 'preview', f } })} title="Preview"><span className="ficon" style=${{ background: col }}>${f.type}</span><div style=${{ minWidth: 0 }}><div style=${{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${f.name}</div><small style=${{ color: 'var(--fg2)' }}>${f.size}${f.scanning ? ' · Checking for viruses…' : ''}</small></div></div>`;
  };

  function ConvFiles({ c }) {
    const files = []; c.msgs.forEach((m) => { if (m.file) files.push([m.file, m]); (m.files || []).forEach((f) => files.push([f, m])); });
    if (!files.length) return html`<div className="feed"><div className="empty"><div><${I} n="files" s="24" /><b>No files yet</b>Files shared here will be listed on this tab.</div></div></div>`;
    return html`<div className="feed" style=${{ padding: 16 }}><div className="tbl"><table><thead><tr><th>Name</th><th>Shared by</th><th>Date</th><th>Size</th></tr></thead><tbody>${files.map(([f, m]) => html`<tr className="click" onClick=${() => A.set({ modal: { type: 'preview', f } })}><td>${f.name}</td><td>${A.USERS[m.from].name}</td><td>${A.fmtList(m.t)}</td><td>${f.size}</td></tr>`)}</tbody></table></div></div>`;
  }
  function ConvPinned({ c }) {
    const p = c.msgs.filter((m) => m.pinned);
    if (!p.length) return html`<div className="feed"><div className="empty"><div><${I} n="pin" s="24" /><b>No pinned messages</b>Pin important messages from the message menu so everyone can find them.</div></div></div>`;
    return html`<div className="feed">${p.map((m) => html`<div className="m first" style=${{ cursor: 'pointer' }} onClick=${() => A.set({ tab: 'chat', highlight: m.id })}><div className="gut"><${A.Av} u=${m.from} pres=${false} /></div><div className="bd"><div className="who"><b>${A.USERS[m.from].name}</b><small>${A.fmtList(m.t)}</small></div><div className="tx">${A.rich(m.text)}</div></div></div>`)}</div>`;
  }

  // ---------- composer ----------
  A.drafts = {};
  const SSN = /\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]?){15,16}\b/;
  A.Composer = function Composer({ c, threadRoot }) {
    const S = A.S, key = threadRoot ? 't-' + threadRoot : c.id;
    const [v, setV] = useState(A.drafts[key] || ''); const [fmt, setFmt] = useState(false); const [files, setFiles] = useState([]);
    const [picker, setPicker] = useState(null); const [dlp, setDlp] = useState(false); const [also, setAlso] = useState(false);
    const ta = useRef();
    const reply = !threadRoot && S.replyTo && S.replyTo.conv === c.id ? S.replyTo.m : null;
    useEffect(() => { if (reply && ta.current) ta.current.focus(); }, [reply]);
    const change = (e) => { const x = e.target.value; setV(x); A.drafts[key] = x; if (!threadRoot && !A._typingTimer) { /* own typing is not echoed */ }
      const at = x.slice(0, e.target.selectionStart).match(/(^|\s)([@#])(\w*)$/); setPicker(at ? { ch: at[2], q: at[3].toLowerCase() } : null); };
    const send = (force) => {
      const text = v.trim(); if (!text && !files.length) return;
      if (!force && SSN.test(text)) { setDlp(true); return; }
      A.send(c.id, text, { files: files.length ? files : undefined, threadRoot, alsoSend: also, quote: reply ? { from: reply.from, text: reply.text } : undefined });
      setV(''); setFiles([]); setDlp(false); setPicker(null); delete A.drafts[key]; if (reply) A.set({ replyTo: null });
    };
    const insert = (txt) => { const el = ta.current; const pos = el.selectionStart; const before = v.slice(0, pos).replace(/[@#]\w*$/, ''); const nv = before + txt + ' ' + v.slice(pos); setV(nv); A.drafts[key] = nv; setPicker(null); setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = (before + txt + ' ').length; }, 0); };
    const opts = picker ? (picker.ch === '@'
      ? [...Object.keys(A.USERS).filter((u) => u !== A.ME && A.USERS[u].name.toLowerCase().includes(picker.q)).map((u) => ({ k: u, el: html`<${A.Av} u=${u} size="24" />`, t: A.USERS[u].name, s: (c.members.includes(u) ? '' : 'Not in this conversation · ') + A.USERS[u].title, ins: '@' + A.USERS[u].name })),
         ...A.GROUPS.filter((g) => g.key.includes(picker.q)).map((g) => ({ k: g.key, el: html`<${I} n="people" />`, t: '@' + g.key, s: g.label + ' · ' + g.members.length + ' people', ins: '@' + g.key }))]
      : Object.keys(A.RECORDS).filter((k) => k.toLowerCase().replace(' ', '').includes(picker.q) || A.RECORDS[k].title.toLowerCase().includes(picker.q)).map((k) => ({ k, el: html`<span className="recband" style=${{ background: A.RECKIND[A.RECORDS[k].kind].color, width: 24, height: 24 }}>${A.RECORDS[k].kind}</span>`, t: k + ' · ' + A.RECORDS[k].title, s: A.RECORDS[k].status, ins: k }))).slice(0, 7) : [];
    const addFile = () => { const pool = [{ name: 'IMG_4417-stator.jpg', size: '2.1 MB', type: 'JPG' }, { name: 'warranty-claim-48213.pdf', size: '96 KB', type: 'PDF' }, { name: 'october-parts-backorders.xlsx', size: '48 KB', type: 'XLSX' }]; setFiles([...files, pool[files.length % 3]]); };
    const voice = () => { setFiles([...files, { name: 'Voice note (0:12)', size: '0:12', type: 'M4A' }]); };
    return html`<div className="composer" style=${threadRoot ? { margin: '8px 0 0' } : null}>
      ${dlp ? html`<div className="dlp"><${I} n="shield" /><div style=${{ flex: 1 }}><b>This looks like a Social Security or card number.</b><div>Customer data in chat is visible to everyone in this conversation.</div>
        <div style=${{ display: 'flex', gap: 6, marginTop: 6 }}><button className="btn sm pri" onClick=${() => { const masked = v.replace(/\b\d{3}-\d{2}-(\d{4})\b/g, '***-**-$1').replace(/\b(?:\d[ -]?){11,12}(\d{4})\b/g, '**** **** **** $1'); setV(masked); setDlp(false); setTimeout(() => { A.send(c.id, masked.trim(), { threadRoot }); setV(''); delete A.drafts[key]; }, 0); }}>Mask and send</button><button className="btn sm" onClick=${() => send(true)}>Send anyway</button><button className="btn sm ghost" onClick=${() => setDlp(false)}>Edit</button></div></div></div>` : null}
      ${reply ? html`<div className="quote"><${I} n="reply" s="12" /><span style=${{ flex: 1 }}>Replying to <b>${A.USERS[reply.from].name.split(' ')[0]}</b>: ${reply.text}</span><button onClick=${() => A.set({ replyTo: null })} aria-label="Cancel reply"><${I} n="close" s="12" /></button></div>` : null}
      ${fmt ? html`<div className="ftools">${['B', 'I', 'S', '</>', '•', '1.', '❝', '🔗'].map((b) => html`<button className="ib" style=${{ fontWeight: b === 'B' ? 700 : 400, fontStyle: b === 'I' ? 'italic' : 'normal', fontSize: 12 }} onClick=${() => A.snack('Formatting applied')}>${b}</button>`)}</div>` : null}
      ${files.length ? html`<div className="attach">${files.map((f, i) => html`<div style=${{ position: 'relative' }}><${A.FileChip} f=${f} /><button className="ib" style=${{ position: 'absolute', right: -6, top: -6, width: 18, height: 18, background: '#fff', border: '1px solid var(--line2)', borderRadius: 9 }} onClick=${() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove file"><${I} n="close" s="12" /></button></div>`)}</div>` : null}
      <textarea id=${'compose-' + key} ref=${ta} rows="1" value=${v} onChange=${change} placeholder=${threadRoot ? 'Reply' : 'Type a message to ' + (c.kind === 'channel' ? '#' + c.name : A.convName(c))}
        onKeyDown=${(e) => { if (picker && opts.length && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); insert(opts[0].ins); return; } if (e.key === 'Escape' && picker) { setPicker(null); return; } if (e.key === 'Enter' && !e.shiftKey && S.settings.enterSends) { e.preventDefault(); send(); } if (e.key === 'ArrowUp' && !v) { const mine = [...c.msgs].reverse().find((x) => x.from === A.ME && !x.deleted); if (mine) { e.preventDefault(); A.snack('Hover your message and choose Edit'); } } }}
        onPaste=${(e) => { if (e.clipboardData && e.clipboardData.files.length) { e.preventDefault(); addFile(); } }}></textarea>
      ${picker && opts.length ? html`<div className="pop" style=${{ bottom: '100%', left: 8, marginBottom: 4, width: 340 }}><div className="ph">${picker.ch === '@' ? 'People and groups' : 'ASPEN records'}</div>${opts.map((o, i) => html`<div className=${'pi' + (i === 0 ? ' on' : '')} onMouseDown=${(e) => { e.preventDefault(); insert(o.ins); }}>${o.el}<span style=${{ flex: 1 }}>${o.t}</span><small>${o.s}</small></div>`)}</div>` : null}
      <div className="ctools">
        <button className=${'ib' + (fmt ? ' on' : '')} title="Format" onClick=${() => setFmt(!fmt)} style=${{ fontWeight: 600, fontSize: 12 }}>Aa</button>
        <button className="ib" title="Attach file" onClick=${addFile}><${I} n="attach" /></button>
        <button className="ib" title="Emoji" onClick=${(e) => { e.stopPropagation(); const b = document.querySelector('.cwin').getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); A.set({ pop: { type: 'emoji', insert: (x) => { setV(v + x); }, x: r.left - b.left, y: r.top - b.top - 150 } }); }}><${I} n="emoji" /></button>
        <button className="ib" title="Mention someone" onClick=${() => { setV(v + (v && !v.endsWith(' ') ? ' @' : '@')); setPicker({ ch: '@', q: '' }); ta.current.focus(); }}><${I} n="mention" /></button>
        <button className="ib" title="Link an ASPEN record" onClick=${() => { setV(v + (v && !v.endsWith(' ') ? ' #' : '#')); setPicker({ ch: '#', q: '' }); ta.current.focus(); }}><${I} n="record" /></button>
        <button className="ib" title="Record a voice note" onClick=${voice}><${I} n="mic" /></button>
        ${threadRoot ? html`<label className="check" style=${{ margin: '0 0 0 6px', fontSize: 12 }}><input type="checkbox" id=${'also-' + key} checked=${also} onChange=${(e) => setAlso(e.target.checked)} />Also send to ${c.kind === 'channel' ? '#' + c.name : 'chat'}</label>` : null}
        <span className="grow"></span>
        ${!threadRoot ? html`<small style=${{ color: 'var(--fg3)', marginRight: 6 }}>Shift+Enter for a new line</small>` : null}
        <button className="ib" title="Send (Enter)" style=${{ color: v.trim() || files.length ? 'var(--accent)' : undefined }} onClick=${() => send()}><${I} n="send" /></button>
      </div></div>`;
  };

  // ---------- side panels ----------
  function Panel({ c }) {
    const S = A.S, p = S.panel;
    const close = html`<button className="ib" title="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button>`;
    if (p.type === 'thread') {
      const f = A.findMsg(p.id); if (!f) return null; const m = f.m;
      return html`<div className="panel"><div className="phd"><b>Thread</b><small style=${{ color: 'var(--fg2)' }}>${c.kind === 'channel' ? '#' + c.name : A.convName(c)}</small>${close}</div>
        <div className="pbd" style=${{ padding: '8px 0' }}>
          <div className="m first"><div className="gut"><${A.Av} u=${m.from} pres=${false} /></div><div className="bd"><div className="who"><b>${A.USERS[m.from].name}</b><small>${A.fmtTime(m.t)}</small></div><div className="tx">${A.rich(m.text)}</div></div></div>
          <div className="day">${m.thread.length} ${m.thread.length === 1 ? 'reply' : 'replies'}</div>
          ${m.thread.map((r) => html`<div className="m first" key=${r.id}><div className="gut"><${A.Av} u=${r.from} pres=${false} /></div><div className="bd"><div className="who"><b>${r.from === A.ME ? 'You' : A.USERS[r.from].name}</b><small>${A.fmtTime(r.t)}</small></div><div className="tx">${A.rich(r.text)}</div></div></div>`)}
          <div style=${{ padding: '0 12px' }}><${A.Composer} key=${'t' + m.id} c=${c} threadRoot=${m.id} /></div>
        </div></div>`;
    }
    if (p.type === 'record') {
      const r = A.RECORDS[c.rec], k = A.RECKIND[r.kind];
      const tasks = A.TASKS.filter((t) => t.rec === c.rec);
      return html`<div className="panel"><div className="phd"><b>${k.label}</b>${close}</div><div className="pbd">
        <div style=${{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}><span className="recband" style=${{ background: k.color, width: 40, height: 40 }}>${r.kind}</span><div><b style=${{ fontSize: 15 }}>${c.rec}</b><div style=${{ color: 'var(--fg2)' }}>${r.title}</div></div></div>
        <span className=${'pill ' + r.tone}>${r.status}</span>
        <div className="sect">Details</div><div className="kv">${r.fields.map(([a, b]) => html`<span>${a}</span><span>${b}</span>`)}</div>
        <div className="sect">Tasks on this record</div>${tasks.length ? tasks.map((t) => html`<div style=${{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0' }}><${I} n="task" s="12" /><span style=${{ flex: 1 }}>${t.title}</span><span className=${'pill ' + (t.status === 'Done' ? 'g' : 'a')}>${t.status}</span></div>`) : html`<div style=${{ color: 'var(--fg2)' }}>No tasks yet.</div>`}
        <button className="btn sm" style=${{ marginTop: 8 }} onClick=${() => A.set({ modal: { type: 'task', c } })}><${I} n="plus" s="12" />Add task</button>
        <div className="sect">Members (${c.members.length})</div>${c.members.map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '5px 0', cursor: 'pointer' }} onClick=${(e) => A.openProfile(u, e)}><${A.Av} u=${u} size="24" /><span>${A.USERS[u].name}</span><small style=${{ color: 'var(--fg2)', marginLeft: 'auto' }}>${A.USERS[u].title}</small></div>`)}
        <button className="btn pri" style=${{ width: '100%', marginTop: 14 }} onClick=${() => { A.set({ aspenView: 'ro' }); A.snack('Opened ' + c.rec + ' in ASPEN'); }}><${I} n="ext" s="12" />Open in ASPEN</button>
      </div></div>`;
    }
    return html`<div className="panel"><div className="phd"><b>${c.kind === 'dm' ? 'Chat info' : c.kind === 'channel' ? 'Channel info' : 'Group info'}</b>${close}</div><div className="pbd">
      ${c.kind === 'dm' ? html`<div style=${{ textAlign: 'center' }}><div style=${{ display: 'inline-block' }}><${A.Av} u=${c.with} size="72" /></div><div style=${{ fontWeight: 600, fontSize: 15, marginTop: 6 }}>${A.USERS[c.with].name}</div><div style=${{ color: 'var(--fg2)' }}>${A.USERS[c.with].title} · ${A.USERS[c.with].loc}</div></div>` : html`<b style=${{ fontSize: 15 }}>${c.kind === 'channel' ? '#' : ''}${A.convName(c)}</b><div style=${{ color: 'var(--fg2)' }}>${c.topic || ''}</div>`}
      <div className="sect">Notifications</div>
      ${[['all', 'All messages'], ['mentions', 'Mentions only'], ['none', 'Nothing']].map(([k, l]) => html`<label className="check"><input type="radio" name=${'nl' + c.id} checked=${(c.notify || (c.kind === 'channel' ? 'mentions' : 'all')) === k} onChange=${() => A.set(() => { c.notify = k; c.muted = k === 'none'; })} />${l}</label>`)}
      ${c.kind !== 'dm' ? html`<div className="sect">Members (${c.members.length})</div>${c.members.map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '5px 0', cursor: 'pointer' }} onClick=${(e) => A.openProfile(u, e)}><${A.Av} u=${u} size="24" /><span>${A.USERS[u].name}${u === A.ME ? ' (you)' : ''}</span></div>`)}<button className="btn sm" style=${{ marginTop: 6 }} onClick=${() => A.set({ modal: { type: 'add', c } })}><${I} n="adduser" s="12" />Add people</button>` : null}
      <div className="sect">Shared</div><div className="link" onClick=${() => A.set({ tab: 'files' })}>Files</div><div className="link" onClick=${() => A.set({ tab: 'pinned' })}>Pinned messages</div>
      ${c.kind !== 'dm' ? html`<div className="sect"> </div><button className="btn sm" style=${{ color: 'var(--red)' }} onClick=${() => A.set({ modal: { type: 'confirm', title: 'Leave ' + A.convName(c) + '?', body: 'You will stop getting messages from this conversation. Someone will need to add you back.', ok: 'Leave', act: () => { A.set((s) => { c.members = c.members.filter((x) => x !== A.ME); A.CONVS.splice(A.CONVS.indexOf(c), 1); s.convId = null; s.panel = null; }); A.snack('You left ' + A.convName(c)); } } })}><${I} n="leave" s="12" />Leave</button>` : null}
    </div></div>`;
  }
})();
