// ASPEN documents and reports in chat: shared records show as cards; click the number to open it.
(function () {
  const A = window.A, html = A.html, I = A.Icon;

  // The printable document behind a record: invoices, ROs, quotes… as PDF; reports in their own format.
  A.docOf = (k) => {
    const r = A.RECORDS[k], kk = A.RECKIND[r.kind], f = (r.fields || []).find((x) => x[0] === 'Format');
    const ext = r.kind === 'RPT' && f && f[1] === 'Excel' ? 'xlsx' : 'pdf';
    return { ext, size: ext === 'xlsx' ? '184 KB' : '96 KB', name: (r.kind === 'RPT' ? r.title : kk.label + ' ' + r.id + ' - ' + r.title) + '.' + ext };
  };

  A.AspenCard = function AspenCard({ k }) {
    const r = A.RECORDS[k]; if (!r) return null;
    const kk = A.RECKIND[r.kind], rpt = r.kind === 'RPT';
    return html`<div className="acard">
      <div className="ach"><span className="rbk" style=${{ background: kk.color }}>${r.kind}</span>
        <div className="act"><button className="acn" title=${rpt ? 'Open report' : 'Open ' + k + (A.S.mobile ? '' : ' in ASPEN')} onClick=${() => A.openLink(k)}>${rpt ? r.title : kk.label + ' ' + r.id}</button><small>${rpt ? 'ASPEN report' : r.title}</small></div><span className=${'pill ' + r.tone}>${r.status}</span></div>
      ${r.fields && r.fields.length ? html`<div className="acf">${r.fields.slice(0, 3).map(([a, b]) => html`<span key=${a}><small>${a}</small>${b}</span>`)}</div>` : null}</div>`;
  };

  // AI is off for now: no Assist, morning brief, answers, suggested work or "looks like a task" hints.
  Object.assign(A, { BriefCard: null, AskCard: null, AssistItems: null, SuggestTray: () => null, looksLikeTask: () => false });

  // Demo: Priya shares this week's report and a past-due invoice in the Parts Team chat.
  const c = A.CONVS.find((x) => A.convName(x) === 'Parts Team');
  if (c && !c.msgs.some((m) => m.aspenDemo)) c.msgs.push({ id: A.nextId(), aspenDemo: true, from: 'u8', t: Date.now() - 6 * 60e3, text: 'Weekly parts aging is out. Also Ridgeline is past due on this invoice, can someone call them before we order more for their WO?', links: ['RPT Parts Aging', 'INV 221017'], reactions: {}, thread: [] });
})();
