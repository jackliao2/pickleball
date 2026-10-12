// Top-down court diagrams. Court 20 × 44 ft drawn at 6px/ft, net horizontal in the middle.
// Players: [x ft, y ft from far baseline, label, team 'a'|'b', arrow to [x,y] or null].
const S = 6, W = 20 * S, H = 44 * S, PAD = 20;
function court(title, players, note) {
  const k1 = (22 - 7) * S, k2 = (22 + 7) * S, net = 22 * S;
  const dots = players.map(([x, y, label, team, to]) => {
    const cx = PAD + x * S, cy = PAD + y * S;
    const fill = team === 'a' ? '#d4e157' : '#7fb3ff';
    const arrow = to ? `<line x1="${cx}" y1="${cy}" x2="${PAD + to[0] * S}" y2="${PAD + to[1] * S}" stroke="${fill}" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#ar-${team})"/>` : '';
    return `${arrow}<circle cx="${cx}" cy="${cy}" r="9" fill="${fill}"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#0c2744">${label}</text>`;
  }).join('');
  return `<figure class="fig"><svg viewBox="0 0 ${W + PAD * 2} ${H + PAD * 2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}" font-family="Outfit, system-ui, sans-serif" style="max-width:220px">
<defs><marker id="ar-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d4e157"/></marker><marker id="ar-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7fb3ff"/></marker></defs>
<rect x="${PAD}" y="${PAD}" width="${W}" height="${H}" fill="#1d4f7a" stroke="#f4f1e8" stroke-width="1.5"/>
<rect x="${PAD}" y="${PAD + k1}" width="${W}" height="${k2 - k1}" fill="#2a6596"/>
<line x1="${PAD}" y1="${PAD + k1}" x2="${PAD + W}" y2="${PAD + k1}" stroke="#f4f1e8"/><line x1="${PAD}" y1="${PAD + k2}" x2="${PAD + W}" y2="${PAD + k2}" stroke="#f4f1e8"/>
<line x1="${PAD + W / 2}" y1="${PAD}" x2="${PAD + W / 2}" y2="${PAD + k1}" stroke="#f4f1e8"/><line x1="${PAD + W / 2}" y1="${PAD + k2}" x2="${PAD + W / 2}" y2="${PAD + H}" stroke="#f4f1e8"/>
<line x1="${PAD - 6}" y1="${PAD + net}" x2="${PAD + W + 6}" y2="${PAD + net}" stroke="#f4f1e8" stroke-width="3"/>
${dots}</svg><figcaption>${note}</figcaption></figure>`;
}
// Near team (A, yellow) at the bottom: near baseline y=44. Their right side = right of the image (x ≈ 15).
// Far team (B, blue) at the top.

