// STARFALL — random mid-run events: meteor shower to shard surge.
import { EVENTS } from './config.js';
import { rand } from './random.js';
const KINDS = ['meteor', 'star-rain', 'supply', 'flare', 'shard-surge'];
export function createEventState() {
  return {
    active: null,        
    nextAt: 0,           
    rockMult: 1,
    starMult: 1,
    slowMult: 1,
    shardMult: 1,        
    forceKind: null,     
  };
}
function describe(kind) {
  if (kind === 'meteor') return { label: '☄ METEOR SHOWER ☄', sub: 'rocks rain three times as fast!' };
  if (kind === 'star-rain') return { label: '★ STAR RAIN ★', sub: 'stars everywhere — grab them!' };
  if (kind === 'supply') return { label: '⬢ SUPPLY DROP ⬢', sub: 'three power-ups incoming!' };
  if (kind === 'shard-surge') return { label: '◆ SHARD SURGE ◆', sub: 'every star pays double shards!' };
  return { label: '☀ SOLAR FLARE ☀', sub: 'enemies slowed to half speed!' };
}
export function updateEvents(state, now, dropSupply) {
  if (state.active && now >= state.active.until) {
    state.active = null;
    state.rockMult = 1;
    state.starMult = 1;
    state.slowMult = 1;
    state.shardMult = 1;
  }
  if (state.nextAt === 0) {
    state.nextAt = now + rand(EVENTS.minGapMs, EVENTS.maxGapMs);
    return null;
  }
  if (state.active || now < state.nextAt) return null;
  const kind = state.forceKind && KINDS.includes(state.forceKind)
    ? state.forceKind
    : KINDS[Math.floor(Math.random() * KINDS.length)];
  state.forceKind = null;
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
  } else if (kind === 'shard-surge') {
    state.shardMult = 2;
    state.active = { kind, until: now + EVENTS.shardSurgeMs, ...info };
  } else {
    state.slowMult = 0.5;
    state.active = { kind, until: now + EVENTS.flareMs, ...info };
  }
  state.nextAt = now + rand(EVENTS.minGapMs, EVENTS.maxGapMs);
  return state.active;
}
