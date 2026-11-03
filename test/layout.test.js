import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLOTS, COOLERS, NAV_BLOCKERS, CAT_PATROLS, SIDEWALK_SPAWN, SIDEWALK_EXITS, DOOR_IN, CHECKOUT, LOU_HOME, MARISOL_HOME,
  MANAGER_HOME, PLAYER_HOME, BACKROOM, FRONT_DOOR, navBlocked, findWalkPath, planWalkRoute, routeLength, pointOnRoute,
} from '../src/layout.js';
import { PRODUCTS } from '../src/sim.js';
import { wallOpacity, easeOpacity, GHOST_OPACITY } from '../src/walls.js';

const strict = (a, b) => findWalkPath(a, b, { strict: true });

test('every product has a shelf slot, and a shopper can stand and reach it from the door', () => {
  for (const product of PRODUCTS) {
    const slot = SLOTS[product.id];
    assert.ok(slot, `${product.id} has no slot`);
    assert.ok(slot.width > 0.4 && slot.depth > 0.3, `${product.id} slot size`);
    const [x, z] = slot.stand;
    assert.equal(navBlocked(x, z), false, `${product.id}: the browsing spot (${x}, ${z}) is blocked`);
    assert.ok(strict(SIDEWALK_SPAWN, [x, 0, z]), `${product.id}: no way from the street to its shelf`);
  }
});

test('no two products share a shelf slot', () => {
  const seen = new Set();
  for (const [id, s] of Object.entries(SLOTS)) {
    const key = [s.kind, s.y, s.z.toFixed(2), s.yaw.toFixed(2), s.x.toFixed(1)].join('|');
    assert.ok(!seen.has(key), `${id} overlaps another slot`);
    seen.add(key);
  }
});

test('the cooler sections cover the back wall without gaps', () => {
  const [first, ...rest] = COOLERS.sections;
  let edge = first.x1;
  for (const section of rest) { assert.equal(section.x0, edge); edge = section.x1; }
});

test('the door opens onto the sidewalk and shoppers can get from the street, to the till, and back out', () => {
  assert.equal(navBlocked(FRONT_DOOR.x, 7), false, 'the doorway is blocked');
  assert.equal(navBlocked(FRONT_DOOR.x - FRONT_DOOR.width / 2 - 0.5, 7), true, 'the front wall is solid beside the door');
  assert.ok(strict(SIDEWALK_SPAWN, DOOR_IN));
  assert.ok(strict(DOOR_IN, CHECKOUT));
  for (const exit of SIDEWALK_EXITS) assert.ok(strict(CHECKOUT, exit), 'no way out from the till');
  const route = planWalkRoute(SIDEWALK_SPAWN, [CHECKOUT]);
  let throughDoor = false;
  for (let t = 0; t <= 1; t += 0.005) {
    const [x, , z] = pointOnRoute(route, t);
    if (Math.abs(z - 7) < 0.1) { throughDoor = true; assert.ok(Math.abs(x - FRONT_DOOR.x) < FRONT_DOOR.width / 2, `crosses the front wall at x = ${x.toFixed(2)}, not through the door`); }
  }
  assert.ok(throughDoor, 'the route to the till crosses the front wall');
});

test('the checkout is a real counter: staff can stand behind it and nobody can walk through it', () => {
  assert.equal(navBlocked(...CHECKOUT.filter((_, i) => i !== 1)), false);
  assert.equal(navBlocked(6.4, 3.0), true, 'the counter blocks movement');
  assert.equal(navBlocked(LOU_HOME[0], LOU_HOME[2]), false, 'Lou has a place behind the counter');
});

test('the backroom is walled off but open at its door to the floor, and Marisol can get out to the shelves', () => {
  assert.equal(navBlocked(BACKROOM.doorX, BACKROOM.maxZ), false, 'the backroom door is passable');
  assert.equal(navBlocked(BACKROOM.maxX, -4.5), true, 'the backroom wall is solid');
  assert.equal(navBlocked(-7.9, BACKROOM.maxZ), true, 'the backroom partition is solid beside its door');
  for (const home of [MARISOL_HOME, MANAGER_HOME]) assert.equal(navBlocked(home[0], home[2]), false, `${home} is blocked`);
  for (const product of PRODUCTS) assert.ok(strict(MARISOL_HOME, [SLOTS[product.id].stand[0], 0, SLOTS[product.id].stand[1]]), `Marisol cannot reach ${product.id}`);
  assert.ok(strict(MARISOL_HOME, MANAGER_HOME));
});

