// STARFALL tuning: every number that shapes how the game feels lives here,
// so difficulty can be re-balanced in one place without touching the logic.

export const VIEW = { width: 1280, height: 800 };

export const SHIP = {
  radius: 22,
  accel: 2600,        // px/s^2 while a key is held
  maxSpeed: 560,      // px/s
  drag: 3.2,          // velocity damping per second
  mouseFollow: 14,    // steering strength toward the mouse
  invulnerableMs: 1600, // grace period after a hit
  fireCooldownMs: 170,  // time between shots while firing
};

export const BULLET = {
  radius: 6,
  damage: 1,
  speed: 780,       // px/s, straight up
  maxOnScreen: 40,
};

export const ASTEROID = {
  baseSpawnPerSec: 1.2,   // at level 1
  spawnGrowth: 0.22,      // extra spawns/sec per level
  baseSpeed: 130,         // px/s at level 1
  speedGrowth: 16,        // extra px/s per level
  maxSpeed: 430,
  radiusMin: 16,
  radiusMax: 46,
  maxOnScreen: 26,
};

// The threat roster. Each kind has its own look, movement and score,
// so later levels feel different instead of just faster.
export const ENEMY = {
  // Small, quick rocks that streak down in a slight zigzag.
  speeder: { radius: 13, speed: 340, speedGrowth: 12, score: 30, spawnFromLevel: 2, weight: 3 },
  // Big slow rocks that break into two fast shards when destroyed.
  splitter: { radius: 44, speed: 90, speedGrowth: 4, score: 40, spawnFromLevel: 3, weight: 2, shardSpeed: 260, shardRadius: 13 },
  // Drifting mines: they pulse, and when the ship comes close they arm,
  // flash a warning ring, then detonate. Shoot them from afar — or run.
  mine: { radius: 18, speed: 55, armRadius: 130, fuseMs: 650, blastRadius: 110, score: 50, spawnFromLevel: 3, weight: 2 },
  // Drones weave side to side and drift toward the ship's x position.
  drone: { radius: 17, speed: 150, speedGrowth: 10, score: 60, spawnFromLevel: 4, weight: 2, weaveAmp: 90, weaveFreq: 2.2, chase: 0.55 },
  // Gunners hover near the top and shoot aimed bolts at the ship.
  shooter: { radius: 19, speed: 70, speedGrowth: 4, score: 80, spawnFromLevel: 5, weight: 2, hoverY: 190, fireIntervalMs: 2300, boltSpeed: 300 },
  // Swarms arrive in packs of five small, fast, weaving darts.
  swarm: { radius: 10, speed: 300, speedGrowth: 10, score: 20, spawnFromLevel: 6, weight: 3, packSize: 5, weaveAmp: 70, weaveFreq: 3.2 },
  // Colossi are giant slow rocks with six hit points and a huge payout.
  colossus: { radius: 68, speed: 55, speedGrowth: 2, score: 150, spawnFromLevel: 7, weight: 1, hp: 6 },
  maxOnScreen: 34,
};

export const EBULLET = {
  radius: 7,
  speed: 300,       // px/s, aimed at the ship
  maxOnScreen: 30,
};

export const MINIBOSS = {
  // The RAIDER: a fast gunship that guards levels 3, 6, 9 and 12.
  radius: 46,
  hp: 12,              // hits to destroy (grows per raider)
  hpGrowth: 4,
  score: 300,
  strafeSpeed: 220,
  fireIntervalMs: 1700,
  y: 170,
};

export const BOSS = {
  radius: 78,
  hp: 26,              // hits to destroy (grows a little per boss)
  hpGrowth: 8,         // extra hp per boss after the first
  score: 500,          // bonus for destroying it
  driftSpeed: 150,     // side-to-side drift
  spawnIntervalMs: 2600, // how often it drops a drone or a rock
  y: 150,              // cruising height
};

export const STAR = {
  baseSpawnPerSec: 2.0,
  spawnGrowth: 0.05,      // barely grows: stars stay collectible at high levels
  baseSpeed: 95,
  speedGrowth: 6,
  maxSpeed: 210,
  radius: 13,
  comboWindowMs: 2600,    // collect again within this to keep the chain alive
  value: 10,              // points per star, times the combo multiplier
  // A rare golden comet: worth five stars at once, and it feeds the combo.
  cometChance: 0.045,
  cometValue: 50,
};

export const POWERUP = {
  spawnEverySec: 12,      // on average one power-up this often
  fallSpeed: 80,
  radius: 20,
  slowmoFactor: 0.45,     // world speed while slow-mo is active
  slowmoMs: 6000,
  shieldHits: 1,          // hits a shield absorbs
  magnetMs: 8000,         // stars fly to the ship while the magnet is on
  magnetRadius: 320,      // stars inside this range get pulled in
  doubleMs: 9000,         // score x2 while double-score is on
  spreadMs: 10000,        // three-way fire while spread is on
};

export const LEVELS = {
  starsPerLevel: 12,      // stars collected to reach the next level (collect missions)
  maxLevel: 15,
  bossEvery: 5,           // a boss guards every 5th level (5, 10, 15)
  minibossEvery: 3,       // a raider guards every 3rd level (3, 6, 9, 12)
};

