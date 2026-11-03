// Redesign (v2): compact "Needs me" rows and the ASPEN context chip at the top of the sidebar.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  A.S.v2 = true;

  // One line per item, a single primary quick action, details on click.
  A.NeedCard = function NeedRow({ w }) {
    const S = A.S, t = A.TYPES[w.type], on = S.panel && S.panel.id === w.id;
    const act = w.type === 'approval' ? ['Approve', () => A.decide(w, 'Approved')] : w.type === 'request' ? ['Fulfilled', () => A.decide(w, 'Fulfilled')] : ['Done', () => A.setStatus(w, 'Done')];
    const open = () => { if (w.conv && A.conv(w.conv)) A.openConv(w.conv); A.openItem(w.id); };
    return html`<div className=${'nrow' + (on ? ' on' : '') + (A.isOverdue(w) ? ' late' : '')} style=${{ '--tc': t.color }} role="button" tabIndex="0" onClick=${open} onKeyDown=${(e) => e.key === 'Enter' && open()}>
      <span className="nico"><${A.Shape} type=${w.type} size="12" /></span>
      <span className="ntext"><b>${w.title}</b><small>${A.uname(w.requester)} · ${A.isOverdue(w) ? html`<em>Overdue</em>` : 'Due ' + A.dueLabel(w).replace(/^(Today|Tomorrow|Yesterday)/, (x) => x.toLowerCase())}${w.amount ? ' · ' + w.amount : ''}</small></span>
      <button className="nact" title=${act[0] + ': ' + w.title} onClick=${(e) => { e.stopPropagation(); act[1](); }}><${I} n="check" s="12" />${act[0]}</button></div>`;
  };

  // What is open in ASPEN, as a quiet chip instead of a full-width bar.
  A.CtxChip = function CtxChip() {
    const S = A.S, k = A.aspenRecord && A.aspenRecord(); if (!k || S.mobile || S.ctxOff === k) return null;
    const r = A.RECORDS[k], c = A.conv('rec-' + k);
    return html`<div className="ctxchip"><span className="recband" style=${{ background: A.RECKIND[r.kind].color }}>${r.kind}</span>
      <span className="ctxt"><small>Open in ASPEN</small><b>${k} · ${r.title}</b></span>
      <button className="ctxbtn" title=${c ? 'Open its conversation' : 'Start a conversation about it'} onClick=${() => A.openRecordConv(k)}><${I} n="chat" s="12" /></button>
      <button className="ctxbtn" title="More" onClick=${(e) => A.popAt('v2-ctx', e, { k }, -200)}><${I} n="more" s="12" /></button></div>`;
  };
  const XPop0 = A.XPop;
  A.XPop = function XPop() {
    const p = A.S.pop; if (p.type !== 'v2-ctx') return html`<${XPop0} />`;
    const k = p.k, close = () => A.set({ pop: null });
    const item = (icon, label, fn) => html`<div className="pi" role="menuitem" tabIndex="0" onClick=${(e) => { e.stopPropagation(); close(); fn(); }}><${I} n=${icon} /><span>${label}</span></div>`;
    return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x), top: p.y, width: 240 }} onClick=${(e) => e.stopPropagation()}>
      ${item('chat', 'Open its conversation', () => A.openRecordConv(k))}${item('attach', 'Attach to my message', () => A.set((s) => { if (!s.pendingLinks.includes(k)) s.pendingLinks.push(k); }))}
      ${item('task', 'New task on ' + k, () => A.set({ modal: { type: 'task', wtype: 'task', c: { rec: k } } }))}${item('close', 'Hide for this record', () => A.set({ ctxOff: k }))}</div>`;
  };
  A.set({});
})();
