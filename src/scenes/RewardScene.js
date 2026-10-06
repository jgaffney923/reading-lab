import { W, H, COLORS } from '../layout.js';
import { say, sfx, stopNarration } from '../systems/audio.js';
import { addReward, rewardTotal, currentSet } from '../systems/save.js';
import { makeRoundButton, makeIconButton } from '../ui/button.js';
import { addEmoji } from '../ui/text.js';
import { burst, feathers, RAINBOW } from '../ui/effects.js';
import { makeHen, hensUpTo } from '../ui/hen.js';

// The shows take turns, so each one feels new. The emoji marks them on the home screen.
export const REWARDS = [
  { type: 'hatch', emoji: '🐣', line: 'reward.hatch' },
  { type: 'dance', emoji: '🎵', line: 'reward.dance' },
  { type: 'feathers', emoji: '🪶', line: 'reward.feathers' },
];

const SHELL_EDGE = 0xd9c7a3;

// The end of every round: the nest is full, he presses the big egg button and
// a show starts. Then: play again, or go home.
export default class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  create({ from = 'Mixer' } = {}) {
    this.from = from;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.events.once('shutdown', () => stopNarration());
    this.reward = REWARDS[rewardTotal() % REWARDS.length];
    this.layer = this.add.container(0, 0);
    this.done = false;

    const egg = this.add.graphics();
    drawEgg(egg, 0, 0, 120, 155);
    const go = makeRoundButton(this, W / 2, H / 2, 260, COLORS.go, egg, () => {
      go.disableInteractive();
      this.tweens.add({ targets: go, scale: 0, duration: 250, ease: 'Back.easeIn', onComplete: () => go.destroy() });
      this.play();
    });
    go.setScale(0);
    this.tweens.add({ targets: go, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: go, angle: { from: -4, to: 4 }, duration: 300, yoyo: true, repeat: -1, delay: 500 });
    sfx(this, 'star');
    say(this, 'reward.full');
  }

  async play() {
    stopNarration();
    addReward(this.reward.type);
    say(this, this.reward.line);
    await this[this.reward.type]();
    if (!this.sys.isActive()) return;
    this.tweens.add({ targets: this.layer, alpha: 0, duration: 500 });
    this.finish();
  }

  finish() {
    // Play again: the same green "go" triangle as the start button.
    const play = this.add.graphics();
    play.fillStyle(0xffffff, 1);
    play.fillTriangle(-50, -75, -50, 75, 80, 0);
    const again = makeRoundButton(this, W / 2 - 260, H / 2, 170, COLORS.go, play, () => this.scene.start(this.from));
    const home = makeIconButton(this, W / 2 + 260, H / 2, '🏠', () => this.scene.start('Home'), { radius: 170 });
    [again, home].forEach((b, i) => {
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 350, delay: i * 120, ease: 'Back.easeOut' });
    });
    this.done = true;
    say(this, 'reward.again');
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  tween(config) {
    return new Promise((resolve) => this.tweens.add({ ...config, onComplete: resolve }));
  }

  // A big egg wobbles, cracks, and a chick pops out.
  async hatch() {
    const x = W / 2, y = H / 2 + 120, rx = 230, ry = 300;
    const egg = this.add.graphics({ x, y });
    drawEgg(egg, 0, 0, rx, ry);
    this.layer.add(egg);

    const cracks = this.add.graphics({ x, y });
    cracks.lineStyle(10, 0x8a6d3b, 1);
    this.layer.add(cracks);
    const zigzag = crackLine(rx);
    for (let n = 1; n <= 3; n++) {
      sfx(this, 'crack');
      await this.tween({ targets: [egg, cracks], angle: { from: -8, to: 8 }, duration: 120, yoyo: true, repeat: 1 });
      // Each wobble draws a bit more of the crack across the middle.
      const upTo = Math.round((zigzag.length * n) / 3);
      cracks.clear().lineStyle(10, 0x8a6d3b, 1);
      cracks.strokePoints(zigzag.slice(0, upTo));
      await this.wait(350);
      if (!this.sys.isActive()) return;
    }

    // Split: the top flies off, the chick pops up out of the bottom.
    egg.destroy();
    cracks.destroy();
    const bottom = this.add.graphics({ x, y });
    const top = this.add.graphics({ x, y });
    drawHalf(bottom, rx, ry, zigzag, false);
    drawHalf(top, rx, ry, zigzag, true);
    const chick = addEmoji(this, x, y - 40, '🐥', 280).setScale(0);
    this.layer.add([chick, bottom, top]);
    sfx(this, 'peep');
    burst(this, x, y - 100, [0xffd84d, 0xffffff, 0xffb84d], { reach: 420, count: 18 });
    this.tweens.add({ targets: top, y: y - 520, x: x + 260, angle: 50, duration: 700, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: top, alpha: 0, delay: 500, duration: 300 });
    await this.tween({ targets: chick, scale: 1, y: y - 260, duration: 500, ease: 'Back.easeOut' });
    for (let i = 0; i < 3; i++) {
      sfx(this, 'peep');
      await this.tween({ targets: chick, y: y - 330, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    }
    await this.wait(1200);
  }

  // Every hen in the coop lines up and dances.
  async dance() {
    const hens = hensUpTo(currentSet());
    const step = Math.min(330, (W - 300) / hens.length);
    const startX = W / 2 - ((hens.length - 1) * step) / 2;
    const size = Math.min(360, step * 1.15);
    const dancers = hens.map((id, i) => {
      const hen = makeHen(this, id, startX + i * step, H / 2 + 330, size, { facing: i % 2 ? 'left' : 'right' });
      this.layer.add(hen);
      return hen;
    });
    const notes = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const note = addEmoji(this, Phaser.Math.Between(200, W - 200), H / 2 + 100, Phaser.Utils.Array.GetRandom(['🎵', '🎶']), 110);
        this.layer.add(note);
        this.tweens.add({ targets: note, y: note.y - 500, alpha: 0, duration: 1500, onComplete: () => note.destroy() });
      },
    });
    for (let round = 0; round < 2; round++) {
      sfx(this, 'cluck');
      await Promise.all(dancers.map((hen, i) => this.wait(i * 120).then(() => hen.dance(4))));
      if (!this.sys.isActive()) return;
    }
    notes.remove();
    sfx(this, 'star');
    burst(this, W / 2, H / 2 - 200, RAINBOW, { reach: 500, count: 20 });
    await this.wait(1400);
  }

  // Gertrude flaps her wings and feathers rain down.
  async feathers() {
    const hen = makeHen(this, 'gertrude', W / 2, H / 2 + 420, 620);
    this.layer.add(hen);
    for (let i = 0; i < 3; i++) {
      sfx(this, 'flap');
      await hen.dance(2);
      if (!this.sys.isActive()) return;
    }
    feathers(this, { count: 50, duration: 3000 });
    sfx(this, 'star');
    await this.wait(3200);
  }
}

