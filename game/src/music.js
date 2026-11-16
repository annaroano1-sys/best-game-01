// STARFALL music: a quiet synth loop, synthesized live with WebAudio —
// a pulsing bass line under a slow arpeggio, scheduled a beat ahead so it
// never stutters. No audio files, no network. Each sector has its own
// bass line and arpeggio, and the volume follows the settings screen.
// Starts on the first launch (browsers need a gesture) and stops on
// game over / pause.

import { MUSIC } from './config.js';

let ac = null;
let master = null;
let timer = null;
let step = 0;
let nextStepTime = 0;
let playing = false;
let sector = 0;
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

/** Switch the loop to another sector's bass line and arpeggio. */
export function setMusicSector(i) {
  sector = Math.max(0, Math.min(MUSIC.sets.length - 1, i));
}

function note(freq, at, dur, type, gain) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** Schedule one 8th-note step of the loop. */
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
