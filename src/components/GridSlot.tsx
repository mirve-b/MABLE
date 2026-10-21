import { useRef, type ReactNode } from "react";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import type { MaskName } from "../grid/masks";
import { PixelGrid, type GridPhase } from "./PixelGrid";

type GridSlotProps = {
  className?: string;
  mask: MaskName;
  phase: GridPhase;
  resetKey?: string | number;
  maxScale?: number;
  onEntered: () => void;
  onLeft: () => void;
  children?: ReactNode;
};

export function GridSlot({
  className,
  mask,
  phase,
  resetKey = 0,
  maxScale = 1,
  onEntered,
  onLeft,
  children,
}: GridSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  useSmoothGridScale(clusterRef, frameRef, {
    mode: "width",
    measureRef: slotRef,
    maxScale,
    pad: 0,
  });

  return (
    <div className={className} ref={slotRef}>
      <div className="splash-cluster" ref={clusterRef}>
        <div className="splash-grid-frame" ref={frameRef}>
          <PixelGrid
            key={`${mask}-${resetKey}`}
            mask={mask}
            phase={phase}
            onEntered={onEntered}
            onLeft={onLeft}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
