// Writes narration-script.md: every line to record, how to say it, and which are still missing.
// Usage: node tools/make-narration-script.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const at = (p) => new URL(`../${p}`, import.meta.url);
const lines = JSON.parse(readFileSync(at('src/data/narration.json'), 'utf8'));

function status(id, { recorded, placeholder }) {
  const hasFile = existsSync(at(`assets/audio/narration/${id}.m4a`));
  if (hasFile && recorded && placeholder) return 'TO RECORD (computer voice for now)';
  if (hasFile && recorded) return 'done';
  if (hasFile) return 'file present, but not marked recorded';
  if (recorded) return 'MISSING FILE (marked recorded)';
  return 'TO RECORD';
}

const entries = Object.entries(lines).map(([id, line]) => ({ id, ...line, status: status(id, line) }));
const done = entries.filter((e) => e.status === 'done').length;
const sounds = entries.filter((e) => e.id.startsWith('snd.'));
const words = entries.filter((e) => e.id.startsWith('word.'));
const other = entries.filter((e) => !sounds.includes(e) && !words.includes(e));
const soundsDone = sounds.filter((e) => e.status === 'done').length;

const table = (rows, withNote) => [
  withNote ? '| File name (id) | Say this | How | Status |' : '| File name (id) | Say this | Status |',
  withNote ? '|---|---|---|---|' : '|---|---|---|',
  ...rows.map((e) => withNote
    ? `| \`${e.id}\` | **${e.text}** | ${e.note ?? ''} | ${e.status} |`
    : `| \`${e.id}\` | ${e.text} | ${e.status} |`),
].join('\n');

const md = `# Narration script

**${done} of ${entries.length} lines recorded** (letter sounds: ${soundsDone} of ${sounds.length}).

How to add a recording (details in README.md):
1. Record the line (iPhone Voice Memos is fine) and save it into \`recordings-raw/\`.
2. Run \`node tools/prepare-narration.mjs "recordings-raw/<file>.m4a" <id>\`.
3. Regenerate this file with \`node tools/make-narration-script.mjs\`.

Tips: quiet room, phone about a hand's width from your mouth, a short pause
before and after each line, one line per file. Upbeat and slow, as if talking
to a 5-year-old.

## 1. Letter sounds — record these first
The computer voice can't say pure sounds, so these matter most. Say the
**sound**, never the letter's name.
- Sounds you can hold (m, s, f, l, n, r, v, z, and the vowels): hold for about one second, "mmmm".
- Short sounds (b, c/k, d, g, h, j, p, t, w, y, x): as short and crisp as you can, with no "uh" after. "t" is a puff of air, not "tuh".
- Vowels are the short sounds: a as in ant, e as in egg, i as in itch, o as in octopus, u as in up.
- Record each one twice and keep the cleaner one.

${table(sounds, true)}

## 2. Words
Say each word normally and clearly, like reading it to him. Don't stretch it out:
the game blends the sound recordings itself.

${table(words, false)}

## 3. Instructions and praise

${table(other, false)}
`;

writeFileSync(at('narration-script.md'), md);
console.log(`narration-script.md: ${done} of ${entries.length} recorded`);
