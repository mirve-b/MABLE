import { useEffect, useState } from "react";
import { useMotionValue } from "motion/react";
import { PALETTE } from "../grid/colors";
import { isCoarsePointer } from "../perf";

export type StarBurst = {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  duration: number;
  rotate: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function spawnStars(x: number, y: number): StarBurst[] {
  const origin = Math.random() * 360;
  const stamp = Date.now();
  return Array.from({ length: 14 }, (_, i) => ({
    id: stamp + i,
    x,
    y,
    angle: origin + i * (360 / 14) + rand(-18, 18),
    distance: rand(36, 210),
    size: rand(6, 16),
    color: pick(PALETTE),
    duration: rand(0.4, 0.95),
    rotate: rand(-60, 60),
  }));
}

export function useCursorFx() {
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const [visible, setVisible] = useState(false);
  const [bursts, setBursts] = useState<StarBurst[]>([]);

  useEffect(() => {
    if (isCoarsePointer()) return;

    const wandOn = () => {
      if (!document.documentElement.classList.contains("is-intro-ready")) return false;
      const hero = document.querySelector(".hero");
      const intro = document.querySelector(".intro");
      const introBox = intro?.getBoundingClientRect();
      const heroTop = hero?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      if (introBox && introBox.bottom > 32 && heroTop > 16) return true;
      return false;
    };

    let wandFrame = 0;
    const syncWand = () => {
      if (wandFrame) return;
      wandFrame = requestAnimationFrame(() => {
        wandFrame = 0;
        applyWand();
      });
    };
    const applyWand = () => {
      const on = wandOn();
      document.documentElement.classList.toggle("is-wand-intro", on);
      document.documentElement.classList.toggle("is-wand", on);
    };

    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const leave = () => setVisible(false);
    const click = (event: globalThis.MouseEvent) => {
      setBursts((current) => [...current, ...spawnStars(event.clientX, event.clientY)]);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", syncWand, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("click", click);

    const watch = new MutationObserver(syncWand);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    syncWand();

    return () => {
      cancelAnimationFrame(wandFrame);
      watch.disconnect();
      document.documentElement.classList.remove("is-wand", "is-wand-intro");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", syncWand);
        document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("click", click);
    };
  }, [x, y]);

  const onBurstDone = (id: number) => {
    setBursts((current) => current.filter((star) => star.id !== id));
  };

  return { x, y, visible, bursts, onBurstDone };
}
