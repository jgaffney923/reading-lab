// The family's real hens, drawn as SVG from one shared shape (facing right).
// chickenSVG(id) returns an SVG string; load it into Phaser as a texture with
// this.load.svg(key, chickenDataURI(id), { width, height }).
// No image files: everything is generated here, so it works offline.

export const CHICKENS = [
  {
    id: 'gertrude', name: 'Gertrude', breed: 'Prairie Bluebell Egger', role: 'head hen',
    body: '#b88d68', shade: '#8f6b4f', wing: '#9aa4b0', tail: '#cdd1d6', neck: '#c98f45',
    pattern: 'speckle', patternColor: '#a99c94', comb: 'pea', legs: '#dba63a', crown: true,
  },
  {
    id: 'oreo', name: 'Oreo', breed: 'Barred Rock',
    body: '#34343a', shade: '#55555d', tail: '#34343a',
    pattern: 'mottled', patternColor: '#f2efe8', comb: 'single', legs: '#e8b23a',
  },
  {
    id: 'bella', name: 'Bella', breed: 'Lavender Orpington',
    body: '#b9babf', shade: '#9d9ea5', tail: '#8d8e96', comb: 'single',
    legs: '#e9d3c8', fluffy: true,
  },
  {
    id: 'marsala', name: 'Marsala', breed: 'Buff Orpington',
    body: '#eab65a', shade: '#d39a3c', tail: '#c98b2e', comb: 'single',
    legs: '#ecd2c2', fluffy: true,
  },
  {
    id: 'tina', name: 'Tina', breed: 'White-crested Black Polish',
    body: '#2a2a31', shade: '#3c3c46', tail: '#1d1d23', comb: 'v',
    legs: '#6b7180', beak: '#b9b2a2', crest: '#fbfaf6', small: true,
  },
  {
    id: 'luna', name: 'Luna', breed: 'Black Jersey Giant',
    body: '#22222a', shade: '#33333d', tail: '#17171d', sheen: '#34403c',
    comb: 'single', legs: '#3b3b44', big: true,
  },
  {
    id: 'rhoda', name: 'Rhoda', breed: 'Rhode Island Red',
    body: '#9a4322', shade: '#7a3118', tail: '#2c2220', neck: '#b3582c',
    comb: 'single', legs: '#e8b23a',
  },
  {
    id: 'harriet', name: 'Harriet', breed: 'Australorp',
    body: '#202224', shade: '#32363a', tail: '#16181a', sheen: '#2f4a3e',
    comb: 'single', legs: '#4b5058', fluffy: true,
  },
];

const RED = '#e0393e';
const RED_DARK = '#b8262c';
const BEAK = '#f2b632';

export function getChicken(id) {
  return CHICKENS.find(c => c.id === id);
}

export function chickenDataURI(id) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(chickenSVG(id));
}

