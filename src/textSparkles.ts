import { gsap } from "./gsap";
import { isCoarsePointer } from "./perf";

const COLORS = ["#FE63A0", "#FFC1DC", "#D7BDC7", "#D9D9D9", "#D5D0AD"] as const;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function nearAnchor(anchor: DOMRect, field: DOMRect) {
  const left = anchor.left - field.left;
  const top = anchor.top - field.top;
  const padX = Math.max(40, anchor.width * 0.22);
  const padY = Math.max(28, anchor.height * 0.4);
  if (Math.random() < 0.28) {
    return {
      x: left + rand(-padX * 0.25, anchor.width + padX * 0.25),
      y: top + rand(-padY * 0.2, anchor.height + padY * 0.2),
    };
  }
  const t = Math.random() * Math.PI * 2;
  const rx = anchor.width * 0.52 + rand(8, padX);
  const ry = anchor.height * 0.52 + rand(6, padY);
  return {
    x: left + anchor.width / 2 + Math.cos(t) * rx,
    y: top + anchor.height / 2 + Math.sin(t) * ry,
  };
}

function inBestiesFace(nx: number, ny: number) {
  if (ny < 0.04 || ny > 0.5) return false;
  return (nx > 0.1 && nx < 0.48) || (nx > 0.5 && nx < 0.88);
}

/** Ring the sitting pair — outer silhouette, skip both face cores. */
function haloAround(anchor: DOMRect, field: DOMRect) {
  const left = anchor.left - field.left;
  const top = anchor.top - field.top;
  const cx = left + anchor.width * 0.5;
  const cy = top + anchor.height * 0.52;
  for (let i = 0; i < 10; i += 1) {
    const t = Math.random() * Math.PI * 2;
    const upper = Math.sin(t) < 0.12;
    const u = upper ? rand(0.7, 1.18) : rand(0.52, 1.04);
    let x = cx + Math.cos(t) * (anchor.width * 0.5 * u + rand(8, 32));
    let y = cy + Math.sin(t) * (anchor.height * 0.5 * u + rand(6, 26));
    const nx = (x - left) / Math.max(1, anchor.width);
    const ny = (y - top) / Math.max(1, anchor.height);
    if (!inBestiesFace(nx, ny)) return { x, y };
    if (i === 9) {
      x = cx + (x - cx) * 1.35;
      y = cy + (y - cy) * 1.35;
      return { x, y };
    }
  }
  return { x: cx + anchor.width * 0.62, y: cy };
}

type SparkleOpts = {
  field: HTMLElement;
  anchor: () => Element | null;
  live: () => boolean;
  /** Intro: shorter quiet gaps, denser bursts. Hero keeps the default. */
  density?: "intro";
  /** Ring this target instead of filling its interior (intro besties). */
  halo?: boolean;
  /** Occasional extra target (intro pixel lockup). */
  around?: () => Element | null;
};

export function attachTextSparkles({ field, anchor, live, density, halo, around }: SparkleOpts) {
  const coarse = isCoarsePointer();
  const intro = density === "intro";
  let cancelled = false;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (!cancelled) fn();
    }, ms);
    timers.add(id);
  };

  const spawn = () => {
    if (!live()) return;
    const primary = anchor();
    const extra = around?.() ?? null;
    const useExtra = Boolean(extra && primary) && Math.random() < 0.06;
    const mark = useExtra ? extra : primary ?? extra;
    if (!mark) return;
    const ring = !useExtra && halo;
    const box = mark.getBoundingClientRect();
    const host = field.getBoundingClientRect();
    if (box.width < 8 || host.width < 8) return;
    if (box.bottom < host.top - 24 || box.top > host.bottom + 24) return;
    const cap = intro ? (coarse ? 16 : 28) : coarse ? 4 : 7;
    if (field.querySelectorAll(".text-sparkle").length > cap) return;

    const { x, y } = ring ? haloAround(box, host) : nearAnchor(box, host);
    const bit = document.createElement("span");
    const glint = Math.random() < 0.32;
    bit.className = glint ? "text-sparkle is-glint" : "text-sparkle is-cross";
    const size = glint ? rand(5, 11) : rand(8, 16);
    bit.style.width = `${size}px`;
    bit.style.height = glint ? `${size}px` : `${size * 0.9}px`;
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.backgroundColor = pick(COLORS);
    field.appendChild(bit);

    const rot = glint || Math.random() < 0.55 ? rand(-48, 48) : 0;
    gsap.set(bit, {
      xPercent: -50,
      yPercent: -50,
      rotation: rot,
      scale: 0.18,
      opacity: 0,
    });

    const twinkle = gsap.timeline({ onComplete: () => bit.remove() });
    twinkle.to(bit, {
      opacity: 1,
      scale: rand(0.9, 1.35),
      duration: 0.07,
      ease: "steps(2)",
    });
    twinkle.to(bit, {
      opacity: rand(0.12, 0.4),
      duration: 0.05,
      ease: "steps(1)",
    });
    twinkle.to(bit, {
      opacity: 1,
      scale: rand(0.75, 1.2),
      duration: 0.08,
      ease: "steps(1)",
      onStart() {
        if (Math.random() < 0.7) bit.style.backgroundColor = pick(COLORS);
      },
    });
    if (Math.random() < 0.55) {
      twinkle.to(bit, { opacity: 0.18, duration: 0.04, ease: "steps(1)" });
      twinkle.to(bit, {
        opacity: 1,
        rotation: rot + rand(-18, 18),
        duration: 0.06,
        ease: "steps(1)",
      });
    }
    twinkle.to(bit, {
      opacity: 0,
      scale: rand(0.2, 0.7),
      duration: 0.12,
      ease: "steps(2)",
    });
  };

  const tick = () => {
    if (cancelled) return;
    if (live()) {
      const burst = intro
        ? Math.random() < 0.2 ? 5 : Math.random() < 0.5 ? 4 : Math.random() < 0.82 ? 3 : 2
        : Math.random() < 0.14 ? 3 : Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < burst; i += 1) later(spawn, i * (intro ? rand(10, 36) : rand(30, 90)));
    }
    const quiet = Math.random() < (intro ? 0.05 : 0.24);
    const wait = intro
      ? quiet
        ? rand(220, 480)
        : coarse
          ? rand(70, 180)
          : rand(40, 110)
      : quiet
        ? rand(1500, 2800)
        : coarse
          ? rand(640, 1400)
          : rand(380, 1100);
    later(tick, wait);
  };

  later(tick, intro ? rand(12, 40) : rand(80, 220));

  return () => {
    cancelled = true;
    timers.forEach((id) => window.clearTimeout(id));
    gsap.killTweensOf(field.querySelectorAll(".text-sparkle"));
    field.querySelectorAll(".text-sparkle").forEach((bit) => bit.remove());
  };
}
