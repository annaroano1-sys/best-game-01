// STARFALL — the game loop: states (start, playing, paused, shop,
// mission, over, victory), missions, sectors, events, shooting,
// collisions, combo scoring, upgrades, skins, achievements, bosses,
// and the render order. Everything else is a module this file wires
// together.
//
// Two modes: CAMPAIGN (15 levels, missions, victory at the end) and
// ENDLESS DRIFT (levels never end, difficulty keeps climbing).

import { BOSS, ENEMY, GAME, LEVELS, POWERUP, SECTORS, SHIP, SKINS, STAR, VIEW } from './config.js';
import { createInput } from './input.js';
import { createShip, updateShip, drawShip, isInvulnerable } from './ship.js';
import { createAsteroidField, makeAsteroid, updateAsteroids, drawAsteroids, resolveRockHits } from './asteroids.js';
import { createEnemyField, updateEnemies, drawEnemies, resolveBulletHits, fusedMines, spawnEnemy, shipHitEnemy, enemyShots } from './enemies.js';
import { createStarField, updateStars, drawStars, dropSupply } from './stars.js';
import { createBackdrop, drawBackdrop, createParticles, burst, spawnPopup, updateParticles, drawParticles, setBackdropSector, shockwave } from './particles.js';
import { createBullets, fireBullet, updateBullets, drawBullets } from './bullets.js';
import { createEBullets, fireEBullet, updateEBullets, drawEBullets } from './ebullets.js';
import { createBoss, updateBoss, hitBoss, drawBoss } from './boss.js';
import { createMiniboss, updateMiniboss, hitMiniboss, drawMiniboss } from './miniboss.js';
import { startMusic, stopMusic, setMusicSector } from './music.js';
import { createHud, showHud, showScreen, updateHud, showToast, showBanner, showBossBar, showGameOver, showStartTop, showMissionComplete, showVictory, showAchievementToast } from './hud.js';
import { ensureAudio, setMuted, isMuted, playCollect, playHit, playPowerup, playLevelUp, playGameOver, playClick, playShoot, playExplode, playBossHit, playBossDown, playMagnet, playNearMiss, playBomb, playBuy, playAchievement, playMinibossHit, playMinibossDown, playEnemyShoot } from './audio.js';
import { pick } from './random.js';
import { sectorOf, sectorName } from './sectors.js';
import { missionFor, missionProgress, missionDone, missionStars } from './missions.js';
import { loadSkins, saveSkins, addLifetimeShards, lifetimeShards, markBeatLevel10, checkUnlocks, skinById } from './skins.js';
import { loadAchievements, checkAchievements, achievementList } from './achievements.js';
import { createEventState, updateEvents } from './events.js';
import { createUpgrades, renderShop, fireCooldownMs, bulletDamage, bulletCount, shieldHits, magnetRadiusBonus, extraLives } from './shop.js';
import { loadSettings, saveSettings, applySettings } from './settings.js';

const BEST_KEY = 'starfall-best-score';
const BEST_ENDLESS_KEY = 'starfall-best-endless';
const TOP_KEY = 'starfall-top-scores';
const TOP_ENDLESS_KEY = 'starfall-top-endless';
const MISSION_STARS_KEY = 'starfall-mission-stars';

// Dev affordance for play-testing: ?level=5 starts a run at level 5
// (a boss level). Harmless in normal play — the game is identical.
const START_LEVEL = Math.max(1, Math.min(LEVELS.maxLevel,
  Number(new URLSearchParams(location.search).get('level') ?? 1) || 1));

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
let missionStarsBest = loadMissionStars();

let state = 'start'; // 'start' | 'playing' | 'paused' | 'shop' | 'mission' | 'over' | 'victory'
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
let slowmoUntil = 0;
let lastShotAt = 0;
let shakeUntil = 0;
let shakePower = 0;
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
  return Number(localStorage.getItem(mode === 'endless' ? BEST_ENDLESS_KEY : BEST_KEY) ?? 0) || 0;
}

