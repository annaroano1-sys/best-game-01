// STARFALL — collectible stars, comets and power-ups.
import { STAR, POWERUP, VIEW } from './config.js';
import { rand, pick } from './random.js';
export function createStarField() {
  return { stars: [], powerups: [], spawnTimer: 0, powerupTimer: POWERUP.spawnEverySec };
}
function makeStar(level) {
  const speed = Math.min(STAR.baseSpeed + (level - 1) * STAR.speedGrowth, STAR.maxSpeed);
  const comet = Math.random() < STAR.cometChance;
  return {
    x: rand(STAR.radius + 6, VIEW.width - STAR.radius - 6),
    y: -STAR.radius - 8,
    vy: speed * rand(0.85, 1.2),
    vx: rand(-18, 18),
    radius: comet ? STAR.radius + 6 : STAR.radius,
    phase: rand(0, Math.PI * 2),
    hue: comet ? '#ff5d8f' : pick(['#ffd166', '#ffe66d', '#ffb703']),
    comet,
  };
}
function makePowerup(forceKind = null) {
  if (forceKind) return {
    x: rand(60, VIEW.width - 60),
    y: -30,
    vy: POWERUP.fallSpeed,
    radius: POWERUP.radius,
    kind: forceKind,
    phase: rand(0, Math.PI * 2),
  };
  const roll = Math.random();
  const kind = roll < 0.15 ? 'shield'
    : roll < 0.28 ? 'slowmo'
    : roll < 0.37 ? 'life'
    : roll < 0.50 ? 'magnet'
    : roll < 0.61 ? 'double'
    : roll < 0.70 ? 'spread'
    : roll < 0.78 ? 'bomb'
    : roll < 0.86 ? 'overdrive'
    : roll < 0.93 ? 'ghost'
    : 'pierce';
  return {
    x: rand(60, VIEW.width - 60),
    y: -30,
    vy: POWERUP.fallSpeed,
    radius: POWERUP.radius,
    kind,
    phase: rand(0, Math.PI * 2),
  };
}
export function dropSupply(field) {
  for (let i = 0; i < 3; i++) {
    const p = makePowerup();
    p.x = rand(200, VIEW.width - 200);
    p.y = -30 - i * 60;
    field.powerups.push(p);
  }
}
export function dropPowerup(field, x, y, kind = null) {
  const p = makePowerup();
  if (kind) p.kind = kind;
  p.x = Math.max(40, Math.min(VIEW.width - 40, x));
  p.y = Math.max(20, y);
  field.powerups.push(p);
  return p;
}
export function updateStars(field, level, dt, timeScale, starMult = 1) {
  const rate = (STAR.baseSpawnPerSec + (level - 1) * STAR.spawnGrowth) * starMult;
  field.spawnTimer -= dt * timeScale;
  if (field.spawnTimer <= 0) {
    field.stars.push(makeStar(level));
    field.spawnTimer = 1 / rate;
  }
  field.powerupTimer -= dt * timeScale;
  if (field.powerupTimer <= 0) {
    field.powerups.push(makePowerup(field.forcePowerup ?? null));
    field.forcePowerup = null;
    field.powerupTimer = POWERUP.spawnEverySec * rand(0.8, 1.3);
  }
  for (const s of field.stars) {
    s.y += s.vy * dt * timeScale;
    s.x += s.vx * dt * timeScale;
    s.phase += dt * 4;
  }
  for (const p of field.powerups) {
    p.y += p.vy * dt * timeScale;
    p.phase += dt * 3;
  }
  field.stars = field.stars.filter((s) => s.y - s.radius < VIEW.height + 20);
  field.powerups = field.powerups.filter((p) => p.y - p.radius < VIEW.height + 20);
}
function drawStarShape(ctx, x, y, radius, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
export function drawStars(ctx, field, now) {
  for (const s of field.stars) {
    const pulse = 0.75 + Math.sin(s.phase) * 0.25;
    ctx.save();
    ctx.shadowColor = s.hue;
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = s.hue;
    drawStarShape(ctx, s.x, s.y, s.radius * pulse, Math.sin(s.phase * 0.5) * 0.4);
    ctx.restore();
  }
  for (const p of field.powerups) {
    const bob = Math.sin(p.phase) * 4;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.shadowBlur = 22;
    const style = {
      shield: { label: 'S', color: '#7ef0c1', dark: '#06281d' },
      slowmo: { label: '◷', color: '#c77dff', dark: '#2a0a4a' },
      life: { label: '♥', color: '#ff5d5f', dark: '#3d0a1e' },
      magnet: { label: 'M', color: '#ffb703', dark: '#3d2a00' },
      double: { label: '×2', color: '#39c6ff', dark: '#06283d' },
      spread: { label: '⁂', color: '#ff9f43', dark: '#3d1a00' },
      bomb: { label: '✹', color: '#ff5d5d', dark: '#3d0a0a' },
      overdrive: { label: 'R', color: '#ff2e88', dark: '#3d0a24' },
      ghost: { label: 'G', color: '#b388ff', dark: '#241040' },
      pierce: { label: '⇶', color: '#9bf00b', dark: '#1a2e00' },
    }[p.kind];
    ctx.shadowColor = style.color;
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = style.dark;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(style.label, 0, 1);
    ctx.restore();
  }
}
