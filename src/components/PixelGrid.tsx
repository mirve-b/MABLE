import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { COLS, ROWS } from "../grid/constants";
import { isCellOn, type MaskName } from "../grid/masks";
import { usePixelGlitches } from "../hooks/usePixelGlitches";
import { usePixelHeat } from "../hooks/usePixelHeat";

export type GridPhase = "enter" | "idle" | "leave";

type PixelGridProps = {
  mask: MaskName;
  phase: GridPhase;
  onEntered: () => void;
  onLeft: () => void;
};

const CELLS = Array.from({ length: COLS * ROWS }, (_, index) => ({
  index,
  col: index % COLS,
  row: Math.floor(index / COLS),
}));

export const ENTER_MS = 1100;
export const LEAVE_MS = 720;

export function PixelGrid({
  mask,
  phase,
  onEntered,
  onLeft,
}: PixelGridProps) {
  const timings = useMemo(
    () =>
      CELLS.map(() => ({
        inDelay: 0.03 + Math.random() * 0.82,
        inDur: 0.1 + Math.random() * 0.2,
        outDelay: 0.02 + Math.random() * 0.4,
        outDur: 0.1 + Math.random() * 0.16,
      })),
    [],
  );

  const litCells = useMemo(
    () => CELLS.filter(({ col, row }) => isCellOn(mask, col, row)),
    [mask],
  );

  const onIds = useMemo(
    () => litCells.map((cell) => cell.index),
    [litCells],
  );

  const offNearby = useMemo(() => {
    if (litCells.length === 0) return [] as number[];
    const rows = litCells.map((cell) => cell.row);
    const minRow = Math.max(0, Math.min(...rows) - 1);
    const maxRow = Math.min(ROWS - 1, Math.max(...rows) + 1);
    return CELLS.filter(
      ({ col, row }) =>
        row >= minRow && row <= maxRow && !isCellOn(mask, col, row),
    ).map((cell) => cell.index);
  }, [mask, litCells]);

  const gridRef = useRef<HTMLDivElement>(null);
  usePixelGlitches(gridRef, onIds, offNearby, phase === "idle");
  usePixelHeat(gridRef);

  useEffect(() => {
    if (phase !== "enter") return;
    const id = window.setTimeout(onEntered, ENTER_MS);
    return () => window.clearTimeout(id);
  }, [phase, onEntered]);

  useEffect(() => {
    if (phase !== "leave") return;
    const id = window.setTimeout(onLeft, LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [phase, onLeft]);

  return (
    <div className={`pixel-grid is-${phase}`} ref={gridRef} aria-hidden="true">
      {CELLS.map(({ index, col, row }) => {
        const on = isCellOn(mask, col, row);
        const leaving = on && phase === "leave";
        const entering = on && phase !== "leave";
        const timing = timings[index]!;

        return (
          <span
            key={index}
            className={[
              "pixel-cross",
              entering ? "is-on" : "",
              leaving ? "is-leaving" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                "--col": col,
                "--row": row,
                "--intro-delay": `${timing.inDelay}s`,
                "--intro-duration": `${timing.inDur}s`,
                "--out-delay": `${timing.outDelay}s`,
                "--out-duration": `${timing.outDur}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
