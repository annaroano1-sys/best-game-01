// STARFALL — fifteen persistent achievements, saved across runs.
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
  { id: 'combo-15', name: 'COMBO MASTER', desc: 'Reach a ×15 combo', icon: '×15' },
  { id: 'rush-champ', name: 'RUSH CHAMPION', desc: 'Sink all 3 bosses in one Boss Rush', icon: '⚔' },
  { id: 'carrier-crack', name: 'CARGO BUSTER', desc: 'Destroy a carrier freighter', icon: '⬡' },
  { id: 'pierce-pro', name: 'PIERCE ACE', desc: 'Grab a piercing-shot power-up', icon: '⇶' },
  { id: 'deep-drifter', name: 'DEEP DRIFTER', desc: 'Reach level 15 in Endless Drift', icon: '∞' },
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
  if (stats.maxCombo >= 15) grant('combo-15');
  if (stats.rushBossesDown >= 3) grant('rush-champ');
  if (stats.carriersDown >= 1) grant('carrier-crack');
  if (stats.pierceCollected >= 1) grant('pierce-pro');
  if (stats.mode === 'endless' && stats.level >= 15) grant('deep-drifter');
  if (gained.length > 0) saveAchievements(unlocked);
  return gained;
}
