[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# STARFALL — a neon space arcade

Catch the falling stars. Blast the rocks. Beat the mothership.

STARFALL is a complete 2D arcade game for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). You fly a small neon ship through a meteor shower: collect golden stars to score and build a combo, shoot the rocks apart, dodge mines and hunter drones, and every fifth level a mothership guards the sky — sink it for a big bonus. Power-ups rain down: shields, slow-mo, extra lives, a star magnet, and double score.

## How to play

- **Move** — Arrow keys / WASD, or steer with the mouse
- **Shoot** — Hold Space or click the mouse; big rocks take two hits, splitters break into fast shards
- **Collect** — Stars score 10 points each, times your combo multiplier; collect again quickly to keep the chain alive; rare golden comets pay 50
- **Survive** — Rocks, speeders, splitters, proximity mines and homing drones. You have 3 lives. A shield absorbs one hit; grazing a rock pays a near-miss bonus
- **Level up** — Every 12 stars, the next level: faster rocks, more of them, new enemy types
- **Boss** — Every 5th level a mothership appears with a health bar. It drops drones and rocks; sink it for +500 and a power-up drop
- **Pause** — P or Esc · **Mute** — M
- **Restart** — R, or the button on the game-over screen

Everything — the ship, the rocks, the stars, the explosions, the sounds, the music — is drawn and synthesized in code. No image or audio files, no network requests. The game runs entirely from static files: open `game/index.html` in a desktop browser and play.

## Run it

```sh
# serve the game folder, then open http://localhost:8080
python3 -m http.server 8080 --directory game
```

For testing, `game/index.html?level=5` starts a run at level 5 (a boss level).

## Files

- `game/index.html` — the page, HUD, boss bar, banner and screens
- `game/style.css` — neon interface styling
- `game/src/main.js` — game loop, states, collisions, scoring, bosses
- `game/src/ship.js` — the player ship, flame trail and banking
- `game/src/asteroids.js` — the tumbling rocks (shootable, with hit points)
- `game/src/enemies.js` — speeders, splitters, mines and drones
- `game/src/boss.js` — the mothership that guards every 5th level
- `game/src/bullets.js` — the ship's shots
- `game/src/stars.js` — collectible stars, comets and power-ups
- `game/src/particles.js` — parallax starfield, explosions, score pop-ups
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/music.js` — the background synth loop
- `game/src/input.js` — keyboard, mouse and fire input
- `game/src/hud.js` — HUD, boss bar, banner and top-pilot lists
- `game/src/config.js` — all difficulty tuning in one place
- `main.ts` — hands the game and screenshots in to make.fun

## Referral

Play more make.fun bounties with my referral code: **fjta9fmj** — https://make.fun/r/fjta9fmj