export default {
  slug: 'pickleball-stacking',
  title: 'Pickleball Stacking Explained: Diagrams for Serve and Return',
  description: 'Pickleball stacking with court diagrams: why teams stack, how to stack when serving and receiving, the half stack, and how to keep track of positions.',
  ogTitle: 'Pickleball Stacking, With Diagrams',
  ogDescription: 'How to stack when serving and receiving, the half stack, and how not to get lost.',
  headline: 'Pickleball stacking explained with diagrams',
  crumb: 'Stacking',
  kicker: 'Doubles strategy',
  h1: 'Pickleball stacking, with diagrams',
  meta: 'Keep your best shot in the middle all game, legally. Updated 12 October 2026.',
  body: `
    <p class="docs-note"><strong>Quick answer:</strong> stacking means lining up so that, once the serve and return are made, each partner ends up on the side they prefer, usually so both forehands are in the middle or a left-hander and a right-hander each cover their forehand side. It is legal as long as the correct player serves from the correct side and the correct player receives. The trick is in where the non-serving or non-receiving partner stands, and how they switch after the first shot.</p>

    <p>In normal doubles, partners switch sides every time their team wins a point on serve, so half the time a player is stuck on their weaker side. Stacking fixes that. It looks confusing from the outside because players start in odd places and run across the court after the first shot, but it follows a few simple patterns. The diagrams below show your team in yellow at the bottom and the opponents in blue; dashed arrows show where players move.</p>

    <h2>Why teams stack</h2>
    <ul>
      <li><strong>Forehands in the middle.</strong> Most balls go down the middle. With a right-hander on the left and a left-hander on the right, both forehands cover it.</li>
      <li><strong>Keep the stronger player on one side.</strong> Often the player with the better forehand stays on the left so their forehand covers the middle, or the stronger player stays where most balls go.</li>
      <li><strong>Protect a weakness.</strong> If one partner has a weak backhand, keep it on the sideline where fewer balls arrive.</li>
    </ul>
    <p>The rules do not care where you are after the ball is served and returned. They only fix who serves, from which side, and who receives. That is covered in the <a href="/guides/pickleball-doubles-rules">doubles rules</a>.</p>

    <h2>Stacking when your team serves</h2>
    <p>The server must serve from the correct side for the score. In this example the server (S) belongs on the right but wants to play the left. The partner (P) stands off to the side of the server, near the right sideline or just outside the court, instead of on the left. After the serve, the server moves left and the partner stays right.</p>
    ${court('Serving stack: server on the right, partner beside them, server crosses left after the serve', [[15, 43, 'S', 'a', [5, 36]], [19.2, 42, 'P', 'a', [15, 36]], [5, 2, 'R', 'b', null], [15, 15, '', 'b', null]], 'Serving stack. The server serves from the right, then moves to the left as the partner takes the right.')}
    <p>Because the serving team stays back for the third shot anyway (the two-bounce rule), there is plenty of time for this switch. The partner just has to stay out of the server’s way and avoid standing in front of the serve.</p>

    <h2>Stacking when your team receives</h2>
    <p>This is the harder one. The receiver (R) must return from the correct side. The partner (P) stands at the kitchen line on the <em>same</em> side as the receiver, out of the way near the centre or the sideline. After the return, the receiver runs forward and across to their preferred side while the partner slides over.</p>
    ${court('Receiving stack: receiver and partner on the same side, receiver crosses after the return', [[15, 43, 'R', 'a', [5, 30]], [17.5, 30, 'P', 'a', [15, 30]], [5, 1, 'S', 'b', null], [10, 2, '', 'b', null]], 'Receiving stack. The receiver returns deep from the right, then runs to the left kitchen line while the partner shifts right.')}
    <p>The return must be deep and high enough to give the receiver time to cross. A short, fast return makes the switch a race you will lose. If the return is weak, abandon the switch and stay where you are.</p>

    <h2>The half stack</h2>
    <p>A half stack is a lighter version used by many rec teams. Instead of standing off court, the non-receiving partner stands at the kitchen line near the centre line, slightly to the receiving side. If the switch is on, they slide; if not, they are already in a normal position. It is less disruptive and easier to abandon mid-point.</p>
    ${court('Half stack: partner near the centre at the kitchen line', [[15, 43, 'R', 'a', [5, 30]], [11, 30, 'P', 'a', [15, 30]], [5, 1, 'S', 'b', null], [15, 15, '', 'b', null]], 'Half stack. The partner waits near the middle of the kitchen line, ready to slide either way.')}

    <p>You can practise the doubles patterns that make stacking worthwhile, getting to the line and owning the middle, in the free <a href="/">online pickleball game</a> here, which has a doubles mode with an AI partner.</p>
    <a class="docs-cta" href="/?mode=doubles">Play doubles with an AI partner</a>

    <h2>When you are on the “wrong” side</h2>
    <p>Stacking does not always work out. After a side out, or when the score makes your preferred server the second server, you may have to start a point in a normal formation and then switch. Good stacking teams always know two things before every point: who is serving or receiving, and whether they will switch after the first shot. If you are not sure, do not switch; an unforced position error is worse than a backhand in the middle.</p>

    <h2>How to keep track</h2>
    <ul>
      <li><strong>Even/odd rule:</strong> the player who served first for your team is on the right when your score is even and on the left when it is odd. This tells you who must serve or receive from where, regardless of where you play afterwards.</li>
      <li><strong>Call the switch:</strong> say “switch” or “stay” before every point, or use a hand signal behind your back.</li>
      <li><strong>Agree on the default:</strong> decide before the game what you do if the return is weak (usually: stay).</li>
    </ul>
`,
  faq: [
    ['Is stacking legal in pickleball?', 'Yes. Teams can position themselves anywhere as long as the correct player serves from the correct side and the correct player receives. Where partners go after the serve and return is up to them.'],
    ['What is the point of stacking in pickleball?', 'To keep each partner on their preferred side all game, usually so both forehands cover the middle, or so a stronger player stays where most balls go.'],
    ['What is a half stack in pickleball?', 'A lighter stack where the non-receiving partner waits at the kitchen line near the centre instead of off to the side, ready to slide over if the team switches, and already in position if it does not.'],
    ['How do you keep track of positions when stacking?', 'Use the even/odd rule: your team’s starting server is on the right when your score is even and on the left when it is odd, which tells you who serves or receives from where. Call “switch” or “stay” before each point.'],
  ],
  cta: '/?mode=doubles',
  next: `      <p><strong>Keep going:</strong> the <a href="/guides/pickleball-doubles-rules">doubles rules</a> and <a href="/guides/singles-vs-doubles">singles vs doubles</a>.</p>`,
};
