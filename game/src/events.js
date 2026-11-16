// Random events: every 40–70 seconds the sky does something unexpected.
// Each event runs for a few seconds, is announced with a banner, and bends
// the spawn rules while it lasts. The game loop reads the live modifiers.

import { EVENTS } from './config.js';
import { rand } from './random.js';

const KINDS = ['meteor', 'star-rain', 'supply', 'flare'];

export function createEventState() {
  return {
    active: null,        // { kind, until, label } or null
    nextAt: 0,           // ms timestamp of the next event
    rockMult: 1,
    starMult: 1,
    slowMult: 1,
  };
}

function describe(kind) {
  if (kind === 'meteor') return { label: '☄ METEOR SHOWER ☄', sub: 'rocks rain three times as fast!' };
  if (kind === 'star-rain') return { label: '★ STAR RAIN ★', sub: 'stars everywhere — grab them!' };
  if (kind === 'supply') return { label: '⬢ SUPPLY DROP ⬢', sub: 'three power-ups incoming!' };
  return { label: '☀ SOLAR FLARE ☀', sub: 'enemies slowed to half speed!' };
}

/** Advance the event clock. Returns an event to announce, or null.
 * `dropSupply` is called for the supply-drop event. */
export function updateEvents(state, now, dropSupply) {
  if (state.active && now >= state.active.until) {
    state.active = null;
    state.rockMult = 1;
    state.starMult = 1;
    state.slowMult = 1;
  }
  if (state.nextAt === 0) {
    state.nextAt = now + rand(EVENTS.minGapMs, EVENTS.maxGapMs);
    return null;
  }
  if (state.active || now < state.nextAt) return null;
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
  const info = describe(kind);
  if (kind === 'meteor') {
    state.rockMult = 3;
    state.active = { kind, until: now + EVENTS.meteorMs, ...info };
  } else if (kind === 'star-rain') {
    state.starMult = 4;
    state.active = { kind, until: now + EVENTS.starRainMs, ...info };
  } else if (kind === 'supply') {
    state.active = { kind, until: now + 1000, ...info };
    dropSupply();
  } else {
    state.slowMult = 0.5;
    state.active = { kind, until: now + EVENTS.flareMs, ...info };
  }
  state.nextAt = now + rand(EVENTS.minGapMs, EVENTS.maxGapMs);
  return state.active;
}
