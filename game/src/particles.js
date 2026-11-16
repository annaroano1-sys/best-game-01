// Particles and the backdrop: explosion sparks when something breaks,
// collect sparkles when a star is caught, and a seeded starfield sky
// with two drifting nebulae behind everything.

import { VIEW } from './config.js';
import { mulberry32, rand } from './random.js';

export function createBackdrop() {
  const rng = mulberry32(20261116);
  const stars = [];
  for (let i = 0; i < 130; i++) {
    stars.push({
      x: rng() * VIEW.width,
      y: rng() * VIEW.height,
      r: 0.6 + rng() * 1.8,
      twinkle: rng() * Math.PI * 2,
      speed: 6 + rng() * 18, // slow downward drift
    });
  }
  return { stars, nebulas: [
    { x: 240, y: 190, r: 260, color: 'rgba(80, 40, 160, 0.20)' },
    { x: 1020, y: 560, r: 300, color: 'rgba(20, 90, 140, 0.18)' },
    { x: 760, y: 120, r: 200, color: 'rgba(160, 40, 110, 0.14)' },
  ] };
}

export function drawBackdrop(ctx, backdrop, dt, now) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, '#050516');
  grad.addColorStop(0.55, '#0a0a2e');
  grad.addColorStop(1, '#12082e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  for (const n of backdrop.nebulas) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, n.color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  }

  for (const s of backdrop.stars) {
    s.y += s.speed * dt;
    if (s.y > VIEW.height + 4) { s.y = -4; s.x = rand(0, VIEW.width); }
    const a = 0.35 + Math.abs(Math.sin(now / 900 + s.twinkle)) * 0.65;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#dfeaff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createParticles() {
  return { list: [] };
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

export function updateParticles(particles, dt) {
  for (const p of particles.list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-2.2 * dt);
    p.vy *= Math.exp(-2.2 * dt);
    p.life -= dt;
  }
  particles.list = particles.list.filter((p) => p.life > 0);
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
}
