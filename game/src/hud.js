// The HUD and the screens: the DOM overlay that shows score, lives,
// level, combo and toasts, and the start / game-over / pause screens.

const $ = (id) => document.getElementById(id);

export function createHud() {
  return {
    score: $('hud-score'),
    combo: $('hud-combo'),
    level: $('hud-level'),
    lives: $('hud-lives'),
    shield: $('hud-shield'),
    toast: $('hud-toast'),
    bar: $('hud'),
    start: $('screen-start'),
    over: $('screen-over'),
    pause: $('screen-pause'),
    finalScore: $('final-score'),
    finalBest: $('final-best'),
    finalNewBest: $('final-newbest'),
    finalStars: $('final-stars'),
    finalLevel: $('final-level'),
    finalCombo: $('final-combo'),
    toastTimer: null,
  };
}

export function showHud(hud, visible) {
  hud.bar.classList.toggle('hidden', !visible);
}

export function showScreen(hud, name) {
  hud.start.classList.toggle('hidden', name !== 'start');
  hud.over.classList.toggle('hidden', name !== 'over');
  hud.pause.classList.toggle('hidden', name !== 'pause');
}

export function updateHud(hud, state) {
  hud.score.textContent = String(state.score);
  hud.level.textContent = String(state.level);
  hud.lives.textContent = '♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives));
  hud.shield.textContent = state.shield ? 'ON' : '—';
  hud.combo.textContent = state.combo > 1 ? `COMBO ×${state.combo}` : '';
}

/** A big center toast that fades after a moment ("LEVEL 2!", "SHIELD!"). */
export function showToast(hud, text, ms = 1600) {
  hud.toast.textContent = text;
  hud.toast.classList.add('show');
  clearTimeout(hud.toastTimer);
  hud.toastTimer = setTimeout(() => hud.toast.classList.remove('show'), ms);
}

export function showGameOver(hud, state, best, isNewBest) {
  hud.finalScore.textContent = String(state.score);
  hud.finalBest.textContent = String(best);
  hud.finalNewBest.classList.toggle('hidden', !isNewBest);
  hud.finalStars.textContent = String(state.starsCollected);
  hud.finalLevel.textContent = String(state.level);
  hud.finalCombo.textContent = String(state.maxCombo);
}
