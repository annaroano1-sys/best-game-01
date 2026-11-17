// STARFALL — the game loop: states, missions, shooting, bosses, Boss Rush.
import { BOMB, BOSS, ENEMY, GAME, LEVELS, POWERUP, RUSH_LEVELS, SHIP, SKINS, STAR, VIEW } from './config.js';
import { createInput } from './input.js';
import { createShip, updateShip, drawShip, isInvulnerable } from './ship.js';
import { createAsteroidField, makeAsteroid, updateAsteroids, drawAsteroids, resolveRockHits } from './asteroids.js';
import { createEnemyField, updateEnemies, drawEnemies, resolveBulletHits, fusedMines, spawnEnemy, shipHitEnemy, enemyShots, sniperShots, weaverShots } from './enemies.js';
import { createStarField, updateStars, drawStars, dropSupply, dropPowerup } from './stars.js';
import { createBackdrop, drawBackdrop, createParticles, burst, spawnPopup, updateParticles, drawParticles, setBackdropArena, shockwave, screenFlash, emitTrail, clearPopups } from './particles.js';
import { createBullets, fireBullet, updateBullets, drawBullets } from './bullets.js';
import { createEBullets, fireEBullet, updateEBullets, drawEBullets } from './ebullets.js';
import { createBoss, updateBoss, hitBoss, drawBoss } from './boss.js';
import { createMiniboss, updateMiniboss, hitMiniboss, drawMiniboss } from './miniboss.js';
import { startMusic, stopMusic, setMusicSector, setBossMode, isBossLayerOn } from './music.js';
import { createHud, showHud, showScreen, updateHud, showToast, showBanner, showBossBar, showGameOver, showStartTop, showMissionComplete, showVictory, showAchievementToast, showPauseStats, clearOverlays } from './hud.js';
import { ensureAudio, setMuted, isMuted, playCollect, playHit, playPowerup, playLevelUp, playGameOver, playClick, playShoot, playExplode, playBossHit, playBossDown, playMagnet, playNearMiss, playBomb, playBuy, playAchievement, playMinibossHit, playMinibossDown, playEnemyShoot, playBossIntro, playComboMilestone, playLowHealth, playRushClear } from './audio.js';
import { pick, rand } from './random.js';
import { sectorOf, sectorName, arenaOf } from './sectors.js';
import { missionFor, missionProgress, missionDone, missionStars } from './missions.js';
import { loadSkins, saveSkins, addLifetimeShards, lifetimeShards, markBeatLevel10, markBeatLevel15, checkUnlocks, skinById } from './skins.js';
import { loadAchievements, checkAchievements, achievementList } from './achievements.js';
import { loadProfile, recordRun, accuracyPct, formatTime } from './profile.js';
import { createEventState, updateEvents } from './events.js';
import { createUpgrades, renderShop, fireCooldownMs, bulletDamage, bulletCount, shieldHits, magnetRadiusBonus, extraLives } from './shop.js';
import { loadSettings, saveSettings, applySettings } from './settings.js';
const BEST_KEY = 'starfall-best-score';
const BEST_ENDLESS_KEY = 'starfall-best-endless';
const BEST_RUSH_KEY = 'starfall-best-rush';
const TOP_KEY = 'starfall-top-scores';
const TOP_ENDLESS_KEY = 'starfall-top-endless';
const TOP_RUSH_KEY = 'starfall-top-rush';
const MISSION_STARS_KEY = 'starfall-mission-stars';
const START_LEVEL = Math.max(1, Math.min(LEVELS.maxLevel,
  Number(new URLSearchParams(location.search).get('level') ?? 1) || 1));
const GEAR_FULL = new URLSearchParams(location.search).get('gear') === 'full';
const FORCE_EVENT = new URLSearchParams(location.search).get('event');
const FORCE_POWERUP = new URLSearchParams(location.search).get('powerup');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const hud = createHud();
const backdrop = createBackdrop();
const particles = createParticles();
const eventState = createEventState();
let settings = loadSettings();
applySettings(settings);
let skinState = loadSkins();
let achievements = loadAchievements();
let profile = loadProfile();
let missionStarsBest = loadMissionStars();
let state = 'start'; 
let ship = createShip(skinState.selected);
let asteroids = createAsteroidField();
let enemies = createEnemyField();
let stars = createStarField();
let bullets = createBullets();
let ebullets = createEBullets();
let boss = null;
let miniboss = null;
let mission = missionFor(1);
let run = freshRun('campaign');
let best = loadBest('campaign');
let topScores = readTopScores('campaign');
let lastShotAt = 0;
let shakeUntil = 0;
let shakePower = 0;
let hitStopUntil = 0; 
let lastTime = performance.now();
let levelStartAt = performance.now();
let finalLevelPending = false;
let lastMode = 'campaign';
function loadMissionStars() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MISSION_STARS_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
function saveMissionStars() {
  localStorage.setItem(MISSION_STARS_KEY, JSON.stringify(missionStarsBest));
}
function loadBest(mode) {
  const key = mode === 'endless' ? BEST_ENDLESS_KEY : mode === 'rush' ? BEST_RUSH_KEY : BEST_KEY;
  return Number(localStorage.getItem(key) ?? 0) || 0;
}
function saveBest(mode, value) {
  const key = mode === 'endless' ? BEST_ENDLESS_KEY : mode === 'rush' ? BEST_RUSH_KEY : BEST_KEY;
  localStorage.setItem(key, String(value));
}
function readTopScores(mode) {
  const key = mode === 'endless' ? TOP_ENDLESS_KEY : mode === 'rush' ? TOP_RUSH_KEY : TOP_KEY;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}
