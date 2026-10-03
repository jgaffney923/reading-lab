import { say } from '../systems/audio.js';

// A short cheer after each success: praise for a first try, an effort line
// after he needed help. Skipped some of the time so it doesn't get old.
const PRAISE = ['praise.1', 'praise.2', 'praise.3', 'praise.4', 'praise.5'];
const EFFORT = ['effort.1', 'effort.2', 'effort.3'];

export function praise(scene, firstTry) {
  if (firstTry && Math.random() < 0.4) return Promise.resolve();
  return say(scene, Phaser.Utils.Array.GetRandom(firstTry ? PRAISE : EFFORT));
}
