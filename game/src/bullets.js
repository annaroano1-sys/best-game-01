// Bullets: the ship's shots. One pool, fired straight up while the fire
// button is held, each bolt a glowing streak that dies at the top of the
// screen (or the moment it hits something). Spread upgrades fire extra
// bolts at an angle; heavy rounds hit harder.

import { BULLET, VIEW } from './config.js';

export function createBullets() {
  return { list: [] };
}

/** Fire a volley: `count` bolts fanned out, each carrying `damage`. */
export function fireBullet(bullets, x, y, count = 1, damage = 1) {
  if (bullets.list.length + count > BULLET.maxOnScreen) return false;
  const spread = 0.16; // radians between neighbouring bolts
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spread;
    bullets.list.push({
      x, y: y - 24,
      vx: Math.sin(off) * BULLET.speed,
      vy: -Math.cos(off) * BULLET.speed,
      radius: BULLET.radius,
      damage,
      spent: false,
    });
  }
  return true;
}

export function updateBullets(bullets, dt, timeScale) {
  for (const b of bullets.list) {
    b.x += b.vx * dt * timeScale;
    b.y += b.vy * dt * timeScale;
  }
  bullets.list = bullets.list.filter((b) => b.y > -20 && !b.spent);
}

export function drawBullets(ctx, bullets, color = '#7ef0ff') {
  for (const b of bullets.list) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    const grad = ctx.createLinearGradient(b.x, b.y - 16, b.x, b.y + 8);
    grad.addColorStop(0, 'rgba(126, 240, 255, 0)');
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, '#ffffff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 16);
    ctx.lineTo(b.x, b.y + 8);
    ctx.stroke();
    ctx.restore();
  }
}
