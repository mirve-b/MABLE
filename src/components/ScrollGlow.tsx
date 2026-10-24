import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { PALETTE } from "../grid/colors";

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ScrollGlow() {
  const glow = useRef<HTMLDivElement>(null);
  const pixels = useRef<HTMLDivElement>(null);
  const strength = useRef(0);
  const stopped = useRef(false);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glowEl = glow.current;
    const pixelField = pixels.current;
    const hero = document.querySelector(".hero");
    if (!glowEl || !pixelField || !hero) return;
    const wash = hero.querySelector<HTMLElement>(".hero-wash");
    const bloom = hero.querySelector<HTMLElement>(".hero-bloom");
    const sparks = hero.querySelector<HTMLElement>(".fx-slot");

    const fields = () =>
      [pixelField, sparks].filter(Boolean) as HTMLElement[];

    const applyGlow = () => {
      const view = window.innerHeight || 1;
      const t = gsap.utils.clamp(0, 1, 1 - hero.getBoundingClientRect().top / view);
      const rise = t <= 0.34 ? t / 0.34 : 1;
      const fall = t <= 0.52 ? 1 : Math.max(0, 1 - (t - 0.52) / 0.38);
      const flowing = !reduce && t < 0.9;
      const amount = flowing ? rise * fall : 0;
      strength.current = amount;
      gsap.set(glowEl, {
        opacity: amount,
        scaleY: 0.42 + 0.7 * Math.min(1, t / 0.5),
      });
      if (bloom) {
        gsap.set(bloom, {
          opacity: amount,
          scaleY: 0.42 + 0.7 * Math.min(1, t / 0.5),
        });
      }
      if (wash) gsap.set(wash, { opacity: t });
      if (!flowing && !stopped.current) {
        stopped.current = true;
        fields().forEach((field) => {
          gsap.killTweensOf(field.querySelectorAll(".glow-pixel, .glow-spark"));
          gsap.to(field.querySelectorAll(".glow-pixel, .glow-spark"), {
            opacity: 0,
            y: "-=24",
            duration: 0.2,
            stagger: 0.008,
            overwrite: true,
            onComplete: () => {
              field.querySelectorAll(".glow-pixel, .glow-spark").forEach((bit) => bit.remove());
            },
          });
        });
      } else if (flowing) {
        stopped.current = false;
      }
    };

    applyGlow();
    window.addEventListener("scroll", applyGlow, { passive: true });
    window.addEventListener("resize", applyGlow);

    if (reduce) {
      return () => {
        window.removeEventListener("scroll", applyGlow);
        window.removeEventListener("resize", applyGlow);
      };
    }

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
      const amount = strength.current;
      const spark = Math.random() < 0.45;
      const host = pixelField;
      if (host.querySelectorAll(".glow-pixel, .glow-spark").length > 36) return;
      const bit = document.createElement("span");
      bit.className = spark ? "glow-spark" : "glow-pixel";
      const size = spark ? rand(4, 11) : rand(8, 18);
      bit.style.width = `${size}px`;
      bit.style.height = spark ? `${size}px` : `${size * 0.9}px`;
      bit.style.left = `${rand(3, 97)}%`;
      bit.style.bottom = `${rand(4, 18 + amount * 90)}px`;
      bit.style.backgroundColor = pick(PALETTE);
      if (spark && Math.random() < 0.45) bit.style.rotate = "45deg";
      host.appendChild(bit);

      const lift = rand(70, 160) + amount * rand(80, 200);
      const drift = rand(-56, 56);
      const dur = rand(0.48, 1.05);
      const peak = spark ? rand(0.4, 1) : 1;

      const motion = gsap.timeline({ onComplete: () => bit.remove() });
      motion.fromTo(
        bit,
        { opacity: 0, y: 18, x: 0, scale: 0.3 },
        { opacity: 1, y: -lift * 0.28, x: drift * 0.3, scale: peak, duration: dur * 0.22, ease: "power2.out" },
      );
      motion.to(bit, { y: -lift, x: drift, duration: dur * 0.78, ease: "power1.out" }, 0);
      motion.to(bit, { opacity: 0, duration: dur * 0.34, ease: "power1.in" }, dur * 0.66);

      const flashes = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < flashes; i += 1) {
        later(() => {
          if (!bit.isConnected) return;
          bit.style.backgroundColor = pick(PALETTE);
          if (motion.progress() < 0.62) {
            gsap.fromTo(bit, { opacity: 0.15 }, { opacity: 1, duration: 0.06, ease: "steps(1)" });
          }
        }, rand(50, dur * 620));
      }
    };

    const tick = () => {
      const amount = strength.current;
      if (amount > 0.1) {
        const burst = amount > 0.55 ? 2 + (Math.random() < 0.65 ? 1 : 0) : 1;
        for (let i = 0; i < burst; i += 1) spawn();
      }
      later(tick, amount > 0.5 ? rand(55, 120) : rand(140, 240));
    };
    later(tick, 40);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      fields().forEach((field) => {
        gsap.killTweensOf(field.querySelectorAll(".glow-pixel, .glow-spark"));
        field.querySelectorAll(".glow-pixel, .glow-spark").forEach((bit) => bit.remove());
      });
      window.removeEventListener("scroll", applyGlow);
      window.removeEventListener("resize", applyGlow);
    };
  }, []);

  return (
    <>
      <div className="scroll-glow-layer" aria-hidden="true">
        <div className="scroll-glow" ref={glow} />
      </div>
      <div className="scroll-pixel-layer" ref={pixels} aria-hidden="true" />
    </>
  );
}
