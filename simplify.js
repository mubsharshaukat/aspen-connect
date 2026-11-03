// Simpler surface, same features: the less-used actions live in these menus.
(function () {
  const A = window.A, html = A.html, I = A.Icon;
  const close = () => A.set({ pop: null });
  const Item = ({ icon, shape, spark, label, sub, onClick, danger }) => html`<div className="pi" role="menuitem" tabIndex="0" style=${danger ? { color: 'var(--red)' } : null}
    onClick=${(e) => { e.stopPropagation(); close(); onClick(); }} onKeyDown=${(e) => { if (e.key === 'Enter') { close(); onClick(); } }}>
    ${shape ? html`<${A.Shape} type=${shape} />` : spark ? html`<${A.Spark} />` : html`<${I} n=${icon} />`}<span style=${{ flex: 1 }}>${label}${sub ? html`<small style=${{ display: 'block', color: 'var(--fg2)', whiteSpace: 'normal' }}>${sub}</small>` : null}</span></div>`;

  A.XPop = function XPop() {
    const p = A.S.pop, S = A.S; let body = null; let width = 250;
    if (p.type === 'x-new') { width = 290; body = html`
      <${Item} icon="chat" label="Message" sub="Chat with a person or a group" onClick=${() => A.set({ modal: { type: 'newchat' } })} />
      <${Item} shape="task" label="Task" sub="Something someone needs to do" onClick=${() => A.newTask()} />
`; }
    if (p.type === 'x-call') { const c = p.c; width = 200; body = html`
      <${Item} icon="phone" label=${c.kind === 'team' ? 'Start a team call' : 'Voice call'} onClick=${() => A.startCall(c.id, false, c.kind === 'team')} />`; }
    if (p.type === 'x-assist') { const c = p.c; width = 300; body = html`
      <div className="ph">ASPEN Assist${S.ai.engine === 'cloud' ? ' · ASPEN' : S.ai.engine === 'local' ? ' · built-in' : ''}</div>
      <${Item} spark=${true} label="Brief me" sub="What happened here and what is waiting on you" onClick=${() => A.set({ panel: { type: 'summary', conv: c.id, key: A.nextId() } })} />
      ${A.AssistItems ? A.AssistItems(Item, c) : null}
      <${Item} spark=${true} label="Find tasks" sub="Suggest work nobody has tracked yet" onClick=${() => A.findTasks(c)} />
      <${Item} spark=${true} label="Write a task in my words" sub=${'e.g. "ask Dana to call Harlan tomorrow 3pm"'} onClick=${() => { const el = document.getElementById('c3-' + c.id); if (el) el.focus(); A.snack('Type what needs doing, then click ✨ Make it a task'); }} />`; }
    if (p.type === 'x-msg') { const m = p.m, c = p.c; width = 240; body = html`
      <div style=${{ display: 'flex', gap: 2, padding: '4px 8px' }}>${['👍', '✅', '👀', '😂', '🙏'].map((e) => html`<button className="ib" style=${{ fontSize: 16 }} title=${'React ' + e} onClick=${(ev) => { ev.stopPropagation(); close(); A.react(m.id, e); }}>${e}</button>`)}</div><hr />
      <${Item} shape="approval" label="Ask for approval" onClick=${() => A.set({ draftWork: { conv: c.id, type: 'approval', m } })} />
      <${Item} shape="request" label="Make it a request" onClick=${() => A.set({ draftWork: { conv: c.id, type: 'request', m } })} />
      ${A.MsgMenuItems ? A.MsgMenuItems(Item, m, c) : null}
      <${Item} icon="clock" label="Remind me in 1 hour" onClick=${() => A.remindMe && A.remindMe(m, c, 60)} />
      <${Item} icon="clock" label="Remind me tomorrow morning" onClick=${() => A.remindMe && A.remindMe(m, c, 960)} />
      <${Item} icon="more" label="Copy, forward, edit, delete…" onClick=${() => setTimeout(() => A.set({ pop: { type: 's-msg', m, c, x: p.x, y: p.y } }), 0)} />`; }
    if (p.type === 'x-gear') { width = 280; body = html`
      <div className="ph">Appearance</div>${A.ThemeSeg ? html`<${A.ThemeSeg} />` : null}
      <${Item} icon="grid" label=${S.phonePreview ? 'Exit phone preview' : 'Preview on phone'} sub=${S.phonePreview ? 'Back to the desktop layout' : 'See the mobile layout in a phone frame'} onClick=${() => A.setPhonePreview && A.setPhonePreview(!S.phonePreview)} /><hr />
      <${Item} icon="settings" label="Settings" onClick=${() => A.go('settings')} />
      ${A.GearItems ? A.GearItems(Item) : null}
      ${S.perms.manageWork ? html`<${Item} icon="grid" label="Work Console" sub="All work across the dealership" onClick=${() => A.go('console')} />` : null}
      ${A.ME === 'u1' ? html`<${Item} icon="admin" label="Messaging administration" onClick=${() => A.go('admin')} />` : null}
      <${Item} icon="help" label="Take the quick tour" onClick=${() => A.set({ tour: 0 })} />
      <${Item} icon="help" label="Keyboard shortcuts" onClick=${() => A.set({ modal: { type: 'keys' } })} />
<hr />
      <div className="ph">Prototype: try permissions</div>
      <${Item} icon="lock" label=${(S.perms.send ? 'Remove' : 'Give back') + ' Send Message permission'} onClick=${() => A.set((s) => { s.perms.send = !s.perms.send; })} />
      <${Item} icon="megaphone" label=${(S.perms.broadcast ? 'Remove' : 'Give back') + ' Broadcast permission'} onClick=${() => A.set((s) => { s.perms.broadcast = !s.perms.broadcast; })} />`; }
    if (p.type === 'x-demo') { width = 320; body = html`
      <div className="ph">Prototype scenarios</div>
      <${Item} icon="chat" label="Sam sends you a message" sub="Shows the unread badge and toast" onClick=${A.demoMessage} />
      <${Item} icon="mention" label="Someone @mentions you" sub="In the Service Team chat" onClick=${A.demoMention} />
      <${Item} icon="phone" label="Kim calls you" sub="Incoming call with Accept and Decline" onClick=${A.demoCall} />
      <${Item} shape="approval" label="A new approval arrives" sub="Lands in ASPEN System and Activity" onClick=${A.demoApproval} />
      <${Item} shape="task" label="Dana assigns you a task" sub="Shows in Activity and the conversation" onClick=${() => A.demoTaskForMe()} />
      <${Item} icon="megaphone" label="Urgent announcement" sub="Banner until you click Got it" onClick=${A.demoUrgent} />
      <${Item} icon="signal" label="Lose the connection for 8 seconds" sub="Send while offline; it goes out when you're back" onClick=${() => A.goOffline && A.goOffline(8)} />
      <hr /><${Item} icon="min" label="Windows alert while Messaging is closed" sub="Closes this window, then shows the combined new messages and tasks alert" onClick=${() => { A.set({ connect: 'closed' }); setTimeout(() => { A.demoMessage(); A.demoTaskForMe(); }, 400); }} />`; }
    return html`<div className="pop" role="menu" style=${{ left: Math.max(8, p.x), top: Math.max(8, p.y), width }} onClick=${(e) => e.stopPropagation()}>${body}</div>`;
  };
  A.set({});
})();
