// Checks src/data/phonics.json against the phonics rules in PLAN.md section 11,
// and that every sound and word has a narration line.
// Usage: node tools/check-content.mjs          (report problems)
//        node tools/check-content.mjs --fix    (also add missing snd.* / word.* lines)
import { readFileSync, writeFileSync } from 'node:fs';

const at = (p) => new URL(`../${p}`, import.meta.url);
const phonics = JSON.parse(readFileSync(at('src/data/phonics.json'), 'utf8'));
const narrationText = readFileSync(at('src/data/narration.json'), 'utf8');
const lines = JSON.parse(narrationText);
const fix = process.argv.includes('--fix');

const problems = [];
const seenLetters = new Set();
const seenWords = new Set();
const picOwners = new Map();

phonics.sets.forEach((set, i) => {
  const n = i + 1;
  for (const letter of set.letters) {
    if (seenLetters.has(letter)) problems.push(`set ${n}: letter "${letter}" already taught in an earlier set`);
    if (!phonics.sounds[letter]) problems.push(`set ${n}: letter "${letter}" has no entry in "sounds"`);
    seenLetters.add(letter);
  }
  if (!set.letters.some((l) => phonics.vowels.includes(l)) && i === 0) {
    problems.push('set 1 has no vowel, so no words can be made');
  }
  for (const word of set.words) {
    if (seenWords.has(word)) problems.push(`set ${n}: "${word}" appears twice`);
    seenWords.add(word);
    const missing = [...word].filter((l) => !seenLetters.has(l));
    if (missing.length) problems.push(`set ${n}: "${word}" uses letters not taught yet: ${missing.join(' ')}`);
    if (![...word].some((l) => phonics.vowels.includes(l))) problems.push(`set ${n}: "${word}" has no vowel`);
    const pic = phonics.pictures[word];
    if (!pic) problems.push(`set ${n}: "${word}" has no picture`);
    else if (picOwners.has(pic)) problems.push(`"${word}" and "${picOwners.get(pic)}" share the picture ${pic}`);
    else picOwners.set(pic, word);
  }
});

for (const word of Object.keys(phonics.pictures)) {
  if (!seenWords.has(word)) problems.push(`picture for "${word}", which isn't in any set`);
}

// Narration: one line per sound and per word.
const wanted = [
  ...[...seenLetters].map((l) => [`snd.${l}`, {
    text: phonics.sounds[l]?.say ?? l,
    speak: phonics.sounds[l]?.speak ?? l,
    note: phonics.sounds[l]?.how ?? '',
    recorded: false,
  }]),
  ...[...seenWords].map((w) => [`word.${w}`, { text: w, recorded: false }]),
];
const missingLines = wanted.filter(([id]) => !lines[id]);
const idsUsedByCode = ['boot.welcome', 'soundlab.find', 'mixer.thatOne', 'reward.full'];
for (const id of idsUsedByCode) if (!lines[id]) problems.push(`narration.json is missing "${id}"`);

if (missingLines.length && fix) {
  // Append one entry per line, keeping the file's one-line-per-entry layout
  // (prepare-narration.mjs relies on it).
  const body = narrationText.replace(/\s*\}\s*$/, '');
  const entry = ([id, obj]) => `  "${id}": { ${Object.entries(obj).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ')} }`;
  const sounds = missingLines.filter(([id]) => id.startsWith('snd.')).map(entry);
  const words = missingLines.filter(([id]) => id.startsWith('word.')).map(entry);
  const groups = [sounds, words].filter((g) => g.length).map((g) => g.join(',\n'));
  writeFileSync(at('src/data/narration.json'), `${body},\n\n${groups.join(',\n\n')}\n}\n`);
  console.log(`Added ${missingLines.length} narration lines.`);
} else if (missingLines.length) {
  problems.push(`${missingLines.length} sounds/words have no narration line (run with --fix): ${missingLines.slice(0, 8).map(([id]) => id).join(', ')}…`);
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${phonics.sets.length} sets, ${seenLetters.size} letters, ${seenWords.size} words.`);
