// STARFALL — sound: every effect synthesized with WebAudio, no files.
let ctx = null;
let muted = false;
let volume = 0.8;
export function ensureAudio() {
  if (ctx === null) {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }
export function setSfxVolume(v) { volume = v; }
export function setSfxMuted(m) { muted = m; }
function tone({ freq, freqEnd = null, dur = 0.12, type = 'sine', gain = 0.12, delay = 0 }) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain * volume, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
function noiseBurst({ dur = 0.25, gain = 0.2, cutoff = 900 }) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain * volume, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t0);
}
export function playCollect(combo) {
  const base = 620 + Math.min(combo, 12) * 45;
  tone({ freq: base, freqEnd: base * 1.6, dur: 0.14, type: 'triangle', gain: 0.14 });
}
export function playHit() {
  noiseBurst({ dur: 0.3, gain: 0.25, cutoff: 700 });
  tone({ freq: 160, freqEnd: 50, dur: 0.3, type: 'sawtooth', gain: 0.16 });
}
export function playPowerup() {
  tone({ freq: 440, dur: 0.1, type: 'square', gain: 0.08 });
  tone({ freq: 660, dur: 0.1, type: 'square', gain: 0.08, delay: 0.09 });
  tone({ freq: 880, dur: 0.18, type: 'square', gain: 0.08, delay: 0.18 });
}
export function playLevelUp() {
  [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.12, delay: i * 0.09 }));
}
export function playGameOver() {
  [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.28, type: 'sawtooth', gain: 0.1, delay: i * 0.16 }));
}
export function playClick() {
  tone({ freq: 880, freqEnd: 660, dur: 0.06, type: 'sine', gain: 0.08 });
}
export function playShoot() {
  tone({ freq: 980, freqEnd: 320, dur: 0.09, type: 'square', gain: 0.05 });
}
export function playExplode() {
  noiseBurst({ dur: 0.4, gain: 0.3, cutoff: 500 });
  tone({ freq: 120, freqEnd: 38, dur: 0.35, type: 'sawtooth', gain: 0.18 });
}
export function playBossHit() {
  tone({ freq: 220, freqEnd: 180, dur: 0.07, type: 'square', gain: 0.07 });
}
export function playBossDown() {
  [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: 0.2, type: 'triangle', gain: 0.12, delay: i * 0.1 }));
}
export function playMagnet() {
  tone({ freq: 300, freqEnd: 900, dur: 0.18, type: 'sine', gain: 0.1 });
}
export function playNearMiss() {
  noiseBurst({ dur: 0.12, gain: 0.08, cutoff: 2400 });
}
export function playBomb() {
  noiseBurst({ dur: 0.7, gain: 0.4, cutoff: 400 });
  tone({ freq: 90, freqEnd: 28, dur: 0.6, type: 'sawtooth', gain: 0.22 });
  tone({ freq: 1047, freqEnd: 2093, dur: 0.25, type: 'triangle', gain: 0.08, delay: 0.05 });
}
export function playBuy() {
  [660, 880, 1320].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'triangle', gain: 0.1, delay: i * 0.07 }));
}
export function playAchievement() {
  [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.1, delay: i * 0.08 }));
}
export function playMinibossHit() {
  tone({ freq: 300, freqEnd: 240, dur: 0.06, type: 'square', gain: 0.07 });
}
export function playMinibossDown() {
  [523, 659, 880, 1175].forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.11, delay: i * 0.08 }));
}
export function playEnemyShoot() {
  tone({ freq: 220, freqEnd: 110, dur: 0.12, type: 'sawtooth', gain: 0.05 });
}
export function playBossIntro() {
  tone({ freq: 110, freqEnd: 440, dur: 0.5, type: 'sawtooth', gain: 0.12 });
  noiseBurst({ dur: 0.5, gain: 0.25, cutoff: 400 });
  tone({ freq: 65, freqEnd: 30, dur: 0.55, type: 'sine', gain: 0.22 });
}
export function playComboMilestone() {
  tone({ freq: 1047, dur: 0.12, type: 'triangle', gain: 0.12 });
  tone({ freq: 1568, dur: 0.2, type: 'triangle', gain: 0.12, delay: 0.09 });
}
export function playLowHealth() {
  tone({ freq: 220, dur: 0.16, type: 'square', gain: 0.09 });
  tone({ freq: 180, dur: 0.22, type: 'square', gain: 0.09, delay: 0.18 });
}
export function playRushClear() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.12, delay: i * 0.09 }));
}
