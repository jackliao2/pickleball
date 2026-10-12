// Numbers from tools/sim/rally-sim.mjs (40,000 rallies) and a 200,000-game Monte Carlo on top.
const bars = (rows) => `<div class="chart-bars">${rows.map(([label, v]) => `<div class="row"><span>${label}</span><div class="bar"><span style="width:${v}%"></span></div><span class="val">${v.toFixed(1)}%</span></div>`).join('')}</div>`;

export default {
  slug: 'pickleball-simulation-stats',
  title: 'We Simulated 40,000 Pickleball Rallies: What the Data Says',
  description: 'We ran 40,000 AI pickleball rallies: does serving first help, does 0-0-2 make doubles fair, how much shorter is rally scoring, is the third-shot drop worth it?',
  ogTitle: '40,000 Simulated Pickleball Rallies',
  ogDescription: 'Serving advantage, the 0-0-2 rule, rally scoring, and drop vs drive, measured.',
  headline: 'We simulated 40,000 pickleball rallies. Here is what the data says',
  crumb: 'Simulation stats',
  kicker: 'Data',
  h1: 'We simulated 40,000 pickleball rallies',
  meta: 'Serving advantage, the 0–0–2 rule, rally scoring and the third shot, measured with our game engine. Published 12 October 2026.',
  body: `
    <p class="docs-note"><strong>The short version:</strong> in our simulation the serving side won 53% of rallies, close to a coin flip. That small edge means whoever serves first in singles wins about 54% of games, but the <strong>0–0–2 start in doubles cancels it exactly</strong>: the first serving team won 50.0% of 200,000 simulated doubles games. Rally scoring finished games in about 43% fewer rallies. And a driven third shot beat the drop against weaker defenders, but the advantage disappeared against strong ones.</p>

    <h2>How we did it</h2>
    <p>VS Pickleball is a browser pickleball game with a physics model, a regulation court, and computer opponents that follow the real rules, including the serve, the two-bounce rule and the kitchen. For this experiment we made both sides computer players and ran the engine headless, without drawing anything, as fast as it would go.</p>
    <ul>
      <li><strong>40,000 rallies</strong>: 20,000 at our normal difficulty, and 10,000 each at easy and hard, where both players use that level’s reach, reactions and error rates.</li>
      <li>The serving side and the serving box were <strong>randomised every rally</strong>, so neither end of the court or side of the court could bias the result.</li>
      <li>On half of all rallies we <strong>forced the serving side’s third shot to be a drive</strong> instead of the soft drop or dink the AI normally plays, to compare the two directly.</li>
      <li>We then took the measured chance of the serving side winning a rally and played out <strong>200,000 complete games</strong> under each scoring system.</li>
    </ul>
    <p><strong>An honest caveat:</strong> these are our game’s AI players, not humans. The engine simplifies a lot: no spin, no fatigue, no nerves. Treat the numbers as what happens when the rules are applied to evenly matched, consistent players, not as a prediction for your Saturday game. If you want the raw numbers or the simulation script, <a href="/contact">ask us</a>.</p>

    <h2>1. Is serving an advantage?</h2>
    <p>Barely. At normal difficulty the serving side won <strong>53.0%</strong> of rallies (±0.7%). At hard it was 51.8%; at easy, where returns are weaker, it rose to 59.2%.</p>
    ${bars([['Easy', 59.2], ['Normal', 53.0], ['Hard', 51.8]])}
    <p>The two-bounce rule is the reason the edge is so small. In tennis the server can attack from the first shot; in pickleball the serve has to bounce and so does the return, which gives the receiving side time to reach the kitchen line first. Coaches often say serving in pickleball is a mild disadvantage among good players; our evenly matched AI lands close to neutral, and the better the players, the closer to 50% it gets.</p>

    <h2>2. Does 0–0–2 make doubles fair?</h2>
    <p>This was the most striking result. Using the 53% rally edge, we simulated 200,000 games for each format:</p>
    <div class="table-wrap"><table class="docs-table">
      <thead><tr><th>Format</th><th>Team serving first wins the game</th></tr></thead>
      <tbody>
        <tr><td>Singles, side-out scoring</td><td>53.6%</td></tr>
        <tr><td>Doubles, side-out scoring with the 0–0–2 start</td><td><strong>50.0%</strong></td></tr>
        <tr><td>Rally scoring</td><td>50.5%</td></tr>
      </tbody>
    </table></div>
    <p>In singles, serving first is worth about three and a half percentage points over a whole game. In doubles, the rule that the first team gets only one server, which is why the game starts at <a href="/guides/pickleball-scoring">0–0–2</a>, removes that edge almost exactly. The rule that confuses every beginner turns out to do precisely what it was designed to do.</p>

    <h2>3. How much shorter is rally scoring?</h2>
    <p>In side-out scoring, a rally won by the receiving side scores nothing; it only wins the serve. In rally scoring every rally scores. Over 200,000 simulated games to 11:</p>
    ${bars([['Side-out', 100], ['Rally scoring', 56.7]])}
    <p>A side-out game took an average of <strong>32.8 rallies</strong>; a rally-scoring game took <strong>18.6</strong>, about 43% fewer. That is why leagues and pro events that need predictable schedules have experimented with rally scoring, often playing to a higher number like 15 or 21 to keep games a sensible length.</p>

    <h2>4. Third-shot drop or drive?</h2>
    <p>The <a href="/guides/third-shot-drop">third-shot drop</a> is the most taught shot in pickleball: a soft ball into the kitchen that lets the serving team move up. The alternative is to drive it hard. Here is how often the serving side won the rally after each choice:</p>
    <div class="table-wrap"><table class="docs-table">
      <thead><tr><th>Level</th><th>Soft third shot</th><th>Driven third shot</th></tr></thead>
      <tbody>
        <tr><td>Easy</td><td>58.0%</td><td>81.5%</td></tr>
        <tr><td>Normal</td><td>54.8%</td><td>63.2%</td></tr>
        <tr><td>Hard</td><td>53.5%</td><td>52.8%</td></tr>
      </tbody>
    </table></div>
    <p>Against weak defenders the drive wins a lot of points, because they cannot handle the pace. As defenders get better, its edge shrinks, and at our hardest level the two are level. That matches what coaches see: at lower levels a hard drive simply wins, which is why so many rec players <a href="/guides/how-to-beat-bangers">bang</a>; as the level rises, a drive gets blocked back, and the soft game becomes necessary. The practical lesson is to learn both and choose based on the ball and on the opponents in front of you. See the <a href="/guides/pickleball-reset">reset</a> for the defensive side of the same battle.</p>

    <h2>5. Longer rallies at higher levels</h2>
    <p>The average rally lasted 5.3 shots at easy, 9.6 at normal and 38.1 at hard. Better players make fewer errors, so points are decided later and more often at the kitchen line. One more detail stood out: in rallies of 3 to 5 shots the serving side won about 80% of the time, mostly from the receiving side missing the fourth shot, while in long rallies it was close to 50–50. Survive the first few shots and the serve stops mattering.</p>

    <h2>Try it yourself</h2>
    <p>Every number on this page came out of the same engine you can play in your browser. Try serving and driving the third shot on easy, then do the same on hard, and see if you feel the difference.</p>
    <a class="docs-cta" href="/?mode=singles&amp;diff=hard">Play the engine on Hard</a>
`,
  faq: [
    ['Is serving an advantage in pickleball?', 'Only slightly. In our 40,000-rally simulation the serving side won 53% of rallies at normal difficulty and under 52% at hard. The two-bounce rule keeps the serving edge small.'],
    ['Why does pickleball doubles start at 0-0-2?', 'To cancel the advantage of serving first. In our simulation, the team serving first won 53.6% of singles games but exactly 50.0% of doubles games played with the 0-0-2 start.'],
    ['How much shorter is rally scoring?', 'In our simulation, a game to 11 took an average of 32.8 rallies with side-out scoring and 18.6 with rally scoring, about 43% fewer.'],
    ['Is the third-shot drop better than a drive?', 'It depends on the opponents. In our simulation a driven third shot won more points against weaker defenders, but against the strongest AI the drop and the drive were equal.'],
  ],
  cta: '/?mode=singles&amp;diff=hard',
  next: `      <p><strong>Keep going:</strong> <a href="/guides/pickleball-scoring">pickleball scoring</a> and <a href="/guides/third-shot-drop">the third-shot drop</a>.</p>`,
};
