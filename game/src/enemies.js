// STARFALL — the enemy roster: speeders to carriers, spawn and fight.
import { ENEMY, VIEW } from './config.js';
import { rand, randInt, pick, clamp } from './random.js';
import { sectorWeight } from './sectors.js';
const SPECIAL_KINDS = ['speeder', 'splitter', 'mine', 'drone', 'shooter', 'swarm', 'colossus', 'dasher', 'sniper', 'weaver', 'carrier'];
export function createEnemyField() {
  return { list: [], spawnTimer: 0 };
}
function unlockedKinds(level) {
  return SPECIAL_KINDS.filter((k) => level >= ENEMY[k].spawnFromLevel);
}
function pickKind(level, sector) {
  const kinds = unlockedKinds(level);
  if (kinds.length === 0) return null;
  let total = 0;
  for (const k of kinds) total += ENEMY[k].weight * sectorWeight(k, sector);
  let roll = Math.random() * total;
  for (const k of kinds) {
    roll -= ENEMY[k].weight * sectorWeight(k, sector);
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
    hp: kind === 'splitter' ? 2 : kind === 'colossus' ? ENEMY.colossus.hp : kind === 'sniper' ? 2 : kind === 'carrier' ? ENEMY.carrier.hp : 1,
    maxHp: kind === 'splitter' ? 2 : kind === 'colossus' ? ENEMY.colossus.hp : kind === 'sniper' ? 2 : kind === 'carrier' ? ENEMY.carrier.hp : 1,
    score: spec.score,
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-1.5, 1.5),
    color: '#ffffff',
    armed: false,
    fuseUntil: 0,
    fireTimer: ENEMY.shooter.fireIntervalMs * rand(0.7, 1.2),
    dead: false,
    mode: 'drift',
    modeTimer: rand(1.5, 3),
    baseVy: speed,
    tx: 0,
    ty: 0,
    chargeTimer: ENEMY.sniper.fireIntervalMs * rand(0.7, 1.2),
    charging: false,
    chargeEnd: 0,
    aimX: 0,
    aimY: 0,
    readyShot: false,
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
function makeShooter(level) {
  const e = baseEnemy('shooter', level);
  e.color = '#ff7847';
  e.y = -40;
  return e;
}
function makeSwarm(level) {
  const e = baseEnemy('swarm', level);
  e.color = '#ffd166';
  return e;
}
function makeColossus(level) {
  const e = baseEnemy('colossus', level);
  e.color = '#9c7a5b';
  return e;
}
function makeDasher(level) {
  const e = baseEnemy('dasher', level);
  e.color = '#ff5d5d';
  return e;
}
function makeSniper(level) {
  const e = baseEnemy('sniper', level);
  e.color = '#c77dff';
  e.y = -40;
  return e;
}
function makeWeaver(level) {
  const e = baseEnemy('weaver', level);
  e.color = '#00f5d4';
  return e;
}
function makeCarrier(level) {
  const e = baseEnemy('carrier', level);
  e.color = '#ffd166';
  e.vx = rand(-10, 10);
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
    armed: false, fuseUntil: 0, fireTimer: 0, dead: false,
  };
}
const MAKERS = {
  speeder: makeSpeeder, splitter: makeSplitter, mine: makeMine, drone: makeDrone,
  shooter: makeShooter, swarm: makeSwarm, colossus: makeColossus,
  dasher: makeDasher, sniper: makeSniper, weaver: makeWeaver, carrier: makeCarrier,
};
export function spawnEnemy(field, kind, x, y) {
  const e = MAKERS[kind] ? MAKERS[kind](1) : null;
  if (!e) return null;
  e.x = x;
  e.y = y;
  field.list.push(e);
  return e;
}
export function updateEnemies(field, level, sector, dt, timeScale, ship, now, spawnScale = 1) {
  const rate = (0.5 + level * 0.13) * spawnScale; // boss fights spawn fewer adds: the guardian is the fight
  field.spawnTimer -= dt * timeScale;
  if (field.spawnTimer <= 0 && field.list.length < ENEMY.maxOnScreen) {
    const kind = pickKind(level, sector);
    if (kind) {
      if (kind === 'swarm') {
        const cx = rand(120, VIEW.width - 120);
        for (let i = 0; i < ENEMY.swarm.packSize; i++) {
          const s = makeSwarm(level);
          s.x = cx + rand(-70, 70);
          s.y = -40 - i * 26;
          field.list.push(s);
        }
      } else {
        field.list.push(MAKERS[kind](level));
      }
    }
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
    } else if (e.kind === 'swarm') {
      e.vx = Math.sin(e.phase * ENEMY.swarm.weaveFreq) * ENEMY.swarm.weaveAmp;
    } else if (e.kind === 'shooter') {
      if (e.y < ENEMY.shooter.hoverY) {
        e.vy = ENEMY.shooter.speed;
      } else {
        e.vy = 0;
        e.vx = Math.sin(e.phase * 0.8) * 60;
      }
    } else if (e.kind === 'mine') {
      const dx = ship.x - e.x;
      const dy = ship.y - e.y;
      if (!e.armed && dx * dx + dy * dy < ENEMY.mine.armRadius * ENEMY.mine.armRadius) {
        e.armed = true;
        e.fuseUntil = now + ENEMY.mine.fuseMs;
      }
    } else if (e.kind === 'dasher') {
      if (e.mode === 'drift') {
        e.vy = e.baseVy;
        e.vx = Math.sin(e.phase * 1.2) * 30;
        e.modeTimer -= dt * timeScale;
        if (e.modeTimer <= 0) {
          e.mode = 'telegraph';
          e.modeTimer = ENEMY.dasher.telegraphMs / 1000;
          e.tx = ship.x;
          e.ty = ship.y;
          e.vx = 0;
          e.vy = 0;
        }
      } else if (e.mode === 'telegraph') {
        e.vx = 0;
        e.vy = 0;
        e.modeTimer -= dt * timeScale;
        if (e.modeTimer <= 0) {
          e.mode = 'dash';
          e.modeTimer = ENEMY.dasher.dashMs / 1000;
          const dx = e.tx - e.x;
          const dy = e.ty - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          e.vx = (dx / dist) * ENEMY.dasher.dashSpeed;
          e.vy = (dy / dist) * ENEMY.dasher.dashSpeed;
        }
      } else {
        e.modeTimer -= dt * timeScale;
        if (e.modeTimer <= 0) {
          e.mode = 'drift';
          e.modeTimer = rand(1.5, 3);
          e.vy = e.baseVy;
          e.vx = 0;
        }
      }
    } else if (e.kind === 'weaver') {
      e.vx = Math.sin(e.phase * ENEMY.weaver.weaveFreq) * ENEMY.weaver.weaveAmp;
      // One aimed shot per pass, only while it crosses the middle of the
      // screen — dense enough to matter, slow enough to dodge.
      e.fireTimer -= dt * 1000 * timeScale;
      if (e.fireTimer <= 0 && e.y > 180 && e.y < 460) {
        e.fireTimer = ENEMY.weaver.fireIntervalMs * rand(0.9, 1.3);
        e.readyShot = true;
      }
    } else if (e.kind === 'carrier') {
      e.vx = Math.sin(e.phase * 0.5) * 18;
    } else if (e.kind === 'sniper') {
      if (e.y < ENEMY.sniper.hoverY) {
        e.vy = ENEMY.sniper.speed;
      } else {
        e.vy = 0;
        e.vx = Math.sin(e.phase * 0.7) * 45;
        if (e.charging) {
          if (now >= e.chargeEnd) {
            e.charging = false;
            e.readyShot = true;
            e.chargeTimer = ENEMY.sniper.fireIntervalMs * rand(0.85, 1.2);
          }
        } else {
          e.chargeTimer -= dt * 1000 * timeScale;
          if (e.chargeTimer <= 0) {
            e.charging = true;
            e.chargeEnd = now + ENEMY.sniper.chargeMs;
            e.aimX = ship.x;
            e.aimY = ship.y;
          }
        }
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
export function enemyShots(field, dt, timeScale) {
  const shooters = [];
  for (const e of field.list) {
    if (e.kind !== 'shooter' || e.dead || e.y < 60) continue;
    e.fireTimer -= dt * 1000 * timeScale;
    if (e.fireTimer <= 0) {
      e.fireTimer = ENEMY.shooter.fireIntervalMs * rand(0.85, 1.2);
      shooters.push(e);
    }
  }
  return shooters;
}
export function sniperShots(field) {
  const out = [];
  for (const e of field.list) {
    if (e.kind !== 'sniper' || e.dead || !e.readyShot) continue;
    e.readyShot = false;
    out.push(e);
  }
  return out;
}
export function weaverShots(field) {
  const out = [];
  for (const e of field.list) {
    if (e.kind !== 'weaver' || e.dead || !e.readyShot) continue;
    e.readyShot = false;
    out.push(e);
  }
  return out;
}
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
export function resolveBulletHits(field, bullets, piercing = false) {
  const events = [];
  for (const b of bullets) {
    if (b.spent) continue;
    for (const e of field.list) {
      if (e.dead) continue;
      if (b.hit && b.hit.has(e)) continue;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const r = b.radius + e.radius;
      if (dx * dx + dy * dy >= r * r) continue;
      if (piercing) {
        if (!b.hit) b.hit = new Set();
        b.hit.add(e);
      } else {
        b.spent = true;
      }
      e.hp -= b.damage;
      if (e.kind === 'mine') {
        e.dead = true;
        events.push({ type: 'blast', x: e.x, y: e.y, score: e.score, damage: b.damage, enemy: e });
      } else if (e.hp <= 0) {
        e.dead = true;
        events.push({ type: 'destroyed', x: e.x, y: e.y, score: e.score, damage: b.damage, enemy: e });
        if (e.kind === 'splitter') {
          field.list.push(makeShard(e.x - 14, e.y), makeShard(e.x + 14, e.y));
        }
      } else {
        events.push({ type: 'hit', x: e.x, y: e.y, score: 0, damage: b.damage, enemy: e });
      }
      break;
    }
  }
  field.list = field.list.filter((e) => !e.dead);
  return events;
}
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
function drawShooter(ctx, e, now) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = '#ff7847';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#4a1400';
  ctx.strokeStyle = '#ff7847';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-e.radius, -e.radius * 0.4);
  ctx.lineTo(e.radius, -e.radius * 0.4);
  ctx.lineTo(e.radius * 0.6, e.radius * 0.7);
  ctx.lineTo(-e.radius * 0.6, e.radius * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, e.radius * 0.6);
  ctx.lineTo(-6, e.radius + 8);
  ctx.moveTo(6, e.radius * 0.6);
  ctx.lineTo(6, e.radius + 8);
  ctx.stroke();
  const charging = e.fireTimer < 400;
  ctx.fillStyle = charging ? '#ffffff' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, -e.radius * 0.1, 6 + (charging ? Math.sin(now / 60) * 2 : 0), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawSwarm(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(Math.sin(e.phase) * 0.6);
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(0, -e.radius);
  ctx.lineTo(e.radius, e.radius);
  ctx.lineTo(0, e.radius * 0.4);
  ctx.lineTo(-e.radius, e.radius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawColossus(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot);
  ctx.shadowColor = 'rgba(220, 180, 120, 0.6)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = e.radius * (0.8 + 0.2 * Math.sin(i * 2.3 + e.phase));
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(-e.radius * 0.3, -e.radius * 0.2, e.radius * 0.2, 0, Math.PI * 2);
  ctx.arc(e.radius * 0.35, e.radius * 0.3, e.radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.hp <= 2 ? '#ff5d5d' : '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(e.x, e.y - e.radius - 12);
  for (let i = 0; i < e.maxHp; i++) {
    ctx.fillStyle = i < e.hp ? '#ffd166' : 'rgba(255, 209, 102, 0.25)';
    ctx.fillRect(-e.maxHp * 4 + i * 8, 0, 6, 4);
  }
  ctx.restore();
}
function drawDasher(ctx, e, now) {
  const telegraphing = e.mode === 'telegraph';
  const dashing = e.mode === 'dash';
  ctx.save();
  ctx.translate(e.x, e.y);
  if (dashing) ctx.rotate(Math.atan2(e.vy, e.vx) + Math.PI / 2);
  if (telegraphing && Math.floor(now / 90) % 2 === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 93, 93, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.shadowColor = '#ff5d5d';
  ctx.shadowBlur = dashing ? 26 : 16;
  ctx.fillStyle = telegraphing && Math.floor(now / 90) % 2 === 0 ? '#ffd166' : '#ff5d5d';
  ctx.beginPath();
  ctx.moveTo(0, -e.radius - 4);
  ctx.lineTo(e.radius, e.radius);
  ctx.lineTo(0, e.radius * 0.4);
  ctx.lineTo(-e.radius, e.radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, -2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawSniper(ctx, e, now) {
  ctx.save();
  if (e.charging) {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + 10);
    ctx.lineTo(e.aimX, e.aimY);
    ctx.strokeStyle = Math.floor(now / 80) % 2 === 0 ? 'rgba(255, 93, 93, 0.85)' : 'rgba(255, 93, 93, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.translate(e.x, e.y);
  ctx.shadowColor = '#c77dff';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#2a0a4a';
  ctx.strokeStyle = '#c77dff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e9d5ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, e.radius * 0.5);
  ctx.lineTo(0, e.radius + 12);
  ctx.stroke();
  const charging = e.charging;
  ctx.fillStyle = charging ? '#ffffff' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, -2, charging ? 7 + Math.sin(now / 60) * 2 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawWeaver(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const px = -i * 7;
    const py = Math.sin(e.phase * 2.6 - i * 0.7) * 14 + 26;
    if (i === 0) ctx.moveTo(0, 26);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.rotate(Math.sin(e.phase) * 0.5);
  ctx.shadowColor = '#00f5d4';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#00f5d4';
  ctx.beginPath();
  ctx.moveTo(0, -e.radius);
  ctx.lineTo(e.radius * 0.9, e.radius * 0.5);
  ctx.lineTo(0, e.radius * 0.1);
  ctx.lineTo(-e.radius * 0.9, e.radius * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#062e28';
  ctx.beginPath();
  ctx.arc(0, -2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawCarrier(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#3d2a00';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const px = Math.cos(a) * e.radius;
    const py = Math.sin(a) * e.radius * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 0, 9 + Math.sin(e.phase * 2) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d2a00';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◆', 0, 1);
  ctx.restore();
  ctx.save();
  ctx.translate(e.x, e.y - e.radius - 12);
  for (let i = 0; i < e.maxHp; i++) {
    ctx.fillStyle = i < e.hp ? '#ffd166' : 'rgba(255, 209, 102, 0.25)';
    ctx.fillRect(-e.maxHp * 4 + i * 8, 0, 6, 4);
  }
  ctx.restore();
}
export function drawEnemies(ctx, field, now) {
  for (const e of field.list) {
    if (e.kind === 'mine') drawMine(ctx, e, now);
    else if (e.kind === 'drone') drawDrone(ctx, e);
    else if (e.kind === 'shooter') drawShooter(ctx, e, now);
    else if (e.kind === 'swarm') drawSwarm(ctx, e);
    else if (e.kind === 'colossus') drawColossus(ctx, e);
    else if (e.kind === 'dasher') drawDasher(ctx, e, now);
    else if (e.kind === 'sniper') drawSniper(ctx, e, now);
    else if (e.kind === 'weaver') drawWeaver(ctx, e);
    else if (e.kind === 'carrier') drawCarrier(ctx, e);
    else drawRockLike(ctx, e);
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
