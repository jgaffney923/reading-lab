import { COLORS, MIN_TOUCH } from '../layout.js';
import { isVowel } from '../systems/phonics.js';
import { addLabel, addEmoji } from './text.js';

// Rounded card drawing shared by letter tiles and picture cards.
function drawCard(g, w, h, color) {
  const r = Math.min(w, h) * 0.18;
  g.fillStyle(COLORS.shadow, 0.16);
  g.fillRoundedRect(-w / 2, -h / 2 + 16, w, h, r);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.fillStyle(0xffffff, 0.16);
  g.fillRoundedRect(-w / 2 + 14, -h / 2 + 12, w - 28, h * 0.32, r * 0.7);
}

// A soft yellow halo behind a card, pulsing while it's on.
function addGlow(scene, box, w, h) {
  const glow = scene.add.graphics().setAlpha(0);
  glow.fillStyle(COLORS.glow, 1);
  glow.fillRoundedRect(-w / 2 - 26, -h / 2 - 26, w + 52, h + 52, Math.min(w, h) * 0.24);
  box.addAt(glow, 0);
  let pulse = null;
  box.glow = (on) => {
    pulse?.stop();
    pulse = null;
    glow.setAlpha(0);
    if (on) {
      pulse = scene.tweens.add({ targets: glow, alpha: { from: 0.35, to: 1 }, duration: 550, yoyo: true, repeat: -1 });
    }
  };
  box.once('destroy', () => pulse?.stop());
}

function makeTappable(scene, box, w, h, onTap) {
  const hw = Math.max(w, MIN_TOUCH), hh = Math.max(h, MIN_TOUCH);
  box.setInteractive(new Phaser.Geom.Rectangle(-hw / 2, -hh / 2, hw, hh), Phaser.Geom.Rectangle.Contains);
  box.on('pointerdown', () => scene.tweens.add({ targets: box, scale: 0.93, duration: 70 }));
  box.on('pointerout', () => box.setScale(1));
  box.on('pointerup', () => {
    scene.tweens.add({ targets: box, scale: 1, duration: 140, ease: 'Back.easeOut' });
    onTap?.(box);
  });
}

// A letter: coral for vowels, blue for consonants, always lowercase Andika.
export function makeTile(scene, x, y, letter, { w = 260, h = 300, onTap } = {}) {
  const tile = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawCard(g, w, h, isVowel(letter) ? COLORS.vowel : COLORS.consonant);
  tile.add([g, addLabel(scene, 0, -h * 0.04, letter, h * 0.66, '#ffffff')]);
  tile.letter = letter;
  addGlow(scene, tile, w, h);
  if (onTap) makeTappable(scene, tile, w, h, onTap);
  // A quick hop, for when its sound plays. A hop already under way is stopped
  // and the tile put back first: a yoyo returns to wherever it started, so
  // overlapping hops from quick taps would leave the tile stuck up in the air.
  let hopping = null;
  tile.hop = () => {
    hopping?.stop();
    tile.y = y;
    hopping = scene.tweens.add({ targets: tile, y: y - 40, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
  };
  return tile;
}

// A picture to choose, on a white card.
export function makePictureCard(scene, x, y, word, emoji, { size = 400, onTap } = {}) {
  const card = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawCard(g, size, size, COLORS.card);
  card.add([g, addEmoji(scene, 0, 0, emoji, size * 0.55)]);
  card.word = word;
  addGlow(scene, card, size, size);
  if (onTap) makeTappable(scene, card, size, size, onTap);
  return card;
}
