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
export const GONDOLA = { length: 4.0, depth: 1.0, height: 2.25 };   // tall enough that a cereal box on the top shelf clears the cap
export const GONDOLA_2 = { length: 3.4, depth: 1.0, height: 2.25 };
export const COOLER_LEVELS = [0.46, 1.2];
export const COOLER_HEIGHT = 1.95;
export const BIN_SIZE = 1.3;
export const BAKERY_TOP = 0.88;
/** The inside of the walls; a cooler's back stands against them. */
export const INNER = { minX: -8.85, maxX: 8.85, minZ: -6.85, maxZ: 6.85 };
/** How far from a face a shopper stands, and how much clear floor each face needs. */
export const FACE_REACH = 0.95;
/** The least room a shelf, bin or table leaves between itself and a wall. */
export const WALL_GAP = 0.15;

/** Which board of the second gondola each shelf fixture is: the face (1 faces the street) and the level. */
export const GONDOLA_2_BOARDS = { 'shelf-2': [1, 0], 'shelf-3': [1, 1], 'shelf-4': [1, 2], 'shelf-5': [-1, 0], 'shelf-6': [-1, 1], 'shelf-7': [-1, 2] };
const GONDOLA_2_STOCK = Object.entries({ sugar: 'shelf-2', oats: 'shelf-3', peanutbutter: 'shelf-4', chips: 'shelf-5', cookies: 'shelf-6', candybar: 'shelf-7' })
  .map(([id, fixture]) => [id, ...GONDOLA_2_BOARDS[fixture]]);

/**
 * Everything that stands on the floor of the shop and can be moved about it: shelves, bins, the bakery table
 * and the coolers. Each is drawn facing +z (`rot` turns it a quarter at a time: 1 faces +x) and has a `home`, where
 * it starts. `always` ones are there from the first day; the rest stand once one of their `fixtures` (sim.js FIXTURES)
 * is bought. `stock` is what goes on it: gondola boards as [product, face, level], bins and tables as product
 * lists, coolers as rows of products from the bottom shelf up.
 */
export const PIECES = [
  { id: 'pantry', type: 'gondola', name: 'Pantry gondola', w: GONDOLA.length, d: GONDOLA.depth, always: true, fixtures: ['shelf-1'], home: { x: -1.6, z: -2.4, rot: 0 },
    stock: [['rice', 1, 0], ['pasta', 1, 1], ['cereal', 1, 2], ['beans', -1, 0], ['coffee', -1, 1], ['flour', -1, 2]] },
  ...['apples', 'bananas', 'tomatoes', 'lettuce', 'potatoes'].map((product, i) => ({
    id: `produce-${i + 1}`, type: 'bin', name: 'Produce bin', w: BIN_SIZE, d: BIN_SIZE, always: true, fixtures: [], home: { x: -8.0, z: [-0.55, 0.95, 2.45, 3.95, 5.45][i], rot: 1 }, stock: [product],
  })),
  { id: 'bakery', type: 'table', name: 'Bakery table', w: 2.0, d: 0.9, always: true, fixtures: [], home: { x: -4.6, z: 5.4, rot: 2 }, stock: ['bread'] },
  ...[
    ['dairy', 'DAIRY', 3.4, -1.9, [['milk', 'yogurt'], ['cheese', 'butter']]],
    ['meat', 'EGGS · MEAT · DELI', 3.4, 1.5, [['eggs', 'chicken'], ['beef', 'deli']]],
    ['drinks', 'COLD DRINKS', 2.7, 4.55, [['soda'], ['water']]],
    ['frozen', 'FROZEN', 2.7, 7.25, [['pizza'], ['icecream']]],
  ].map(([id, label, w, x, rows]) => ({ id: `cooler-${id}`, type: 'cooler', name: `${label[0]}${label.slice(1).toLowerCase()} cooler`, label, w, d: 1.0, always: true, fixtures: [], home: { x, z: INNER.minZ + 0.5, rot: 0 }, stock: rows })),
  // What the owner can buy (sim.js FIXTURES has what each costs and opens): a bin for each new produce line,
  // a second gondola of snack shelves, and two reach-in cooler doors.
  ...['oranges', 'carrots', 'onions', 'peppers', 'grapes'].map((product, i) => ({
    id: `bin-${i + 1}`, type: 'bin', name: 'Produce bin', w: BIN_SIZE, d: BIN_SIZE, fixtures: [`bin-${i + 1}`], home: { x: i < 3 ? -5.0 : -1.8, z: [-0.1, 1.35, 2.8, 1.4, 2.9][i], rot: 1 }, stock: [product],
  })),
  { id: 'gondola-2', type: 'gondola', name: 'Snack gondola', w: GONDOLA_2.length, d: GONDOLA_2.depth, fixtures: Object.keys(GONDOLA_2_BOARDS), home: { x: 3.2, z: -2.4, rot: 0 }, stock: GONDOLA_2_STOCK },
  ...[['cooler-1', -3.5, [['orangejuice'], ['bacon']]], ['cooler-2', -1.7, [['sourcream']]]].map(([id, z, rows]) => ({
    id, type: 'cooler', name: 'Reach-in cooler', label: 'COLD', w: 1.7, d: 1.0, fixtures: [id], home: { x: INNER.maxX - 0.5, z, rot: 3 }, stock: rows,
  })),
];
export const PIECE_BY_ID = Object.fromEntries(PIECES.map((p) => [p.id, p]));
export const PIECE_OF_FIXTURE = Object.fromEntries(PIECES.flatMap((p) => p.fixtures.map((f) => [f, p.id])));
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
 * They follow their piece about the shop (see `refreshSlots`).
 */
