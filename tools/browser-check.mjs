// Automated checks in a real browser, for bugs that only show up while the game runs.
// Needs Playwright on this computer (it's not part of the app):
//   npm install -g playwright      then      node tools/browser-check.mjs
// Uses Playwright's Chromium; set PW_CHANNEL=msedge to drive Edge instead, or
// PW_BROWSER=webkit for Safari's engine (after: playwright install webkit).
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
const engine = process.env.PW_BROWSER || 'chromium';
const browserType = loadPlaywright()[engine];

const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2',
  '.m4a': 'audio/mp4', '.txt': 'text/plain',
};

// A tiny static server. The game is only reachable from tests on "localhost".
async function serveFiles(req, res) {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = path || 'index.html';
  try {
    const body = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}

async function startServer() {
  const server = createServer(serveFiles);
  await new Promise((resolve) => server.listen(0, 'localhost', resolve));
  return { server, url: `http://localhost:${server.address().port}/` };
}
const { server, url: base } = await startServer();

const browser = await browserType.launch(engine === 'chromium' ? {
  ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  // A pretend microphone (a steady tone) for the recorder check.
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
} : {});
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
async function openGame(page, url = base, save = {}) {
  await page.addInitScript((extra) => {
    if (!sessionStorage.getItem('saved')) {
      localStorage.setItem('reading-lab-save-v1', JSON.stringify({ tips: ['mixer', 'soundlab'], ...extra }));
      sessionStorage.setItem('saved', '1');
    }
    window.__said = [];
    if (!('speechSynthesis' in window)) return;
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => {
      const scenes = window.__game?.scene.getScenes(true).map((s) => s.sys.settings.key) ?? [];
      if (u.text.trim()) window.__said.push({ text: u.text, scenes });
      speak(u);
    };
  }, save);
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
  // Tap, wait until the tile is in the air, tap again: the second hop starts
  // mid-flight, as it does when a child taps quickly. Animations run in slow
  // motion meanwhile, because headless frames are so slow that a whole hop
  // would otherwise fit in two frames and the taps would never overlap.
  const tile = 'window.__game.scene.getScene("Home").shelf.list[0]';
  const tweens = 'window.__game.scene.getScene("Home").tweens';
  const y0 = await page.evaluate(`${tile}.y`);
  await page.evaluate(`${tweens}.timeScale = 0.02; ${tile}.hop()`);
  await page.waitForFunction(`${tile}.y < ${y0} - 10`, null, { timeout: 20000 });
  await page.evaluate(`${tile}.hop(); ${tweens}.timeScale = 1`);
  await page.waitForFunction(`window.__game.scene.getScene("Home").tweens.getTweensOf(${tile}).length === 0`, null, { timeout: 30000 });
  const y1 = await page.evaluate(() => window.__game.scene.getScene('Home').shelf.list[0].y);
  if (y1 !== y0) throw new Error(`tile ended at y=${y1}, started at y=${y0}`);
});

// The walkthrough is marked as seen, so this is like every visit after the first.
await check('Cluck Sounds shows letters on a later visit', async (page) => {
  await openGame(page);
  await startScene(page, 'SoundLab');
  await page.waitForFunction(() => window.__game.scene.getScene('SoundLab').tiles.length === 3, null, { timeout: 5000 });
});

// Leaving Cluck Sounds part way through a turn must not carry its lines onto the home screen.
async function leaveSoundLabDuring(page, pickRight) {
  await openGame(page);
  await startScene(page, 'SoundLab');
  await page.waitForFunction(() => window.__game.scene.getScene('SoundLab').state === 'ask');
  await page.evaluate((right) => {
    const lab = window.__game.scene.getScene('SoundLab');
    lab.firstTry = false; // so success always says an effort line
    const tile = lab.tiles.find((t) => (t.letter === lab.target) === right);
    lab.onTap(tile);
    lab.scene.start('Home'); // what the 🏠 button does: stops Cluck Sounds too
  }, pickRight);
  await pause(4000);
  const leaked = await page.evaluate(() => window.__said.filter((s) => s.scenes.includes('Home')));
  if (leaked.length) throw new Error(`said on the home screen: ${leaked.map((s) => `"${s.text}"`).join(', ')}`);
}

await check('leaving Cluck Sounds after picking another letter stays quiet', (page) => leaveSoundLabDuring(page, false));
await check('leaving Cluck Sounds after picking the right letter stays quiet', (page) => leaveSoundLabDuring(page, true));

// Headless frames are slow and Phaser caps each frame's time step, so game time
// runs several times slower than real time here. Speeds a scene back up.
async function speedUp(page, key, times = 8) {
  await page.evaluate(([k, t]) => {
    const scene = window.__game.scene.getScene(k);
    scene.time.timeScale = t;
    scene.tweens.timeScale = t;
  }, [key, times]);
}

