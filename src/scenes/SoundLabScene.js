import { W, COLORS } from '../layout.js';
import { say, sayAll, clip, stopNarration, sfx } from '../systems/audio.js';
import { recordSound, tipShown, markTipShown } from '../systems/save.js';
import { chooseSounds, soundLookAlikes, sndId } from '../systems/phonics.js';
import { makeTile } from '../ui/tile.js';
import { makeNest } from '../ui/nest.js';
import { makeHen, guideFor } from '../ui/hen.js';
import { addHomeButton, makeIconButton } from '../ui/button.js';
import { bubbles } from '../ui/effects.js';
import { praise } from '../ui/praise.js';

const ROUND = 6;
const IDLE_MS = 9000;

// Cluck Sounds: "Find the letter that says mmm." Three letters; whichever he
// taps says its own sound. If it's another letter, the game says the sound
// again and the right one glows, so every turn ends with him tapping the right
// letter. Oreo guides it, and each right letter lays an egg in the nest.
export default class SoundLabScene extends Phaser.Scene {
  constructor() {
    super('SoundLab');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    addHomeButton(this);
    this.nest = makeNest(this, 130, ROUND);
    this.hen = makeHen(this, guideFor('sounds'), 250, 1330, 380, { onTap: (h) => h.cluck() });
    this.speaker = makeIconButton(this, W / 2, 470, '🔊', () => this.ask(), { radius: 130, color: 0xfff3c4 });

    this.letters = chooseSounds(ROUND);
    this.index = 0;
    this.tiles = [];
    this.state = 'busy';
    this.idle = this.time.addEvent({ delay: IDLE_MS, loop: true, callback: () => this.onIdle() });
    this.input.on('pointerdown', () => { this.idle.elapsed = 0; });
    this.events.once('shutdown', () => stopNarration());

    if (!tipShown('soundlab')) {
      markTipShown('soundlab');
      say(this, 'soundlab.intro').then(() => this.sys.isActive() && this.next());
    } else {
      this.next();
    }
  }

  // Not guarded with isActive(): while create() runs the scene isn't "running"
  // yet, so a guard here would leave the screen empty. Callers check instead.
  next() {
    this.tiles.forEach((t) => t.destroy());
    this.target = this.letters[this.index];
    this.firstTry = true;
    const options = Phaser.Utils.Array.Shuffle([this.target, ...soundLookAlikes(this.target)]);
    this.tiles = options.map((letter, i) => {
      const tile = makeTile(this, W / 2 + (i - 1) * 440, 960, letter, { w: 320, h: 370, onTap: (t) => this.onTap(t) });
      tile.setScale(0);
      this.tweens.add({ targets: tile, scale: 1, duration: 320, delay: i * 110, ease: 'Back.easeOut' });
      return tile;
    });
    this.state = 'ask';
    this.time.delayedCall(450, () => this.ask());
  }

  ask() {
    if (this.state === 'busy') return;
    this.tweens.add({ targets: this.speaker, scale: 1.15, duration: 160, yoyo: true });
    this.hen.peck();
    return sayAll(this, ['soundlab.find', sndId(this.target)]);
  }

  async onTap(tile) {
    if (this.state === 'busy') return;
    const right = tile.letter === this.target;

    if (!right && this.state === 'retry') {
      // Still looking: say this one's sound, keep the right one glowing.
      stopNarration();
      clip(this, sndId(tile.letter));
      tile.hop();
      return;
    }

    if (right) {
      this.success(tile);
      return;
    }

    // Another letter: hear what it says, then hear the one we want again.
    this.state = 'busy';
    this.firstTry = false;
    tile.hop();
    this.hen.tilt();
    await say(this, sndId(tile.letter));
    if (!this.sys.isActive()) return;
    const target = this.tiles.find((t) => t.letter === this.target);
    target.glow(true);
    await sayAll(this, ['soundlab.listen', sndId(this.target)]);
    if (!this.sys.isActive()) return;
    this.state = 'retry';
  }

  async success(tile) {
    this.state = 'busy';
    recordSound(this.target, this.firstTry);
    tile.glow(false);
    tile.hop();
    sfx(this, 'bubble');
    bubbles(this, tile.x, tile.y - 120, { color: 0xffffff });
    this.tiles.filter((t) => t !== tile).forEach((t) => this.tweens.add({ targets: t, alpha: 0.25, duration: 300 }));
    this.nest.lay(this.index);
    this.hen.hop();
    await say(this, sndId(this.target));
    if (!this.sys.isActive()) return;
    await praise(this, this.firstTry);
    if (!this.sys.isActive()) return;

    this.index += 1;
    if (this.index >= ROUND) {
      this.time.delayedCall(400, () => this.scene.start('Reward', { from: 'SoundLab' }));
    } else {
      this.next();
    }
  }

  onIdle() {
    if (this.state === 'ask' || this.state === 'retry') this.ask();
  }
}
