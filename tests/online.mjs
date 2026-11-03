// End-to-end check of online play: two separate browsers, a real room service.
// Needs the room Worker running locally first:
//   cd cloudflare/rooms && npx wrangler dev --port 8787 --ip 127.0.0.1
// then: node tests/online.mjs [--relay] [--base https://vspickleball.com]
//   --relay  takes WebRTC away from the guest so the match runs through the room.
//   --base   runs against a deployed site instead of the local files.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const relay = process.argv.includes("--relay");
const root = resolve(import.meta.dirname, "..");
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    let file = normalize(join(root, url.pathname === "/" ? "/index.html" : url.pathname));
    if (!file.startsWith(root)) throw new Error("bad path");
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
const baseArg = process.argv.indexOf("--base");
const base = baseArg > 0 ? process.argv[baseArg + 1] : `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const open = async (label, initScript) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (initScript) await ctx.addInitScript(initScript);
  // Fonts and analytics are not under test; keep the run off the network.
  await ctx.route(/^https:\/\/(fonts\.|www\.googletagmanager)/, (r) => r.fulfill({ status: 200, body: "" }));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: ${e}`));
  page.on("console", (m) => m.type() === "error" && !/navigator.vibrate/.test(m.text()) && errors.push(`${label}: ${m.text()}`));
  return page;
};
const waitFor = async (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 50 });
const game = (page, fn) => page.evaluate(fn);
const step = (msg) => console.log(`  ${msg}`);

try {
  const host = await open("host");
  const guest = await open("guest", relay ? () => delete window.RTCPeerConnection : null);

  await host.goto(base + "/");
  await waitFor(host, () => !document.getElementById("btn-online").hidden);
  await host.click("#btn-online");
  await host.click("#btn-online-host");
  await waitFor(host, () => document.getElementById("online-link").value.includes("room="));
  const link = await host.inputValue("#online-link");
  const code = link.split("room=")[1];
  step(`host opened room ${code}`);
  await waitFor(host, () => /Waiting for your friend/.test(document.getElementById("online-hint").textContent));

  await guest.goto(link.replace(/^https?:\/\/[^/]+/, base));
  await waitFor(host, () => window.game.screen === "play" && window.game.mode === "online");
  await waitFor(guest, () => window.game.screen === "play" && window.game.mode === "online" && window.game.online.snaps.length > 3);
  const transport = await game(host, () => window.game.online.transport);
  step(`match started over ${transport}`);
  assert.equal(transport, relay ? "relay" : "direct");

  // Both see themselves at the near end, the other at the far end.
  const view = await game(guest, () => ({ near: window.game.near.y, far: window.game.far.y, names: [document.getElementById("name-near").textContent, document.getElementById("name-far").textContent] }));
  assert.ok(view.near < 22 && view.far > 22, "guest sees itself near");
  assert.deepEqual(view.names, ["YOU", "FRIEND"]);

  // Guest footwork shows up mirrored on the host.
  const before = await game(host, () => window.game.far.x);
  await guest.keyboard.down("KeyA");
  await guest.waitForTimeout(450);
  await guest.keyboard.up("KeyA");
  await host.waitForTimeout(250);
  const after = await game(host, () => window.game.far.x);
  step(`guest moved left; host sees far.x ${before.toFixed(2)} → ${after.toFixed(2)}`);
  if (!(after > before + 1)) {
    const h = await game(host, () => ({ pt: window.game.online.pt, remote: window.game.online.remote, transport: window.game.online.transport, state: window.game.online.session.state }));
    const g = await game(guest, () => ({ lastPt: window.game.online.lastPt, nearX: window.game.near.x, phase: window.game.phase, snaps: window.game.online.snaps.length, transport: window.game.online.session.transport, state: window.game.online.session.state }));
    console.log("host", JSON.stringify(h), "| guest", JSON.stringify(g));
  }
  assert.ok(after > before + 1, "host sees the guest move to the guest's left");

  // Guest plays like a simple bot: stand where the ball is coming and hold the swing.
  await guest.evaluate(() => {
    window.__bot = setInterval(() => {
      const g = window.game;
      const b = g.ball;
      if (g.phase === "serve" && g.serverPlayer() === g.near && !g.near.charging) {
        g.beginCharge(g.near);
        setTimeout(() => g.releaseSwing(g.near), 300);
        return;
      }
      if (g.phase !== "rally" || !b.live || b.vy >= 0) return;
      const land = g.predictLanding(b);
      g.near.x = Math.max(0, Math.min(20, land.x - 0.5));
      g.near.y = Math.max(-1, Math.min(13.5, land.y - 2.2));
      if (!g.near.charging && !g.near.swinging) g.beginCharge(g.near);
    }, 30);
  });

  // Host serves.
  await waitFor(host, () => window.game.phase === "serve" && window.game.serverPlayer() === window.game.near);
  await host.keyboard.down("Space");
  await host.waitForTimeout(250);
  await host.keyboard.up("Space");
  await waitFor(guest, () => window.game.ball.live && window.game.ball.lastHit === "far", null, 3000);
  step("host served; guest sees the ball coming from the far end");

  // Let points play out until the guest has won one and served.
  await waitFor(host, () => window.game.match.far >= 1, null, 45000);
  const score = await game(host, () => [window.game.match.near, window.game.match.far]);
  step(`guest won a point; host score ${score.join("–")}`);
  await waitFor(host, () => window.game.ball.lastHit === "far" && window.game.rallyLen >= 1 && window.game.match.server === "far", null, 15000);
  step("guest served and the host saw it");

  // Scoreboards agree, mirrored.
  await host.waitForTimeout(400);
  const hs = await game(host, () => [document.getElementById("pts-near").textContent, document.getElementById("pts-far").textContent]);
  const gs = await game(guest, () => [document.getElementById("pts-near").textContent, document.getElementById("pts-far").textContent]);
  step(`host HUD ${hs.join("–")}, guest HUD ${gs.join("–")}`);
  assert.deepEqual(gs, [hs[1], hs[0]]);

  // Leaving ends the match for the other player.
  await guest.close();
  await waitFor(host, () => /left|dropped/.test(document.getElementById("online-text").textContent), null, 9000);
  step(`guest left; host sees: ${await host.textContent("#online-text")}`);

  assert.deepEqual(errors, []);
  console.log(`online ${relay ? "relay" : "direct"}: ok`);
} catch (e) {
  console.error(errors.join("\n"));
  throw e;
} finally {
  await browser.close();
  server.close();
}