function saveBest(mode, value) {
  localStorage.setItem(mode === 'endless' ? BEST_ENDLESS_KEY : BEST_KEY, String(value));
}

function readTopScores(mode) {
  try {
    const parsed = JSON.parse(localStorage.getItem(mode === 'endless' ? TOP_ENDLESS_KEY : TOP_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveTopScores(mode, list) {
  localStorage.setItem(mode === 'endless' ? TOP_ENDLESS_KEY : TOP_KEY, JSON.stringify(list));
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
    magnetUntil: 0,
    doubleUntil: 0,
    spreadUntil: 0,
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
  };
}

/** Effective difficulty level: endless runs cap the spawn math at 25. */
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
  });
  for (const a of gained) {
    showAchievementToast(hud, a);
    playAchievement();
  }
  return gained;
}

/** Enter a level: fresh per-level counters, mission, sector, guardians. */
function levelStart(level, now) {
  run.starsThisLevel = 0;
  run.killsThisLevel = 0;
  run.hitsThisLevel = 0;
  run.bossDownThisLevel = false;
  run.cleanLevel = false;
  levelStartAt = now;
  mission = missionFor(level);
  const sector = sectorOf(level);
  if (backdrop.sector !== sector) {
    setBackdropSector(backdrop, sector);
    setMusicSector(sector);
    run.sectorName = sectorName(level);
    showBanner(hud, `SECTOR: ${sectorName(level)}`, 'new skies, new dangers', 2400);
  }
  boss = null;
  miniboss = null;
  if (isBossLevel(level)) spawnBoss();
  else if (isMinibossLevel(level)) spawnMiniboss();
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
  run = freshRun(mode);
  best = loadBest(mode);
  topScores = readTopScores(mode);
  slowmoUntil = 0;
  lastShotAt = 0;
  shakeUntil = 0;
  finalLevelPending = false;
  input.clearOneShots();
  showHud(hud, true);
  showScreen(hud, null);
  showBossBar(hud, null);
  levelStart(run.level, performance.now());
  updateHud(hud, run, missionText());
  startMusic();
  state = 'playing';
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
  showGameOver(hud, run, best, isNewBest, topScores, { ...run, upgradesBought: run.upgrades.bought });
  showScreen(hud, 'over');
}

function endVictory() {
  state = 'victory';
  stopMusic();
  playBossDown();
  addLifetimeShards(run.shardsEarned);
  checkUnlocks(skinState);
  grantAchievements();
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
  showVictory(hud, run, totalStars);
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
  grantAchievements();
  playLevelUp();
  burst(particles, ship.x, ship.y - 20, '#ffd166', 40, 420);
  finalLevelPending = run.mode === 'campaign' && run.level >= LEVELS.maxLevel;
  showMissionComplete(hud, mission, stars, mission.reward);
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
  hud.shopShards.textContent = `◆ ${run.shards} shards`;
  renderShop(hud.shopCards, run.upgrades, run.shards, (track, cost) => {
    run.shards -= cost;
    hud.shopShards.textContent = `◆ ${run.shards} shards`;
    playBuy();
    grantAchievements();
    openShopRefresh();
  });
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
  // A hull upgrade tops the ship back up to its new max life.
  const maxLives = GAME.maxLives + extraLives(run.upgrades);
  if (run.lives < maxLives) run.lives = Math.min(run.lives + 1, maxLives);
  run.level += 1;
  showScreen(hud, null);
  levelStart(run.level, performance.now());
  updateHud(hud, run, missionText());
  state = 'playing';
}

function spawnBoss() {
  if (boss) return;
  const bossNumber = run.level / LEVELS.bossEvery;
  boss = createBoss(bossNumber, SECTORS[sectorOf(run.level)].bossTint);
  showBossBar(hud, boss);
  showBanner(hud, '⚠ MOTHERSHIP ⚠', 'sink it for +500', 2400);
  burst(particles, boss.x, boss.y, '#ff5d8f', 50, 380);
}

