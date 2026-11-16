// The player's ship: a small neon dart with a flame trail, a shield ring
// while protected, and a blink while invulnerable after a hit. The hull,
// glow, flame and bullet colours follow the selected skin, and the hull
// banks into turns.

import { SHIP, VIEW } from './config.js';
import { clamp } from './random.js';
import { skinById } from './skins.js';

export function createShip(skinId = 'azure') {
  return {
    x: VIEW.width / 2,
    y: VIEW.height - 140,
    vx: 0,
    vy: 0,
    radius: SHIP.radius,
    shield: false,
    shieldHits: 0,
    invulnerableUntil: 0,
    trail: [], // recent positions, for the flame trail
    skin: skinById(skinId),
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
  const skin = ship.skin;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;

  // Flame trail: flickering exhaust behind the hull, in the skin's colour.
  for (let i = 0; i < ship.trail.length; i++) {
    const p = ship.trail[i];
    const t = i / ship.trail.length;
    const flicker = 0.8 + Math.sin(now / 40 + i * 1.7) * 0.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y + 26, (3 + t * 7) * flicker, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${skin.flame[0]}, ${skin.flame[1]}, ${skin.flame[2]}, ${t * 0.5})`;
    ctx.fill();
  }

  // The hull banks into turns: lean with the horizontal velocity.
  const bank = Math.max(-0.35, Math.min(0.35, ship.vx / 1600));
  ctx.translate(ship.x, ship.y);
  ctx.rotate(bank);
  ctx.translate(-ship.x, -ship.y);

  // Hull, in the skin's gradient.
  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = 22;
  const grad = ctx.createLinearGradient(ship.x, ship.y - 26, ship.x, ship.y + 22);
  grad.addColorStop(0, skin.hull[0]);
  grad.addColorStop(0.5, skin.hull[1]);
  grad.addColorStop(1, skin.hull[2]);
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
