// How smooth an online match looks on a bad connection. Every message between
// the two browsers is delayed by 40–120 ms, with an occasional 150 ms spike,
// then we count, frame by frame, how often the ball (on the guest's screen) and
// the guest's player (on the host's screen) freeze or jump.
// Needs the room Worker running locally (see tests/online.mjs).
//   node tests/online-smooth.mjs [--calm]   --calm: no added delay
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const calm = process.argv.includes("--calm");
const root = resolve(import.meta.dirname, "..");
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    let file = normalize(join(root, url.pathname === "/" ? "/index.html" : url.pathname));
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      if (!extname(file)) file += ".html";
    }
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/^https:\/\/(fonts\.|www\.googletagmanager)/, (r) => r.fulfill({ status: 200, body: "" }));
  return ctx.newPage();
};

try {
  const host = await page();
  const guest = await page();
  await host.goto(base + "/");
  await host.evaluate(() => localStorage.setItem("pb-tutorial-v1", "done"));
  await host.waitForFunction(() => !document.getElementById("btn-online").hidden);
  await host.click("#btn-online");
  await host.click("#btn-online-host");
  await host.waitForFunction(() => document.getElementById("online-link").value.includes("room="));
  await guest.goto((await host.inputValue("#online-link")).replace(/^https?:\/\/[^/]+/, base));
  await guest.waitForFunction(() => window.game.screen === "play" && window.game.online?.snaps.length > 3, null, { timeout: 10000 });

  // A bad network, applied to whatever each side receives.
  const lag = (p) =>
    p.evaluate((calm) => {
      if (calm) return;
      const s = window.game.online.session;
      const receive = s.receive.bind(s);
      s.receive = (raw) => setTimeout(() => receive(raw), 40 + Math.random() * 80 + (Math.random() < 0.05 ? 150 : 0));
    }, calm);
  await lag(host);
  await lag(guest);

  // Guest: a bot that runs to the ball and swings, so the rallies go on.
  // Both sides: record what is drawn every frame.
  await guest.evaluate(() => {
    const g = window.game;
    window.__frames = [];
    setInterval(() => {
      const b = g.ball;
      if (g.phase === "serve" && g.serverPlayer() === g.near && !g.near.charging) {
        g.beginCharge(g.near);
        setTimeout(() => g.releaseSwing(g.near), 250);
      }
      if (g.phase !== "rally" || !b.live || b.vy >= 0) return;
      const land = g.predictLanding(b);
      g.keys.clear();
      const tx = Math.max(1, Math.min(19, land.x - 0.6));
      const ty = Math.max(0, Math.min(13.5, land.y - 2.2));
      if (g.near.x < tx - 0.4) g.keys.add("KeyD");
      if (g.near.x > tx + 0.4) g.keys.add("KeyA");
      if (g.near.y < ty - 0.4) g.keys.add("KeyW");
      if (g.near.y > ty + 0.4) g.keys.add("KeyS");
      if (!g.near.charging && !g.near.swinging) g.beginCharge(g.near);
    }, 30);
    const tick = () => {
      window.__frames.push({ live: g.ball.live && g.phase === "rally", x: g.ball.x, y: g.ball.y, z: g.ball.z });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await host.evaluate(() => {
    const g = window.game;
    window.__frames = [];
    // Host: keep serving and keep returning with a held swing.
    setInterval(() => {
      if (g.phase === "serve" && g.serverPlayer() === g.near && !g.near.charging) {
        g.beginCharge(g.near);
        setTimeout(() => g.releaseSwing(g.near), 250);
      }
      const b = g.ball;
      if (g.phase === "rally" && b.live && b.vy < 0) {
        const land = g.predictLanding(b);
        g.near.x = Math.max(1, Math.min(19, land.x - 0.6));
        g.near.y = Math.max(0, Math.min(13.5, land.y - 2.2));
        if (!g.near.charging && !g.near.swinging) g.beginCharge(g.near);
      }
    }, 30);
    const tick = () => {
      window.__frames.push({ live: g.phase === "rally", x: g.far.x, y: g.far.y, moving: Math.hypot(g.online?.remote?.vx || 0, g.online?.remote?.vy || 0) > 1 });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await host.waitForTimeout(15000);

  const score = (frames, key) => {
    let n = 0, stalls = 0, jumps = 0;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1], b = frames[i];
      if (!a.live || !b.live || (key === "moving" && !(a.moving && b.moving))) continue;
      n++;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 0.001) stalls++;
      else if (d > 1.2) jumps++;
    }
    return { frames: n, stalls, stallPct: +((100 * stalls) / Math.max(1, n)).toFixed(1), jumps };
  };
  const gFrames = await guest.evaluate(() => window.__frames);
  const hFrames = await host.evaluate(() => window.__frames);
  const rallies = await host.evaluate(() => window.game.match.near + window.game.match.far);
  console.log(`${calm ? "calm" : "jittery"} network, ${rallies} points played`);
  console.log("  guest sees the ball:      ", JSON.stringify(score(gFrames, "live")));
  console.log("  host sees the guest move: ", JSON.stringify(score(hFrames, "moving")));
} finally {
  await browser.close();
  server.close();
}
