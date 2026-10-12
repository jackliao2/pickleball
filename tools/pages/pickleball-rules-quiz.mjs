// Each question: [question, options, index of correct option, explanation, link].
const Q = [
  ['A rally ends when one team faults. True or false?', ['True', 'False'], 0, 'True. A fault, such as hitting into the net, hitting out, volleying from the kitchen, or letting the ball bounce twice, ends the rally immediately.', '/guides/pickleball-terms'],
  ['How wide and long is a pickleball court?', ['20 × 44 ft', '36 × 78 ft', '20 × 40 ft', '30 × 60 ft'], 0, 'A pickleball court is 20 ft wide and 44 ft long, the same size as a doubles badminton court.', '/guides/pickleball-court-dimensions'],
  ['How deep is the kitchen (non-volley zone) on each side of the net?', ['5 ft', '7 ft', '10 ft', '15 ft'], 1, 'The kitchen extends 7 ft from the net on each side.', '/guides/kitchen-rule'],
  ['How high is the net at the centre of the court?', ['32 in', '34 in', '36 in', '38 in'], 1, 'The net is 34 inches at the centre and 36 inches at the sidelines.', '/guides/pickleball-court-dimensions'],
  ['The serve must be hit underhand. True or false?', ['True', 'False'], 0, 'True. For a volley serve, the paddle moves upward and contact is made below the waist. The drop serve, where the ball bounces first, is also legal.', '/guides/pickleball-serving-rules'],
  ['Where must the serve land?', ['Anywhere on the opponent’s side', 'In the diagonally opposite service court', 'In the kitchen', 'In the service court straight ahead'], 1, 'The serve goes diagonally, crosscourt, into the opposite service court, beyond the kitchen line.', '/guides/pickleball-serving-rules'],
  ['A serve that lands on the kitchen line is…', ['In', 'Out (a fault)', 'Replayed'], 1, 'A fault. The kitchen line counts as part of the kitchen, so a serve landing on it is short.', '/guides/pickleball-serving-rules'],
  ['A serve that lands on the baseline is…', ['In', 'Out (a fault)', 'Replayed'], 0, 'In. Except for the kitchen line on a serve, a ball landing on a line is in.', '/guides/pickleball-serving-rules'],
  ['What does the two-bounce rule say?', ['The ball may bounce twice on each side', 'The serve and the return must each bounce before being hit', 'Every shot must bounce before it is hit', 'Only the serve must bounce'], 1, 'The serve must bounce before it is returned, and the return must bounce before the serving side hits it. After that, volleys are allowed.', '/guides/two-bounce-rule'],
  ['After the serve and the return have bounced, may players volley?', ['Yes, from outside the kitchen', 'No, never', 'Only the serving team'], 0, 'Yes. Once both bounces have happened, either team may volley, as long as they are not in the kitchen.', '/guides/two-bounce-rule'],
  ['Can you stand in the kitchen?', ['Yes, any time', 'No, never', 'Only to serve'], 0, 'Yes. You can stand in the kitchen and hit a ball that has bounced. What you cannot do is volley while touching the kitchen.', '/guides/kitchen-rule'],
  ['You volley from just behind the kitchen line and your momentum carries you into the kitchen. Is it a fault?', ['Yes', 'No'], 0, 'Yes. If momentum from a volley carries you into the kitchen, even after the ball is dead, it is a fault.', '/guides/kitchen-rule'],
  ['Your toe touches the kitchen line while you volley. Is it a fault?', ['Yes', 'No'], 0, 'Yes. The line is part of the kitchen, so touching it while volleying is a fault.', '/guides/kitchen-rule'],
  ['What is a dink?', ['A hard smash', 'A soft shot that lands in the opponent’s kitchen', 'A lob over the opponent', 'A serve that hits the net'], 1, 'A dink is a soft shot, usually from near the kitchen line, that drops into the opponent’s kitchen.', '/guides/how-to-dink'],
  ['In traditional (side-out) scoring, which team can score a point?', ['Either team', 'Only the serving team', 'Only the receiving team'], 1, 'Only the serving team scores in side-out scoring. The receiving team wins the right to serve.', '/guides/pickleball-scoring'],
  ['A standard pickleball game is played to…', ['11, win by 2', '15, win by 1', '21, win by 2', '7, win by 2'], 0, 'Games are usually to 11, win by 2. Some tournament formats use 15 or 21.', '/guides/pickleball-scoring'],
  ['In rally scoring, a point is scored…', ['Only by the serving team', 'On every rally, by whoever wins it', 'Only on aces'], 1, 'In rally scoring every rally produces a point for the winner, whoever served.', '/guides/pickleball-scoring'],
  ['In doubles, what does the score call “4–2–1” mean?', ['Serving team 4, receivers 2, first server', 'Receivers 4, servers 2, game 1', 'Serving team 4, receivers 2, one fault left'], 0, 'Serving team’s score first, then the receiving team’s score, then whether this is server 1 or server 2.', '/guides/pickleball-doubles-rules'],
  ['Why does a doubles game start at 0–0–2?', ['It is a typo that stuck', 'The first serving team gets only one server', 'Both teams start with two points'], 1, 'To offset the advantage of serving first, the first team gets only one server in its first turn, so the call treats them as already on server 2.', '/guides/pickleball-doubles-rules'],
  ['In doubles, when the serving team wins a point, what happens?', ['The server switches sides with their partner', 'The receivers switch sides', 'Nobody moves'], 0, 'The server and partner swap sides, and the server serves again from the other side.', '/guides/pickleball-doubles-rules'],
  ['The ball bounces twice on your side before you hit it. What happens?', ['Play continues', 'It is a fault against you', 'The point is replayed'], 1, 'Two bounces on one side is a fault against that side.', '/guides/two-bounce-rule'],
  ['A serve clips the net and lands in the correct service court. What happens?', ['It is replayed (a let)', 'It is in and play continues', 'It is a fault'], 1, 'Under current rules there are no service lets: a serve that touches the net and lands in the correct court is in, and play continues.', '/guides/pickleball-serving-rules'],
  ['Is a ball that hits your body before bouncing a fault against you?', ['Yes', 'No, it is replayed', 'Only if it was going in'], 0, 'Yes. If the ball touches you or your clothing before it bounces, you lose the rally, even if it was going out.', '/guides/pickleball-doubles-rules'],
  ['What is the third-shot drop?', ['A serve dropped from shoulder height', 'A soft shot by the serving team on the third shot, aimed into the kitchen', 'The third fault in a game'], 1, 'Because of the two-bounce rule, the serving team is at the back on the third shot. A soft drop into the kitchen lets them move up to the net.', '/guides/third-shot-drop'],
  ['Is stacking legal in doubles?', ['Yes', 'No'], 0, 'Yes. Teams may arrange where partners stand after the serve and return, as long as the correct player serves and receives from the correct side.', '/guides/pickleball-stacking'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const items = Q.map(([q, opts, ok, why, link]) => `      <li data-ok="${ok}">
        <p class="q">${esc(q)}</p>
        <div class="opts">${opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join('')}</div>
        <p class="ans" hidden><strong>Answer${why.startsWith(opts[ok]) ? ':' : ': ' + esc(opts[ok]) + '.'}</strong> ${esc(why)} <a href="${link}">Learn more</a>.</p>
      </li>`).join('\n');

export default {
  slug: 'pickleball-rules-quiz',
  title: 'Pickleball Rules Quiz: 25 Questions With Answers',
  description: 'Test your pickleball rules knowledge: 25 true-or-false and multiple-choice questions on the kitchen, serving, scoring and doubles, each answer explained.',
  ogTitle: 'Pickleball Rules Quiz: How Many Can You Get?',
  ogDescription: '25 questions on the kitchen, serve, scoring and doubles, with answers explained.',
  headline: 'Pickleball rules quiz: 25 questions with answers',
  crumb: 'Rules quiz',
  kicker: 'Quiz',
  h1: 'Pickleball rules quiz',
  meta: '25 questions, answers explained, no sign-up. Tap an answer to check it. Updated 12 October 2026.',
  body: `
    <p>How well do you really know the rules? This quiz covers what comes up on court and on PE tests: the court, the serve, the two-bounce rule, the kitchen, scoring and doubles. Tap an answer to see whether you are right and why. Every answer links to the guide that explains it properly.</p>

    <ol class="quiz" id="quiz">
${items}
    </ol>
    <p class="quiz-score" id="quiz-score" aria-live="polite">Score: 0 / 0</p>

    <h2>How did you do?</h2>
    <ul>
      <li><strong>22–25:</strong> you know the rulebook better than most of your local open play. Time to work on <a href="/guides/third-shot-drop">the third-shot drop</a>.</li>
      <li><strong>15–21:</strong> solid. Read the <a href="/guides/kitchen-rule">kitchen rule</a> and <a href="/guides/pickleball-doubles-rules">doubles rules</a> to close the gaps.</li>
      <li><strong>Under 15:</strong> start with <a href="/guides/pickleball-for-beginners">pickleball for beginners</a>; it covers everything here in ten minutes.</li>
    </ul>
    <p>The fastest way to make the rules stick is to see them called. The free <a href="/">online pickleball game</a> on this site enforces the serve, the two-bounce rule, the kitchen and the scoring, and tells you exactly which rule ended each point.</p>
    <a class="docs-cta" href="/?mode=singles">Test the rules in a free game</a>
    <p>Teachers: this quiz pairs with our guide to <a href="/guides/teaching-pickleball-in-pe">teaching pickleball in PE</a>.</p>

    <script>
    (() => {
      const quiz = document.getElementById("quiz");
      const score = document.getElementById("quiz-score");
      let right = 0, done = 0;
      quiz.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-i]");
        if (!btn) return;
        const li = btn.closest("li");
        if (li.dataset.answered) return;
        li.dataset.answered = "1";
        const ok = li.dataset.ok;
        li.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
          if (b.dataset.i === ok) b.classList.add("right");
        });
        if (btn.dataset.i === ok) right++;
        else btn.classList.add("wrong");
        done++;
        li.querySelector(".ans").hidden = false;
        score.textContent = "Score: " + right + " / " + done + (done === ${Q.length} ? " — finished!" : "");
        if (done === ${Q.length} && typeof gtag === "function") gtag("event", "quiz_complete", { score: right });
      });
    })();
    </script>
`,
  faq: [
    ['A rally ends when one team faults: true or false?', 'True. Any fault, such as hitting into the net, hitting out, volleying from the kitchen or a double bounce, ends the rally immediately.'],
    ['What are the most commonly tested pickleball rules?', 'The court size (20 × 44 ft), the 7 ft kitchen, the underhand diagonal serve, the two-bounce rule, no volleying in the kitchen, and scoring to 11, win by 2, with only the serving team scoring in traditional scoring.'],
    ['Is a serve that hits the net and lands in replayed?', 'No. Under current rules there are no service lets; a serve that touches the net and lands in the correct service court is in and play continues.'],
    ['Can you volley in the kitchen?', 'No. You may not volley while touching the kitchen or its line, and you may not let your momentum carry you into it after a volley. You may enter the kitchen to hit a ball that has bounced.'],
  ],
  next: `      <p><strong>Keep going:</strong> <a href="/guides/pickleball-for-beginners">pickleball for beginners</a> covers every rule in this quiz in order.</p>`,
};
