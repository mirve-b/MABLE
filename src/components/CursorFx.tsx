import { useEffect, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, type MotionValue } from "motion/react";
import { PALETTE } from "../grid/colors";

type StarBurst = {
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
  return Array.from({ length: 5 }, (_, i) => ({
    id: stamp + i,
    x,
    y,
    angle: origin + i * 72 + rand(-22, 22),
    distance: rand(48, 170),
    size: rand(8, 22),
    color: pick(PALETTE),
    duration: rand(0.45, 0.95),
    rotate: rand(-50, 50),
  }));
}

function StarShape({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 1.6 14.7 8.4 22 9.2 16.4 14.1 18 21.4 12 17.8 6 21.4 7.6 14.1 2 9.2 9.3 8.4Z" />
    </svg>
  );
}

type CursorFxProps = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  visible: boolean;
  bursts: StarBurst[];
  onBurstDone: (id: number) => void;
};

export function CursorFx({ x, y, visible, bursts, onBurstDone }: CursorFxProps) {
  return createPortal(
    <div className="cursor-layer">
      {bursts.map((star) => {
        const rad = (star.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * star.distance;
        const dy = Math.sin(rad) * star.distance;

        return (
          <span
            key={star.id}
            className="click-star"
            style={{ left: star.x, top: star.y }}
          >
            <motion.span
              className="click-star-inner"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.35, rotate: 0 }}
              animate={{
                x: dx,
                y: dy,
                opacity: 0,
                scale: 1,
                rotate: star.rotate,
              }}
              transition={{ duration: star.duration, ease: "easeOut" }}
              onAnimationComplete={() => onBurstDone(star.id)}
            >
              <StarShape size={star.size} color={star.color} />
            </motion.span>
          </span>
        );
      })}

      <motion.span
        className={`glitch-cursor${visible ? " is-on" : ""}`}
        style={{ x, y }}
      >
        <span className="glitch-cursor-glyph" />
      </motion.span>
    </div>,
    document.body,
  );
}

export function useCursorFx() {
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const [visible, setVisible] = useState(false);
  const [bursts, setBursts] = useState<StarBurst[]>([]);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    x.set(event.clientX);
    y.set(event.clientY);
    if (!visible) setVisible(true);
  };

  const onPointerLeave = () => setVisible(false);

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const leave = () => setVisible(false);
    const click = (event: globalThis.MouseEvent) => {
      setBursts((current) => [
        ...current,
        ...spawnStars(event.clientX, event.clientY),
      ]);
    };

    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("click", click);
    };
  }, [x, y]);

  const burstAt = (event: MouseEvent<HTMLElement>) => {
    setBursts((current) => [
      ...current,
      ...spawnStars(event.clientX, event.clientY),
    ]);
  };

  const onBurstDone = (id: number) => {
    setBursts((current) => current.filter((star) => star.id !== id));
  };

  return {
    x,
    y,
    visible,
    bursts,
    onPointerMove,
    onPointerLeave,
    burstAt,
    onBurstDone,
  };
}
