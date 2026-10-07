// Draws the app icon (Gertrude's head on a sky-blue background) as PNGs,
// from her drawing in src/art/chickens.js.
// Needs Playwright on this computer (not part of the app): npm install -g playwright
// Usage: node tools/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { chickenSVG } from '../src/art/chickens.js';

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    return require(join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const { chromium } = loadPlaywright();

const SKY = '#8ecbff';
const GRASS = '#8fd16a';
// Her head, crown and beak, with room around them so "maskable" crops
// (which keep only the middle 80%) never cut anything off.
const HEAD_VIEW = '84 4 148 148';

const svg = chickenSVG('gertrude')
  .replace('viewBox="0 0 220 220" width="220" height="220"', `viewBox="${HEAD_VIEW}" width="100%" height="100%"`);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><style>
    html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden;
      background: linear-gradient(${SKY} 72%, ${GRASS} 72%); }
    svg { display: block; }
  </style>${svg}`);
  writeFileSync(new URL(`../assets/icons/icon-${size}.png`, import.meta.url), await page.screenshot());
  console.log(`assets/icons/icon-${size}.png`);
}
await browser.close();
