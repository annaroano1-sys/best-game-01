// Bullets: the ship's shots. One pool, fired straight up while the fire
// button is held, each bolt a glowing streak that dies at the top of the
// screen (or the moment it hits something).

import { BULLET, VIEW } from './config.js';

export function createBullets() {
  return { list: [] };
}

export function fireBullet(bullets, x, y) {
  if (bullets.list.length >= BULLET.maxOnScreen) return false;
  bullets.list.push({ x, y: y - 24, vx: 0, vy: -BULLET.speed, radius: BULLET.radius, spent: false });
  return true;
}

export function updateBullets(bullets, dt, timeScale) {
  for (const b of bullets.list) {
    b.x += b.vx * dt * timeScale;
    b.y += b.vy * dt * timeScale;
  }
  bullets.list = bullets.list.filter((b) => b.y > -20 && !b.spent);
}

export function drawBullets(ctx, bullets) {
  for (const b of bullets.list) {
    ctx.save();
    ctx.shadowColor = '#7ef0ff';
    ctx.shadowBlur = 14;
    const grad = ctx.createLinearGradient(b.x, b.y - 16, b.x, b.y + 8);
    grad.addColorStop(0, 'rgba(126, 240, 255, 0)');
    grad.addColorStop(0.6, '#7ef0ff');
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