export const SLOTS = {};

/** Each product's place in its piece's own frame, before the piece is put anywhere: [piece id, local slot]. */
const LOCAL_SLOTS = (() => {
  const out = {};
  for (const piece of PIECES) {
    if (piece.type === 'gondola') {
      for (const [id, face, level] of piece.stock) out[id] = [piece.id, { kind: 'gondola', lx: 0, y: LEVELS[level], lz: face * 0.27, width: piece.w - 0.3, depth: 0.5, yaw: face > 0 ? 0 : Math.PI, stand: [0, face * 1.35] }];
    } else if (piece.type === 'bin') {
      for (const id of piece.stock) out[id] = [piece.id, { kind: 'bin', lx: 0, y: 0.4, lz: 0, width: 1.1, depth: 1.1, yaw: 0, stand: [0, 1.6] }];
    } else if (piece.type === 'table') {
      for (const id of piece.stock) out[id] = [piece.id, { kind: 'table', lx: 0, y: BAKERY_TOP, lz: 0, width: piece.w - 0.3, depth: 0.6, yaw: 0, stand: [0, 1.3] }];
    } else {
      piece.stock.forEach((row, level) => row.forEach((id, i) => {
        const half = (piece.w - 0.3) / row.length;
        out[id] = [piece.id, { kind: 'cooler', lx: -piece.w / 2 + 0.15 + half * (i + 0.5), y: COOLER_LEVELS[level], lz: 0, width: half - 0.08, depth: 0.74, yaw: 0, stand: [0, piece.d / 2 + FACE_REACH] }];
      }));
    }
  }
  return out;
})();

/** The piece a product stands on. */
export const pieceOfProduct = (productId) => LOCAL_SLOTS[productId]?.[0] ?? null;

/** The products that stand on a piece. */
export const LOCAL_PRODUCTS = (pieceId) => Object.entries(LOCAL_SLOTS).filter(([, [piece]]) => piece === pieceId).map(([id]) => id);

// ——— where the pieces stand ———
let owned = new Set();
let moved = {};
/** A piece's placement: where the owner put it, or its home. */
export const placementOf = (id, layout = moved) => layout[id] ?? PIECE_BY_ID[id].home;
/** Whether a piece is on the floor: the ones the shop opens with always are, the rest once one of their fixtures is bought. */
export const isStanding = (piece, ids) => piece.always || piece.fixtures.some((f) => ids.has(f));
const standing = isStanding;

