// Screenshot the live game for the docs pages. Run: node tools/shots.mjs [url]
// Writes img/shot-*.jpg (desktop 1280x800 and phone 390x844).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const url = process.argv[2] || "https://vspickleball.com/";
mkdirSync("img", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

async function shot(page, name, sel = "#game", opts = {}) {
  const el = sel ? await page.$(sel) : page;
  await (el || page).screenshot({ path: `img/${name}.jpg`, type: "jpeg", quality: 84, ...opts });
  console.log("wrote", name);
}
async function fresh(viewport, mobile = false) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1.5 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return page;
}

// desktop
let page = await fresh({ width: 1280, height: 800 });
const ids = await page.evaluate(() => ({ game: !!document.querySelector("#game"), stage: !!document.querySelector("#stage"), canvas: !!document.querySelector("canvas") }));
console.log(ids);
const SEL = "#app";
await shot(page, "menu", SEL);

await page.click("#btn-cpu"); await page.waitForTimeout(500);
await shot(page, "roster", SEL);

await page.click("#btn-start-match"); await page.waitForTimeout(900);
await page.click("#btn-coach-skip").catch(() => {}); await page.waitForTimeout(300);
await page.keyboard.press("Space"); await page.waitForTimeout(650);
await shot(page, "singles", SEL);
await page.waitForTimeout(900);
await page.keyboard.down("w"); await page.waitForTimeout(700); await page.keyboard.up("w");
await shot(page, "singles-rally", SEL);

page = await fresh({ width: 1280, height: 800 });
await page.click("#btn-doubles"); await page.waitForTimeout(400);
await page.click("#btn-start-match"); await page.waitForTimeout(900);
await page.click("#btn-coach-skip").catch(() => {}); await page.waitForTimeout(300);
await page.keyboard.press("Space"); await page.waitForTimeout(700);
await shot(page, "doubles", SEL);

page = await fresh({ width: 1280, height: 800 });
await page.click("#btn-challenge"); await page.waitForTimeout(500);
await shot(page, "tournament", SEL);

// phone
page = await fresh({ width: 390, height: 844 }, true);
await shot(page, "phone-menu", null, { fullPage: false });
await page.click("#btn-cpu"); await page.waitForTimeout(400);
await page.click("#btn-start-match"); await page.waitForTimeout(900);
await page.click("#btn-coach-skip").catch(() => {}); await page.waitForTimeout(300);
await page.click("#btn-swing").catch(() => {}); await page.waitForTimeout(650);
await shot(page, "phone-match", null, { fullPage: false });

await browser.close();
