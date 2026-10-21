import { useCallback, useEffect, useRef, useState } from "react";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { CursorFx, useCursorFx } from "./CursorFx";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const HOLD_MS = 3000;

type SplashScreenProps = {
  onReveal: () => void;
  onFinished: () => void;
};

export function SplashScreen({ onReveal, onFinished }: SplashScreenProps) {
  const [phase, setPhase] = useState<GridPhase>("enter");
  const [dismissing, setDismissing] = useState(false);
  const cursor = useCursorFx();
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  useSmoothGridScale(clusterRef, frameRef);

  const handleEntered = useCallback(() => {
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (phase !== "idle") return;
    const id = window.setTimeout(() => setPhase("leave"), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const handleLeft = useCallback(() => {
    onReveal();
    setDismissing(true);
  }, [onReveal]);

  useEffect(() => {
    if (!dismissing) return;
    const id = window.setTimeout(onFinished, 700);
    return () => window.clearTimeout(id);
  }, [dismissing, onFinished]);

  return (
    <main
      className={`splash${dismissing ? " is-dismissing" : ""}`}
    >
      <div className="splash-cluster" ref={clusterRef}>
        <div className="splash-grid-frame" ref={frameRef}>
          <PixelGrid
            mask="mable"
            phase={phase}
            onEntered={handleEntered}
            onLeft={handleLeft}
          />
        </div>
        <p className={`intro-tagline${phase === "leave" ? " is-out" : ""}`}>
          A DESIGN X CODE STUDIO!
        </p>
      </div>
      <CursorFx
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible && !dismissing}
        bursts={cursor.bursts}
        onBurstDone={cursor.onBurstDone}
      />
    </main>
  );
}
