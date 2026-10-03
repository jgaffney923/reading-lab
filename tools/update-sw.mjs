// Rewrites the offline file list in sw.js and bumps CACHE_VERSION.
// Run before every deploy: node tools/update-sw.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const INCLUDE = ['index.html', 'manifest.webmanifest', 'vendor', 'src', 'assets'];
const SKIP = /(^|\/)\.|\.md$|\.wav$/; // dotfiles, notes, raw recordings

function walk(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((name) => walk(join(path, name)));
  }
  return [relative(root, path).split(sep).join('/')];
}

const files = INCLUDE.flatMap((p) => walk(join(root, p)))
  .filter((f) => !SKIP.test(f))
  .sort();

const swPath = join(root, 'sw.js');
let sw = readFileSync(swPath, 'utf8');

const list = ['./', ...files].map((f) => `  '${f}',`).join('\n');
sw = sw.replace(
  /\/\/ PRECACHE-START[\s\S]*\/\/ PRECACHE-END/,
  `// PRECACHE-START\nconst PRECACHE = [\n${list}\n];\n// PRECACHE-END`
);

let version;
sw = sw.replace(/const CACHE_VERSION = (\d+);/, (_, n) => {
  version = Number(n) + 1;
  return `const CACHE_VERSION = ${version};`;
});

writeFileSync(swPath, sw);
console.log(`sw.js: ${files.length + 1} files, CACHE_VERSION ${version}`);
