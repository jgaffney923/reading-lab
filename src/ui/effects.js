// Shared particle effects.

export const RAINBOW = [0xff6b5b, 0xffcc00, 0x34c759, 0x3d7bff, 0x8e5cff, 0xff8fd1];

// Sparks flying out in a ring.
export function burst(scene, x, y, colors = RAINBOW, { count = 14, reach = 260, size = 18 } = {}) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const spark = scene.add.circle(x, y, size, colors[i % colors.length]).setDepth(900);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * reach,
      y: y + Math.sin(angle) * reach,
      alpha: 0,
      scale: 0.3,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}

// Bubbles rising from a point, like a fizzing beaker.
export function bubbles(scene, x, y, { count = 10, color = 0xffffff, spread = 80, rise = 260 } = {}) {
  for (let i = 0; i < count; i++) {
    const b = scene.add.circle(x + Phaser.Math.Between(-spread, spread), y, Phaser.Math.Between(10, 22), color, 0.85)
      .setDepth(900);
    scene.tweens.add({
      targets: b,
      y: y - rise - Phaser.Math.Between(0, 120),
      x: b.x + Phaser.Math.Between(-30, 30),
      alpha: 0,
      duration: 900,
      delay: i * 60,
      ease: 'Sine.easeOut',
      onComplete: () => b.destroy(),
    });
  }
}
