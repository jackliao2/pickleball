export default {
  root: true,
  slug: '2-player-pickleball',
  title: '2 Player Pickleball Game: Play Free on One Keyboard',
  description: 'Free 2 player pickleball game in your browser: one keyboard, WASD vs arrow keys, real kitchen and two-bounce rules, rally scoring to 11. No download, no login.',
  ogTitle: '2 Player Pickleball on One Keyboard',
  ogDescription: 'WASD vs arrow keys, real kitchen, two-bounce rule. Free in your browser.',
  headline: '2 player pickleball game on one keyboard',
  crumb: '2 player pickleball',
  kicker: '2 players',
  h1: '2 player pickleball on one keyboard',
  meta: 'A free local multiplayer pickleball game: two people, one keyboard, real rules. Updated 28 September 2026.',
  body: `
    <p>Most two-player sports games online are tennis, soccer heads or air hockey. This is pickleball: a regulation 20 × 44 ft court, a kitchen you cannot volley from, the two-bounce rule, and rally scoring to 11. Player 1 takes the near side with WASD, player 2 takes the far side with the arrow keys, and you play a real match against each other on the same computer.</p>

    <a class="docs-cta" href="/?mode=2p">Start a 2 player match</a>

    <h2>Controls</h2>
    <div class="table-wrap"><table class="docs-table">
      <thead><tr><th></th><th>Player 1 (near side)</th><th>Player 2 (far side)</th></tr></thead>
      <tbody>
        <tr><td>Move and aim</td><td><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></td><td><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd></td></tr>
        <tr><td>Dink (soft shot)</td><td>Tap <kbd>Space</kbd></td><td>Tap <kbd>Enter</kbd></td></tr>
        <tr><td>Speed-up (hard shot)</td><td>Hold <kbd>Space</kbd>, release</td><td>Hold <kbd>Enter</kbd>, release</td></tr>
      </tbody>
    </table></div>
    <p>Your movement also aims your shot: drift left as you swing and the ball goes left. The longer you hold the hit key, the harder the ball comes off the paddle and the more likely it is to sail long or pop up for your opponent.</p>

    <h2>Setting up the match</h2>
    <p>Before the first serve you both get a player card. Each of you splits the same 36 stat points across speed, power, angle, serve, hands and reach, or picks a preset like Banger, Touch or Athlete. That makes a 2 player match more than a reflex test: a power build against a touch build plays like a real banger-versus-dinker game, and swapping builds for the rematch is half the fun.</p>
    <figure class="shot"><img src="/img/roster.jpg" width="1386" height="1176" alt="The Build the match screen: venue chips, two player kits side by side, six stat sliders each, and a Start match button" loading="lazy" decoding="async" /><figcaption>Both players build a kit on the same screen, then one click starts the match.</figcaption></figure>

    <h2>The rules you are both playing by</h2>
    <ul>
      <li><strong>Underhand serve</strong>, diagonally, past the kitchen line.</li>
      <li><strong>Two-bounce rule:</strong> the serve must bounce and the return must bounce before anyone volleys. <a href="/guides/two-bounce-rule">Why that matters</a>.</li>
      <li><strong>The kitchen:</strong> no volleys while standing in the 7 ft non-volley zone. <a href="/guides/kitchen-rule">What counts as a fault</a>.</li>
      <li><strong>Rally scoring to 11, win by 2</strong>, so every rally scores whoever served. <a href="/guides/pickleball-scoring">How real pickleball scoring differs</a>.</li>
    </ul>

    <h2>Tips for a better 2 player game</h2>
    <ul>
      <li><strong>Sit side by side</strong> so neither player’s hands cover the other’s keys. Player 1 on the left, player 2 on the right.</li>
      <li><strong>Get to the kitchen line.</strong> Whoever reaches the net first after the return usually wins the point. The <a href="/guides/third-shot-drop">third-shot drop</a> is how the serving side gets there.</li>
      <li><strong>Dink when you are stuck.</strong> A tapped dink that lands in the kitchen cannot be attacked. Holding the key for a speed-up on a low ball is the most common way to lose a 2 player rally.</li>
      <li><strong>Play to 11, then switch builds.</strong> The loser picks both kits for the next game.</li>
    </ul>

    <h2>Other ways to play</h2>
    <p>No second person? Play <a href="/?mode=singles">singles against the CPU</a> on easy, normal or hard, or <a href="/?mode=doubles">doubles with an AI partner</a>. For a longer run, the <a href="/?mode=tournament">tournament</a> takes one player from a club qualifier to a championship final.</p>
`,
  faq: [
    ['Is this 2 player pickleball game free?', 'Yes. It runs in any modern browser with no download, no account and no purchase.'],
    ['Can we play 2 player pickleball online from different computers?', 'Not yet. 2 player mode is local: both players share one keyboard on the same computer. Online multiplayer is not available.'],
    ['Does 2 player mode work on a phone or tablet?', 'The 2 player mode needs a keyboard, because each player has their own set of keys. On a phone you can play singles or doubles against the CPU with touch controls.'],
    ['Can we play doubles with two people?', 'Not in the current version. 2 player mode is one versus one. Doubles is you and an AI partner against two CPU players.'],
    ['Which keys does player 2 use?', 'The arrow keys to move and aim, and Enter to hit: tap Enter for a soft dink, hold and release it for a hard speed-up.'],
  ],
  next: `      <p><strong>New to the rules?</strong> The <a href="/how-to-play">how to play</a> page covers the court, the serve and the controls in five minutes.</p>
      <p>Or <a href="/?mode=2p">start a 2 player match</a> now.</p>`,
};
