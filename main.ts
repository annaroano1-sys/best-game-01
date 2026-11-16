// STARFALL — the hand-in program (Node 22, standard library only).
//
// It lays this repository out in /output: the game in game/, the screenshots
// in screenshots/, and dossier.json, the summary the judge reads, built by
// the vendored make.fun library. Grading runs it twice and both runs must
// write the same bytes, so every step below is deterministic: files are
// copied in sorted order and nothing depends on the clock or the network.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program would rather fail loudly than hand in a broken layout: it
// checks the whole tree before copying anything — the game folder, the
// entry point, every screenshot's size and dimensions, the file and byte
// caps the scorer enforces — and names the offending path in the error.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps (from the kit's gate): text_max_bytes is the only
// one that changes dossier bytes; the rest make this program fail exactly
// where the scorer would refuse the entry instead.
const LIMITS = {
  dossierTextMaxBytes: 163840,
  screenshotsMax: 4,
  screenshotsMin: 3,
  screenshotMaxBytes: 262144,
  screenshotLongSideMax: 1280,
  screenshotShortSideMin: 480,
  gameMaxFiles: 993,
  gameMaxBytes: 50331648,
  gamePathMaxBytes: 1000,
  outputMaxFiles: 1000,
  outputMaxBytes: 67108864,
};

function fail(message: string): never {
  throw new Error(`STARFALL hand-in failed: ${message}`);
}

function mustExistDir(path: string, what: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) fail(`missing ${what} directory: ${path}`);
}

function mustExistFile(path: string, what: string): void {
  if (!existsSync(path) || !statSync(path).isFile()) fail(`missing ${what}: ${path}`);
}

/** Walk a tree and return every file, in a stable sorted order. */
function listFiles(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, rel));
    else if (entry.isFile()) found.push(rel);
  }
  return found;
}

function totalBytes(dir: string, files: string[]): number {
  let total = 0;
  for (const rel of files) total += statSync(join(dir, rel)).size;
  return total;
}

/** Read a PNG or JPEG's dimensions from its header (no decoder needed). */
function imageSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) break;
      const marker = buf[off + 1];
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(off + 7), height: buf.readUInt16BE(off + 5) };
      }
      off += 2 + len;
    }
  }
  fail(`unrecognized image format: ${path}`);
}

function checkScreenshots(dir: string, files: string[]): void {
  if (files.length < LIMITS.screenshotsMin || files.length > LIMITS.screenshotsMax) {
    fail(`expected ${LIMITS.screenshotsMin} to ${LIMITS.screenshotsMax} screenshots, found ${files.length} in ${dir}`);
  }
  for (const rel of files) {
    const full = join(dir, rel);
    const size = statSync(full).size;
    if (size > LIMITS.screenshotMaxBytes) fail(`screenshot over ${LIMITS.screenshotMaxBytes} bytes: ${full} (${size})`);
    const { width, height } = imageSize(full);
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);
    if (longSide > LIMITS.screenshotLongSideMax) fail(`screenshot long side over ${LIMITS.screenshotLongSideMax}px: ${full} (${width}x${height})`);
    if (shortSide < LIMITS.screenshotShortSideMin) fail(`screenshot short side under ${LIMITS.screenshotShortSideMin}px: ${full} (${width}x${height})`);
  }
}

function copyTreeSorted(from: string, to: string, files: string[]): void {
  mkdirSync(to, { recursive: true });
  for (const rel of files) {
    const dest = join(to, rel);
    mkdirSync(join(dest, '..'), { recursive: true });
    cpSync(join(from, rel), dest);
  }
}

function main(): void {
  const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');

  mustExistDir(gameDir, 'game');
  mustExistFile(join(gameDir, 'index.html'), 'game entry point');
  mustExistDir(shotsDir, 'screenshots');

  const gameFiles = listFiles(gameDir);
  if (gameFiles.length === 0) fail(`no files under ${gameDir}`);
  if (gameFiles.length > LIMITS.gameMaxFiles) fail(`${gameFiles.length} files under game/ exceeds ${LIMITS.gameMaxFiles}`);
  const gameBytes = totalBytes(gameDir, gameFiles);
  if (gameBytes > LIMITS.gameMaxBytes) fail(`game/ is ${gameBytes} bytes, over ${LIMITS.gameMaxBytes}`);
  for (const rel of gameFiles) {
    if (Buffer.byteLength(join('game', rel), 'utf8') > LIMITS.gamePathMaxBytes) {
      fail(`game path too long: ${rel}`);
    }
  }

  const shotFiles = listFiles(shotsDir);
  checkScreenshots(shotsDir, shotFiles);

  copyTreeSorted(gameDir, join(outDir, 'game'), gameFiles);
  copyTreeSorted(shotsDir, join(outDir, 'screenshots'), shotFiles);

  const dossier = buildDossier(outDir, {
    text_max_bytes: LIMITS.dossierTextMaxBytes,
    screenshots: { max: LIMITS.screenshotsMax, max_bytes: LIMITS.screenshotMaxBytes },
    game_max_files: LIMITS.gameMaxFiles,
    game_max_bytes: LIMITS.gameMaxBytes,
    game_path_max_bytes: LIMITS.gamePathMaxBytes,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  const outFiles = listFiles(outDir);
  if (outFiles.length > LIMITS.outputMaxFiles) fail(`/output has ${outFiles.length} files, over ${LIMITS.outputMaxFiles}`);
  if (totalBytes(outDir, outFiles) > LIMITS.outputMaxBytes) fail('/output exceeds 64 MiB');
}

main();
