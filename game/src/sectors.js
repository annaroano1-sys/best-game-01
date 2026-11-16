// Sectors: the campaign's three five-level stretches. Each sector has its
// own name, sky palette and enemy flavour, so advancing feels like arriving
// somewhere new instead of the same sky getting faster.

import { SECTORS } from './config.js';

/** Which sector a level belongs to (0, 1 or 2). Endless runs stay in the last. */
export function sectorOf(level) {
  for (let i = 0; i < SECTORS.length; i++) {
    if (level >= SECTORS[i].levels[0] && level <= SECTORS[i].levels[1]) return i;
  }
  return SECTORS.length - 1;
}

export function sectorName(level) {
  return SECTORS[sectorOf(level)].name;
}

/** A sector's accent colour, for banners and HUD highlights. */
export function sectorAccent(level) {
  return SECTORS[sectorOf(level)].accent;
}

/** Spawn-weight multiplier for a kind in a sector: Ember Reef favours
 * fast shooters, the Void favours drones and swarms. */
export function sectorWeight(kind, sector) {
  if (sector === 1) {
    if (kind === 'speeder' || kind === 'shooter') return 1.6;
    if (kind === 'drone') return 0.7;
  }
  if (sector === 2) {
    if (kind === 'drone' || kind === 'swarm') return 1.6;
    if (kind === 'speeder') return 0.7;
  }
  return 1;
}
