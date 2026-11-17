// STARFALL — music/SFX volume and mute, persisted.
import { setMusicVolume, setMusicMuted } from './music.js';
import { setSfxVolume, setSfxMuted } from './audio.js';
const KEY = 'starfall-settings';
export function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      music: typeof parsed.music === 'number' ? Math.max(0, Math.min(100, parsed.music)) : 70,
      sfx: typeof parsed.sfx === 'number' ? Math.max(0, Math.min(100, parsed.sfx)) : 80,
      muted: parsed.muted === true,
    };
  } catch {
    return { music: 70, sfx: 80, muted: false };
  }
}
export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
export function applySettings(settings) {
  setMusicVolume(settings.music / 100);
  setSfxVolume(settings.sfx / 100);
  setMusicMuted(settings.muted);
  setSfxMuted(settings.muted);
}
