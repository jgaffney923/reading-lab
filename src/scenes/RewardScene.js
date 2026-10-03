import { W, H, COLORS } from '../layout.js';
import { say, sfx, stopNarration } from '../systems/audio.js';
import { addExperiment, experimentTotal } from '../systems/save.js';
import { makeRoundButton, makeIconButton } from '../ui/button.js';
import { addEmoji, addLabel } from '../ui/text.js';
import { burst, bubbles, RAINBOW } from '../ui/effects.js';

// Experiments take turns, so each one feels new.
export const EXPERIMENTS = [
  { type: 'rocket', emoji: '🚀', line: 'reward.rocket' },
  { type: 'volcano', emoji: '🌋', line: 'reward.volcano' },
  { type: 'potion', emoji: '⚗️', line: 'reward.potion' },
];

// The end of every round: Lab Energy is full, he presses the big button and
// an experiment goes off. Then: play again, or go home.
export default class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  create({ from = 'Mixer' } = {}) {
    this.from = from;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.events.once('shutdown', () => stopNarration());
    this.experiment = EXPERIMENTS[experimentTotal() % EXPERIMENTS.length];
    this.layer = this.add.container(0, 0);

    const go = makeRoundButton(this, W / 2, H / 2, 260, COLORS.go,
      addEmoji(this, 0, 0, this.experiment.emoji, 260), () => {
        go.disableInteractive();
        this.tweens.add({ targets: go, scale: 0, duration: 250, ease: 'Back.easeIn', onComplete: () => go.destroy() });
        this.launch();
      });
    go.setScale(0);
    this.tweens.add({ targets: go, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: go, angle: { from: -4, to: 4 }, duration: 300, yoyo: true, repeat: -1, delay: 500 });
    sfx(this, 'star');
    say(this, 'reward.full');
  }

  async launch() {
    stopNarration();
    addExperiment(this.experiment.type);
    say(this, this.experiment.line);
    await this[this.experiment.type]();
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
    say(this, 'reward.again');
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  fireworks(times) {
    for (let i = 0; i < times; i++) {
      this.time.delayedCall(i * 350, () => {
        sfx(this, 'pop');
        burst(this, Phaser.Math.Between(300, W - 300), Phaser.Math.Between(200, 700), RAINBOW, { reach: 220, count: 16 });
      });
    }
  }

  // 3, 2, 1, and up it goes in a trail of smoke.
  async rocket() {
    const rocket = addEmoji(this, W / 2, H - 330, '🚀', 300).setAngle(-45);
    this.layer.add(rocket);
    for (const n of ['3', '2', '1']) {
      const num = addLabel(this, W / 2, 420, n, 300);
      this.tweens.add({
        targets: num, scale: { from: 1.4, to: 0.8 }, alpha: { from: 1, to: 0 }, duration: 650,
        onComplete: () => num.destroy(),
      });
      sfx(this, 'pop');
      await this.wait(700);
    }
    sfx(this, 'launch');
    this.cameras.main.shake(500, 0.006);
    const smoke = this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        const puff = this.add.circle(rocket.x + Phaser.Math.Between(-30, 30), rocket.y + 150, Phaser.Math.Between(30, 60), 0xd8dde8);
        this.layer.add(puff);
        this.tweens.add({ targets: puff, scale: 2.2, alpha: 0, duration: 900, onComplete: () => puff.destroy() });
      },
    });
    await new Promise((resolve) => this.tweens.add({ targets: rocket, y: -400, duration: 1600, ease: 'Cubic.easeIn', onComplete: resolve }));
    smoke.remove();
    this.fireworks(5);
    await this.wait(2000);
  }

  // A rumble, then lava flying out of the top.
  async volcano() {
    const volcano = addEmoji(this, W / 2, H - 340, '🌋', 440);
    this.layer.add(volcano);
    this.cameras.main.shake(900, 0.008);
    await this.wait(900);
    sfx(this, 'boom');
    const top = { x: W / 2, y: H - 560 };
    const lava = [0xff4d2e, 0xff7a3d, 0xffc53d, 0xff6b5b];
    for (let i = 0; i < 50; i++) {
      this.time.delayedCall(i * 40, () => {
        const blob = this.add.circle(top.x, top.y, Phaser.Math.Between(16, 34), lava[i % lava.length]);
        this.layer.add(blob);
        const time = Phaser.Math.Between(900, 1400);
        this.tweens.add({ targets: blob, x: top.x + Phaser.Math.Between(-700, 700), duration: time });
        this.tweens.add({
          targets: blob,
          y: top.y - Phaser.Math.Between(350, 800),
          duration: time / 2,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => blob.destroy(),
        });
      });
    }
    await this.wait(3200);
  }

  // A big flask that bubbles through every color, then fireworks.
  async potion() {
    const x = W / 2, y = H / 2 + 120;
    const flask = this.add.graphics();
    flask.fillStyle(0xffffff, 1);
    flask.fillRect(x - 90, y - 520, 180, 300);
    flask.fillCircle(x, y, 300);
    flask.lineStyle(14, COLORS.ink, 0.15);
    flask.strokeCircle(x, y, 300);
    const liquid = this.add.circle(x, y + 20, 260, RAINBOW[0]);
    this.layer.add([flask, liquid]);

    for (let i = 1; i <= 12; i++) {
      this.time.delayedCall(i * 220, () => {
        liquid.setFillStyle(RAINBOW[i % RAINBOW.length]);
        sfx(this, 'bubble');
        bubbles(this, x, y - 100, { count: 6, spread: 160, rise: 500 });
      });
    }
    await this.wait(2800);
    this.fireworks(6);
    await this.wait(2200);
  }
}
