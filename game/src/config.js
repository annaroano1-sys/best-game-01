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

// The new threat roster. Each kind has its own look, movement and score,
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
  maxOnScreen: 30,
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
};

export const LEVELS = {
  starsPerLevel: 12,      // stars collected to reach the next level
  maxLevel: 15,
  bossEvery: 5,           // a boss guards every 5th level (5, 10, 15)
};

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
};
