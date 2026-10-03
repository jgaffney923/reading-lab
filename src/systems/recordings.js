// Recordings made on the iPad itself (grown-ups panel → Record sounds).
// They're cleaned up here (quiet trimmed, volume evened out), kept in this
// device's IndexedDB, and put in Phaser's audio cache under the same key as a
// published narration file, so say()/clip()/blend() play them with no other
// changes. A home recording wins over a published file for the same line.
import { narrationKey } from './audio.js';

const DB_NAME = 'reading-lab-recordings';
const STORE = 'clips';
const MAX_SECONDS = 4;

let dbPromise = null;
const saved = new Set();

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run(mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  }));
}

export function hasRecording(id) {
  return saved.has(id);
}

export function recordingCount(prefix) {
  return [...saved].filter((id) => id.startsWith(prefix)).length;
}

// Puts every saved recording into the audio cache. Call once at start-up.
// Never throws: without IndexedDB the game just uses published files and speech.
export async function loadRecordings(game) {
  try {
    // Ask iOS not to clear these when storage runs low.
    navigator.storage?.persist?.().catch(() => {});
    const ids = await run('readonly', (store) => store.getAllKeys());
    for (const id of ids) {
      const clip = await run('readonly', (store) => store.get(id));
      if (clip) addToCache(game, id, clip);
    }
  } catch {
    // no saved recordings
  }
}

function addToCache(game, id, { rate, data }) {
  const ctx = game.sound.context;
  if (!ctx) return;
  const buffer = ctx.createBuffer(1, data.length, rate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) channel[i] = data[i] / 32767;
  game.cache.audio.add(narrationKey(id), buffer);
  saved.add(id);
}

export async function saveRecording(game, id, clip) {
  await run('readwrite', (store) => store.put(clip, id));
  addToCache(game, id, clip);
}

export async function deleteRecording(game, id) {
  await run('readwrite', (store) => store.delete(id));
  game.cache.audio.remove(narrationKey(id));
  saved.delete(id);
}

// The microphone, held open while the recording screen is showing.
// Echo cancellation and noise suppression are off: they eat quiet sounds
// like "fff" and "h".
export async function openMic(ctx) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const source = ctx.createMediaStreamSource(stream);
  let chunks = null;
  let onFull = null;
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    e.outputBuffer.getChannelData(0).fill(0);
    if (!chunks) return;
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    if (chunks.length * 4096 >= MAX_SECONDS * ctx.sampleRate) onFull?.();
  };
  source.connect(processor);
  processor.connect(ctx.destination);

  return {
    // Starts recording. `whenFull` runs if it hits the time limit.
    start(whenFull) {
      chunks = [];
      onFull = whenFull;
    },
    // Stops and returns the cleaned-up clip, or null if it was too quiet.
    stop() {
      const raw = chunks || [];
      chunks = null;
      onFull = null;
      const samples = new Float32Array(raw.reduce((n, c) => n + c.length, 0));
      let at = 0;
      for (const c of raw) {
        samples.set(c, at);
        at += c.length;
      }
      return cleanUp(samples, ctx.sampleRate);
    },
    close() {
      chunks = null;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

// Trims the quiet at both ends, evens out the volume, fades the edges so they
// don't click, and halves the sample rate to keep the stored clip small.
export function cleanUp(samples, rate) {
  const win = Math.round(rate / 50); // 20 ms
  const skip = Math.round(rate * 0.12); // ignore the tap on the screen
  const levels = [];
  for (let i = skip; i + win <= samples.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += samples[j] * samples[j];
    levels.push(Math.sqrt(sum / win));
  }
  const loudest = Math.max(0, ...levels);
  if (loudest < 0.01) return null; // nothing said

  // Speech: windows within about 18 dB of the loudest part.
  const floor = loudest * 0.125;
  const first = levels.findIndex((l) => l > floor);
  const last = levels.length - 1 - [...levels].reverse().findIndex((l) => l > floor);
  const start = Math.max(0, skip + first * win - Math.round(rate * 0.05));
  const end = Math.min(samples.length, skip + (last + 1) * win + Math.round(rate * 0.1));
  const speech = samples.subarray(start, end);

  let peak = 0;
  for (const s of speech) peak = Math.max(peak, Math.abs(s));
  const gain = Math.min(0.9 / peak, 30);

  const outRate = rate / 2;
  const out = new Int16Array(Math.floor(speech.length / 2));
  const fadeIn = Math.round(outRate * 0.01), fadeOut = Math.round(outRate * 0.04);
  for (let i = 0; i < out.length; i++) {
    let v = ((speech[2 * i] + speech[2 * i + 1]) / 2) * gain;
    if (i < fadeIn) v *= i / fadeIn;
    if (i > out.length - fadeOut) v *= (out.length - i) / fadeOut;
    out[i] = Math.round(Math.max(-1, Math.min(1, v)) * 32767);
  }
  return { rate: outRate, data: out };
}
