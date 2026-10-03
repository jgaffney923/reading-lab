// Turns a raw recording into a game narration file, and marks the line as recorded.
// Usage: node tools/prepare-narration.mjs <recording> <line-id> [--placeholder]
//   e.g. node tools/prepare-narration.mjs "recordings-raw/Voice 3.m4a" intro.solid
// --placeholder marks the file as a stand-in computer voice, still to be recorded
// for real (see make-placeholder-voices.mjs). Without it, the line counts as done.
// Needs ffmpeg: on PATH, or set FFMPEG to its full path.
//
// What it does to the sound:
// - Trims the quiet at both ends, ignoring short clicks (like the one when the
//   phone starts recording).
// - Short fades so the cut edges never pop.
// - Evens out loudness so every line plays at the same volume.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const placeholder = args.includes('--placeholder');
const [input, id] = args.filter((a) => a !== '--placeholder');
if (!input || !id) {
  console.error('Usage: node tools/prepare-narration.mjs <recording> <line-id>');
  process.exit(1);
}

const at = (p) => new URL(`../${p}`, import.meta.url);
const narrationPath = at('src/data/narration.json');
const lines = JSON.parse(readFileSync(narrationPath, 'utf8'));
if (!lines[id]) {
  console.error(`No line "${id}" in src/data/narration.json`);
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Recording not found: ${input}`);
  process.exit(1);
}

const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const { start, end } = findSpeech(input);
const length = end - start;
const filters = [
  `atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)}`, 'asetpts=N/SR/TB',
  'afade=t=in:d=0.04', `afade=t=out:st=${(length - 0.08).toFixed(3)}:d=0.08`,
  'loudnorm=I=-16:TP=-1.5:LRA=11', 'aresample=48000',
].join(',');

const output = `assets/audio/narration/${id}.m4a`;
execFileSync(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
  '-af', filters, '-ac', '1', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
  fileURLToPath(at(output)),
], { stdio: 'inherit' });

// Finds where speech starts and ends. Speech = loud (above -28 dB) on average
// for 0.15 s; a click is much shorter, so it doesn't count. Keeps a little
// lead-in and tail so soft sounds like the "h" in "Hi" survive.
function findSpeech(file) {
  const RATE = 16000, WIN = RATE / 50; // 20 ms windows
  const pcm = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', file,
    '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  const energy = [];
  for (let i = 0; i + WIN <= samples.length; i += WIN) {
    let sum = 0;
    for (let j = i; j < i + WIN; j++) sum += samples[j] * samples[j];
    energy.push(sum / WIN / 32768 ** 2);
  }
  const SPAN = 8; // 8 windows = 160 ms
  const loud = (i) => {
    let sum = 0;
    for (let k = i; k < i + SPAN; k++) sum += energy[k];
    return 10 * Math.log10(sum / SPAN + 1e-12) > -28;
  };
  let first = 0, last = energy.length - SPAN;
  while (first < last && !loud(first)) first++;
  while (last > first && !loud(last)) last--;
  const seconds = (w) => (w * WIN) / RATE;
  return {
    start: Math.max(0, seconds(first) - 0.12),
    end: Math.min(seconds(energy.length), seconds(last + SPAN) + 0.2),
  };
}

// Mark the line as recorded by rewriting just its own line (each entry is on
// one line), so the file keeps its grouping and blank lines.
// Keeps the line's other fields (a sound's "speak" and "note").
const { placeholder: _old, ...rest } = lines[id];
const entry = { ...rest, recorded: true, ...(placeholder && { placeholder: true }) };
const body = Object.entries(entry).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ');
const text = readFileSync(narrationPath, 'utf8');
const pattern = new RegExp(`^  "${id.replace(/\./g, '\\.')}": \\{.*\\}(,?)$`, 'm');
if (!pattern.test(text)) throw new Error(`Couldn't find the line for "${id}" to update`);
writeFileSync(narrationPath, text.replace(pattern, (_, comma) => `  "${id}": { ${body} }${comma}`));
const who = placeholder ? 'placeholder voice' : 'recorded';
console.log(`${output}  <-  "${lines[id].text}"  (${who}, kept ${start.toFixed(2)}s to ${end.toFixed(2)}s)`);
