// Narration and sound. Recorded lines live at assets/audio/narration/<id>.m4a.
// Until a line is recorded (narration.json "recorded": true), the device voice
// reads it, using the line's "speak" spelling if it has one (closer to a pure
// letter sound than the letter itself, though still only a stand-in).

let lines = {};
let muted = false;

export function narrationKey(id) {
  return `narr:${id}`;
}

// Call from a scene's preload() once narration.json is in the cache.
export function preloadNarration(scene) {
  lines = scene.cache.json.get('narration') || {};
  for (const [id, line] of Object.entries(lines)) {
    if (line.recorded) {
      scene.load.audio(narrationKey(id), `assets/audio/narration/${id}.m4a`);
    }
  }
}

export function setMuted(game, value) {
  muted = value;
  game.sound.mute = value;
  if (muted) stopNarration();
}

// Must be called inside a tap handler the first time (iOS audio rule).
export function unlockAudio(scene) {
  const ctx = scene.sound.context;
  if (ctx && ctx.state !== 'running') ctx.resume();
  // iOS also keeps the device voice silent until it has spoken once during a tap.
  // A silent line wakes it up, so unrecorded lines can use it later.
  if ('speechSynthesis' in window) {
    const wake = new SpeechSynthesisUtterance(' ');
    wake.volume = 0;
    speechSynthesis.speak(wake);
  }
}

// `turn` goes up whenever something new is said or everything stops, so a
// sequence of lines can tell it has been interrupted and stop early.
let turn = 0;
let current = null;
let finishCurrent = null;
let usedSpeech = false;
// Clips allowed to run into each other (blending), each with its finish function.
const overlapping = new Map();

// Speaks a line. The promise resolves when it ends or is interrupted,
// so callers can wait before moving on.
export function say(scene, id) {
  turn++;
  stopAll();
  return speak(scene, id);
}

// Several lines one after another. Resolves true if they all played,
// false if something else was said (or everything stopped) part way.
export async function sayAll(scene, ids, onEach) {
  const mine = ++turn;
  stopAll();
  for (let i = 0; i < ids.length; i++) {
    if (turn !== mine) return false;
    onEach?.(i);
    await speak(scene, ids[i]);
  }
  return turn === mine;
}

// Letter sounds one after another, each starting `overlap` seconds before the
// last one ends, so held sounds run together into a word ("mmmaaap").
// A `gap` (seconds) instead leaves a pause between sounds, for slow listening.
// The device voice can't overlap, so with it the sounds just follow each other.
export async function blend(scene, ids, { onEach, overlap = 0.15, gap = 0 } = {}) {
  const mine = ++turn;
  stopAll();
  for (let i = 0; i < ids.length; i++) {
    if (turn !== mine) return false;
    onEach?.(i);
    const last = i === ids.length - 1;
    await clip(scene, ids[i], last || gap ? 0 : overlap);
    if (gap && !last) await pause(gap * 1000);
  }
  return turn === mine;
}

// Plays one sound without cutting off any still playing, so a finger sliding
// quickly across letters blends them. Resolves `early` seconds before it ends.
export function clip(scene, id, early = 0) {
  if (muted || !lines[id]) return Promise.resolve();
  const key = narrationKey(id);
  if (!scene.cache.audio.exists(key)) return speak(scene, id);

  return new Promise((resolve) => {
    const sound = scene.sound.add(key);
    const length = sound.duration || 1;
    const end = () => {
      if (overlapping.has(sound)) {
        overlapping.delete(sound);
        sound.stop();
        sound.destroy();
      }
      resolve();
    };
    overlapping.set(sound, end);
    sound.once('complete', end);
    sound.play();
    if (early > 0) setTimeout(resolve, Math.max(0, (length - early) * 1000));
    setTimeout(end, length * 1000 + 500); // never wait forever
  });
}

export function stopNarration() {
  turn++;
  stopAll();
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function speak(scene, id) {
  stopCurrent();
  const line = lines[id];
  if (muted || !line) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (finishCurrent === finish) finishCurrent = null;
      resolve();
    };
    finishCurrent = finish;
    // Speech "end" events are unreliable on iOS, so never wait forever.
    const safety = setTimeout(finish, 1500 + line.text.length * 90);

    const key = narrationKey(id);
    if (scene.cache.audio.exists(key)) {
      const sound = scene.sound.add(key);
      sound.once('complete', () => {
        sound.destroy();
        if (current === sound) current = null;
        finish();
      });
      current = sound;
      sound.play();
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(line.speak ?? line.text);
      u.rate = 0.85;
      u.pitch = 1.1;
      u.onend = finish;
      u.onerror = finish;
      usedSpeech = true;
      speechSynthesis.speak(u);
    } else {
      finish();
    }
  });
}

function stopCurrent() {
  if (current) {
    current.stop();
    current.destroy();
    current = null;
  }
  // Only cancel speech we started, so the silent wake-up line in unlockAudio survives.
  if (usedSpeech) {
    speechSynthesis.cancel();
    usedSpeech = false;
  }
  if (finishCurrent) finishCurrent();
}

function stopAll() {
  stopCurrent();
  for (const end of [...overlapping.values()]) end();
}

// Placeholder sound effects made from simple tones, until real SFX files exist.
const SFX = {
  good: [[523, 0, 0.12], [784, 0.1, 0.22]],
  pop: [[660, 0, 0.08]],
  soft: [[440, 0, 0.12, 392]],
  bubble: [[500, 0, 0.07, 900], [600, 0.09, 0.07, 1100], [700, 0.18, 0.07, 1300]],
  star: [[784, 0, 0.1], [988, 0.08, 0.1], [1319, 0.16, 0.3]],
  launch: [[160, 0, 1.4, 1200]],
  boom: [[140, 0, 0.6, 50]],
};

export function sfx(scene, name) {
  const ctx = scene.sound.context;
  if (muted || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  for (const [freq, start, length, slideTo] of SFX[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + start + length);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + length + 0.05);
  }
}

// iOS suspends audio when the app is backgrounded and only lets it resume on a tap.
// Phaser already pauses the game loop and sounds while hidden.
export function installAudioGuards(game) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopNarration();
  });
  window.addEventListener('pointerdown', () => {
    const ctx = game.sound.context;
    if (ctx && ctx.state !== 'running') ctx.resume();
  });
}
