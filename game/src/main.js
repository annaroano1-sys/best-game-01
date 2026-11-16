// STARFALL — the game loop: states (start, playing, paused, over),
// spawning, collisions, combo scoring, levels, and the render order.
// Everything else is a module this file wires together.

import { GAME, LEVELS, POWERUP, SHIP, STAR, VIEW } from './config.js';
import { createInput } from './input.js';
import { createShip, updateShip, drawShip, isInvulnerable } from './ship.js';
import { createAsteroidField, updateAsteroids, drawAsteroids } from './asteroids.js';
import { createStarField, updateStars, drawStars } from './stars.js';
import { createBackdrop, drawBackdrop, createParticles, burst, updateParticles, drawParticles } from './particles.js';
import { createHud, showHud, showScreen, updateHud, showToast, showGameOver } from './hud.js';
import { ensureAudio, playCollect, playHit, playPowerup, playLevelUp, playGameOver, playClick } from './audio.js';

const BEST_KEY = 'starfall-best-score';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const hud = createHud();

const backdrop = createBackdrop();
const particles = createParticles();

let state = 'start'; // 'start' | 'playing' | 'paused' | 'over'
let ship = createShip();
let asteroids = createAsteroidField();
let stars = createStarField();
let run = freshRun();
let best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
let slowmoUntil = 0;
let lastTime = performance.now();

function freshRun() {
  return {
    score: 0,
    lives: GAME.startLives,
    level: 1,
    combo: 0,
    maxCombo: 0,
    starsCollected: 0,
    starsThisLevel: 0,
    lastCollectAt: 0,
    shield: false,
  };
}

function startRun() {
  ensureAudio();
  ship = createShip();
  asteroids = createAsteroidField();
  stars = createStarField();
  run = freshRun();
  slowmoUntil = 0;
  state = 'playing';
  input.clearOneShots();
  showHud(hud, true);
  showScreen(hud, null);
  updateHud(hud, run);
}

function endRun() {
  state = 'over';
  playGameOver();
  const isNewBest = run.score > best;
  if (isNewBest) {
    best = run.score;
    localStorage.setItem(BEST_KEY, String(best));
  }
  showHud(hud, false);
  showGameOver(hud, run, best, isNewBest);
  showScreen(hud, 'over');
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  showScreen(hud, 'pause');
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  showScreen(hud, null);
  input.clearOneShots();
  lastTime = performance.now();
}

function levelUp() {
  run.level = Math.min(run.level + 1, LEVELS.maxLevel);
  run.starsThisLevel = 0;
  playLevelUp();
  showToast(hud, `LEVEL ${run.level}!`);
  burst(particles, ship.x, ship.y - 20, '#ffd166', 40, 420);
}

function collectStar(star, now) {
  const chained = now - run.lastCollectAt <= STAR.comboWindowMs;
  run.combo = chained ? run.combo + 1 : 1;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  run.lastCollectAt = now;
  const gained = STAR.value * run.combo;
  run.score += gained;
  run.starsCollected += 1;
  run.starsThisLevel += 1;
  playCollect(run.combo);
  burst(particles, star.x, star.y, '#ffd166', 14, 200);
  if (run.starsThisLevel >= LEVELS.starsPerLevel) levelUp();
}

function collectPowerup(powerup, now) {
  playPowerup();
  const color = powerup.kind === 'shield' ? '#7ef0c1' : powerup.kind === 'slowmo' ? '#c77dff' : '#ff5d8f';
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
  }
}

function hitAsteroid(asteroid, now) {
  if (isInvulnerable(ship, now)) return;
  burst(particles, ship.x, ship.y, '#ff5d8f', 34, 420);
  burst(particles, asteroid.x, asteroid.y, '#8d99ae', 20, 300);
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

function circleHits(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

function update(dt, now) {
  const timeScale = now < slowmoUntil ? POWERUP.slowmoFactor : 1;
  updateShip(ship, input, dt, now);
  updateAsteroids(asteroids, run.level, dt, timeScale);
  updateStars(stars, run.level, dt, timeScale);
  updateParticles(particles, dt);

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
  for (const asteroid of [...asteroids.list]) {
    if (circleHits(ship, asteroid)) {
      asteroids.list = asteroids.list.filter((a) => a !== asteroid);
      hitAsteroid(asteroid, now);
      if (state !== 'playing') return;
    }
  }
  updateHud(hud, run);
}

function render(dt, now) {
  drawBackdrop(ctx, backdrop, dt, now);
  drawStars(ctx, stars, now);
  drawAsteroids(ctx, asteroids);
  if (state !== 'over') drawShip(ctx, ship, now);
  drawParticles(ctx, particles);
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (input.consumePause()) {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
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
  get ship() { return { x: ship.x, y: ship.y }; },
  get stars() { return stars.stars.map((s) => ({ x: s.x, y: s.y })); },
  get asteroids() { return asteroids.list.map((a) => ({ x: a.x, y: a.y, r: a.radius })); },
  get powerups() { return stars.powerups.map((p) => ({ x: p.x, y: p.y, kind: p.kind })); },
};

showHud(hud, false);
showScreen(hud, 'start');
requestAnimationFrame(frame);
