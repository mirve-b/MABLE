import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { MASK_ORDER, type MaskName } from "../grid/masks";
import { CursorFx, useCursorFx } from "./CursorFx";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const chromeFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7, delay: 1.05, ease: "easeOut" as const },
};

export function SplashScreen() {
  const [maskIndex, setMaskIndex] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [phase, setPhase] = useState<GridPhase>("enter");

  const mask: MaskName = MASK_ORDER[maskIndex]!;
  const cursor = useCursorFx();
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  useSmoothGridScale(clusterRef, frameRef);

  const handleEntered = useCallback(() => {
    setPhase("idle");
  }, []);

  const handleLeft = useCallback(() => {
    setMaskIndex((current) => (current + 1) % MASK_ORDER.length);
    setGeneration((current) => current + 1);
    setPhase("enter");
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    cursor.burstAt(event);
    if (phase !== "idle") return;
    setPhase("leave");
  };

  return (
    <main
      className="splash"
      onClick={handleClick}
      onPointerMove={cursor.onPointerMove}
      onPointerLeave={cursor.onPointerLeave}
    >
      <motion.header className="splash-chrome splash-chrome-top" {...chromeFade}>
        <p>Launching December ’26</p>
        <p>2026 / M-001</p>
        <p>Independent Studio / 001</p>
      </motion.header>

      <div className="splash-cluster" ref={clusterRef}>
        <div className="splash-grid-frame" ref={frameRef}>
          <PixelGrid
            key={`${mask}-${generation}`}
            mask={mask}
            phase={phase}
            onEntered={handleEntered}
            onLeft={handleLeft}
          />
        </div>
      </div>

      <motion.footer className="splash-chrome splash-chrome-bottom" {...chromeFade}>
        <p>
          Design × Code Studio
          <span>Built by Mirvé</span>
        </p>
        <p className="is-end">
          A little whimsy, please.
          <span>A collective no to corporate!</span>
        </p>
      </motion.footer>

      <CursorFx
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible}
        bursts={cursor.bursts}
        onBurstDone={cursor.onBurstDone}
      />
    </main>
  );
}
