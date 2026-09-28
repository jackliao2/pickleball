// Build a guide page from a spec module. Run: node tools/guide-page.mjs tools/pages/slug.mjs
// spec.root = true writes /slug.html (a game landing page) instead of /guides/slug.html.
// The spec exports { slug, title, description, ogTitle, ogDescription, headline, crumb,
// kicker, h1, meta, body, faq: [[q, a], ...] }. body is raw HTML; faq feeds both
// the FAQPage schema and the visible "Common questions" list.
// In-body "play" links should deep-link a mode: /?mode=singles|doubles|2p|tournament,
// optional &amp;diff=easy|normal|hard and &amp;opp=<preset id> (see Game.applyDeepLink).
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const spec = (await import(pathToFileURL(resolve(process.argv[2])).href)).default;
const base = spec.root ? '' : 'guides/';
const url = `https://vspickleball.com/${base}${spec.slug}`;
const crumbs = spec.root
  ? [{ name: 'Home', item: 'https://vspickleball.com/' }]
  : [{ name: 'Guides', item: 'https://vspickleball.com/guides/' }];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const plain = (s) => s.replace(/<[^>]+>/g, '');
const today = new Date().toISOString().slice(0, 10);
const stamp = (readFileSync('index.html', 'utf8').match(/style.css?v=(d+)/) || [, today.replace(/-/g, '')])[1];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Article', headline: spec.headline, description: spec.description, url,
      datePublished: today, dateModified: today, image: 'https://vspickleball.com/og.jpg?v=2',
      author: { '@type': 'Organization', name: 'VS Pickleball', url: 'https://vspickleball.com/about' },
      publisher: { '@type': 'Organization', name: 'VS Pickleball', url: 'https://vspickleball.com/' },
      isPartOf: { '@type': 'WebSite', name: 'VS Pickleball', url: 'https://vspickleball.com/' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      ...crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })),
      { '@type': 'ListItem', position: crumbs.length + 1, name: spec.crumb, item: url } ] },
    { '@type': 'FAQPage', mainEntity: spec.faq.map(([q, a]) => ({
      '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) },
  ],
};

const html = `<!DOCTYPE html>
<html lang="en" class="docs">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MVL025XCJZ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-MVL025XCJZ');
  </script>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(spec.title)}</title>
  <meta name="description" content="${esc(spec.description)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(spec.ogTitle)}" />
  <meta property="og:description" content="${esc(spec.ogDescription)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="VS Pickleball" />
  <meta property="og:image" content="https://vspickleball.com/og.jpg?v=2" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="stylesheet" href="/css/style.css?v=${stamp}" />
  <link rel="stylesheet" href="/css/site.css?v=${stamp}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body class="docs">
  <div class="docs-shell">
    <nav class="docs-nav">
      <a class="brand wordmark" href="/" aria-label="VS Pickleball home"><span class="vs">VS</span> Pickleball</a>
      <a class="play" href="/" title="Free online pickleball game">Play</a>
      <a href="/how-to-play">How to play</a>
      <a${spec.root ? '' : ' class="on"'} href="/guides/">Guides</a>
      <a href="/about">About</a>
    </nav>

    <p class="docs-kicker">${spec.root ? '<a href="/">Play</a>' : '<a href="/guides/">Guides</a>'} · ${spec.kicker}</p>
    <h1>${spec.h1}</h1>
    <p class="docs-meta">${spec.meta}</p>
${spec.body}
    <h2>Common questions</h2>
    <dl class="faq">
${spec.faq.map(([q, a]) => `      <dt>${q}</dt>\n      <dd>${a}</dd>`).join('\n')}
    </dl>

    <div class="guide-next">
${spec.next}
    </div>

    <footer class="site-foot">
      <nav class="foot-links">
        <a href="/">Play</a>
        <a href="/how-to-play">How to play</a>
        <a href="/guides/">Guides</a>
        <a href="/about">About</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
      </nav>
      <p class="foot-note">© 2026 VS Pickleball · Free online pickleball game for entertainment. Independent project, not affiliated with USA Pickleball, PPA, MLP, APP or any brand or tour. Rules modelled on the sport, not an official rulebook.</p>
    </footer>
  </div>
</body>
</html>
`;
writeFileSync(`${base}${spec.slug}.html`, html);
console.log('wrote', `${base}${spec.slug}.html`, spec.title.length, 'title chars,', spec.description.length, 'desc chars');