// An egg: an ellipse a little narrower at the top, shell colored.
function drawEgg(g, x, y, rx, ry) {
  const points = [];
  for (let i = 0; i <= 48; i++) {
    const a = (Math.PI * 2 * i) / 48;
    const s = Math.sin(a);
    points.push({ x: x + Math.cos(a) * rx * (s < 0 ? 0.86 + 0.14 * (1 + s) : 1), y: y + s * ry });
  }
  g.fillStyle(COLORS.shell, 1);
  g.fillPoints(points, true);
  g.lineStyle(Math.max(4, rx * 0.04), SHELL_EDGE, 1);
  g.strokePoints(points, true);
}

// A zigzag across the middle of the egg, left to right.
function crackLine(rx) {
  const points = [];
  const teeth = 8;
  for (let i = 0; i <= teeth; i++) {
    const edge = i === 0 || i === teeth; // meet the shell's outline at the sides
    points.push({ x: -rx + (2 * rx * i) / teeth, y: edge ? 0 : i % 2 ? -36 : 24 });
  }
  return points;
}

// One half of the cracked egg: the shell outline above or below the zigzag.
function drawHalf(g, rx, ry, zigzag, upper) {
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const a = upper ? Math.PI + (Math.PI * i) / 24 : (Math.PI * i) / 24;
    const s = Math.sin(a);
    arc.push({ x: Math.cos(a) * rx * (s < 0 ? 0.86 + 0.14 * (1 + s) : 1), y: s * ry });
  }
  // Lower arc runs right to left, upper arc left to right; close along the zigzag.
  const points = upper ? [...arc, ...[...zigzag].reverse()] : [...arc, ...zigzag];
  g.fillStyle(COLORS.shell, 1);
  g.fillPoints(points, true);
  g.lineStyle(9, SHELL_EDGE, 1);
  g.strokePoints(points, true);
}
