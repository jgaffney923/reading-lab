import { READING_FONT, INK } from '../layout.js';

// Placeholder pictures: emoji drawn as text.
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export function addEmoji(scene, x, y, emoji, size) {
  return scene.add.text(x, y, emoji, {
    fontFamily: EMOJI_FONT,
    fontSize: `${size}px`,
    padding: { x: size * 0.15, y: size * 0.15 },
  }).setOrigin(0.5);
}

// Letters, words and the few grown-up labels, all in the reading font.
export function addLabel(scene, x, y, text, size, color = INK) {
  return scene.add.text(x, y, text, {
    fontFamily: READING_FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    align: 'center',
    padding: { x: 4, y: size * 0.12 },
  }).setOrigin(0.5);
}
