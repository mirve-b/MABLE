import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { MASK_ORDER, type MaskName } from "../grid/masks";
import { CursorFx, useCursorFx } from "./CursorFx";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { PixelGrid, type GridPhase } from "./PixelGrid";

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
        <motion.footer
          className="splash-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
        >
          <p className="splash-tagline">DESIGN X CODE STUDIO BY MIRVÉ</p>
          <p className="splash-whimsy">A LITTLE WHIMSY PLEASE</p>
        </motion.footer>
      </div>
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
