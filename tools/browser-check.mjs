// Automated checks in a real browser, for bugs that only show up while the game runs.
// Needs Playwright on this computer (it's not part of the app):
//   npm install -g playwright      then      node tools/browser-check.mjs
// Uses Playwright's Chromium; set PW_CHANNEL=msedge to drive Edge instead.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

// Find Playwright locally or in the global npm folder.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return require(join(globalRoot, 'playwright'));
  }
}
const { chromium } = loadPlaywright();

const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2',
  '.m4a': 'audio/mp4', '.txt': 'text/plain',
};

// A tiny static server. The game is only reachable from tests on "localhost".
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = path || 'index.html';
  try {
    const body = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, 'localhost', resolve));
const base = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({
  ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  // A pretend microphone (a steady tone) for the recorder check.
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});
const results = [];

async function check(name, fn) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 1024 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page, context);
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    results.push([name, null]);
  } catch (e) {
    results.push([name, e.message]);
  }
  await context.close();
}

// Opens the game with the walkthroughs already seen, logging every line the
// device voice is asked to say along with which scenes were running.
async function openGame(page, url = base) {
  await page.addInitScript(() => {
    localStorage.setItem('reading-lab-save-v1', JSON.stringify({ tips: ['mixer', 'soundlab'] }));
    window.__said = [];
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => {
      const scenes = window.__game?.scene.getScenes(true).map((s) => s.sys.settings.key) ?? [];
      if (u.text.trim()) window.__said.push({ text: u.text, scenes });
      speak(u);
    };
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__game?.scene.isActive('Boot'));
}

async function startScene(page, key) {
  await page.evaluate((k) => window.__game.scene.start(k), key);
  await page.waitForFunction((k) => window.__game.scene.isActive(k), key);
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await check('quick taps leave a letter tile where it started', async (page) => {
  await openGame(page);
  await startScene(page, 'Home');
  await pause(500);
  const { y0, y1 } = await page.evaluate(async () => {
    const tile = window.__game.scene.getScene('Home').shelf.list[0];
    const y0 = tile.y;
    for (let i = 0; i < 4; i++) {
      tile.hop();
      await new Promise((r) => setTimeout(r, 70));
    }
    await new Promise((r) => setTimeout(r, 800));
    return { y0, y1: tile.y };
  });
  if (y1 !== y0) throw new Error(`tile ended at y=${y1}, started at y=${y0}`);
});

// The walkthrough is marked as seen, so this is like every visit after the first.
await check('Sound Lab shows letters on a later visit', async (page) => {
  await openGame(page);
  await startScene(page, 'SoundLab');
  await page.waitForFunction(() => window.__game.scene.getScene('SoundLab').tiles.length === 3, null, { timeout: 5000 });
});

// Leaving Sound Lab part way through a turn must not carry its lines onto the home screen.
async function leaveSoundLabDuring(page, pickRight) {
  await openGame(page);
  await startScene(page, 'SoundLab');
  await page.waitForFunction(() => window.__game.scene.getScene('SoundLab').state === 'ask');
  await page.evaluate((right) => {
    const lab = window.__game.scene.getScene('SoundLab');
    lab.firstTry = false; // so success always says an effort line
    const tile = lab.tiles.find((t) => (t.letter === lab.target) === right);
    lab.onTap(tile);
    lab.scene.start('Home'); // what the 🏠 button does: stops Sound Lab too
  }, pickRight);
  await pause(4000);
  const leaked = await page.evaluate(() => window.__said.filter((s) => s.scenes.includes('Home')));
  if (leaked.length) throw new Error(`said on the home screen: ${leaked.map((s) => `"${s.text}"`).join(', ')}`);
}

await check('leaving Sound Lab after picking another letter stays quiet', (page) => leaveSoundLabDuring(page, false));
await check('leaving Sound Lab after picking the right letter stays quiet', (page) => leaveSoundLabDuring(page, true));

await check('the recorder saves a sound and turns the microphone off after each recording', async (page) => {
  await page.addInitScript(() => {
    window.__tracks = [];
    const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => {
      const stream = await get(c);
      window.__tracks.push(...stream.getTracks());
      return stream;
    };
  });
  await openGame(page);
  await page.evaluate(() => window.__game.sound.context.resume());
  await startScene(page, 'Recorder');
  const micOn = () => page.evaluate(() => window.__tracks.filter((t) => t.readyState === 'live').length);
  for (let round = 0; round < 2; round++) {
    await page.evaluate(async () => {
      const rec = window.__game.scene.getScene('Recorder');
      rec.open(0);
      rec.recUi.rec.emit('pointerup');
    });
    await page.waitForFunction(() => window.__game.scene.getScene('Recorder').recording);
    if ((await micOn()) !== 1) throw new Error('microphone not on while recording');
    await pause(1200);
    await page.evaluate(() => window.__game.scene.getScene('Recorder').recUi.rec.emit('pointerup'));
    await page.waitForFunction(() => !window.__game.scene.getScene('Recorder').recording);
    if ((await micOn()) !== 0) throw new Error(`microphone still on after recording ${round + 1}`);
  }
  await page.waitForFunction(() => window.__game.cache.audio.exists('narr:snd.s'), null, { timeout: 5000 });
});

await check('the service worker caches every file and the game reloads offline', async (page, context) => {
  await openGame(page, `${base}?sw=1`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  const { cached, wanted } = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const source = await (await fetch(reg.active.scriptURL)).text();
    const wanted = source.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].match(/'[^']+'/g).length;
    const name = (await caches.keys()).find((n) => n.startsWith('reading-lab-'));
    const cached = (await (await caches.open(name)).keys()).length;
    return { cached, wanted };
  });
  if (cached < wanted) throw new Error(`cached ${cached} of ${wanted} files`);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Boot'), null, { timeout: 10000 });
});

await browser.close();
server.close();

for (const [name, problem] of results) console.log(`${problem ? 'FAIL' : 'ok  '} ${name}${problem ? `\n     ${problem}` : ''}`);
process.exit(results.some(([, problem]) => problem) ? 1 : 0);
