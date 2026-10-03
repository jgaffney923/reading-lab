import { W, H } from './layout.js';
import { installAudioGuards, setMuted } from './systems/audio.js';
import { isSoundOn } from './systems/save.js';
import BootScene from './scenes/BootScene.js';
import HomeScene from './scenes/HomeScene.js';
import SoundLabScene from './scenes/SoundLabScene.js';
import MixerScene from './scenes/MixerScene.js';
import RewardScene from './scenes/RewardScene.js';
import RecorderScene from './scenes/RecorderScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#eaf4ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  input: { activePointers: 4 }, // several small fingers at once
  scene: [BootScene, HomeScene, SoundLabScene, MixerScene, RewardScene, RecorderScene],
});

installAudioGuards(game);
setMuted(game, !isSoundOn());

// Lets automated browser tests on this PC look inside the game.
if (location.hostname === 'localhost') window.__game = game;
