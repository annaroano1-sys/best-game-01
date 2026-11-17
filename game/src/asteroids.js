// STARFALL — the tumbling rocks: shootable, with hit points.
import { ASTEROID, VIEW } from './config.js';
import { rand, randInt, pick } from './random.js';
const ROCK_COLORS = ['#8d99ae', '#7a6f8f', '#9c7a5b', '#6b7f8f'];
export function createAsteroidField() {
  return { list: [], spawnTimer: 0 };
}
export function makeAsteroid(level) {
  const radius = rand(ASTEROID.radiusMin, ASTEROID.radiusMax);
  const speed = Math.min(
    ASTEROID.baseSpeed + (level - 1) * ASTEROID.speedGrowth + rand(-20, 40),
    ASTEROID.maxSpeed,
  );
  const points = [];
  const n = randInt(8, 11);
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    points.push({ angle, r: radius * rand(0.72, 1.15) });
  }
  return {
    x: rand(radius, VIEW.width - radius),
    y: -radius - 10,
    vx: rand(-35, 35),
    vy: speed,
    radius,
    hp: radius > 32 ? 2 : 1,
    maxHp: radius > 32 ? 2 : 1,
    score: Math.round(10 + radius),
    points,
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-1.2, 1.2),
    color: pick(ROCK_COLORS),
  };
}
export function updateAsteroids(field, level, dt, timeScale, spawnScale = 1) {
  const rate = (ASTEROID.baseSpawnPerSec + (level - 1) * ASTEROID.spawnGrowth) * spawnScale;
  field.spawnTimer -= dt * timeScale;
  if (field.spawnTimer <= 0 && field.list.length < ASTEROID.maxOnScreen) {
    field.list.push(makeAsteroid(level));
    field.spawnTimer = 1 / rate;
  }
  for (const a of field.list) {
    a.x += a.vx * dt * timeScale;
    a.y += a.vy * dt * timeScale;
    a.rot += a.rotSpeed * dt * timeScale;
    if (a.x < -a.radius) a.x = VIEW.width + a.radius;
    if (a.x > VIEW.width + a.radius) a.x = -a.radius;
  }
  field.list = field.list.filter((a) => a.y - a.radius < VIEW.height + 20);
}
export function resolveRockHits(field, bullets, piercing = false) {
  const events = [];
  for (const b of bullets) {
    if (b.spent) continue;
    for (const a of field.list) {
      if (b.hit && b.hit.has(a)) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const r = b.radius + a.radius;
      if (dx * dx + dy * dy >= r * r) continue;
      if (piercing) {
        if (!b.hit) b.hit = new Set();
        b.hit.add(a);
      } else {
        b.spent = true;
      }
      a.hp -= b.damage ?? 1;
      if (a.hp <= 0) {
        field.list = field.list.filter((other) => other !== a);
        events.push({ type: 'destroyed', x: a.x, y: a.y, score: a.score, damage: b.damage ?? 1, enemy: a });
      } else {
        events.push({ type: 'hit', x: a.x, y: a.y, score: 0, damage: b.damage ?? 1, enemy: a });
      }
      break;
    }
  }
  return events;
}
export function drawAsteroids(ctx, field) {
  for (const a of field.list) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.shadowColor = 'rgba(180, 160, 200, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = a.color;
    ctx.beginPath();
    a.points.forEach((p, i) => {
      const px = Math.cos(p.angle) * p.r;
      const py = Math.sin(p.angle) * p.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (a.hp < a.maxHp) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-a.radius * 0.5, -a.radius * 0.3);
      ctx.lineTo(0, a.radius * 0.1);
      ctx.lineTo(a.radius * 0.45, -a.radius * 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(-a.radius * 0.3, -a.radius * 0.2, a.radius * 0.22, 0, Math.PI * 2);
    ctx.arc(a.radius * 0.35, a.radius * 0.3, a.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
