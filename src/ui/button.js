import { MIN_TOUCH, H } from '../layout.js';
import { sfx, stopNarration } from '../systems/audio.js';
import { addEmoji } from './text.js';

// A round button with a squish on press. `content` is a game object (or array)
// drawn centered on the button. The touch area never goes below MIN_TOUCH.
export function makeRoundButton(scene, x, y, radius, color, content, onTap) {
  const button = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(0, radius * 0.08, radius);
  g.fillStyle(color, 1);
  g.fillCircle(0, 0, radius);
  button.add(g);
  if (content) button.add(content);

  const hit = Math.max(radius, MIN_TOUCH / 2);
  button.setInteractive(new Phaser.Geom.Circle(0, 0, hit), Phaser.Geom.Circle.Contains);

  button.on('pointerdown', () => {
    scene.tweens.add({ targets: button, scale: 0.92, duration: 80 });
  });
  button.on('pointerout', () => button.setScale(1));
  button.on('pointerup', () => {
    scene.tweens.add({ targets: button, scale: 1, duration: 120, ease: 'Back.easeOut' });
    sfx(scene, 'pop');
    onTap();
  });
  return button;
}

export function makeIconButton(scene, x, y, emoji, onTap, { radius = 100, color = 0xffffff } = {}) {
  return makeRoundButton(scene, x, y, radius, color, addEmoji(scene, 0, 0, emoji, radius * 0.95), onTap);
}

// The 🏠 in the top-left corner of every game.
export function addHomeButton(scene) {
  return makeIconButton(scene, 130, 130, '🏠', () => {
    stopNarration();
    scene.scene.start('Home');
  });
}

// The 💡 in the bottom-left corner.
export function addHintButton(scene, onTap) {
  return makeIconButton(scene, 130, H - 140, '💡', onTap, { color: 0xfff3c4 });
}
