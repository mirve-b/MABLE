import { createPortal } from "react-dom";
import { motion, type MotionValue } from "motion/react";
import type { StarBurst } from "../hooks/useCursorFx";

type CursorFxProps = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  visible: boolean;
  bursts: StarBurst[];
  onBurstDone: (id: number) => void;
};

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
