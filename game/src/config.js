// STARFALL — all difficulty tuning in one place.
export const VIEW = { width: 1280, height: 800 };
export const SHIP = {
  radius: 22,
  accel: 2600,        
  maxSpeed: 560,      
  drag: 3.2,          
  mouseFollow: 14,    
  invulnerableMs: 1600, 
  fireCooldownMs: 170,  
};
export const BULLET = {
  radius: 6,
  damage: 1,
  speed: 940,       // +20%: the stream feels fast and modern
  maxOnScreen: 40,
};
export const ASTEROID = {
  baseSpawnPerSec: 1.35,  
  spawnGrowth: 0.22,      
  baseSpeed: 130,         
  speedGrowth: 16,        
  maxSpeed: 430,
  radiusMin: 16,
  radiusMax: 46,
  maxOnScreen: 26,
};
export const ENEMY = {
  speeder: { radius: 13, speed: 340, speedGrowth: 12, score: 30, spawnFromLevel: 1, weight: 3 },
  splitter: { radius: 44, speed: 90, speedGrowth: 4, score: 40, spawnFromLevel: 3, weight: 2, shardSpeed: 260, shardRadius: 13 },
  mine: { radius: 18, speed: 55, armRadius: 130, fuseMs: 650, blastRadius: 110, score: 50, spawnFromLevel: 3, weight: 2 },
  drone: { radius: 17, speed: 150, speedGrowth: 10, score: 60, spawnFromLevel: 4, weight: 2, weaveAmp: 90, weaveFreq: 2.2, chase: 0.55 },
  shooter: { radius: 19, speed: 70, speedGrowth: 4, score: 80, spawnFromLevel: 5, weight: 2, hoverY: 190, fireIntervalMs: 2100, boltSpeed: 360 },
  swarm: { radius: 10, speed: 300, speedGrowth: 10, score: 20, spawnFromLevel: 6, weight: 3, packSize: 5, weaveAmp: 70, weaveFreq: 3.2 },
  colossus: { radius: 68, speed: 55, speedGrowth: 2, score: 150, spawnFromLevel: 7, weight: 1, hp: 6 },
  dasher: { radius: 14, speed: 180, speedGrowth: 8, score: 70, spawnFromLevel: 8, weight: 2, telegraphMs: 500, dashSpeed: 720, dashMs: 650 },
  sniper: { radius: 17, speed: 60, speedGrowth: 3, score: 90, spawnFromLevel: 10, weight: 2, hoverY: 150, chargeMs: 700, fireIntervalMs: 2400, boltSpeed: 620 },
  weaver: { radius: 15, speed: 120, speedGrowth: 6, score: 60, spawnFromLevel: 4, weight: 2, weaveAmp: 230, weaveFreq: 2.6, fireIntervalMs: 3600, boltSpeed: 340 },
  carrier: { radius: 30, speed: 70, speedGrowth: 3, score: 100, spawnFromLevel: 7, weight: 2, hp: 3 },
  maxOnScreen: 34,
};
export const EBULLET = {
  radius: 7,
  speed: 360,       // +20%: enemy fire keeps pace with the faster player stream
  maxOnScreen: 30,
};
export const MINIBOSS = {
  radius: 46,
  hp: 12,              
  hpGrowth: 4,
  score: 300,
  strafeSpeed: 220,
  fireIntervalMs: 1550,
  y: 170,
};
export const BOSS = {
  radius: 78,
  hp: 26,              
  hpGrowth: 8,         
  score: 500,          
  driftSpeed: 150,     
  spawnIntervalMs: 2600, 
  y: 150,              
};
export const BOSS_STYLES = [
  {
    name: 'MOTHERSHIP', tint: '#ff5d8f', hull: 'saucer', pattern: 'drones',
    score: 500,
    driftSpeed: 150, spawnIntervalMs: 2600, fireIntervalMs: 0, teleportMs: 0,
  },
  {
    name: 'EMBER HIVE', tint: '#ff7847', hull: 'hex', pattern: 'spread',
    score: 600,
    driftSpeed: 110, spawnIntervalMs: 3400, fireIntervalMs: 2200, teleportMs: 0,
  },
  {
    name: 'VOID WRAITH', tint: '#39ffb0', hull: 'crescent', pattern: 'teleport',
    score: 700,
    driftSpeed: 190, spawnIntervalMs: 0, fireIntervalMs: 1750, teleportMs: 4200,
  },
];
export const STAR = {
  baseSpawnPerSec: 2.2,
  spawnGrowth: 0.05,      
  baseSpeed: 95,
  speedGrowth: 6,
  maxSpeed: 210,
  radius: 13,
  comboWindowMs: 2600,    
  value: 10,              
  cometChance: 0.045,
  cometValue: 50,
};
export const POWERUP = {
  spawnEverySec: 12,      
  fallSpeed: 80,
  radius: 20,
  slowmoFactor: 0.45,     
  slowmoMs: 6000,
  shieldHits: 1,          
  magnetMs: 8000,         
  magnetRadius: 320,      
  doubleMs: 9000,         
  spreadMs: 10000,        
  overdriveMs: 8000,      
  ghostMs: 6000,          
  pierceMs: 10000,        
};
export const BOMB = {
  startStock: 3,      // bombs every run starts with
  maxStock: 5,        // the most a pilot can carry
  refillPerMission: 1, // earned back for finishing a mission
  bossDamage: 8,      // a guardian survives a bomb (26 HP) — heavy hit, never an instant kill
  minibossDamage: 6,  // a raider survives too (12 HP)
  cooldownMs: 800,    // no double-taps from one press
};
export const RUSH_LEVELS = [5, 10, 15];
export const LEVELS = {
  starsPerLevel: 12,      
  maxLevel: 15,
  bossEvery: 5,           
  minibossEvery: 3,       
};
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
export const UPGRADES = [
  { id: 'rapid', name: 'RAPID FIRE', desc: 'Shoot 15% faster', icon: '»', costs: [15, 30, 50] },
  { id: 'heavy', name: 'HEAVY ROUNDS', desc: '+1 bullet damage', icon: '✦', costs: [20, 40] },
  { id: 'spread', name: 'SPREAD CANNON', desc: '+1 bullet per shot', icon: '⁂', costs: [25, 45] },
  { id: 'hull', name: 'REINFORCED HULL', desc: '+1 max life', icon: '♥', costs: [30, 55] },
  { id: 'shield', name: 'AEGIS SHIELD', desc: 'Shield blocks +1 hit', icon: '◉', costs: [20, 40] },
  { id: 'magnet', name: 'MAGNET CORE', desc: 'Stars drift to you', icon: 'M', costs: [15, 30, 50] },
];
export const SKINS = [
  { id: 'azure', name: 'AZURE DART', desc: 'The trusty starter', cost: 0, unlock: 'free',
    hull: ['#bfe9ff', '#39c6ff', '#1d6fd1'], glow: '#39c6ff', bullet: '#7ef0ff', flame: [255, 140, 60],
    wing: 'dart', trim: '#0b3d66', canopy: '#dff6ff' },
  { id: 'crimson', name: 'CRIMSON FALCON', desc: 'Unlock: earn 150 shards', cost: 150, unlock: 'shards',
    hull: ['#ffd9d9', '#ff5d5d', '#a4133c'], glow: '#ff5d5d', bullet: '#ffb703', flame: [255, 90, 90],
    wing: 'falcon', trim: '#5c0a1e', canopy: '#ffe9c9' },
  { id: 'golden', name: 'GOLDEN COMET', desc: 'Unlock: earn 400 shards', cost: 400, unlock: 'shards',
    hull: ['#fff7cc', '#ffd166', '#b8860b'], glow: '#ffd166', bullet: '#ffe66d', flame: [255, 200, 60],
    wing: 'delta', trim: '#6b4e00', canopy: '#fff3b0' },
  { id: 'void', name: 'VOID WRAITH', desc: 'Unlock: beat level 10', cost: 0, unlock: 'level10',
    hull: ['#d8fff4', '#39ffb0', '#0b6e4f'], glow: '#39ffb0', bullet: '#7ef0c1', flame: [60, 255, 180],
    wing: 'wraith', trim: '#06382a', canopy: '#d8fff4' },
  { id: 'solar', name: 'SOLAR PHOENIX', desc: 'Unlock: earn 700 shards', cost: 700, unlock: 'shards',
    hull: ['#ffe0b3', '#ff9f43', '#c1440e'], glow: '#ff9f43', bullet: '#ffb703', flame: [255, 160, 60],
    wing: 'phoenix', trim: '#5e2200', canopy: '#ffe0b3' },
  { id: 'nebula', name: 'NEBULA GHOST', desc: 'Unlock: clear the campaign', cost: 0, unlock: 'level15',
    hull: ['#e9d5ff', '#b388ff', '#4c1d95'], glow: '#b388ff', bullet: '#e9d5ff', flame: [180, 140, 255],
    wing: 'ghost', trim: '#2a1052', canopy: '#f3e8ff' },
];
export const GAME = {
  startLives: 3,
  maxLives: 5,            
  nearMissBonus: 5,       
  nearMissRadius: 46,     
};
export const MUSIC = {
  bpm: 112,
  bassGain: 0.05,
  leadGain: 0.035,
  sets: [
    { bass: [55.0, 55.0, 65.41, 49.0, 55.0, 55.0, 82.41, 73.42], arp: [220.0, 261.63, 329.63, 392.0, 440.0, 329.63, 261.63, 196.0] },
    { bass: [49.0, 49.0, 58.27, 43.65, 49.0, 49.0, 73.42, 65.41], arp: [196.0, 233.08, 293.66, 349.23, 392.0, 293.66, 233.08, 174.61] },
    { bass: [65.41, 65.41, 55.0, 73.42, 65.41, 65.41, 49.0, 58.27], arp: [261.63, 311.13, 392.0, 466.16, 523.25, 392.0, 311.13, 233.08] },
  ],
};
export const EVENTS = {
  minGapMs: 40000,
  maxGapMs: 70000,
  meteorMs: 12000,   
  starRainMs: 10000, 
  flareMs: 8000,     
  shardSurgeMs: 15000, 
};
