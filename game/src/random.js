// STARFALL — seeded randomness for a deterministic-friendly sky.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function rand(min, max) {
  return min + Math.random() * (max - min);
}
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