export function chickenSVG(id) {
  const c = getChicken(id);
  if (!c) throw new Error('Unknown chicken: ' + id);
  const p = id; // prefix for defs ids so several hens can share one page

  // Body size: Orpingtons are round and fluffy, Jersey Giant is tall, Polish is small.
  const rx = c.fluffy ? 70 : c.big ? 66 : c.small ? 56 : 62;
  const ry = c.fluffy ? 54 : c.big ? 58 : c.small ? 44 : 48;
  const cx = 102, cy = c.big ? 134 : 138;
  const headX = 156, headY = c.big ? 50 : c.small ? 84 : 78, headR = c.small ? 24 : c.big ? 28 : 26;

  const defs = [];
  let bodyFill = c.body;
  if (c.pattern === 'barred') {
    defs.push(`<pattern id="${p}-bars" width="200" height="14" patternUnits="userSpaceOnUse">
      <rect width="200" height="14" fill="${c.body}"/>
      <path d="M0 4 Q12 1 25 4 T50 4 T75 4 T100 4 T125 4 T150 4 T175 4 T200 4 L200 9 Q187 12 175 9 T150 9 T125 9 T100 9 T75 9 T50 9 T25 9 T0 9Z" fill="${c.patternColor}"/>
    </pattern>`);
    bodyFill = `url(#${p}-bars)`;
  } else if (c.pattern === 'mottled') {
    // Small white feather tips scattered tightly over dark: reads as black-and-white mixed
    defs.push(`<pattern id="${p}-mott" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="${c.body}"/>
      <path d="M1 4 q3 3 6 0" stroke="${c.patternColor}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M9 10 q3 3 6 0" stroke="${c.patternColor}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </pattern>`);
    bodyFill = `url(#${p}-mott)`;
  } else if (c.pattern === 'speckle') {
    defs.push(`<pattern id="${p}-speck" width="22" height="20" patternUnits="userSpaceOnUse">
      <rect width="22" height="20" fill="${c.body}"/>
      <ellipse cx="5" cy="5" rx="3" ry="2.2" fill="${c.patternColor}"/>
      <ellipse cx="16" cy="14" rx="3" ry="2.2" fill="${c.patternColor}"/>
    </pattern>`);
    bodyFill = `url(#${p}-speck)`;
  }
  if (c.sheen) {
    defs.push(`<linearGradient id="${p}-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.sheen}" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="${c.sheen}" stop-opacity="0"/>
    </linearGradient>`);
  }
  const allOver = c.pattern === 'barred' || c.pattern === 'mottled';
  const wingFill = allOver ? bodyFill : (c.wing || c.shade);
  const tailFill = allOver ? bodyFill : c.tail;
  const neckFill = allOver ? bodyFill : (c.neck || c.body);

  const parts = [];

  // Ground shadow
  parts.push(`<ellipse cx="${cx + 8}" cy="212" rx="${rx}" ry="7" fill="#000" opacity="0.12"/>`);

  // Legs (behind body)
  const legTop = cy + ry - 8;
  for (const lx of [cx - 6, cx + 20]) {
    parts.push(`<g stroke="${c.legs}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M${lx} ${legTop} L${lx} 205"/>
      <path d="M${lx} 205 L${lx + 14} 207 M${lx} 205 L${lx - 10} 208"/>
    </g>`);
  }

  // Tail: a fan of three feathers, shorter and puffier on fluffy breeds
  const tl = c.fluffy ? 0.7 : 1;
  const tx = cx - rx + 18, ty = cy - 10;
  const feathers = [[-40, -62], [-54, -40], [-58, -14]];
  for (const [dx, dy] of feathers) {
    const ex = tx + dx * tl, ey = ty + dy * tl;
    parts.push(`<path d="M${tx + 20} ${ty + 10} Q${ex - 6} ${ey + 30} ${ex} ${ey} Q${ex + 24} ${ey + 8} ${tx + 34} ${ty + 4}Z"
      fill="${tailFill}" stroke="${c.shade}" stroke-width="2"/>`);
  }

  // Body
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${bodyFill}" stroke="${c.shade}" stroke-width="2.5"/>`);
  if (c.sheen) parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${p}-sheen)"/>`);

  // Neck: a rounded hackle joining body to head
  parts.push(`<ellipse cx="${headX - 12}" cy="${(headY + cy - ry) / 2 + 14}" rx="${headR - 2}" ry="${(cy - ry - headY) / 2 + 30}"
    transform="rotate(28 ${headX - 12} ${(headY + cy - ry) / 2 + 14})" fill="${neckFill}"/>`);

  // Wing
  parts.push(`<path d="M${cx - 34} ${cy - 8} Q${cx + 4} ${cy - 30} ${cx + 34} ${cy - 6} Q${cx + 20} ${cy + 26} ${cx - 22} ${cy + 22} Q${cx - 40} ${cy + 10} ${cx - 34} ${cy - 8}Z"
    fill="${wingFill}" stroke="${c.shade}" stroke-width="2.5"/>`);
  parts.push(`<path d="M${cx - 18} ${cy + 6} Q${cx + 4} ${cy + 2} ${cx + 22} ${cy + 6} M${cx - 14} ${cy + 15} Q${cx + 2} ${cy + 12} ${cx + 14} ${cy + 15}"
    stroke="${c.shade === c.body ? '#0002' : '#0003'}" stroke-width="2" fill="none" stroke-linecap="round"/>`);

  // Comb (behind head top)
  if (c.comb === 'single') {
    const b = headY - headR + 6;
    parts.push(`<path d="M${headX - 20} ${b + 6} Q${headX - 24} ${b - 12} ${headX - 12} ${b - 8} Q${headX - 10} ${b - 22} ${headX} ${b - 12}
      Q${headX + 4} ${b - 24} ${headX + 12} ${b - 10} Q${headX + 22} ${b - 16} ${headX + 20} ${b + 4}Z" fill="${RED}" stroke="${RED_DARK}" stroke-width="2"/>`);
  } else if (c.comb === 'pea') {
    const b = headY - headR + 4;
    parts.push(`<path d="M${headX - 12} ${b + 6} Q${headX - 12} ${b - 6} ${headX - 4} ${b - 3} Q${headX + 2} ${b - 9} ${headX + 8} ${b - 2}
      Q${headX + 14} ${b - 2} ${headX + 14} ${b + 6}Z" fill="${RED}" stroke="${RED_DARK}" stroke-width="2"/>`);
  } else if (c.comb === 'v') {
    const b = headY - headR + 4;
    parts.push(`<path d="M${headX + 4} ${b + 4} L${headX + 2} ${b - 8} L${headX + 8} ${b + 2} L${headX + 14} ${b - 8} L${headX + 12} ${b + 4}Z" fill="${RED}"/>`);
  }

  // Head
  parts.push(`<circle cx="${headX}" cy="${headY}" r="${headR}" fill="${neckFill}" stroke="${c.shade}" stroke-width="2.5"/>`);

  // Red face patch, wattle and beak
  if (!c.muffs) parts.push(`<ellipse cx="${headX + 12}" cy="${headY + 4}" rx="9" ry="11" fill="${RED}" opacity="0.9"/>`);
  parts.push(`<path d="M${headX + 16} ${headY + 12} Q${headX + 8} ${headY + 34} ${headX + 18} ${headY + 34} Q${headX + 26} ${headY + 32} ${headX + 22} ${headY + 12}Z"
    fill="${RED}" stroke="${RED_DARK}" stroke-width="1.5"/>`);
  parts.push(`<path d="M${headX + 22} ${headY - 2} L${headX + 42} ${headY + 5} L${headX + 22} ${headY + 12}Z" fill="${c.beak || BEAK}" stroke="#0003" stroke-width="1.5" stroke-linejoin="round"/>`);

  // Cheek muffs (Easter Egger)
  if (c.muffs) {
    for (const [mx, my, r] of [[headX + 6, headY + 16, 9], [headX + 16, headY + 20, 8], [headX - 4, headY + 20, 8]]) {
      parts.push(`<circle cx="${mx}" cy="${my}" r="${r}" fill="${c.muffs}"/>`);
    }
  }

  // Eye
  parts.push(`<circle cx="${headX + 10}" cy="${headY - 5}" r="6.5" fill="#1b1b1f"/>`);
  parts.push(`<circle cx="${headX + 12}" cy="${headY - 7.5}" r="2.3" fill="#fff"/>`);

  // Polish pom-pom crest, drawn over the top of the head
  if (c.crest) {
    const puffs = [
      [headX - 14, headY - 26, 15], [headX + 2, headY - 36, 17], [headX + 18, headY - 28, 13],
      [headX - 22, headY - 8, 12], [headX - 4, headY - 20, 15], [headX + 22, headY - 18, 10],
    ];
    for (const [x, y, r] of puffs) {
      parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c.crest}" stroke="#cfcac0" stroke-width="2"/>`);
    }
    for (const [x, y] of [[headX - 8, headY - 24], [headX + 10, headY - 30], [headX - 18, headY - 8]]) {
      parts.push(`<path d="M${x} ${y} q4 -6 8 0" stroke="#d9d4ca" stroke-width="2" fill="none"/>`);
    }
  }

  // Head hen's crown
  if (c.crown) {
    const y = headY - headR - 6, x = headX - 4;
    parts.push(`<path d="M${x - 16} ${y + 6} L${x - 18} ${y - 14} L${x - 8} ${y - 4} L${x} ${y - 18} L${x + 8} ${y - 4} L${x + 18} ${y - 14} L${x + 16} ${y + 6}Z"
      fill="#f7c843" stroke="#c9961a" stroke-width="2" stroke-linejoin="round"/>`);
    parts.push(`<circle cx="${x}" cy="${y - 1}" r="3" fill="${RED}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
<defs>${defs.join('')}</defs>${parts.join('\n')}</svg>`;
}
