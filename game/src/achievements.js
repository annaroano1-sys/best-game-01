// Achievements: ten milestones that pop up mid-run, persist across runs,
// and show on the start screen. Each one is checked from the live run
// stats, so nothing here knows about the game loop beyond what it is told.

const ACHIEVEMENTS = [
  { id: 'first-blood', name: 'FIRST BLOOD', desc: 'Destroy your first rock', icon: '✦' },
  { id: 'star-starter', name: 'STARTER', desc: 'Collect 25 stars in one run', icon: '★' },
  { id: 'combo-8', name: 'CHAIN REACTION', desc: 'Reach a ×8 combo', icon: '×8' },
  { id: 'sharpshooter', name: 'SHARPSHOOTER', desc: 'Destroy 25 enemies in one run', icon: '◎' },
  { id: 'boss-slayer', name: 'BOSS SLAYER', desc: 'Sink a mothership', icon: '☠' },
  { id: 'untouchable', name: 'UNTOUCHABLE', desc: 'Finish a level without taking a hit', icon: '◆' },
  { id: 'rich', name: 'RICH PILOT', desc: 'Earn 300 shards in one run', icon: '◈' },
  { id: 'survivor', name: 'SURVIVOR', desc: 'Reach level 10', icon: '▲' },
  { id: 'raider-hunter', name: 'RAIDER HUNTER', desc: 'Destroy a raider mini-boss', icon: '⚔' },
  { id: 'shopaholic', name: 'SHOPAHOLIC', desc: 'Buy 3 upgrades in one run', icon: '⬢' },
];

const KEY = 'starfall-achievements';

export function loadAchievements() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAchievements(unlocked) {
  localStorage.setItem(KEY, JSON.stringify(unlocked));
}

export function achievementList() {
  return ACHIEVEMENTS;
}

/**
 * Check the run stats against every locked achievement. Returns the newly
 * unlocked ones (already saved), so the caller can toast them.
 */
export function checkAchievements(unlocked, stats) {
  const gained = [];
  const has = (id) => unlocked.includes(id);
  const grant = (id) => {
    if (!has(id)) {
      unlocked.push(id);
      gained.push(ACHIEVEMENTS.find((a) => a.id === id));
    }
  };
  if (stats.kills >= 1) grant('first-blood');
  if (stats.starsCollected >= 25) grant('star-starter');
  if (stats.maxCombo >= 8) grant('combo-8');
  if (stats.kills >= 25) grant('sharpshooter');
  if (stats.bossesDown >= 1) grant('boss-slayer');
  if (stats.cleanLevel) grant('untouchable');
  if (stats.shardsEarned >= 300) grant('rich');
  if (stats.level >= 10) grant('survivor');
  if (stats.minibossesDown >= 1) grant('raider-hunter');
  if (stats.upgradesBought >= 3) grant('shopaholic');
  if (gained.length > 0) saveAchievements(unlocked);
  return gained;
}
