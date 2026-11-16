// The boss: a mothership that guards every fifth level. It drifts side to
// side across the top of the screen, drops drones and rocks on a timer,
// and takes many hits to destroy. Beating it pays a big bonus and drops a
// power-up. Its health bar lives in the HUD.

import { BOSS, VIEW } from './config.js';
import { rand } from './random.js';

export function createBoss(bossNumber) {
  return {
    x: VIEW.width / 2,
    y: BOSS.y,
    vx: BOSS.driftSpeed,
    radius: BOSS.radius,
    hp: BOSS.hp + (bossNumber - 1) * BOSS.hpGrowth,
    maxHp: BOSS.hp + (bossNumber - 1) * BOSS.hpGrowth,
    number: bossNumber,
    spawnTimer: 1200,
    phase: 0,
    dead: false,
    flashUntil: 0,
  };
}

/**
 * Move the boss and decide what it drops. Returns 'drone' | 'rock' | null
 * when its spawn timer fires — the game loop turns that into the spawn.
 */
export function updateBoss(boss, dt, timeScale, now) {
  boss.phase += dt;
  boss.x += boss.vx * dt * timeScale;
  if (boss.x < boss.radius + 30) { boss.x = boss.radius + 30; boss.vx = Math.abs(boss.vx); }
  if (boss.x > VIEW.width - boss.radius - 30) { boss.x = VIEW.width - boss.radius - 30; boss.vx = -Math.abs(boss.vx); }
  boss.y = BOSS.y + Math.sin(boss.phase * 0.9) * 26;
  boss.spawnTimer -= dt * 1000 * timeScale;
  if (boss.spawnTimer <= 0) {
    boss.spawnTimer = BOSS.spawnIntervalMs * rand(0.85, 1.2);
    return Math.random() < 0.55 ? 'drone' : 'rock';
  }
  return null;
}

/** A bullet hit the boss. Returns true when that hit destroyed it. */
export function hitBoss(boss, now) {
  boss.hp -= 1;
  boss.flashUntil = now + 90;
  if (boss.hp <= 0) {
    boss.dead = true;
    return true;
  }
  return false;
}

export function drawBoss(ctx, boss, now) {
  const flash = now < boss.flashUntil;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.shadowColor = '#ff5d8f';
  ctx.shadowBlur = 30;
  // Hull: a wide neon saucer with a glowing core.
  const grad = ctx.createLinearGradient(0, -30, 0, 30);
  grad.addColorStop(0, flash ? '#ffffff' : '#ff8fb0');
  grad.addColorStop(0.5, flash ? '#ffd166' : '#c2255c');
  grad.addColorStop(1, '#5c1030');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-boss.radius, 0);
  ctx.quadraticCurveTo(0, -boss.radius * 0.85, boss.radius, 0);
  ctx.quadraticCurveTo(0, boss.radius * 0.55, -boss.radius, 0);
  ctx.closePath();
  ctx.fill();
  // Dome.
  ctx.shadowBlur = 18;
  ctx.fillStyle = flash ? '#ffffff' : '#7ef0ff';
  ctx.beginPath();
  ctx.arc(0, -14, 22 + Math.sin(now / 200) * 2, 0, Math.PI * 2);
  ctx.fill();
  // Lights along the rim.
  ctx.shadowBlur = 10;
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#39ffb0';
    ctx.beginPath();
    ctx.arc(i * 30, 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
