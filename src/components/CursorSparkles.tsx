import { useEffect, useRef } from "react";
import { hasFinePointer, hotZone, pointer, prefersReducedMotion, watchPointer } from "../cursorField";
import { perf } from "../perf";

/** Same sparkle colours as the website's text sparkles. */
const COLORS = ["#FE63A0", "#FFC1DC", "#D7BDC7", "#D9D9D9", "#D5D0AD"] as const;
const MAX_LIVE = 80;
const LITE_MAX = 28;

type Kind = "glint" | "diamond" | "cross";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function centerOf(cell: HTMLElement) {
  const r = cell.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, unit: r.width };
}

/**
 * The website's sparkles, aimed at the part of the mark under the cursor:
 * tiny glowing squares, 45° diamonds and pixel-crosses that blink in hard steps and
 * swap colour mid-twinkle. Hot pixels blink out and break into a handful of them, then rebuild.
 * Nothing follows the cursor through empty space. Web Animations API only — no React renders.
 */
export function CursorSparkles() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = layer.current;
    if (!host || !hasFinePointer() || prefersReducedMotion()) return;
    const stop = watchPointer();
    const timers = new Set<number>();
    let raf = 0;
    let last = performance.now();
    let burstBudget = 0;
    let glintBudget = 0;
    let live = 0;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const make = (kind: Kind, x: number, y: number, size: number) => {
      const el = document.createElement("span");
      el.className = `pixel-spark is-${kind}`;
      const color = pick(COLORS);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${size.toFixed(1)}px`;
      el.style.height = `${(kind === "cross" ? size * 0.9 : size).toFixed(1)}px`;
      el.style.color = color;
      el.style.backgroundColor = color;
      host.appendChild(el);
      live += 1;
      return el;
    };

    const done = (el: HTMLElement) => () => {
      if (!el.isConnected) return;
      el.remove();
      live -= 1;
    };

    /** Twinkle in place: pop in, dim, flash a new colour, maybe flicker again, then out — all stepped. */
    const glint = (x: number, y: number, unit: number) => {
      if (live >= (perf.lite ? LITE_MAX : MAX_LIVE)) return;
      const kind: Kind = Math.random() < 0.6 ? "glint" : "cross";
      const size = kind === "glint" ? rand(0.3, 0.62) * unit : rand(0.45, 0.9) * unit;
      const el = make(kind, x, y, size);
      const rot = kind === "glint" || Math.random() < 0.55 ? rand(-48, 48) : 0;
      const at = (s: number, r = rot) => `translate(-50%, -50%) rotate(${r}deg) scale(${s})`;
      const flicker = Math.random() < 0.55;
      const anim = el.animate(
        [
          { transform: at(0.18), opacity: 0, easing: "steps(2, end)" },
          { transform: at(rand(0.9, 1.35)), opacity: 1, offset: 0.2, easing: "steps(1, end)" },
          { opacity: rand(0.12, 0.4), offset: 0.33, easing: "steps(1, end)" },
          { transform: at(rand(0.75, 1.2)), opacity: 1, backgroundColor: pick(COLORS), offset: 0.52, easing: "steps(1, end)" },
          ...(flicker
            ? [
                { opacity: 0.18, offset: 0.64, easing: "steps(1, end)" },
                { transform: at(1, rot + rand(-18, 18)), opacity: 1, offset: 0.76, easing: "steps(2, end)" },
              ]
            : []),
          { transform: at(rand(0.2, 0.7)), opacity: 0 },
        ],
        { duration: rand(320, 440), fill: "both" },
      );
      anim.onfinish = done(el);
    };

    /** Tiny glow-sparks drift off a pixel, flashing colours as they go (the website's rising pixels). */
    const spark = (x: number, y: number, unit: number, away: number, heat: number) => {
      if (live >= (perf.lite ? LITE_MAX : MAX_LIVE)) return;
      const diamond = Math.random() < 0.45;
      const el = make(diamond ? "diamond" : "glint", x, y, rand(0.24, 0.62) * unit);
      const angle = away + rand(-1.2, 1.2);
      const dist = unit * rand(2, 4.5 + heat * 3);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - unit * rand(0.5, 2);
      const peak = rand(0.5, 1);
      const rot = diamond ? 45 : 0;
      const duration = rand(480, 950);
      const move = el.animate(
        [
          { transform: `translate(-50%, -50%) rotate(${rot}deg) scale(0.3)` },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px)) rotate(${rot}deg) scale(${peak})`, offset: 0.22 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${peak * 0.8})` },
        ],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.4, 1)", fill: "both" },
      );
      // Stepped colour flashes + blinks on top of the drift.
      const flashes = 2 + Math.floor(Math.random() * 4);
      const frames: Keyframe[] = [{ opacity: 0, easing: "steps(1, end)" }, { opacity: 1, offset: 0.06, easing: "steps(1, end)" }];
      for (let i = 0; i < flashes; i += 1) {
        const o = 0.12 + ((i + Math.random() * 0.8) / flashes) * 0.5;
        frames.push({ opacity: 0.15, backgroundColor: pick(COLORS), offset: o, easing: "steps(1, end)" });
        frames.push({ opacity: 1, offset: Math.min(0.66, o + 0.05), easing: "steps(1, end)" });
      }
      frames.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0));
      frames.push({ opacity: 1, offset: 0.68, easing: "ease-in" });
      frames.push({ opacity: 0 });
      el.animate(frames, { duration, fill: "both" });
      move.onfinish = done(el);
    };

    /** One hot pixel blinks out and breaks into a few sparks, then rebuilds. */
    const burst = (heat: number) => {
      if (live >= MAX_LIVE || hotZone.cells.length === 0) return;
      const cell = pick(hotZone.cells);
      if (cell.classList.contains("is-burst")) return;
      const { x, y, unit } = centerOf(cell);
      const away = Math.atan2(y - pointer.y, x - pointer.x);

      cell.classList.remove("is-rebuild");
      cell.classList.add("is-burst");
      later(() => {
        cell.classList.add("is-rebuild");
        cell.classList.remove("is-burst");
        later(() => cell.classList.remove("is-rebuild"), 320);
      }, rand(160, 300));

      const count = 3 + Math.floor(Math.random() * (2 + heat * 2));
      for (let i = 0; i < count; i += 1) {
        later(() => spark(x, y, unit, away, heat), i * rand(10, 40));
      }
      if (Math.random() < 0.6) glint(x + rand(-unit, unit), y + rand(-unit, unit), unit);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const count = hotZone.cells.length;
      if (!pointer.active || document.hidden || count === 0) {
        burstBudget = 0;
        glintBudget = 0;
        return;
      }
      // More of the logo under the cursor → more sparkle; moving it stirs up extra.
      const moving = now - pointer.movedAt < 140;
      const heat = Math.min(1, count / 40);
      burstBudget += (5 + heat * 10 + (moving ? 7 : 0)) * dt * (perf.lite ? 0.4 : 1);
      glintBudget += (8 + heat * 14 + (moving ? 6 : 0)) * dt * (perf.lite ? 0.4 : 1);
      while (burstBudget >= 1) {
        burstBudget -= 1;
        burst(heat);
      }
      while (glintBudget >= 1) {
        glintBudget -= 1;
        const { x, y, unit } = centerOf(pick(hotZone.cells));
        glint(x + rand(-unit * 1.4, unit * 1.4), y + rand(-unit * 1.4, unit * 1.4), unit);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      document.querySelectorAll(".pixel-cross.is-burst, .pixel-cross.is-rebuild").forEach((el) => {
        el.classList.remove("is-burst", "is-rebuild");
      });
      stop();
      host.replaceChildren();
    };
  }, []);

  return <div className="cursor-sparkles" ref={layer} aria-hidden="true" />;
}
