// STARFALL — the hand-in program (Node 22, standard library only).
//
// It takes this repository (the game in game/, the screenshots in
// screenshots/) and lays it out in /output: the game, the screenshots and
// dossier.json, the summary the judge reads, built by the vendored make.fun
// library. It runs twice in grading and both runs must write the same bytes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program refuses to hand in a broken layout instead of guessing:
// every input it needs is checked before anything is copied, and a missing
// game folder, a missing index.html, or a dossier the library rejects all
// fail loudly with the path in the message.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The caps are the scorer's own (reference/gate.json): text_max_bytes is the
// only one that shapes the bytes; the others make this program fail exactly
// where the scorer would refuse the entry (too many or too large screenshots,
// too many files or bytes under game/, a game path over 1000 bytes).
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message: string): never {
  throw new Error(`STARFALL hand-in failed: ${message}`);
}

function requireDir(path: string, what: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) fail(`missing ${what} directory: ${path}`);
}

function requireFile(path: string, what: string): void {
  if (!existsSync(path) || !statSync(path).isFile()) fail(`missing ${what}: ${path}`);
}

function countFiles(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    count += entry.isDirectory() ? countFiles(full) : 1;
  }
  return count;
}

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function main(): void {
  const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');

  requireDir(gameDir, 'game');
  requireFile(join(gameDir, 'index.html'), 'game entry point');
  requireDir(shotsDir, 'screenshots');

  const shotFiles = readdirSync(shotsDir).filter((name) => statSync(join(shotsDir, name)).isFile());
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${shotFiles.length} in ${shotsDir}`);
  }
  const gameFiles = countFiles(gameDir);
  if (gameFiles === 0) fail(`no files under ${gameDir}`);

  copyTree(gameDir, join(outDir, 'game'));
  copyTree(shotsDir, join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, DOSSIER_LIMITS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
