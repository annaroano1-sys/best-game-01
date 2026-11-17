// STARFALL — level objectives and mission star ratings.
import { BOSS, BOSS_STYLES, LEVELS } from './config.js';
const MISSION_ROTATION = ['collect', 'hunt', 'collect', 'survive', 'hunt'];
export function missionFor(level) {
  if (level % LEVELS.bossEvery === 0) {
    const style = BOSS_STYLES[Math.min(BOSS_STYLES.length - 1, Math.floor((level - 1) / LEVELS.bossEvery))];
    return { type: 'boss', label: `Sink the ${style.name.toLowerCase()}`, target: 1, reward: 60 };
  }
  if (level % LEVELS.minibossEvery === 0) {
    return { type: 'hunt', label: 'Destroy 10 enemies', target: 10, reward: 35 };
  }
  const kind = MISSION_ROTATION[(level - 1) % MISSION_ROTATION.length];
  if (kind === 'collect') {
    return { type: 'collect', label: `Collect ${LEVELS.starsPerLevel} stars`, target: LEVELS.starsPerLevel, reward: 30 };
  }
  if (kind === 'survive') {
    return { type: 'survive', label: 'Survive 45 seconds', target: 45, reward: 30 };
  }
  return { type: 'hunt', label: 'Destroy 8 enemies', target: 8, reward: 30 };
}
export function missionProgress(mission, run, stats) {
  if (mission.type === 'collect') return run.starsThisLevel;
  if (mission.type === 'hunt') return run.killsThisLevel;
  if (mission.type === 'survive') return Math.floor(stats.levelTimeSec);
  if (mission.type === 'boss') return stats.bossDownThisLevel ? 1 : 0;
  return 0;
}
export function missionDone(mission, run, stats) {
  return missionProgress(mission, run, stats) >= mission.target;
}
export function missionStars(mission, hitsTaken) {
  if (mission.type === 'boss') return hitsTaken === 0 ? 3 : 2;
  if (hitsTaken === 0) return 3;
  if (hitsTaken === 1) return 2;
  return 1;
}
export function bossReward() {
  return BOSS.score;
}
