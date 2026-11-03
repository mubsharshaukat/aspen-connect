// AI features: morning brief, end-of-day handoff, and plain-language questions in search.
// Each works offline with the built-in helper; with ASPEN available, the user can ask ASPEN to write it.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const { useState, useRef } = React;
  const today = () => new Date().toDateString();
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const cloudAi = () => A.sampleFn && A.S.ai && A.S.ai.engine === 'cloud';

  // ---------- morning brief ----------
  A.briefLines = () => {
    const need = A.needsMe(), ap = need.filter((w) => w.type === 'approval'), late = need.filter(A.isOverdue);
    const lines = [];
    if (need.length) lines.push({ t: need.length + ' items need you' + (ap.length ? ', ' + ap.length + ' of them approvals' : '') + (late.length ? '. ' + late[0].title + ' is overdue.' : '.'), go: () => A.openItem(late[0] ? late[0].id : need[0].id) });
    const sms = A.CONVS.map((c) => ({ c, m: [...c.msgs].reverse().find((m) => m.channel === 'sms' && m.dir === 'in') })).find((x) => x.m);
    if (sms) lines.push({ t: sms.m.cust + ' texted about ' + sms.c.rec + ': "' + sms.m.text.slice(0, 60) + '"', go: () => A.openConv(sms.c.id, sms.m.id) });
    const ro = A.RECORDS['RO 48213']; if (ro) lines.push({ t: 'RO 48213 (Pruitt) is ' + ro.status.toLowerCase() + (ro.lines && /order/i.test(ro.lines[1].status) ? '; the stator is on order, ETA Tuesday.' : '; the stator is still backordered.'), go: () => A.openRecordConv('RO 48213') });
    const men = A.CONVS.filter((c) => c.mentions); if (men.length) lines.push({ t: 'You were mentioned in ' + men.map((c) => A.convName(c)).join(', ') + '.', go: () => A.openConv(men[0].id) });
    const un = A.unreadTotals().chat; if (un) lines.push({ t: un + ' unread messages across ' + A.CONVS.filter((c) => c.unread).length + ' conversations.', go: () => A.set({ chatFilter: 'unread' }) });
    return lines;
  };
  A.BriefCard = function BriefCard() {
    const S = A.S; const [exp, setExp] = useState(false); const [open, setOpen] = useState(false); const [ai, setAi] = useState(''); const [busy, setBusy] = useState(false);
    if (S.mobile === undefined) return null;
    if (get('aspen-brief-hidden') === today() || S.briefHidden) return null;
    const lines = A.briefLines(); const h = new Date().getHours();
    const ask = async () => { setBusy(true); try { const { text } = await A.sampleFn('Write a 3-bullet morning brief for a dealership service manager from these facts. Start each bullet with "• ". Be specific and short.\n\n' + lines.map((l) => '- ' + l.t).join('\n'), { modelTier: 'quick', onText: ({ text }) => setAi(text) }); setAi(text); } catch (e) { setAi(''); } setBusy(false); };
    return html`<section className=${'brief' + (exp ? ' open' : ' shut')} aria-label="Morning brief"><div className="briefh" role="button" tabIndex="0" aria-expanded=${exp} onClick=${() => setExp(!exp)} onKeyDown=${(e) => e.key === 'Enter' && setExp(!exp)}><${A.Spark} /><b>${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, ${A.USERS[A.ME].name.split(' ')[0]}</b>${!exp ? html`<span className="briefsum">${lines.length} update${lines.length === 1 ? '' : 's'}</span>` : null}<span className="grow"></span><span className="briefchev"><${I} n="down" s="12" /></span>
      <button className="ib" title="Hide for today" aria-label="Hide brief for today" onClick=${(e) => { e.stopPropagation(); put('aspen-brief-hidden', today()); A.set({ briefHidden: true }); }}><${I} n="close" s="12" /></button></div>
      ${!exp ? null : ai ? html`<div className="briefai">${ai}</div>` : html`<ul>${lines.slice(0, open ? 5 : 2).map((l) => html`<li><button className="briefline" onClick=${l.go}>${l.t}</button></li>`)}</ul>`}
      ${exp && !ai && lines.length > 2 ? html`<button className="briefmore" aria-expanded=${open} onClick=${() => setOpen(!open)}>${open ? 'Show less' : lines.length - 2 + ' more'}</button>` : null}
      ${exp && open && cloudAi() && !ai ? html`<button className="briefmore" onClick=${ask}>${busy ? 'Writing…' : 'Ask ASPEN to write it'}</button>` : null}</section>`;
  };

  // ---------- end-of-day handoff ----------
  A.handoffText = () => {
    const recs = A.CONVS.filter((c) => c.kind === 'record');
    const parts = recs.map((c) => { const r = A.RECORDS[c.rec], open = A.workIn(c.id).filter((w) => !A.isClosed(w)); const last = [...c.msgs].reverse().find((m) => m.text);
      return c.rec + ' · ' + r.title + ' (' + r.status + ')\n' + (open.length ? open.map((w) => '- ' + w.title + ' · ' + A.uname(w.type === 'approval' ? w.approver : w.owner) + ', ' + A.statusText(w).toLowerCase()).join('\n') : '- Nothing open') + (last ? '\n- Last: ' + (A.USERS[last.from] ? A.USERS[last.from].name.split(' ')[0] : last.cust || 'ASPEN') + ' · "' + last.text.slice(0, 70) + '"' : ''); });
    return 'End-of-day handoff · ' + new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + '\n\n' + parts.join('\n\n');
  };
  function Handoff() {
    const [txt, setTxt] = useState(A.handoffText()); const [busy, setBusy] = useState(false);
    const ask = async () => { setBusy(true); try { const { text } = await A.sampleFn('Rewrite this end-of-day handoff for the next shift at a powersports dealership. Keep each record as a short heading with 1-3 bullets of what is open and who owns it. Keep "- " bullets.\n\n' + txt, { modelTier: 'quick', onText: ({ text }) => setTxt(text) }); setTxt(text); } catch (e) {} setBusy(false); };
    return html`<div className="panel" style=${{ width: 380 }}><div className="phd"><${A.Spark} /><b>End-of-day handoff</b><button className="ib" aria-label="Close" onClick=${() => A.set({ panel: null })}><${I} n="close" /></button></div><div className="pbd">
      <p style=${{ marginTop: 0, color: 'var(--fg2)', fontSize: 12.5 }}>What's still open on each record, for the next shift or tomorrow's advisor. Edit it, then post it.</p>
      <textarea id="handoff-t" className="handofft" value=${txt} onChange=${(e) => setTxt(e.target.value)} aria-label="Handoff text"></textarea>
      <div style=${{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}><button className="btn pri" onClick=${() => { A.send('team-service', txt); A.set({ panel: null }); A.openConv('team-service'); }}><${I} n="send" s="12" />Post to Service Team</button>
        <button className="btn" onClick=${() => { try { navigator.clipboard.writeText(txt); } catch (e) {} A.snack('Copied'); }}>Copy</button>
        ${cloudAi() ? html`<button className="btn sm aibtn" onClick=${ask}><${A.Spark} />${busy ? 'Writing…' : 'Polish with ASPEN'}</button>` : null}</div></div></div>`;
  }
  A.ExtraPanels = Object.assign(A.ExtraPanels || {}, { handoff: Handoff });
  A.AssistItems = (Item, c) => html`<${Item} spark=${true} label="End-of-day handoff" sub="What's open on every record, ready to post" onClick=${() => A.set({ panel: { type: 'handoff' } })} />`;

  // ---------- ask in plain language ----------
  const STOP = new Set('what who when where why how did does do is are was were any the a an about to for of on in at with did say said says latest last tell me there it this that and or from has have'.split(' '));
  A.AskCard = function AskCard({ q }) {
    const [ans, setAns] = useState(''); const [busy, setBusy] = useState(false); const last = useRef('');
    if (!/\?$/.test(q) && !/^(what|who|when|where|why|how|did|does|is|are|any)\b/i.test(q)) return null;
    const words = q.toLowerCase().replace(/[?.,]/g, '').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    const people = Object.keys(A.USERS).filter((u) => words.includes(A.USERS[u].name.split(' ')[0].toLowerCase()));
    const hits = []; A.CONVS.forEach((c) => c.msgs.forEach((m) => { if (!m.text) return; const t = m.text.toLowerCase(); const score = words.filter((w) => !people.some((u) => A.USERS[u].name.split(' ')[0].toLowerCase() === w) && t.includes(w)).length + (people.includes(m.from) ? 2 : 0); if (score > 1) hits.push({ c, m, score }); }));
    hits.sort((a, b) => b.score - a.score || b.m.t - a.m.t); const top = hits.slice(0, 3);
    if (last.current !== q) { last.current = q; if (ans) setAns(''); }
    const ask = async () => { setBusy(true); try { const { text } = await A.sampleFn('Answer the question using only these dealership chat messages. One or two sentences, name who said it and when.\n\nQuestion: ' + q + '\n\n' + top.map((h) => (A.USERS[h.m.from] ? A.USERS[h.m.from].name : h.m.cust || 'ASPEN') + ' in ' + A.convName(h.c) + ' (' + A.fmtList(h.m.t) + '): ' + h.m.text).join('\n'), { modelTier: 'quick', onText: ({ text }) => setAns(text) }); setAns(text); } catch (e) {} setBusy(false); };
    const who = (h) => (A.USERS[h.m.from] ? A.USERS[h.m.from].name.split(' ')[0] : h.m.cust || 'ASPEN');
    return html`<div className="ask"><div className="askh"><${A.Spark} /><b>ASPEN Assist</b><span>answering from your conversations</span></div>
      ${top.length ? html`<div className="askans">${ans || html`${who(top[0])} said in <b>${A.convName(top[0].c)}</b> (${A.fmtList(top[0].m.t)}): “${top[0].m.text.slice(0, 160)}”`}</div>
        <div className="asksrc">${top.map((h) => html`<button onClick=${() => A.openConv(h.c.id, h.m.id)}>${who(h)} · ${A.convName(h.c)}</button>`)}</div>
        ${cloudAi() && !ans ? html`<button className="link" style=${{ fontSize: 12 }} onClick=${ask}>${busy ? 'Thinking…' : 'Get a fuller answer from ASPEN'}</button>` : null}`
        : html`<div className="askans">I couldn't find that in your conversations. Try different words, or ask the person directly.</div>`}</div>`;
  };
  A.set({});
})();
