import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { DESKTOP_SCALE, GRID_HEIGHT, GRID_WIDTH } from "../grid/constants";

const PAD = 32;
const LERP = 0.22;

type GridScaleOptions = {
  maxScale?: number;
  pad?: number;
  /** viewport fills the screen; width fills the measure element. */
  mode?: "viewport" | "width";
  measureRef?: RefObject<HTMLElement | null>;
};

function viewportScale(maxScale: number, pad: number) {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  const byWidth = (width - pad) / GRID_WIDTH;
  const byHeight = (height - pad) / GRID_HEIGHT;
  return Math.max(0.25, Math.min(maxScale, byWidth, byHeight));
}

export function useSmoothGridScale(
  clusterRef: RefObject<HTMLElement | null>,
  frameRef: RefObject<HTMLElement | null>,
  options?: GridScaleOptions,
) {
  const mode = options?.mode ?? "viewport";
  const maxScale = options?.maxScale ?? DESKTOP_SCALE;
  const pad = options?.pad ?? (mode === "width" ? 0 : PAD);
  const measureRef = options?.measureRef;

  useLayoutEffect(() => {
    const cluster = clusterRef.current;
    const frame = frameRef.current;
    if (!cluster || !frame) return;

    const measure = () => {
      if (mode === "width") {
        const width = measureRef?.current?.clientWidth ?? 0;
        if (width <= 0) return 0.45;
        return Math.max(0.2, Math.min(maxScale, (width - pad) / GRID_WIDTH));
      }
      return viewportScale(maxScale, pad);
    };

    let dest = measure();
    let current = dest;

    const apply = (scale: number) => {
      const grid = frame.querySelector(".pixel-grid");
      if (!(grid instanceof HTMLElement)) return;

      cluster.style.setProperty("--mark-scale", scale.toFixed(4));
      frame.style.setProperty("--grid-scale", scale.toFixed(4));
      gsap.set(cluster, { width: GRID_WIDTH * scale });
      gsap.set(frame, {
        width: GRID_WIDTH * scale,
        height: GRID_HEIGHT * scale,
      });
      gsap.set(grid, {
        xPercent: -50,
        yPercent: -50,
        scale,
        transformOrigin: "center center",
        force3D: true,
      });
    };

    apply(current);

    const onResize = () => {
      dest = measure();
    };

    const tick = () => {
      const delta = dest - current;
      if (Math.abs(delta) < 0.0004) {
        if (current !== dest) {
          current = dest;
          apply(current);
        }
        return;
      }
      current += delta * LERP;
      apply(current);
    };

    const observed = mode === "width" ? measureRef?.current : null;
    const observer =
      observed && "ResizeObserver" in window
        ? new ResizeObserver(onResize)
        : null;
    observer?.observe(observed as Element);

    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize);
    gsap.ticker.add(tick);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
    };
  }, [clusterRef, frameRef, measureRef, mode, maxScale, pad]);
}