// STARFALL — the pilot lifetime stats, saved on this device.
const KEY = 'starfall-profile';
export function loadProfile() {
  const fresh = {
    runs: 0, kills: 0, stars: 0, bestCombo: 0, bosses: 0, minibosses: 0,
    timeMs: 0, shots: 0, hits: 0, wins: 0, rushWins: 0,
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return fresh;
    for (const k of Object.keys(fresh)) {
      if (typeof parsed[k] === 'number' && Number.isFinite(parsed[k])) fresh[k] = parsed[k];
    }
    return fresh;
  } catch {
    return fresh;
  }
}
export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}
export function recordRun(profile, run) {
  profile.runs += 1;
  profile.kills += run.kills;
  profile.stars += run.starsCollected;
  profile.bestCombo = Math.max(profile.bestCombo, run.maxCombo);
  profile.bosses += run.bossesDown;
  profile.minibosses += run.minibossesDown;
  profile.timeMs += run.timeMs;
  profile.shots += run.shotsFired;
  profile.hits += run.shotsHit;
  if (run.won) profile.wins += 1;
  if (run.rushWon) profile.rushWins += 1;
  saveProfile(profile);
  return profile;
}
export function accuracyPct(profile) {
  if (profile.shots <= 0) return 0;
  return Math.round((profile.hits / profile.shots) * 100);
}
export function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
