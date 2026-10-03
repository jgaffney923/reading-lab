import { W, H, COLORS, MIN_TOUCH } from '../layout.js';
import { APP_VERSION } from '../version.js';
import { clip, sayAll, stopNarration, sfx } from '../systems/audio.js';
import { currentSet, pendingLevelUp, setPendingLevelUp, experimentCounts } from '../systems/save.js';
import { lettersOfSet, sndId } from '../systems/phonics.js';
import { makeTile } from '../ui/tile.js';
import { makeRoundButton } from '../ui/button.js';
import { addEmoji, addLabel } from '../ui/text.js';
import { addParentCorner } from '../ui/parentCorner.js';
import { burst } from '../ui/effects.js';
import { EXPERIMENTS } from './RewardScene.js';

// The lab: the letters he's learning on a shelf at the top (tap to hear them),
// a big card per machine, and the experiments he's launched along the bottom.
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.shelf = this.add.container(0, 0);
    this.drawShelf();

    this.machine(W / 2 - 450, 'Sound Lab', '🔊', 'SoundLab', () => lettersOfSet(currentSet()).slice(0, 3));
    this.machine(W / 2 + 450, 'Word Mixer', '🧪', 'Mixer', () => ['m', 'a', 'p']);
    this.drawCollection();

    addLabel(this, W - 30, H - 30, APP_VERSION, 26).setOrigin(1, 1).setAlpha(0.35);
    addParentCorner(this, () => this.drawShelf());

    const fresh = pendingLevelUp();
    if (fresh) this.time.delayedCall(400, () => this.celebrate(fresh));
  }

  // The current set's letters. Tapping one says its sound.
  drawShelf() {
    this.shelf.removeAll(true);
    const letters = lettersOfSet(currentSet());
    const step = 210;
    const startX = W / 2 - ((letters.length - 1) * step) / 2;
    letters.forEach((letter, i) => {
      const tile = makeTile(this, startX + i * step, 250, letter, {
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

  machine(x, name, emoji, sceneKey, sampleLetters) {
    const y = 820, w = 780, h = 640;
    const card = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(COLORS.shadow, 0.14);
    g.fillRoundedRect(-w / 2, -h / 2 + 20, w, h, 70);
    g.fillStyle(COLORS.card, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 70);
    card.add([g, addEmoji(this, 0, -150, emoji, 220)]);

    const letters = sampleLetters();
    letters.forEach((letter, i) => {
      card.add(makeTile(this, (i - (letters.length - 1) / 2) * 150, 110, letter, { w: 130, h: 150 }));
    });
    card.add(addLabel(this, 0, 250, name, 60).setAlpha(0.7));

    const hit = Math.max(w, MIN_TOUCH);
    card.setInteractive(new Phaser.Geom.Rectangle(-hit / 2, -h / 2, hit, h), Phaser.Geom.Rectangle.Contains);
    card.on('pointerdown', () => this.tweens.add({ targets: card, scale: 0.96, duration: 80 }));
    card.on('pointerout', () => card.setScale(1));
    card.on('pointerup', () => {
      sfx(this, 'pop');
      stopNarration();
      this.scene.start(sceneKey);
    });
    this.tweens.add({ targets: card, y: y - 12, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: x > W / 2 ? 800 : 0 });
  }

  // Every experiment type, with how many times he's launched it.
  drawCollection() {
    const counts = experimentCounts();
    EXPERIMENTS.forEach(({ type, emoji }, i) => {
      const x = W / 2 + (i - 1) * 300;
      const n = counts[type] || 0;
      addEmoji(this, x - 40, 1340, emoji, 110).setAlpha(n ? 1 : 0.25);
      if (n) addLabel(this, x + 70, 1350, `${n}`, 60);
    });
  }

  // New letters unlocked: show them big and say each sound.
  celebrate(set) {
    setPendingLevelUp(0);
    const layer = this.add.container(0, 0).setDepth(4000);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.card, 1);
    panel.fillRoundedRect(W / 2 - 850, H / 2 - 450, 1700, 900, 80);
    layer.add([shade, panel, addEmoji(this, W / 2, H / 2 - 300, '🎉', 160)]);

    const letters = lettersOfSet(set);
    const step = 220;
    const startX = W / 2 - ((letters.length - 1) * step) / 2;
    const tiles = letters.map((letter, i) => {
      const tile = makeTile(this, startX + i * step, H / 2, letter, { w: 190, h: 220 });
      tile.setScale(0);
      this.tweens.add({ targets: tile, scale: 1, duration: 300, delay: 200 + i * 120, ease: 'Back.easeOut' });
      return tile;
    });
    layer.add(tiles);
    sfx(this, 'star');
    burst(this, W / 2, H / 2 - 300, undefined, { reach: 500, count: 20 });

    const done = makeRoundButton(this, W / 2, H / 2 + 300, 110, COLORS.go, addEmoji(this, 0, 0, '✔️', 110), () => {
      stopNarration();
      layer.destroy();
      this.drawShelf();
    });
    layer.add(done);

    sayAll(this, ['home.levelUp', ...letters.map(sndId)], (i) => {
      if (i === 0) return;
      tiles[i - 1].hop();
      tiles.forEach((t, j) => t.glow(j === i - 1));
    }).then(() => tiles.forEach((t) => t.active && t.glow(false)));
  }
}
