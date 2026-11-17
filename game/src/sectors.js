// STARFALL — the three sectors and the fifteen per-level arenas.
import { SECTORS } from './config.js';
export function sectorOf(level) {
  for (let i = 0; i < SECTORS.length; i++) {
    if (level >= SECTORS[i].levels[0] && level <= SECTORS[i].levels[1]) return i;
  }
  return SECTORS.length - 1;
}
export function sectorName(level) {
  return SECTORS[sectorOf(level)].name;
}
// Fifteen arenas, one per campaign level: each level has its own sky,
// landmark and weather, so no two levels look the same. A sector keeps
// its hue family, but the five levels inside it are five different
// places. Boss Rush reuses the three guardian arenas (levels 5, 10, 15).
// Fields: name, tag (banner subtitle), sky (3-stop gradient), neb (four
// [hex, alpha] nebula clouds), pl (planet, null = open sky), co (second
// body), st (star density 0.5-1), sh (shooting-star wait [min, max] s),
// db (drifting background rocks), nm (nebula size), fog (full-sky tint),
// au (aurora band colour). Anything missing falls back to a calm default.
export const ARENAS = [
  { name: 'CALM EXPANSE', tag: 'open skies, gentle stars',
    sky: ['#050516', '#0a0a2e', '#12082e'],
    neb: [['#5028a0', 0.20], ['#145a8c', 0.18], ['#a0286e', 0.14], ['#ff963c', 0.10]],
    pl: { x: 1080, y: 480, r: 92, ring: true, glow: 'rgba(57, 198, 255, 0.35)', bands: ['#1d6fd1', '#39c6ff', '#0a3a6e', '#7ef0ff'] },
    st: 0.55, sh: [5, 9] },
  { name: 'TWIN SUNS', tag: 'two suns share the sky',
    sky: ['#0a0716', '#160f2e', '#22143a'],
    neb: [['#6e3ad8', 0.20], ['#c87428', 0.16], ['#a0286e', 0.14], ['#ffd166', 0.10]],
    pl: { x: 1010, y: 300, r: 70, kind: 'sun', glow: 'rgba(255, 150, 60, 0.5)', bands: ['#fffbe8', '#ffe66d', '#ff9f43', '#ff7847'] },
    co: { x: 240, y: 180, r: 38, kind: 'sun', glow: 'rgba(255, 210, 100, 0.45)', bands: ['#fffbe8', '#ffe66d', '#ffd166'] },
    st: 0.85, sh: [2, 4] },
  { name: 'ASTEROID BELT', tag: 'a dense field of drifting rock',
    sky: ['#07070f', '#0d0d20', '#160f24'],
    neb: [['#5a5478', 0.16], ['#3c3c5a', 0.14], ['#785a3c', 0.10], ['#5028a0', 0.08]],
    pl: { x: 1120, y: 220, r: 54, kind: 'moon', glow: 'rgba(180, 190, 220, 0.25)', bands: ['#3c3c50', '#8c8ca8', '#c8c8dc', '#6e6e8c'] },
    st: 0.7, sh: [4, 8], db: 14 },
  { name: 'NEBULA BLOOM', tag: 'thick clouds of newborn stars',
    sky: ['#0a0518', '#140a30', '#1e0f38'],
    neb: [['#7a28c8', 0.28], ['#2814c8', 0.24], ['#c82896', 0.20], ['#28c8d8', 0.14]],
    pl: null, st: 0.9, sh: [3, 6], nm: 1.6, fog: 'rgba(120, 60, 200, 0.07)' },
  { name: "GUARDIAN'S RING", tag: 'the Mothership guards a ringed giant',
    sky: ['#040414', '#080a2c', '#100a30'],
    neb: [['#145a8c', 0.22], ['#5028a0', 0.20], ['#28c8d8', 0.14], ['#a0286e', 0.10]],
    pl: { x: 1080, y: 460, r: 118, ring: true, glow: 'rgba(57, 198, 255, 0.4)', bands: ['#1d6fd1', '#39c6ff', '#0a3a6e', '#7ef0ff'] },
    st: 0.8, sh: [3, 5], db: 3 },
  { name: 'EMBER CLOUDS', tag: 'embers drift through the dark',
    sky: ['#160505', '#2e0d0a', '#2e1208'],
    neb: [['#c83c14', 0.20], ['#ff781e', 0.16], ['#a01e3c', 0.14], ['#ffbe3c', 0.10]],
    pl: { x: 190, y: 620, r: 74, ring: false, glow: 'rgba(255, 120, 40, 0.4)', bands: ['#7a2d00', '#ff7847', '#ff9f43', '#ffd166'] },
    st: 0.7, sh: [3, 6] },
  { name: 'MOLTEN ROCK FIELD', tag: 'hot debris, hotter tempers',
    sky: ['#120404', '#260a08', '#2e1006'],
    neb: [['#c83c14', 0.18], ['#8c1e00', 0.16], ['#ff781e', 0.10], ['#5a1400', 0.10]],
    pl: { x: 1100, y: 640, r: 66, ring: false, glow: 'rgba(255, 100, 30, 0.4)', bands: ['#5a1e00', '#c83c14', '#ff7847', '#ffd166'] },
    st: 0.6, sh: [4, 7], db: 10 },
  { name: 'CRIMSON GIANT', tag: 'a dying red sun fills the sky',
    sky: ['#180404', '#2e0a06', '#38100a'],
    neb: [['#a31212', 0.20], ['#c83c14', 0.16], ['#781e3c', 0.14], ['#ff5d3a', 0.10]],
    pl: { x: 1020, y: 380, r: 120, kind: 'sun', glow: 'rgba(255, 60, 30, 0.5)', bands: ['#fff3d6', '#ffb347', '#ff5d3a', '#a31212'] },
    st: 0.85, sh: [2, 4] },
  { name: 'SOLAR FLARE ZONE', tag: 'the sky itself is on fire',
    sky: ['#140505', '#2a0c08', '#301408'],
    neb: [['#ff781e', 0.24], ['#ffc83c', 0.18], ['#c83c14', 0.16], ['#ffbe3c', 0.12]],
    pl: { x: 1080, y: 300, r: 44, kind: 'sun', glow: 'rgba(255, 180, 60, 0.5)', bands: ['#fffbe8', '#ffe66d', '#ff9f43'] },
    st: 0.7, sh: [0.8, 1.6], fog: 'rgba(255, 120, 40, 0.05)' },
  { name: 'HIVE NEST', tag: 'the Ember Hive broods in the dark',
    sky: ['#100404', '#220a08', '#280e08'],
    neb: [['#781e28', 0.22], ['#a01e3c', 0.18], ['#50284e', 0.14], ['#c83c14', 0.10]],
    pl: { x: 170, y: 480, r: 96, ring: true, glow: 'rgba(255, 90, 60, 0.35)', bands: ['#3c0a0a', '#a02828', '#5a1414', '#c85050'] },
    st: 0.9, sh: [3, 5], db: 6 },
  { name: 'DARK MATTER DRIFT', tag: 'almost nothing — and it watches',
    sky: ['#010808', '#041614', '#061e1a'],
    neb: [['#148c78', 0.12], ['#1e6464', 0.10], ['#3c2d78', 0.10], ['#0f5a50', 0.08]],
    pl: null, st: 0.5, sh: [6, 10], fog: 'rgba(20, 120, 100, 0.04)' },
  { name: 'FROZEN WASTES', tag: 'auroras dance over an ice moon',
    sky: ['#020a12', '#071e26', '#0a2830'],
    neb: [['#2d8cb8', 0.20], ['#39ffb0', 0.12], ['#5a7ad8', 0.14], ['#dfeaff', 0.08]],
    pl: { x: 180, y: 500, r: 84, kind: 'moon', glow: 'rgba(140, 200, 240, 0.3)', bands: ['#0a2030', '#7fb8d8', '#dfeaff', '#a8d8f0'] },
    st: 0.9, sh: [3, 6], au: 'rgba(57, 255, 176, 0.18)' },
  { name: 'EVENT HORIZON', tag: 'a black hole bends the starlight',
    sky: ['#010104', '#050514', '#0a0a24'],
    neb: [['#3c2d8c', 0.20], ['#145a8c', 0.16], ['#781e78', 0.14], ['#283c8c', 0.12]],
    pl: { x: 1040, y: 420, r: 88, kind: 'hole', glow: 'rgba(120, 80, 220, 0.45)', bands: ['#ffd166', '#ff7847', '#fff3d6'] },
    st: 1, sh: [2, 4], db: 4 },
  { name: 'VOID STORM', tag: 'the void churns — hold on',
    sky: ['#020a0a', '#06201e', '#082e26'],
    neb: [['#14a078', 0.26], ['#28c8a0', 0.20], ['#783cc8', 0.18], ['#3cdcc8', 0.12]],
    pl: null, st: 0.75, sh: [1, 2], db: 6, nm: 1.6, fog: 'rgba(40, 200, 160, 0.07)' },
  { name: "WRAITH'S THRONE", tag: 'the Void Wraith waits in the dark',
    sky: ['#010606', '#04141a', '#061e22'],
    neb: [['#148c78', 0.20], ['#3c2d8c', 0.16], ['#0f5a50', 0.14], ['#28c8a0', 0.10]],
    pl: { x: 170, y: 480, r: 82, ring: true, glow: 'rgba(57, 255, 176, 0.3)', bands: ['#0b3d2c', '#39ffb0', '#062e22', '#7ef0c1'] },
    co: { x: 1090, y: 200, r: 40, kind: 'moon', glow: 'rgba(120, 200, 170, 0.25)', bands: ['#1e2d28', '#5a7a6e', '#9ab8a8', '#3c5a50'] },
    st: 1, sh: [3, 5] },
];
export function arenaOf(level) {
  return ARENAS[Math.max(0, Math.min(ARENAS.length - 1, (level | 0) - 1))];
}
export function sectorAccent(level) {
  return SECTORS[sectorOf(level)].accent;
}
export function sectorWeight(kind, sector) {
  if (sector === 1) {
    if (kind === 'speeder' || kind === 'shooter') return 1.6;
    if (kind === 'drone') return 0.7;
  }
  if (sector === 2) {
    if (kind === 'drone' || kind === 'swarm') return 1.6;
    if (kind === 'speeder') return 0.7;
  }
  return 1;
}
