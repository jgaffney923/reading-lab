import { addEmoji } from './text.js';

// A pointing hand that shows what to do next. It sits just below its target,
// pointing up, and bobs so it's easy to notice.
export function makeHand(scene) {
  const hand = addEmoji(scene, 0, 0, '👆', 150).setDepth(3000).setVisible(false);
  let bob = null;

  const api = {
    pointAt(x, y) {
      bob?.stop();
      scene.tweens.killTweensOf(hand);
      hand.setVisible(true).setAlpha(1).setPosition(x, y + 120);
      bob = scene.tweens.add({ targets: hand, y: y + 80, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    },
    // Glides along a path of points, e.g. the blending arrow. Resolves at the end.
    slide(points, duration) {
      bob?.stop();
      scene.tweens.killTweensOf(hand);
      const [first, ...rest] = points;
      hand.setVisible(true).setAlpha(1).setPosition(first.x, first.y + 90);
      return new Promise((resolve) => {
        scene.tweens.chain({
          targets: hand,
          tweens: rest.map((p) => ({ x: p.x, y: p.y + 90, duration: duration / rest.length, ease: 'Linear' })),
          onComplete: resolve,
        });
      });
    },
    hide() {
      bob?.stop();
      bob = null;
      scene.tweens.killTweensOf(hand);
      hand.setVisible(false);
    },
  };
  return api;
}
