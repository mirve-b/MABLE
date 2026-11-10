import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const BABY_PINK = "#FFC1DC";
const HOLD_MS = 280;

export function LogoBurst({ onDone }: { onDone: () => void }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = useState<GridPhase>(reduce ? "idle" : "enter");

  useSmoothGridScale(clusterRef, frameRef, {
    mode: "width",
    measureRef: slotRef,
    maxScale: 1.05,
    pad: 0,
  });

  const onEntered = useCallback(() => setPhase("idle"), []);
  const onLeft = useCallback(() => onDoneRef.current(), []);

  useLayoutEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.style.setProperty("--pixel", BABY_PINK);
    const grid = cluster.querySelector(".pixel-grid");
    if (grid instanceof HTMLElement) grid.style.setProperty("--pixel", BABY_PINK);
  }, []);

  useLayoutEffect(() => {
    if (reduce) {
      const skip = window.setTimeout(() => onDoneRef.current(), 0);
      return () => window.clearTimeout(skip);
    }
    if (phase !== "idle") return;
    const id = window.setTimeout(() => setPhase("leave"), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase, reduce]);

  return (
    <div className="logo-burst" aria-hidden="true">
      <div className="logo-burst-mark intro-mark" ref={slotRef}>
        <div
          className="splash-cluster"
          ref={clusterRef}
          style={{ ["--pixel" as string]: BABY_PINK }}
        >
          <div className="splash-grid-frame" ref={frameRef}>
            <PixelGrid
              mask="mable"
              phase={phase}
              pace="fast"
              onEntered={onEntered}
              onLeft={onLeft}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
