/**
 * Walls that get out of the way. Every wall of the shop has an outward normal;
 * when the camera is out beyond a wall, looking in over it, that wall would hide
 * the shop, so it fades to a ghost. Walls the camera is behind or beside stay solid.
 * Partitions inside the shop (the backroom's) hide the view from either side, so
 * they fade whichever way the camera is on.
 */

/** How see-through a faded wall gets: a faint ghost, not gone, so the building still reads. */
export const GHOST_OPACITY = 0.07;

/** The cosines (of the angle between the camera's direction from the shop and a wall's normal) where fading starts and is complete. */
export const FADE_START = 0.12;
export const FADE_FULL = 0.5;

export const WALL_MODES = ['auto', 'solid', 'ghost'];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * The opacity a wall should have: 1 solid down to GHOST_OPACITY.
 * `camera` and `center` are [x, z] (the camera, and the middle of the shop it looks at);
 * `normal` is the wall's outward [x, z]; `both` is for a wall with two faces to hide behind.
 */
export function wallOpacity({ camera, center, normal, both = false, mode = 'auto' }) {
  if (mode === 'solid') return 1;
  if (mode === 'ghost') return GHOST_OPACITY;
  const dx = camera[0] - center[0], dz = camera[1] - center[1];
  const length = Math.hypot(dx, dz);
  if (length < 1e-6) return 1;
  const facing = (dx * normal[0] + dz * normal[1]) / (length * (Math.hypot(normal[0], normal[1]) || 1));
  const t = clamp01(((both ? Math.abs(facing) : facing) - FADE_START) / (FADE_FULL - FADE_START));
  return t >= 1 ? GHOST_OPACITY : 1 - t * (1 - GHOST_OPACITY);
}

/** Ease a wall's current opacity toward its target, at the same pace whatever the frame rate. */
export function easeOpacity(current, target, dt, rate = 7) {
  const k = 1 - Math.exp(-Math.max(0, dt) * rate);
  const next = current + (target - current) * k;
  return Math.abs(next - target) < 0.004 ? target : next;
}
