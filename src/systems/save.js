// Progress saved on this device only. Every access is wrapped so a blocked or
// full localStorage (private mode, storage cleared) never breaks the game.
//
// Results are kept quietly, never shown to the child: for each word and sound,
// whether the last few tries were right the first time (1) or not (0).

const KEY = 'reading-lab-save-v1';
const KEEP = 5; // results remembered per word or sound
const SET_LOG = 10; // Word Mixer results remembered for the current set

const DEFAULTS = {
  sound: true,
  set: 1, // letter set he's working on (phonics.json "sets", counting from 1)
  setLog: [], // recent first-try results for words in the current set
  words: {}, // word -> recent first-try results
  sounds: {}, // letter -> recent first-try results
  experiments: {}, // experiment type -> times launched
  tips: [], // one-time walkthroughs already given, by name
  levelUp: 0, // set just unlocked, celebrated on the home screen
};

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) };
  } catch {
    // fall through to defaults
  }
  return structuredClone(DEFAULTS);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // progress lasts for this session only
  }
}

export function isSoundOn() {
  return data.sound;
}

export function setSoundOn(on) {
  data.sound = on;
  persist();
}

export function currentSet() {
  return data.set;
}

// Moving to a set (up or down) starts its results fresh.
export function setCurrentSet(n) {
  data.set = n;
  data.setLog = [];
  persist();
}

export function setLog() {
  return data.setLog;
}

const push = (list = [], value, keep) => [...list, value ? 1 : 0].slice(-keep);

export function recordWord(word, firstTry, inCurrentSet) {
  data.words = { ...data.words, [word]: push(data.words[word], firstTry, KEEP) };
  if (inCurrentSet) data.setLog = push(data.setLog, firstTry, SET_LOG);
  persist();
}

export function recordSound(letter, firstTry) {
  data.sounds = { ...data.sounds, [letter]: push(data.sounds[letter], firstTry, KEEP) };
  persist();
}

export function wordResults(word) {
  return data.words[word] || [];
}

export function soundResults(letter) {
  return data.sounds[letter] || [];
}

export function addExperiment(type) {
  data.experiments = { ...data.experiments, [type]: (data.experiments[type] || 0) + 1 };
  persist();
}

export function experimentCounts() {
  return data.experiments;
}

export function experimentTotal() {
  return Object.values(data.experiments).reduce((a, b) => a + b, 0);
}

export function tipShown(name) {
  return data.tips.includes(name);
}

export function markTipShown(name) {
  if (tipShown(name)) return;
  data.tips = [...data.tips, name];
  persist();
}

export function pendingLevelUp() {
  return data.levelUp;
}

export function setPendingLevelUp(n) {
  data.levelUp = n;
  persist();
}

export function resetProgress() {
  data = { ...structuredClone(DEFAULTS), sound: data.sound };
  persist();
}
