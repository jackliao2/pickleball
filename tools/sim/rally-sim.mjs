// AI-vs-AI rally simulation for the "we simulated it" guide.
// Runs the real game engine headless in demo mode (both sides CPU, normal difficulty),
// randomises the serving side every point, and optionally forces the third shot to a drive.
// Run: node tools/sim/rally-sim.mjs <rallies> [out.json]
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const N = +(process.argv[2] || 2000);
const root = resolve(import.meta.dirname, "../..");
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" };
const server = createServer(async (req, res) => {
  const u = new URL(req.url, "http://x").pathname;
  const p = u === "/" ? "/index.html" : u;
  try {
    const body = await readFile(join(root, p));
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/googletagmanager|google-analytics|fonts\.g/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => !!window.game);

await page.evaluate((diff) => {
  try { localStorage.setItem("pb-tutorial-v1", "done"); } catch {}
  const g = window.game;
  g.draw = () => {};
  g.recordFrame = () => {};
  g.beginReplay = () => {};
  g.sfx = new Proxy({}, { get: () => () => {} });
  g.diff = g.menuDiff = diff;
  g.startMatch("cpu");
  g.hideTutorial?.();
  g.tutorial.active = false;
  // Both sides run the real CPU logic (aiming, errors, reach, tactics).
  g.isHuman = () => false;
  g.isCpuSide = () => true;
  let serveClock = 0;
  g.ai = function (dt) {
    if (this.phase === "serve" && this.serverPlayer() === this.near) {
      serveClock += dt;
      if (serveClock > 0.8) { serveClock = 0; this.doServe(this.near, 0.45 + Math.random() * 0.27); }
    }
    this.runAI(this.near, dt);
    this.runAI(this.far, dt);
  };
  window.__log = [];
  let cur = null;
  const origReset = g.resetPoint.bind(g);
  g.resetPoint = (...a) => {
    g.match = g.freshMatch();
    g.match.startOneServe = false;
    g.match.server = Math.random() < 0.5 ? "near" : "far";
    g.match.targetRight = Math.random() < 0.5;
    g.screen = "play";
    cur = { server: g.match.server, forceDrive: Math.random() < 0.5, third: null };
    return origReset(...a);
  };
  const origKind = g.chooseShotKind.bind(g);
  g.chooseShotKind = (p, b, power) => {
    let k = origKind(p, b, power);
    if (cur && g.rallyLen === 2 && p.side === g.match.server && !g.ball.held) {
      if (cur.forceDrive && (k === "drop" || k === "dink")) k = "drive";
      cur.third = k;
    }
    return k;
  };
  const origEnd = g.endRally.bind(g);
  g.endRally = (reason, faulter) => {
    if (g.phase !== "dead" && g.phase !== "replay" && cur) {
      let f = faulter;
      if (f !== "near" && f !== "far") f = g.ball.lastHit === "far" ? "far" : "near";
      window.__log.push({ s: cur.server, w: f === "near" ? "far" : "near", r: reason, n: g.rallyLen, t: cur.third, k: g.lastKind, d: cur.forceDrive });
      cur = null;
    }
    return origEnd(reason, faulter);
  };
  g.resetPoint();
}, process.env.DIFF || "normal");

const t0 = Date.now();
let done = 0;
while (done < N) {
  done = await page.evaluate((target) => {
    const g = window.game;
    let guard = 0;
    while (window.__log.length < target && guard++ < 400000) g.update(1 / 60);
    return window.__log.length;
  }, Math.min(N, done + 500));
  process.stdout.write(`\r${done}/${N} rallies, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
const log = await page.evaluate(() => window.__log);
await browser.close();
server.close();
console.log();
await writeFile(process.argv[3] || "sim-log.json", JSON.stringify(log));
console.log("wrote", log.length, "rallies");
