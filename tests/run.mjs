import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const route = url.pathname === "/" ? "/index.html" : url.pathname;
    const requested = normalize(join(root, route));
    if (!requested.startsWith(root)) throw new Error("Invalid path");
    let file = requested;
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      if (!extname(file)) file += ".html";
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const checks = [];

function passed(name, detail = "") {
  checks.push({ name, detail });
  console.log(`✓ ${name}${detail ? ` · ${detail}` : ""}`);
}

async function newPage(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.game);
  return { context, page, errors };
}

try {
  {
    const { context, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
    const layout = await page.evaluate(() => {
      const app = document.querySelector("#app").getBoundingClientRect();
      const card = document.querySelector("#menu .card").getBoundingClientRect();
      return { app, card, viewport: { width: innerWidth, height: innerHeight } };
    });
    assert(layout.app.width >= 900, "desktop court should use the available center column");
    assert(layout.card.top >= 0 && layout.card.bottom <= layout.viewport.height, "desktop menu must remain visible");
    assert.deepEqual(errors, []);
    passed("desktop layout", `${layout.app.width}×${layout.app.height}`);

    await page.click("#btn-cpu");
    await page.click("#btn-start-match");
    assert.equal(await page.locator("#coach").isVisible(), true);
    assert.match(await page.locator("#coach-step").textContent(), /1 \/ 3/);
    await page.keyboard.down("KeyA");
    await page.waitForFunction(() => window.game.tutorial.step === 1, null, { timeout: 5000 });
    await page.keyboard.up("KeyA");
    await page.evaluate(() => {
      window.__testRandom = Math.random;
      Math.random = () => 0.5;
    });
    await page.keyboard.press("Space");
    await page.waitForFunction(() => window.game.tutorial.step === 2, null, { timeout: 5000 });
    await page.evaluate(() => {
      Math.random = window.__testRandom;
      delete window.__testRandom;
    });
    await page.evaluate(() => {
      const g = window.game;
      g.phase = "rally";
      g.rallyLen = 2;
      g.match.serveBounced = true;
      g.match.returnBounced = false;
      g.near.x = 10;
      g.near.y = 5;
      Object.assign(g.ball, {
        live: true,
        held: false,
        x: 10,
        y: 6,
        z: 1.2,
        vx: 0,
        vy: -4,
        vz: 1,
        lastHit: "far",
        lastBounceSide: "near",
      });
      g.near.charge = 0.2;
      g.near.charging = true;
      g.releaseSwing(g.near);
    });
    assert.equal(await page.locator("#coach").isHidden(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem("pb-tutorial-v1")), "done");
    passed("guided tutorial", "move → serve → legal return → complete");
    await page.click("#btn-mute");
    assert.equal(await page.getAttribute("#btn-mute", "aria-pressed"), "true");
    assert.equal(await page.evaluate(() => localStorage.getItem("pb-muted-v1")), "1");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !!window.game);
    assert.equal(await page.getAttribute("#btn-mute", "aria-pressed"), "true");
    passed("sound preference", "mute state persists after reload");
    await context.close();
  }

  {
    const { context, page, errors } = await newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await page.evaluate(() => localStorage.setItem("pb-tutorial-v1", "done"));
    assert.equal(await page.locator("#btn-p2").isHidden(), true);
    await page.click("#btn-cpu");
    await page.click("#btn-start-match");
    await page.touchscreen.tap(20, 20);
    await page.waitForFunction(() => document.querySelector("#btn-swing").textContent === "SERVE");
    await page.waitForFunction(() => document.querySelector("#toast").textContent.includes("SWING"));
    const styles = await page.evaluate(() => ({
      stick: getComputedStyle(document.querySelector("#stick")).touchAction,
      swing: getComputedStyle(document.querySelector("#btn-swing")).touchAction,
      overscroll: getComputedStyle(document.body).overscrollBehavior,
    }));
    assert.deepEqual(styles, { stick: "none", swing: "none", overscroll: "none" });
    const cdp = await context.newCDPSession(page);
    const center = await page.locator("#stick").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: center.x, y: center.y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: center.x + 30, y: center.y - 20, id: 1 }] });
    const drag = await page.evaluate(() => ({ active: window.game.stick.active, dx: window.game.stick.dx, scrollY }));
    assert.equal(drag.active, true);
    assert(Math.abs(drag.dx) > 0.5);
    assert.equal(drag.scrollY, 0);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.deepEqual(await page.evaluate(() => ({ active: window.game.stick.active, dx: window.game.stick.dx, dy: window.game.stick.dy })), { active: false, dx: 0, dy: 0 });
    const swingCenter = await page.locator("#btn-swing").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.evaluate(() => {
      window.__testRandom = Math.random;
      Math.random = () => 0.5;
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: swingCenter.x, y: swingCenter.y, id: 2 }] });
    await page.waitForFunction(() => document.querySelector("#btn-swing").classList.contains("charging"));
    const charge = await page.locator("#btn-swing").textContent();
    assert.match(charge, /^\d+%$/);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.evaluate(() => {
      Math.random = window.__testRandom;
      delete window.__testRandom;
    });
    await page.waitForFunction(() => window.game.phase === "rally");
    await page.evaluate(() => {
      const g = window.game;
      g.match.server = "near";
      g.match.serveBounced = true;
      g.match.returnBounced = false;
      g.ball.live = true;
      g.ball.lastHit = "far";
      g.syncActionButton();
    });
    assert.equal(await page.locator("#btn-swing").textContent(), "BOUNCE");
    assert.equal(await page.getAttribute("#btn-swing", "aria-label"), "Let the ball bounce");
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(100);
    const landscape = await page.evaluate(() => {
      const stick = document.querySelector("#stick").getBoundingClientRect();
      const swing = document.querySelector("#btn-swing").getBoundingClientRect();
      return { stick, swing, width: innerWidth, height: innerHeight };
    });
    assert(landscape.stick.left >= 0 && landscape.stick.bottom <= landscape.height);
    assert(landscape.swing.right <= landscape.width && landscape.swing.bottom <= landscape.height);
    assert(landscape.stick.right < landscape.swing.left, "landscape controls must not overlap");
    assert.deepEqual(errors, []);
    passed("mobile touch controls", `portrait + landscape, charge ${charge}, contextual BOUNCE`);
    await context.close();
  }

  {
    const { context, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
    await page.evaluate(() => localStorage.setItem("pb-tutorial-v1", "done"));
    await page.click("#btn-cpu");
    await page.click("#btn-start-match");
    const returns = await page.evaluate(() => {
      const g = window.game;
      g.paused = true;
      const summary = {};
      for (const diff of ["easy", "normal", "hard"]) {
        let returned = 0;
        let total = 0;
        g.diff = diff;
        for (const power of [0.05, 0.5, 1]) {
          for (const serverScore of [0, 1]) {
            for (let trial = 0; trial < 10; trial++) {
              total++;
              g.match = g.freshMatch();
              g.match.near = serverScore;
              g.meta = g.emptyMeta();
              g.phase = "serve";
              g.resetPoint();
              g.near.charge = power;
              g.near.charging = true;
              g.releaseSwing(g.near);
              for (let step = 0; step < 600 && g.rallyLen <= 1 && g.phase !== "dead"; step++) g.update(1 / 120);
              if (g.rallyLen > 1) returned++;
            }
          }
        }
        summary[diff] = { returned, total };
      }
      return summary;
    });
    for (const [diff, result] of Object.entries(returns)) {
      assert.equal(result.returned, result.total, `${diff} CPU should return legal serves`);
    }
    assert.deepEqual(errors, []);
    passed("CPU serve returns", Object.entries(returns).map(([d, x]) => `${d} ${x.returned}/${x.total}`).join(", "));
    await context.close();
  }

  {
    const { context, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
    await page.evaluate(() => localStorage.setItem("pb-tutorial-v1", "done"));
    await page.click("#btn-cpu");
    await page.click("#btn-start-match");
    const rates = await page.evaluate(() => {
      const g = window.game;
      g.paused = true;
      const originalRandom = Math.random;
      const targets = [
        [3.2, 31.5], [6.2, 35], [10, 39], [13.8, 35], [16.8, 31.5],
        [3.8, 39.5], [7.2, 32.5], [12.8, 32.5], [16.2, 39.5],
      ];
      const summary = {};
      try {
        for (const diff of ["easy", "normal", "hard"]) {
          let seed = 0x51f15e;
          Math.random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 4294967296;
          };
          let returned = 0;
          let total = 0;
          g.diff = diff;
          for (let repeat = 0; repeat < 12; repeat++) {
            for (const [tx, ty] of targets) {
              total++;
              g.match = g.freshMatch();
              g.match.serveBounced = true;
              g.match.returnBounced = true;
              g.phase = "rally";
              g.rallyLen = 4;
              g.near.x = 10;
              g.near.y = 14;
              g.far.x = 10;
              g.far.y = 29.6;
              g.far.swinging = false;
              g.far.charging = false;
              g.far.aiTrackHit = null;
              g.far.aiWhiff = false;
              g.far.aiWind = 0;
              g.far.lastVolley = -10;
              g.ball = g.makeBall();
              Object.assign(g.ball, { live: true, held: false, x: 10, y: 18, z: 2.3, lastHit: "near", lastBounceSide: "near" });
              g.launchTo(g.ball, tx, ty, 0.92, 0, "drive", g.near);
              g.ball.lastHit = "near";
              for (let step = 0; step < 480 && g.rallyLen === 4 && g.phase !== "dead"; step++) g.update(1 / 120);
              if (g.rallyLen > 4) returned++;
            }
          }
          summary[diff] = { returned, total, rate: returned / total };
        }
      } finally {
        Math.random = originalRandom;
      }
      return summary;
    });
    const rateDetail = Object.entries(rates).map(([d, x]) => `${d} ${Math.round(x.rate * 100)}%`).join(", ");
    assert(rates.easy.rate < rates.normal.rate, `easy return rate should be below normal (${rateDetail})`);
    assert(rates.normal.rate < rates.hard.rate, `normal return rate should be below hard (${rateDetail})`);
    assert(rates.easy.rate >= 0.35 && rates.easy.rate <= 0.75, `easy return rate should stay approachable (${rateDetail})`);
    assert(rates.normal.rate >= 0.82 && rates.normal.rate <= 0.94, `normal return rate should stay competitive (${rateDetail})`);
    assert(rates.hard.rate >= 0.93 && rates.hard.rate <= 0.99, `hard should be demanding but not perfect (${rateDetail})`);
    assert.deepEqual(errors, []);
    passed("difficulty calibration", rateDetail);
    await context.close();
  }

  {
    const { context, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
    await page.click("#btn-p2");
    await page.click("#btn-start-match");
    const p2 = await page.evaluate(() => {
      const app = document.querySelector("#app").getBoundingClientRect();
      const score = document.querySelector("#hud .sb").getBoundingClientRect();
      const far = window.game.project(window.game.far.x, window.game.far.y, 0);
      return {
        mode: window.game.mode,
        compact: document.querySelector("#hud").classList.contains("p2-layout"),
        scoreRight: score.right,
        farCenter: app.left + far.sx,
      };
    });
    assert.equal(p2.mode, "p2");
    assert.equal(p2.compact, true);
    assert(p2.scoreRight < p2.farCenter - 35, "2-player score panel must clear the far-side player");
    assert.equal(await page.locator("#keys-p2").isVisible(), true);
    assert.match(await page.locator("#keys-p2").textContent(), /↑.*←.*↓.*→.*Enter.*player 2/is);
    assert.match(await page.locator("#keys-label").textContent(), /player 1/i);

    await page.evaluate(() => window.game.toMenu());
    await page.click("#btn-cpu");
    await page.click("#btn-start-match");
    const cpu = await page.evaluate(() => ({
      compact: document.querySelector("#hud").classList.contains("p2-layout"),
      scoreWidth: document.querySelector("#hud .sb").getBoundingClientRect().width,
    }));
    assert.equal(cpu.compact, false);
    assert.equal(await page.locator("#keys-p2").isHidden(), true);
    assert(cpu.scoreWidth >= 500, "other modes must keep the standard score layout");
    assert.deepEqual(errors, []);
    passed("2-player HUD placement", "compact left gutter; other modes unchanged");
    await context.close();
  }

  {
    const { context, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
    await page.click("#btn-challenge");
    await page.click("#tourney-map .map-node");
    const scout = await page.evaluate(() => ({
      tactic: document.querySelector("#scout-tactic").textContent,
      counter: document.querySelector("#scout-counter").textContent,
      meta: document.querySelector("#scout-diff").textContent,
    }));
    assert.match(scout.tactic, /Soft starter/);
    assert.match(scout.counter, /Keep the ball deep/);
    assert.match(scout.meta, /First to 7.*Park/);

    await page.click("#btn-scout-play");
    const opener = await page.evaluate(() => ({
      mode: window.game.mode,
      venue: window.game.venue.id,
      tactic: window.game.aiTactic(window.game.far)?.id,
      target: window.game.matchTargetScore(),
    }));
    assert.deepEqual(opener, { mode: "challenge", venue: "park", tactic: "soft-starter", target: 7 });

    await page.evaluate(() => {
      window.game.match.near = 7;
      window.game.match.far = 5;
      window.game.checkWin();
    });
    assert.equal(await page.locator("#tourney-upgrade").isVisible(), true);
    assert.equal(await page.locator("#upgrade-choices .upgrade-choice").count(), 3);
    assert.equal(await page.locator("#btn-rematch").isHidden(), true);
    const chosenStat = await page.locator("#upgrade-choices .upgrade-choice").first().getAttribute("data-stat");
    await page.locator("#upgrade-choices .upgrade-choice").first().click();
    assert.equal(await page.locator("#scout").isVisible(), true);
    assert.match(await page.locator("#scout-title").textContent(), /Sam Ortiz/);
    assert.match(await page.locator("#scout-boosts").textContent(), /\+1/);

    await page.click("#btn-scout-play");
    const upgraded = await page.evaluate((stat) => {
      const g = window.game;
      const originalRandom = Math.random;
      let softIntent;
      let bangerIntent;
      try {
        g.match.serveBounced = true;
        g.match.returnBounced = true;
        g.far.y = 38;
        g.near.y = 15;
        g.ball.z = 2;
        Math.random = () => 0.5;
        g.challengeIndex = 0;
        g.chooseAIShot(g.far);
        softIntent = g.far.aiIntent;
        g.challengeIndex = 4;
        g.chooseAIShot(g.far);
        bangerIntent = g.far.aiIntent;
      } finally {
        Math.random = originalRandom;
        g.challengeIndex = 1;
      }
      return {
        venue: g.venue.id,
        boosted: g.near.stats[stat],
        base: g.youBuild[stat],
        boosts: g.challengeBoosts[stat],
        tactic: g.aiTactic(g.far)?.id,
        softIntent,
        bangerIntent,
      };
    }, chosenStat);
    assert.equal(upgraded.venue, "gym");
    assert.equal(upgraded.boosted, Math.min(10, upgraded.base + 1));
    assert.equal(upgraded.boosts, 1);
    assert.equal(upgraded.tactic, "retriever");
    assert.equal(upgraded.softIntent, "drop");
    assert.equal(upgraded.bangerIntent, "drive");

    await page.evaluate(() => {
      const g = window.game;
      g.meta.longest = 8;
      g.match.near = 7;
      g.match.far = 5;
      g.syncHud();
    });
    assert.match(await page.locator("#chip-objective").textContent(), /Rally 8\/8/);
    assert.equal(await page.locator("#chip-objective").evaluate((el) => el.classList.contains("done")), true);
    await page.evaluate(() => window.game.checkWin());
    assert.equal(await page.locator("#upgrade-choices .upgrade-choice").first().getAttribute("data-amount"), "2");
    assert.match(await page.locator("#upgrade-kicker").textContent(), /Bonus cleared/);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem("pb-tourney-record-v1")));
    assert.equal(records[0].bestGrade, "C");
    assert.equal(records[1].bestGrade, "B");
    assert.equal(records[1].objectives, 1);

    await page.evaluate(() => window.game.toMenu());
    const restored = await page.evaluate(() => ({
      venue: window.game.venue.id,
      active: window.game.challengeRunActive,
      boostTotal: Object.values(window.game.challengeBoosts).reduce((sum, value) => sum + value, 0),
      target: window.game.matchTargetScore(),
    }));
    assert.deepEqual(restored, { venue: "park", active: false, boostTotal: 0, target: 11 });

    // A loss ends the run: progress resets to round 1, rematch is not offered.
    await page.evaluate(() => {
      window.game.openChallenge();
      window.game.startChallenge(1);
      window.game.match.near = 3;
      window.game.match.far = 9;
      window.game.checkWin();
    });
    assert.match(await page.locator("#over-title").textContent(), /Eliminated/);
    assert.equal(await page.locator("#btn-rematch").isHidden(), true);
    assert.equal(await page.evaluate(() => window.game.gauntletCleared()), 0);
    await page.click("#btn-next-challenge");
    assert.equal(await page.locator("#challenge").isVisible(), true);
    assert.match(await page.locator("#challenge-lede").textContent(), /^0 \/ /);
    assert.equal(await page.locator("#tourney-map .map-node.locked").count(), 5);
    assert.deepEqual(errors, []);
    passed("tournament run", "scouting, AI identities, win upgrade, venue progression, loss resets run");
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

console.log(`\n${checks.length} regression groups passed.`);
