// Draws the placeholder app icon (a bubbling flask) as PNGs. No dependencies.
// Usage: node tools/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const BG = [0x3d, 0x7b, 0xff];
const GLASS = [0xf4, 0xf8, 0xff];
const LIQUID = [0x34, 0xc7, 0x59];
const BUBBLE = [0xb8, 0xf0, 0xc8];

// Everything in 0..1 units, kept inside the middle 80% so "maskable" crops are safe.
const body = { x: 0.5, y: 0.6, r: 0.24 };
const neck = { x0: 0.42, x1: 0.58, y0: 0.24, y1: 0.42 };
const rim = { x0: 0.38, x1: 0.62, y0: 0.2, y1: 0.26 };
const liquidTop = 0.56;
const bubbles = [
  { x: 0.44, y: 0.66, r: 0.035 },
  { x: 0.56, y: 0.72, r: 0.025 },
  { x: 0.52, y: 0.62, r: 0.02 },
];

const inCircle = (px, py, c) => (px - c.x) ** 2 + (py - c.y) ** 2 <= c.r ** 2;
const inRect = (px, py, r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1;

function colorAt(px, py) {
  if (inCircle(px, py, body)) {
    if (py < liquidTop) return GLASS;
    return bubbles.some((b) => inCircle(px, py, b)) ? BUBBLE : LIQUID;
  }
  if (inRect(px, py, neck) || inRect(px, py, rim)) return GLASS;
  return BG;
}

function render(size) {
  const SS = 4; // supersampling for smooth edges
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = colorAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = SS * SS;
      raw.set([r / n, g / n, b / n].map(Math.round), row + 1 + x * 3);
    }
  }
  return png(size, raw);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) {
  writeFileSync(new URL(`../assets/icons/icon-${size}.png`, import.meta.url), render(size));
  console.log(`assets/icons/icon-${size}.png`);
}
