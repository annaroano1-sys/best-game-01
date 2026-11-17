// STARFALL — the synth loop: one set per sector, plus a boss layer.
import { MUSIC } from './config.js';
let ac = null;
let master = null;
let layerGain = null; 
let timer = null;
let step = 0;
let nextStepTime = 0;
let playing = false;
let sector = 0;
let bossMode = false; 
let volume = 0.7;
let muted = false;
function ensureContext() {
  if (ac === null) {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return null;
    ac = new AudioCtx();
    master = ac.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ac.destination);
    layerGain = ac.createGain();
    layerGain.gain.value = bossMode ? 0.9 : 0;
    layerGain.connect(master);
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}
export function setMusicVolume(v) {
  volume = v;
  if (master) master.gain.value = muted ? 0 : volume;
}
export function setMusicMuted(m) {
  muted = m;
  if (master) master.gain.value = muted ? 0 : volume;
}
export function setMusicSector(i) {
  const next = Math.max(0, Math.min(MUSIC.sets.length - 1, i));
  if (next === sector) return;
  sector = next;
  if (!playing || !master) return;
  const t = ac.currentTime;
  const base = muted ? 0 : volume;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(Math.max(0.0001, base * 0.25), t + 0.4);
  master.gain.linearRampToValueAtTime(base, t + 1.4);
}
export function setBossMode(on) {
  if (on === bossMode) return;
  bossMode = on;
  if (!ac || !layerGain) return;
  const t = ac.currentTime;
  layerGain.gain.cancelScheduledValues(t);
  layerGain.gain.setValueAtTime(layerGain.gain.value, t);
  layerGain.gain.linearRampToValueAtTime(on ? 0.9 : 0.0001, t + 0.9);
}
export function isBossLayerOn() { return bossMode; }
function note(freq, at, dur, type, gain, dest = null) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(dest ?? master);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}
function scheduleStep() {
  const set = MUSIC.sets[sector];
  const stepDur = 60 / MUSIC.bpm / 2;
  while (nextStepTime < ac.currentTime + 0.25) {
    const i = step % 8;
    note(set.bass[i], nextStepTime, stepDur * 1.8, 'sawtooth', MUSIC.bassGain);
    if (i % 2 === 0) {
      note(set.arp[(step * 3) % set.arp.length], nextStepTime, stepDur * 1.4, 'triangle', MUSIC.leadGain);
    }
    if (i === 4) note(set.arp[(step + 2) % set.arp.length] * 2, nextStepTime, stepDur, 'sine', MUSIC.leadGain * 0.7);
    if (bossMode || (layerGain && layerGain.gain.value > 0.01)) {
      note(set.bass[0] / 2, nextStepTime, stepDur * 0.9, 'sine', 0.16, layerGain);
      if (i % 2 === 1) {
        note(set.arp[(step * 5) % set.arp.length] * 2, nextStepTime, stepDur * 0.7, 'square', 0.02, layerGain);
      }
    }
    step += 1;
    nextStepTime += stepDur;
  }
}
export function startMusic() {
  if (playing) return;
  if (!ensureContext()) return;
  playing = true;
  step = 0;
  nextStepTime = ac.currentTime + 0.1;
  timer = setInterval(scheduleStep, 90);
}
export function stopMusic() {
  playing = false;
  if (timer !== null) { clearInterval(timer); timer = null; }
}
export function isMusicPlaying() { return playing; }
