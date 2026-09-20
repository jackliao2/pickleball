// Inline SVG diagrams for the guides. Run: node tools/figures.mjs
// Replaces every <figure data-fig="NAME">…</figure> in guides/*.html with the
// current drawing, so figures can be re-generated after edits. Idempotent.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const S = 11;                 // px per foot
const W = 20 * S, L = 44 * S; // court 220 × 484
const X0 = 70, Y0 = 40;
const NET = Y0 + L / 2;       // 282
const K = 7 * S;              // kitchen depth 77
const CX = X0 + W / 2;

const PAPER = 'rgba(244,241,232,0.92)';
const DIM = 'rgba(244,241,232,0.55)';
const LINE = '#f4f1e8';
const COURT = '#245f6b';
const KIT = 'rgba(212,225,87,0.18)';
const BALL = '#d4e157';

const base = (inner, h = Y0 + L + 44, w = 360) =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Outfit, system-ui, sans-serif" font-size="12">${inner}</svg>`;

// court body: surface, kitchen shading, lines, net
function court({ kitchenLabel = true } = {}) {
  return `
  <rect x="${X0}" y="${Y0}" width="${W}" height="${L}" fill="${COURT}"/>
  <rect x="${X0}" y="${NET - K}" width="${W}" height="${K * 2}" fill="${KIT}"/>
  <g stroke="${LINE}" stroke-width="2" fill="none">
    <rect x="${X0}" y="${Y0}" width="${W}" height="${L}"/>
    <line x1="${X0}" y1="${NET - K}" x2="${X0 + W}" y2="${NET - K}"/>
    <line x1="${X0}" y1="${NET + K}" x2="${X0 + W}" y2="${NET + K}"/>
    <line x1="${CX}" y1="${Y0}" x2="${CX}" y2="${NET - K}"/>
    <line x1="${CX}" y1="${NET + K}" x2="${CX}" y2="${Y0 + L}"/>
  </g>
  <line x1="${X0 - 8}" y1="${NET}" x2="${X0 + W + 8}" y2="${NET}" stroke="#0c2744" stroke-width="5"/>
  <line x1="${X0 - 8}" y1="${NET}" x2="${X0 + W + 8}" y2="${NET}" stroke="${LINE}" stroke-width="2" stroke-dasharray="3 3"/>
  ${kitchenLabel ? `<text x="${CX}" y="${NET - K / 2 + 4}" text-anchor="middle" fill="${PAPER}" font-weight="700" font-size="11" letter-spacing="1">KITCHEN</text>
  <text x="${CX}" y="${NET + K / 2 + 4}" text-anchor="middle" fill="${PAPER}" font-weight="700" font-size="11" letter-spacing="1">KITCHEN</text>` : ''}`;
}

const dimV = (x, y1, y2, label) => `
  <g stroke="${DIM}" stroke-width="1"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}"/><line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}"/></g>
  <text transform="translate(${x + (x > CX ? 14 : -8)} ${(y1 + y2) / 2}) rotate(${x > CX ? 90 : -90})" text-anchor="middle" fill="${DIM}" font-weight="600">${label}</text>`;
const dimH = (y, x1, x2, label) => `
  <g stroke="${DIM}" stroke-width="1"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}"/><line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}"/></g>
  <text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" fill="${DIM}" font-weight="600">${label}</text>`;

