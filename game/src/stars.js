// Stars and power-ups: golden stars rain down to be collected (each one
// feeds the combo chain), and glowing orbs grant a shield or slow motion.

import { STAR, POWERUP, VIEW } from './config.js';
import { rand, pick } from './random.js';

export function createStarField() {
  return { stars: [], powerups: [], spawnTimer: 0, powerupTimer: POWERUP.spawnEverySec };
}

function makeStar(level) {
  const speed = Math.min(STAR.baseSpeed + (level - 1) * STAR.speedGrowth, STAR.maxSpeed);
  return {
    x: rand(STAR.radius + 6, VIEW.width - STAR.radius - 6),
    y: -STAR.radius - 8,
    vy: speed * rand(0.85, 1.2),
    vx: rand(-18, 18),
    radius: STAR.radius,
    phase: rand(0, Math.PI * 2),
    hue: pick(['#ffd166', '#ffe66d', '#ffb703']),
  };
}

function makePowerup() {
  const roll = Math.random();
  const kind = roll < 0.4 ? 'shield' : roll < 0.8 ? 'slowmo' : 'life';
  return {
    x: rand(60, VIEW.width - 60),
    y: -30,
    vy: POWERUP.fallSpeed,
    radius: POWERUP.radius,
    kind,
    phase: rand(0, Math.PI * 2),
  };
}

export function updateStars(field, level, dt, timeScale) {
  const rate = STAR.baseSpawnPerSec + (level - 1) * STAR.spawnGrowth;
  field.spawnTimer -= dt * timeScale;
  if (field.spawnTimer <= 0) {
    field.stars.push(makeStar(level));
    field.spawnTimer = 1 / rate;
  }
  field.powerupTimer -= dt * timeScale;
  if (field.powerupTimer <= 0) {
    field.powerups.push(makePowerup());
    field.powerupTimer = POWERUP.spawnEverySec * rand(0.8, 1.3);
  }
  for (const s of field.stars) {
    s.y += s.vy * dt * timeScale;
    s.x += s.vx * dt * timeScale;
    s.phase += dt * 4;
  }
  for (const p of field.powerups) {
    p.y += p.vy * dt * timeScale;
    p.phase += dt * 3;
  }
  field.stars = field.stars.filter((s) => s.y - s.radius < VIEW.height + 20);
  field.powerups = field.powerups.filter((p) => p.y - p.radius < VIEW.height + 20);
}

function drawStarShape(ctx, x, y, radius, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawStars(ctx, field, now) {
  for (const s of field.stars) {
    const pulse = 0.75 + Math.sin(s.phase) * 0.25;
    ctx.save();
    ctx.shadowColor = s.hue;
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = s.hue;
    drawStarShape(ctx, s.x, s.y, s.radius * pulse, Math.sin(s.phase * 0.5) * 0.4);
    ctx.restore();
  }
  for (const p of field.powerups) {
    const bob = Math.sin(p.phase) * 4;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.shadowBlur = 22;
    const label = p.kind === 'shield' ? 'S' : p.kind === 'slowmo' ? '◷' : '♥';
    const color = p.kind === 'shield' ? '#7ef0c1' : p.kind === 'slowmo' ? '#c77dff' : '#ff5d8f';
    const dark = p.kind === 'shield' ? '#06281d' : p.kind === 'slowmo' ? '#2a0a4a' : '#3d0a1e';
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}
