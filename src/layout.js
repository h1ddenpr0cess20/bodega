/**
 * The store's floor plan and everything that walks across it: the shell's doors,
 * the fixtures and their footprints, where each product is shelved, and the
 * waypoint pathfinder shoppers, staff and cats share. No rendering in here, so
 * it can be tested on its own.
 *
 * x runs left to right, z from the back of the store (negative) to the street
 * (positive). The default camera looks in from the street.
 */

// ——— the shell ———
export const SHELL = { minX: -9, maxX: 9, minZ: -7, maxZ: 7, wall: 0.3, height: 4.4 };
export const FRONT_DOOR = { x: 2.4, width: 1.5 };            // the street door, in the front wall (z = maxZ)
export const REAR_DOOR = { x: -5.7, width: 1.3 };            // the delivery door, in the back wall (z = minZ)
export const BACKROOM = { minX: -8.8, maxX: -4.6, minZ: -6.85, maxZ: -2.2, doorX: -6.7, doorWidth: 1.6 };
export const SIDEWALK = { minZ: 7.15, maxZ: 10.2 };

// ——— shelving ———
export const LEVELS = [0.42, 1.04, 1.66];                     // shelf boards on the dry-goods gondola
export const GONDOLA = { x: -1.6, z: -2.4, length: 4.0, depth: 1.0, height: 2.25 };   // tall enough that a cereal box on the top shelf clears the cap
export const COOLER_LEVELS = [0.46, 1.2];
export const COOLERS = {
  zBack: -6.85, depth: 1.0, height: 1.95,
  sections: [
    { id: 'dairy', label: 'DAIRY', x0: -3.6, x1: -0.2 },
    { id: 'meat', label: 'EGGS · MEAT · DELI', x0: -0.2, x1: 3.2 },
    { id: 'drinks', label: 'COLD DRINKS', x0: 3.2, x1: 5.9 },
    { id: 'frozen', label: 'FROZEN', x0: 5.9, x1: 8.6 },
  ],
};
export const PRODUCE_X = -8.0;
export const PRODUCE_Z = [-0.55, 0.95, 2.45, 3.95, 5.45];
export const BAKERY = { x: -4.6, z: 5.4, w: 2.0, d: 0.9, top: 0.88 };
export const COUNTER = { x: 6.4, z: 3.0, w: 1.0, d: 4.2, top: 1.12 };      // the checkout counter, along the right side
export const BACKBAR = { x: 8.5, z: 3.0, w: 0.6, d: 4.2 };                // the cashier's shelving on the right wall
export const BACKROOM_FIXTURES = {
  rack: { x: -8.2, z: -4.15, w: 0.9, d: 2.5 },
  desk: { x: -7.65, z: -6.4, w: 1.7, d: 0.8 },
  pallet: { x: -5.7, z: -4.3, w: 1.3, d: 1.3 },
};

/**
 * Where each product is shelved: the middle of its slot, the board's height, how
 * wide and deep the slot is, and the way it faces (yaw, radians; 0 faces the
 * street). `kind` says what holds it. `stand` is where a shopper stands to browse.
 */
