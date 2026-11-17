// STARFALL — the player ship: a modern space fighter, drawn in canvas.
// A sleek swept-wing interceptor with twin engine flames, a glass canopy
// and panel detailing. Each skin gives it a different wing planform and
// trim, so the hangar choices read as different airframes, not repaints.
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
    ghostUntil: 0,
    trail: [],
    skin: skinById(skinId),
  };
}
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
// Wing planforms, one per skin. Each entry describes the swept main wing
// as seen from above: root chord, tip chord and how far the tip sits back.
// The numbers are half-span offsets from the fuselage centreline.
const WINGS = {
  // Azure Dart — narrow swept wings, classic interceptor.
  dart: { span: 26, tipBack: 16, rootFront: -4, rootBack: 14, tipChord: 4, fork: 0 },
  // Crimson Falcon — broad wings with a forked tip.
  falcon: { span: 30, tipBack: 18, rootFront: -6, rootBack: 16, tipChord: 5, fork: 4 },
  // Golden Comet — one big delta wing, leading edge straight from the nose.
  delta: { span: 29, tipBack: 20, rootFront: -16, rootBack: 18, tipChord: 3, fork: 0 },
  // Void Wraith — slim crescent-swept wings, tips raked far back.
  wraith: { span: 27, tipBack: 22, rootFront: -2, rootBack: 12, tipChord: 3, fork: 0 },
  // Solar Phoenix — wide wings with a notched trailing edge.
  phoenix: { span: 31, tipBack: 17, rootFront: -5, rootBack: 17, tipChord: 6, fork: 3 },
  // Nebula Ghost — long thin elegant wings, almost a glider.
  ghost: { span: 32, tipBack: 14, rootFront: -3, rootBack: 12, tipChord: 3, fork: 0 },
};
function wingPath(ctx, ship, side, w) {
  // One main wing, drawn in ship-centred absolute space (the caller rotates
  // about the ship, so all points are ship.x / ship.y offsets, as in the
  // rest of this file — never bare local coordinates).
  const s = side; // +1 right, -1 left
  const x = ship.x;
  const y = ship.y;
  ctx.beginPath();
  ctx.moveTo(x + s * 5, y + w.rootFront);
  ctx.lineTo(x + s * w.span, y + w.tipBack - w.tipChord);
  if (w.fork > 0) {
    ctx.lineTo(x + s * (w.span - w.fork), y + w.tipBack - 1);
    ctx.lineTo(x + s * w.span, y + w.tipBack + 2);
  }
  ctx.lineTo(x + s * (w.span - 3), y + w.tipBack + 2);
  ctx.lineTo(x + s * 7, y + w.rootBack);
  ctx.closePath();
}
function drawEngineFlame(ctx, x, y, len, color, now, seed) {
  // A flickering teardrop of plasma: bright core inside a coloured glow.
  const flick = 0.82 + Math.sin(now / 34 + seed * 2.1) * 0.12 + Math.sin(now / 17 + seed) * 0.06;
  const l = len * flick;
  const grad = ctx.createLinearGradient(x, y, x, y + l);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(255, 90, 40, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - 4.5, y);
  ctx.quadraticCurveTo(x - 5.5, y + l * 0.55, x, y + l);
  ctx.quadraticCurveTo(x + 5.5, y + l * 0.55, x + 4.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x - 2, y);
  ctx.quadraticCurveTo(x - 2.5, y + l * 0.4, x, y + l * 0.62);
  ctx.quadraticCurveTo(x + 2.5, y + l * 0.4, x + 2, y);
  ctx.closePath();
  ctx.fill();
}
export function isInvulnerable(ship, now) {
  return now < ship.invulnerableUntil;
}
export function drawShip(ctx, ship, now) {
  const blink = isInvulnerable(ship, now) && Math.floor(now / 90) % 2 === 0;
  const ghost = now < ship.ghostUntil;
  const skin = ship.skin;
  const wing = WINGS[skin.wing] ?? WINGS.dart;
  const speed = Math.hypot(ship.vx, ship.vy) / SHIP.maxSpeed;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  else if (ghost) ctx.globalAlpha = 0.55;
  // Twin engine trails: fading plasma puffs behind each nozzle.
  for (let i = 0; i < ship.trail.length; i++) {
    const p = ship.trail[i];
    const t = i / ship.trail.length;
    const flicker = 0.8 + Math.sin(now / 40 + i * 1.7) * 0.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(p.x + side * 6, p.y + 24, (2 + t * 5) * flicker, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${skin.flame[0]}, ${skin.flame[1]}, ${skin.flame[2]}, ${t * 0.45})`;
      ctx.fill();
    }
  }
  const bank = Math.max(-0.35, Math.min(0.35, ship.vx / 1600));
  ctx.translate(ship.x, ship.y);
  ctx.rotate(bank);
  ctx.translate(-ship.x, -ship.y);
  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = 22;
  // Main wings, one gradient each so the light falls across the airframe.
  for (const side of [-1, 1]) {
    const wg = ctx.createLinearGradient(ship.x, ship.y - 6, ship.x + side * wing.span, ship.y + wing.tipBack);
    wg.addColorStop(0, skin.hull[1]);
    wg.addColorStop(1, skin.hull[2]);
    ctx.fillStyle = wg;
    wingPath(ctx, ship, side, wing);
    ctx.fill();
    // Bright leading-edge trim so the wing reads against dark space.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = skin.hull[0];
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ship.x + side * 5, ship.y + wing.rootFront);
    ctx.lineTo(ship.x + side * wing.span, ship.y + wing.tipBack - wing.tipChord);
    ctx.stroke();
    ctx.shadowBlur = 22;
  }
  // Twin tail fins, raked outwards.
  for (const side of [-1, 1]) {
    const tg = ctx.createLinearGradient(ship.x, ship.y + 6, ship.x + side * 13, ship.y + 18);
    tg.addColorStop(0, skin.hull[1]);
    tg.addColorStop(1, skin.hull[2]);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(ship.x + side * 4, ship.y + 8);
    ctx.lineTo(ship.x + side * 13, ship.y + 2);
    ctx.lineTo(ship.x + side * 11, ship.y + 16);
    ctx.lineTo(ship.x + side * 5, ship.y + 18);
    ctx.closePath();
    ctx.fill();
  }
  // Fuselage: a long sleek dart with a pinched waist and a notched tail.
  const grad = ctx.createLinearGradient(ship.x, ship.y - 30, ship.x, ship.y + 22);
  grad.addColorStop(0, skin.hull[0]);
  grad.addColorStop(0.45, skin.hull[1]);
  grad.addColorStop(1, skin.hull[2]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - 30);
  ctx.quadraticCurveTo(ship.x + 6, ship.y - 16, ship.x + 7, ship.y - 2);
  ctx.lineTo(ship.x + 6, ship.y + 14);
  ctx.lineTo(ship.x + 3, ship.y + 20);
  ctx.lineTo(ship.x, ship.y + 16);
  ctx.lineTo(ship.x - 3, ship.y + 20);
  ctx.lineTo(ship.x - 6, ship.y + 14);
  ctx.lineTo(ship.x - 7, ship.y - 2);
  ctx.quadraticCurveTo(ship.x - 6, ship.y - 16, ship.x, ship.y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // Metallic spine highlight down the nose.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - 28);
  ctx.lineTo(ship.x, ship.y - 4);
  ctx.stroke();
  // Panel lines: a ring around the fuselage and two wing-root seams.
  ctx.strokeStyle = skin.trim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ship.x - 6.5, ship.y + 2);
  ctx.lineTo(ship.x + 6.5, ship.y + 2);
  ctx.moveTo(ship.x - 6, ship.y + 10);
  ctx.lineTo(ship.x + 6, ship.y + 10);
  ctx.stroke();
  // Glass canopy: a teardrop of sky with a white glint.
  const cg = ctx.createLinearGradient(ship.x, ship.y - 16, ship.x, ship.y + 2);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(0.4, skin.canopy);
  cg.addColorStop(1, skin.hull[1]);
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - 17);
  ctx.quadraticCurveTo(ship.x + 4.5, ship.y - 10, ship.x + 3.5, ship.y - 1);
  ctx.quadraticCurveTo(ship.x, ship.y + 3, ship.x - 3.5, ship.y - 1);
  ctx.quadraticCurveTo(ship.x - 4.5, ship.y - 10, ship.x, ship.y - 17);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ship.x - 1.5, ship.y - 13);
  ctx.lineTo(ship.x + 1, ship.y - 7);
  ctx.stroke();
  // Twin engine nozzles with live flames that stretch as you fly faster.
  for (const side of [-1, 1]) {
    const nx = ship.x + side * 5;
    const ny = ship.y + 18;
    ctx.fillStyle = '#1a1a26';
    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.hull[0];
    ctx.lineWidth = 1.4;
    ctx.stroke();
    drawEngineFlame(ctx, nx, ny + 2, 12 + speed * 16, `rgb(${skin.flame[0]}, ${skin.flame[1]}, ${skin.flame[2]})`, now, side);
  }
  // Wingtip lights: red port, green starboard, blinking in turn.
  const blinkOn = Math.floor(now / 420) % 2 === 0;
  ctx.shadowBlur = 8;
  ctx.fillStyle = blinkOn ? '#ff4d4d' : 'rgba(255, 77, 77, 0.25)';
  ctx.shadowColor = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(ship.x - wing.span, ship.y + wing.tipBack - 1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = !blinkOn ? '#4dff88' : 'rgba(77, 255, 136, 0.25)';
  ctx.shadowColor = '#4dff88';
  ctx.beginPath();
  ctx.arc(ship.x + wing.span, ship.y + wing.tipBack - 1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (ship.shield) {
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, SHIP.radius + 10 + Math.sin(now / 160) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(126, 240, 193, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#7ef0c1';
    ctx.shadowBlur = 16;
    ctx.stroke();
  }
  if (ghost) {
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, SHIP.radius + 12 + Math.sin(now / 120) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(179, 136, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#b388ff';
    ctx.shadowBlur = 20;
    ctx.stroke();
  }
  ctx.restore();
}
