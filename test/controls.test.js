import test from 'node:test';
import assert from 'node:assert/strict';
import { screenMovementToWorld } from '../src/controls.js';

const close = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};
const vectorClose = (actual, expected) => {
  close(actual[0], expected[0]);
  close(actual[1], expected[1]);
};

test('WASD follows screen directions at the default diagonal camera angle', () => {
  const q = Math.SQRT1_2;
  const yaw = Math.PI / 4;
  vectorClose(screenMovementToWorld(0, 1, yaw), [-q, -q]); // W
  vectorClose(screenMovementToWorld(0, -1, yaw), [q, q]); // S
  vectorClose(screenMovementToWorld(-1, 0, yaw), [-q, q]); // A
  vectorClose(screenMovementToWorld(1, 0, yaw), [q, -q]); // D
});

test('movement rotates with the camera instead of remaining pinned to world axes', () => {
  const yaw = Math.PI / 2;
  vectorClose(screenMovementToWorld(0, 1, yaw), [-1, 0]); // W
  vectorClose(screenMovementToWorld(1, 0, yaw), [0, -1]); // D
  vectorClose(screenMovementToWorld(0, -1, yaw), [1, 0]); // S
  vectorClose(screenMovementToWorld(-1, 0, yaw), [0, 1]); // A
});

test('diagonal input has the same movement speed as straight input', () => {
  const yaw = 1.1;
  const straight = screenMovementToWorld(0, 1, yaw);
  const diagonal = screenMovementToWorld(1, 1, yaw);
  close(Math.hypot(...straight), 1);
  close(Math.hypot(...diagonal), 1);
});

test('no input produces no movement', () => {
  assert.deepEqual(screenMovementToWorld(0, 0, Math.PI / 4), [0, 0]);
});

test('invalid camera input falls back to the default view rather than returning NaN', () => {
  const q = Math.SQRT1_2;
  vectorClose(screenMovementToWorld(0, 1, Number.NaN), [-q, -q]);
});
