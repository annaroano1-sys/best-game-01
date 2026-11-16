// The new threat roster: speeders, splitters, mines and drones. Rocks stay
// in asteroids.js; this module owns everything else that wants the ship
// dead, how it spawns, how it moves, and what happens when a bullet hits it.
//
// Enemy shape: { kind, x, y, vx, vy, radius, hp, maxHp, score, phase,
//   rot, rotSpeed, color, armed, fuseUntil, dead }.
// resolveBulletHits() returns the events the game loop turns into points,
// particles, sounds and (for mines) blasts.

import { ENEMY, VIEW } from './config.js';
import { rand, randInt, pick, clamp } from './random.js';

const SPECIAL_KINDS = ['speeder', 'splitter', 'mine', 'drone'];

export function createEnemyField() {
  return { list: [], spawnTimer: 0 };
}

function unlockedKinds(level) {
  return SPECIAL_KINDS.filter((k) => level >= ENEMY[k].spawnFromLevel);
}

function pickKind(level) {
  const kinds = unlockedKinds(level);
  if (kinds.length === 0) return null;
  let total = 0;
  for (const k of kinds) total += ENEMY[k].weight;
  let roll = Math.random() * total;
  for (const k of kinds) {
    roll -= ENEMY[k].weight;
    if (roll <= 0) return k;
  }
  return kinds[kinds.length - 1];
}

function baseEnemy(kind, level) {
  const spec = ENEMY[kind];
  const speed = spec.speed + (level - 1) * (spec.speedGrowth ?? 0);
  return {
    kind,
    x: rand(50, VIEW.width - 50),
    y: -40,
    vx: 0,
    vy: speed * rand(0.9, 1.15),
    radius: spec.radius,
    hp: kind === 'splitter' ? 2 : 1,
    maxHp: kind === 'splitter' ? 2 : 1,
    score: spec.score,
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-1.5, 1.5),
    color: '#ffffff',
    armed: false,
    fuseUntil: 0,
    dead: false,
  };
}

function makeSpeeder(level) {
  const e = baseEnemy('speeder', level);
  e.color = '#ff9f43';
  return e;
}

function makeSplitter(level) {
  const e = baseEnemy('splitter', level);
  e.color = '#b388ff';
  return e;
}

function makeMine(level) {
  const e = baseEnemy('mine', level);
  e.color = '#ff5d5d';
  e.vx = rand(-14, 14);
  return e;
}

function makeDrone(level) {
  const e = baseEnemy('drone', level);
  e.color = '#39ffb0';
  return e;
}

function makeShard(x, y) {
  return {
    kind: 'shard',
    x, y,
    vx: rand(-140, 140),
    vy: rand(180, 300),
    radius: ENEMY.splitter.shardRadius,
    hp: 1, maxHp: 1,
    score: 15,
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-3, 3),
    color: '#d0a6ff',
    armed: false, fuseUntil: 0, dead: false,
  };
}

const MAKERS = { speeder: makeSpeeder, splitter: makeSplitter, mine: makeMine, drone: makeDrone };

/** Drop one enemy of a given kind at a given spot (the boss uses this). */
export function spawnEnemy(field, kind, x, y) {
  const e = MAKERS[kind] ? MAKERS[kind](1) : null;
  if (!e) return null;
  e.x = x;
  e.y = y;
  field.list.push(e);
  return e;
}

/** Spawn specials on their own timer, faster as levels rise. */
export function updateEnemies(field, level, dt, timeScale, ship, now) {
  const rate = 0.45 + level * 0.12;
  field.spawnTimer -= dt * timeScale;
  if (field.spawnTimer <= 0 && field.list.length < ENEMY.maxOnScreen) {
    const kind = pickKind(level);
    if (kind) field.list.push(MAKERS[kind](level));
    field.spawnTimer = 1 / rate;
  }

  for (const e of field.list) {
    e.phase += dt * 3;
    if (e.kind === 'speeder') {
      e.vx = Math.sin(e.phase * 1.6) * 70;
    } else if (e.kind === 'drone') {
      const toward = clamp(ship.x - e.x, -1, 1);
      e.vx = Math.sin(e.phase * ENEMY.drone.weaveFreq) * ENEMY.drone.weaveAmp * 0.9
        + toward * ENEMY.drone.chase * e.vy * 0.5;
    } else if (e.kind === 'mine') {
      // Proximity fuse: arm when the ship wanders close, then detonate.
      const dx = ship.x - e.x;
      const dy = ship.y - e.y;
      if (!e.armed && dx * dx + dy * dy < ENEMY.mine.armRadius * ENEMY.mine.armRadius) {
        e.armed = true;
        e.fuseUntil = now + ENEMY.mine.fuseMs;
      }
    }
    e.x += e.vx * dt * timeScale;
    e.y += e.vy * dt * timeScale;
    e.rot += e.rotSpeed * dt * timeScale;
    if (e.x < -e.radius) e.x = VIEW.width + e.radius;
    if (e.x > VIEW.width + e.radius) e.x = -e.radius;
  }
  field.list = field.list.filter((e) => e.y - e.radius < VIEW.height + 30 && !e.dead);
}

