[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/annaroano1-sys/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# STARFALL — a neon space arcade

Catch the falling stars. Blast the rocks. Beat the mothership. Clear all 15 missions, build your ship, and collect every skin — or take on all three bosses back to back in Boss Rush.

STARFALL is a complete 2D arcade game for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). You fly a small neon ship through a meteor shower: collect golden stars to score and build a combo, shoot the rocks apart, dodge mines and hunter drones, and every fifth level a sector boss guards the sky — each one fights differently. Between levels you spend your star shards in the upgrade shop; between runs you unlock new ship skins, chase achievements, and check your lifetime stats on the Pilot Profile.

## How to play

- **Move** — Arrow keys / WASD, or steer with the mouse
- **Shoot** — Hold Space or click the mouse; big rocks take two hits, splitters break into fast shards, colossi take six
- **Collect** — Stars score 10 points each, times your combo multiplier; collect again quickly to keep the chain alive; rare golden comets pay 50
- **Missions** — Every level has one goal: collect stars, destroy enemies, survive 45 seconds, or sink the boss. Finish it to earn 1–3 mission stars and a shard reward, then visit the shop
- **Upgrade shop** — Spend shards on rapid fire, heavy rounds, spread cannon, reinforced hull, aegis shield, and magnet core — each with 3 ranks
- **Survive** — Rocks, speeders, splitters, proximity mines (keep your distance — they explode), drones, gunners that shoot back, swarms, colossi, dashers that flash and charge at you, snipers that draw an aim line before firing a fast bolt, weavers that sine-weave across the sky, and carriers — slow freighters that drop a power-up when cracked open. A raider gunship guards every 3rd level; a sector boss guards every 5th — the Mothership drops drones, the Ember Hive breathes five-way fire, the Void Wraith blinks across the sky and fires aimed bursts. Random events — meteor showers, star rain, supply drops, solar flares, shard surges — shake every run up
- **Power-ups** — S shield · ◷ slow-mo · ♥ extra life · M magnet · ×2 double score · ⁂ spread fire · ✹ screen bomb · R overdrive (double fire rate and damage) · G ghost (fly through anything) · ⇶ piercing shots (bullets fly through enemies)
- **Bombs** — 3 per run, **B** key or the big 💣 button (bottom right); clears the screen, bosses take heavy damage, +1 per finished mission (max 5)
- **Boss Rush** — A third mode: fight the Mothership, the Ember Hive and the Void Wraith back to back, with a shop breather between bosses. Sink all three to win, and set a Rush best score of your own
- **Sectors and arenas** — The campaign crosses three sectors, each with its own palette, music and enemy mix: Nebula Drift (levels 1–5), Ember Reef (6–10), Void Abyss (11–15). On top of that, every one of the 15 levels has its own arena — its own sky, landmark and weather: a calm expanse, twin suns, a dense asteroid belt, a thick nebula bloom, a ringed giant, a molten rock field, a crimson giant sun, a solar flare zone with a meteor shower, a hive nest, a near-empty dark-matter drift, frozen wastes under an aurora, a black hole bending the starlight, a void storm, and the wraith's throne. Shooting stars cross the sky on each arena's own rhythm, and drifting debris fills the dense-field levels. Boss Rush reuses the three guardian arenas
- **Hangar** — Unlock ship skins with lifetime shards or by clearing the campaign: Crimson Falcon, Golden Comet, Void Wraith, Solar Phoenix, Nebula Ghost
- **Achievements** — Fifteen milestones, from First Blood to Rush Champion, saved across runs
- **Pilot Profile** — Lifetime stats from every run: kills, stars, best combo, bosses down, time played, accuracy, campaign and rush wins
- **Modes** — Campaign (15 missions, win by sinking the level-15 boss), Endless Drift (difficulty never stops climbing), or Boss Rush (three guardians, no filler)
- **Feel** — Glassmorphism menus and HUD with a segmented lives bar, a draining combo meter, a mission progress bar, live power-up chips, screen shake, hit-stop on boss damage, floating damage numbers, an engine trail, and glowing explosions. Guardian fights keep the focus on the boss: fewer adds spawn while one is up, and a rush breather patches the ship up to full
- **The fighter (round 6)** — The ship is now a modern space fighter drawn in code: a sleek swept-wing interceptor with twin engine flames that stretch as you fly faster, a glass canopy, panel lines, a metallic spine highlight and blinking wingtip lights. Each of the six skins is a different airframe — narrow dart, forked falcon wings, a big delta wing, raked wraith wings, notched phoenix wings, long glider wings — with its own trim and canopy glass. Your shots are fast glowing energy bolts with a white-hot core and a comet tail (+20% faster); enemy fire is hot red plasma orbs with a bright heart, and sniper shots are crimson darts. The bullet storm is denser now — gunners fire two-bolt fans from level 8, snipers charge faster, weavers take one aimed shot per pass, and the guardians' spreads fly faster — but every pattern leaves a dodge lane
- **Bombs (round 6.2)** — Every run starts with **3 bombs**: press **B** or tap the big 💣 button (bottom right) to clear the sky — every enemy on screen takes a huge hit, all enemy bullets vanish, and guardians take heavy damage (8 HP off a 26 HP boss, so never an instant kill). Finishing a mission earns **+1 bomb**, up to 5. The HUD shows your bomb stock next to the shards, and the button greys out when you're empty. The ship still auto-fires, so on a phone you only steer — and the button is a DOM element above the canvas, so tapping it never moves the ship
- **Sound** — A synth loop per sector, plus a boss layer: a low pulse and a faster arpeggio swell in while a guardian (or a raider) is up and fade out when the fight ends. New effects this round: a boss intro sting, combo milestone chimes at ×10/×20/×30, a low-health warning at one life left, and a clearing fanfare for each rush guardian
- **Tutorial** — The How to Play panel walks through flying, collecting, missions, the shop and the guardians step by step; level 1 adds on-screen hints as you play, and the new faces introduce themselves when you first meet them: weavers, carriers, piercing shots, shard surges, and the Boss Rush itself
- **Pause** — P or Esc · **Mute** — M · **Restart** — R, or the button on the game-over screen