/** A point in a piece's own frame as a point on the floor. */
function toWorld(p, lx, lz) {
  const a = p.rot * Math.PI / 2, s = Math.sin(a), c = Math.cos(a);
  return [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
}

/** Put every product where its piece stands. */
function refreshSlots() {
  for (const [id, [pieceId, local]] of Object.entries(LOCAL_SLOTS)) {
    const p = placementOf(pieceId);
    const [x, z] = toWorld(p, local.lx, local.lz);
    const [sx, sz] = toWorld(p, local.stand[0], local.stand[1]);
    SLOTS[id] = { kind: local.kind, x, y: local.y, z, width: local.width, depth: local.depth, yaw: p.rot * Math.PI / 2 + local.yaw, stand: [sx, sz] };
  }
}
refreshSlots();

/** Tell the floor plan which pieces are bought and where the owner has put them (`layout`: piece id → { x, z, rot }). */
export function setLayout(ownedIds, layout = {}) { owned = new Set(ownedIds); moved = { ...layout }; refreshSlots(); }

/** The floor a piece covers, as a box on the floor: a quarter turn swaps its width and depth. */
export function footprint(piece, p) {
  const sideways = p.rot % 2 !== 0;
  return { x: p.x, z: p.z, w: sideways ? piece.d : piece.w, d: sideways ? piece.w : piece.d };
}

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
  [[-6.5, -1.1], [-6.5, 5.9], [-3.2, 5.9], [-3.2, -1.1]],
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
  { x: COUNTER.x, z: COUNTER.z, w: COUNTER.w, d: COUNTER.d },
  { x: BACKBAR.x, z: BACKBAR.z, w: BACKBAR.w, d: BACKBAR.d },
  ...STREET_ITEMS.map((p) => ({ x: p.x, z: p.z, w: p.r * 2, d: p.r * 2 })),
];

const inside = (b, x, z, r) => x >= b.x - b.w / 2 - r && x <= b.x + b.w / 2 + r && z >= b.z - b.d / 2 - r && z <= b.z + b.d / 2 + r;

