import { COLORS } from '../layout.js';

// A straw nest across the top with a dashed egg outline for each word or
// sound. Each success lays an egg; a full nest starts the reward.
// Eggs are only ever added, never taken away.
export function makeNest(scene, y, count) {
  const eggW = 72, eggH = 94, gap = 46;
  const step = eggW + gap;
  const cx = scene.scale.gameSize.width / 2;
  const startX = cx - ((count - 1) * step) / 2;
  const nestW = (count - 1) * step + eggW + 120;

  const eggs = [];
  for (let i = 0; i < count; i++) {
    const x = startX + i * step;
    // The place for an egg: a faint outline.
    const spot = scene.add.ellipse(x, y, eggW, eggH, 0xffffff, 0.6).setStrokeStyle(5, COLORS.ink, 0.15);
    const egg = scene.add.ellipse(x, y, eggW, eggH, COLORS.shell).setStrokeStyle(4, 0xd9c7a3).setScale(0);
    eggs.push({ spot, egg });
  }

  // The nest, drawn after the eggs so they sit down in it, with a few straw strokes.
  const nest = scene.add.graphics();
  nest.fillStyle(COLORS.straw, 1);
  nest.fillRoundedRect(cx - nestW / 2, y + 8, nestW, 70, 35);
  nest.lineStyle(6, 0xb8873a, 0.6);
  for (let x = cx - nestW / 2 + 40; x < cx + nestW / 2 - 40; x += 46) {
    nest.lineBetween(x, y + 22, x + 30, y + 62);
  }

  return {
    lay(i) {
      const place = eggs[i];
      if (!place) return;
      place.spot.setVisible(false);
      place.egg.setPosition(place.egg.x, y - 80);
      scene.tweens.add({ targets: place.egg, scale: 1, y, duration: 450, ease: 'Bounce.easeOut' });
    },
  };
}
