// STARFALL — one guardian per sector: Mothership, Ember Hive, Void Wraith.
import { BOSS, BOSS_STYLES, VIEW } from './config.js';
import { rand } from './random.js';
export function createBoss(bossNumber, sector = 0) {
  const style = BOSS_STYLES[Math.max(0, Math.min(BOSS_STYLES.length - 1, sector))];
  return {
    x: VIEW.width / 2,
    y: BOSS.y,
    vx: style.driftSpeed,
    radius: BOSS.radius,
    hp: BOSS.hp + (bossNumber - 1) * BOSS.hpGrowth,
    maxHp: BOSS.hp + (bossNumber - 1) * BOSS.hpGrowth,
    number: bossNumber,
    sector,
    style,
    name: style.name,
    score: style.score,
    spawnTimer: 1200,
    fireTimer: style.fireIntervalMs > 0 ? style.fireIntervalMs * 0.8 : 0,
    teleportTimer: style.teleportMs > 0 ? style.teleportMs : 0,
    phase: 0,
    dead: false,
    flashUntil: 0,
    visible: true,
    tint: style.tint,
  };
}
export function updateBoss(boss, dt, timeScale, now) {
  const events = [];
  boss.phase += dt;
  boss.x += boss.vx * dt * timeScale;
  if (boss.x < boss.radius + 30) { boss.x = boss.radius + 30; boss.vx = Math.abs(boss.vx); }
  if (boss.x > VIEW.width - boss.radius - 30) { boss.x = VIEW.width - boss.radius - 30; boss.vx = -Math.abs(boss.vx); }
  boss.y = BOSS.y + Math.sin(boss.phase * 0.9) * 26;
  if (boss.style.spawnIntervalMs > 0) {
    boss.spawnTimer -= dt * 1000 * timeScale;
    if (boss.spawnTimer <= 0) {
      boss.spawnTimer = boss.style.spawnIntervalMs * rand(0.85, 1.2);
      if (boss.style.pattern === 'spread') events.push(Math.random() < 0.5 ? 'rock' : 'drone');
      else events.push(Math.random() < 0.55 ? 'drone' : 'rock');
    }
  }
  if (boss.style.fireIntervalMs > 0) {
    boss.fireTimer -= dt * 1000 * timeScale;
    if (boss.fireTimer <= 0) {
      boss.fireTimer = boss.style.fireIntervalMs * rand(0.85, 1.15);
      events.push(boss.style.pattern === 'spread' ? 'spread' : 'burst');
    }
  }
  if (boss.style.teleportMs > 0) {
    boss.teleportTimer -= dt * 1000 * timeScale;
    if (boss.teleportTimer <= 0) {
      boss.teleportTimer = boss.style.teleportMs * rand(0.85, 1.2);
      events.push('teleport');
    }
  }
  return events;
}
export function hitBoss(boss, now, damage = 1) {
  boss.hp -= damage;
  boss.flashUntil = now + 90;
  if (boss.hp <= 0) {
    boss.dead = true;
    return true;
  }
  return false;
}
function drawSaucer(ctx, boss, now, flash) {
  const grad = ctx.createLinearGradient(0, -30, 0, 30);
  grad.addColorStop(0, flash ? '#ffffff' : '#ff8fb0');
  grad.addColorStop(0.5, flash ? '#ffd166' : boss.tint);
  grad.addColorStop(1, '#5c1030');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-boss.radius, 0);
  ctx.quadraticCurveTo(0, -boss.radius * 0.85, boss.radius, 0);
  ctx.quadraticCurveTo(0, boss.radius * 0.55, -boss.radius, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 18;
  ctx.fillStyle = flash ? '#ffffff' : '#7ef0ff';
  ctx.beginPath();
  ctx.arc(0, -14, 22 + Math.sin(now / 200) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 10;
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffd166' : boss.tint;
    ctx.beginPath();
    ctx.arc(i * 30, 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawHex(ctx, boss, now, flash) {
  ctx.rotate(Math.sin(now / 900) * 0.04);
  for (let ring = 0; ring < 2; ring++) {
    const r = boss.radius * (ring === 0 ? 1 : 0.62);
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, flash ? '#ffffff' : ring === 0 ? '#ffb703' : '#ff7847');
    grad.addColorStop(1, ring === 0 ? '#7a2d00' : '#4a1400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  const charging = boss.fireTimer < 500;
  const coreR = 20 + Math.sin(now / 180) * 3 + (charging ? 6 + Math.sin(now / 60) * 3 : 0);
  ctx.shadowBlur = 26;
  ctx.fillStyle = flash ? '#ffffff' : charging ? '#ffffff' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(10, coreR), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 0, coreR * 0.45, 0, Math.PI * 2);
  ctx.fill();
}
function drawCrescent(ctx, boss, now, flash) {
  const blinkSoon = boss.teleportTimer < 800;
  const pulse = 1 + Math.sin(now / (blinkSoon ? 70 : 220)) * 0.08;
  ctx.scale(pulse, pulse);
  const grad = ctx.createLinearGradient(0, -34, 0, 34);
  grad.addColorStop(0, flash ? '#ffffff' : '#a7ffe0');
  grad.addColorStop(0.5, flash ? '#d8fff4' : boss.tint);
  grad.addColorStop(1, '#062e22');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-boss.radius, -6);
  ctx.quadraticCurveTo(0, -boss.radius * 0.9, boss.radius, -6);
  ctx.quadraticCurveTo(boss.radius * 0.5, boss.radius * 0.5, 0, boss.radius * 0.75);
  ctx.quadraticCurveTo(-boss.radius * 0.5, boss.radius * 0.5, -boss.radius, -6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 22;
  ctx.fillStyle = flash ? '#ffffff' : '#0a0a2e';
  ctx.beginPath();
  ctx.arc(0, -4, 16 + Math.sin(now / 240) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = boss.tint;
  ctx.beginPath();
  ctx.arc(0, -4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#d8fff4';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * boss.radius * 0.85, -4 + Math.sin(now / 300 + side) * 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
export function drawBoss(ctx, boss, now) {
  if (!boss.visible) return;
  const flash = now < boss.flashUntil;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.shadowColor = boss.tint;
  ctx.shadowBlur = 30;
  if (boss.style.hull === 'hex') drawHex(ctx, boss, now, flash);
  else if (boss.style.hull === 'crescent') drawCrescent(ctx, boss, now, flash);
  else drawSaucer(ctx, boss, now, flash);
  ctx.restore();
}
