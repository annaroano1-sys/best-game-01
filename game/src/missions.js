// Missions: every level has one clear objective, a star rating for how
// cleanly it was finished, and a shard reward. The campaign rotates the
// mission types so no two levels in a row ask for the same thing.
//
// Mission: { type, label, target, progress(run) -> number, done(run) -> bool }
// Star rating: 3 stars with no hits taken in the level, 2 with one hit,
// 1 otherwise. Boss kills always pay at least 2.

import { BOSS, LEVELS } from './config.js';

const MISSION_ROTATION = ['collect', 'hunt', 'collect', 'survive', 'hunt'];

/** The mission for a level: boss levels are always boss missions, levels
 * that host a raider are hunt missions, the rest rotate. */
export function missionFor(level) {
  if (level % LEVELS.bossEvery === 0) {
    return { type: 'boss', label: 'Sink the mothership', target: 1, reward: 60 };
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

/** How far along the mission is (0..target), from the live run state. */
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

/** Stars for finishing a level: hits taken decide, boss kills pay at least 2. */
export function missionStars(mission, hitsTaken) {
  if (mission.type === 'boss') return hitsTaken === 0 ? 3 : 2;
  if (hitsTaken === 0) return 3;
  if (hitsTaken === 1) return 2;
  return 1;
}

export function bossReward() {
  return BOSS.score;
}