function slotsFor() {
  const out = {};
  const g = GONDOLA, gw = g.length - 0.3;
  const shelf = (id, face, level) => {
    const s = face > 0 ? 1 : -1;
    out[id] = { kind: 'gondola', x: g.x, y: LEVELS[level], z: g.z + s * 0.27, width: gw, depth: 0.5, yaw: face > 0 ? 0 : Math.PI, stand: [g.x, g.z + s * 1.35] };
  };
  shelf('rice', 1, 0); shelf('pasta', 1, 1); shelf('cereal', 1, 2);
  shelf('beans', -1, 0); shelf('coffee', -1, 1);

  const cooler = (section, rows) => {
    const sec = COOLERS.sections.find((c) => c.id === section);
    const cx = (sec.x0 + sec.x1) / 2, width = sec.x1 - sec.x0 - 0.3;
    rows.forEach((row, level) => row.forEach((id, i) => {
      const half = width / row.length;
      const x = sec.x0 + 0.15 + half * (i + 0.5);
      out[id] = { kind: 'cooler', x, y: COOLER_LEVELS[level], z: COOLERS.zBack + 0.5, width: half - 0.08, depth: 0.74, yaw: 0, stand: [cx, -4.9] };
    }));
  };
  cooler('dairy', [['milk', 'yogurt'], ['cheese', 'butter']]);
  cooler('meat', [['eggs', 'chicken'], ['beef', 'deli']]);
  cooler('drinks', [['soda'], ['water']]);
  cooler('frozen', [['pizza'], ['icecream']]);

  ['apples', 'bananas', 'tomatoes', 'lettuce', 'potatoes'].forEach((id, i) => {
    out[id] = { kind: 'bin', x: PRODUCE_X, y: 0.4, z: PRODUCE_Z[i], width: 1.1, depth: 1.1, yaw: Math.PI / 2, stand: [PRODUCE_X + 1.6, PRODUCE_Z[i]] };
  });
  out.bread = { kind: 'table', x: BAKERY.x, y: BAKERY.top, z: BAKERY.z, width: BAKERY.w - 0.3, depth: 0.6, yaw: 0, stand: [BAKERY.x, BAKERY.z - 1.3] };
  return out;
}
export const SLOTS = slotsFor();

// ——— where people go ———
export const DOOR_IN = [FRONT_DOOR.x, 0, 6.5];
export const SIDEWALK_SPAWN = [FRONT_DOOR.x + 0.2, 0, 9.5];
export const SIDEWALK_EXITS = [[-6.5, 0, 9.5], [8.2, 0, 9.5]];
export const CHECKOUT = [4.9, 0, 3.0];                       // the front of the queue, facing the counter
export const LOU_HOME = [7.55, 0, 3.0];                      // behind the counter
export const MARISOL_HOME = [-7.0, 0, -3.35];                // in the backroom, by the door to the floor
export const MANAGER_HOME = [-6.4, 0, -5.55];                // at the receiving desk
export const PLAYER_HOME = [4.5, 0, 5.2];

export const CAT_PATROLS = [
  [[-6.5, -0.8], [-6.5, 5.9], [-3.2, 5.9], [-3.2, 1.2]],
  [[-3.6, -4.6], [1.0, -4.6], [6.0, -4.6], [6.0, -1.2], [1.0, -1.2], [-3.6, -1.2]],
  [[0.4, 4.2], [4.6, 4.2], [4.6, 5.9], [0.4, 5.9]],
];

/**
 * The street furniture round the shop, from the engine's `scenery/street` (world.js stands the
 * models up; see streetscape.js). x runs along the street, z from the alley (negative) out to the
 * road. Each stands on y = 0 facing +z, turned by `yaw`; `r` is the room it takes up, which people
 * walk round.
 */
export const STREET_ITEMS = [
  // Sodium lamps along the curb, their arms out over the road.
  { model: 'streetlamp', x: -3.4, z: 10.05, yaw: -Math.PI / 2, r: 0.2 },
  { model: 'streetlamp', x: 7.6, z: 10.05, yaw: -Math.PI / 2, r: 0.2 },
  { model: 'hydrant', x: 5.2, z: 10.05, yaw: 0, r: 0.25 },
  { model: 'mailbox', x: 9.9, z: 10.0, yaw: -0.2, r: 0.3 },
  { model: 'bin', x: -8.6, z: 10.0, yaw: 0.3, r: 0.4 },
  { model: 'bench', x: -11.4, z: 9.95, yaw: 0, r: 0.8 },
  // Shrubs either side of the door.
  { model: 'shrub', x: 1.0, z: 7.85, yaw: 0.4, scale: 1.5, r: 0.5 },
  { model: 'shrub', x: 3.8, z: 7.85, yaw: 2.1, scale: 1.5, r: 0.5 },
  // The alley behind the delivery door.
  { model: 'dumpster', x: 8.0, z: -9.4, yaw: 0, r: 1.0 },
  { model: 'bin', x: -3.4, z: -8.3, yaw: 2.6, r: 0.4 },
];


// ——— navigation ———
// Footprints are inflated by `clearance` so a shopper has room for their
// shoulders; the same grid drives shoppers, staff, cats and the owner.
export const NAV = { minX: -8.5, maxX: 8.5, minZ: -6.5, maxZ: 10.3, step: 0.3, clearance: 0.34 };

