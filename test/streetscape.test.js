import test from 'node:test';
import assert from 'node:assert/strict';
import { STREET } from 'madness-engine/scenery/street';
import { STREETSCAPE, STREET_MODELS } from '../src/streetscape.js';
import { SIDEWALK, SIDEWALK_SPAWN, SIDEWALK_EXITS, DOOR_IN, CHECKOUT, FRONT_DOOR, planWalkRoute, pointOnRoute } from '../src/layout.js';

test('the street is dressed only with the engine\'s own street furniture', () => {
  assert.ok(STREETSCAPE.length >= 8);
  for (const placement of STREETSCAPE) {
    assert.ok(STREET[placement.model], `${placement.model} is not in scenery/street`);
    assert.equal(STREET_MODELS[placement.model].sculpt, STREET[placement.model].sculpt, 'it is the engine\'s sculpt');
    assert.ok(Number.isFinite(placement.x) && Number.isFinite(placement.z) && placement.r > 0);
  }
  for (const name of ['streetlamp', 'hydrant', 'bin', 'bench', 'mailbox', 'shrub', 'dumpster']) assert.ok(STREETSCAPE.some((p) => p.model === name), `no ${name}`);
});

test('street furniture stands on the sidewalk, by the door, or in the alley, and never on top of each other', () => {
  for (const p of STREETSCAPE) {
    const onSidewalk = p.z >= SIDEWALK.minZ && p.z <= SIDEWALK.maxZ + 0.15;
    const inAlley = p.z <= -7.3;
    assert.ok(onSidewalk || inAlley, `${p.model} at z = ${p.z} is in the road or inside the shop`);
  }
  for (let i = 0; i < STREETSCAPE.length; i++) for (let j = i + 1; j < STREETSCAPE.length; j++) {
    const a = STREETSCAPE[i], b = STREETSCAPE[j];
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= a.r + b.r, `${a.model} and ${b.model} overlap`);
  }
});

test('nothing on the street stands in the way of a customer walking in, or out either side', () => {
  const routes = [
    planWalkRoute(SIDEWALK_SPAWN, [DOOR_IN, CHECKOUT]),
    ...SIDEWALK_EXITS.map((exit) => planWalkRoute(CHECKOUT, [DOOR_IN, exit])),
  ];
  for (const route of routes) {
    for (let t = 0; t <= 1; t += 0.01) {
      const [x, , z] = pointOnRoute(route, t);
      for (const p of STREETSCAPE) assert.ok(Math.hypot(x - p.x, z - p.z) >= p.r + 0.2, `a walker at (${x.toFixed(1)}, ${z.toFixed(1)}) runs into the ${p.model}`);
    }
  }
  const door = [FRONT_DOOR.x, 7.5];
  for (const p of STREETSCAPE) assert.ok(Math.hypot(door[0] - p.x, door[1] - p.z) > p.r + 0.6, `the ${p.model} blocks the doorway`);
});
