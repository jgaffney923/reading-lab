// Game units. 2048x1536 is the iPad's 4:3 shape at Retina resolution,
// so shapes and text stay sharp. On most iPads 1 CSS pixel is about 2 game units.
export const W = 2048;
export const H = 1536;

// Smallest touch target: 96 CSS px from the plan, in game units.
export const MIN_TOUCH = 200;

export const COLORS = {
  bg: 0xeaf4ff,
  card: 0xffffff,
  ink: 0x1d2a4a,
  go: 0x34c759,
  vowel: 0xff6b5b,
  consonant: 0x3d7bff,
  glow: 0xffcc00,
  purple: 0x8e5cff,
  grass: 0x8fd16a,
  grassDark: 0x6fb64c,
  coop: 0xd9534f,
  straw: 0xe3b75a,
  shell: 0xfff4dc,
  shadow: 0x1d2a4a,
};

// Letters and words are always drawn in Andika (see index.html).
export const READING_FONT = 'Andika, "Century Gothic", "Futura", sans-serif';
export const INK = '#1d2a4a';