const w = SHELL.wall;
const doorL = FRONT_DOOR.x - FRONT_DOOR.width / 2, doorR = FRONT_DOOR.x + FRONT_DOOR.width / 2;
const gapL = BACKROOM.doorX - BACKROOM.doorWidth / 2, gapR = BACKROOM.doorX + BACKROOM.doorWidth / 2;
export const NAV_BLOCKERS = [
  // the front wall, broken at the door
  { x: (-SHELL.maxX - 0.1 + doorL) / 2, z: SHELL.maxZ, w: doorL + SHELL.maxX + 0.1, d: w + 0.04 },
  { x: (doorR + SHELL.maxX + 0.1) / 2, z: SHELL.maxZ, w: SHELL.maxX + 0.1 - doorR, d: w + 0.04 },
  // the backroom's walls, broken at the door to the floor
  { x: BACKROOM.maxX, z: (BACKROOM.minZ + BACKROOM.maxZ) / 2, w, d: BACKROOM.maxZ - BACKROOM.minZ },
  { x: (BACKROOM.minX + gapL) / 2, z: BACKROOM.maxZ, w: gapL - BACKROOM.minX, d: w },
  { x: (gapR + BACKROOM.maxX) / 2, z: BACKROOM.maxZ, w: BACKROOM.maxX - gapR, d: w },
  ...Object.values(BACKROOM_FIXTURES),
  ...PRODUCE_Z.map((z) => ({ x: PRODUCE_X, z, w: 1.4, d: 1.4 })),
  { x: BAKERY.x, z: BAKERY.z, w: BAKERY.w, d: BAKERY.d },
  { x: GONDOLA.x, z: GONDOLA.z, w: GONDOLA.length, d: GONDOLA.depth },
  { x: (COOLERS.sections[0].x0 + COOLERS.sections.at(-1).x1) / 2, z: COOLERS.zBack + COOLERS.depth / 2, w: COOLERS.sections.at(-1).x1 - COOLERS.sections[0].x0, d: COOLERS.depth },
  { x: COUNTER.x, z: COUNTER.z, w: COUNTER.w, d: COUNTER.d },
  { x: BACKBAR.x, z: BACKBAR.z, w: BACKBAR.w, d: BACKBAR.d },
  ...STREET_ITEMS.map((p) => ({ x: p.x, z: p.z, w: p.r * 2, d: p.r * 2 })),
];

export function navBlocked(x, z) {
  if (x < NAV.minX || x > NAV.maxX || z < NAV.minZ || z > NAV.maxZ) return true;
  const r = NAV.clearance;
  return NAV_BLOCKERS.some((b) => x >= b.x - b.w / 2 - r && x <= b.x + b.w / 2 + r && z >= b.z - b.d / 2 - r && z <= b.z + b.d / 2 + r);
}

export function nearestWalkable(x, z) {
  const ix = Math.round((x - NAV.minX) / NAV.step);
  const iz = Math.round((z - NAV.minZ) / NAV.step);
  for (let radius = 0; radius <= 12; radius++) {
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
      const gx = NAV.minX + (ix + dx) * NAV.step;
      const gz = NAV.minZ + (iz + dz) * NAV.step;
      if (!navBlocked(gx, gz)) return { ix: ix + dx, iz: iz + dz, x: gx, z: gz };
    }
  }
  return { ix, iz, x, z };
}

function heapPush(heap, item) {
  let i = heap.length;
  heap.push(item);
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent].f <= item.f) break;
    heap[i] = heap[parent]; i = parent;
  }
  heap[i] = item;
}

function heapPop(heap) {
  const first = heap[0];
  const last = heap.pop();
  if (heap.length) {
    let i = 0;
    while (true) {
      let child = i * 2 + 1;
      if (child >= heap.length) break;
      if (child + 1 < heap.length && heap[child + 1].f < heap[child].f) child++;
      if (heap[child].f >= last.f) break;
      heap[i] = heap[child]; i = child;
    }
    heap[i] = last;
  }
  return first;
}

