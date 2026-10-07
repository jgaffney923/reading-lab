import { W, H, COLORS, MIN_TOUCH } from '../layout.js';
import { APP_VERSION } from '../version.js';
import { clip, sayAll, stopNarration, sfx } from '../systems/audio.js';
import { currentSet, pendingLevelUp, setPendingLevelUp, rewardCounts } from '../systems/save.js';
import { lettersOfSet, sndId } from '../systems/phonics.js';
import { makeTile } from '../ui/tile.js';
import { makeRoundButton } from '../ui/button.js';
import { addEmoji, addLabel } from '../ui/text.js';
import { addParentCorner } from '../ui/parentCorner.js';
import { burst } from '../ui/effects.js';
import { makeHen, guideFor, hensUpTo, henJoiningAt } from '../ui/hen.js';

const GRASS_Y = 1060; // where the yard starts
const GROUND_Y = 1400; // where the hens stand
const MAX_CHICKS = 10;

// The farm: the letters he's learning along the top (tap to hear them), a card
// for each game with its hen guide, and the yard below with the coop, every
// hen he has unlocked (tap one to make her cluck) and the chicks he's hatched.
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.drawGround();
    this.shelf = this.add.container(0, 0);
    this.drawShelf();

    this.gameCard(W / 2 - 450, 'Cluck Sounds', guideFor('sounds'), 'SoundLab', () => lettersOfSet(currentSet()).slice(0, 3));
    this.gameCard(W / 2 + 450, 'Egg Words', guideFor('words'), 'Mixer', () => ['m', 'a', 'p']);
    this.yard = this.add.container(0, 0);
    this.drawYard();

    addLabel(this, W - 30, H - 30, APP_VERSION, 26).setOrigin(1, 1).setAlpha(0.35).setDepth(10);
    addParentCorner(this, () => {
      this.drawShelf();
      this.drawYard();
    });

    const fresh = pendingLevelUp();
    if (fresh) this.time.delayedCall(400, () => this.celebrate(fresh));
  }

  // Grass with a gentle hill, and the red coop on the left.
  drawGround() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.grass, 1);
    g.fillEllipse(W / 2, GRASS_Y + 60, W * 1.4, 220);
    g.fillRect(0, GRASS_Y + 60, W, H - GRASS_Y);
    g.fillStyle(COLORS.grassDark, 0.5);
    for (let x = 60; x < W; x += 140) g.fillTriangle(x, GROUND_Y + 70, x + 14, GROUND_Y + 30, x + 28, GROUND_Y + 70);

    // The coop: a little red house with a white roof trim and a dark door.
    const x = 190, base = GROUND_Y + 10, w = 270, h = 210;
    g.fillStyle(COLORS.coop, 1);
    g.fillRect(x - w / 2, base - h, w, h);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(x - w / 2 - 30, base - h + 6, x + w / 2 + 30, base - h + 6, x, base - h - 150);
    g.fillStyle(0xb8403c, 1);
    g.fillTriangle(x - w / 2 - 6, base - h, x + w / 2 + 6, base - h, x, base - h - 126);
    g.fillStyle(0x5a2a22, 1);
    g.fillRoundedRect(x - 50, base - 130, 100, 130, { tl: 50, tr: 50, bl: 0, br: 0 });
    g.fillStyle(COLORS.straw, 1);
    g.fillRect(x - w / 2 - 20, base - 4, w + 40, 16);
  }

  // The current set's letters. Tapping one says its sound.
  drawShelf() {
    this.shelf.removeAll(true);
    const letters = lettersOfSet(currentSet());
    const step = 210;
    const startX = W / 2 - ((letters.length - 1) * step) / 2;
    letters.forEach((letter, i) => {
      const tile = makeTile(this, startX + i * step, 230, letter, {
        w: 180,
        h: 210,
        onTap: () => {
          stopNarration();
          clip(this, sndId(letter));
          tile.hop();
        },
      });
      this.shelf.add(tile);
    });
  }

  gameCard(x, name, henId, sceneKey, sampleLetters) {
    const y = 700, w = 780, h = 560;
    const card = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(COLORS.shadow, 0.14);
    g.fillRoundedRect(-w / 2, -h / 2 + 20, w, h, 70);
    g.fillStyle(COLORS.card, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 70);
    const hen = makeHen(this, henId, -200, 160, 330);
    card.add([g, hen]);

    const letters = sampleLetters();
    letters.forEach((letter, i) => {
      card.add(makeTile(this, 150 + (i - (letters.length - 1) / 2) * 150, -20, letter, { w: 130, h: 150 }));
    });
    card.add(addLabel(this, 150, 170, name, 60).setAlpha(0.75));

    const hit = Math.max(w, MIN_TOUCH);
    card.setInteractive(new Phaser.Geom.Rectangle(-hit / 2, -h / 2, hit, h), Phaser.Geom.Rectangle.Contains);
    card.on('pointerdown', () => this.tweens.add({ targets: card, scale: 0.96, duration: 80 }));
    card.on('pointerout', () => card.setScale(1));
    card.on('pointerup', () => {
      sfx(this, 'pop');
      stopNarration();
      this.scene.start(sceneKey);
    });
    this.time.addEvent({ delay: 2600, loop: true, startAt: x > W / 2 ? 1300 : 0, callback: () => hen.peck() });
  }

  // Every hen he has unlocked, and a chick for each egg hatched (up to MAX_CHICKS).
  drawYard() {
    this.yard.removeAll(true);
    const hens = hensUpTo(currentSet());
    const left = 460, right = W - 120;
    const step = Math.min(270, (right - left) / hens.length);
    const startX = left + step / 2;
    hens.forEach((id, i) => {
      const hen = makeHen(this, id, startX + i * step, GROUND_Y, 250, {
        facing: i % 2 ? 'left' : 'right',
        onTap: (h) => h.cluck(),
      });
      this.yard.add(hen);
    });

    const chicks = Math.min(rewardCounts().hatch || 0, MAX_CHICKS);
    for (let i = 0; i < chicks; i++) {
      const x = left + 40 + ((right - left - 80) * (i + 0.5)) / MAX_CHICKS;
      const chick = addEmoji(this, x, GROUND_Y + 70, '🐥', 70);
      this.yard.add(chick);
      // Little hops now and then.
      this.tweens.add({
        targets: chick, y: chick.y - 24, duration: 160, yoyo: true, repeat: -1,
        repeatDelay: Phaser.Math.Between(1500, 4000), delay: Phaser.Math.Between(0, 3000),
      });
    }
  }

  // New letters unlocked: show them big and say each sound, then the hen who
  // joins the coop with this set.
  celebrate(set) {
    setPendingLevelUp(0);
    const layer = this.add.container(0, 0).setDepth(4000);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.card, 1);
    panel.fillRoundedRect(W / 2 - 850, H / 2 - 500, 1700, 1000, 80);
    layer.add([shade, panel, addEmoji(this, W / 2 - 650, H / 2 - 360, '🎉', 140)]);

    const newHenId = henJoiningAt(set);
    const newHen = newHenId ? makeHen(this, newHenId, W / 2, H / 2 - 150, 300).setVisible(false) : null;
    if (newHen) layer.add(newHen);

    const letters = lettersOfSet(set);
    const step = 200;
    const startX = W / 2 - ((letters.length - 1) * step) / 2;
    const tiles = letters.map((letter, i) => {
      const tile = makeTile(this, startX + i * step, H / 2 + 70, letter, { w: 170, h: 200 });
      tile.setScale(0);
      this.tweens.add({ targets: tile, scale: 1, duration: 300, delay: 200 + i * 120, ease: 'Back.easeOut' });
      return tile;
    });
    layer.add(tiles);
    sfx(this, 'star');
    burst(this, W / 2 - 650, H / 2 - 360, undefined, { reach: 500, count: 20 });

    const done = makeRoundButton(this, W / 2, H / 2 + 340, 110, COLORS.go, addEmoji(this, 0, 0, '✔️', 110), () => {
      stopNarration();
      layer.destroy();
      this.drawShelf();
      this.drawYard();
    });
    layer.add(done);

    sayAll(this, ['home.levelUp', ...letters.map(sndId)], (i) => {
      if (i === 0) return;
      tiles[i - 1].hop();
      tiles.forEach((t, j) => t.glow(j === i - 1));
    }).then((finished) => {
      tiles.forEach((t) => t.active && t.glow(false));
      if (!finished || !newHen?.active) return;
      // The new hen pops in and clucks hello.
      newHen.setVisible(true).setScale(0);
      this.tweens.add({ targets: newHen, scale: 1, duration: 400, ease: 'Back.easeOut', onComplete: () => newHen.cluck() });
      sayAll(this, ['home.newHen']);
    });
  }
}
