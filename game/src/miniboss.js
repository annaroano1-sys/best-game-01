// The RAIDER mini-boss: a fast gunship that guards levels 3, 6, 9 and 12.
// It strafes across the upper screen, fires aimed bolts at the ship, and
// takes a dozen hits to destroy. Beating it pays a bonus and drops two
// power-ups. Its health shows as pips above the hull.

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

/**
 * Move the raider and decide when it fires. Returns 'shoot' when a bolt
 * should be fired at the ship — the game loop turns that into the bolt.
 */
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

/** A bullet hit the raider. Returns true when that hit destroyed it. */
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
  // Hull: a swept dart with swept wings.
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
  // Eye.
  ctx.shadowBlur = 12;
  ctx.fillStyle = flash ? '#ffffff' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, -6, 6 + Math.sin(now / 160) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Health pips.
  ctx.shadowBlur = 0;
  for (let i = 0; i < m.maxHp; i++) {
    ctx.fillStyle = i < m.hp ? '#ff9f43' : 'rgba(255, 159, 67, 0.25)';
    ctx.fillRect(-m.maxHp * 4 + i * 8, -m.radius - 14, 6, 4);
  }
  ctx.restore();
}