/** Mines whose fuse ran out. The caller turns each into a blast. */
export function fusedMines(field, now) {
  const out = [];
  for (const e of field.list) {
    if (e.kind === 'mine' && e.armed && now >= e.fuseUntil) {
      e.dead = true;
      out.push(e);
    }
  }
  field.list = field.list.filter((e) => !e.dead);
  return out;
}

/**
 * Bullets vs specials. A bullet is spent on the first enemy it touches.
 * Returns events: { type: 'destroyed'|'hit'|'blast', x, y, score, enemy }
 * — 'blast' means a mine went off (it hurts whatever is inside its ring).
 */
export function resolveBulletHits(field, bullets) {
  const events = [];
  for (const b of bullets) {
    if (b.spent) continue;
    for (const e of field.list) {
      if (e.dead) continue;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const r = b.radius + e.radius;
      if (dx * dx + dy * dy >= r * r) continue;
      b.spent = true;
      e.hp -= 1;
      if (e.kind === 'mine') {
        // Shooting a mine sets it off right where it is. Mind the blast.
        e.dead = true;
        events.push({ type: 'blast', x: e.x, y: e.y, score: e.score, enemy: e });
      } else if (e.hp <= 0) {
        e.dead = true;
        events.push({ type: 'destroyed', x: e.x, y: e.y, score: e.score, enemy: e });
        if (e.kind === 'splitter') {
          field.list.push(makeShard(e.x - 14, e.y), makeShard(e.x + 14, e.y));
        }
      } else {
        events.push({ type: 'hit', x: e.x, y: e.y, score: 0, enemy: e });
      }
      break;
    }
  }
  field.list = field.list.filter((e) => !e.dead);
  return events;
}

/** Ship vs specials: the first enemy the ship touches. */
export function shipHitEnemy(field, ship) {
  for (const e of field.list) {
    const dx = ship.x - e.x;
    const dy = ship.y - e.y;
    const r = ship.radius + e.radius;
    if (dx * dx + dy * dy < r * r) {
      e.dead = true;
      field.list = field.list.filter((other) => !other.dead);
      return e;
    }
  }
  return null;
}

function drawRockLike(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = e.radius * (0.78 + 0.22 * Math.sin(i * 2.7 + e.phase));
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMine(ctx, e, now) {
  const blink = e.armed && Math.floor(now / 110) % 2 === 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.armed) {
    // Warning ring: the blast radius, drawn so the player can escape it.
    ctx.beginPath();
    ctx.arc(0, 0, ENEMY.mine.blastRadius, 0, Math.PI * 2);
    ctx.strokeStyle = blink ? 'rgba(255, 93, 93, 0.85)' : 'rgba(255, 93, 93, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.shadowColor = '#ff5d5d';
  ctx.shadowBlur = 18;
  ctx.fillStyle = blink ? '#ffd166' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3d0a0a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + e.rot;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
    ctx.lineTo(Math.cos(a) * (e.radius + 7), Math.sin(a) * (e.radius + 7));
    ctx.stroke();
  }
  ctx.fillStyle = '#3d0a0a';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDrone(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = '#39ffb0';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#0b3d2c';
  ctx.strokeStyle = '#39ffb0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -e.radius);
  ctx.lineTo(e.radius, 0);
  ctx.lineTo(0, e.radius);
  ctx.lineTo(-e.radius, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, 0, 4.5 + Math.sin(e.phase * 2) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEnemies(ctx, field, now) {
  for (const e of field.list) {
    if (e.kind === 'mine') drawMine(ctx, e, now);
    else if (e.kind === 'drone') drawDrone(ctx, e);
    else drawRockLike(ctx, e);
    // A cracked splitter shows its damage before it breaks apart.
    if (e.kind === 'splitter' && e.hp < e.maxHp) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-e.radius * 0.5, -e.radius * 0.4);
      ctx.lineTo(0, 0);
      ctx.lineTo(e.radius * 0.5, e.radius * 0.45);
      ctx.stroke();
      ctx.restore();
    }
  }
}
