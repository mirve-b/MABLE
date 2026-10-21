import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { DESKTOP_SCALE, GRID_HEIGHT, GRID_WIDTH } from "../grid/constants";

const PAD = 32;
const LERP = 0.22;

function fitScale() {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  const byWidth = (width - PAD) / GRID_WIDTH;
  const byHeight = (height - PAD) / GRID_HEIGHT;
  return Math.max(0.25, Math.min(DESKTOP_SCALE, byWidth, byHeight));
}

export function useSmoothGridScale(
  clusterRef: RefObject<HTMLElement | null>,
  frameRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const cluster = clusterRef.current;
    const frame = frameRef.current;
    if (!cluster || !frame) return;

    let dest = fitScale();
    let current = dest;

    const apply = (scale: number) => {
      const grid = frame.querySelector(".pixel-grid");
      if (!(grid instanceof HTMLElement)) return;

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
      dest = fitScale();
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

    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize);
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
    };
  }, [clusterRef, frameRef]);
}