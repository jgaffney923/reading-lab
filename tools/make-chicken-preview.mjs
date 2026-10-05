// Writes a static page showing every hen from src/art/chickens.js, for checking the art.
// Usage: node tools/make-chicken-preview.mjs [out.html]   (default: chicken-preview.html, git-ignored)
import { writeFileSync } from 'node:fs';
import { CHICKENS, chickenSVG } from '../src/art/chickens.js';

const out = process.argv[2] || 'chicken-preview.html';
const cards = CHICKENS.map(c => `<figure>${chickenSVG(c.id)}
  <figcaption><b>${c.name}</b><br>${c.breed}${c.role ? ' · ' + c.role : ''}</figcaption></figure>`).join('\n');

writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Our hens</title>
<style>
body{margin:0;padding:24px;background:#eaf4ff;font:18px system-ui,sans-serif;color:#223}
main{display:grid;grid-template-columns:repeat(4,240px);gap:16px}
figure{margin:0;background:#fff;border-radius:18px;padding:10px;text-align:center;box-shadow:0 2px 6px #0001}
svg{width:220px;height:220px}
</style><main>${cards}</main>`);
console.log('Wrote ' + out);
