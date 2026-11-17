// STARFALL — the glass HUD, boss bar, banners and screens.
import { GAME, STAR } from './config.js';
import { extraLives, shieldHits } from './shop.js';
const $ = (id) => document.getElementById(id);
const FX_DEFS = [
  { key: 'slowmoUntil', label: 'SLOW-MO', color: '#c77dff' },
  { key: 'magnetUntil', label: 'MAGNET', color: '#ffb703' },
  { key: 'doubleUntil', label: 'DOUBLE ×2', color: '#39c6ff' },
  { key: 'spreadUntil', label: 'SPREAD', color: '#ff9f43' },
  { key: 'overdriveUntil', label: 'OVERDRIVE', color: '#ff2e88' },
  { key: 'ghostUntil', label: 'GHOST', color: '#b388ff' },
  { key: 'pierceUntil', label: 'PIERCE', color: '#9bf00b' },
];
export function createHud() {
  return {
    score: $('hud-score'),
    shards: $('hud-shards'),
    bombs: $('hud-bombs'),
    bombBtn: $('btn-bomb'),
    bombCount: $('btn-bomb-count'),
    combo: $('hud-combo'),
    comboFill: $('hud-combo-fill'),
    level: $('hud-level'),
    sector: $('hud-sector'),
    mission: $('hud-mission'),
    missionFill: $('hud-mission-fill'),
    lives: $('hud-lives'),
    shield: $('hud-shield'),
    mute: $('hud-mute'),
    fx: $('hud-fx'),
    toast: $('hud-toast'),
    banner: $('banner'),
    bossBar: $('boss-bar'),
    bossFill: $('boss-fill'),
    bossName: $('boss-name'),
    bar: $('hud'),
    start: $('screen-start'),
    over: $('screen-over'),
    pause: $('screen-pause'),
    shop: $('screen-shop'),
    missionDone: $('screen-mission'),
    victory: $('screen-victory'),
    finalScore: $('final-score'),
    finalBest: $('final-best'),
    finalNewBest: $('final-newbest'),
    finalStars: $('final-stars'),
    finalLevel: $('final-level'),
    finalCombo: $('final-combo'),
    finalKills: $('final-kills'),
    finalBosses: $('final-bosses'),
    finalUpgrades: $('final-upgrades'),
    finalShards: $('final-shards'),
    finalTop: $('final-top'),
    startTop: $('start-top'),
    shopCards: $('shop-cards'),
    shopShards: $('shop-shards'),
    missionStars: $('mission-stars'),
    missionReward: $('mission-reward'),
    missionLabel: $('mission-label'),
    victoryTitle: $('victory-title'),
    victoryTagline: $('victory-tagline'),
    victoryScore: $('victory-score'),
    victoryStarsLabel: $('victory-stars-label'),
    victoryStars: $('victory-stars'),
    victoryKills: $('victory-kills'),
    victoryCombo: $('victory-combo'),
    victoryBosses: $('victory-bosses'),
    pauseScore: $('pause-score'),
    pauseLevel: $('pause-level'),
    pauseMission: $('pause-mission'),
    toastTimer: null,
    bannerTimer: null,
    _shards: 0,
    _bombs: -1,
    _lives: -1,
    _livesMax: -1,
    _shield: -1,
    _shieldMax: -1,
    _fxKey: '',
  };
}
export function showHud(hud, visible) {
  hud.bar.classList.toggle('hidden', !visible);
  hud.bombBtn.classList.toggle('hidden', !visible);
}
export function showScreen(hud, name) {
  hud.start.classList.toggle('hidden', name !== 'start');
  hud.over.classList.toggle('hidden', name !== 'over');
  hud.pause.classList.toggle('hidden', name !== 'pause');
  hud.shop.classList.toggle('hidden', name !== 'shop');
  hud.missionDone.classList.toggle('hidden', name !== 'mission');
  hud.victory.classList.toggle('hidden', name !== 'victory');
}
function renderPips(container, filled, total, filledClass) {
  container.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const pip = document.createElement('span');
    pip.className = `pip ${i < filled ? filledClass : 'empty'}`;
    container.appendChild(pip);
  }
}
export function updateHud(hud, state, missionText, now = performance.now(), missionFrac = 0) {
  hud.score.textContent = String(state.score);
  if (state.shards > hud._shards) {
    hud.shards.classList.remove('pop');
    void hud.shards.offsetWidth;
    hud.shards.classList.add('pop');
  }
  hud._shards = state.shards;
  hud.shards.textContent = `◆ ${state.shards}`;
  if ((state.bombs ?? 0) !== hud._bombs) {
    hud._bombs = state.bombs ?? 0;
    hud.bombs.textContent = `💣×${hud._bombs}`;
    hud.bombs.classList.toggle('empty', hud._bombs <= 0);
    hud.bombCount.textContent = String(hud._bombs);
    hud.bombBtn.classList.toggle('empty', hud._bombs <= 0);
  }
  hud.level.textContent = String(state.level);
  hud.sector.textContent = state.sectorName ?? '';
  hud.mission.textContent = missionText ?? '';
  hud.missionFill.style.width = `${Math.max(0, Math.min(1, missionFrac)) * 100}%`;
  const maxLives = GAME.maxLives + (state.upgrades ? extraLives(state.upgrades) : 0);
  if (state.lives !== hud._lives || maxLives !== hud._livesMax) {
    hud._lives = state.lives;
    hud._livesMax = maxLives;
    renderPips(hud.lives, Math.max(0, state.lives), Math.max(1, maxLives), 'life');
  }
  const shieldMax = state.upgrades ? shieldHits(state.upgrades) : 1;
  const shieldNow = state.shield ? (state.shieldHits ?? 0) : 0;
  if (shieldNow !== hud._shield || shieldMax !== hud._shieldMax) {
    hud._shield = shieldNow;
    hud._shieldMax = shieldMax;
    if (!state.shield) {
      hud.shield.innerHTML = '<span class="shield-none">—</span>';
    } else {
      renderPips(hud.shield, shieldNow, shieldMax, 'shield');
    }
  }
  hud.combo.textContent = state.combo > 1 ? `COMBO ×${state.combo}` : '';
  const comboFrac = state.combo > 1 && state.lastCollectAt > 0
    ? Math.max(0, (state.lastCollectAt + STAR.comboWindowMs - now) / STAR.comboWindowMs)
    : 0;
  hud.comboFill.style.width = `${comboFrac * 100}%`;
  const chips = [];
  for (const def of FX_DEFS) {
    const until = state[def.key] ?? 0;
    if (until > now) chips.push(`${def.label}|${Math.ceil((until - now) / 1000)}|${def.color}`);
  }
  const fxKey = chips.join(';');
  if (fxKey !== hud._fxKey) {
    hud._fxKey = fxKey;
    hud.fx.innerHTML = '';
    for (const chip of chips) {
      const [label, secs, color] = chip.split('|');
      const el = document.createElement('span');
      el.className = 'fx-chip';
      el.style.setProperty('--fx-color', color);
      el.textContent = `${label} ${secs}s`;
      hud.fx.appendChild(el);
    }
  }
  hud.mute.textContent = state.muted ? 'MUTED (M)' : '';
}
export function showToast(hud, text, ms = 1600) {
  hud.toast.textContent = text;
  hud.toast.classList.add('show');
  clearTimeout(hud.toastTimer);
  hud.toastTimer = setTimeout(() => hud.toast.classList.remove('show'), ms);
}
export function showAchievementToast(hud, achievement, ms = 2600) {
  showToast(hud, `🏆 ${achievement.name} — ${achievement.desc}`, ms);
}
export function showBanner(hud, text, sub = '', ms = 1900) {
  hud.banner.innerHTML = '';
  const main = document.createElement('div');
  main.className = 'banner-main';
  main.textContent = text;
  hud.banner.appendChild(main);
  if (sub) {
    const s = document.createElement('div');
    s.className = 'banner-sub';
    s.textContent = sub;
    hud.banner.appendChild(s);
  }
  hud.banner.classList.add('show');
  clearTimeout(hud.bannerTimer);
  hud.bannerTimer = setTimeout(() => hud.banner.classList.remove('show'), ms);
}
export function clearOverlays(hud) {
  hud.banner.classList.remove('show');
  hud.toast.classList.remove('show');
  clearTimeout(hud.bannerTimer);
  clearTimeout(hud.toastTimer);
}
export function showBossBar(hud, boss) {
  if (!boss) {
    hud.bossBar.classList.add('hidden');
    return;
  }
  hud.bossBar.classList.remove('hidden');
  hud.bossName.textContent = `${boss.name}${boss.number > 1 ? ' ' + boss.number : ''}`;
  hud.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
}
function renderTopList(element, scores) {
  element.innerHTML = '';
  if (scores.length === 0) {
    const li = document.createElement('li');
    li.className = 'top-empty';
    li.textContent = 'No flights logged yet — be the first.';
    element.appendChild(li);
    return;
  }
  scores.forEach((entry, i) => {
    const li = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'top-rank';
    rank.textContent = `#${i + 1}`;
    const score = document.createElement('span');
    score.className = 'top-score';
    score.textContent = String(entry.score);
    const meta = document.createElement('span');
    meta.className = 'top-meta';
    meta.textContent = `level ${entry.level} · ${entry.stars} stars`;
    li.append(rank, score, meta);
    element.appendChild(li);
  });
}
export function showGameOver(hud, state, best, isNewBest, topScores, stats) {
  hud.finalScore.textContent = String(state.score);
  hud.finalBest.textContent = String(best);
  hud.finalNewBest.classList.toggle('hidden', !isNewBest);
  hud.finalStars.textContent = String(state.starsCollected);
  hud.finalLevel.textContent = String(state.level);
  hud.finalCombo.textContent = String(state.maxCombo);
  hud.finalKills.textContent = String(stats.kills);
  hud.finalBosses.textContent = String(stats.bossesDown + stats.minibossesDown);
  hud.finalUpgrades.textContent = String(stats.upgradesBought);
  hud.finalShards.textContent = String(stats.shardsEarned);
  renderTopList(hud.finalTop, topScores);
}
export function showStartTop(hud, topScores) {
  renderTopList(hud.startTop, topScores);
}
export function showMissionComplete(hud, mission, stars, reward, bombs = 0) {
  hud.missionLabel.textContent = mission.label;
  hud.missionStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  hud.missionReward.textContent = `+${reward} shards` + (bombs > 0 ? ` · +${bombs} 💣` : '');
}
export function showPauseStats(hud, state, missionText) {
  hud.pauseScore.textContent = String(state.score);
  hud.pauseLevel.textContent = String(state.level);
  hud.pauseMission.textContent = missionText ?? '';
}
export function showVictory(hud, state, totalStars, mode = 'campaign') {
  const rush = mode === 'rush';
  hud.victoryTitle.textContent = rush ? 'BOSS RUSH COMPLETE!' : 'CAMPAIGN COMPLETE!';
  hud.victoryTagline.textContent = rush
    ? 'Three guardians, three graves. The galaxy is yours, pilot.'
    : 'You sank every mothership and cleared all 15 levels. The galaxy is yours, pilot.';
  hud.victoryScore.textContent = String(state.score);
  hud.victoryStarsLabel.textContent = rush ? 'RUSH BOSSES' : 'MISSION STARS';
  hud.victoryStars.textContent = rush ? '3 / 3' : `${totalStars} / 45`;
  hud.victoryKills.textContent = String(state.kills);
  hud.victoryCombo.textContent = `×${state.maxCombo}`;
  hud.victoryBosses.textContent = String(state.bossesDown + state.minibossesDown);
}
