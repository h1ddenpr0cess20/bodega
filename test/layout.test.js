import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLOTS, NAV_BLOCKERS, CAT_PATROLS, SIDEWALK_SPAWN, SIDEWALK_EXITS, DOOR_IN, CHECKOUT, LOU_HOME, MARISOL_HOME,
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

test('the cooler wall starts out as one run of coolers along the back wall, without gaps', async () => {
  const { PIECES, footprint, INNER } = await import('../src/layout.js');
  const run = PIECES.filter((p) => p.type === 'cooler' && p.always).map((p) => footprint(p, p.home)).sort((a, b) => a.x - b.x);
  assert.equal(run.length, 4);
  for (let i = 1; i < run.length; i++) assert.ok(Math.abs((run[i - 1].x + run[i - 1].w / 2) - (run[i].x - run[i].w / 2)) < 1e-9, 'a gap between two coolers');
  for (const box of run) assert.ok(Math.abs(box.z - box.d / 2 - INNER.minZ) < 1e-9, 'flat to the back wall');
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
  const { GONDOLA, LEVELS, COOLER_HEIGHT, COOLER_LEVELS, SLOTS } = await import('../src/layout.js');
  // Product heights as sculpted (tiles): the engine's grocery props; the tallest on a gondola is the cereal box, in a cooler the cola.
  const heights = { cereal: 0.42, pasta: 0.34, rice: 0.246, beans: 0.158, coffee: 0.286, soda: 0.468, water: 0.354, milk: 0.282, pizza: 0.38 };
  for (const [id, h] of Object.entries(heights)) {
    const slot = SLOTS[id];
    const ceiling = slot.kind === 'gondola' ? GONDOLA.height - 0.1 : COOLER_HEIGHT;
    assert.ok(slot.y + h < ceiling, `${id} (${(slot.y + h).toFixed(2)}) reaches the top of its fixture (${ceiling.toFixed(2)})`);
  }
  assert.ok(LEVELS.at(-1) + heights.cereal < GONDOLA.height - 0.1);
  assert.ok(COOLER_LEVELS.at(-1) + heights.soda < COOLER_HEIGHT);
});

test('with every shelf, bin and cooler bought the shop still works: nothing is walled in and every line can be reached', async () => {
  const { setLayout, PIECES } = await import('../src/layout.js');
  const { FIXTURES } = await import('../src/sim.js');
  const ids = FIXTURES.map((f) => f.id);
  assert.ok(PIECES.every((piece) => piece.fixtures.every((id) => ids.includes(id))), 'every piece belongs to fixtures that can be bought');
  setLayout([], {});
  const bare = navBlocked(-5.0, 1.35) || navBlocked(3.2, -2.4) || navBlocked(8.35, -3.5);
  assert.equal(bare, false, 'nothing is in the way until it is bought');
  setLayout(ids, {});
  try {
    assert.equal(navBlocked(-5.0, 1.35), true, 'a bought bin blocks the floor');
    assert.equal(navBlocked(3.2, -2.4), true, 'a bought gondola blocks the floor');
    assert.equal(navBlocked(8.35, -3.5), true, 'a bought cooler blocks the floor');
    for (const product of PRODUCTS) {
      const [x, z] = SLOTS[product.id].stand;
      assert.equal(navBlocked(x, z), false, `${product.id}: the browsing spot (${x}, ${z}) is blocked`);
      assert.ok(strict(SIDEWALK_SPAWN, [x, 0, z]), `${product.id}: no way from the street`);
      assert.ok(strict(MARISOL_HOME, [x, 0, z]), `Marisol cannot reach ${product.id}`);
    }
    assert.ok(strict(SIDEWALK_SPAWN, CHECKOUT));
    // Cats find their way round, so every patrol stop has to be somewhere they can stand.
    for (const patrol of CAT_PATROLS) for (const [x, z] of patrol) assert.ok(!navBlocked(x, z) || nearestWalkable(x, z), `a cat stop at (${x}, ${z})`);
  } finally { setLayout([], {}); }
});

