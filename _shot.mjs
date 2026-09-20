import { chromium } from "playwright-core";
const [,, url, out, w='1500', h='700'] = process.argv;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url); await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage: true }); await b.close();
