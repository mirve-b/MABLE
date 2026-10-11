import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { MASK_ORDER, type MaskName } from "../grid/masks";
import { PixelGrid, type GridPhase } from "./PixelGrid";

export function SplashScreen() {
  const [maskIndex, setMaskIndex] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [phase, setPhase] = useState<GridPhase>("enter");

  const mask: MaskName = MASK_ORDER[maskIndex]!;
  const showTagline = mask === "mable" && phase !== "leave";

  const handleEntered = useCallback(() => {
    setPhase("idle");
  }, []);

  const handleLeft = useCallback(() => {
    setMaskIndex((current) => (current + 1) % MASK_ORDER.length);
    setGeneration((current) => current + 1);
    setPhase("enter");
  }, []);

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("leave");
  };

  return (
    <main className="splash" onClick={handleClick}>
      <div className="splash-cluster">
        <div className="splash-grid-frame">
          <PixelGrid
            key={`${mask}-${generation}`}
            mask={mask}
            phase={phase}
            onEntered={handleEntered}
            onLeft={handleLeft}
          />
        </div>
        <motion.p
          className="splash-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: showTagline ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          A Design X Code Studio!
        </motion.p>
      </div>
    </main>
  );
}
