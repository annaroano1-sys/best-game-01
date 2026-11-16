[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# STARFALL — a neon space arcade

Catch the falling stars. Blast the rocks. Beat the mothership. Clear all 15 missions, build your ship, and collect every skin.

STARFALL is a complete 2D arcade game for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). You fly a small neon ship through a meteor shower: collect golden stars to score and build a combo, shoot the rocks apart, dodge mines and hunter drones, and every fifth level a mothership guards the sky — sink it for a big bonus. Between levels you spend your star shards in the upgrade shop; between runs you unlock new ship skins and chase achievements.

## How to play

- **Move** — Arrow keys / WASD, or steer with the mouse
- **Shoot** — Hold Space or click the mouse; big rocks take two hits, splitters break into fast shards, colossi take six
- **Collect** — Stars score 10 points each, times your combo multiplier; collect again quickly to keep the chain alive; rare golden comets pay 50
- **Missions** — Every level has one goal: collect stars, destroy enemies, survive 45 seconds, or sink the boss. Finish it to earn 1–3 mission stars and a shard reward, then visit the shop
- **Upgrade shop** — Spend shards on rapid fire, heavy rounds, spread cannon, reinforced hull, aegis shield, and magnet core — each with 3 ranks
- **Survive** — Rocks, speeders, splitters, proximity mines (keep your distance — they explode), drones, gunners that shoot back, swarms, and colossi. A raider gunship guards every 3rd level; a mothership guards every 5th. Random events — meteor showers, star rain, supply drops, solar flares — shake every run up
- **Power-ups** — S shield · ◷ slow-mo · ♥ extra life · M magnet · ×2 double score · ⁂ spread fire · ✹ screen bomb
- **Sectors** — The campaign crosses three sectors, each with its own palette, music and enemy mix: Nebula Drift (levels 1–5), Ember Reef (6–10), Void Abyss (11–15)
- **Hangar** — Unlock ship skins with lifetime shards or by beating level 10: Crimson Falcon, Golden Comet, Void Wraith
- **Achievements** — Ten milestones, from First Blood to Boss Slayer, saved across runs
- **Modes** — Campaign (15 missions, win by sinking the level-15 mothership) or Endless Drift (difficulty never stops climbing)
- **Pause** — P or Esc · **Mute** — M · **Restart** — R, or the button on the game-over screen

Everything — the ship, the rocks, the stars, the explosions, the sounds, the music — is drawn and synthesized in code. No image or audio files, no network requests. The game runs entirely from static files: open `game/index.html` in a desktop browser and play.

## Run it

```sh
# serve the game folder, then open http://localhost:8080
python3 -m http.server 8080 --directory game
```

For testing, `game/index.html?level=5` starts a run at level 5 (a boss level).

## Files

- `game/index.html` — the page, HUD, boss bar, banner, shop, hangar and screens
- `game/style.css` — neon interface styling
- `game/src/main.js` — game loop, states, missions, shop, collisions, scoring, bosses
- `game/src/ship.js` — the player ship, skins, flame trail and banking
- `game/src/asteroids.js` — the tumbling rocks (shootable, with hit points)
- `game/src/enemies.js` — speeders, splitters, mines, drones, gunners, swarms, colossi
- `game/src/boss.js` — the mothership that guards every 5th level
- `game/src/miniboss.js` — the raider gunship that guards every 3rd level
- `game/src/missions.js` — level objectives and mission star ratings
- `game/src/shop.js` — the upgrade shop (tracks, costs, derived stats)
- `game/src/skins.js` — ship skins and lifetime-shard unlocks
- `game/src/achievements.js` — ten persistent achievements
- `game/src/events.js` — random mid-run events (meteor shower, star rain, supply drop, solar flare)
- `game/src/sectors.js` — the three campaign sectors and their palettes
- `game/src/settings.js` — music/SFX volume and mute, persisted
- `game/src/bullets.js` — the ship's shots (spread and heavy rounds)
- `game/src/ebullets.js` — enemy bolts, aimed at the ship
- `game/src/stars.js` — collectible stars, comets and power-ups
- `game/src/particles.js` — parallax starfield, explosions, shockwave rings, score pop-ups
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/music.js` — the background synth loop (one set per sector)
- `game/src/input.js` — keyboard, mouse and fire input
- `game/src/hud.js` — HUD, boss bar, banner and top-pilot lists
- `game/src/config.js` — all difficulty tuning in one place
- `main.ts` — hands the game and screenshots in to make.fun

## Referral

Play more make.fun bounties with my referral code: **fjta9fmj** — https://make.fun/r/fjta9fmj