await check('the yard shows the hens unlocked so far and a chick per egg hatched', async (page) => {
  await openGame(page, base, { set: 2, rewards: { hatch: 3, dance: 1 } });
  await startScene(page, 'Home');
  const yard = await page.evaluate(() => {
    const home = window.__game.scene.getScene('Home');
    const hens = home.yard.list.filter((o) => o.id).map((o) => o.id);
    const chicks = home.yard.list.filter((o) => o.text === '🐥').length;
    const textures = hens.every((id) => window.__game.textures.exists(`hen:${id}`));
    return { hens, chicks, textures };
  });
  if (yard.hens.join() !== 'gertrude,oreo,rhoda,bella') throw new Error(`hens: ${yard.hens.join()}`);
  if (yard.chicks !== 3) throw new Error(`${yard.chicks} chicks, expected 3`);
  if (!yard.textures) throw new Error('a hen drawing did not load');
});

await check('new letters bring a new hen to the coop', async (page) => {
  await openGame(page, base, { set: 3, levelUp: 3 });
  await startScene(page, 'Home');
  await speedUp(page, 'Home');
  // The letters' sounds are said first, then Marsala pops in.
  await page.waitForFunction(() => {
    const home = window.__game.scene.getScene('Home');
    return home.children.list.some((o) => o.depth === 4000 && o.list?.some((c) => c.id === 'marsala' && c.visible && c.scale > 0.9));
  }, null, { timeout: 40000 });
});

await check('a full Egg Words round ends at the reward', async (page) => {
  await openGame(page);
  await startScene(page, 'Mixer');
  await speedUp(page, 'Mixer');
  for (let word = 0; word < 5; word++) {
    await page.waitForFunction((n) => {
      const m = window.__game.scene.getScene('Mixer');
      return m.index === n && m.state === 'listen' && !m.cards.length;
    }, word, { timeout: 60000 });
    // Hear every sound (the slide nudge is skipped), then pick the right picture.
    await page.evaluate(() => {
      const m = window.__game.scene.getScene('Mixer');
      m.slideNudged = true;
      m.letters.forEach((_, i) => m.tapLetter(i));
    });
    await page.waitForFunction(() => window.__game.scene.getScene('Mixer').state === 'choose', null, { timeout: 60000 });
    await page.evaluate(() => {
      const m = window.__game.scene.getScene('Mixer');
      m.tapCard(m.cards.find((c) => c.word === m.word));
    });
  }
  await page.waitForFunction(() => window.__game.scene.isActive('Reward'), null, { timeout: 60000 });
});

for (const type of ['hatch', 'dance', 'feathers']) {
  await check(`the ${type} reward plays to the end and is counted`, async (page) => {
    await openGame(page);
    await startScene(page, 'Reward');
    await speedUp(page, 'Reward');
    await page.evaluate((t) => {
      const reward = window.__game.scene.getScene('Reward');
      reward.reward = { type: t, line: `reward.${t}` };
      reward.children.list.find((o) => o.input?.enabled).emit('pointerup'); // the big egg button
    }, type);
    await page.waitForFunction(() => window.__game.scene.getScene('Reward').done, null, { timeout: 40000 });
    const count = await page.evaluate((t) => JSON.parse(localStorage.getItem('reading-lab-save-v1')).rewards[t], type);
    if (count !== 1) throw new Error(`saved count is ${count}`);
  });
}

// Only Chromium has a pretend microphone.
if (engine === 'chromium') await check('the recorder saves a sound and turns the microphone off after each recording', async (page) => {
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
    // Chromium's pretend microphone beeps about once a second, so record long enough to catch one.
    await pause(2500);
    await page.evaluate(() => window.__game.scene.getScene('Recorder').recUi.rec.emit('pointerup'));
    await page.waitForFunction(() => !window.__game.scene.getScene('Recorder').recording);
    if ((await micOn()) !== 0) throw new Error(`microphone still on after recording ${round + 1}`);
  }
  const saved = await page.waitForFunction(() => window.__game.cache.audio.exists('narr:snd.s'), null, { timeout: 15000 })
    .then(() => true, () => false);
  if (!saved) {
    const status = await page.evaluate(() => window.__game.scene.getScene('Recorder').modal?.list.find((o) => o.type === 'Text' && o.style.color === '#8e5cff')?.text);
    throw new Error(`sound not saved; the recorder said: "${status}"`);
  }
});

// Offline is tested by shutting down a server of its own, which works in every
// browser (Playwright's offline switch makes WebKit fail on reload).
await check('the service worker caches every file and the game reloads offline', async (page) => {
  const own = await startServer();
  await openGame(page, `${own.url}?sw=1`);
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
  own.server.closeAllConnections();
  await new Promise((resolve) => own.server.close(resolve));
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Boot'), null, { timeout: 10000 });
});

await browser.close();
server.close();

console.log(`Browser: ${engine}`);
for (const [name, problem] of results) console.log(`${problem ? 'FAIL' : 'ok  '} ${name}${problem ? `\n     ${problem}` : ''}`);
process.exit(results.some(([, problem]) => problem) ? 1 : 0);