Everything — the ship, the rocks, the stars, the explosions, the sounds, the music — is drawn and synthesized in code. No image or audio files, no network requests. The game runs entirely from static files: open `game/index.html` in a desktop browser and play.

## Run it

```sh
# serve the game folder, then open http://localhost:8080
python3 -m http.server 8080 --directory game
```

For testing, `game/index.html?level=5` starts a run at level 5 (a boss level). `?gear=full` starts it with a maxed loadout, the kit a real player has earned by the late levels. `?event=shard-surge` forces the first random event, and `?powerup=pierce` forces the first power-up orb.

## Files

- `game/index.html` — the page, HUD, boss bar, banner, shop, hangar and screens
- `game/style.css` — neon interface styling
- `game/src/main.js` — game loop, states, missions, shop, collisions, scoring, bosses, Boss Rush
- `game/src/ship.js` — the player ship, skins, flame trail and banking
- `game/src/asteroids.js` — the tumbling rocks (shootable, with hit points)
- `game/src/enemies.js` — speeders, splitters, mines, drones, gunners, swarms, colossi, dashers, snipers, weavers, carriers
- `game/src/boss.js` — one guardian per sector: Mothership, Ember Hive, Void Wraith
- `game/src/miniboss.js` — the raider gunship that guards every 3rd level
- `game/src/missions.js` — level objectives and mission star ratings
- `game/src/shop.js` — the upgrade shop (tracks, costs, derived stats)
- `game/src/skins.js` — ship skins and lifetime-shard unlocks
- `game/src/achievements.js` — fifteen persistent achievements
- `game/src/profile.js` — the pilot's lifetime stats (kills, combo, accuracy, wins)
- `game/src/events.js` — random mid-run events (meteor shower, star rain, supply drop, solar flare, shard surge)
- `game/src/sectors.js` — the three campaign sectors, and the fifteen per-level arenas (skies, landmarks, star density, weather)
- `game/src/settings.js` — music/SFX volume and mute, persisted
- `game/src/bullets.js` — the ship's shots (spread, heavy rounds, piercing)
- `game/src/ebullets.js` — enemy bolts, aimed at the ship
- `game/src/stars.js` — collectible stars, comets and power-ups (including overdrive, ghost and piercing shots)
- `game/src/particles.js` — parallax starfield, per-level arenas (ringed giants, suns, cratered moons, a black hole, auroras, drifting debris, nebula fog), shooting stars, space dust, explosions, shockwave rings, score pop-ups, screen flash, engine trail
- `game/src/audio.js` — synthesized WebAudio sound effects (boss intro, combo chimes, low-health warning, rush fanfare)
- `game/src/music.js` — the background synth loop (one set per sector, plus a boss layer that swells in during guardian fights)
- `game/src/input.js` — keyboard, mouse and fire input
- `game/src/hud.js` — glass HUD, boss bar, banner, pause and victory stats, top-pilot lists
- `game/src/config.js` — all difficulty tuning in one place
- `main.ts` — hands the game and screenshots in to make.fun

## Referral

Play more make.fun bounties with my referral code: **fjta9fmj** — https://make.fun/r/fjta9fmj
