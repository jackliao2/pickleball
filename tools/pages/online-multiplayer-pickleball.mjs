export default {
  root: true,
  slug: 'online-multiplayer-pickleball',
  title: 'Online Multiplayer Pickleball: Play a Friend Free in Your Browser',
  description: 'Play pickleball online against a friend: make a room, send the link, and play a game to 11 with real kitchen and two-bounce rules. Free, no account, phone or computer.',
  ogTitle: 'Online Pickleball, 1 vs 1 With a Friend',
  ogDescription: 'Make a room, send the link, play a game to 11. Free, no account, phone or computer.',
  headline: 'Online multiplayer pickleball: play a friend in your browser',
  crumb: 'Online multiplayer',
  kicker: 'Online',
  h1: 'Online multiplayer pickleball',
  meta: 'One versus one against a friend, wherever they are. Free, no account, nothing to install. Updated 3 November 2026.',
  body: `
    <p>You make a room, you send your friend a link, they open it, and you are playing pickleball against each other: a regulation court, a kitchen you cannot volley from, the two-bounce rule and rally scoring to 11. Nobody signs up for anything. It works on a laptop, on a phone, or one of each.</p>

    <a class="docs-cta" href="/?mode=online">Make a room</a>

    <h2>Starting a match</h2>
    <ol>
      <li>Open the game and choose <strong>Play a friend online</strong>, then <strong>Create a room</strong>.</li>
      <li>Send the link to your friend however you normally would: text, WhatsApp, Discord. If they would rather type it, the five-letter room code works too.</li>
      <li>When they open it, the match starts on both screens. You serve first.</li>
    </ol>
    <p>Keep the game in front while you play. Browsers put background tabs to sleep, so if the person who made the room switches away, the match freezes for both of you, and if they stay away for long the connection drops.</p>

    <h2>What it plays like</h2>
    <p>Each of you sees the court from your own end, so you are always the player at the bottom of the screen and your friend is across the net. Controls are the same as everywhere else in the game: WASD or the arrow keys to move and aim, tap <kbd>Space</kbd> to dink, hold it to speed-up. On a phone you drag to move and tap or hold SWING.</p>
    <p>Both players get the same all-court build, with every stat at 6, so nobody wins because they spent their points better. The match is a single game to 11, win by 2, and either of you can start a rematch from the end screen. The game calls the faults for you: a volley from the kitchen, a return taken out of the air, a serve that lands short. That saves the arguments real courts are full of.</p>

    <h2>Lag, and how to play around it</h2>
    <p>Your two browsers connect directly to each other where they can, which is the fastest route there is. Some home and mobile networks will not allow that, and then the game passes your shots through a server instead. That still works, a little slower.</p>
    <p>Distance matters more than anything. Two players in the same city will barely notice the connection. Across a continent you might feel it in quick exchanges at the net. Across an ocean you will. If it feels laggy, play the way good players play anyway: more dinks and drops, fewer speed-ups. The soft game gives both of you time, and a firefight at the kitchen line is where a tenth of a second hurts most.</p>

    <h2>What it does not do yet</h2>
    <ul>
      <li><strong>No matchmaking with strangers.</strong> You play people you send a link to.</li>
      <li><strong>No online doubles.</strong> Online is one versus one. Doubles is against the CPU, with an AI partner.</li>
      <li><strong>No chat.</strong> Most people play while already on a call or in the same group chat, so that has not been a priority.</li>
    </ul>

    <h2>Other ways to play</h2>
    <p>Sitting next to each other? <a href="/2-player-pickleball">2 player mode</a> puts you both on one keyboard with no link needed. On your own, play <a href="/?mode=singles">singles against the CPU</a>, team up with an AI partner in <a href="/?mode=doubles">doubles</a>, or start a <a href="/?mode=tournament">tournament</a> run. If your friend is new to the sport, send them the <a href="/how-to-play">how to play</a> page first. It takes five minutes and saves them losing 11–0 to the two-bounce rule.</p>
`,
  faq: [
    ['Is online pickleball free?', 'Yes. There is no download, no account and nothing to buy. You make a room, send the link, and play.'],
    ['Can I play pickleball online with a friend on a different computer?', 'Yes. Choose Play a friend online, create a room and send your friend the link. When they open it, the match starts on both screens.'],
    ['Does online play work on a phone?', 'Yes. Either player can be on a phone, a tablet or a computer. On a phone you drag to move and tap or hold the SWING button to hit.'],
    ['Can I play against random people online?', 'Not yet. There is no matchmaking; you play against someone you send a room link to.'],
    ['Can we play doubles online?', 'Not yet. Online matches are one versus one. Doubles is available against the CPU with an AI partner.'],
    ['What happens if the connection drops?', 'The match ends for both players. Make a new room and send a fresh link to play again.'],
  ],
  next: `      <p><strong>Want to practise first?</strong> A few games against the CPU on Normal are the quickest way to get the serve and the kitchen into your fingers.</p>
      <p>Or <a href="/?mode=online">make a room</a> and send the link.</p>`,
};
