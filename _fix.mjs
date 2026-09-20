import fs from 'fs';
let s=fs.readFileSync('index.html','utf8');
const anchor='<p class="menu-links"><a href="/how-to-play">How to play</a> · <a href="/about">About</a> · <a href="/privacy">Privacy</a></p>\n\n      </div>\n';
if(!s.includes(anchor))throw new Error('anchor');
s=s.replace(anchor, anchor.replace('\n\n','\n')+`      <section class="seo-blurb">
        <h2>A pickleball game online that plays like the real sport</h2>
        <p>VS Pickleball is a free online pickleball game that runs in any modern browser — desktop, tablet, or phone — with nothing to install. The court is regulation 20×44, the kitchen is a real non-volley zone, the two-bounce rule is enforced, serves are underhand, and rally scoring runs to 11. Pick singles or doubles against the CPU, pass the keyboard for a 2-player match, or build a player and enter the tournament from club rec up to pro.</p>
        <p>On a keyboard it is WASD to move and Space to dink or drive; on mobile you drag to move and tap to hit. New to the sport? Read <a href="/how-to-play">how this online pickleball game works</a> or the <a href="/about">story behind it</a>.</p>
      </section>
`);
fs.writeFileSync('index.html',s);
