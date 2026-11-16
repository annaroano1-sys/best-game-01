// Enemy bullets: the red bolts gunners and raiders fire at the ship.
// They fly straight at the position the ship was in when they were fired,
// glow hot, and die off the bottom of the screen.

import { EBULLET, VIEW } from './config.js';

export function createEBullets() {
  return { list: [] };
}

/** Fire one bolt from (x, y) toward (tx, ty). */
export function fireEBullet(field, x, y, tx, ty) {
  if (field.list.length >= EBULLET.maxOnScreen) return false;
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.hypot(dx, dy) || 1;
  field.list.push({
    x, y,
    vx: (dx / dist) * EBULLET.speed,
    vy: (dy / dist) * EBULLET.speed,
    radius: EBULLET.radius,
    phase: 0,
    spent: false,
  });
  return true;
}

export function updateEBullets(field, dt, timeScale) {
  for (const b of field.list) {
    b.x += b.vx * dt * timeScale;
    b.y += b.vy * dt * timeScale;
    b.phase += dt * 6;
  }
  field.list = field.list.filter((b) => !b.spent && b.y < VIEW.height + 20 && b.y > -30 && b.x > -30 && b.x < VIEW.width + 30);
}

export function drawEBullets(ctx, field) {
  for (const b of field.list) {
    const pulse = 0.8 + Math.sin(b.phase) * 0.2;
    ctx.save();
    ctx.shadowColor = '#ff5d5d';
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = '#ff5d5d';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
