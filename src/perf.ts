import pixelSvg from "./assets/pixel.svg";

/**
 * Performance helpers for the splash.
 *
 * 1. The stitch mask: every lit cell is masked by pixel.svg. Browsers re-rasterise an SVG mask on every
 *    repaint, and with ~250 lit cells repainting while the mark glitches that is the main cost on
 *    weaker laptops (ThinkPads, integrated GPUs). We draw the SVG once into a PNG and mask with that.
 *
 * 2. Lite mode: on low-end machines, or if frames run slow for a couple of seconds, <html> gets
 *    `is-lite` and the extra flourish (sparks, zaps, glows) is dialled down. The look stays the same.
 */
export function rasterizePixelMask() {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 184;
    canvas.height = 164;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      const png = canvas.toDataURL("image/png");
      document.documentElement.style.setProperty("--pixel-mask", `url("${png}")`);
    } catch {
      // keep the SVG mask
    }
  };
  img.src = pixelSvg;
}

export const perf = { lite: false };

/** Hover effects (heat, zaps, sparks) run only on a real mouse + hover desktop, and never in lite mode. */
const fineMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
export function hoverFxAllowed() {
  return !perf.lite && fineMouse.matches && !reducedMotion.matches;
}

function goLite() {
  if (perf.lite) return;
  perf.lite = true;
  document.documentElement.classList.add("is-lite");
}

export function watchPerformance() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  // only genuinely tiny machines start in lite; everyone else gets the watchdog below
  const weak = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
  if (weak) goLite();

  // Frame watchdog: ignore the first 3s (loading is always janky), then switch to lite only if
  // two 2-second windows in a row are mostly slow frames (under ~40fps) while the tab is visible.
  const startAt = performance.now() + 3000;
  let last = performance.now();
  let slow = 0;
  let total = 0;
  let badWindows = 0;
  let raf = 0;
  const tick = (now: number) => {
    const dt = now - last;
    last = now;
    if (now > startAt && !document.hidden && dt < 500) {
      total += dt;
      if (dt > 25) slow += dt;
      if (total > 2000) {
        badWindows = slow / total > 0.5 ? badWindows + 1 : 0;
        if (badWindows >= 2) goLite();
        total = 0;
        slow = 0;
      }
    }
    if (!perf.lite) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