function saveTopScores(mode, list) {
  const key = mode === 'endless' ? TOP_ENDLESS_KEY : mode === 'rush' ? TOP_RUSH_KEY : TOP_KEY;
  localStorage.setItem(key, JSON.stringify(list));
}
function freshRun(mode) {
  return {
    mode,
    score: 0,
    lives: GAME.startLives,
    level: START_LEVEL,
    combo: 0,
    maxCombo: 0,
    starsCollected: 0,
    starsThisLevel: 0,
    kills: 0,
    killsThisLevel: 0,
    lastCollectAt: 0,
    shield: false,
    shieldHits: 0,
    shieldMax: 1,
    slowmoUntil: 0,
    magnetUntil: 0,
    doubleUntil: 0,
    spreadUntil: 0,
    overdriveUntil: 0,
    ghostUntil: 0,
    pierceUntil: 0,
    bombs: BOMB.startStock,
    bombsUsed: 0,
    bombAt: 0,
    muted: isMuted(),
    shards: 0,
    shardsEarned: 0,
    upgrades: createUpgrades(),
    hitsThisLevel: 0,
    bossesDown: 0,
    minibossesDown: 0,
    bossDownThisLevel: false,
    cleanLevel: false,
    sectorName: sectorName(START_LEVEL),
    rushStage: 0,
    rushBossesDown: 0,
    carriersDown: 0,
    pierceCollected: 0,
    shotsFired: 0,
    shotsHit: 0,
    startedAt: 0,
    hintStep: -1,
    hintAt: 0,
    coachSeen: new Set(),
  };
}
function diffLevel() {
  return Math.min(run.level, 25);
}
function isBossLevel(level) {
  return level % LEVELS.bossEvery === 0;
}
function isMinibossLevel(level) {
  return level % LEVELS.minibossEvery === 0 && !isBossLevel(level);
}
function levelTimeSec(now) {
  return Math.max(0, (now - levelStartAt) / 1000);
}
function grantAchievements() {
  const gained = checkAchievements(achievements, {
    kills: run.kills,
    starsCollected: run.starsCollected,
    maxCombo: run.maxCombo,
    bossesDown: run.bossesDown,
    minibossesDown: run.minibossesDown,
    shardsEarned: run.shardsEarned,
    upgradesBought: run.upgrades.bought,
    level: run.level,
    cleanLevel: run.cleanLevel,
    mode: run.mode,
    rushBossesDown: run.rushBossesDown,
    carriersDown: run.carriersDown,
    pierceCollected: run.pierceCollected,
  });
  for (const a of gained) {
    showAchievementToast(hud, a);
    playAchievement();
  }
  return gained;
}
function levelStart(level, now) {
  run.starsThisLevel = 0;
  run.killsThisLevel = 0;
  run.hitsThisLevel = 0;
  run.bossDownThisLevel = false;
  run.cleanLevel = false;
  levelStartAt = now;
  mission = missionFor(level);
  const sector = sectorOf(level);
  const arena = arenaOf(level);
  const wasSector = backdrop.sector;
  setBackdropArena(backdrop, level);
  if (wasSector !== sector) {
    setMusicSector(sector);
    run.sectorName = sectorName(level);
    showBanner(hud, `SECTOR: ${sectorName(level)}`, `${arena.name} — ${arena.tag}`, 2400);
  } else {
    showBanner(hud, arena.name, arena.tag, 1700);
  }
  boss = null;
  miniboss = null;
  if (isBossLevel(level)) spawnBoss();
  else if (isMinibossLevel(level)) spawnMiniboss();
  if (run.mode === 'campaign' && level === 1) {
    run.hintStep = 0;
    run.hintAt = now + 800;
  } else {
    run.hintStep = -1;
  }
  if (run.mode === 'rush' && run.rushStage === 0 && !run.coachSeen.has('rush')) {
    run.coachSeen.add('rush');
    showToast(hud, 'BOSS RUSH — three guardians, one run. Spend shards between fights!', 4200);
  }
}
function startRun(mode) {
  ensureAudio();
  lastMode = mode;
  ship = createShip(skinState.selected);
  asteroids = createAsteroidField();
  enemies = createEnemyField();
  stars = createStarField();
  bullets = createBullets();
  ebullets = createEBullets();
  boss = null;
  miniboss = null;
  eventState.active = null;
  eventState.nextAt = 0;
  eventState.forceKind = FORCE_EVENT;
  stars.forcePowerup = FORCE_POWERUP;
  run = freshRun(mode);
  if (mode === 'rush') {
    run.level = RUSH_LEVELS[0];
    run.rushStage = 0;
  }
  run.startedAt = performance.now();
  best = loadBest(mode);
  topScores = readTopScores(mode);
  if (GEAR_FULL) {
    run.upgrades.ranks = { rapid: 3, heavy: 2, spread: 2, hull: 2, shield: 2, magnet: 3 };
    run.upgrades.bought = 14;
    run.lives = GAME.maxLives + extraLives(run.upgrades);
    run.shards = 200;
    run.shardsEarned = 200;
  }
  lastShotAt = 0;
  shakeUntil = 0;
  hitStopUntil = 0;
  finalLevelPending = false;
  input.clearOneShots();
  showHud(hud, true);
  showScreen(hud, null);
  showBossBar(hud, null);
  levelStart(run.level, performance.now());
  syncHud();
  startMusic();
  state = 'playing';
}
function profileSnapshot(won, rushWon) {
  return {
    kills: run.kills,
    starsCollected: run.starsCollected,
    maxCombo: run.maxCombo,
    bossesDown: run.bossesDown,
    minibossesDown: run.minibossesDown,
    timeMs: Math.max(0, performance.now() - run.startedAt),
    shotsFired: run.shotsFired,
    shotsHit: run.shotsHit,
    won,
    rushWon,
  };
}
function endRun() {
  state = 'over';
  stopMusic();
  playGameOver();
  showBossBar(hud, null);
  const gained = addLifetimeShards(run.shardsEarned);
  void gained;
  const newSkins = checkUnlocks(skinState);
  void newSkins;
  grantAchievements();
  recordRun(profile, profileSnapshot(false, false));
  const isNewBest = run.score > best;
  if (isNewBest) {
    best = run.score;
    saveBest(run.mode, best);
  }
  topScores = [...topScores, { score: run.score, level: run.level, stars: run.starsCollected }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  saveTopScores(run.mode, topScores);
  showHud(hud, false);
  clearOverlays(hud);
  clearPopups(particles);
  showGameOver(hud, run, best, isNewBest, topScores, { ...run, upgradesBought: run.upgrades.bought });
  showScreen(hud, 'over');
}
function endVictory() {
  state = 'victory';
  stopMusic();
  playBossDown();
  addLifetimeShards(run.shardsEarned);
  if (run.mode === 'campaign') markBeatLevel15();
  checkUnlocks(skinState);
  grantAchievements();
  recordRun(profile, profileSnapshot(run.mode === 'campaign', run.mode === 'rush'));
  const isNewBest = run.score > best;
  if (isNewBest) {
    best = run.score;
    saveBest(run.mode, best);
  }
  topScores = [...topScores, { score: run.score, level: run.level, stars: run.starsCollected }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  saveTopScores(run.mode, topScores);
  const totalStars = Object.values(missionStarsBest).reduce((a, b) => a + b, 0);
  showHud(hud, false);
  clearOverlays(hud);
  clearPopups(particles);
  showVictory(hud, run, totalStars, run.mode);
  showScreen(hud, 'victory');
}
function backToMenu() {
  state = 'start';
  stopMusic();
  showHud(hud, false);
  showScreen(hud, 'start');
  refreshStartScreen();
}
function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  stopMusic();
  showPauseStats(hud, run, missionText());
  clearOverlays(hud);
  clearPopups(particles);
  showScreen(hud, 'pause');
}
function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  showScreen(hud, null);
  input.clearOneShots();
  lastTime = performance.now();
  if (!isMuted()) startMusic();
}
function shake(power, ms, now) {
  shakePower = Math.max(shakePower, power);
  shakeUntil = now + ms;
}
function scoreMultiplier(now) {
  return now < run.doubleUntil ? 2 : 1;
}
function missionText() {
  const progress = missionProgress(mission, run, { levelTimeSec: levelTimeSec(performance.now()), bossDownThisLevel: run.bossDownThisLevel });
  return `${mission.label} ${progress}/${mission.target}`;
}
function missionFraction() {
  const progress = missionProgress(mission, run, { levelTimeSec: levelTimeSec(performance.now()), bossDownThisLevel: run.bossDownThisLevel });
  return Math.max(0, Math.min(1, progress / mission.target));
}
function syncHud(now = performance.now()) {
  updateHud(hud, run, missionText(), now, missionFraction());
}
function completeMission(now) {
  const stars = missionStars(mission, run.hitsThisLevel);
  const prev = missionStarsBest[run.level] ?? 0;
  if (stars > prev) {
    missionStarsBest[run.level] = stars;
    saveMissionStars();
  }
  run.shards += mission.reward;
  run.shardsEarned += mission.reward;
  if (run.hitsThisLevel === 0) run.cleanLevel = true;
  if (run.level === 10) markBeatLevel10();
  // A finished mission earns a bomb back (up to the carry limit) — bombs are
  // rare, but a pilot who keeps clearing missions never runs dry for long.
  const bombsBefore = run.bombs;
  run.bombs = Math.min(BOMB.maxStock, run.bombs + BOMB.refillPerMission);
  const bombsRefilled = run.bombs - bombsBefore;
  grantAchievements();
  if (run.mode === 'rush') playRushClear();
  else playLevelUp();
  burst(particles, ship.x, ship.y - 20, '#ffd166', 40, 420);
  finalLevelPending = (run.mode === 'campaign' && run.level >= LEVELS.maxLevel)
    || (run.mode === 'rush' && run.rushStage >= RUSH_LEVELS.length - 1);
  showMissionComplete(hud, mission, stars, mission.reward, bombsRefilled);
  clearOverlays(hud);
  clearPopups(particles);
  showScreen(hud, 'mission');
  input.clearOneShots();
  state = 'mission';
}
function continueMission() {
  playClick();
  if (finalLevelPending) {
    finalLevelPending = false;
    endVictory();
    return;
  }
  openShop();
}
function openShop() {
  const rush = run.mode === 'rush';
  document.getElementById('shop-tagline').textContent = rush
    ? 'Spend your shards before the next boss.'
    : 'Spend your shards before the next level.';
  document.getElementById('btn-shop-continue').textContent = rush
    ? 'LAUNCH → NEXT BOSS'
    : 'LAUNCH → NEXT LEVEL';
  hud.shopShards.textContent = `◆ ${run.shards} shards`;
  renderShop(hud.shopCards, run.upgrades, run.shards, (track, cost) => {
    run.shards -= cost;
    hud.shopShards.textContent = `◆ ${run.shards} shards`;
    playBuy();
    grantAchievements();
    openShopRefresh();
  });
  clearOverlays(hud);
  clearPopups(particles);
  showScreen(hud, 'shop');
  input.clearOneShots();
  state = 'shop';
}
function openShopRefresh() {
  hud.shopShards.textContent = `◆ ${run.shards} shards`;
  renderShop(hud.shopCards, run.upgrades, run.shards, (track, cost) => {
    run.shards -= cost;
    hud.shopShards.textContent = `◆ ${run.shards} shards`;
    playBuy();
    grantAchievements();
    openShopRefresh();
  });
}
function continueShop() {
  playClick();
  const maxLives = GAME.maxLives + extraLives(run.upgrades);
  if (run.mode === 'rush') run.lives = maxLives; // a rush breather patches the ship to full: every guardian is met fresh
  else if (run.lives < maxLives) run.lives = Math.min(run.lives + 1, maxLives);
  if (run.mode === 'rush') {
    run.rushStage += 1;
    run.level = RUSH_LEVELS[run.rushStage];
  } else {
    run.level += 1;
  }
  showScreen(hud, null);
  levelStart(run.level, performance.now());
  syncHud();
  state = 'playing';
}
function spawnBoss() {
  if (boss) return;
  const bossNumber = run.level / LEVELS.bossEvery;
  boss = createBoss(bossNumber, sectorOf(run.level));
  showBossBar(hud, boss);
  playBossIntro();
  const sub = boss.style.pattern === 'spread'
    ? 'five-way fire — keep moving'
    : boss.style.pattern === 'teleport'
      ? 'it blinks — watch the flash'
      : `sink it for +${boss.score}`;
  showBanner(hud, `⚠ ${boss.name} ⚠`, sub, 2400);
  burst(particles, boss.x, boss.y, boss.tint, 50, 380);
}
function spawnMiniboss() {
  if (miniboss) return;
  const number = run.level / LEVELS.minibossEvery;
  miniboss = createMiniboss(number);
  showBanner(hud, '⚠ RAIDER ⚠', 'a gunship is hunting you', 2200);
  burst(particles, miniboss.x, miniboss.y, '#ff9f43', 40, 360);
}
function bossDefeated(now) {
  const gained = boss.score * scoreMultiplier(now);
  run.score += gained;
  run.kills += 1;
  run.killsThisLevel += 1;
  run.bossesDown += 1;
  if (run.mode === 'rush') run.rushBossesDown += 1;
  run.bossDownThisLevel = true;
  spawnPopup(particles, boss.x, boss.y, `${boss.name} +${gained}`, '#ff8fb0');
  burst(particles, boss.x, boss.y, boss.tint, 110, 560);
  burst(particles, boss.x, boss.y, '#ffd166', 80, 460);
  burst(particles, boss.x, boss.y, '#ffffff', 40, 380);
  shockwave(particles, boss.x, boss.y, boss.tint, 320);
  shockwave(particles, boss.x, boss.y, '#ffd166', 220);
  screenFlash(particles);
  shake(18, 500, now);
  playBossDown();
  grantAchievements();
  showBanner(hud, `${boss.name} DOWN!`, `+${gained} points`);
  stars.powerups.push({
    x: boss.x, y: boss.y, vy: POWERUP.fallSpeed,
    radius: POWERUP.radius, kind: pick(['shield', 'magnet', 'double', 'life']), phase: 0,
  });
  boss = null;
  showBossBar(hud, null);
}
function minibossDefeated(now) {
  const gained = 300 * scoreMultiplier(now);
  run.score += gained;
  run.kills += 1;
  run.killsThisLevel += 1;
  run.minibossesDown += 1;
  spawnPopup(particles, miniboss.x, miniboss.y, `RAIDER +${gained}`, '#ff9f43');
  burst(particles, miniboss.x, miniboss.y, '#ff9f43', 90, 520);
  burst(particles, miniboss.x, miniboss.y, '#ffd166', 50, 400);
  burst(particles, miniboss.x, miniboss.y, '#ffffff', 24, 320);
  shockwave(particles, miniboss.x, miniboss.y, '#ff9f43', 240);
  shockwave(particles, miniboss.x, miniboss.y, '#ffd166', 160);
  screenFlash(particles);
  shake(14, 420, now);
  playMinibossDown();
  grantAchievements();
  showBanner(hud, 'RAIDER DOWN!', `+${gained} points`);
  for (const kind of pick([['shield', 'magnet'], ['double', 'life'], ['spread', 'bomb']])) {
    stars.powerups.push({
      x: miniboss.x + (Math.random() * 80 - 40), y: miniboss.y, vy: POWERUP.fallSpeed,
      radius: POWERUP.radius, kind, phase: 0,
    });
  }
  miniboss = null;
}
function collectStar(star, now) {
  const chained = now - run.lastCollectAt <= STAR.comboWindowMs;
  run.combo = chained ? run.combo + 1 : 1;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  run.lastCollectAt = now;
  const base = star.comet ? STAR.cometValue : STAR.value;
  const gained = base * run.combo * scoreMultiplier(now);
  run.score += gained;
  run.starsCollected += 1;
  run.starsThisLevel += 1;
  run.shards += eventState.shardMult;
  run.shardsEarned += eventState.shardMult;
  playCollect(run.combo);
  if (run.combo % 10 === 0) playComboMilestone();
  burst(particles, star.x, star.y, star.comet ? '#ff5d8f' : '#ffd166', star.comet ? 26 : 14, star.comet ? 320 : 200);
  spawnPopup(particles, star.x, star.y - 18, `+${gained}`, star.comet ? '#ff5d8f' : '#ffe66d');
  grantAchievements();
}
function detonateBomb(now, bossDamage = 3, minibossDamage = 3) {
  const mult = scoreMultiplier(now);
  let cleared = 0;
  for (const a of [...asteroids.list]) {
    run.score += a.score * mult;
    run.kills += 1;
    run.killsThisLevel += 1;
    cleared += 1;
    burst(particles, a.x, a.y, '#ff9f43', 12, 260);
  }
  asteroids.list = [];
  for (const e of [...enemies.list]) {
    run.score += e.score * mult;
    run.kills += 1;
    run.killsThisLevel += 1;
    cleared += 1;
    burst(particles, e.x, e.y, '#ff9f43', 12, 260);
    if (e.kind === 'carrier') {
      run.carriersDown += 1;
      dropPowerup(stars, e.x, e.y);
    }
  }
  enemies.list = [];
  ebullets.list = [];
  if (boss) {
    boss.hp -= bossDamage;
    if (boss.hp <= 0) bossDefeated(now);
  }
  if (miniboss) {
    miniboss.hp -= minibossDamage;
    if (miniboss.hp <= 0) minibossDefeated(now);
  }
  shockwave(particles, ship.x, ship.y - 40, '#ff5d5d', 420);
  shockwave(particles, ship.x, ship.y - 40, '#ffd166', 300);
  burst(particles, ship.x, ship.y - 40, '#ffd166', 60, 520);
  screenFlash(particles);
  shake(20, 600, now);
  playBomb();
  spawnPopup(particles, ship.x, ship.y - 60, `BOMB! ${cleared} cleared`, '#ff5d5d');
  showToast(hud, 'SCREEN BOMB!');
  return cleared;
}
// The pilot's own bomb: a limited stock (3 per run), fired with B or the
// big on-screen 💣 button. Same screen-clearing blast as the power-up,
// but it hits guardians much harder — and one extra giant ring, because
// a bomb you chose to spend should feel bigger than one you picked up.
function useStockBomb(now) {
  if (state !== 'playing') return false;
  if (run.bombs <= 0) {
    showToast(hud, 'NO BOMBS LEFT — finish a mission to earn one!');
    return false;
  }
  if (now - run.bombAt < BOMB.cooldownMs) return false;
  run.bombAt = now;
  run.bombs -= 1;
  run.bombsUsed += 1;
  const cleared = detonateBomb(now, BOMB.bossDamage, BOMB.minibossDamage);
  shockwave(particles, ship.x, ship.y - 40, '#ffffff', 640);
  burst(particles, ship.x, ship.y - 40, '#ffffff', 50, 620);
  shake(26, 700, now);
  showBanner(hud, '💣 BOMB!', cleared > 0 ? `${cleared} hostiles cleared` : 'the sky is clear', 1500);
  syncHud(now);
  return true;
}
function collectPowerup(powerup, now) {
  playPowerup();
  const color = { shield: '#7ef0c1', slowmo: '#c77dff', life: '#ff5d8f', magnet: '#ffb703', double: '#39c6ff', spread: '#ff9f43', bomb: '#ff5d5d', overdrive: '#ff2e88', ghost: '#b388ff', pierce: '#9bf00b' }[powerup.kind];
  burst(particles, powerup.x, powerup.y, color, 22, 260);
  if (powerup.kind === 'shield') {
    run.shield = true;
    ship.shield = true;
    ship.shieldHits = shieldHits(run.upgrades);
    run.shieldHits = ship.shieldHits;
    run.shieldMax = ship.shieldHits;
    showToast(hud, 'SHIELD UP!');
  } else if (powerup.kind === 'slowmo') {
    run.slowmoUntil = now + POWERUP.slowmoMs;
    showToast(hud, 'SLOW-MO!');
  } else if (powerup.kind === 'life') {
    const maxLives = GAME.maxLives + extraLives(run.upgrades);
    if (run.lives < maxLives) {
      run.lives += 1;
      showToast(hud, '+1 LIFE!');
    } else {
      run.score += 250;
      showToast(hud, '+250 BONUS!');
    }
  } else if (powerup.kind === 'magnet') {
    run.magnetUntil = now + POWERUP.magnetMs;
    playMagnet();
    showToast(hud, 'STAR MAGNET!');
  } else if (powerup.kind === 'double') {
    run.doubleUntil = now + POWERUP.doubleMs;
    showToast(hud, 'DOUBLE SCORE!');
  } else if (powerup.kind === 'spread') {
    run.spreadUntil = now + POWERUP.spreadMs;
    showToast(hud, 'SPREAD FIRE!');
  } else if (powerup.kind === 'overdrive') {
    run.overdriveUntil = now + POWERUP.overdriveMs;
    showToast(hud, 'OVERDRIVE!');
  } else if (powerup.kind === 'ghost') {
    run.ghostUntil = now + POWERUP.ghostMs;
    ship.ghostUntil = now + POWERUP.ghostMs;
    burst(particles, ship.x, ship.y, '#b388ff', 30, 320);
    showToast(hud, 'GHOST MODE!');
  } else if (powerup.kind === 'pierce') {
    run.pierceUntil = now + POWERUP.pierceMs;
    run.pierceCollected += 1;
    burst(particles, ship.x, ship.y, '#9bf00b', 30, 320);
    showToast(hud, 'PIERCING SHOTS!');
  } else if (powerup.kind === 'bomb') {
    detonateBomb(now);
  }
}
function hitShip(now) {
  if (now < run.ghostUntil) return;
  if (isInvulnerable(ship, now)) return;
  run.hitsThisLevel += 1;
  burst(particles, ship.x, ship.y, '#ff5d8f', 34, 420);
  shake(12, 320, now);
  if (run.shield) {
    ship.shieldHits -= 1;
    run.shieldHits = ship.shieldHits;
    if (ship.shieldHits <= 0) {
      run.shield = false;
      ship.shield = false;
      run.shieldHits = 0;
      ship.invulnerableUntil = now + SHIP.invulnerableMs;
      playHit();
      showToast(hud, 'SHIELD DOWN!');
    } else {
      ship.invulnerableUntil = now + SHIP.invulnerableMs;
      playHit();
      showToast(hud, 'SHIELD HELD!');
    }
    return;
  }
  run.lives -= 1;
  run.combo = 0;
  playHit();
  if (run.lives === 1) playLowHealth();
  if (run.lives <= 0) {
    endRun();
    return;
  }
  ship.invulnerableUntil = now + SHIP.invulnerableMs;
  showToast(hud, 'HIT!');
}
function handleBlast(x, y, now) {
  burst(particles, x, y, '#ff9f43', 60, 480);
  burst(particles, x, y, '#ff5d5d', 40, 380);
  shockwave(particles, x, y, '#ff9f43', 180);
  shake(14, 380, now);
  playExplode();
  const dx = ship.x - x;
  const dy = ship.y - y;
  if (dx * dx + dy * dy < (ENEMY.mine.blastRadius + ship.radius) ** 2) hitShip(now);
}
function applyKill(event, now) {
  const gained = event.score * scoreMultiplier(now);
  run.score += gained;
  run.kills += 1;
  run.killsThisLevel += 1;
  run.shotsHit += 1;
  if (event.enemy.kind === 'carrier') {
    run.carriersDown += 1;
    dropPowerup(stars, event.x, event.y);
  }
  const color = event.enemy.kind ? '#d0a6ff' : '#8d99ae';
  burst(particles, event.x, event.y, color, 26, 340);
  if (gained > 0) spawnPopup(particles, event.x, event.y - 14, `+${gained}`);
  playExplode();
  grantAchievements();
}
function circleHits(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}
function update(dt, now) {
  const timeScale = now < run.slowmoUntil ? POWERUP.slowmoFactor : 1;
  const worldScale = timeScale * eventState.slowMult;
  const level = diffLevel();
  const sector = sectorOf(run.level);
  const ghosting = now < run.ghostUntil;
  const overdrive = now < run.overdriveUntil;
  const piercing = now < run.pierceUntil;
  if (run.hintStep >= 0 && now >= run.hintAt) {
    const hints = [
      'MOVE: WASD or mouse — FIRE: hold Space',
      'Catch stars to build your COMBO',
      'Grab glowing orbs for POWER-UPS',
      'Fill the MISSION bar for ★★★ and bonus shards',
    ];
    if (run.hintStep < hints.length) {
      showToast(hud, hints[run.hintStep], 4200);
      run.hintStep += 1;
      run.hintAt = now + 5200;
    } else {
      run.hintStep = -1;
    }
  }
  if (!run.coachSeen.has('weaver') && enemies.list.some((e) => e.kind === 'weaver')) {
    run.coachSeen.add('weaver');
    showToast(hud, '⚠ WEAVER — it sine-weaves across the sky. Lead your shots!', 4200);
  } else if (!run.coachSeen.has('carrier') && enemies.list.some((e) => e.kind === 'carrier')) {
    run.coachSeen.add('carrier');
    showToast(hud, '⚠ CARRIER — a slow freighter. Crack it open for a power-up!', 4200);
  } else if (!run.coachSeen.has('pierce') && piercing) {
    run.coachSeen.add('pierce');
    showToast(hud, '⇶ PIERCING SHOTS — your bullets fly through enemies!', 4200);
  } else if (!run.coachSeen.has('surge') && eventState.shardMult > 1) {
    run.coachSeen.add('surge');
    showToast(hud, '◆ SHARD SURGE — every star pays double shards!', 4200);
  }
  setBossMode(!!(boss || miniboss));
  const ev = updateEvents(eventState, now, () => dropSupply(stars));
  if (ev) showBanner(hud, ev.label, ev.sub, 2400);
  const cooldown = fireCooldownMs(run.upgrades) * (overdrive ? 0.5 : 1);
  if (input.firing && now - lastShotAt >= cooldown) {
    const count = Math.max(bulletCount(run.upgrades), now < run.spreadUntil ? 3 : 1);
    const damage = bulletDamage(run.upgrades) * (overdrive ? 2 : 1);
    if (fireBullet(bullets, ship.x, ship.y, count, damage)) {
      lastShotAt = now;
      run.shotsFired += count;
      playShoot();
      burst(particles, ship.x, ship.y - 26, overdrive ? '#ff2e88' : ship.skin.bullet, 3, 130);
    }
  }
  updateShip(ship, input, dt, now);
  emitTrail(particles, ship.x, ship.y + 24, `rgb(${ship.skin.flame[0]}, ${ship.skin.flame[1]}, ${ship.skin.flame[2]})`);
  updateAsteroids(asteroids, level, dt, worldScale, (boss ? 0.35 : 1) * eventState.rockMult);
  updateEnemies(enemies, level, sector, dt, worldScale, ship, now, boss ? 0.35 : 1);
  updateStars(stars, level, dt, timeScale, eventState.starMult);
  updateBullets(bullets, dt, timeScale);
  updateEBullets(ebullets, dt, worldScale);
  updateParticles(particles, dt);
  const pullRadius = now < run.magnetUntil
    ? POWERUP.magnetRadius + magnetRadiusBonus(run.upgrades)
    : (run.upgrades.ranks.magnet >= 2 ? 140 : 0);
  if (pullRadius > 0) {
    for (const s of stars.stars) {
      const dx = ship.x - s.x;
      const dy = ship.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < pullRadius && dist > 4) {
        s.x += (dx / dist) * 460 * dt;
        s.y += (dy / dist) * 460 * dt;
      }
    }
  }
  if (boss) {
    for (const drop of updateBoss(boss, dt, worldScale, now)) {
      if (drop === 'drone') spawnEnemy(enemies, 'drone', boss.x + (Math.random() * 120 - 60), boss.y + 50);
      else if (drop === 'rock') {
        const rock = makeAsteroid(level);
        rock.x = boss.x + (Math.random() * 120 - 60);
        rock.y = boss.y + 50;
        asteroids.list.push(rock);
      } else if (drop === 'spread') {
        for (let i = -2; i <= 2; i++) {
          const angle = Math.PI / 2 + i * 0.28;
          ebullets.list.push({
            x: boss.x, y: boss.y + 30,
            vx: Math.cos(angle) * 360, vy: Math.sin(angle) * 360,
            radius: 7, phase: 0, spent: false,
          });
        }
        playEnemyShoot();
      } else if (drop === 'burst') {
        for (let i = -1; i <= 1; i++) {
          const dx = ship.x + i * 60 - boss.x;
          const dy = ship.y - boss.y;
          const dist = Math.hypot(dx, dy) || 1;
          ebullets.list.push({
            x: boss.x + i * 26, y: boss.y + 30,
            vx: (dx / dist) * 380, vy: (dy / dist) * 380,
            radius: 7, phase: 0, spent: false,
          });
        }
        playEnemyShoot();
      } else if (drop === 'teleport') {
        burst(particles, boss.x, boss.y, boss.tint, 40, 420);
        boss.x = rand(160, VIEW.width - 160);
        boss.y = BOSS.y + rand(-24, 24);
        burst(particles, boss.x, boss.y, boss.tint, 40, 420);
        spawnPopup(particles, boss.x, boss.y + 60, 'IT BLINKS!', boss.tint);
      }
    }
    showBossBar(hud, boss);
  }
  if (miniboss) {
    if (updateMiniboss(miniboss, dt, worldScale, now) === 'shoot') {
      if (fireEBullet(ebullets, miniboss.x, miniboss.y + 20, ship.x, ship.y)) playEnemyShoot();
    }
  }
  for (const gunner of enemyShots(enemies, dt, worldScale)) {
    if (fireEBullet(ebullets, gunner.x, gunner.y + 16, ship.x, ship.y)) playEnemyShoot();
    // From level 8 the gunners fire a two-bolt fan, offset to either side
    // of the ship — denser, but the gap between the bolts is the dodge lane.
    if (level >= 8) {
      const side = gunner.x < ship.x ? 1 : -1;
      fireEBullet(ebullets, gunner.x, gunner.y + 16, ship.x + side * 70, ship.y + 40);
    }
  }
  for (const sniper of sniperShots(enemies)) {
    if (fireEBullet(ebullets, sniper.x, sniper.y + 16, sniper.aimX, sniper.aimY, ENEMY.sniper.boltSpeed)) playEnemyShoot();
  }
  for (const weaver of weaverShots(enemies)) {
    if (fireEBullet(ebullets, weaver.x, weaver.y + 12, ship.x, ship.y, ENEMY.weaver.boltSpeed)) playEnemyShoot();
  }
  for (const event of resolveRockHits(asteroids, bullets.list, piercing)) {
    if (event.type === 'destroyed') applyKill(event, now);
    else {
      run.shotsHit += 1;
      burst(particles, event.x, event.y, '#cdd6e4', 8, 160);
      spawnPopup(particles, event.x, event.y - 10, `-${event.damage}`, '#e8e8ff', 14, 0.5);
    }
  }
  for (const event of resolveBulletHits(enemies, bullets.list, piercing)) {
    if (event.type === 'blast') {
      run.score += event.score * scoreMultiplier(now);
      run.shotsHit += 1;
      handleBlast(event.x, event.y, now);
    } else if (event.type === 'destroyed') applyKill(event, now);
    else {
      run.shotsHit += 1;
      burst(particles, event.x, event.y, '#e8e8ff', 8, 160);
      spawnPopup(particles, event.x, event.y - 10, `-${event.damage}`, '#e8e8ff', 14, 0.5);
    }
  }
  if (miniboss) {
    for (const b of bullets.list) {
      if (b.spent || (b.hit && b.hit.has(miniboss))) continue;
      if (!circleHits(b, miniboss)) continue;
      if (piercing) {
        if (!b.hit) b.hit = new Set();
        b.hit.add(miniboss);
      } else {
        b.spent = true;
      }
      run.shotsHit += 1;
      if (hitMiniboss(miniboss, now, b.damage)) minibossDefeated(now);
      else {
        playMinibossHit();
        if (now >= hitStopUntil + 250) hitStopUntil = now + 40; // hit-stop, cooled down: a freeze every few hits, never slow motion
        spawnPopup(particles, b.x, b.y - 12, `-${b.damage}`, '#ffd166', 15, 0.5);
        burst(particles, b.x, b.y, '#ffd166', 6, 140);
      }
      break;
    }
  }
  if (boss) {
    for (const b of bullets.list) {
      if (b.spent || (b.hit && b.hit.has(boss))) continue;
      if (!circleHits(b, boss)) continue;
      if (piercing) {
        if (!b.hit) b.hit = new Set();
        b.hit.add(boss);
      } else {
        b.spent = true;
      }
      run.shotsHit += 1;
      if (hitBoss(boss, now, b.damage)) bossDefeated(now);
      else {
        playBossHit();
        if (now >= hitStopUntil + 250) hitStopUntil = now + 50; // hit-stop, cooled down: a freeze every few hits, never slow motion
        spawnPopup(particles, b.x, b.y - 12, `-${b.damage}`, '#ffd166', 15, 0.5);
        burst(particles, b.x, b.y, '#ffd166', 6, 140);
      }
      break;
    }
  }
  bullets.list = bullets.list.filter((b) => !b.spent);
  for (const mine of fusedMines(enemies, now)) handleBlast(mine.x, mine.y, now);
  if (!ghosting) {
    for (const eb of [...ebullets.list]) {
      if (circleHits(ship, eb)) {
        eb.spent = true;
        hitShip(now);
        if (state !== 'playing') return;
      }
    }
    ebullets.list = ebullets.list.filter((b) => !b.spent);
  }
  for (const star of [...stars.stars]) {
    if (circleHits(ship, star)) {
      stars.stars = stars.stars.filter((s) => s !== star);
      collectStar(star, now);
    }
  }
  for (const powerup of [...stars.powerups]) {
    if (circleHits(ship, powerup)) {
      stars.powerups = stars.powerups.filter((p) => p !== powerup);
      collectPowerup(powerup, now);
      if (state !== 'playing') return;
    }
  }
  if (!ghosting) {
    for (const asteroid of [...asteroids.list]) {
      if (circleHits(ship, asteroid)) {
        asteroids.list = asteroids.list.filter((a) => a !== asteroid);
        burst(particles, asteroid.x, asteroid.y, '#8d99ae', 20, 300);
        hitShip(now);
        if (state !== 'playing') return;
      }
    }
    const enemyHit = shipHitEnemy(enemies, ship);
    if (enemyHit) {
      burst(particles, enemyHit.x, enemyHit.y, enemyHit.color, 24, 320);
      hitShip(now);
      if (state !== 'playing') return;
    }
    if (miniboss && circleHits(ship, miniboss)) {
      hitShip(now);
      if (state !== 'playing') return;
    }
    if (boss && circleHits(ship, boss)) {
      hitShip(now);
      if (state !== 'playing') return;
    }
  }
  for (const rock of [...asteroids.list, ...enemies.list]) {
    if (rock.grazed) continue;
    const dx = ship.x - rock.x;
    const dy = ship.y - rock.y;
    const dist = Math.hypot(dx, dy);
    const r = ship.radius + rock.radius;
    if (dist > r && dist < r + GAME.nearMissRadius) {
      rock.grazed = true;
      const gained = GAME.nearMissBonus * scoreMultiplier(now);
      run.score += gained;
      spawnPopup(particles, ship.x, ship.y - 34, `CLOSE! +${gained}`, '#7ef0ff');
      playNearMiss();
    }
  }
  if (missionDone(mission, run, { levelTimeSec: levelTimeSec(now), bossDownThisLevel: run.bossDownThisLevel })) {
    completeMission(now);
    return;
  }
  syncHud(now);
}
function render(dt, now) {
  const shaking = now < shakeUntil;
  const power = shaking ? shakePower * ((shakeUntil - now) / 320) : 0;
  const shakeX = shaking ? (Math.random() * 2 - 1) * power : 0;
  const shakeY = shaking ? (Math.random() * 2 - 1) * power : 0;
  ctx.save();
  if (shaking) ctx.translate(shakeX, shakeY);
  drawBackdrop(ctx, backdrop, dt, now);
  drawStars(ctx, stars, now);
  drawAsteroids(ctx, asteroids);
  drawEnemies(ctx, enemies, now);
  if (miniboss) drawMiniboss(ctx, miniboss, now);
  if (boss) drawBoss(ctx, boss, now);
  if (state !== 'over' && state !== 'victory') drawShip(ctx, ship, now);
  drawBullets(ctx, bullets, now < run.pierceUntil ? '#9bf00b' : ship.skin.bullet, now);
  drawEBullets(ctx, ebullets);
  drawParticles(ctx, particles);
  ctx.restore();
}
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (input.consumeMute()) {
    settings.muted = !isMuted();
    setMuted(settings.muted);
    applySettings(settings);
    saveSettings(settings);
    run.muted = settings.muted;
    if (settings.muted) stopMusic();
    else if (state === 'playing') startMusic();
    syncHud();
  }
  if (input.consumePause()) {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
  if (state === 'start' && input.consumeStart()) startRun('campaign');
  else if (state === 'over' && input.consumeRestart()) startRun(lastMode);
  else if (state === 'victory' && input.consumeRestart()) startRun(lastMode);
  else if (state === 'paused' && input.consumeStart()) resumeGame();
  else if (state === 'shop' && (input.consumeStart() || input.consumeRestart())) continueShop();
  else if (state === 'mission' && (input.consumeStart() || input.consumeRestart())) continueMission();
  if (state === 'playing' && input.consumeBomb()) useStockBomb(now);
  if (state === 'playing' && now >= hitStopUntil) update(dt, now);
  else if (state === 'start') updateParticles(particles, dt);
  render(dt, now);
  requestAnimationFrame(frame);
}
function hidePanels() {
  for (const id of ['panel-howto', 'panel-settings', 'panel-hangar', 'panel-achievements', 'panel-profile']) {
    document.getElementById(id).classList.add('hidden');
  }
}
function togglePanel(id) {
  const el = document.getElementById(id);
  const wasHidden = el.classList.contains('hidden');
  hidePanels();
  if (wasHidden) el.classList.remove('hidden');
}
function renderHangar() {
  const box = document.getElementById('hangar-cards');
  box.innerHTML = '';
  for (const s of SKINS) {
    const card = document.createElement('button');
    const unlocked = skinState.unlocked.includes(s.id);
    const selected = skinState.selected === s.id;
    card.className = 'skin-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
    card.type = 'button';
    card.innerHTML = `<span class="skin-swatch" style="background:linear-gradient(180deg, ${s.hull[0]}, ${s.hull[1]}, ${s.hull[2]})"></span>`
      + `<span class="skin-name">${s.name}</span>`
      + `<span class="skin-desc">${unlocked ? (selected ? 'EQUIPPED' : s.desc) : s.desc}</span>`;
    if (unlocked) {
      card.addEventListener('click', () => {
        skinState.selected = s.id;
        saveSkins(skinState);
        ship = createShip(s.id);
        playClick();
        renderHangar();
      });
    }
    box.appendChild(card);
  }
}
function renderAchievements() {
  const box = document.getElementById('achievements-list');
  box.innerHTML = '';
  for (const a of achievementList()) {
    const got = achievements.includes(a.id);
    const li = document.createElement('li');
    li.className = got ? 'ach-got' : 'ach-locked';
    li.innerHTML = `<span class="ach-icon">${a.icon}</span><span class="ach-name">${a.name}</span><span class="ach-desc">${a.desc}</span>`;
    box.appendChild(li);
  }
  document.getElementById('achievements-count').textContent = `${achievements.length} / ${achievementList().length} unlocked`;
}
function renderProfile() {
  const box = document.getElementById('profile-stats');
  box.innerHTML = '';
  const rows = [
    ['TOTAL RUNS', String(profile.runs)],
    ['TOTAL KILLS', String(profile.kills)],
    ['STARS COLLECTED', String(profile.stars)],
    ['BEST COMBO', `×${profile.bestCombo}`],
    ['BOSSES DOWN', String(profile.bosses + profile.minibosses)],
    ['TIME PLAYED', formatTime(profile.timeMs)],
    ['ACCURACY', `${accuracyPct(profile)}%`],
    ['CAMPAIGN WINS', String(profile.wins)],
    ['RUSH WINS', String(profile.rushWins)],
  ];
  for (const [label, value] of rows) {
    const cell = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = label;
    const b = document.createElement('b');
    b.textContent = value;
    cell.append(span, b);
    box.appendChild(cell);
  }
}
function refreshStartScreen() {
  const newSkins = checkUnlocks(skinState);
  void newSkins;
  showStartTop(hud, readTopScores('campaign'));
  document.getElementById('start-best').textContent = String(loadBest('campaign'));
  document.getElementById('start-best-endless').textContent = String(loadBest('endless'));
  document.getElementById('start-best-rush').textContent = String(loadBest('rush'));
  document.getElementById('hangar-shards').textContent = `◆ ${lifetimeShards()} lifetime shards earned`;
  renderHangar();
  renderAchievements();
  renderProfile();
  const musicSlider = document.getElementById('set-music');
  const sfxSlider = document.getElementById('set-sfx');
  const muteBtn = document.getElementById('set-mute');
  musicSlider.value = String(settings.music);
  sfxSlider.value = String(settings.sfx);
  muteBtn.textContent = settings.muted ? '🔇 MUTED' : '🔊 SOUND ON';
}
document.getElementById('btn-start').addEventListener('click', () => { playClick(); startRun('campaign'); });
document.getElementById('btn-endless').addEventListener('click', () => { playClick(); startRun('endless'); });
document.getElementById('btn-rush').addEventListener('click', () => { playClick(); startRun('rush'); });
document.getElementById('btn-restart').addEventListener('click', () => { playClick(); startRun(lastMode); });
document.getElementById('btn-resume').addEventListener('click', () => { playClick(); resumeGame(); });
document.getElementById('btn-menu').addEventListener('click', () => { playClick(); backToMenu(); });
document.getElementById('btn-mission-continue').addEventListener('click', () => continueMission());
// The big on-screen bomb button (phones): a DOM button above the canvas, so
// a touch on it never reaches the canvas steering — and the 800 ms stock
// cooldown stops one tap from firing two bombs (touchstart + click).
const bombBtn = document.getElementById('btn-bomb');
function pressBombButton() {
  if (state === 'playing') useStockBomb(performance.now());
}
bombBtn.addEventListener('click', () => { playClick(); pressBombButton(); });
bombBtn.addEventListener('touchstart', (e) => { e.preventDefault(); pressBombButton(); }, { passive: false });
document.getElementById('btn-shop-continue').addEventListener('click', () => continueShop());
document.getElementById('btn-victory-again').addEventListener('click', () => { playClick(); startRun(lastMode); });
document.getElementById('btn-victory-menu').addEventListener('click', () => { playClick(); backToMenu(); });
document.getElementById('btn-howto').addEventListener('click', () => { playClick(); togglePanel('panel-howto'); });
document.getElementById('btn-settings').addEventListener('click', () => { playClick(); togglePanel('panel-settings'); });
document.getElementById('btn-hangar').addEventListener('click', () => { playClick(); togglePanel('panel-hangar'); });
document.getElementById('btn-achievements').addEventListener('click', () => { playClick(); togglePanel('panel-achievements'); });
document.getElementById('btn-profile').addEventListener('click', () => { playClick(); renderProfile(); togglePanel('panel-profile'); });
document.getElementById('set-music').addEventListener('input', (e) => {
  settings.music = Number(e.target.value);
  applySettings(settings);
  saveSettings(settings);
});
document.getElementById('set-sfx').addEventListener('input', (e) => {
  settings.sfx = Number(e.target.value);
  applySettings(settings);
  saveSettings(settings);
});
document.getElementById('set-mute').addEventListener('click', () => {
  settings.muted = !isMuted();
  setMuted(settings.muted);
  applySettings(settings);
  saveSettings(settings);
  refreshStartScreen();
  playClick();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});
