/**
 * Shared, render-free pointer state for the splash effects.
 * One window listener; consumers read it inside their own animation frames.
 */
export const pointer = {
  x: -9999,
  y: -9999,
  /** true while a mouse is over the page */
  active: false,
  /** last time the pointer moved (performance.now) */
  movedAt: 0,
};

/** Lit logo cells currently near the cursor (written every frame by usePixelHeat). */
export const hotZone = {
  cells: [] as HTMLElement[],
};

let listeners = 0;

const onMove = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  pointer.movedAt = performance.now();
};

const onLeave = () => {
  pointer.active = false;
};

export function watchPointer() {
  if (listeners === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
  }
  listeners += 1;
  return () => {
    listeners -= 1;
    if (listeners > 0) return;
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
