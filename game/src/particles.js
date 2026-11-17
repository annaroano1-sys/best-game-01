// STARFALL — the backdrop, per-level arenas, explosions, pop-ups.
import { VIEW } from './config.js';
import { ARENAS, arenaOf, sectorOf } from './sectors.js';
import { mulberry32, rand } from './random.js';
const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
};
export function createBackdrop() {
  const rng = mulberry32(20261116);
  const layers = [
    { speed: 8, size: 1.0, alpha: 0.45, stars: [] },
    { speed: 22, size: 1.6, alpha: 0.7, stars: [] },
    { speed: 48, size: 2.4, alpha: 1.0, stars: [] },
    { speed: 4, size: 0.9, alpha: 0.22, stars: [] },
  ];
  const counts = [120, 80, 45, 80];
  layers.forEach((layer, li) => {
    for (let i = 0; i < counts[li]; i++) {
      layer.stars.push({
        x: rng() * VIEW.width,
        y: rng() * VIEW.height,
        r: 0.6 + rng() * layer.size,
        twinkle: rng() * Math.PI * 2,
      });
    }
  });
  const debris = [];
  for (let i = 0; i < 16; i++) {
    const verts = [];
    const nv = 5 + Math.floor(rng() * 3);
    for (let v = 0; v < nv; v++) verts.push(0.6 + rng() * 0.7);
    debris.push({
      x: rng() * VIEW.width, y: rng() * VIEW.height,
      r: 6 + rng() * 14, rot: rng() * Math.PI * 2, vr: rand(-0.2, 0.2),
      vx: rand(-6, 6), vy: rand(6, 16),
      shade: rng() < 0.5 ? '#4a4038' : '#3c3c48', verts,
    });
  }
  const backdrop = {
    layers,
    debris,
    sector: 0,
    arena: null,
    planet: null,
    companion: null,
    starMul: 0.75,
    shooterEvery: [2.5, 6],
    debrisCount: 0,
    fog: null,
    aurora: null,
    shooters: [], 
    shooterTimer: 2.5,
    nebulas: [
      { x: 240, y: 190, r: 280, br: 280, color: '', vx: 3, vy: 1.5 },
      { x: 1020, y: 560, r: 320, br: 320, color: '', vx: -2, vy: 1 },
      { x: 760, y: 120, r: 220, br: 220, color: '', vx: 2.5, vy: 2 },
      { x: 120, y: 640, r: 200, br: 200, color: '', vx: -1.5, vy: -1 },
    ],
  };
  setBackdropArena(backdrop, 1);
  return backdrop;
}
export function setBackdropArena(backdrop, level) {
  const a = arenaOf(level);
  backdrop.arena = a;
  backdrop.sector = sectorOf(level);
  backdrop.nebulas.forEach((n, i) => {
    const [hex, alpha] = a.neb[i % a.neb.length];
    n.color = hexA(hex, alpha);
    n.r = n.br * (a.nm ?? 1);
  });
  backdrop.planet = a.pl ? { ...a.pl } : null;
  backdrop.companion = a.co ? { ...a.co } : null;
  backdrop.starMul = a.st ?? 0.75;
  backdrop.shooterEvery = a.sh ?? [2.5, 6];
  backdrop.debrisCount = a.db ?? 0;
  backdrop.fog = a.fog ?? null;
  backdrop.aurora = a.au ?? null;
}
function drawPlanet(ctx, planet, now) {
  if (!planet) return;
  const { x, y, r, kind = 'planet' } = planet;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.5);
  glow.addColorStop(0, planet.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2);
  if (kind === 'hole') {
    ctx.strokeStyle = planet.bands[0];
    ctx.lineWidth = 12;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.5, r * 0.32, -0.22, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = planet.bands[2];
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.5, r * 0.32, -0.22, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'sun') {
    const core = ctx.createRadialGradient(x, y, 0, x, y, r);
    planet.bands.forEach((c, i) => core.addColorStop(i / (planet.bands.length - 1), c));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const body = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  planet.bands.forEach((c, i) => body.addColorStop(i / (planet.bands.length - 1), c));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (kind === 'moon') {
    const cr = mulberry32((planet.x | 0) * 7 + (planet.y | 0));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 6; i++) {
      const a = cr() * Math.PI * 2;
      const d = cr() * r * 0.6;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.08 + cr() * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    const drift = Math.sin(now / 4000) * r * 0.3;
    ctx.beginPath();
    ctx.arc(x + drift, y - r * 0.25, r * 0.7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - drift, y + r * 0.35, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (planet.ring) {
    ctx.strokeStyle = 'rgba(220, 235, 255, 0.55)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.55, r * 0.34, -0.22, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220, 235, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.75, r * 0.4, -0.22, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.restore();
}
export function drawBackdrop(ctx, backdrop, dt, now, shakeX = 0, shakeY = 0) {
  ctx.save();
  if (shakeX !== 0 || shakeY !== 0) ctx.translate(shakeX, shakeY);
  const sky = backdrop.arena.sky;
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, sky[0]);
  grad.addColorStop(0.55, sky[1]);
  grad.addColorStop(1, sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40);
  for (const n of backdrop.nebulas) {
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    if (n.x < -n.r) n.x = VIEW.width + n.r;
    if (n.x > VIEW.width + n.r) n.x = -n.r;
    if (n.y < -n.r) n.y = VIEW.height + n.r;
    if (n.y > VIEW.height + n.r) n.y = -n.r;
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, n.color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  }
  for (const layer of backdrop.layers) {
    const n = Math.floor(layer.stars.length * backdrop.starMul);
    for (let i = 0; i < n; i++) {
      const s = layer.stars[i];
      s.y += layer.speed * dt;
      if (s.y > VIEW.height + 4) { s.y = -4; s.x = rand(0, VIEW.width); }
      const a = layer.alpha * (0.35 + Math.abs(Math.sin(now / 900 + s.twinkle)) * 0.65);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dfeaff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < backdrop.debrisCount; i++) {
    const d = backdrop.debris[i];
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.rot += d.vr * dt;
    if (d.y > VIEW.height + 30) { d.y = -30; d.x = rand(0, VIEW.width); }
    if (d.x < -30) d.x = VIEW.width + 30;
    if (d.x > VIEW.width + 30) d.x = -30;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = d.shade;
    ctx.beginPath();
    d.verts.forEach((m, vi) => {
      const a = (vi / d.verts.length) * Math.PI * 2;
      const px = Math.cos(a) * d.r * m;
      const py = Math.sin(a) * d.r * m;
      if (vi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawPlanet(ctx, backdrop.planet, now);
  drawPlanet(ctx, backdrop.companion, now);
  if (backdrop.aurora) {
    const g = ctx.createLinearGradient(0, 40, 0, 240);
    g.addColorStop(0, backdrop.aurora);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 60 + Math.sin(now / 3000) * 20);
    for (let x = 0; x <= VIEW.width; x += 40) {
      ctx.lineTo(x, 110 + Math.sin(x / 180 + now / 2500) * 34 + Math.sin(x / 90 - now / 4000) * 12);
    }
    ctx.lineTo(VIEW.width, 240);
    ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fill();
  }
  backdrop.shooterTimer -= dt;
  if (backdrop.shooterTimer <= 0 && backdrop.shooters.length < 3) {
    backdrop.shooterTimer = rand(backdrop.shooterEvery[0], backdrop.shooterEvery[1]);
    backdrop.shooters.push({
      x: rand(200, VIEW.width - 100),
      y: rand(40, 260),
      vx: rand(-420, -260),
      vy: rand(140, 220),
      life: 0.9,
      maxLife: 0.9,
    });
  }
  for (const sh of backdrop.shooters) {
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.life -= dt;
    const a = Math.max(0, sh.life / sh.maxLife);
    const tail = 0.12;
    const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * tail, sh.y - sh.vy * tail);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * a})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(sh.x - sh.vx * tail, sh.y - sh.vy * tail);
    ctx.stroke();
  }
  backdrop.shooters = backdrop.shooters.filter((sh) => sh.life > 0);
  if (backdrop.fog) {
    ctx.fillStyle = backdrop.fog;
    ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40);
  }
  ctx.restore();
}
export function createParticles() {
  return { list: [], popups: [], rings: [], flash: { life: 0, maxLife: 0.5 } };
}
export function screenFlash(particles) {
  particles.flash.life = particles.flash.maxLife;
}
export function emitTrail(particles, x, y, color) {
  particles.list.push({
    x: x + rand(-4, 4), y,
    vx: rand(-16, 16),
    vy: rand(50, 110),
    life: rand(0.25, 0.4),
    maxLife: 0.4,
    size: rand(2, 4.5),
    color,
  });
}
export function clearPopups(particles) {
  particles.popups = [];
}
export function burst(particles, x, y, color, count = 26, power = 320) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(power * 0.25, power);
    particles.list.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.35, 0.8),
      maxLife: 0.8,
      size: rand(2, 5),
      color,
    });
  }
}
export function shockwave(particles, x, y, color, maxR = 160) {
  particles.rings.push({ x, y, r: 8, maxR, color, life: 0.55, maxLife: 0.55 });
}
export function spawnPopup(particles, x, y, text, color = '#ffe66d', size = 20, life = 0.9) {
  particles.popups.push({ x, y, text, color, size, life, maxLife: life });
}
export function updateParticles(particles, dt) {
  for (const p of particles.list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-2.2 * dt);
    p.vy *= Math.exp(-2.2 * dt);
    p.life -= dt;
  }
  particles.list = particles.list.filter((p) => p.life > 0);
  for (const p of particles.popups) {
    p.y -= 42 * dt;
    p.life -= dt;
  }
  particles.popups = particles.popups.filter((p) => p.life > 0);
  for (const ring of particles.rings) {
    ring.r += (ring.maxR - ring.r) * dt * 6;
    ring.life -= dt;
  }
  particles.rings = particles.rings.filter((r) => r.life > 0);
  if (particles.flash.life > 0) particles.flash.life -= dt;
}
export function drawParticles(ctx, particles) {
  for (const p of particles.list) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  for (const ring of particles.rings) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ring.life / ring.maxLife);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of particles.popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.font = `800 ${p.size ?? 20}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
  if (particles.flash.life > 0) {
    const a = (particles.flash.life / particles.flash.maxLife) * 0.22;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.restore();
  }
}
