// Ship skins: the collection system. Skins are unlocked with lifetime
// shards earned (or by beating level 10) and picked in the hangar on the
// start screen. Everything persists in localStorage, so a collection
// built over many runs stays yours.

import { SKINS } from './config.js';

const UNLOCKED_KEY = 'starfall-skins-unlocked';
const SELECTED_KEY = 'starfall-skin-selected';
const SHARDS_KEY = 'starfall-shards-total';
const LEVEL10_KEY = 'starfall-beat-level-10';

export function loadSkins() {
  let unlocked = ['azure'];
  try {
    const parsed = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? '["azure"]');
    if (Array.isArray(parsed)) unlocked = parsed.filter((id) => SKINS.some((s) => s.id === id));
  } catch { /* corrupted save: fall back to the starter skin */ }
  let selected = localStorage.getItem(SELECTED_KEY) ?? 'azure';
  if (!unlocked.includes(selected)) selected = 'azure';
  return { unlocked, selected };
}

export function saveSkins(state) {
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify(state.unlocked));
  localStorage.setItem(SELECTED_KEY, state.selected);
}

export function lifetimeShards() {
  return Number(localStorage.getItem(SHARDS_KEY) ?? 0) || 0;
}

export function addLifetimeShards(n) {
  const total = lifetimeShards() + n;
  localStorage.setItem(SHARDS_KEY, String(total));
  return total;
}

export function markBeatLevel10() {
  localStorage.setItem(LEVEL10_KEY, '1');
}

export function beatLevel10() {
  return localStorage.getItem(LEVEL10_KEY) === '1';
}

/** Unlock every skin the player now qualifies for. Returns the new ones. */
export function checkUnlocks(state) {
  const gained = [];
  const shards = lifetimeShards();
  for (const skin of SKINS) {
    if (state.unlocked.includes(skin.id)) continue;
    if (skin.unlock === 'shards' && shards >= skin.cost) {
      state.unlocked.push(skin.id);
      gained.push(skin);
    } else if (skin.unlock === 'level10' && beatLevel10()) {
      state.unlocked.push(skin.id);
      gained.push(skin);
    }
  }
  if (gained.length > 0) saveSkins(state);
  return gained;
}

export function skinById(id) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
