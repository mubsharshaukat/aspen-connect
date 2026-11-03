// Calls: outgoing ring, answer, in-call view, mini window, end-of-call summary.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useEffect } = React;

  A.startCall = (convId, video, huddle) => {
    const c = A.conv(convId); if (!c) return;
    if (A.S.call) { A.snack('You are already in a call'); return; }
    const people = c.members.filter((m) => m !== A.ME);
    A.set((s) => {
      s.call = { conv: convId, video: !!video, huddle: !!huddle, title: c.kind === 'channel' ? '#' + c.name : A.convName(c), with: c.kind === 'dm' ? c.with : null,
        state: huddle ? 'live' : 'ringing', start: huddle ? Date.now() : null, mute: false, cam: !!video, share: false, hand: false, rec: false, layout: 'gallery',
        joined: huddle ? people.filter((u) => A.USERS[u].pres === 'on').slice(0, 2) : [], invited: people, mini: false };
      if (huddle) c.huddle = true;
    });
    if (!huddle) {
      const callee = c.kind === 'dm' ? A.USERS[c.with] : null;
      setTimeout(() => {
        const call = A.S.call; if (!call || call.conv !== convId || call.state !== 'ringing') return;
        if (callee && (callee.pres === 'dnd' || callee.pres === 'off')) {
          A.set((s) => { s.call = null; A.CALLS.unshift({ id: A.nextId(), who: c.with, dir: 'out', kind: video ? 'Video' : 'Voice', t: Date.now(), dur: 'No answer' }); c.msgs.push({ id: A.nextId(), kind: 'sys', t: Date.now(), text: callee.name.split(' ')[0] + " didn't answer", reactions: {}, thread: [] }); });
          A.snack(callee.name.split(' ')[0] + ' is ' + A.presLabel(callee.pres).toLowerCase() + ' and didn\'t answer');
          return;
        }
        A.set((s) => { s.call.state = 'live'; s.call.start = Date.now(); s.call.joined = c.kind === 'dm' ? [c.with] : people.filter((u) => A.USERS[u].pres !== 'off').slice(0, 3); });
      }, 2600);
    }
  };
  A.answer = (t, video) => {
    A.dmWith(t.from);
    const c = A.conv('dm-' + t.from);
    A.set((s) => { s.call = { conv: c.id, video, title: A.USERS[t.from].name, with: t.from, state: 'live', start: Date.now(), mute: false, cam: video, share: false, joined: [t.from], invited: [t.from], mini: false, layout: 'gallery' }; s.connect = s.connect === 'closed' ? 'open' : s.connect; });
  };
  A.endCall = () => {
    const call = A.S.call; if (!call) return;
    const c = A.conv(call.conv); const mins = call.start ? Math.max(1, Math.round((Date.now() - call.start) / 60000)) : 0;
    A.set((s) => {
      s.call = null; c.huddle = false;
      if (call.start) {
        const who = [A.ME, ...call.joined].map((u) => A.USERS[u].name.split(' ')[0]).join(', ');
        c.msgs.push({ id: A.nextId(), kind: 'sys', t: Date.now(), text: (call.huddle ? 'Huddle' : call.video ? 'Video call' : 'Call') + ' ended · ' + mins + ' min · ' + who, reactions: {}, thread: [] });
        A.CALLS.unshift({ id: A.nextId(), who: c.kind === 'dm' ? c.with : c.id, dir: 'out', kind: call.huddle ? 'Huddle' : call.video ? 'Video' : 'Voice', t: Date.now(), dur: mins + ' min' });
      } else c.msgs.push({ id: A.nextId(), kind: 'sys', t: Date.now(), text: 'Call cancelled', reactions: {}, thread: [] });
    });
  };

  A.CallTimer = function CallTimer() {
    const [, tick] = useState(0);
    useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(i); }, []);
    const st = A.S.call && A.S.call.start; if (!st) return html`<span>Ringing…</span>`;
    const s = Math.floor((Date.now() - st) / 1000); return html`<span style=${{ fontVariantNumeric: 'tabular-nums' }}>${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}</span>`;
  };

  function Tile({ u, me, spk }) {
    const call = A.S.call, x = A.USERS[u];
    const camOn = me ? call.cam : call.video && u !== 'u4';
    const muted = me ? call.mute : u === 'u4';
    return html`<div className=${'vt' + (spk ? ' spk' : '')}>${camOn ? html`<div className="cam"></div>` : null}
      <div style=${{ position: 'relative' }}><${A.Av} u=${u} size=${camOn ? 72 : 96} pres=${false} /></div>
      ${me && call.cam && A.S.settings.blur ? html`<span style=${{ position: 'absolute', top: 8, left: 8, fontSize: 11, background: 'rgba(0,0,0,.5)', padding: '2px 6px', borderRadius: 3 }}>Background blurred</span>` : null}
      <span className="lbl">${muted ? html`<${I} n="micoff" s="12" />` : null}${me ? 'You' : x.name}${call.hand && me ? ' ✋' : ''}</span></div>`;
  }

  A.CallView = function CallView() {
    const S = A.S, call = S.call;
    const panel = call.panel || null, setPanel = (v) => A.set((s) => { s.call.panel = v; });
    const [spk, setSpk] = useState(0);
    const [q, setQ] = useState('');
    const addToCall = (u) => {
      A.snack('Ringing ' + A.USERS[u].name.split(' ')[0] + '…');
      A.set((s) => { if (!s.call.invited.includes(u)) s.call.invited.push(u); if (s.call.with) { s.call.joined.includes(s.call.with) || s.call.joined.push(s.call.with); s.call.with = null; } s.call.title = [...s.call.invited].map((x) => A.USERS[x].name.split(' ')[0]).join(', '); });
      setTimeout(() => A.set((s) => { if (s.call && !s.call.joined.includes(u)) s.call.joined.push(u); }), 2000);
      setQ('');
    };
    const others = Object.keys(A.USERS).filter((u) => u !== A.ME && !call.joined.includes(u) && !call.invited.includes(u) && (!q || A.USERS[u].name.toLowerCase().includes(q.toLowerCase())));
    useEffect(() => { const i = setInterval(() => setSpk((x) => x + 1), 2500); return () => clearInterval(i); }, []);
    const set = (k, v) => A.set((s) => { s.call[k] = v === undefined ? !s.call[k] : v; });
    if (call.state === 'ringing') {
      const u = call.with;
      return html`<div className="callv"><div className="empty" style=${{ color: '#ddd' }}><div>${u ? html`<div style=${{ display: 'inline-block' }}><${A.Av} u=${u} size="96" pres=${false} /></div>` : html`<${A.ConvAv} c=${A.conv(call.conv)} />`}
        <b style=${{ color: '#fff', fontSize: 20, marginTop: 14 }}>${call.title}</b><div>Calling…</div>
        <div className="cctl" style=${{ border: 0, marginTop: 30 }}><button className=${'cbt' + (call.mute ? ' off' : '')} onClick=${() => set('mute')}><${I} n=${call.mute ? 'micoff' : 'mic'} />${call.mute ? 'Unmute' : 'Mute'}</button><button className="cbt end" onClick=${A.endCall}><${I} n="phone" />Cancel</button></div></div></div></div>`;
    }
    const people = call.joined; const all = [A.ME, ...people];
    const speaker = people.length ? people[spk % people.length] : null;
    const cols = all.length <= 2 ? 2 : all.length <= 4 ? 2 : 3;
    return html`<div className="callv" role="dialog" aria-label="Call">
      <div className="chd"><${I} n=${call.video ? 'video' : 'phone'} /><b>${call.title}</b><span style=${{ opacity: 0.7 }}>${all.length} ${all.length === 1 ? 'person' : 'people'} · <${A.CallTimer} /></span>
        <span title="Connection quality: good" style=${{ color: '#6bb700', display: 'flex' }}><${I} n="signal" /></span>
        ${call.rec ? html`<span style=${{ background: '#c4314b', padding: '2px 8px', borderRadius: 3, fontWeight: 600, fontSize: 12 }}>● Recording</span>` : null}<span className="grow"></span>
        <button className="btn sm" style=${{ background: '#3b3a39', borderColor: '#555', color: '#fff' }} onClick=${() => set('layout', call.layout === 'gallery' ? 'speaker' : 'gallery')}><${I} n="grid" s="12" />${call.layout === 'gallery' ? 'Gallery' : 'Speaker'}</button>
        <button className="btn sm" style=${{ background: panel === 'people' ? '#605e5c' : '#3b3a39', borderColor: '#555', color: '#fff' }} onClick=${() => setPanel(panel === 'people' ? null : 'people')}><${I} n="people" s="12" />People</button>
        <button className="btn sm" style=${{ background: '#3b3a39', borderColor: '#555', color: '#fff' }} onClick=${() => A.set((s) => { s.call.mini = true; s.convId = call.conv; s.section = A.conv(call.conv).kind === 'channel' ? 'channels' : 'chat'; })}><${I} n="chat" s="12" />Chat</button>
        <button className="btn sm" title="Minimize to a small window" style=${{ background: '#3b3a39', borderColor: '#555', color: '#fff' }} onClick=${() => set('mini', true)}><${I} n="min" s="12" /></button></div>
      <div style=${{ flex: 1, display: 'flex', minHeight: 0 }}>
        ${call.share ? html`<div className="cgrid" style=${{ flex: 1, gridTemplateColumns: '1fr 220px', gridTemplateRows: 'repeat(' + Math.max(all.length, 3) + ', 1fr)' }}>
            <div className="vt" style=${{ gridRow: '1 / -1' }}><div className="share"><b style=${{ fontSize: 14 }}>Repair Order 48213 · Harlan Pruitt</b><div style=${{ marginTop: 10, display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 12px' }}><span>Unit</span><span>2021 Polaris RZR XP 1000</span><span>Complaint</span><span>Battery not charging, dash flickers</span><span>Part</span><span>4014029 Stator · Backordered</span><span>Labor</span><span>2.4 h</span></div></div><span className="lbl">You are sharing your screen</span></div>
            ${all.map((u) => html`<${Tile} u=${u} me=${u === A.ME} spk=${u === speaker} />`)}</div>`
          : call.layout === 'speaker' && speaker ? html`<div className="cgrid" style=${{ flex: 1, gridTemplateColumns: '1fr', gridTemplateRows: '1fr 120px' }}><${Tile} u=${speaker} spk=${true} /><div style=${{ display: 'flex', gap: 8 }}>${all.filter((u) => u !== speaker).map((u) => html`<div style=${{ width: 180, display: 'grid' }}><${Tile} u=${u} me=${u === A.ME} /></div>`)}</div></div>`
          : html`<div className="cgrid" style=${{ flex: 1, gridTemplateColumns: 'repeat(' + cols + ', 1fr)' }}>${all.map((u) => html`<${Tile} u=${u} me=${u === A.ME} spk=${u === speaker} />`)}</div>`}
        ${panel === 'people' ? html`<div className="cppl" style=${{ width: 260, borderLeft: '1px solid #333', padding: 12, overflow: 'auto' }}>
          <input className="cadd" placeholder="Add people to the call" aria-label="Add people to the call" value=${q} onInput=${(e) => setQ(e.target.value)} />
          ${q ? html`<div style=${{ margin: '6px 0 14px' }}>${others.length ? others.slice(0, 6).map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}><${A.Av} u=${u} size="24" pres=${false} /><span style=${{ flex: 1 }}>${A.USERS[u].name}</span><button className="btn sm" onClick=${() => addToCall(u)}>Add</button></div>`) : html`<div style=${{ fontSize: 12, opacity: 0.7 }}>No one found</div>`}</div>` : html`<div style=${{ height: 12 }}></div>`}
          <b>In this call (${all.length})</b>
          ${all.map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}><${A.Av} u=${u} size="24" pres=${false} /><span style=${{ flex: 1 }}>${u === A.ME ? 'You' : A.USERS[u].name}</span>${(u === A.ME ? call.mute : u === 'u4') ? html`<${I} n="micoff" s="12" />` : html`<${I} n="mic" s="12" />`}</div>`)}
          ${call.invited.some((u) => !people.includes(u)) ? html`<div style=${{ marginTop: 14, fontSize: 12, opacity: 0.8 }}>Not joined</div>` : null}${call.invited.filter((u) => !people.includes(u)).map((u) => html`<div style=${{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}><${A.Av} u=${u} size="24" pres=${false} /><span style=${{ flex: 1 }}>${A.USERS[u].name}</span><button className="btn sm" onClick=${() => { A.snack('Ringing ' + A.USERS[u].name.split(' ')[0] + '…'); setTimeout(() => A.set((s) => { if (s.call && !s.call.joined.includes(u)) s.call.joined.push(u); }), 2000); }}>Ring</button></div>`)}</div>` : null}
      </div>
      <div className="cctl">
        <button className=${'cbt' + (call.mute ? ' off' : '')} onClick=${() => set('mute')} title="Ctrl+Shift+M"><${I} n=${call.mute ? 'micoff' : 'mic'} />${call.mute ? 'Unmute' : 'Mute'}</button>
        
        <button className=${'cbt' + (call.share ? ' off' : '')} onClick=${() => set('share')}><${I} n="share" />${call.share ? 'Stop share' : 'Share'}</button>
        <button className=${'cbt' + (call.hand ? ' off' : '')} onClick=${() => set('hand')}><${I} n="hand" />Raise</button>
        <button className="cbt" onClick=${() => A.snack('👍 sent to everyone in the call')}><${I} n="emoji" />React</button>
        <button className="cbt" onClick=${() => setPanel('people')}><${I} n="adduser" />Add</button>
        <button className="cbt end" onClick=${A.endCall} title="Ctrl+Shift+H"><${I} n="phone" />Leave</button>
      </div></div>`;
  };

  A.MiniCall = function MiniCall() {
    const call = A.S.call;
    return html`<div className="mini"><div style=${{ height: 120, display: 'grid', placeItems: 'center', background: '#2d2d2d' }}>${call.with ? html`<${A.Av} u=${call.with} size="48" pres=${false} />` : html`<b>${call.title}</b>`}</div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: 6, padding: 8 }}><span style=${{ flex: 1, fontSize: 12 }}>${call.title} · <${A.CallTimer} /></span>
        <button className="ib" style=${{ color: '#fff' }} title=${call.mute ? 'Unmute' : 'Mute'} onClick=${() => A.set((s) => { s.call.mute = !s.call.mute; })}><${I} n=${call.mute ? 'micoff' : 'mic'} /></button>
        <button className="ib" style=${{ color: '#fff' }} title="Back to call" onClick=${() => A.set((s) => { s.call.mini = false; })}><${I} n="popout" /></button>
        <button className="ib" style=${{ color: '#fff', background: '#c4314b' }} title="Leave" onClick=${A.endCall}><${I} n="phone" /></button></div></div>`;
  };
})();