const gridKey = (ix, iz) => `${ix},${iz}`;
const gridWorld = (ix, iz) => [NAV.minX + ix * NAV.step, 0, NAV.minZ + iz * NAV.step];

function segmentClear(a, b) {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const samples = Math.max(2, Math.ceil(Math.hypot(dx, dz) / 0.16));
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    if (navBlocked(a[0] + dx * t, a[2] + dz * t)) return false;
  }
  return true;
}

/**
 * A smoothed route from `start` to `end` ([x, y, z] each) around the fixtures. If
 * there is no way through, it is the straight line between them, or null if `strict`.
 */
export function findWalkPath(start, end, { strict = false } = {}) {
  const source = nearestWalkable(start[0], start[2]);
  const target = nearestWalkable(end[0], end[2]);
  const startKey = gridKey(source.ix, source.iz), targetKey = gridKey(target.ix, target.iz);
  const open = [];
  const previous = new Map();
  const score = new Map([[startKey, 0]]);
  const closed = new Set();
  const heuristic = (x, z) => Math.hypot(target.ix - x, target.iz - z);
  heapPush(open, { ix: source.ix, iz: source.iz, key: startKey, g: 0, f: heuristic(source.ix, source.iz) });
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = false, iterations = 0;
  while (open.length && iterations++ < 9000) {
    const node = heapPop(open);
    if (closed.has(node.key)) continue;
    if (node.key === targetKey) { found = true; break; }
    closed.add(node.key);
    for (const [dx, dz] of directions) {
      const ix = node.ix + dx, iz = node.iz + dz, point = gridWorld(ix, iz), key = gridKey(ix, iz);
      if (closed.has(key) || navBlocked(point[0], point[2])) continue;
      if (dx && dz) {
        const a = gridWorld(node.ix + dx, node.iz), b = gridWorld(node.ix, node.iz + dz);
        if (navBlocked(a[0], a[2]) || navBlocked(b[0], b[2])) continue;
      }
      const g = node.g + (dx && dz ? 1.4142 : 1);
      if (g >= (score.get(key) ?? Infinity)) continue;
      score.set(key, g); previous.set(key, node.key);
      heapPush(open, { ix, iz, key, g, f: g + heuristic(ix, iz) });
    }
  }
  if (!found) return strict ? null : [[...start], [...end]];
  const cells = [];
  let cursor = targetKey;
  while (cursor) {
    const [ix, iz] = cursor.split(',').map(Number);
    cells.push(gridWorld(ix, iz));
    if (cursor === startKey) break;
    cursor = previous.get(cursor);
  }
  cells.reverse();
  const raw = [[start[0], 0, start[2]], ...cells, [end[0], 0, end[2]]];
  const deduped = raw.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[2] - a[i - 1][2]) > 0.12);
  const smooth = [deduped[0]];
  let at = 0;
  while (at < deduped.length - 1) {
    let next = at + 1;
    for (let candidate = deduped.length - 1; candidate > at + 1; candidate--) {
      if (segmentClear(deduped[at], deduped[candidate])) { next = candidate; break; }
    }
    smooth.push(deduped[next]); at = next;
  }
  return smooth;
}

/** One route through several stops in turn. */
export function planWalkRoute(start, stops) {
  let current = [start[0], 0, start[2]];
  const route = [current];
  for (const stop of stops) {
    const segment = findWalkPath(current, stop);
    route.push(...segment.slice(1));
    current = route[route.length - 1];
  }
  return route.length > 1 ? route : [current, [...current]];
}

export function routeLength(route) {
  let length = 0;
  for (let i = 1; i < route.length; i++) length += Math.hypot(route[i][0] - route[i - 1][0], route[i][2] - route[i - 1][2]);
  return length;
}

/** The point `progress` (0–1) of the way along a route. */
export function pointOnRoute(route, progress) {
  if (!route?.length) return [0, 0, 0];
  const total = routeLength(route);
  if (total < 1e-5) return [...route[route.length - 1]];
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (remaining <= length || i === route.length - 1) {
      const t = length > 1e-5 ? Math.max(0, Math.min(1, remaining / length)) : 1;
      return [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t];
    }
    remaining -= length;
  }
  return [...route[route.length - 1]];
}
