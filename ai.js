// Smart tasks (off in this build).
// and falls back to a local parser so every AI feature still works offline or when declined.
(function () {
  const A = window.A;
  A.S.ai = { engine: 'checking', busy: {} };
  A.S.ai.engine = 'local';
  const useASPEN = () => !!A.sampleFn && A.S.ai.engine === 'cloud';
  const giveUp = (e) => { if (e && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e.code)) A.set((st) => { st.ai.engine = 'local'; }); };
  A.aiBusy = (k, v) => A.set((st) => { if (v) st.ai.busy[k] = true; else delete st.ai.busy[k]; });

  // ---------- context for prompts ----------
  const people = () => Object.keys(A.USERS).map((u) => u + ': ' + A.USERS[u].name + ' (' + A.USERS[u].title + ')').join('\n');
  const records = () => Object.keys(A.RECORDS).map((k) => k + ': ' + A.RECORDS[k].title + ' (' + A.RECORDS[k].status + ')').join('\n');
  const nowTxt = () => new Date().toString().slice(0, 24);
  const convText = (c, n) => c.msgs.filter((m) => m.text && A.USERS[m.from]).slice(-(n || 25)).map((m) => '[' + m.id + '] ' + A.USERS[m.from].name + ' (' + A.fmtDay(m.t) + ' ' + A.fmtTime(m.t) + '): ' + m.text).join('\n');
  const SHAPE = 'Each item: {"type":"task"|"approval"|"request","title":string (short imperative, max 70 chars),"owner":user id (who must do it, or the approver for approvals),"due":ISO date-time or null,"priority":"Low"|"Normal"|"High","rec":record key from the list or null,"amount":string or null,"why":string (one short sentence),"msgId":message id it came from or null}';
  const clean = (x) => {
    if (!x || typeof x !== 'object') return null;
    const type = ['task', 'approval', 'request'].includes(x.type) ? x.type : 'task';
    const owner = A.USERS[x.owner] ? x.owner : A.ME;
    let due = x.due ? Date.parse(x.due) : NaN; if (isNaN(due)) due = A.defaultDue();
    return { type, title: String(x.title || '').slice(0, 90) || 'Follow up', owner, due, priority: ['Low', 'Normal', 'High'].includes(x.priority) ? x.priority : 'Normal', rec: A.RECORDS[x.rec] ? x.rec : null, amount: x.amount || null, why: String(x.why || ''), msgId: x.msgId || null };
  };

  // ---------- local parser (fallback and instant hints) ----------
  A.defaultDue = () => { const d = new Date(); d.setHours(17, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); return d.getTime(); };
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  A.localParse = (raw, ctx) => {
    ctx = ctx || {}; let t = ' ' + raw + ' '; const lo = t.toLowerCase();
    // owner
    let owner = null;
    Object.keys(A.USERS).forEach((u) => { const first = A.USERS[u].name.split(' ')[0].toLowerCase(); if (!owner && u !== A.ME && new RegExp('(@|\\b)' + first + '\\b').test(lo)) owner = u; });
    if (!owner && /\b(me|i will|i'll|remind me)\b/.test(lo)) owner = A.ME;
    if (!owner) owner = ctx.defaultOwner || A.ME;
    // due
    const d = new Date(); let set = false; let hour = null;
    const hm = lo.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/); if (hm) { hour = (+hm[1] % 12) + (hm[3] === 'pm' ? 12 : 0); d.setHours(hour, +(hm[2] || 0), 0, 0); set = true; }
    if (/\bnoon\b/.test(lo)) { d.setHours(12, 0, 0, 0); hour = 12; set = true; }
    if (/\b(eod|end of day|tonight)\b/.test(lo)) { d.setHours(17, 0, 0, 0); hour = 17; set = true; }
    if (/\btomorrow\b/.test(lo)) { d.setDate(d.getDate() + 1); if (hour === null) d.setHours(12, 0, 0, 0); set = true; }
    const wd = DAYS.findIndex((x) => lo.includes(x)); if (wd >= 0) { let add = (wd - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + add); if (hour === null) d.setHours(17, 0, 0, 0); set = true; }
    const inN = lo.match(/\bin (\d+) (hour|hours|day|days)\b/); if (inN) { if (inN[2].startsWith('hour')) d.setTime(Date.now() + inN[1] * 3600000); else { d.setDate(d.getDate() + +inN[1]); d.setHours(17, 0, 0, 0); } set = true; }
    if (/\b(asap|right away|now)\b/.test(lo) && !set) { d.setTime(Date.now() + 2 * 3600000); set = true; }
    let due = set ? d.getTime() : A.defaultDue(); if (due < Date.now() - 60000 && set && !/\b(today|eod)\b/.test(lo)) due += 86400000;
    // priority
    const priority = /\b(urgent|asap|high priority|critical|right away)\b/.test(lo) ? 'High' : /\b(low priority|whenever|no rush)\b/.test(lo) ? 'Low' : 'Normal';
    // type and amount
    const amt = raw.match(/\$\s?[\d,]+(?:\.\d{2})?/); const amount = amt ? amt[0].replace(/\s/, '') : null;
    let type = /\b(approve|approval|sign off|sign-off|ok the|okay the|authorize)\b/.test(lo) ? 'approval' : /\b(transfer|send me|request|can we get|need .* from|send .* from)\b/.test(lo) ? 'request' : 'task';
    if (ctx.type) type = ctx.type;
    // record
    const recs = A.recordsIn(raw); const rec = recs[0] || ctx.rec || null;
    // title: strip the people and timing words, keep the action
    let title = raw.replace(/@[A-Z][a-z]+(\s[A-Z][a-z]+)?[,:]?\s*/g, '').replace(/\b(before|by|until)\s+\d{1,2}(:\d{2})?\b(?!\s*(am|pm))/gi, '').replace(/^\s*(please|pls|can you|could you|ask|tell|remind)\s+/i, '').replace(/^(can you|could you|please)\s+/i, '').replace(/^@?[A-Z][a-z]+(\s[A-Z][a-z]+)?\s+(to\s+)?/, (m) => (owner !== A.ME && m.toLowerCase().includes(A.USERS[owner].name.split(' ')[0].toLowerCase()) ? '' : m))
      .replace(/^(me\s+)?to\s+/i, '').replace(/\s+so (that )?(i|we|you) .*$/i, '').replace(/\b(by|before|on|at)?\s*(today|tomorrow|tonight|noon|eod|end of day|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(:\d{2})?\s*(am|pm))\b/gi, '')
      .replace(/\b(urgent|asap|high priority|low priority|please|thanks|thank you)\b/gi, '').replace(/[,.!?]+\s*$/, '').replace(/\s{2,}/g, ' ').trim();
    if (type === 'approval' && !/^approve/i.test(title)) title = 'Approve ' + title.replace(/^(can you |could you )?(approve|ok|okay|sign off on|sign off)\s*(the\s+)?/i, '').replace(/^(the|a)\s+/i, '');
    title = title.replace(/^(make sure|ensure)\s+(that\s+)?(someone|somebody|you)?\s*/i, '').split(/\s*[?!]\s+|\.\s+/)[0].replace(/\s+[?.!]$/, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (title.length > 80) title = title.slice(0, 78) + '…';
    const bits = []; if (owner) bits.push((type === 'approval' ? 'approver ' : 'owner ') + A.USERS[owner].name.split(' ')[0]); if (set) bits.push('due ' + A.dueLabel({ due })); if (priority !== 'Normal') bits.push(priority.toLowerCase() + ' priority'); if (rec) bits.push(rec);
    return { type, title: title || raw.trim(), owner, due, priority, rec, amount, why: 'Picked up ' + (bits.join(', ') || 'the action') + ' from your words.' };
  };
  const CUE = /\b(can you|could you|please|need to|needs to|approve|sign off|ok the|follow up|remind|make sure|don't forget)\b/i;
  A.looksLikeTask = (m) => !!(m && m.text && A.USERS[m.from] && m.from !== A.ME && !m.deleted && !(m.thread && m.thread.length) && CUE.test(m.text) && !A.WORK.some((w) => w.fromMsgId === m.id) && m.text.length > 12);

  // ---------- 1. Type it naturally → structured work item ----------
  A.aiParse = async (text, ctx) => {
    ctx = ctx || {};
    if (useASPEN()) {
      try {
        const out = await A.sampleFn.json('You turn a dealership employee\'s note into ONE work item for ASPEN DMS. Reply with only a JSON object. ' + SHAPE + '\nRules: type "approval" when someone must approve/OK money or a decision; "request" when asking another team for something; else "task". Resolve relative dates against now: ' + nowTxt() + '. The current user is ' + A.ME + '. ' + (ctx.type ? 'The user chose type "' + ctx.type + '". ' : '') + (ctx.defaultOwner ? 'If no person is named, owner is ' + ctx.defaultOwner + '. ' : '') + '\nPeople:\n' + people() + '\nASPEN records:\n' + records() + '\n\nNote: ' + text, { modelTier: 'quick' });
        const c = clean(out); if (c) { if (ctx.type) c.type = ctx.type; return Object.assign(c, { engine: 'cloud' }); }
      } catch (e) { giveUp(e); }
    }
    return Object.assign(A.localParse(text, ctx), { engine: 'local' });
  };

  // ---------- 2. Find tasks hiding in a conversation ----------
  A.aiFindTasks = async (c) => {
    const open = A.workIn(c.id).map((w) => w.title).join('; ') || 'none';
    if (useASPEN()) {
      try {
        const out = await A.sampleFn.json('Read this ASPEN DMS conversation and list the action items that are NOT already tracked. Reply with only a JSON array (0-5 items). ' + SHAPE + '\nAlready tracked: ' + open + '\nNow: ' + nowTxt() + '. Current user: ' + A.ME + '.\nPeople:\n' + people() + '\nASPEN records:\n' + records() + '\n\nConversation "' + A.convName(c) + '":\n' + convText(c, 30), { modelTier: 'default' });
        if (Array.isArray(out)) return out.map(clean).filter(Boolean).map((x) => Object.assign(x, { engine: 'cloud', id: A.nextId() }));
      } catch (e) { giveUp(e); }
    }
    await new Promise((r) => setTimeout(r, 700));
    return c.msgs.filter(A.looksLikeTask).slice(-5).map((m) => {
      const p = A.localParse(m.text, { defaultOwner: A.ME, rec: c.rec });
      return Object.assign(p, { id: A.nextId(), msgId: m.id, why: A.USERS[m.from].name.split(' ')[0] + ' asked this at ' + A.fmtTime(m.t) + '. ' + p.why, engine: 'local' });
    });
  };

  // ---------- 3. Catch me up ----------
  A.aiSummary = async (c, onText, signal) => {
    if (useASPEN()) {
      try {
        const work = A.workIn(c.id).map((w) => A.TYPES[w.type].label + ': ' + w.title + ' — ' + A.statusText(w) + ', ' + A.uname(w.type === 'approval' ? w.approver : w.owner)).join('\n') || 'none';
        const { text } = await A.sampleFn('Catch a busy dealership manager up on this ASPEN conversation. Write 3-5 short bullet lines starting with "• ": what happened, what is decided, what is still open, and anything waiting on the reader (' + A.USERS[A.ME].name + '). Plain text, no headings.\n\nWork items:\n' + work + '\n\nConversation "' + A.convName(c) + '":\n' + convText(c, 40), { modelTier: 'quick', onText: ({ text: t }) => onText(t), signal });
        return text;
      } catch (e) { if (e.code === 'cancelled') return ''; giveUp(e); }
    }
    const msgs = c.msgs.filter((m) => m.text && A.USERS[m.from]); const open = A.workIn(c.id).filter((w) => !A.isClosed(w));
    const lines = [];
    if (msgs.length) lines.push('• ' + msgs.length + ' messages, most recently ' + A.USERS[msgs[msgs.length - 1].from].name.split(' ')[0] + ': "' + msgs[msgs.length - 1].text.slice(0, 80) + '"');
    open.forEach((w) => lines.push('• Open ' + A.TYPES[w.type].label.toLowerCase() + ': ' + w.title + ' (' + A.statusText(w) + ', ' + A.uname(w.type === 'approval' ? w.approver : w.owner) + ')'));
    const mine = open.filter(A.mine); if (mine.length) lines.push('• Waiting on you: ' + mine.map((w) => w.title).join('; '));
    const cand = msgs.filter(A.looksLikeTask).length; if (cand) lines.push('• ' + cand + ' message' + (cand > 1 ? 's look' : ' looks') + ' like untracked work. Use Find tasks to review.');
    const out = lines.join('\n') || '• Nothing new here.';
    let i = 0; await new Promise((res) => { const tick = () => { i = Math.min(out.length, i + 14); onText(out.slice(0, i)); if (i < out.length) setTimeout(tick, 16); else res(); }; tick(); });
    return out;
  };

  // ---------- 4. Plan my day ----------
  A.aiPlanDay = async (items) => {
    const list = items.map((w) => ({ id: w.id, type: w.type, title: w.title, due: new Date(w.due).toISOString(), overdue: A.isOverdue(w), priority: w.priority, requester: A.uname(w.requester), amount: w.amount || null }));
    if (useASPEN() && list.length) {
      try {
        const out = await A.sampleFn.json('Order this dealership manager\'s open work for today, most important first. Consider overdue items, approvals that block other people, customer impact and money. Reply with only a JSON array of {"id": string, "reason": string (max 12 words)} covering every id once.\nNow: ' + nowTxt() + '\nItems: ' + JSON.stringify(list), { modelTier: 'quick' });
        if (Array.isArray(out)) { const seen = new Set(); const res = out.filter((x) => x && items.some((w) => w.id === x.id) && !seen.has(x.id) && seen.add(x.id)).map((x) => ({ id: x.id, reason: String(x.reason || '') })); items.forEach((w) => { if (!seen.has(w.id)) res.push({ id: w.id, reason: '' }); }); return { order: res, engine: 'cloud' }; }
      } catch (e) { giveUp(e); }
    }
    await new Promise((r) => setTimeout(r, 500));
    const score = (w) => (A.isOverdue(w) ? 100 : 0) + (w.type === 'approval' ? 40 : 0) + (w.priority === 'High' ? 30 : w.priority === 'Low' ? -10 : 0) + (w.rec && /^RO|^DEAL/.test(w.rec) ? 15 : 0) - (w.due - Date.now()) / 3600000;
    const reason = (w) => A.isOverdue(w) ? (w.type === 'approval' ? 'Overdue and ' + A.uname(w.requester).split(' ')[0] + ' is waiting on you' : 'Overdue since ' + A.dueLabel(w).replace(/^(Today|Tomorrow|Yesterday)/, (x) => x.toLowerCase())) : w.type === 'approval' ? 'Blocks ' + A.uname(w.requester).split(' ')[0] + ' until you decide' : w.priority === 'High' ? 'High priority, due ' + A.dueLabel(w).replace(/^(Today|Tomorrow|Yesterday)/, (x) => x.toLowerCase()) : 'Due ' + A.dueLabel(w).replace(/^(Today|Tomorrow|Yesterday)/, (x) => x.toLowerCase());
    return { order: items.slice().sort((a, b) => score(b) - score(a)).map((w) => ({ id: w.id, reason: reason(w) })), engine: 'local' };
  };
})();