export function navBlocked(x, z) {
  if (x < NAV.minX || x > NAV.maxX || z < NAV.minZ || z > NAV.maxZ) return true;
  const r = NAV.clearance;
  return NAV_BLOCKERS.some((b) => inside(b, x, z, r)) || PIECES.some((piece) => standing(piece, owned) && inside(footprint(piece, placementOf(piece.id)), x, z, r));
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

// ——— putting the bought pieces where the owner wants them ———

const BACKROOM_BOX = { x: (BACKROOM.minX + BACKROOM.maxX) / 2, z: (BACKROOM.minZ + BACKROOM.maxZ) / 2, w: BACKROOM.maxX - BACKROOM.minX + SHELL.wall, d: BACKROOM.maxZ - BACKROOM.minZ + SHELL.wall };
const DOOR_BOX = { x: FRONT_DOOR.x, z: INNER.maxZ - 0.8, w: FRONT_DOOR.width + 1.0, d: 1.6 };
/** Floor that is already taken, whether or not anything walks there. */
const TAKEN = [...NAV_BLOCKERS, BACKROOM_BOX, DOOR_BOX];
const overlap = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.03 && Math.abs(a.z - b.z) < (a.d + b.d) / 2 - 0.03;
const within = (box, margin = 0) => box.x - box.w / 2 >= INNER.minX + margin - 1e-6 && box.x + box.w / 2 <= INNER.maxX - margin + 1e-6
  && box.z - box.d / 2 >= INNER.minZ + margin - 1e-6 && box.z + box.d / 2 <= INNER.maxZ - margin + 1e-6;
const frontOf = (rot) => [Math.sin(rot * Math.PI / 2), Math.cos(rot * Math.PI / 2)];

/** The clear floor a face needs: a strip as wide as the piece, `side` being 1 for its front and -1 for its back. */
function faceStrip(piece, p, side) {
  const [fx, fz] = frontOf(p.rot);
  const box = footprint(piece, p);
  const reach = FACE_REACH, alongX = p.rot % 2 === 0;
  return { x: p.x + fx * side * (piece.d / 2 + reach / 2), z: p.z + fz * side * (piece.d / 2 + reach / 2), w: alongX ? box.w - 0.2 : reach, d: alongX ? reach : box.d - 0.2 };
}

/**
 * The cooler wall nearest a point, with the placement of a cooler against it: back to the wall, glass
 * facing in, slid along the wall to `x`/`z` (kept clear of the corners).
 */
function snapToWall(piece, x, z) {
  const walls = [
    { dist: z - INNER.minZ, rot: 0 }, { dist: x - INNER.minX, rot: 1 },
    { dist: INNER.maxZ - z, rot: 2 }, { dist: INNER.maxX - x, rot: 3 },
  ].sort((a, b) => a.dist - b.dist);
  const rot = walls[0].rot, half = piece.d / 2, along = piece.w / 2;
  const grid = (v) => Math.round(v * 10) / 10;
  if (rot === 0) return { rot, x: Math.min(INNER.maxX - along, Math.max(INNER.minX + along, grid(x))), z: INNER.minZ + half };
  if (rot === 2) return { rot, x: Math.min(INNER.maxX - along, Math.max(INNER.minX + along, grid(x))), z: INNER.maxZ - half };
  if (rot === 1) return { rot, x: INNER.minX + half, z: Math.min(INNER.maxZ - along, Math.max(INNER.minZ + along, grid(z))) };
  return { rot, x: INNER.maxX - half, z: Math.min(INNER.maxZ - along, Math.max(INNER.minZ + along, grid(z))) };
}

/** Where a piece lands for a pointer at (x, z): coolers slide to the nearest wall, the rest snap to the grid and keep their turn. */
export function snapPlacement(pieceId, x, z, rot = 0) {
  const piece = PIECE_BY_ID[pieceId];
  if (piece.type === 'cooler') return snapToWall(piece, x, z);
  const grid = (v) => Math.round(v * 10) / 10;
  return { x: grid(x), z: grid(z), rot: ((rot % 4) + 4) % 4 };
}

/**
 * Why a piece cannot stand here, or null: 'out' (outside the shop), 'blocked' (something is there),
 * 'wall' (a shelf or bin must stand clear of walls on every side so both faces can be reached),
 * 'needs-wall' (a cooler's back must be flat to a wall), 'door' (the door or a face would be shut off).
 */
export function placementProblem(pieceId, p, ownedIds, layout = {}) {
  const piece = PIECE_BY_ID[pieceId];
  const box = footprint(piece, p);
  const isCooler = piece.type === 'cooler';
  if (!within(box)) return 'out';
  const others = PIECES.filter((o) => o.id !== pieceId && standing(o, new Set(ownedIds))).map((o) => footprint(o, placementOf(o.id, layout)));
  if ([...TAKEN, ...others].some((b) => overlap(box, b))) return 'blocked';
  if (isCooler) {
    const [fx, fz] = frontOf(p.rot);
    const back = { x: p.x - fx * piece.d / 2, z: p.z - fz * piece.d / 2 };
    const flush = p.rot === 0 ? back.z - INNER.minZ : p.rot === 2 ? INNER.maxZ - back.z : p.rot === 1 ? back.x - INNER.minX : INNER.maxX - back.x;
    if (Math.abs(flush) > 0.02) return 'needs-wall';
  } else if (!within(box, WALL_GAP)) return 'wall';
  const strips = [faceStrip(piece, p, 1), ...(piece.type === 'gondola' ? [faceStrip(piece, p, -1)] : [])];
  for (const strip of strips) {
    if (!within(strip)) return 'wall';
    if ([...TAKEN, ...others].some((b) => overlap(strip, b))) return 'blocked';
  }
  return null;
}

/** Run `fn` as if these pieces were bought and standing here, then put the real layout back. */
function withLayout(ownedIds, layout, fn) {
  const before = [owned, moved];
  setLayout(ownedIds, layout);
  try { return fn(); } finally { setLayout(before[0], before[1]); }
}

/** Whether the whole shop still works with the layout: the door, the till, the staff and every line stay reachable. */
export function shopStillWorks(ownedIds, layout, extraStands = []) {
  return withLayout(ownedIds, layout, () => {
    const from = [SIDEWALK_SPAWN[0], 0, SIDEWALK_SPAWN[2]];
    const keys = [CHECKOUT, MARISOL_HOME, MANAGER_HOME, DOOR_IN, ...extraStands];
    // Lines on pieces that are not bought have nowhere to stand yet.
    const live = Object.entries(SLOTS).filter(([id]) => !LOCAL_SLOTS[id] || standing(PIECE_BY_ID[LOCAL_SLOTS[id][0]], new Set(ownedIds))).map(([, s]) => [s.stand[0], 0, s.stand[1]]);
    return [...keys, ...live].every((to) => !navBlocked(to[0], to[2]) && findWalkPath(from, to, { strict: true }));
  });
}

/** The full test for putting a piece down: the geometry, and the shop still working. Returns null if it is fine, or the reason. */
export function canPlace(pieceId, p, ownedIds, layout = {}) {
  const problem = placementProblem(pieceId, p, ownedIds, layout);
  if (problem) return problem;
  return shopStillWorks(ownedIds, { ...layout, [pieceId]: p }) ? null : 'door';
}