function spawnMiniboss() {
  if (miniboss) return;
  const number = run.level / LEVELS.minibossEvery;
  miniboss = createMiniboss(number);
  showBanner(hud, '⚠ RAIDER ⚠', 'a gunship is hunting you', 2200);
  burst(particles, miniboss.x, miniboss.y, '#ff9f43', 40, 360);
}

function bossDefeated(now) {
  const gained = BOSS.score * scoreMultiplier(now);
  run.score += gained;
  run.kills += 1;
  run.killsThisLevel += 1;
  run.bossesDown += 1;
  run.bossDownThisLevel = true;
  spawnPopup(particles, boss.x, boss.y, `MOTHERSHIP +${gained}`, '#ff8fb0');
  burst(particles, boss.x, boss.y, '#ff5d8f', 90, 520);
  burst(particles, boss.x, boss.y, '#ffd166', 60, 420);
  shockwave(particles, boss.x, boss.y, '#ff5d8f', 260);
  shake(18, 500, now);
  playBossDown();
  grantAchievements();
  showBanner(hud, 'MOTHERSHIP DOWN!', `+${gained} points`);
  // The wreck drops a gift.
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
  burst(particles, miniboss.x, miniboss.y, '#ff9f43', 70, 480);
  burst(particles, miniboss.x, miniboss.y, '#ffd166', 40, 380);
  shockwave(particles, miniboss.x, miniboss.y, '#ff9f43', 200);
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
  run.shards += 1;
  run.shardsEarned += 1;
  playCollect(run.combo);
  burst(particles, star.x, star.y, star.comet ? '#ff5d8f' : '#ffd166', star.comet ? 26 : 14, star.comet ? 320 : 200);
  spawnPopup(particles, star.x, star.y - 18, `+${gained}`, star.comet ? '#ff5d8f' : '#ffe66d');
  grantAchievements();
}

function detonateBomb(now) {
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
  }
  enemies.list = [];
  ebullets.list = [];
  if (boss) {
    boss.hp -= 3;
    if (boss.hp <= 0) bossDefeated(now);
  }
  if (miniboss) {
    miniboss.hp -= 3;
    if (miniboss.hp <= 0) minibossDefeated(now);
  }
  shockwave(particles, ship.x, ship.y - 40, '#ff5d5d', 420);
  burst(particles, ship.x, ship.y - 40, '#ffd166', 60, 520);
  shake(20, 600, now);
  playBomb();
  spawnPopup(particles, ship.x, ship.y - 60, `BOMB! ${cleared} cleared`, '#ff5d5d');
  showToast(hud, 'SCREEN BOMB!');
}

function collectPowerup(powerup, now) {
  playPowerup();
  const color = { shield: '#7ef0c1', slowmo: '#c77dff', life: '#ff5d8f', magnet: '#ffb703', double: '#39c6ff', spread: '#ff9f43', bomb: '#ff5d5d' }[powerup.kind];
  burst(particles, powerup.x, powerup.y, color, 22, 260);
  if (powerup.kind === 'shield') {
    run.shield = true;
    ship.shield = true;
    ship.shieldHits = shieldHits(run.upgrades);
    showToast(hud, 'SHIELD UP!');
  } else if (powerup.kind === 'slowmo') {
    slowmoUntil = now + POWERUP.slowmoMs;
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
  } else if (powerup.kind === 'bomb') {
    detonateBomb(now);
  }
}

