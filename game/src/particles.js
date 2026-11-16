// Particles and the backdrop: explosion sparks when something breaks,
// collect sparkles when a star is caught, floating score pop-ups, and a
// seeded parallax starfield sky — three layers of stars drifting at
// different speeds over two slow-moving nebulae — behind everything.

import { VIEW } from './config.js';
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
    nebulas: [
      { x: 240, y: 190, r: 280, color: 'rgba(80, 40, 160, 0.20)', vx: 3, vy: 1.5 },
      { x: 1020, y: 560, r: 320, color: 'rgba(20, 90, 140, 0.18)', vx: -2, vy: 1 },
      { x: 760, y: 120, r: 220, color: 'rgba(160, 40, 110, 0.14)', vx: 2.5, vy: 2 },
      { x: 120, y: 640, r: 200, color: 'rgba(255, 150, 60, 0.10)', vx: -1.5, vy: -1 },
    ],
  };
}

export function drawBackdrop(ctx, backdrop, dt, now, shakeX = 0, shakeY = 0) {
  ctx.save();
  if (shakeX !== 0 || shakeY !== 0) ctx.translate(shakeX, shakeY);
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, '#050516');
  grad.addColorStop(0.55, '#0a0a2e');
  grad.addColorStop(1, '#12082e');
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
  return { list: [], popups: [] };
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
