// Rounding helpers (step 8). Always "half up" on positives; the epsilon absorbs floating-point noise.
const EPS = 1e-9;

/** Round to the nearest multiple of `step`, half up (525 with step 10 → 530). */
export const roundTo = (x: number, step: number): number => Math.floor(x / step + 0.5 + EPS) * step;

/** Round to the nearest integer, half up. */
export const roundInt = (x: number): number => Math.floor(x + 0.5 + EPS);

/** Round to one decimal, half up. */
export const round1 = (x: number): number => roundInt(x * 10) / 10;
