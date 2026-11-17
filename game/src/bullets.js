// STARFALL — the ship shots: fast glowing energy bolts with a comet tail.
// A bright white-hot core inside a coloured plasma sheath, drawn along the
// bolt's flight line so spread shots fan out like a modern shmup stream.
// Enemy fire is hot red/magenta by contrast, so the two never get mixed up.
import { BULLET, VIEW } from './config.js';
export function createBullets() {
  return { list: [] };
}
export function fireBullet(bullets, x, y, count = 1, damage = 1) {
  if (bullets.list.length + count > BULLET.maxOnScreen) return false;
  const spread = 0.16;
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spread;
    bullets.list.push({
      x, y: y - 28,
      vx: Math.sin(off) * BULLET.speed,
      vy: -Math.cos(off) * BULLET.speed,
      radius: BULLET.radius,
      damage,
      spent: false,
      hit: new Set(),
      phase: Math.random() * Math.PI * 2,
    });
  }
  return true;
}
export function updateBullets(bullets, dt, timeScale) {
  for (const b of bullets.list) {
    b.x += b.vx * dt * timeScale;
    b.y += b.vy * dt * timeScale;
    b.phase += dt * 22;
  }
  bullets.list = bullets.list.filter((b) => b.y > -40 && !b.spent);
}
export function drawBullets(ctx, bullets, color = '#7ef0ff', now = 0) {
  for (const b of bullets.list) {
    // Unit vector along the flight line; the bolt stretches behind its head.
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const ux = b.vx / speed;
    const uy = b.vy / speed;
    const len = 30;
    const tailX = b.x - ux * len;
    const tailY = b.y - uy * len;
    const pulse = 0.85 + Math.sin(b.phase + now / 90) * 0.15;
    ctx.save();
    ctx.lineCap = 'round';
    // Fading plasma tail.
    const tailGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
    tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    tailGrad.addColorStop(0.55, color);
    tailGrad.addColorStop(1, '#ffffff');
    // Outer glow sheath.
    ctx.shadowColor = color;
    ctx.shadowBlur = 16 * pulse;
    ctx.strokeStyle = tailGrad;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 7 * pulse;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // Mid plasma body.
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 4 * pulse;
    ctx.beginPath();
    ctx.moveTo(tailX + ux * 6, tailY + uy * 6);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // White-hot core, hottest at the head.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * pulse;
    ctx.beginPath();
    ctx.moveTo(tailX + ux * 12, tailY + uy * 12);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // Bright head spark.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
