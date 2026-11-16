// Particles and the backdrop: explosion sparks when something breaks,
// collect sparkles when a star is caught, shockwave rings for big blasts,
// floating score pop-ups, and a seeded parallax starfield sky — three
// layers of stars drifting at different speeds over slow-moving nebulae —
// behind everything. The sky palette follows the current sector.

import { SECTORS, VIEW } from './config.js';
import { mulberry32, rand } from './random.js';

export function createBackdrop() {
  const rng = mulberry32(20261116);
  // Three depth layers: far stars are dim and slow, near stars are bright
  // and fast, so the sky feels deep when the ship moves.
  const layers = [
    { speed: 8, size: 1.0, alpha: 0.45, stars: [] },
    { speed: 22, size: 1.6, alpha: 0.7, stars: [] },
    { speed: 48, size: 2.4, alpha: 1.0, stars: [] },
  ];
  const counts = [70, 45, 25];
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
  return {
    layers,
    sector: 0,
    nebulas: [
      { x: 240, y: 190, r: 280, color: SECTORS[0].nebula[0].color, vx: 3, vy: 1.5 },
      { x: 1020, y: 560, r: 320, color: SECTORS[0].nebula[1].color, vx: -2, vy: 1 },
      { x: 760, y: 120, r: 220, color: SECTORS[0].nebula[2].color, vx: 2.5, vy: 2 },
      { x: 120, y: 640, r: 200, color: SECTORS[0].nebula[3].color, vx: -1.5, vy: -1 },
    ],
  };
}

/** Swap the sky to another sector's palette (nebulae recolor in place). */
export function setBackdropSector(backdrop, sector) {
  backdrop.sector = sector;
  const palette = SECTORS[sector].nebula;
  backdrop.nebulas.forEach((n, i) => { n.color = palette[i % palette.length].color; });
}

export function drawBackdrop(ctx, backdrop, dt, now, shakeX = 0, shakeY = 0) {
  ctx.save();
  if (shakeX !== 0 || shakeY !== 0) ctx.translate(shakeX, shakeY);
  const sky = SECTORS[backdrop.sector].sky;
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
    for (const s of layer.stars) {
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
  ctx.restore();
}

export function createParticles() {
  return { list: [], popups: [], rings: [] };
}

/** A burst of sparks at (x, y) in the given color. */
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

/** An expanding shockwave ring — the big-blast signature. */
export function shockwave(particles, x, y, color, maxR = 160) {
  particles.rings.push({ x, y, r: 8, maxR, color, life: 0.55, maxLife: 0.55 });
}

/** Floating score text that rises and fades ("+30", "BOSS +500"). */
export function spawnPopup(particles, x, y, text, color = '#ffe66d') {
  particles.popups.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
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
}

export function drawParticles(ctx, particles) {
  for (const p of particles.list) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
    ctx.font = '800 20px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}
