import { useEffect, useMemo, type CSSProperties } from "react";
import { COLS, ROWS } from "../grid/constants";
import { isCellOn, type MaskName } from "../grid/masks";
import { usePixelGlitches } from "../hooks/usePixelGlitches";

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

  const drawn = useMemo(() => {
    const extra = new Set(offNearby);
    return CELLS.filter(
      ({ index, col, row }) => isCellOn(mask, col, row) || extra.has(index),
    );
  }, [mask, offNearby]);

  const timings = useMemo(
    () =>
      drawn.map(() => ({
        inDelay: 0.03 + Math.random() * 0.82,
        inDur: 0.1 + Math.random() * 0.2,
        outDelay: 0.02 + Math.random() * 0.4,
        outDur: 0.1 + Math.random() * 0.16,
      })),
    [drawn],
  );

  const glitches = usePixelGlitches(onIds, offNearby, phase === "idle");

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
    <div className={`pixel-grid is-${phase}`} aria-hidden="true">
      {drawn.map((cell, drawIndex) => {
        const { index, col, row } = cell;
        const on = isCellOn(mask, col, row);
        const glitch = glitches[index];
        const leaving = on && phase === "leave";
        const entering = on && phase !== "leave";
        const timing = timings[drawIndex]!;

        return (
          <span
            key={index}
            className={[
              "pixel-cross",
              entering ? "is-on" : "",
              leaving ? "is-leaving" : "",
              glitch ? "is-glitching" : "",
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
                "--glitch-color": glitch?.color ?? "#FE63A0",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
