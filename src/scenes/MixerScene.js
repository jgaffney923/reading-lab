import { W, COLORS } from '../layout.js';
import { say, sayAll, blend, clip, stopNarration, sfx } from '../systems/audio.js';
import { recordWord, currentSet, setCurrentSet, setPendingLevelUp, tipShown, markTipShown } from '../systems/save.js';
import {
  chooseWords, lookAlikes, lettersOf, picture, sndId, wordId, isVowel, setOfWord, readyToMoveOn,
} from '../systems/phonics.js';
import { makeTile, makePictureCard } from '../ui/tile.js';
import { makeEnergy } from '../ui/energy.js';
import { makeHand } from '../ui/hand.js';
import { addHomeButton, addHintButton } from '../ui/button.js';
import { burst } from '../ui/effects.js';
import { praise } from '../ui/praise.js';

const ROUND = 5;
const IDLE_MS = 8000;
const STEP = 320; // between letter tiles
const TILE_Y = 470, DOT_Y = 700, ARROW_Y = 830, CARD_Y = 1200;

// The core game (PLAN.md 5.1). A word appears as letter tiles with a sound
// dot under each and an arrow under the whole word. He taps the letters (or
// slides along the arrow) to hear the sounds; only then do three pictures
// appear, and he taps the one he read.
export default class MixerScene extends Phaser.Scene {
  constructor() {
    super('Mixer');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    addHomeButton(this);
    addHintButton(this, () => this.hint());
    this.energy = makeEnergy(this, 130, ROUND);
    this.hand = makeHand(this);

    this.words = chooseWords(ROUND);
    this.index = 0;
    this.wordLayer = this.add.container(0, 0);
    this.cards = [];
    this.state = 'busy';
    this.slideNudged = false;

    this.idle = this.time.addEvent({ delay: IDLE_MS, loop: true, callback: () => this.onIdle() });
    this.input.on('pointerdown', () => {
      this.idle.elapsed = 0;
      if (this.state !== 'intro') this.hand.hide();
    });
    this.setupSlide();
    this.events.once('shutdown', () => stopNarration());

    this.next();
  }

  alive() {
    return this.sys.isActive();
  }

  next() {
    this.wordLayer.removeAll(true);
    this.cards.forEach((c) => c.destroy());
    this.cards = [];

    this.word = this.words[this.index];
    this.letters = lettersOf(this.word);
    this.heard = this.letters.map(() => false);
    this.firstTry = true;
    this.slid = false;

    const n = this.letters.length;
    this.xs = this.letters.map((_, i) => W / 2 + (i - (n - 1) / 2) * STEP);
    this.tiles = this.letters.map((letter, i) => {
      const tile = makeTile(this, this.xs[i], TILE_Y, letter, { onTap: () => this.tapLetter(i) });
      tile.setScale(0);
      this.tweens.add({ targets: tile, scale: 1, duration: 320, delay: i * 120, ease: 'Back.easeOut' });
      return tile;
    });
    this.dots = this.letters.map((letter, i) => {
      const color = isVowel(letter) ? COLORS.vowel : COLORS.consonant;
      const dot = this.add.circle(this.xs[i], DOT_Y, 40, 0xffffff).setStrokeStyle(12, color);
      dot.color = color;
      dot.setInteractive(new Phaser.Geom.Circle(40, 40, 100), Phaser.Geom.Circle.Contains);
      dot.on('pointerup', () => this.tapLetter(i));
      return dot;
    });

    // The blending arrow, from under the first letter to past the last.
    this.arrowX0 = this.xs[0] - STEP / 2 + 30;
    this.arrowX1 = this.xs[n - 1] + STEP / 2 - 10;
    const arrow = this.add.graphics();
    arrow.lineStyle(26, COLORS.purple, 1);
    arrow.lineBetween(this.arrowX0, ARROW_Y, this.arrowX1 - 50, ARROW_Y);
    arrow.fillStyle(COLORS.purple, 1);
    arrow.fillTriangle(this.arrowX1, ARROW_Y, this.arrowX1 - 80, ARROW_Y - 50, this.arrowX1 - 80, ARROW_Y + 50);
    this.slideZone.setPosition((this.arrowX0 + this.arrowX1) / 2, ARROW_Y).setSize(this.arrowX1 - this.arrowX0 + 160, 240);
    this.wordLayer.add([...this.dots, arrow, ...this.tiles]);

    if (!tipShown('mixer')) {
      this.intro();
    } else {
      this.state = 'listen';
      if (this.index === 0) this.time.delayedCall(400, () => this.state === 'listen' && say(this, 'mixer.touch'));
    }
  }

