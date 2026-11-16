// The player's ship: a small neon dart with a flame trail, a shield ring
// while protected, and a blink while invulnerable after a hit.

import { SHIP, VIEW } from './config.js';
import { clamp } from './random.js';

export function createShip() {
  return {
    x: VIEW.width / 2,
    y: VIEW.height - 140,
    vx: 0,
    vy: 0,
    radius: SHIP.radius,
    shield: false,
    invulnerableUntil: 0,
    trail: [], // recent positions, for the flame trail
  };
}

/** Steer the ship from the held keys (and the mouse when it moved lately). */
export function updateShip(ship, input, dt, now) {
  let ax = 0;
  let ay = 0;
  if (input.held.has('left')) ax -= SHIP.accel;
  if (input.held.has('right')) ax += SHIP.accel;
  if (input.held.has('up')) ay -= SHIP.accel;
  if (input.held.has('down')) ay += SHIP.accel;

  if (ax === 0 && ay === 0 && input.mouse.active && input.mouse.x !== null) {
    const dx = input.mouse.x - ship.x;
    const dy = input.mouse.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      ax = (dx / dist) * SHIP.accel * 0.9;
      ay = (dy / dist) * SHIP.accel * 0.9;
    }
  }

  ship.vx += ax * dt;
  ship.vy += ay * dt;
  const drag = Math.exp(-SHIP.drag * dt);
  ship.vx *= drag;
  ship.vy *= drag;
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > SHIP.maxSpeed) {
    ship.vx = (ship.vx / speed) * SHIP.maxSpeed;
    ship.vy = (ship.vy / speed) * SHIP.maxSpeed;
  }
  ship.x = clamp(ship.x + ship.vx * dt, SHIP.radius, VIEW.width - SHIP.radius);
  ship.y = clamp(ship.y + ship.vy * dt, SHIP.radius, VIEW.height - SHIP.radius);

  ship.trail.push({ x: ship.x, y: ship.y });
  if (ship.trail.length > 14) ship.trail.shift();
}

export function isInvulnerable(ship, now) {
  return now < ship.invulnerableUntil;
}

/** Draw the ship: glow, hull, cockpit, flame, and the shield ring. */
export function drawShip(ctx, ship, now) {
  const blink = isInvulnerable(ship, now) && Math.floor(now / 90) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;

  // Flame trail.
  for (let i = 0; i < ship.trail.length; i++) {
    const p = ship.trail[i];
    const t = i / ship.trail.length;
    ctx.beginPath();
    ctx.arc(p.x, p.y + 26, 3 + t * 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${140 + Math.floor(t * 80)}, 60, ${t * 0.5})`;
    ctx.fill();
  }

  // Hull.
  ctx.shadowColor = '#39c6ff';
  ctx.shadowBlur = 22;
  const grad = ctx.createLinearGradient(ship.x, ship.y - 26, ship.x, ship.y + 22);
  grad.addColorStop(0, '#bfe9ff');
  grad.addColorStop(0.5, '#39c6ff');
  grad.addColorStop(1, '#1d6fd1');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - 26);
  ctx.lineTo(ship.x + 20, ship.y + 16);
  ctx.lineTo(ship.x + 8, ship.y + 10);
  ctx.lineTo(ship.x, ship.y + 20);
  ctx.lineTo(ship.x - 8, ship.y + 10);
  ctx.lineTo(ship.x - 20, ship.y + 16);
  ctx.closePath();
  ctx.fill();

  // Cockpit.
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y - 6, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe66d';
  ctx.fill();

  // Shield ring.
  if (ship.shield) {
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, SHIP.radius + 10 + Math.sin(now / 160) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(126, 240, 193, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#7ef0c1';
    ctx.shadowBlur = 16;
    ctx.stroke();
  }
  ctx.restore();
}
