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

export const STAR = {
  baseSpawnPerSec: 2.0,
  spawnGrowth: 0.05,      // barely grows: stars stay collectible at high levels
  baseSpeed: 95,
  speedGrowth: 6,
  maxSpeed: 210,
  radius: 13,
  comboWindowMs: 2600,    // collect again within this to keep the chain alive
  value: 10,              // points per star, times the combo multiplier
};

export const POWERUP = {
  spawnEverySec: 13,      // on average one power-up this often
  fallSpeed: 80,
  radius: 20,
  slowmoFactor: 0.45,     // world speed while slow-mo is active
  slowmoMs: 6000,
  shieldHits: 1,          // hits a shield absorbs
};

export const LEVELS = {
  starsPerLevel: 12,      // stars collected to reach the next level
  maxLevel: 12,
};

export const GAME = {
  startLives: 3,
  maxLives: 3,
};
