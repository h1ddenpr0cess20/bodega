/**
 * Converts screen-space movement into the store's X/Z plane.
 *
 * The camera looks down the diagonal by default and can be orbited. Controls
 * must therefore follow the camera, not stay pinned to world north/east.
 * vertical is positive for W / ArrowUp; horizontal is positive for D / ArrowRight.
 */
export function screenMovementToWorld(horizontal, vertical, yaw) {
  const h = Number.isFinite(horizontal) ? horizontal : 0;
  const v = Number.isFinite(vertical) ? vertical : 0;
  const angle = Number.isFinite(yaw) ? yaw : Math.PI / 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Camera-relative screen-right and screen-up ground axes.
  const x = h * cos - v * sin;
  const z = -h * sin - v * cos;
  const magnitude = Math.hypot(x, z);
  if (magnitude < 1e-8) return [0, 0];
  return [x / magnitude, z / magnitude];
}