  // First visit: the narrator explains while the hand shows each step.
  async intro() {
    this.state = 'intro';
    const talk = say(this, 'mixer.intro');
    for (let i = 0; i < this.letters.length; i++) {
      this.hand.pointAt(this.xs[i], TILE_Y + 120);
      await this.wait(900);
    }
    await this.wait(1000);
    await this.hand.slide([{ x: this.arrowX0, y: ARROW_Y }, { x: this.arrowX1, y: ARROW_Y }], 1500);
    await talk;
    if (!this.alive()) return;
    this.hand.hide();
    markTipShown('mixer');
    this.state = 'listen';
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // Lights a letter and says its sound without cutting off a sound still
  // playing, so a quick slide runs the sounds together.
  playLetter(i) {
    clip(this, sndId(this.letters[i]));
    this.lightLetter(i);
  }

  lightLetter(i) {
    this.tiles[i].hop();
    this.heard[i] = true;
    this.dots[i].setFillStyle(this.dots[i].color);
  }

  tapLetter(i) {
    if (!['listen', 'choose', 'retry'].includes(this.state)) return;
    stopNarration();
    this.playLetter(i);
    this.afterHeard();
  }

  // Sliding along the arrow plays each letter's sound as the finger reaches it.
  setupSlide() {
    this.slideZone = this.add.zone(0, 0, 10, 10).setInteractive();
    this.spark = this.add.circle(0, ARROW_Y, 36, COLORS.glow).setDepth(50).setVisible(false);
    this.sliding = false;

    this.slideZone.on('pointerdown', (pointer) => {
      if (!['listen', 'choose', 'retry'].includes(this.state)) return;
      stopNarration();
      this.sliding = true;
      this.slideAt = -1;
      this.slideTo(pointer.x);
    });
    this.input.on('pointermove', (pointer) => {
      if (this.sliding && pointer.isDown) this.slideTo(pointer.worldX);
    });
    this.input.on('pointerup', () => {
      if (!this.sliding) return;
      this.sliding = false;
      this.spark.setVisible(false);
      if (this.slideAt === this.letters.length - 1) this.slid = true;
      this.afterHeard();
    });
  }

  slideTo(x) {
    const clamped = Phaser.Math.Clamp(x, this.arrowX0, this.arrowX1);
    this.spark.setPosition(clamped, ARROW_Y).setVisible(true);
    const left = this.xs[0] - STEP / 2;
    const at = Math.min(this.letters.length - 1, Math.floor((x - left) / STEP));
    // Only forward: blending reads left to right.
    for (let i = this.slideAt + 1; i <= at; i++) this.playLetter(i);
    this.slideAt = Math.max(this.slideAt, at);
  }

  afterHeard() {
    if (this.state !== 'listen' || this.sliding || !this.heard.every(Boolean)) return;
    if (!this.slid && !this.slideNudged) {
      // Heard every sound by tapping: once a round, show the slide to blend them.
      this.slideNudged = true;
      this.state = 'nudge';
      this.wait(700).then(async () => {
        if (!this.alive()) return;
        this.state = 'listen';
        say(this, 'mixer.slide');
        await this.hand.slide([{ x: this.arrowX0, y: ARROW_Y }, { x: this.arrowX1, y: ARROW_Y }], 1500);
        this.hand.hide();
        // If he doesn't slide, the pictures come anyway.
        this.time.delayedCall(6000, () => this.word === this.wordAtNudge && this.showPictures());
      });
      this.wordAtNudge = this.word;
      return;
    }
    this.time.delayedCall(700, () => this.showPictures());
  }

  showPictures() {
    if (this.state !== 'listen' || this.cards.length) return;
    this.state = 'choose';
    this.hand.hide();
    const options = Phaser.Utils.Array.Shuffle([this.word, ...lookAlikes(this.word)]);
    this.cards = options.map((word, i) => {
      const card = makePictureCard(this, W / 2 + (i - 1) * 470, CARD_Y + 400, word, picture(word), {
        onTap: (c) => this.tapCard(c),
      });
      this.tweens.add({ targets: card, y: CARD_Y, duration: 420, delay: i * 100, ease: 'Back.easeOut' });
      return card;
    });
    say(this, 'mixer.which');
  }

  tapCard(card) {
    if (card.word === this.word && (this.state === 'choose' || this.state === 'retry')) {
      this.success(card);
    } else if (this.state === 'retry') {
      stopNarration();
      say(this, wordId(card.word));
    } else if (this.state === 'choose') {
      this.another(card);
    }
  }

  // He picked a different picture: say what it is, sound the word out together,
  // then the right picture glows for him to tap (PLAN.md 5.3).
  async another(card) {
    this.state = 'busy';
    this.firstTry = false;
    sfx(this, 'soft');
    this.tweens.add({ targets: card, scale: 1.08, duration: 150, yoyo: true });
    // Interrupted lines (the iPad going to sleep) just move on; only leaving stops this.
    await sayAll(this, ['mixer.thatOne', wordId(card.word)]);
    if (!this.alive()) return;
    await say(this, 'mixer.listen');
    if (!this.alive()) return;
    await blend(this, this.letters.map(sndId), { gap: 0.25, onEach: (i) => this.lightLetter(i) });
    if (!this.alive()) return;
    await say(this, wordId(this.word));
    if (!this.alive()) return;
    this.cards.find((c) => c.word === this.word).glow(true);
    this.state = 'retry';
  }

  async success(card) {
    this.state = 'busy';
    stopNarration();
    recordWord(this.word, this.firstTry, setOfWord(this.word) === currentSet());
    card.glow(false);
    sfx(this, 'good');
    this.cards.filter((c) => c !== card).forEach((c) => this.tweens.add({ targets: c, alpha: 0, duration: 250 }));
    this.tweens.add({ targets: card, scale: 1.12, duration: 250, ease: 'Back.easeOut' });

    // The tiles slide together while the sounds run into the word.
    const n = this.letters.length;
    this.tiles.forEach((tile, i) => {
      this.tweens.add({ targets: tile, x: W / 2 + (i - (n - 1) / 2) * 250, duration: 600, ease: 'Sine.easeInOut' });
    });
    this.dots.forEach((dot) => this.tweens.add({ targets: dot, alpha: 0, duration: 300 }));
    await blend(this, this.letters.map(sndId), { overlap: 0.2 });
    if (!this.alive()) return;
    await say(this, wordId(this.word));
    if (!this.alive()) return;
    burst(this, card.x, card.y);
    this.energy.fill(this.index);
    await praise(this, this.firstTry);
    if (!this.alive()) return;

    this.index += 1;
    if (this.index < ROUND) {
      this.time.delayedCall(400, () => this.next());
      return;
    }
    if (readyToMoveOn()) {
      setCurrentSet(currentSet() + 1);
      setPendingLevelUp(currentSet());
    }
    this.time.delayedCall(400, () => this.scene.start('Reward', { from: 'Mixer' }));
  }

  // 💡 Sounds the word out slowly, with the hand under each letter.
  // It never says the word itself; that's his job.
  async hint() {
    if (!['listen', 'choose', 'retry'].includes(this.state)) return;
    const before = this.state;
    this.state = 'busy';
    await blend(this, this.letters.map(sndId), {
      gap: 0.35,
      onEach: (i) => {
        this.lightLetter(i);
        this.hand.pointAt(this.xs[i], ARROW_Y - 40);
      },
    });
    if (!this.alive()) return;
    this.hand.hide();
    this.state = before;
    this.afterHeard();
  }

  onIdle() {
    if (this.state === 'listen') {
      const i = this.heard.indexOf(false);
      if (i >= 0) {
        this.hand.pointAt(this.xs[i], TILE_Y + 120);
        say(this, 'mixer.touch');
      } else {
        say(this, 'mixer.slide');
        this.hand.slide([{ x: this.arrowX0, y: ARROW_Y }, { x: this.arrowX1, y: ARROW_Y }], 1500)
          .then(() => this.hand.hide());
      }
    } else if (this.state === 'choose' || this.state === 'retry') {
      say(this, 'mixer.which');
    }
  }
}