const ball = (x, y, n) => `<circle cx="${x}" cy="${y}" r="9" fill="${BALL}"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#0c2744" font-weight="800" font-size="11">${n}</text>`;
const player = (x, y, label, above = false) => `<circle cx="${x}" cy="${y}" r="8" fill="${LINE}" stroke="#0c2744" stroke-width="2"/><text x="${x}" y="${above ? y - 14 : y + 22}" text-anchor="middle" fill="${PAPER}" font-weight="700" font-size="11">${label}</text>`;
const arrow = (d, col = BALL, dash = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#ah)"/>`;
const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${BALL}"/></marker></defs>`;

const figs = {
  // Full court with dimensions
  court: () => base(`${court()}
    ${dimH(Y0 - 14, X0, X0 + W, '20 ft')}
    ${dimV(X0 + W + 18, Y0, Y0 + L, '44 ft')}
    ${dimV(X0 - 18, Y0, NET - K, '15 ft service box')}
    ${dimV(X0 - 18, NET - K, NET, '7 ft')}
    ${dimH(NET - K - 6, X0, CX, '10 ft')}
    <text x="${X0 - 12}" y="${NET + 16}" text-anchor="end" fill="${DIM}" font-weight="600">Net</text>
    <text x="${X0 - 12}" y="${NET + 30}" text-anchor="end" fill="${DIM}" font-size="11">36 in sides</text>
    <text x="${X0 - 12}" y="${NET + 43}" text-anchor="end" fill="${DIM}" font-size="11">34 in centre</text>
    <text x="${X0 + W / 4}" y="${Y0 + 90}" text-anchor="middle" fill="${DIM}" font-size="11">Left service</text>
    <text x="${X0 + 3 * W / 4}" y="${Y0 + 90}" text-anchor="middle" fill="${DIM}" font-size="11">Right service</text>
    <text x="${CX}" y="${Y0 + L + 30}" text-anchor="middle" fill="${DIM}">Baseline</text>`),

  // Serve: server bottom-right (even score) into diagonal box; landing zone; kitchen line = fault
  serve: () => base(`${defs}${court()}
    ${player(X0 + 3 * W / 4, Y0 + L + 14, 'Server (even score: right)')}
    ${arrow(`M${X0 + 3 * W / 4} ${Y0 + L + 2} Q ${CX + 10} ${NET - 30} ${X0 + W / 4 + 10} ${Y0 + 60}`)}
    <rect x="${X0 + 2}" y="${Y0 + 2}" width="${W / 2 - 4}" height="${NET - K - Y0 - 4}" fill="none" stroke="${BALL}" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="${X0 + W / 4}" y="${Y0 + 30}" text-anchor="middle" fill="${BALL}" font-weight="700" font-size="11">Must land here</text>
    <text x="${X0 + W / 4}" y="${Y0 + 44}" text-anchor="middle" fill="${BALL}" font-size="10">lines in, kitchen line out</text>
    <text x="${X0 - 8}" y="${NET - K - 2}" text-anchor="end" fill="#ff8a80" font-weight="700" font-size="11">kitchen line</text><text x="${X0 - 8}" y="${NET - K + 11}" text-anchor="end" fill="#ff8a80" font-weight="700" font-size="11">= fault</text>
    ${player(X0 + W / 4, Y0 - 16, 'Receiver', true)}`),

  // Two-bounce rule: 1 serve bounces, 2 return bounces, 3 third shot drop; serving side stays back
  twobounce: () => base(`${defs}${court({ kitchenLabel: false })}
    ${player(X0 + 3 * W / 4, Y0 + L + 14, 'Serving side stays back')}
    ${player(X0 + W / 4, Y0 - 16, 'Receiver', true)}
    ${arrow(`M${X0 + 3 * W / 4} ${Y0 + L} Q ${CX} ${NET - 40} ${X0 + W / 4} ${Y0 + 70}`)}
    ${ball(X0 + W / 4, Y0 + 70, 1)}
    <text x="${X0 + W / 4 + 16}" y="${Y0 + 74}" fill="${PAPER}" font-size="11" font-weight="600">serve bounces</text>
    ${arrow(`M${X0 + W / 4 + 6} ${Y0 + 84} Q ${X0 - 10} ${NET + 30} ${X0 + 3 * W / 4} ${Y0 + L - 60}`)}
    ${ball(X0 + 3 * W / 4, Y0 + L - 60, 2)}
    <text x="${X0 + 3 * W / 4 - 16}" y="${Y0 + L - 56}" text-anchor="end" fill="${PAPER}" font-size="11" font-weight="600">return bounces</text>
    ${arrow(`M${X0 + 3 * W / 4 - 6} ${Y0 + L - 72} Q ${X0 + W + 20} ${NET + 60} ${X0 + W / 2 - 10} ${NET - 40}`)}
    ${ball(X0 + W / 2 - 10, NET - 40, 3)}
    <text x="${X0 + W / 2 + 6}" y="${NET - 36}" fill="${PAPER}" font-size="11" font-weight="600">third-shot drop</text>
    <text x="${X0 + W / 2 + 6}" y="${NET - 22}" fill="${DIM}" font-size="10">volleys legal from here</text>`),

  // Doubles positions at 0-0-2 / serving turn: server 1 right, partner left; receivers
  doubles: () => base(`${defs}${court({ kitchenLabel: false })}
    ${player(X0 + 3 * W / 4, Y0 + L + 14, 'Server 1 (right, even)')}
    ${player(X0 + W / 4, Y0 + L + 14, 'Server 2 (left)')}
    ${player(X0 + W / 4, Y0 - 16, 'Receiver', true)}
    ${player(X0 + 3 * W / 4, NET - K - 14, 'Partner at the line')}
    ${arrow(`M${X0 + 3 * W / 4} ${Y0 + L} Q ${CX + 10} ${NET - 30} ${X0 + W / 4 + 8} ${Y0 + 60}`)}
    <text x="${CX}" y="${NET + K + 40}" text-anchor="middle" fill="${DIM}" font-size="11">Win a point → partners swap sides, same server</text>
    <text x="${CX}" y="${NET + K + 56}" text-anchor="middle" fill="${DIM}" font-size="11">Lose a rally → serve passes to Server 2, then side-out</text>`),

  // Side view: dink, third-shot drop, and drive trajectories over the net
  arc: () => {
    const s = 8, x0 = 20, ground = 150, L = 44 * s;               // 8 px/ft, court 352 wide
    const ft = (f) => x0 + f * s, up = (f) => ground - f * s;
    const net = ft(22), netH = up(3);                              // 36 in ≈ 3 ft
    const q = (xa, ya, xc, yc, xb, yb) => `M${xa} ${ya} Q ${xc} ${yc} ${xb} ${yb}`;
    return base(`${defs}
      <rect x="${ft(0)}" y="${ground}" width="${L}" height="6" fill="${COURT}"/>
      <rect x="${ft(15)}" y="${ground}" width="${14 * s}" height="6" fill="${BALL}" opacity="0.6"/>
      <line x1="${net}" y1="${ground}" x2="${net}" y2="${netH}" stroke="${LINE}" stroke-width="3"/>
      <text x="${net + 5}" y="${up(0.8)}" fill="${DIM}" font-size="10">net</text>
      <text x="${ft(0)}" y="${ground + 20}" fill="${DIM}" font-size="10">baseline</text>
      <text x="${ft(15)}" y="${ground + 20}" fill="${DIM}" font-size="10">kitchen line</text>
      <text x="${ft(29)}" y="${ground + 20}" fill="${DIM}" font-size="10">kitchen line</text>
      <text x="${ft(44)}" y="${ground + 20}" text-anchor="end" fill="${DIM}" font-size="10">baseline</text>
      ${arrow(q(ft(15), up(2.5), ft(21), up(5.2), ft(26), up(0.2)))}
      <text x="${ft(18)}" y="${up(6.6)}" fill="${BALL}" font-weight="700" font-size="11">Dink</text>
      <text x="${ft(18)}" y="${up(5.6)}" fill="${DIM}" font-size="10">low apex, lands in kitchen</text>
      ${arrow(q(ft(1), up(2.5), ft(16), up(9.5), ft(27), up(0.2)), '#8fd3ff')}
      <text x="${ft(2)}" y="${up(11.4)}" fill="#8fd3ff" font-weight="700" font-size="11">Third-shot drop</text>
      <text x="${ft(2)}" y="${up(10.4)}" fill="${DIM}" font-size="10">high arc from the baseline, dies in the kitchen</text>
      ${arrow(q(ft(1), up(2.8), ft(22), up(4.4), ft(43), up(0.3)), '#ff8a80')}
      <text x="${ft(33)}" y="${up(3.6)}" fill="#ff8a80" font-weight="700" font-size="11">Drive</text>
      <text x="${ft(33)}" y="${up(2.6)}" fill="${DIM}" font-size="10">flat, attackable if it sits up</text>
      <circle cx="${ft(1)}" cy="${up(2.6)}" r="4" fill="${LINE}"/><circle cx="${ft(15)}" cy="${up(2.6)}" r="4" fill="${LINE}"/>
    `, ground + 30, L + 40);
  },

  // Court-size comparison: tennis, padel, pickleball/badminton, at 3 px per foot
  compare: () => {
    const s = 3, gap = 28, top = 34;
    const items = [
      ['Tennis', 36, 78, '36 × 78 ft (doubles)'],
      ['Padel', 32.8, 65.6, '10 × 20 m'],
      ['Pickleball', 20, 44, '20 × 44 ft'],
      ['Badminton', 20, 44, '20 × 44 ft (doubles)'],
    ];
    let x = 10, out = '';
    for (const [name, w, l, dim] of items) {
      const pw = w * s, pl = l * s, y = top + (78 * s - pl);
      out += `<rect x="${x}" y="${y}" width="${pw}" height="${pl}" fill="${name === 'Pickleball' ? COURT : 'rgba(255,255,255,0.06)'}" stroke="${LINE}" stroke-width="1.5"/>
        <line x1="${x}" y1="${y + pl / 2}" x2="${x + pw}" y2="${y + pl / 2}" stroke="${LINE}" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${x + pw / 2}" y="${top + 78 * s + 18}" text-anchor="middle" fill="${PAPER}" font-weight="700">${name}</text>
        <text x="${x + pw / 2}" y="${top + 78 * s + 33}" text-anchor="middle" fill="${DIM}" font-size="10">${dim}</text>`;
      x += pw + gap;
    }
    return base(`<text x="10" y="20" fill="${DIM}" font-size="11">Same scale. Dashed line = net.</text>${out}`, top + 78 * s + 44, x - gap + 10);
  },
};

const captions = {
  court: 'A regulation pickleball court: 20 by 44 feet, a 7-foot non-volley zone on each side of the net, and two 10 by 15 foot service boxes per side.',
  serve: 'The serve goes diagonally into the opposite service box. Every line is in except the kitchen line.',
  twobounce: 'The two-bounce rule: the serve bounces (1), the return bounces (2), and only then can either side volley. The serving team is stuck at the baseline for the third shot.',
  doubles: 'A doubles serving turn. The partner on the right when the turn begins is server 1; both partners serve before a side-out.',
  arc: 'Side view, not to scale vertically. A dink and a third-shot drop both die in the kitchen so they cannot be volleyed; a drive clears the net by inches and keeps going.',
  compare: 'Court sizes to scale. A pickleball court has exactly the footprint of a doubles badminton court and fits inside a tennis court almost four times over.',
};

for (const f of readdirSync('guides').filter((n) => n.endsWith('.html'))) {
  const p = `guides/${f}`;
  let s = readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/<figure data-fig="([a-z]+)"[^>]*>[\s\S]*?<\/figure>/g, (m, name) => {
    if (!figs[name]) return m;
    return `<figure data-fig="${name}" class="fig">${figs[name]()}<figcaption>${captions[name]}</figcaption></figure>`;
  });
  if (s !== before) { writeFileSync(p, s); console.log('updated', p); }
}
