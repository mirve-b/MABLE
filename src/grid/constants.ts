export const COLS = 42;
export const ROWS = 22;

/** Figma canvas, CSS pixels at desktop scale 1. */
export const GRID_WIDTH = 421;
export const GRID_HEIGHT = 221;

/** One cross stitch, CSS pixels at desktop scale 1. */
export const CROSS_WIDTH = 10;
export const CROSS_HEIGHT = 9;

/**
 * Distance from one cell origin to the next.
 * 42×10 + 1px trailing grid line = 421.
 * 22×10 + 1px trailing grid line = 221.
 */
export const CELL_PITCH = 10;

/** Glow / hero-edge stitch: 8px square on a 12px pitch. */
export const GLOW_STEP = 12;
export const GLOW_INNER = 8;

/** Max scale; actual size is min(this, viewport / grid). */
export const DESKTOP_SCALE = 1.85;
export const MOBILE_BREAKPOINT = 600;
