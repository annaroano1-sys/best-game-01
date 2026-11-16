// The HUD and the screens: the DOM overlay that shows score, shards,
// lives, level, combo, the mission objective and toasts, the boss health
// bar, the big level banner, and every screen — start (with mode select,
// hangar, settings, achievements), shop, mission complete, pause, game
// over with full run stats, and the campaign victory screen.

const $ = (id) => document.getElementById(id);

export function createHud() {
  return {
    score: $('hud-score'),
    shards: $('hud-shards'),
    combo: $('hud-combo'),
    level: $('hud-level'),
    sector: $('hud-sector'),
    mission: $('hud-mission'),
    lives: $('hud-lives'),
    shield: $('hud-shield'),
    mute: $('hud-mute'),
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
    victoryScore: $('victory-score'),
    victoryStars: $('victory-stars'),
    toastTimer: null,
    bannerTimer: null,
  };
}

export function showHud(hud, visible) {
  hud.bar.classList.toggle('hidden', !visible);
}

export function showScreen(hud, name) {
  hud.start.classList.toggle('hidden', name !== 'start');
  hud.over.classList.toggle('hidden', name !== 'over');
  hud.pause.classList.toggle('hidden', name !== 'pause');
  hud.shop.classList.toggle('hidden', name !== 'shop');
  hud.missionDone.classList.toggle('hidden', name !== 'mission');
  hud.victory.classList.toggle('hidden', name !== 'victory');
}

export function updateHud(hud, state, missionText) {
  hud.score.textContent = String(state.score);
  hud.shards.textContent = `◆ ${state.shards}`;
  hud.level.textContent = String(state.level);
  hud.sector.textContent = state.sectorName ?? '';
  hud.mission.textContent = missionText ?? '';
  hud.lives.textContent = '♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 5 - state.lives));
  hud.shield.textContent = state.shield ? 'ON' : '—';
  hud.combo.textContent = state.combo > 1 ? `COMBO ×${state.combo}` : '';
  hud.mute.textContent = state.muted ? 'MUTED (M)' : '';
}

/** A big center toast that fades after a moment ("LEVEL 2!", "SHIELD!"). */
export function showToast(hud, text, ms = 1600) {
  hud.toast.textContent = text;
  hud.toast.classList.add('show');
  clearTimeout(hud.toastTimer);
  hud.toastTimer = setTimeout(() => hud.toast.classList.remove('show'), ms);
}

/** An achievement toast: gold, longer, with the achievement name. */
export function showAchievementToast(hud, achievement, ms = 2600) {
  showToast(hud, `🏆 ${achievement.name} — ${achievement.desc}`, ms);
}

/** The giant center banner for level-ups, events and boss warnings. */
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

/** The boss health bar under the HUD. Pass null to hide it. */
export function showBossBar(hud, boss) {
  if (!boss) {
    hud.bossBar.classList.add('hidden');
    return;
  }
  hud.bossBar.classList.remove('hidden');
  hud.bossName.textContent = `MOTHERSHIP${boss.number > 1 ? ' ' + boss.number : ''}`;
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

/** The mission-complete screen: stars earned and the shard reward. */
export function showMissionComplete(hud, mission, stars, reward) {
  hud.missionLabel.textContent = mission.label;
  hud.missionStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  hud.missionReward.textContent = `+${reward} shards`;
}

/** The campaign victory screen. */
export function showVictory(hud, state, totalStars) {
  hud.victoryScore.textContent = String(state.score);
  hud.victoryStars.textContent = `${totalStars} / 45`;
}
