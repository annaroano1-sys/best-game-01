// STARFALL — the game loop: states (start, playing, paused, over),
// spawning, shooting, collisions, combo scoring, levels, bosses, and the
// render order. Everything else is a module this file wires together.

import { BOSS, ENEMY, GAME, LEVELS, POWERUP, SHIP, STAR, VIEW } from './config.js';
import { createInput } from './input.js';
import { createShip, updateShip, drawShip, isInvulnerable } from './ship.js';
import { createAsteroidField, makeAsteroid, updateAsteroids, drawAsteroids, resolveRockHits } from './asteroids.js';
import { createEnemyField, updateEnemies, drawEnemies, resolveBulletHits, fusedMines, spawnEnemy, shipHitEnemy } from './enemies.js';
import { createStarField, updateStars, drawStars } from './stars.js';
import { createBackdrop, drawBackdrop, createParticles, burst, spawnPopup, updateParticles, drawParticles } from './particles.js';
import { createBullets, fireBullet, updateBullets, drawBullets } from './bullets.js';
import { createBoss, updateBoss, hitBoss, drawBoss } from './boss.js';
import { startMusic, stopMusic } from './music.js';
import { createHud, showHud, showScreen, updateHud, showToast, showBanner, showBossBar, showGameOver, showStartTop } from './hud.js';
import { ensureAudio, setMuted, isMuted, playCollect, playHit, playPowerup, playLevelUp, playGameOver, playClick, playShoot, playExplode, playBossHit, playBossDown, playMagnet, playNearMiss } from './audio.js';
import { pick } from './random.js';

const BEST_KEY = 'starfall-best-score';
const TOP_KEY = 'starfall-top-scores';

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

let state = 'start'; // 'start' | 'playing' | 'paused' | 'over'
let ship = createShip();
let asteroids = createAsteroidField();
let enemies = createEnemyField();
let stars = createStarField();
let bullets = createBullets();
let boss = null;
let run = freshRun();
let best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
let topScores = readTopScores();
let slowmoUntil = 0;
let lastShotAt = 0;
let shakeUntil = 0;
let shakePower = 0;
let lastTime = performance.now();

function freshRun() {
  return {
    score: 0,
    lives: GAME.startLives,
    level: START_LEVEL,
    combo: 0,
    maxCombo: 0,
    starsCollected: 0,
    starsThisLevel: 0,
    kills: 0,
    lastCollectAt: 0,
    shield: false,
    magnetUntil: 0,
    doubleUntil: 0,
    muted: isMuted(),
  };
}

function readTopScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOP_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveTopScores() {
  localStorage.setItem(TOP_KEY, JSON.stringify(topScores));
}

function isBossLevel(level) {
  return level % LEVELS.bossEvery === 0;
}

function startRun() {
  ensureAudio();
  ship = createShip();
  asteroids = createAsteroidField();
  enemies = createEnemyField();
  stars = createStarField();
  bullets = createBullets();
  boss = null;
  run = freshRun();
  slowmoUntil = 0;
  lastShotAt = 0;
  shakeUntil = 0;
  state = 'playing';
  input.clearOneShots();
  showHud(hud, true);
  showScreen(hud, null);
  showBossBar(hud, null);
  updateHud(hud, run);
  startMusic();
  if (isBossLevel(run.level)) spawnBoss();
}

