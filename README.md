[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# STARFALL — a neon space arcade

Catch the falling stars. Dodge the rocks. Don't blink.

STARFALL is a complete 2D arcade game for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). You fly a small neon ship through a meteor shower: collect golden stars to score and build a combo, dodge tumbling asteroids, and grab power-ups — a shield that absorbs one hit, or a slow-mo orb that buys you time. Every level you clear, the rocks fall faster and thicker.

## How to play

- **Move** — Arrow keys / WASD, or steer with the mouse
- **Collect** — Stars score 10 points each, times your combo multiplier; collect again quickly to keep the chain alive
- **Survive** — Asteroids cost a life. You have 3. A shield absorbs one hit.
- **Level up** — Every 12 stars, the next level: faster rocks, more of them
- **Pause** — P or Esc
- **Restart** — R, or the button on the game-over screen

Everything — the ship, the rocks, the stars, the explosions, the sounds — is drawn and synthesized in code. No image or audio files, no network requests. The game runs entirely from static files: open `game/index.html` in a desktop browser and play.

## Run it

```sh
# serve the game folder, then open http://localhost:8080
python3 -m http.server 8080 --directory game
```

## Files

- `game/index.html` — the page, HUD and screens
- `game/style.css` — neon interface styling
- `game/src/main.js` — game loop, states, collisions, scoring
- `game/src/ship.js` — the player ship and its flame trail
- `game/src/asteroids.js` — the tumbling rocks
- `game/src/stars.js` — collectible stars and power-ups
- `game/src/particles.js` — explosions, sparkles, starfield sky
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/input.js` — keyboard and mouse input
- `game/src/hud.js` — HUD and screen overlays
- `game/src/config.js` — all difficulty tuning in one place
- `main.ts` — hands the game and screenshots in to make.fun

## Referral

Play more make.fun bounties with my referral code: **fjta9fmj** — https://make.fun/r/fjta9fmj
