// ASPEN look: work-order numbers for every work item (T-, A-, R-), assigned in creation order.
(function () {
  const A = window.A, html = A.html;
  const PRE = { task: 'T', approval: 'A', request: 'R' };
  let seq = 1000;
  A.WORK.slice().reverse().forEach((w) => { w.no = PRE[w.type] + '-' + (++seq); });
  const create0 = A.createWork;
  A.createWork = (f) => { const w = create0(f); A.set(() => { w.no = PRE[w.type] + '-' + (++seq); }); return w; };
  A.WNo = ({ w, big }) => w && w.no ? html`<span className=${'wno' + (big ? ' big' : '')} style=${{ '--tc': A.TYPES[w.type].color }}>${w.no}</span>` : null;
})();
