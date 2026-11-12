import { gsap, ScrollTrigger } from "./gsap";
import { GLITCH_COLORS, PIXEL_COLOR } from "./grid/colors";
import { GLOW_INNER, GLOW_STEP } from "./grid/constants";
import { isCoarsePointer, pixelRatio } from "./perf";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const WHITE = "#FFFFFF";
const BRIGHT = "#FF3D8E";
const PASTEL = [HOT, BABY, PIXEL_COLOR, ...GLITCH_COLORS] as const;

function hash(x: number, y: number, t: number) {
  let n = (x * 374761393 + y * 668265263 + t * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/**
 * A wand-style sparkle trail that swoops down the team section in a wave as you scroll,
 * like something small and magic just flew past behind the girls. Same pixel language as
 * the intro cursor trail: grid-snapped squares, pink at the head, pastel flicker in the tail.
 */
export function attachTeamWave(canvas: HTMLCanvasElement, section: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => undefined;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  const coarse = isCoarsePointer();
  const state = { p: 0 };
  let live = false;
  let frame = 0;
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;

  const size = () => {
    dpr = pixelRatio(1.25);
    cssW = Math.max(1, canvas.clientWidth);
    cssH = Math.max(1, canvas.clientHeight);
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  };
  size();

  const sparkle = (x: number, y: number, r: number, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  };

  const paint = (time: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.p <= 0.001) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = GLOW_STEP;
    const inner = GLOW_INNER;
    const inset = (step - inner) / 2;
    const flick = Math.floor(time * 12);
    const phone = cssW < 700;
    const cx = cssW * 0.5;
    const amp = Math.min(cssW * (phone ? 0.34 : 0.27), 420);
    const lambda = Math.max(cssH * (phone ? 0.5 : 0.62), 380);
    const along = (y: number) => cx + Math.sin((y / lambda) * Math.PI * 2 + 0.6) * amp;

    // The canvas runs past the section bottom; the last stretch is where the trail thins out to nothing.
    const fadeFrom = cssH * 0.6;
    const fadeTo = cssH * 0.97;
    const fadeY = (y: number) => {
      if (y <= fadeFrom) return 1;
      const t = Math.min(1, (y - fadeFrom) / (fadeTo - fadeFrom));
      return 1 - t * t * (3 - 2 * t);
    };
    // Up top the trail fans out into a funnel that reaches up into the glitter flood above the section.
    const funnel = cssH * (phone ? 0.16 : 0.22);
    const topness = (y: number) => (y >= funnel ? 0 : Math.pow(1 - Math.max(0, y) / funnel, 1.4));

    const head = state.p * cssH * 1.02;
    const fresh = cssH * (phone ? 0.3 : 0.34);
    const dy = step * 0.5;
    const bottom = Math.floor(head / dy);

    const stamp = (x: number, y: number, color: string, alpha: number, sq = inner) => {
      const f = fadeY(y);
      if (f <= 0.01) return;
      const gx = Math.round(x / step) * step;
      const gy = Math.round(y / step) * step;
      ctx.globalAlpha = Math.min(1, alpha * f);
      ctx.fillStyle = color;
      ctx.fillRect(gx + inset + (inner - sq) / 2, gy + inset + (inner - sq) / 2, sq, sq);
    };

    // The ribbon: stable per path sample so cells twinkle in place instead of swimming.
    // It always stays connected back up to the flood, so the wand reads as pulling sparkle out of it.
    for (let i = bottom; i >= -2; i -= 1) {
      const y = i * dy;
      const f = fadeY(y);
      if (hash(i, 37, 1) > f) continue;
      const age = Math.min(1, (head - y) / fresh);
      const up = topness(y);
      const x = along(y);
      const life = 0.38 + 0.62 * Math.pow(1 - age, 1.15);
      const n = hash(i, 3, 7);
      const tw = 0.55 + 0.45 * Math.sin(time * (2 + n * 4) + n * 20);
      const flood = n < 0.3 ? BABY : n > 0.75 ? BRIGHT : HOT;

      const core =
        age < 0.08 ? WHITE : age < 0.3 ? (n > 0.5 ? HOT : BABY) : age < 1 ? PASTEL[Math.floor(hash(i, 5, flick) * PASTEL.length)]! : flood;
      if (age < 0.4 || hash(i, 9, flick) > 0.25 + up * 0.3) stamp(x, y, core, age < 1 ? life : life * tw, age < 0.06 ? inner + 2 : inner);

      // Dust shaken off the wand: spreads wider as the trail ages, and fans out wide near the top.
      const spread = step * (1.2 + age * (phone ? 3.5 : 5) + up * (phone ? 9 : 16));
      const bits = (coarse ? 2 : age < 0.5 ? 5 : 3) + Math.round(up * (coarse ? 3 : 7));
      for (let k = 0; k < bits; k += 1) {
        const r = hash(i, 11 + k, 1);
        if (r > 0.9 - age * 0.3 + up * 0.25) continue;
        if (hash(i, 17 + k, flick) < 0.12 + age * 0.3) continue;
        const ox = (hash(i, 13 + k, 2) - 0.5) * 2 * spread;
        const oy = (hash(i, 19 + k, 4) - 0.5) * spread * (0.8 - up * 0.5) + (1 - up) * age * step * 2;
        const tint = age < 0.2 ? (r > 0.5 ? HOT : BABY) : age < 1 && up < 0.3 ? PASTEL[Math.floor(hash(i, 23 + k, flick) * PASTEL.length)]! : r < 0.3 ? BABY : r > 0.7 ? BRIGHT : HOT;
        stamp(x + ox, y + oy, tint, life * (0.45 + r * 0.55), r > 0.6 ? inner : inner * 0.7);
      }

      // Star glints pop along the trail every so often.
      if (n > (coarse ? 0.93 : 0.86) && age > 0.04 && hash(i, 29, flick >> 1) > 0.3 && f > 0.2) {
        const ox = (hash(i, 31, 0) - 0.5) * spread * 1.4;
        ctx.shadowColor = HOT;
        ctx.shadowBlur = 10;
        sparkle(x + ox, y, 5 + n * 6, n > 0.965 ? WHITE : BABY, life * f);
        ctx.shadowBlur = 0;
      }
    }

    // The wand tip itself: a bright star with a halo.
    if (head > -step && fadeY(head) > 0.02) {
      const x = along(head);
      ctx.save();
      ctx.globalAlpha = fadeY(head);
      const pulse = 0.85 + Math.sin(time * 18) * 0.15;
      const halo = ctx.createRadialGradient(x, head, 0, x, head, 46);
      halo.addColorStop(0, "rgba(254, 99, 160, 0.55)");
      halo.addColorStop(1, "rgba(254, 99, 160, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(x - 46, head - 46, 92, 92);
      ctx.shadowColor = HOT;
      ctx.shadowBlur = 16;
      sparkle(x, head, 15 * pulse, WHITE, fadeY(head));
      ctx.shadowBlur = 0;
      for (let k = 0; k < 5; k += 1) {
        const a = hash(k, 41, flick) * Math.PI * 2;
        const d = 10 + hash(k, 43, flick) * 26;
        stamp(x + Math.cos(a) * d, head + Math.sin(a) * d, k % 2 ? HOT : WHITE, 0.9, inner * 0.7);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  // Phones: the whole wave is drawn once and stays still.
  if (coarse) {
    state.p = 0.9;
    paint(0);
    const onResize = () => {
      size();
      paint(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }

  const tick = (time: number) => {
    if (!live) return;
    frame += 1;
    paint(time);
  };

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top 75%",
    end: "bottom 10%",
    onToggle: (self) => {
      live = self.isActive;
      if (!live) paint(gsap.ticker.time);
    },
    onUpdate: (self) => {
      gsap.to(state, { p: self.progress, duration: 0.6, ease: "power2.out", overwrite: true });
    },
    onRefresh: size,
  });
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    gsap.killTweensOf(state);
    trigger.kill();
  };
}
