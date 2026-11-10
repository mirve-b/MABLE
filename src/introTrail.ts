import { gsap } from "./gsap";
import { GLITCH_COLORS, PIXEL_COLOR } from "./grid/colors";
import { GLOW_INNER, GLOW_STEP } from "./grid/constants";
import { isCoarsePointer, pixelRatio } from "./perf";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const STITCH = [HOT, BABY, PIXEL_COLOR, ...GLITCH_COLORS] as const;

export const INTRO_WAVE_S = 1.22;
export const INTRO_WAVE_HOLD_S = 0.58;

function hash(x: number, y: number, t: number) {
  let n = (x * 374761393 + y * 668265263 + t * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function pointOnRoundRect(
  t: number,
  w: number,
  h: number,
  pad: number,
  rad: number,
) {
  const left = pad;
  const top = pad;
  const right = w - pad;
  const bottom = h - pad;
  const r = Math.min(rad, (right - left) / 2, (bottom - top) / 2);
  const sw = Math.max(1, right - left - 2 * r);
  const sh = Math.max(1, bottom - top - 2 * r);
  const arc = (Math.PI * r) / 2;
  const lens = [sw, arc, sh, arc, sw, arc, sh, arc];
  const total = lens.reduce((a, b) => a + b, 0);
  let d = (((t % 1) + 1) % 1) * total;

  const emit = (x: number, y: number, nx: number, ny: number) => ({ x, y, nx, ny });

  if (d <= lens[0]!) return emit(left + r + d, top, 0, -1);
  d -= lens[0]!;
  if (d <= lens[1]!) {
    const a = -Math.PI / 2 + (d / lens[1]!) * (Math.PI / 2);
    return emit(right - r + Math.cos(a) * r, top + r + Math.sin(a) * r, Math.cos(a), Math.sin(a));
  }
  d -= lens[1]!;
  if (d <= lens[2]!) return emit(right, top + r + d, 1, 0);
  d -= lens[2]!;
  if (d <= lens[3]!) {
    const a = (d / lens[3]!) * (Math.PI / 2);
    return emit(right - r + Math.cos(a) * r, bottom - r + Math.sin(a) * r, Math.cos(a), Math.sin(a));
  }
  d -= lens[3]!;
  if (d <= lens[4]!) return emit(right - r - d, bottom, 0, 1);
  d -= lens[4]!;
  if (d <= lens[5]!) {
    const a = Math.PI / 2 + (d / lens[5]!) * (Math.PI / 2);
    return emit(left + r + Math.cos(a) * r, bottom - r + Math.sin(a) * r, Math.cos(a), Math.sin(a));
  }
  d -= lens[5]!;
  if (d <= lens[6]!) return emit(left, bottom - r - d, -1, 0);
  d -= lens[6]!;
  const a = Math.PI + (d / (lens[7]! || 1)) * (Math.PI / 2);
  return emit(left + r + Math.cos(a) * r, top + r + Math.sin(a) * r, Math.cos(a), Math.sin(a));
}

function sizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = pixelRatio(1.25);
  const cssW = Math.max(1, canvas.clientWidth || window.innerWidth);
  const cssH = Math.max(1, canvas.clientHeight || window.innerHeight);
  const w = Math.max(1, Math.floor(cssW * dpr));
  const h = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return { w, h, dpr };
}

export function playIntroWave(canvas: HTMLCanvasElement) {
  const coarse = isCoarsePointer();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    return () => undefined;
  }

  const ride = { t: 0 };
  const duration = INTRO_WAVE_S + INTRO_WAVE_HOLD_S;
  const tail = coarse ? 0.12 : 0.18;
  const samples = coarse ? 28 : 52;

  const paint = () => {
    const { w, h, dpr } = sizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const cssW = w / dpr;
    const cssH = h / dpr;
    const pad = Math.max(36, Math.min(cssW, cssH) * 0.072) * dpr;
    const rad = Math.max(48, Math.min(cssW, cssH) * 0.14) * dpr;
    const step = GLOW_STEP * dpr;
    const inner = GLOW_INNER * dpr;
    const inset = (step - inner) / 2;
    const amp = (coarse ? 7 : 11) * dpr;
    const waveT = Math.min(1, ride.t / INTRO_WAVE_S);
    const hold = Math.max(0, (ride.t - INTRO_WAVE_S) / INTRO_WAVE_HOLD_S);
    const fade = hold <= 0 ? 1 : 1 - hold;
    if (fade <= 0.02) return;

    const stamp = (x: number, y: number, color: string, alpha: number, size = inner) => {
      const gx = Math.round(x / step) * step;
      const gy = Math.round(y / step) * step;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * fade));
      ctx.fillStyle = color;
      ctx.fillRect(gx + inset, gy + inset, size, size);
    };

    const along = (u: number) => {
      const pt = pointOnRoundRect(u, w, h, pad, rad);
      const wobble = Math.sin(u * Math.PI * 2 * 3.15) * amp;
      return {
        x: pt.x + pt.nx * wobble,
        y: pt.y + pt.ny * wobble,
      };
    };

    const head = waveT;
    for (let i = 0; i < samples; i += 1) {
      const span = i / Math.max(1, samples - 1);
      const u = head - tail * span;
      if (u < -0.02) continue;
      const { x, y } = along(u);
      const n = hash((x / step) | 0, (y / step) | 0, (waveT * 40) | 0);
      const color = span < 0.16 ? HOT : span < 0.38 ? BABY : (STITCH[(i + ((waveT * 12) | 0)) % STITCH.length] ?? PIXEL_COLOR);
      if (n > 0.9 && span > 0.2) continue;
      stamp(x, y, color, 1 - span * 0.72, span < 0.12 ? inner + dpr : inner);
      if (!coarse && n > 0.72 && span < 0.45) {
        stamp(x + step, y - step, n > 0.88 ? HOT : PIXEL_COLOR, 0.55 * (1 - span), inner * 0.7);
      }
    }

    const specks = coarse ? 8 : 16;
    for (let s = 0; s < specks; s += 1) {
      const u = head - hash(s, 9, 3) * tail * 0.85;
      const { x, y } = along(u);
      const n = hash(s, 11, (waveT * 18) | 0);
      if (n < 0.35) continue;
      stamp(
        x + (n - 0.5) * step * 3,
        y + (hash(s, 13, 1) - 0.5) * step * 3,
        n > 0.8 ? HOT : BABY,
        0.35 + n * 0.4,
        inner * 0.65,
      );
    }

    if (hold > 0) {
      const leftover = coarse ? 10 : 18;
      for (let s = 0; s < leftover; s += 1) {
        const u = hash(s, 21, 7);
        const { x, y } = along(u);
        const n = hash(s, 23, (hold * 20) | 0);
        if (n < 0.4) continue;
        stamp(x, y, STITCH[s % STITCH.length] ?? HOT, 0.45 * (1 - hold), inner);
      }
    }

    ctx.globalAlpha = 1;
  };

  canvas.style.opacity = "1";
  const tween = gsap.to(ride, {
    t: duration,
    duration,
    ease: "none",
    onUpdate: paint,
    onComplete() {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = "0";
    },
  });

  paint();
  return () => {
    tween.kill();
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = "0";
  };
}
