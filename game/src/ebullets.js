// STARFALL — enemy fire: hot plasma orbs and fast sniper darts.
// Orbs carry a wide red halo, a magenta shell and a white-amber heart, so
// they read instantly against the dark sky and never look like the ship's
// cyan bolts. Fast shots (snipers) are drawn as elongated darts along
// their flight line, with a short streak behind them.
import { EBULLET, VIEW } from './config.js';
export function createEBullets() {
  return { list: [] };
}
export function fireEBullet(field, x, y, tx, ty, speed = EBULLET.speed) {
  if (field.list.length >= EBULLET.maxOnScreen) return false;
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.hypot(dx, dy) || 1;
  const fast = speed > EBULLET.speed;
  field.list.push({
    x, y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    radius: fast ? 6 : EBULLET.radius,
    fast,
    phase: Math.random() * Math.PI * 2,
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
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const ux = b.vx / speed;
    const uy = b.vy / speed;
    ctx.save();
    if (b.fast) {
      // Sniper dart: a crimson-violet bolt with a white spine and a streak.
      const len = 26;
      const tailX = b.x - ux * len;
      const tailY = b.y - uy * len;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#e879ff';
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeStyle = 'rgba(232, 121, 255, 0.55)';
      ctx.lineWidth = 6 * pulse;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = '#ff5d8f';
      ctx.lineWidth = 3.2 * pulse;
      ctx.beginPath();
      ctx.moveTo(tailX + ux * 5, tailY + uy * 5);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tailX + ux * 10, tailY + uy * 10);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Plasma orb: halo, shell, hot heart, and a short motion streak.
      const streak = 14;
      const tailX = b.x - ux * streak;
      const tailY = b.y - uy * streak;
      ctx.strokeStyle = 'rgba(255, 93, 93, 0.5)';
      ctx.lineWidth = 4 * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      const halo = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.4);
      halo.addColorStop(0, 'rgba(255, 93, 93, 0.55)');
      halo.addColorStop(0.5, 'rgba(255, 60, 120, 0.22)');
      halo.addColorStop(1, 'rgba(255, 60, 120, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#ff5d5d';
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = '#ff3c78';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
