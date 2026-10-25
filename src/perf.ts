export function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function pixelRatio(cap = 1.35) {
  const dpr = window.devicePixelRatio || 1;
  return Math.min(dpr, isCoarsePointer() ? 1 : cap);
}