function endRun() {
  state = 'over';
  stopMusic();
  playGameOver();
  showBossBar(hud, null);
  const isNewBest = run.score > best;
  if (isNewBest) {
    best = run.score;
    localStorage.setItem(BEST_KEY, String(best));
  }
  topScores = [...topScores, { score: run.score, level: run.level, stars: run.starsCollected }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  saveTopScores();
  showHud(hud, false);
  showGameOver(hud, run, best, isNewBest, topScores);
  showScreen(hud, 'over');
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

function levelUp() {
  run.level = Math.min(run.level + 1, LEVELS.maxLevel);
  run.starsThisLevel = 0;
  playLevelUp();
  showBanner(hud, `LEVEL ${run.level}`, isBossLevel(run.level) ? 'something big is coming…' : '');
  burst(particles, ship.x, ship.y - 20, '#ffd166', 40, 420);
  if (isBossLevel(run.level)) spawnBoss();
}

function spawnBoss() {
  if (boss) return;
  const bossNumber = run.level / LEVELS.bossEvery;
  boss = createBoss(bossNumber);
  showBossBar(hud, boss);
  showBanner(hud, '⚠ MOTHERSHIP ⚠', 'sink it for +500', 2400);
  burst(particles, boss.x, boss.y, '#ff5d8f', 50, 380);
}

function bossDefeated(now) {
  const gained = BOSS.score * scoreMultiplier(now);
  run.score += gained;
  run.kills += 1;
  spawnPopup(particles, boss.x, boss.y, `MOTHERSHIP +${gained}`, '#ff8fb0');
  burst(particles, boss.x, boss.y, '#ff5d8f', 90, 520);
  burst(particles, boss.x, boss.y, '#ffd166', 60, 420);
  shake(18, 500, now);
  playBossDown();
  showBanner(hud, 'MOTHERSHIP DOWN!', `+${gained} points`);
  // The wreck drops a gift.
  stars.powerups.push({
    x: boss.x, y: boss.y, vy: POWERUP.fallSpeed,
    radius: POWERUP.radius, kind: pick(['shield', 'magnet', 'double', 'life']), phase: 0,
  });
  boss = null;
  showBossBar(hud, null);
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
  playCollect(run.combo);
  burst(particles, star.x, star.y, star.comet ? '#ff5d8f' : '#ffd166', star.comet ? 26 : 14, star.comet ? 320 : 200);
  spawnPopup(particles, star.x, star.y - 18, `+${gained}`, star.comet ? '#ff5d8f' : '#ffe66d');
  if (run.starsThisLevel >= LEVELS.starsPerLevel) levelUp();
}

function collectPowerup(powerup, now) {
  playPowerup();
  const color = { shield: '#7ef0c1', slowmo: '#c77dff', life: '#ff5d8f', magnet: '#ffb703', double: '#39c6ff' }[powerup.kind];
  burst(particles, powerup.x, powerup.y, color, 22, 260);
  if (powerup.kind === 'shield') {
    run.shield = true;
    ship.shield = true;
    showToast(hud, 'SHIELD UP!');
  } else if (powerup.kind === 'slowmo') {
    slowmoUntil = now + POWERUP.slowmoMs;
    showToast(hud, 'SLOW-MO!');
  } else if (powerup.kind === 'life') {
    if (run.lives < GAME.maxLives) {
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
  }
}

function hitShip(now) {
  if (isInvulnerable(ship, now)) return;
  burst(particles, ship.x, ship.y, '#ff5d8f', 34, 420);
  shake(12, 320, now);
  if (run.shield) {
    run.shield = false;
    ship.shield = false;
    ship.invulnerableUntil = now + SHIP.invulnerableMs;
    playHit();
    showToast(hud, 'SHIELD DOWN!');
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
  const color = event.enemy.kind ? '#d0a6ff' : '#8d99ae';
  burst(particles, event.x, event.y, color, 26, 340);
  if (gained > 0) spawnPopup(particles, event.x, event.y - 14, `+${gained}`);
  playExplode();
}

function circleHits(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

function update(dt, now) {
  const timeScale = now < slowmoUntil ? POWERUP.slowmoFactor : 1;

  // Shooting: hold Space or the mouse to keep firing.
  if (input.firing && now - lastShotAt >= SHIP.fireCooldownMs) {
    if (fireBullet(bullets, ship.x, ship.y)) {
      lastShotAt = now;
      playShoot();
    }
  }

  updateShip(ship, input, dt, now);
  updateAsteroids(asteroids, run.level, dt, timeScale, boss ? 0.35 : 1);
  updateEnemies(enemies, run.level, dt, timeScale, ship, now);
  updateStars(stars, run.level, dt, timeScale);
  updateBullets(bullets, dt, timeScale);
  updateParticles(particles, dt);

  // The magnet pulls nearby stars toward the ship.
  if (now < run.magnetUntil) {
    for (const s of stars.stars) {
      const dx = ship.x - s.x;
      const dy = ship.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < POWERUP.magnetRadius && dist > 4) {
        s.x += (dx / dist) * 460 * dt;
        s.y += (dy / dist) * 460 * dt;
      }
    }
  }

  // The boss drops drones and rocks while it lives.
  if (boss) {
    const drop = updateBoss(boss, dt, timeScale, now);
    if (drop === 'drone') spawnEnemy(enemies, 'drone', boss.x + (Math.random() * 120 - 60), boss.y + 50);
    if (drop === 'rock') {
      const rock = makeAsteroid(run.level);
      rock.x = boss.x + (Math.random() * 120 - 60);
      rock.y = boss.y + 50;
      asteroids.list.push(rock);
    }
    showBossBar(hud, boss);
  }

  // Bullets vs rocks, specials, and the boss.
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
  if (boss) {
    for (const b of bullets.list) {
      if (b.spent) continue;
      if (!circleHits(b, boss)) continue;
      b.spent = true;
      if (hitBoss(boss, now)) bossDefeated(now);
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
    }
  }

  // Hits: rocks, specials, and the boss itself.
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

  updateHud(hud, run);
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
  if (boss) drawBoss(ctx, boss, now);
  if (state !== 'over') drawShip(ctx, ship, now);
  drawBullets(ctx, bullets);
  drawParticles(ctx, particles);
  ctx.restore();
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (input.consumePause()) {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }

  if (input.consumeMute()) {
    const muted = !isMuted();
    setMuted(muted);
    run.muted = muted;
    if (muted) stopMusic();
    else if (state === 'playing') startMusic();
    updateHud(hud, run);
  }

  if (state === 'start' && input.consumeStart()) startRun();
  else if (state === 'over' && input.consumeRestart()) startRun();
  else if (state === 'paused' && input.consumeStart()) resumeGame();

  if (state === 'playing') update(dt, now);
  else if (state === 'start') updateParticles(particles, dt);
  render(dt, now);
  requestAnimationFrame(frame);
}

// Buttons.
document.getElementById('btn-start').addEventListener('click', () => { playClick(); startRun(); });
document.getElementById('btn-restart').addEventListener('click', () => { playClick(); startRun(); });
document.getElementById('btn-resume').addEventListener('click', () => { playClick(); resumeGame(); });

// Losing the tab pauses the run, so the ship is never punished for looking away.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});

// Test hook: lets automated play-tests read (never write) the run state.
window.__starfall = {
  get state() { return state; },
  get score() { return run.score; },
  get lives() { return run.lives; },
  get level() { return run.level; },
  get combo() { return run.combo; },
  get kills() { return run.kills; },
  get boss() { return boss ? { x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp } : null; },
  get ship() { return { x: ship.x, y: ship.y }; },
  get stars() { return stars.stars.map((s) => ({ x: s.x, y: s.y, comet: !!s.comet })); },
  get asteroids() { return asteroids.list.map((a) => ({ x: a.x, y: a.y, r: a.radius })); },
  get enemies() { return enemies.list.map((e) => ({ x: e.x, y: e.y, r: e.radius, kind: e.kind })); },
  get bullets() { return bullets.list.length; },
  get firing() { return input.firing; },
  get powerups() { return stars.powerups.map((p) => ({ x: p.x, y: p.y, kind: p.kind })); },
};

showHud(hud, false);
showScreen(hud, 'start');
showStartTop(hud, topScores);
requestAnimationFrame(frame);