test('bought pieces can be moved: shelves and bins stand clear of walls, coolers go flat against one, and nothing may shut the shop off', async () => {
  const { placementProblem, canPlace, snapPlacement, setLayout, INNER } = await import('../src/layout.js');
  const all = ['bin-1', 'bin-2', 'bin-3', 'bin-4', 'bin-5', 'shelf-2', 'shelf-3', 'shelf-4', 'shelf-5', 'shelf-6', 'shelf-7', 'cooler-1', 'cooler-2'];
  // Where they start is fine.
  const { PIECES: every } = await import('../src/layout.js');
  for (const piece of every) { assert.equal(placementProblem(piece.id, piece.home, all), null, piece.id); assert.equal(canPlace(piece.id, piece.home, all), null, `${piece.id} at home`); }
  // Open floor is fine for a shelf or bin, in any turn.
  for (const rot of [0, 1, 2, 3]) assert.equal(canPlace('bin-1', { x: 2.2, z: 1.0, rot }, all), null, `turn ${rot}`);
  // But never against a wall, on any side.
  assert.equal(placementProblem('bin-1', { x: INNER.maxX - 0.65, z: -2, rot: 0 }, ['bin-1']), 'wall');
  assert.ok(['wall', 'blocked'].includes(placementProblem('gondola-2', { x: 0, z: INNER.maxZ - 0.5, rot: 0 }, all)), 'a shelf cannot stand against the front wall');
  assert.equal(placementProblem('gondola-2', { x: 0, z: INNER.minZ + 1.1, rot: 0 }, all), 'blocked', 'the cooler wall is in the way of its back');
  assert.equal(placementProblem('bin-1', { x: 40, z: 0, rot: 0 }, all), 'out');
  // Not on top of another fixture, nor in the doorway.
  assert.equal(placementProblem('bin-1', { x: -1.6, z: -2.4, rot: 0 }, all), 'blocked');
  assert.equal(placementProblem('bin-1', { x: 2.4, z: 5.6, rot: 0 }, all), 'blocked');
  // A cooler goes flat against a wall, glass facing in, and a floating one is refused.
  const onFront = snapPlacement('cooler-1', -1, 6.9);
  assert.deepEqual(onFront, { rot: 2, x: -1, z: INNER.maxZ - 0.5 });
  assert.equal(canPlace('cooler-1', onFront, all), null, 'against the front wall, where the windows are');
  const onRight = snapPlacement('cooler-1', 8.8, -5);
  assert.equal(onRight.rot, 3);
  assert.equal(canPlace('cooler-1', onRight, all), null);
  assert.equal(placementProblem('cooler-1', { x: 0, z: 2, rot: 0 }, all), 'needs-wall');
  assert.equal(placementProblem('cooler-1', { x: 8.35, z: -3.5, rot: 1 }, all), 'needs-wall', 'facing the wrong way');
  assert.equal(placementProblem('cooler-1', snapPlacement('cooler-1', -8.8, 3), all), 'blocked', 'the produce bins already stand on that wall');
  // A spot the customers queue on is not for a shelf, even though nothing is built there.
  assert.equal(placementProblem('bin-1', { x: 4.9, z: 3.0, rot: 0 }, all), null);
  assert.equal(canPlace('bin-1', { x: 4.9, z: 3.0, rot: 0 }, all), 'door', 'it would sit on the front of the checkout queue');
  // A moved piece takes its stock with it.
  setLayout(all, { 'bin-1': { x: 2.2, z: 1.0, rot: 0 } });
  try {
    assert.ok(Math.abs(SLOTS.oranges.x - 2.2) < 1e-9 && Math.abs(SLOTS.oranges.z - 1.0) < 1e-9, 'oranges follow their bin');
    assert.ok(Math.abs(SLOTS.oranges.stand[1] - 2.6) < 1e-9, 'shoppers stand in front of it');
    assert.equal(navBlocked(2.2, 1.0), true);
    assert.equal(navBlocked(-5.0, -0.1), false, 'its old place is free floor again');
  } finally { setLayout([], {}); }
});
