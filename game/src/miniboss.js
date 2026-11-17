// STARFALL — the raider gunship that guards every 3rd level.
import { MINIBOSS, VIEW } from './config.js';
import { rand } from './random.js';
export function createMiniboss(number) {
  const hp = MINIBOSS.hp + (number - 1) * MINIBOSS.hpGrowth;
  return {
    x: VIEW.width / 2,
    y: MINIBOSS.y,
    vx: MINIBOSS.strafeSpeed,
    radius: MINIBOSS.radius,
    hp,
    maxHp: hp,
    number,
    fireTimer: 1400,
    phase: 0,
    flashUntil: 0,
    dead: false,
  };
}
export function updateMiniboss(m, dt, timeScale, now) {
  m.phase += dt;
  m.x += m.vx * dt * timeScale;
  if (m.x < m.radius + 30) { m.x = m.radius + 30; m.vx = Math.abs(m.vx); }
  if (m.x > VIEW.width - m.radius - 30) { m.x = VIEW.width - m.radius - 30; m.vx = -Math.abs(m.vx); }
  m.y = MINIBOSS.y + Math.sin(m.phase * 1.4) * 18;
  m.fireTimer -= dt * 1000 * timeScale;
  if (m.fireTimer <= 0) {
    m.fireTimer = MINIBOSS.fireIntervalMs * rand(0.85, 1.2);
    return 'shoot';
  }
  return null;
}
export function hitMiniboss(m, now, damage = 1) {
  m.hp -= damage;
  m.flashUntil = now + 90;
  if (m.hp <= 0) {
    m.dead = true;
    return true;
  }
  return false;
}
export function drawMiniboss(ctx, m, now) {
  const flash = now < m.flashUntil;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.shadowColor = '#ff9f43';
  ctx.shadowBlur = 24;
  const grad = ctx.createLinearGradient(0, -20, 0, 24);
  grad.addColorStop(0, flash ? '#ffffff' : '#ffd166');
  grad.addColorStop(0.5, flash ? '#ffe66d' : '#ff9f43');
  grad.addColorStop(1, '#7a2d00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 24);
  ctx.lineTo(-m.radius, -8);
  ctx.lineTo(-m.radius * 0.45, -16);
  ctx.lineTo(0, -26);
  ctx.lineTo(m.radius * 0.45, -16);
  ctx.lineTo(m.radius, -8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 12;
  ctx.fillStyle = flash ? '#ffffff' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, -6, 6 + Math.sin(now / 160) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  for (let i = 0; i < m.maxHp; i++) {
    ctx.fillStyle = i < m.hp ? '#ff9f43' : 'rgba(255, 159, 67, 0.25)';
    ctx.fillRect(-m.maxHp * 4 + i * 8, -m.radius - 14, 6, 4);
  }
  ctx.restore();
}
