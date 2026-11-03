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

/**
 * Which pointer presses move the camera. With a mouse it is the middle button
 * (click the wheel and drag), which leaves the left button free for clicking and
 * the right for the context menu. Touch screens have no middle button, so a
 * finger or a pen touching the scene drags it instead.
 */
export function startsCameraDrag({ pointerType = 'mouse', button = 0 } = {}) {
  return pointerType === 'mouse' ? button === 1 : button === 0;
}

/** Whether a pointer that is moving is still holding the camera: a mouse needs the middle button (bit 4) still down. */
export function holdsCameraDrag({ pointerType = 'mouse', buttons = 0 } = {}) {
  return pointerType === 'mouse' ? (buttons & 4) !== 0 : true;
}

/** Whether releasing this button lets go of the camera: for a mouse only the middle button does, so a left click during a drag does not. */
export function endsCameraDrag({ pointerType = 'mouse', button = 0 } = {}) {
  return pointerType === 'mouse' ? button === 1 : true;
}
