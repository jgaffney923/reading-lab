// Letters, words and pictures from phonics.json, and the choices that depend on
// what he has learned so far: which words and sounds to practice, which
// look-alikes to offer, and when he's ready for new letters (PLAN.md 5.6).
import { currentSet, setLog, wordResults, soundResults } from './save.js';

let data = null;

export function initPhonics(json) {
  data = json;
}

export const setCount = () => data.sets.length;
export const isVowel = (letter) => data.vowels.includes(letter);
export const sndId = (letter) => `snd.${letter}`;
export const wordId = (word) => `word.${word}`;
export const picture = (word) => data.pictures[word];
// One letter, one sound in sets 1-4. Digraphs (sh, ch...) will change this.
export const lettersOf = (word) => [...word];

export const lettersOfSet = (n) => data.sets[n - 1].letters;
export const lettersUpTo = (n) => data.sets.slice(0, n).flatMap((s) => s.letters);
export const wordsOfSet = (n) => data.sets[n - 1].words;
export const wordsUpTo = (n) => data.sets.slice(0, n).flatMap((s) => s.words);
export const setOfWord = (word) => data.sets.findIndex((s) => s.words.includes(word)) + 1;
export const setOfLetter = (letter) => data.sets.findIndex((s) => s.letters.includes(letter)) + 1;

// c and k make the same sound, so one is never offered as a look-alike for the other.
const SAME_SOUND = [['c', 'k']];
export function sameSound(a, b) {
  return a === b || SAME_SOUND.some((group) => group.includes(a) && group.includes(b));
}

// New things and things missed lately come up more often.
function weight(results, base) {
  if (!results.length) return base + 2;
  const misses = results.slice(-3).filter((r) => !r).length;
  return base + misses * 3;
}

function takeWeighted(pool) {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  const index = pool.findIndex((item) => (roll -= item.weight) <= 0);
  return pool.splice(index === -1 ? pool.length - 1 : index, 1)[0].value;
}

// Words for one Word Mixer round: mostly the current set, a few to review.
export function chooseWords(count) {
  const set = currentSet();
  const pool = wordsUpTo(set).map((word) => ({
    value: word,
    weight: weight(wordResults(word), setOfWord(word) === set ? 3 : 0.6),
  }));
  const words = [];
  while (words.length < count && pool.length) words.push(takeWeighted(pool));
  return words;
}

// Two other words to show as pictures beside the real one: the ones sharing
// the most letters in the same places (map -> nap, tap), never the same picture.
export function lookAlikes(word, count = 2) {
  const scored = wordsUpTo(currentSet())
    .filter((w) => w !== word && picture(w) !== picture(word))
    .map((w) => {
      let score = Math.random() * 0.9;
      [...w].forEach((letter, i) => {
        if (letter === word[i]) score += 2;
        else if (word.includes(letter)) score += 0.5;
      });
      return { w, score };
    });
  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(({ w }) => w);
}

// Letters for one Sound Lab round, never the same one twice in a row.
export function chooseSounds(count) {
  const set = currentSet();
  const letters = [];
  while (letters.length < count) {
    const pool = lettersUpTo(set)
      .filter((l) => l !== letters[letters.length - 1])
      .map((l) => ({ value: l, weight: weight(soundResults(l), setOfLetter(l) === set ? 3 : 1) }));
    letters.push(takeWeighted(pool));
  }
  return letters;
}

// Other letters to offer beside the one being asked for.
export function soundLookAlikes(letter, count = 2) {
  const pool = lettersUpTo(currentSet()).filter((l) => !sameSound(l, letter));
  return Phaser.Utils.Array.Shuffle(pool).slice(0, count);
}

// Ready for new letters: 8 of the last 10 current-set words right on the
// first try, and at least 6 different words from the set seen.
export function readyToMoveOn() {
  const set = currentSet();
  if (set >= setCount()) return false;
  const log = setLog();
  const words = wordsOfSet(set);
  const seen = words.filter((w) => wordResults(w).length).length;
  return log.length >= 10 && log.filter(Boolean).length >= 8 && seen >= Math.min(6, words.length);
}

// For the parent corner: sounds and words with a shaky recent record.
export function needsPractice() {
  const set = currentSet();
  const shaky = (results) => {
    const recent = results.slice(-3);
    return recent.length >= 2 && recent.filter(Boolean).length / recent.length < 0.67;
  };
  return {
    sounds: lettersUpTo(set).filter((l) => shaky(soundResults(l))),
    words: wordsUpTo(set).filter((w) => shaky(wordResults(w))),
  };
}