// Three sectors, five levels each: every sector has its own name, palette,
// music and enemy flavour, so the campaign visibly changes as you advance.
export const SECTORS = [
  {
    name: 'NEBULA DRIFT',
    levels: [1, 5],
    sky: ['#050516', '#0a0a2e', '#12082e'],
    nebula: [
      { color: 'rgba(80, 40, 160, 0.20)' },
      { color: 'rgba(20, 90, 140, 0.18)' },
      { color: 'rgba(160, 40, 110, 0.14)' },
      { color: 'rgba(255, 150, 60, 0.10)' },
    ],
    accent: '#39c6ff',
    bossTint: '#ff5d8f',
  },
  {
    name: 'EMBER REEF',
    levels: [6, 10],
    sky: ['#160505', '#2e0d0a', '#2e1208'],
    nebula: [
      { color: 'rgba(200, 60, 20, 0.20)' },
      { color: 'rgba(255, 120, 30, 0.16)' },
      { color: 'rgba(160, 30, 60, 0.14)' },
      { color: 'rgba(255, 190, 60, 0.10)' },
    ],
    accent: '#ff9f43',
    bossTint: '#ff7847',
  },
  {
    name: 'VOID ABYSS',
    levels: [11, 15],
    sky: ['#020a0a', '#06201e', '#082e26'],
    nebula: [
      { color: 'rgba(20, 160, 120, 0.20)' },
      { color: 'rgba(40, 200, 160, 0.14)' },
      { color: 'rgba(120, 60, 200, 0.14)' },
      { color: 'rgba(60, 220, 190, 0.10)' },
    ],
    accent: '#39ffb0',
    bossTint: '#39ffb0',
  },
];

// The upgrade shop: six tracks, three ranks each. Costs are in star shards
// (one shard per star collected, plus mission rewards).
export const UPGRADES = [
  { id: 'rapid', name: 'RAPID FIRE', desc: 'Shoot 15% faster', icon: '»', costs: [15, 30, 50] },
  { id: 'heavy', name: 'HEAVY ROUNDS', desc: '+1 bullet damage', icon: '✦', costs: [20, 40] },
  { id: 'spread', name: 'SPREAD CANNON', desc: '+1 bullet per shot', icon: '⁂', costs: [25, 45] },
  { id: 'hull', name: 'REINFORCED HULL', desc: '+1 max life', icon: '♥', costs: [30, 55] },
  { id: 'shield', name: 'AEGIS SHIELD', desc: 'Shield blocks +1 hit', icon: '◉', costs: [20, 40] },
  { id: 'magnet', name: 'MAGNET CORE', desc: 'Stars drift to you', icon: 'M', costs: [15, 30, 50] },
];

// Ship skins: the default is free; the rest unlock with lifetime shards
// earned or by beating level 10. Each skin recolors the hull, the flame,
// the bullets and the engine trail.
export const SKINS = [
  { id: 'azure', name: 'AZURE DART', desc: 'The trusty starter', cost: 0, unlock: 'free',
    hull: ['#bfe9ff', '#39c6ff', '#1d6fd1'], glow: '#39c6ff', bullet: '#7ef0ff', flame: [255, 140, 60] },
  { id: 'crimson', name: 'CRIMSON FALCON', desc: 'Unlock: earn 150 shards', cost: 150, unlock: 'shards',
    hull: ['#ffd9d9', '#ff5d5d', '#a4133c'], glow: '#ff5d5d', bullet: '#ffb703', flame: [255, 90, 90] },
  { id: 'golden', name: 'GOLDEN COMET', desc: 'Unlock: earn 400 shards', cost: 400, unlock: 'shards',
    hull: ['#fff7cc', '#ffd166', '#b8860b'], glow: '#ffd166', bullet: '#ffe66d', flame: [255, 200, 60] },
  { id: 'void', name: 'VOID WRAITH', desc: 'Unlock: beat level 10', cost: 0, unlock: 'level10',
    hull: ['#d8fff4', '#39ffb0', '#0b6e4f'], glow: '#39ffb0', bullet: '#7ef0c1', flame: [60, 255, 180] },
];

export const GAME = {
  startLives: 3,
  maxLives: 5,            // extra lives can push past 3 now
  nearMissBonus: 5,       // grazing a rock (close, no hit) pays a little
  nearMissRadius: 46,     // how close a graze has to be
};

export const MUSIC = {
  bpm: 112,
  bassGain: 0.05,
  leadGain: 0.035,
  // One bass line + arpeggio per sector, so the music changes with the sky.
  sets: [
    { bass: [55.0, 55.0, 65.41, 49.0, 55.0, 55.0, 82.41, 73.42], arp: [220.0, 261.63, 329.63, 392.0, 440.0, 329.63, 261.63, 196.0] },
    { bass: [49.0, 49.0, 58.27, 43.65, 49.0, 49.0, 73.42, 65.41], arp: [196.0, 233.08, 293.66, 349.23, 392.0, 293.66, 233.08, 174.61] },
    { bass: [65.41, 65.41, 55.0, 73.42, 65.41, 65.41, 49.0, 58.27], arp: [261.63, 311.13, 392.0, 466.16, 523.25, 392.0, 311.13, 233.08] },
  ],
};

// Random events: every 40–70 seconds something shakes the run up.
export const EVENTS = {
  minGapMs: 40000,
  maxGapMs: 70000,
  meteorMs: 12000,   // rocks rain three times as fast
  starRainMs: 10000, // stars rain four times as fast
  flareMs: 8000,     // all enemies slowed to half speed
};
