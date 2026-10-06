// The family's hens on screen: textures made from the SVG drawings in
// src/art/chickens.js, and a hen object with a few moves (hop, peck, tilt, dance).
import { CHICKENS, chickenSVG } from '../art/chickens.js';
import { sfx } from '../systems/audio.js';

const TEXTURE_SIZE = 512; // drawn this big so hens stay sharp at the sizes used
const henKey = (id) => `hen:${id}`;

let farm = null;

// Call once from the boot scene, with farm.json.
export function initFarm(json) {
  farm = json;
}

export const guideFor = (game) => farm.guides[game];

// The hens living in the coop once he's working on letter set `set`.
export function hensUpTo(set) {
  const joined = Object.entries(farm.joinsAtSet)
    .filter(([n]) => Number(n) <= set)
    .map(([, id]) => id);
  return [...farm.start, ...joined];
}

// The hen who joins when he reaches letter set `set`, if any.
export const henJoiningAt = (set) => farm.joinsAtSet[set] ?? null;

export const henName = (id) => CHICKENS.find((c) => c.id === id)?.name ?? id;

// Turns each drawing into a texture. An <img> with an SVG data URI works
// offline and in every browser; no network or file loading involved.
export function loadHenTextures(game) {
  const size = `width="${TEXTURE_SIZE}" height="${TEXTURE_SIZE}"`;
  return Promise.all(CHICKENS.map(({ id }) => new Promise((resolve) => {
    if (game.textures.exists(henKey(id))) return resolve();
    const img = new Image();
    img.onload = () => {
      game.textures.addImage(henKey(id), img);
      resolve();
    };
    img.onerror = () => resolve(); // a missing hen never stops the game
    const svg = chickenSVG(id).replace('width="220" height="220"', size);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  })));
}

// A hen standing with her feet at (x, y), `size` game units tall.
// She faces right; `facing: 'left'` mirrors her.
export function makeHen(scene, id, x, y, size, { facing = 'right', onTap } = {}) {
  const hen = scene.add.container(x, y);
  const img = scene.add.image(0, 0, henKey(id)).setOrigin(0.5, 0.97);
  img.setScale(size / TEXTURE_SIZE);
  if (facing === 'left') img.setFlipX(true);
  hen.add(img);
  hen.id = id;
  const base = img.scale;
  const lean = facing === 'left' ? -1 : 1;

  // Breathing: a slow squash and stretch so she looks alive.
  const breathe = scene.tweens.add({
    targets: img, scaleY: base * 1.03, scaleX: base * 0.985,
    duration: 1100 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
  hen.once('destroy', () => breathe.stop());

  const busy = () => scene.tweens.getTweensOf(hen).length > 0;

  hen.hop = (height = size * 0.18) => {
    if (busy()) return;
    scene.tweens.add({ targets: hen, y: y - height, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  };
  // Leans forward and back twice, like pecking at the ground.
  hen.peck = () => {
    if (busy()) return;
    scene.tweens.add({ targets: hen, angle: 18 * lean, duration: 110, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  };
  // A curious head tilt, for "let's listen together".
  hen.tilt = () => {
    if (busy()) return;
    scene.tweens.add({ targets: hen, angle: -10 * lean, duration: 260, yoyo: true, hold: 400, ease: 'Sine.easeInOut' });
  };
  hen.cluck = () => {
    sfx(scene, 'cluck');
    hen.peck();
  };
  // Side-to-side hops, for the reward dance. Resolves when she's done.
  hen.dance = (times = 4) => new Promise((resolve) => {
    scene.tweens.killTweensOf(hen);
    hen.setPosition(x, y).setAngle(0);
    scene.tweens.chain({
      targets: hen,
      tweens: Array.from({ length: times }, (_, i) => ({
        y: y - size * 0.22, angle: i % 2 ? -12 : 12, duration: 180, yoyo: true, ease: 'Quad.easeOut',
      })),
      onComplete: () => {
        hen.setAngle(0);
        resolve();
      },
    });
  });

  if (onTap) {
    hen.setInteractive(
      new Phaser.Geom.Rectangle(-size * 0.5, -size, size, size),
      Phaser.Geom.Rectangle.Contains,
    );
    hen.on('pointerup', () => onTap(hen));
  }
  return hen;
}
