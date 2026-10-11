import { useCallback, useEffect, useState } from "react";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const GLITCH_HOLD_MS = 2800;
const BLACK_HOLD_MS = 400;

export function GridExport() {
  const [generation, setGeneration] = useState(0);
  const [phase, setPhase] = useState<GridPhase>("enter");

  useEffect(() => {
    document.documentElement.classList.add("export-mode");
    return () => document.documentElement.classList.remove("export-mode");
  }, []);

  const handleEntered = useCallback(() => {
    setPhase("idle");
    window.setTimeout(() => setPhase("leave"), GLITCH_HOLD_MS);
  }, []);

  const handleLeft = useCallback(() => {
    window.setTimeout(() => {
      setGeneration((current) => current + 1);
      setPhase("enter");
    }, BLACK_HOLD_MS);
  }, []);

  return (
    <div className="export-stage">
      <PixelGrid
        key={generation}
        mask="mable"
        phase={phase}
        onEntered={handleEntered}
        onLeft={handleLeft}
      />
    </div>
  );
}
