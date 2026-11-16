// The upgrade shop: after every finished mission the run pauses and the
// pilot spends star shards on six upgrade tracks. The shop is a DOM
// overlay the game loop shows and hides; buying is a click, and the run
// resumes with CONTINUE. All upgrade state lives in the run object.

import { UPGRADES } from './config.js';

/** A fresh upgrade state: each track at rank 0. */
export function createUpgrades() {
  const ranks = {};
  for (const u of UPGRADES) ranks[u.id] = 0;
  return { ranks, bought: 0 };
}

/** The price of the next rank on a track, or null when it is maxed. */
export function upgradeCost(upgrades, id) {
  const track = UPGRADES.find((u) => u.id === id);
  const rank = upgrades.ranks[id];
  if (!track || rank >= track.costs.length) return null;
  return track.costs[rank];
}

/** Buy one rank. Returns true when the purchase went through. */
export function buyUpgrade(upgrades, id, shards) {
  const cost = upgradeCost(upgrades, id);
  if (cost === null || shards < cost) return null;
  upgrades.ranks[id] += 1;
  upgrades.bought += 1;
  return cost;
}

// ---- Derived stats the game loop reads ----

export function fireCooldownMs(upgrades) {
  return 170 * Math.pow(0.85, upgrades.ranks.rapid);
}

export function bulletDamage(upgrades) {
  return 1 + upgrades.ranks.heavy;
}

export function bulletCount(upgrades) {
  return 1 + upgrades.ranks.spread;
}

export function shieldHits(upgrades) {
  return 1 + upgrades.ranks.shield;
}

export function magnetRadiusBonus(upgrades) {
  return upgrades.ranks.magnet * 140;
}

export function extraLives(upgrades) {
  return upgrades.ranks.hull;
}

// ---- DOM rendering ----

/** Render the shop cards into the overlay. `onBuy` runs after each
 * purchase so the caller can refresh the shards display and the cards. */
export function renderShop(container, upgrades, shards, onBuy) {
  container.innerHTML = '';
  for (const track of UPGRADES) {
    const rank = upgrades.ranks[track.id];
    const maxed = rank >= track.costs.length;
    const cost = maxed ? null : track.costs[rank];
    const card = document.createElement('button');
    card.className = 'shop-card' + (maxed ? ' maxed' : '') + (cost !== null && shards < cost ? ' poor' : '');
    card.type = 'button';
    const pips = '●'.repeat(rank) + '○'.repeat(track.costs.length - rank);
    card.innerHTML = `<span class="shop-icon">${track.icon}</span>`
      + `<span class="shop-name">${track.name}</span>`
      + `<span class="shop-desc">${track.desc}</span>`
      + `<span class="shop-pips">${pips}</span>`
      + `<span class="shop-cost">${maxed ? 'MAXED' : `◆ ${cost} shards`}</span>`;
    if (!maxed) {
      card.addEventListener('click', () => {
        if (buyUpgrade(upgrades, track.id, shards) !== null) onBuy(track, cost);
      });
    }
    container.appendChild(card);
  }
}