function hitShip(now) {
  if (isInvulnerable(ship, now)) return;
  run.hitsThisLevel += 1;
  burst(particles, ship.x, ship.y, '#ff5d8f', 34, 420);
  shake(12, 320, now);
  if (run.shield) {
    ship.shieldHits -= 1;
    if (ship.shieldHits <= 0) {
      run.shield = false;
      ship.shield = false;
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
  const timeScale = now < slowmoUntil ? POWERUP.slowmoFactor : 1;
  const worldScale = timeScale * eventState.slowMult;
  const level = diffLevel();
  const sector = sectorOf(run.level);

  // Random events roll on while the run lasts.
  const ev = updateEvents(eventState, now, () => dropSupply(stars));
  if (ev) showBanner(hud, ev.label, ev.sub, 2400);

  // Shooting: hold Space or the mouse to keep firing.
  if (input.firing && now - lastShotAt >= fireCooldownMs(run.upgrades)) {
    const count = Math.max(bulletCount(run.upgrades), now < run.spreadUntil ? 3 : 1);
    if (fireBullet(bullets, ship.x, ship.y, count, bulletDamage(run.upgrades))) {
      lastShotAt = now;
      playShoot();
    }
  }

  updateShip(ship, input, dt, now);
  updateAsteroids(asteroids, level, dt, worldScale, (boss ? 0.35 : 1) * eventState.rockMult);
  updateEnemies(enemies, level, sector, dt, worldScale, ship, now);
  updateStars(stars, level, dt, timeScale, eventState.starMult);
  updateBullets(bullets, dt, timeScale);
  updateEBullets(ebullets, dt, worldScale);
  updateParticles(particles, dt);

  // The magnet pulls nearby stars toward the ship.
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

  // The boss drops drones and rocks while it lives.
  if (boss) {
    const drop = updateBoss(boss, dt, worldScale, now);
    if (drop === 'drone') spawnEnemy(enemies, 'drone', boss.x + (Math.random() * 120 - 60), boss.y + 50);
    if (drop === 'rock') {
      const rock = makeAsteroid(level);
      rock.x = boss.x + (Math.random() * 120 - 60);
      rock.y = boss.y + 50;
      asteroids.list.push(rock);
    }
    showBossBar(hud, boss);
  }

  // The raider strafes and shoots back.
  if (miniboss) {
    if (updateMiniboss(miniboss, dt, worldScale, now) === 'shoot') {
      if (fireEBullet(ebullets, miniboss.x, miniboss.y + 20, ship.x, ship.y)) playEnemyShoot();
    }
  }

  // Gunners fire aimed bolts at the ship.
  for (const gunner of enemyShots(enemies, dt, worldScale)) {
    if (fireEBullet(ebullets, gunner.x, gunner.y + 16, ship.x, ship.y)) playEnemyShoot();
  }

  // Bullets vs rocks, specials, the raider and the boss.
  for (const event of resolveRockHits(asteroids, bullets.list)) {
    if (event.type === 'destroyed') applyKill(event, now);
    else burst(particles, event.x, event.y, '#cdd6e4', 8, 160);
  }
  for (const event of resolveBulletHits(enemies, bullets.list)) {
    if (event.type === 'blast') {
      run.score += event.score * scoreMultiplier(now);
      handleBlast(event.x, event.y, now);
    } else if (event.type === 'destroyed') applyKill(event, now);
    else burst(particles, event.x, event.y, '#e8e8ff', 8, 160);
  }
  if (miniboss) {
    for (const b of bullets.list) {
      if (b.spent) continue;
      if (!circleHits(b, miniboss)) continue;
      b.spent = true;
      if (hitMiniboss(miniboss, now, b.damage)) minibossDefeated(now);
      else {
        playMinibossHit();
        burst(particles, b.x, b.y, '#ffd166', 6, 140);
      }
      break;
    }
  }
  if (boss) {
    for (const b of bullets.list) {
      if (b.spent) continue;
      if (!circleHits(b, boss)) continue;
      b.spent = true;
      if (hitBoss(boss, now, b.damage)) bossDefeated(now);
      else {
        playBossHit();
        burst(particles, b.x, b.y, '#ffd166', 6, 140);
      }
      break;
    }
  }
  bullets.list = bullets.list.filter((b) => !b.spent);

  // Mines whose fuse ran out detonate on their own.
  for (const mine of fusedMines(enemies, now)) handleBlast(mine.x, mine.y, now);

  // Enemy bolts vs the ship.
  for (const eb of [...ebullets.list]) {
    if (circleHits(ship, eb)) {
      eb.spent = true;
      hitShip(now);
      if (state !== 'playing') return;
    }
  }
  ebullets.list = ebullets.list.filter((b) => !b.spent);

  // Pick-ups.
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

  // Hits: rocks, specials, the raider and the boss itself.
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

  // Near misses pay a little: grazing a rock without touching it.
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

  // Mission complete? The run pauses for the mission screen + shop.
  if (missionDone(mission, run, { levelTimeSec: levelTimeSec(now), bossDownThisLevel: run.bossDownThisLevel })) {
    completeMission(now);
    return;
  }

  updateHud(hud, run, missionText());
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
  drawBullets(ctx, bullets, ship.skin.bullet);
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
    updateHud(hud, run, missionText());
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

  if (state === 'playing') update(dt, now);
  else if (state === 'start') updateParticles(particles, dt);
  render(dt, now);
  requestAnimationFrame(frame);
}

// ---------- Start screen panels ----------

function hidePanels() {
  for (const id of ['panel-howto', 'panel-settings', 'panel-hangar', 'panel-achievements']) {
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

function refreshStartScreen() {
  const newSkins = checkUnlocks(skinState);
  void newSkins;
  showStartTop(hud, readTopScores('campaign'));
  document.getElementById('start-best').textContent = String(loadBest('campaign'));
  document.getElementById('start-best-endless').textContent = String(loadBest('endless'));
  document.getElementById('hangar-shards').textContent = `◆ ${lifetimeShards()} lifetime shards earned`;
  renderHangar();
  renderAchievements();
  const musicSlider = document.getElementById('set-music');
  const sfxSlider = document.getElementById('set-sfx');
  const muteBtn = document.getElementById('set-mute');
  musicSlider.value = String(settings.music);
  sfxSlider.value = String(settings.sfx);
  muteBtn.textContent = settings.muted ? '🔇 MUTED' : '🔊 SOUND ON';
}

// Buttons.
document.getElementById('btn-start').addEventListener('click', () => { playClick(); startRun('campaign'); });
document.getElementById('btn-endless').addEventListener('click', () => { playClick(); startRun('endless'); });
document.getElementById('btn-restart').addEventListener('click', () => { playClick(); startRun(lastMode); });
document.getElementById('btn-resume').addEventListener('click', () => { playClick(); resumeGame(); });
document.getElementById('btn-menu').addEventListener('click', () => { playClick(); backToMenu(); });
document.getElementById('btn-mission-continue').addEventListener('click', () => continueMission());
document.getElementById('btn-shop-continue').addEventListener('click', () => continueShop());
document.getElementById('btn-victory-again').addEventListener('click', () => { playClick(); startRun(lastMode); });
document.getElementById('btn-victory-menu').addEventListener('click', () => { playClick(); backToMenu(); });
document.getElementById('btn-howto').addEventListener('click', () => { playClick(); togglePanel('panel-howto'); });
document.getElementById('btn-settings').addEventListener('click', () => { playClick(); togglePanel('panel-settings'); });
document.getElementById('btn-hangar').addEventListener('click', () => { playClick(); togglePanel('panel-hangar'); });
document.getElementById('btn-achievements').addEventListener('click', () => { playClick(); togglePanel('panel-achievements'); });
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

// Losing the tab pauses the run, so the ship is never punished for looking away.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});

// Test hook: lets automated play-tests read (never write) the run state.
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
  get boss() { return boss ? { x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp } : null; },
  get miniboss() { return miniboss ? { x: miniboss.x, y: miniboss.y, hp: miniboss.hp, maxHp: miniboss.maxHp } : null; },
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