window.__starfall = {
  get state() { return state; },
  get mode() { return run.mode; },
  get score() { return run.score; },
  get lives() { return run.lives; },
  get level() { return run.level; },
  get sector() { return sectorOf(run.level); },
  get sectorName() { return run.sectorName; },
  get combo() { return run.combo; },
  get kills() { return run.kills; },
  get shards() { return run.shards; },
  get mission() { return { label: mission.label, progress: missionProgress(mission, run, { levelTimeSec: levelTimeSec(performance.now()), bossDownThisLevel: run.bossDownThisLevel }), target: mission.target }; },
  get boss() { return boss ? { x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp, name: boss.name, style: boss.style.hull } : null; },
  get miniboss() { return miniboss ? { x: miniboss.x, y: miniboss.y, hp: miniboss.hp, maxHp: miniboss.maxHp } : null; },
  get overdrive() { return performance.now() < run.overdriveUntil; },
  get ghost() { return performance.now() < run.ghostUntil; },
  get pierce() { return performance.now() < run.pierceUntil; },
  get bombs() { return run.bombs; },
  get bombsUsed() { return run.bombsUsed; },
  get rushStage() { return run.rushStage; },
  get rushBosses() { return run.rushBossesDown; },
  get carriers() { return run.carriersDown; },
  get pierceCollected() { return run.pierceCollected; },
  get starsCollected() { return run.starsCollected; },
  get shardsEarned() { return run.shardsEarned; },
  get accuracy() { return run.shotsFired > 0 ? Math.round((run.shotsHit / run.shotsFired) * 100) : 0; },
  get hintStep() { return run.hintStep; },
  get musicBoss() { return isBossLayerOn(); },
  get coachSeen() { return [...run.coachSeen]; },
  get ship() { return { x: ship.x, y: ship.y }; },
  get stars() { return stars.stars.map((s) => ({ x: s.x, y: s.y, comet: !!s.comet })); },
  get asteroids() { return asteroids.list.map((a) => ({ x: a.x, y: a.y, r: a.radius })); },
  get enemies() { return enemies.list.map((e) => ({ x: e.x, y: e.y, r: e.radius, kind: e.kind })); },
  get bullets() { return bullets.list.length; },
  get ebullets() { return ebullets.list.map((b) => ({ x: b.x, y: b.y, r: b.radius })); },
  get firing() { return input.firing; },
  get powerups() { return stars.powerups.map((p) => ({ x: p.x, y: p.y, kind: p.kind })); },
  get upgrades() { return { ...run.upgrades.ranks, bought: run.upgrades.bought }; },
  get skin() { return skinState.selected; },
  get event() { return eventState.active ? eventState.active.kind : null; },
};
showHud(hud, false);
showScreen(hud, 'start');
refreshStartScreen();
requestAnimationFrame(frame);