test('the owner starts somewhere open, and every cat patrol stop is a place a cat can reach', () => {
  assert.equal(navBlocked(PLAYER_HOME[0], PLAYER_HOME[2]), false);
  for (const patrol of CAT_PATROLS) {
    for (const [x, z] of patrol) assert.equal(navBlocked(x, z), false, `patrol stop (${x}, ${z}) is blocked`);
    for (let i = 0; i < patrol.length; i++) {
      const [ax, az] = patrol[i], [bx, bz] = patrol[(i + 1) % patrol.length];
      assert.ok(strict([ax, 0, az], [bx, 0, bz]), `patrol leg ${i} has no route`);
    }
  }
});

test('routes avoid every fixture', () => {
  const route = planWalkRoute(SIDEWALK_SPAWN, [[SLOTS.beans.stand[0], 0, SLOTS.beans.stand[1]], [SLOTS.apples.stand[0], 0, SLOTS.apples.stand[1]], CHECKOUT]);
  const length = routeLength(route);
  for (let t = 0; t <= 1; t += 0.01) {
    const [x, , z] = pointOnRoute(route, t);
    assert.equal(navBlocked(x, z), false, `the route passes through a fixture at (${x.toFixed(2)}, ${z.toFixed(2)})`);
  }
  assert.ok(length > 15);
  assert.ok(NAV_BLOCKERS.length > 10);
});

test('walls between the camera and the shop fade; walls behind it stay solid', () => {
  const center = [0, 0];
  const front = { center, normal: [0, 1] };
  assert.equal(wallOpacity({ ...front, camera: [0, -20] }), 1, 'a wall behind the shop stays solid');
  assert.equal(wallOpacity({ ...front, camera: [20, 0] }), 1, 'a wall to the side stays solid');
  assert.equal(wallOpacity({ ...front, camera: [0, 20] }), GHOST_OPACITY, 'the wall facing the camera ghosts');
  const slanted = wallOpacity({ ...front, camera: [10, 16] });
  assert.ok(slanted < 1 && slanted >= GHOST_OPACITY);
  // A partition hides the shop from either side.
  assert.equal(wallOpacity({ center, normal: [1, 0], both: true, camera: [-20, 0] }), GHOST_OPACITY);
  assert.equal(wallOpacity({ center, normal: [1, 0], both: true, camera: [20, 0] }), GHOST_OPACITY);
  assert.equal(wallOpacity({ center, normal: [1, 0], both: true, camera: [0, 20] }), 1);
  // And the wall mode overrides it all.
  assert.equal(wallOpacity({ ...front, camera: [0, 20], mode: 'solid' }), 1);
  assert.equal(wallOpacity({ ...front, camera: [0, -20], mode: 'ghost' }), GHOST_OPACITY);
});

test('a fading wall eases toward its target at the same pace at any frame rate', () => {
  let a = 1, b = 1;
  for (let i = 0; i < 30; i++) a = easeOpacity(a, 0.1, 1 / 30);
  for (let i = 0; i < 120; i++) b = easeOpacity(b, 0.1, 1 / 120);
  assert.ok(Math.abs(a - b) < 0.01, `${a} vs ${b}`);
  assert.equal(easeOpacity(0.1, 0.1, 0.016), 0.1);
  for (let i = 0; i < 200; i++) a = easeOpacity(a, 1, 1 / 60);
  assert.equal(a, 1);
});

test('the tallest thing on each shelf clears the fixture above it', async () => {
  const { GONDOLA, LEVELS, COOLERS, COOLER_LEVELS, SLOTS } = await import('../src/layout.js');
  // Product heights as sculpted (tiles): the engine's grocery props; the tallest on a gondola is the cereal box, in a cooler the cola.
  const heights = { cereal: 0.42, pasta: 0.34, rice: 0.246, beans: 0.158, coffee: 0.286, soda: 0.468, water: 0.354, milk: 0.282, pizza: 0.38 };
  for (const [id, h] of Object.entries(heights)) {
    const slot = SLOTS[id];
    const ceiling = slot.kind === 'gondola' ? GONDOLA.height - 0.1 : COOLERS.height;
    assert.ok(slot.y + h < ceiling, `${id} (${(slot.y + h).toFixed(2)}) reaches the top of its fixture (${ceiling.toFixed(2)})`);
  }
  assert.ok(LEVELS.at(-1) + heights.cereal < GONDOLA.height - 0.1);
  assert.ok(COOLER_LEVELS.at(-1) + heights.soda < COOLERS.height);
});
