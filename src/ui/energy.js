import { COLORS } from '../layout.js';

// A row of little test tubes across the top. Each word or sound fills one;
// when they're all full, the experiment starts. They only ever fill up.
export function makeEnergy(scene, y, count) {
  const tubeW = 64, tubeH = 130, gap = 54;
  const startX = scene.scale.gameSize.width / 2 - ((count - 1) * (tubeW + gap)) / 2;
  const fills = [];

  for (let i = 0; i < count; i++) {
    const x = startX + i * (tubeW + gap);
    const glass = scene.add.graphics();
    glass.fillStyle(0xffffff, 1);
    glass.fillRoundedRect(x - tubeW / 2, y - tubeH / 2, tubeW, tubeH, tubeW / 2);
    glass.lineStyle(6, COLORS.ink, 0.15);
    glass.strokeRoundedRect(x - tubeW / 2, y - tubeH / 2, tubeW, tubeH, tubeW / 2);

    // Liquid: drawn full, revealed by growing from the bottom.
    const liquid = scene.add.graphics();
    liquid.fillStyle(COLORS.energy, 1);
    liquid.fillRoundedRect(-tubeW / 2 + 9, -tubeH + 18, tubeW - 18, tubeH - 18, (tubeW - 18) / 2);
    liquid.setPosition(x, y + tubeH / 2 - 9).setScale(1, 0);
    fills.push(liquid);
  }

  return {
    fill(i) {
      const liquid = fills[i];
      if (!liquid) return;
      scene.tweens.add({ targets: liquid, scaleY: 1, duration: 600, ease: 'Back.easeOut' });
      for (let b = 0; b < 5; b++) {
        const bubble = scene.add.circle(liquid.x + Phaser.Math.Between(-12, 12), liquid.y - 20, 8, 0xffffff, 0.8);
        scene.tweens.add({
          targets: bubble,
          y: liquid.y - tubeH - 30,
          alpha: 0,
          duration: 700,
          delay: 200 + b * 90,
          onComplete: () => bubble.destroy(),
        });
      }
    },
  };
}
