import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { createView } from 'madness-engine/view';
import { createModel } from 'madness-engine/models/model';
import { cloth, person } from 'madness-engine/characters/person';
import purchasingSuit from 'madness-engine/characters/suit';
import { floorTexture, wallTexture } from 'madness-engine/textures/venue';
import { paintRoom } from 'madness-engine/textures/rooms/town';
import { paintSky } from 'madness-engine/textures/skies/haze';
import gent from 'madness-engine/characters/gent';
import vendor from 'madness-engine/characters/vendor';
import tourist from 'madness-engine/characters/tourist';
import punk from 'madness-engine/characters/punk';
import hippie from 'madness-engine/characters/hippie';
import artist from 'madness-engine/characters/artist';
import hipster from 'madness-engine/characters/hipster';
import cabbie from 'madness-engine/characters/cabbie';
import nonna from 'madness-engine/characters/nonna';
import beerguy from 'madness-engine/characters/beerguy';
import salaryman from 'madness-engine/characters/salaryman';
import pizzaiolo from 'madness-engine/characters/pizzaiolo';
import skater from 'madness-engine/characters/skater';
import { CAT_DEFS } from 'madness-engine/characters/cat';
import { PRODUCTS, CAT_ROSTER, STAFF, PRODUCT_BY_ID, shelfQuantity } from './sim.js';

const CUSTOMER_MODELS = { tourist, punk, hippie, artist, hipster, cabbie, nonna, beerguy, salaryman, pizzaiolo, skater };
const OWNER_CHARACTER = person({
  name: 'bodega-owner',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.02, torso: 1.0, head: 1.0, girth: 0.98 },
  skin: '#d5a17f',
  look: {
    torso: cloth('#72907d', '#415c4d'),
    sleeve: cloth('#72907d', '#415c4d'),
    cuff: '#d5a17f',
    legs: cloth('#354b61', '#202f40'),
    boot: '#49413a',
    sole: '#242326',
  },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3d3028', brow: '#38271e', mood: 0 },
  hair: { color: cloth('#30231c', '#17110d'), locks: [[[0, 0.785, 0.05], [0, 0.8, 0.12], 0.035], [[0.05, 0.77, 0.0], [0.09, 0.72, -0.03], 0.03], [[-0.05, 0.77, 0.0], [-0.09, 0.72, -0.03], 0.03]] },
});
const PLAYER_HOME = [0.35, 0, 5.15];
const PLAYER_SPEED = 2.25;

const EXIT = [4.6, 0, 5.8];
const CHECKOUT = [4.05, 0, 4.65];
const BACKROOM = [-6.3, 0, 4.55];
const HUMAN_HEIGHT = 1.42;
const CAT_HEIGHT = 0.31;

// Store fixtures are separated into distinct islands with a broad circulation
// spine and a usable cross-aisle. Product anchors sit beside, never inside, them.
const DISPLAY = {
  apples: [-7.1, 0, -4.8], bananas: [-5.55, 0, -4.8], tomatoes: [-7.1, 0, -3.3], lettuce: [-5.55, 0, -3.3], potatoes: [-6.3, 0, -1.8],
  bread: [-6.3, 0, 0.45],
  rice: [-3.55, 0, -4.55], pasta: [-1.95, 0, -4.55], cereal: [-0.35, 0, -4.55], beans: [-3.2, 0, -1.35], coffee: [-1.55, 0, -1.35],
  milk: [6.15, 0, -4.8], yogurt: [7.5, 0, -4.8], cheese: [6.15, 0, -3.4], butter: [7.5, 0, -3.4], eggs: [6.15, 0, -2.0], chicken: [7.5, 0, -2.0], beef: [6.15, 0, -0.6], deli: [7.5, 0, -0.6],
  soda: [1.85, 0, -4.8], water: [3.15, 0, -4.8], pizza: [1.85, 0, -3.2], icecream: [3.15, 0, -3.2],
};
const GROUP_TARGET = {
  produce: [-4.3, 0, -3.45], bakery: [-4.35, 0, 0.6], dry: [0.55, 0, -3.0],
  chilled: [4.65, 0, -2.55], drinks: [2.5, 0, -2.42], frozen: [2.5, 0, -2.42],
};

// Navigation uses inflated fixture footprints so a shopper has room for their
// shoulders and shopping basket. The same graph drives shoppers, staff and cats.
const NAV = { minX: -8.3, maxX: 8.3, minZ: -6.25, maxZ: 6.2, step: 0.3, clearance: 0.34 };
const NAV_BLOCKERS = [
  ...[[-7.1,-4.8],[-5.55,-4.8],[-7.1,-3.3],[-5.55,-3.3],[-6.3,-1.8]].map(([x,z])=>({x,z,w:1.28,d:1.08})),
  { x:-6.3, z:0.45, w:2.67, d:1.14 }, // bakery table
  { x:-2.0, z:-4.55, w:3.9, d:1.22 }, // dry-goods bay A
  { x:-2.0, z:-1.35, w:3.9, d:1.22 }, // dry-goods bay B
  { x:2.5, z:-4.0, w:2.1, d:2.25 }, // drinks / freezer island
  { x:7.0, z:-2.75, w:2.6, d:4.55 }, // refrigerated wall
  { x:6.3, z:3.42, w:3.47, d:1.58 }, // checkout counter
  { x:-8.05, z:1.75, w:0.72, d:0.55 }, // newspaper rack
  { x:-7.75, z:4.85, w:1.2, d:1.15 }, // receiving nook
];

function normalizeActorHeight(model, targetHeight) {
  const geometry = model.mesh.geometry;
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const meshScaleY = model.mesh.scale.y || 1;
  const currentHeight = Math.max(0.001, (bounds.max.y - bounds.min.y) * meshScaleY);
  const fit = targetHeight / currentHeight;
  model.group.scale.setScalar(fit);
  return -bounds.min.y * meshScaleY * fit;
}

function navBlocked(x, z) {
  if (x < NAV.minX || x > NAV.maxX || z < NAV.minZ || z > NAV.maxZ) return true;
  const r = NAV.clearance;
  return NAV_BLOCKERS.some((b) =>
    x >= b.x - b.w / 2 - r && x <= b.x + b.w / 2 + r &&
    z >= b.z - b.d / 2 - r && z <= b.z + b.d / 2 + r
  );
}

function nearestWalkable(x, z) {
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

function gridKey(ix, iz) { return `${ix},${iz}`; }
function gridWorld(ix, iz) { return [NAV.minX + ix * NAV.step, 0, NAV.minZ + iz * NAV.step]; }

function segmentClear(a, b) {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const distance = Math.hypot(dx, dz);
  const samples = Math.max(2, Math.ceil(distance / 0.16));
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    if (navBlocked(a[0] + dx * t, a[2] + dz * t)) return false;
  }
  return true;
}

function findWalkPath(start, end) {
  const source = nearestWalkable(start[0], start[2]);
  const target = nearestWalkable(end[0], end[2]);
  const startKey = gridKey(source.ix, source.iz), targetKey = gridKey(target.ix, target.iz);
  const open = [];
  const previous = new Map();
  const score = new Map([[startKey, 0]]);
  const closed = new Set();
  const heuristic = (x,z) => Math.hypot(target.ix - x, target.iz - z);
  heapPush(open, { ix: source.ix, iz: source.iz, key: startKey, g: 0, f: heuristic(source.ix,source.iz) });
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let found = false, iterations = 0;
  while (open.length && iterations++ < 6000) {
    const node = heapPop(open);
    if (closed.has(node.key)) continue;
    if (node.key === targetKey) { found = true; break; }
    closed.add(node.key);
    for (const [dx,dz] of directions) {
      const ix=node.ix+dx, iz=node.iz+dz, point=gridWorld(ix,iz), key=gridKey(ix,iz);
      if (closed.has(key) || navBlocked(point[0],point[2])) continue;
      if (dx && dz && (navBlocked(gridWorld(node.ix+dx,node.iz)[0],gridWorld(node.ix+dx,node.iz)[2]) || navBlocked(gridWorld(node.ix,node.iz+dz)[0],gridWorld(node.ix,node.iz+dz)[2]))) continue;
      const g = node.g + (dx && dz ? 1.4142 : 1);
      if (g >= (score.get(key) ?? Infinity)) continue;
      score.set(key,g); previous.set(key,node.key);
      heapPush(open,{ix,iz,key,g,f:g+heuristic(ix,iz)});
    }
  }
  if (!found) return [[...start],[...end]];
  const cells = [];
  let cursor = targetKey;
  while (cursor) {
    const [ix,iz]=cursor.split(',').map(Number);
    cells.push(gridWorld(ix,iz));
    if (cursor===startKey) break;
    cursor=previous.get(cursor);
  }
  cells.reverse();
  const raw = [[start[0],0,start[2]], ...cells, [end[0],0,end[2]]];
  const deduped = raw.filter((p,i,a)=>i===0||Math.hypot(p[0]-a[i-1][0],p[2]-a[i-1][2])>0.12);
  const smooth = [deduped[0]];
  let at=0;
  while (at<deduped.length-1) {
    let next=at+1;
    for(let candidate=deduped.length-1;candidate>at+1;candidate--) {
      if(segmentClear(deduped[at],deduped[candidate])) { next=candidate; break; }
    }
    smooth.push(deduped[next]); at=next;
  }
  return smooth;
}

function planWalkRoute(start, stops) {
  let current=[start[0],0,start[2]], route=[current];
  for (const stop of stops) {
    const segment=findWalkPath(current,stop);
    route.push(...segment.slice(1));
    current=route[route.length-1];
  }
  return route.length>1?route:[current,[...current]];
}

function routeLength(route) {
  let length=0;
  for(let i=1;i<route.length;i++) length+=Math.hypot(route[i][0]-route[i-1][0],route[i][2]-route[i-1][2]);
  return length;
}

function pointOnRoute(route, progress) {
  if (!route?.length) return [0,0,0];
  const total=routeLength(route);
  if (total<1e-5) return [...route[route.length-1]];
  let remaining=Math.max(0,Math.min(1,progress))*total;
  for(let i=1;i<route.length;i++) {
    const a=route[i-1],b=route[i];
    const length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if(remaining<=length||i===route.length-1) {
      const t=length>1e-5?Math.max(0,Math.min(1,remaining/length)):1;
      return [a[0]+(b[0]-a[0])*t,0,a[2]+(b[2]-a[2])*t];
    }
    remaining-=length;
  }
  return [...route[route.length-1]];
}

function faceAlong(group, from, to) {
  const dx=to[0]-from[0], dz=to[2]-from[2];
  if(Math.hypot(dx,dz)>0.02) group.rotation.y=Math.atan2(dx,dz);
}

const CAT_PATROLS = [
  [[-4.25,-5.65],[-4.25,-2.3],[-4.25,1.0],[-4.25,4.8],[0.55,4.8],[0.55,1.7],[0.55,-2.5],[0.55,-5.7]],
  [[0.55,4.8],[0.55,1.7],[0.55,-2.5],[0.55,-5.7],[2.5,-5.7],[4.65,-5.7],[4.65,-2.5],[4.65,1.7],[4.65,4.8]],
  [[4.65,4.8],[4.65,1.7],[4.65,-2.5],[4.65,-5.7],[2.5,-5.7],[0.55,-5.7],[0.55,-2.5],[0.55,1.7],[0.55,4.8]],
];

function makeSignTexture(text, { background = '#14252a', foreground = '#f4e8ce', accent = '#df674b', width = 512, height = 128, fontSize = 60 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent; ctx.fillRect(0, height - 8, width, 8);
  ctx.font = `800 ${fontSize}px 'DM Sans', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = foreground;
  ctx.fillText(text.toUpperCase(), width / 2, height / 2 - 2, width - 32);
  const texture = new GFX.CanvasTexture(canvas);
  texture.colorSpace = GFX.SRGBColorSpace;
  return texture;
}

function labelTexture(text, small = false) {
  return makeSignTexture(text, {
    background: '#f2e8cf', foreground: '#273238', accent: '#d36c50',
    width: 256, height: 92, fontSize: small ? 25 : 31,
  });
}

export async function createBodegaWorld(host, onProgress = () => {}) {
  onProgress('Opening the shop floor', 5);
  const view = createView({ yaw: 0.03, pitch: 0.77, zoom: 1.0 });
  const stage = await createStage(host, {
    label: 'bodega',
    lens: { distance: 24, fov: 37 },
    view,
    sky: paintSky(),
    room: paintRoom(),
    lights: {
      hemisphere: { sky: '#e6e7de', ground: '#303039', intensity: 1.08 },
      key: { color: '#ffe1b5', intensity: 2.0 },
      fill: { color: '#c5dbe4', intensity: 0.42, offset: [6, 4, 5] },
    },
    shadows: true,
    shadowSize: 1536,
    pixelRatio: 1.75,
  });
  const { scene } = stage;
  onProgress('Building the neighborhood store', 20);
  const mats = {
    dark: new GFX.MeshStandardMaterial({ color: '#222d31', roughness: 0.74 }),
    wood: new GFX.MeshStandardMaterial({ color: '#9b6840', roughness: 0.82 }),
    woodLight: new GFX.MeshStandardMaterial({ color: '#c18b55', roughness: 0.78 }),
    trim: new GFX.MeshStandardMaterial({ color: '#d5c5a7', roughness: 0.7 }),
    metal: new GFX.MeshStandardMaterial({ color: '#67777c', metalness: 0.64, roughness: 0.36 }),
    steelDark: new GFX.MeshStandardMaterial({ color: '#303d43', metalness: 0.52, roughness: 0.42 }),
    glass: new GFX.MeshPhysicalMaterial({ color: '#b9d9d8', transparent: true, opacity: 0.25, roughness: 0.12, metalness: 0.12, transmission: 0.45, thickness: 0.15 }),
    chalk: new GFX.MeshStandardMaterial({ color: '#e7dfc8', roughness: 0.9 }),
    tomato: new GFX.MeshStandardMaterial({ color: '#d34e3e', roughness: 0.52 }),
    leaf: new GFX.MeshStandardMaterial({ color: '#648c48', roughness: 0.84 }),
    yellow: new GFX.MeshStandardMaterial({ color: '#e4c24d', roughness: 0.62 }),
    crate: new GFX.MeshStandardMaterial({ color: '#9d7048', roughness: 0.95 }),
    bulb: new GFX.MeshStandardMaterial({ color: '#ffd99b', emissive: '#ffb95e', emissiveIntensity: 1.25, roughness: 0.25 }),
  };

  function box(parent, x, y, z, w, h, d, material, options = {}) {
    const mesh = new GFX.Mesh(new GFX.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = options.castShadow !== false;
    mesh.receiveShadow = options.receiveShadow !== false;
    if (options.rotation) mesh.rotation.set(...options.rotation);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, radiusTop, radiusBottom, height, material, segments = 16) {
    const mesh = new GFX.Mesh(new GFX.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  }

  function sphere(parent, x, y, z, radius, material, scale = [1, 1, 1]) {
    const mesh = new GFX.Mesh(new GFX.SphereGeometry(radius, 16, 12), material);
    mesh.position.set(x, y, z); mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh);
    return mesh;
  }

  // One continuous shop floor, with the engine's painted checker linoleum and bump detail.
  const floorTex = floorTexture(GFX, 'checker');
  const floorMap = new GFX.CanvasTexture(floorTex.map.image);
  floorMap.colorSpace = GFX.SRGBColorSpace; floorMap.wrapS = floorMap.wrapT = GFX.RepeatWrapping; floorMap.repeat.set(9, 7);
  const floorBump = new GFX.CanvasTexture(floorTex.bump.image);
  floorBump.wrapS = floorBump.wrapT = GFX.RepeatWrapping; floorBump.repeat.set(9, 7);
  const floorMaterial = new GFX.MeshStandardMaterial({ color: '#b8b0a0', map: floorMap, bumpMap: floorBump, bumpScale: 0.08, roughness: 0.82 });
  box(scene, 0, -0.16, 0, 18, 0.3, 14, floorMaterial, { receiveShadow: true });

  // The bodega's brick shell: open roof so the whole shop reads in the three-quarter view.
  const wallTex = wallTexture(GFX, 'brick');
  const wallMap = new GFX.CanvasTexture(wallTex.map.image);
  wallMap.colorSpace = GFX.SRGBColorSpace; wallMap.wrapS = wallMap.wrapT = GFX.RepeatWrapping; wallMap.repeat.set(8, 2);
  const wallBump = new GFX.CanvasTexture(wallTex.bump.image);
  wallBump.wrapS = wallBump.wrapT = GFX.RepeatWrapping; wallBump.repeat.set(8, 2);
  const wallMaterial = new GFX.MeshStandardMaterial({ color: '#a8a092', map: wallMap, bumpMap: wallBump, bumpScale: 0.09, roughness: 0.9 });
  box(scene, 0, 2.25, -7, 18, 4.5, 0.32, wallMaterial);
  box(scene, -8.85, 2.25, 0, 0.3, 4.5, 14, wallMaterial);
  box(scene, 8.85, 2.25, 0, 0.3, 4.5, 14, wallMaterial);
  // Half-height storefront wall and trim, broken at the entry.
  box(scene, -3.95, 0.56, 6.87, 10.1, 1.12, 0.3, mats.dark);
  box(scene, 7.95, 0.56, 6.87, 1.7, 1.12, 0.3, mats.dark);
  box(scene, -8.25, 0.56, 6.87, 1.5, 1.12, 0.3, mats.dark);
  box(scene, -6.25, 1.08, 6.87, 0.16, 2.16, 0.2, mats.woodLight);
  box(scene, -4.2, 1.08, 6.87, 0.16, 2.16, 0.2, mats.woodLight);
  const windowMat = new GFX.MeshPhysicalMaterial({ color: '#83b9c1', transparent: true, opacity: 0.23, roughness: 0.08, metalness: 0.12, transmission: 0.35, thickness: 0.18 });
  box(scene, -0.5, 1.14, 6.69, 5.7, 1.04, 0.045, windowMat, { castShadow: false });
  box(scene, -0.5, 0.61, 6.67, 5.9, 0.08, 0.08, mats.woodLight);
  box(scene, -0.5, 1.67, 6.67, 5.9, 0.08, 0.08, mats.woodLight);

  // Hand-painted main sign and the little neon OPEN panel.
  const mainSign = new GFX.Mesh(new GFX.PlaneGeometry(7.1, 1.5), new GFX.MeshBasicMaterial({ map: makeSignTexture('BODEGA', { background: '#1d2c2f', foreground: '#f6e8ca', accent: '#e07355', fontSize: 92 }), side: GFX.DoubleSide }));
  mainSign.position.set(0, 3.8, -6.78); scene.add(mainSign);
  box(scene, -3.58, 3.8, -6.73, 0.12, 1.58, 0.13, mats.woodLight);
  box(scene, 3.58, 3.8, -6.73, 0.12, 1.58, 0.13, mats.woodLight);
  box(scene, 0, 4.58, -6.73, 7.25, 0.12, 0.13, mats.woodLight);
  const openSign = new GFX.Mesh(new GFX.PlaneGeometry(1.25, 0.48), new GFX.MeshBasicMaterial({ map: makeSignTexture('OPEN', { background: '#285542', foreground: '#eff1d6', accent: '#8fc27e', fontSize: 56, width: 256, height: 96 }), side: GFX.DoubleSide }));
  openSign.position.set(7.9, 3.45, -6.76); scene.add(openSign);

  // Corner-store details: window ledge, milk crate, wall clock, poster rail, framed specials.
  box(scene, -6.9, 1.42, 5.55, 2.7, 0.13, 0.55, mats.wood);
  box(scene, -6.9, 2.75, -6.77, 1.0, 0.02, 0.04, mats.woodLight);
  const clockFace = cylinder(scene, -7.35, 3.32, -6.76, 0.38, 0.38, 0.08, mats.chalk, 32);
  clockFace.rotation.x = Math.PI / 2;
  const posterMat = new GFX.MeshBasicMaterial({ map: makeSignTexture('HOT COFFEE · COLD SODA', { background: '#9a4737', foreground: '#f7e6c5', accent: '#e5bf67', fontSize: 29, width: 512, height: 128 }), side: GFX.DoubleSide });
  const poster = new GFX.Mesh(new GFX.PlaneGeometry(2.7, 0.68), posterMat); poster.position.set(-3.5, 2.55, -6.77); scene.add(poster);

  // Ceiling beams and warm pendants. Each point light is deliberately modest for browser performance.
  for (const x of [-5.8, -1.8, 2.2, 6.2]) {
    box(scene, x, 4.25, -0.15, 0.12, 0.12, 13.5, mats.wood);
    box(scene, x, 3.82, -0.2, 0.06, 0.74, 0.06, mats.metal, { castShadow: false });
    sphere(scene, x, 3.42, -0.2, 0.17, mats.bulb, [1, 0.72, 1]);
    const light = new GFX.PointLight('#ffd5a0', 15, 8, 1.5);
    light.position.set(x, 3.38, -0.2); scene.add(light);
  }

  // Produce market: individual timber bins, hand-marked headers and a low display table.
  function produceCrate(productId) {
    const [x, , z] = DISPLAY[productId];
    const group = new GFX.Group(); group.position.set(x, 0, z); scene.add(group);
    box(group, 0, 0.16, 0, 1.28, 0.22, 1.08, mats.wood);
    for (const side of [-0.5, 0.5]) box(group, 0, 0.35, side, 1.28, 0.18, 0.08, mats.woodLight);
    for (const side of [-0.6, 0.6]) box(group, side, 0.35, 0, 0.08, 0.18, 1.08, mats.woodLight);
    return group;
  }
  ['apples', 'bananas', 'tomatoes', 'lettuce', 'potatoes'].forEach(produceCrate);
  box(scene, -6.3, 0.72, -5.65, 4.15, 0.18, 0.18, mats.dark);
  const produceLabel = new GFX.Mesh(new GFX.PlaneGeometry(3.3, 0.36), new GFX.MeshBasicMaterial({ map: makeSignTexture('FRESH PRODUCE', { background: '#35533c', foreground: '#f6edcf', accent: '#c8d19a', fontSize: 48, height: 96 }), side: GFX.DoubleSide }));
  produceLabel.position.set(-6.3, 0.75, -5.53); scene.add(produceLabel);

  // Bakery table and bread baskets.
  box(scene, -6.3, 0.46, 0.45, 2.55, 0.72, 1.05, mats.wood);
  box(scene, -6.3, 0.85, 0.45, 2.67, 0.12, 1.14, mats.woodLight);
  box(scene, -6.3, 1.19, -0.1, 2.4, 0.07, 0.07, mats.dark);
  const bakeryLabel = new GFX.Mesh(new GFX.PlaneGeometry(1.65, 0.38), new GFX.MeshBasicMaterial({ map: makeSignTexture('BAKERY', { background: '#875a38', foreground: '#fff0d2', accent: '#e1b276', fontSize: 48, height: 96 }), side: GFX.DoubleSide }));
  bakeryLabel.position.set(-6.3, 1.23, -0.05); scene.add(bakeryLabel);

  // Dry-goods gondolas: real shelf boards, dark uprights, price rails and kick plates.
  function gondola(x, z, width = 5.25) {
    box(scene, x, 0.16, z, width, 0.22, 1.22, mats.dark);
    box(scene, x, 0.58, z - 0.34, width, 0.1, 0.62, mats.woodLight);
    box(scene, x, 1.22, z - 0.34, width, 0.1, 0.62, mats.woodLight);
    box(scene, x, 1.86, z - 0.34, width, 0.1, 0.62, mats.woodLight);
    for (const end of [-1, 1]) {
      box(scene, x + end * (width / 2 - 0.08), 1.03, z - 0.34, 0.12, 2.0, 0.15, mats.metal);
      box(scene, x + end * (width / 2 - 0.08), 0.12, z, 0.12, 0.24, 1.2, mats.metal);
    }
    for (const y of [0.38, 1.02, 1.66]) box(scene, x, y, z - 0.01, width, 0.09, 0.06, mats.trim);
  }
  gondola(-2.0, -4.55, 3.9);
  gondola(-2.0, -1.35, 3.9);
  const groceryHeader = new GFX.Mesh(new GFX.PlaneGeometry(3.3, 0.48), new GFX.MeshBasicMaterial({ map: makeSignTexture('PANTRY & DRY GOODS', { background: '#33464c', foreground: '#f4e9d1', accent: '#d16f53', fontSize: 40, height: 96 }), side: GFX.DoubleSide }));
  groceryHeader.position.set(-2.0, 2.22, -2.05); scene.add(groceryHeader);

  // Refrigerated wall: compressor plinth, glass doors, aluminium dividers and chilled shelves.
  box(scene, 7.0, 0.16, -2.75, 2.6, 0.3, 4.55, mats.steelDark);
  box(scene, 7.0, 2.22, -4.93, 2.6, 0.22, 0.16, mats.metal);
  box(scene, 7.0, 1.14, -0.54, 2.6, 0.2, 0.16, mats.metal);
  box(scene, 7.0, 1.21, -2.76, 2.5, 1.9, 0.08, mats.glass, { castShadow: false });
  for (const x of [5.76, 7.0, 8.24]) box(scene, x, 1.23, -2.76, 0.065, 2.0, 0.12, mats.metal);
  for (const z of [-4.15, -2.72, -1.28]) box(scene, 7.0, 0.78, z, 2.52, 0.075, 0.08, mats.trim);
  for (const x of [5.95, 6.65, 7.35, 8.05]) {
    const lamp = new GFX.PointLight('#b8e7f0', 5.5, 3.8, 1.6); lamp.position.set(x, 2.1, -2.7); scene.add(lamp);
  }
  const coldLabel = new GFX.Mesh(new GFX.PlaneGeometry(3.3, 0.42), new GFX.MeshBasicMaterial({ map: makeSignTexture('MILK · EGGS · MEAT', { background: '#38545a', foreground: '#eef3e5', accent: '#b3d9d2', fontSize: 35, height: 96 }), side: GFX.DoubleSide }));
  coldLabel.position.set(7.0, 2.45, -4.82); scene.add(coldLabel);

  // Beverage and freezer island at the far right of the centre aisle.
  box(scene, 2.5, 0.19, -4.0, 2.1, 0.32, 2.25, mats.steelDark);
  box(scene, 2.5, 0.64, -4.0, 2.1, 0.1, 2.2, mats.metal);
  box(scene, 2.5, 1.2, -4.0, 2.1, 0.12, 2.16, mats.metal);
  box(scene, 2.5, 1.76, -4.0, 2.1, 0.12, 2.12, mats.metal);
  const chilledHeader = new GFX.Mesh(new GFX.PlaneGeometry(2.9, 0.4), new GFX.MeshBasicMaterial({ map: makeSignTexture('COLD DRINKS · FROZEN', { background: '#31515b', foreground: '#f1eee0', accent: '#8ec6d6', fontSize: 34, height: 96 }), side: GFX.DoubleSide }));
  chilledHeader.position.set(2.5, 2.07, -4.0); scene.add(chilledHeader);

  // Checkout is built as a substantial counter, card terminal, register and gum display.
  box(scene, 6.3, 0.56, 3.42, 3.35, 1.12, 1.48, mats.wood);
  box(scene, 6.3, 1.17, 3.42, 3.47, 0.14, 1.58, mats.dark);
  box(scene, 6.3, 1.27, 3.42, 3.1, 0.045, 1.32, mats.trim);
  box(scene, 5.25, 1.47, 3.08, 0.72, 0.34, 0.48, mats.steelDark);
  box(scene, 5.25, 1.66, 3.08, 0.6, 0.03, 0.34, mats.bulb);
  box(scene, 7.38, 1.4, 3.32, 0.52, 0.32, 0.42, mats.dark);
  const gumColors = ['#d34b3d', '#d4b13e', '#5c8c61', '#5c7795'];
  gumColors.forEach((color, i) => {
    const gum = new GFX.MeshStandardMaterial({ color, roughness: 0.62 });
    box(scene, 5.35 + i * 0.24, 1.44, 3.78, 0.19, 0.24, 0.24, gum);
  });
  const cashierSign = new GFX.Mesh(new GFX.PlaneGeometry(1.7, 0.34), new GFX.MeshBasicMaterial({ map: makeSignTexture('NEXT PLEASE', { background: '#354b47', foreground: '#f0e7cf', accent: '#d9a55f', fontSize: 34, height: 96 }), side: GFX.DoubleSide }));
  cashierSign.position.set(6.3, 1.68, 4.2); scene.add(cashierSign);

  // A compact receiving nook gives deliveries a physical home before Marisol takes them out.
  box(scene, -7.75, 0.42, 4.85, 1.15, 0.82, 1.1, mats.wood);
  box(scene, -7.75, 0.88, 4.85, 1.2, 0.1, 1.14, mats.woodLight);
  box(scene, -7.75, 1.33, 4.85, 1.1, 0.78, 1.05, mats.wood);
  const stockroomLabel = new GFX.Mesh(new GFX.PlaneGeometry(1.0, 0.28), new GFX.MeshBasicMaterial({ map: makeSignTexture('RECEIVING', { background: '#3d5148', foreground: '#f4e9d1', accent: '#d6b578', fontSize: 29, height: 96 }), side: GFX.DoubleSide }));
  stockroomLabel.position.set(-7.75, 1.78, 4.28); scene.add(stockroomLabel);

  // Small comforts: a newspaper rack, coffee station, trash bin, milk crate and hand trolley.
  box(scene, -8.05, 0.42, 1.75, 0.62, 0.82, 0.45, mats.dark);
  for (let k = 0; k < 5; k++) box(scene, -8.05, 0.57 + k * 0.03, 1.75 - k * 0.012, 0.52, 0.22, 0.015, mats.chalk, { rotation: [0.09, 0, (k - 2) * 0.035] });
  cylinder(scene, 0.15, 0.48, 4.7, 0.34, 0.34, 0.9, mats.steelDark, 20);
  box(scene, 0.15, 0.95, 4.7, 0.66, 0.11, 0.58, mats.dark);
  for (const x of [-0.65, 0.85]) cylinder(scene, x, 0.13, 4.15, 0.16, 0.16, 0.28, mats.steelDark, 12);
  box(scene, -7.95, 0.2, -0.5, 0.65, 0.42, 0.56, mats.wood);
  box(scene, -7.95, 0.44, -0.5, 0.68, 0.08, 0.6, mats.woodLight);

  // Product sign rails and the merchandise itself. Every shelf count is reflected in the scene.
  onProgress('Filling the grocery shelves', 53);
  const displayGroups = new Map();
  const productMaterials = new Map();
  function merchandiseMaterial(product) {
    if (!productMaterials.has(product.id)) {
      productMaterials.set(product.id, new GFX.MeshStandardMaterial({
        color: product.color, roughness: product.kind === 'bottle' ? 0.25 : 0.73,
        metalness: product.kind === 'can' ? 0.46 : 0,
        emissive: '#000000',
      }));
    }
    return productMaterials.get(product.id);
  }
  function makePack(group, product, x, y, z, sizeFactor = 1) {
    const color = merchandiseMaterial(product);
    const factor = sizeFactor;
    if (product.kind === 'produce') {
      const radius = product.id === 'lettuce' ? 0.17 : 0.18;
      const veg = sphere(group, x, y + radius, z, radius, color, product.id === 'bananas' ? [1.35, 0.58, 0.72] : [1, 1, 1]);
      if (product.id === 'lettuce') for (let a = 0; a < 5; a++) sphere(group, x + Math.cos(a * 1.26) * 0.11, y + 0.11, z + Math.sin(a * 1.26) * 0.11, 0.1, mats.leaf, [1, 0.4, 1]);
      if (product.id === 'apples' || product.id === 'tomatoes') cylinder(group, x, y + 0.22, z, 0.012, 0.012, 0.055, mats.wood, 6);
      if (product.id === 'bananas') veg.rotation.z = 0.18;
      return veg;
    }
    let mesh;
    if (product.kind === 'bottle') {
      mesh = new GFX.Group();
      cylinder(mesh, 0, 0.22, 0, 0.095 * factor, 0.11 * factor, 0.42 * factor, color, 14);
      cylinder(mesh, 0, 0.455, 0, 0.045 * factor, 0.06 * factor, 0.08 * factor, color, 12);
      cylinder(mesh, 0, 0.5, 0, 0.043 * factor, 0.043 * factor, 0.04 * factor, mats.yellow, 12);
      group.add(mesh); mesh.position.set(x, y, z); return mesh;
    }
    if (product.kind === 'can') mesh = cylinder(group, x, y + 0.18, z, 0.13, 0.13, 0.36, color, 18);
    else if (product.kind === 'eggbox' || product.kind === 'carton' || product.kind === 'box' || product.kind === 'bag' || product.kind === 'tray' || product.kind === 'frozen') {
      const dims = product.kind === 'eggbox' ? [0.35, 0.19, 0.28] : product.kind === 'bag' ? [0.27, 0.5, 0.16] : product.kind === 'box' ? [0.28, 0.5, 0.18] : product.kind === 'tray' ? [0.35, 0.12, 0.26] : product.kind === 'frozen' ? [0.35, 0.12, 0.27] : [0.28, 0.4, 0.2];
      mesh = box(group, x, y + dims[1] / 2, z, ...dims, color);
      const label = new GFX.Mesh(new GFX.PlaneGeometry(dims[0] * 0.82, dims[1] * 0.38), new GFX.MeshBasicMaterial({ map: labelTexture(product.short), side: GFX.DoubleSide }));
      label.position.set(x, y + dims[1] * 0.52, z + dims[2] / 2 + 0.006); group.add(label);
    } else if (product.kind === 'loaf') {
      mesh = sphere(group, x, y + 0.19, z, 0.2, color, [1.45, 0.76, 0.72]);
    } else if (product.kind === 'tub') {
      mesh = cylinder(group, x, y + 0.16, z, 0.15, 0.13, 0.32, color, 16);
      cylinder(group, x, y + 0.325, z, 0.155, 0.155, 0.035, mats.chalk, 16);
    }
    return mesh;
  }

  for (const product of PRODUCTS) {
    const display = new GFX.Group();
    const [x, , z] = DISPLAY[product.id];
    display.position.set(x, 0, z); scene.add(display);
    const shelfLabel = new GFX.Mesh(new GFX.PlaneGeometry(1.0, 0.3), new GFX.MeshBasicMaterial({ map: labelTexture(product.short, true), side: GFX.DoubleSide }));
    shelfLabel.position.set(0, 0.1, 0.52); display.add(shelfLabel);
    const packs = [];
    for (let i = 0; i < 4; i++) {
      const pack = new GFX.Group(); display.add(pack);
      const col = i % 2, row = Math.floor(i / 2);
      makePack(pack, product, (col - 0.5) * 0.42, 0.24 + row * 0.36, (row - 0.5) * 0.34, product.kind === 'produce' ? 1 : 0.9);
      packs.push(pack);
    }
    const shelfBase = box(display, 0, 0.06, -0.08, 1.26, 0.1, 0.98, product.section === 'produce' ? mats.wood : mats.woodLight);
    shelfBase.receiveShadow = true;
    displayGroups.set(product.id, { group: display, packs, shelfLabel, product });
  }

  onProgress('Bringing the staff and bodega cats in', 72);
  // Employee models are actual sculpted engine characters, with a distinct job and a home position.
  const staffModels = [];
  const lou = createModel(GFX, gent, { detail: 0.75 });
  const louFloor = normalizeActorHeight(lou, HUMAN_HEIGHT);
  const louHome = [6.95, louFloor, 2.15];
  lou.group.position.set(...louHome); lou.group.rotation.y = -0.18; scene.add(lou.group);
  staffModels.push({ model: lou, character: 'gent', name: STAFF[0].name, time: 0, home: louHome, poseAccumulator: 0 });
  const marisol = createModel(GFX, vendor, { detail: 0.75 });
  const marisolFloor = normalizeActorHeight(marisol, HUMAN_HEIGHT);
  const marisolHome = [BACKROOM[0], marisolFloor, BACKROOM[2] - 0.35];
  marisol.group.position.set(...marisolHome); marisol.group.rotation.y = -Math.PI / 2; scene.add(marisol.group);
  staffModels.push({ model: marisol, character: 'vendor', name: STAFF[1].name, time: 1.5, home: marisolHome, poseAccumulator: 0, route: [marisolHome], routeStage: 'idle' });

  const playerModel = createModel(GFX, OWNER_CHARACTER, { detail: 0.85 });
  const playerFloor = normalizeActorHeight(playerModel, HUMAN_HEIGHT);
  const savedPlayer = window.__bodegaState?.playerPosition ?? { x: PLAYER_HOME[0], z: PLAYER_HOME[2] };
  const player = { model: playerModel, floor: playerFloor, x: savedPlayer.x, z: savedPlayer.z, time: 0, poseAccumulator: 0, facing: 0 };
  playerModel.group.position.set(player.x, playerFloor, player.z);
  scene.add(playerModel.group);
  const ownerTag = new GFX.Mesh(
    new GFX.PlaneGeometry(0.92, 0.22),
    new GFX.MeshBasicMaterial({ map: makeSignTexture('STORE OWNER', { background: '#355746', foreground: '#f5edd8', accent: '#9fbd8b', width: 256, height: 96, fontSize: 32 }), transparent: true, side: GFX.DoubleSide, depthTest: false, depthWrite: false }),
  );
  ownerTag.renderOrder = 25;
  scene.add(ownerTag);
  const playerKeys = new Set();
  const keyDirections = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };
  const editableTarget = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };
  const onKeyDown = (event) => {
    const direction = keyDirections[event.code];
    if (!direction || editableTarget()) return;
    playerKeys.add(direction);
    if (event.shiftKey) playerKeys.add('run');
    event.preventDefault();
  };
  const onKeyUp = (event) => {
    const direction = keyDirections[event.code];
    if (direction) playerKeys.delete(direction);
    if (event.key === 'Shift') playerKeys.delete('run');
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => playerKeys.clear());
  document.querySelectorAll('[data-player-move]').forEach((button) => {
    const direction = button.dataset.playerMove;
    const down = (event) => { event.preventDefault(); playerKeys.add(direction); button.setPointerCapture?.(event.pointerId); };
    const up = () => playerKeys.delete(direction);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  });

  // The purchasing manager is a regular, suited employee, created only after hiring.
  const purchasingManagerModel = createModel(GFX, purchasingSuit, { detail: 0.75 });
  const managerFloor = normalizeActorHeight(purchasingManagerModel, HUMAN_HEIGHT);
  const managerHome = [-6.05, managerFloor, 3.05];
  purchasingManagerModel.group.position.set(...managerHome);
  purchasingManagerModel.group.visible = false;
  scene.add(purchasingManagerModel.group);
  const managerTag = new GFX.Mesh(
    new GFX.PlaneGeometry(1.08, 0.22),
    new GFX.MeshBasicMaterial({ map: makeSignTexture('RAFAEL · BUYING', { background: '#40516a', foreground: '#f3ead6', accent: '#d3b77d', width: 320, height: 96, fontSize: 30 }), transparent: true, side: GFX.DoubleSide, depthTest: false, depthWrite: false }),
  );
  managerTag.renderOrder = 24;
  managerTag.visible = false;
  scene.add(managerTag);
  let managerTime = 0;
  let managerPoseAccumulator = 0;
  // Three true engine cats, fitted to house-cat dimensions and given separate roaming routes.
  const cats = CAT_ROSTER.map((cat, index) => {
    const model = createModel(GFX, CAT_DEFS[`cat-${cat.coat}`], { detail: 0.82 });
    const floor = normalizeActorHeight(model, CAT_HEIGHT);
    const place = [cat.place[0], floor, cat.place[2]];
    model.group.position.set(...place);
    model.group.rotation.y = index * 1.5;
    scene.add(model.group);
    const stops = CAT_PATROLS[index].map(([x,z])=>[x,0,z]);
    const route = planWalkRoute([place[0],0,place[2]], stops);
    return { ...cat, model, place, time: index * 3.7, route, distance: 0, wait: 0.4 + index * 0.55, poseAccumulator: 0, patrolStops: stops, patrolIndex: 0 };
  });

  const customerActors = new Map();

  function browseTargets(customer) {
    const targets = [];
    for (const line of customer.basket ?? [{ productId: customer.demandId }]) {
      const section = PRODUCT_BY_ID[line.productId]?.section ?? 'dry';
      const target = GROUP_TARGET[section] ?? GROUP_TARGET.dry;
      if (!targets.length || Math.hypot(target[0]-targets[targets.length-1][0],target[2]-targets[targets.length-1][2])>0.5) targets.push(target);
    }
    return targets.length ? targets : [GROUP_TARGET.dry];
  }

  function setCustomerRoute(actor, customer) {
    const current = [actor.model.group.position.x, 0, actor.model.group.position.z];
    if (customer.phase === 'browsing') {
      actor.route = planWalkRoute(current, browseTargets(customer));
      actor.routeFraction = 0.58; // arrive early enough to actually browse the last shelf
    } else if (customer.phase === 'checkout') {
      actor.route = planWalkRoute(current, [CHECKOUT]);
      actor.routeFraction = 0.96;
    } else {
      actor.route = planWalkRoute(current, [EXIT]);
      actor.routeFraction = 0.94;
    }
    actor.phase = customer.phase;
  }

  function createCustomerActor(customer) {
    const def = CUSTOMER_MODELS[customer.character] ?? tourist;
    const model = createModel(GFX, def, { detail: 0.7 });
    const floor = normalizeActorHeight(model, 1.38 + (customer.heightVariant ?? 1) * 0.06);
    model.group.position.set(EXIT[0], floor, EXIT[2]);
    scene.add(model.group);

    let catBadge = null;
    if (customer.catReaction === 'delighted' || customer.catReaction === 'annoyed') {
      const delighted = customer.catReaction === 'delighted';
      const texture = makeSignTexture(delighted ? '♥' : '!', {
        background: delighted ? '#315b45' : '#8e4b3d',
        foreground: '#fff5de',
        accent: delighted ? '#9ac08a' : '#e2a17f',
        width: 128, height: 128, fontSize: 76,
      });
      catBadge = new GFX.Mesh(
        new GFX.PlaneGeometry(0.34, 0.34),
        new GFX.MeshBasicMaterial({ map: texture, transparent: true, side: GFX.DoubleSide, depthTest: false, depthWrite: false }),
      );
      catBadge.renderOrder = 20;
      scene.add(catBadge);
    }
    const actor = { model, id: customer.id, catBadge, phase: null, route: [EXIT], routeFraction: 0.58, time: customer.id * 0.7, poseAccumulator: 0, floor };
    customerActors.set(customer.id, actor);
    setCustomerRoute(actor, customer);
    return actor;
  }

  function syncCustomers(state, dt) {
    const active = new Set(state.customers.map((c) => c.id));
    for (const [id, actor] of customerActors) {
      if (!active.has(id)) {
        scene.remove(actor.model.group);
        if (actor.catBadge) {
          scene.remove(actor.catBadge);
          actor.catBadge.geometry.dispose();
          actor.catBadge.material.map?.dispose();
          actor.catBadge.material.dispose();
        }
        actor.model.mesh.geometry.dispose();
        for (const material of Array.isArray(actor.model.materials) ? actor.model.materials : [actor.model.materials]) material?.dispose?.();
        customerActors.delete(id);
      }
    }
    for (const customer of state.customers) {
      let actor = customerActors.get(customer.id);
      if (!actor) actor = createCustomerActor(customer);
      if (actor.phase !== customer.phase) setCustomerRoute(actor, customer);
      const elapsed = Math.max(0, customer.phaseTotal - customer.phaseTimer);
      const moveDuration = Math.max(0.01, customer.phaseTotal * actor.routeFraction);
      const progress = Math.min(1, elapsed / moveDuration);
      const point = pointOnRoute(actor.route, progress);
      const ahead = pointOnRoute(actor.route, Math.min(1, progress + 0.025));
      actor.model.group.position.set(point[0], actor.floor, point[2]);
      if (progress < 1) faceAlong(actor.model.group, point, ahead);
      if (actor.catBadge) {
        actor.catBadge.position.set(point[0], actor.floor + 0.16, point[2]);
        actor.catBadge.quaternion.copy(stage.camera.quaternion);
        actor.catBadge.visible = customer.phase !== 'leaving';
      }
      actor.time += dt;
      actor.poseAccumulator += dt;
      if (actor.poseAccumulator >= 0.05) {
        actor.model.pose({ clip: progress < 1 ? 'walk' : customer.phase === 'checkout' ? 'idle' : 'look', t: actor.time, time: actor.time, seed: customer.id });
        actor.poseAccumulator %= 0.05;
      }
    }
  }

  function updateStaff(state, dt) {
    const floorLead = staffModels[1];
    const task = state.staffWork ?? { stage: 'idle' };
    const stage = task.stage ?? 'idle';
    const section = PRODUCT_BY_ID[task.productId]?.section ?? 'dry';
    const target = GROUP_TARGET[section] ?? GROUP_TARGET.dry;
    if (floorLead.routeStage !== stage || floorLead.routeProduct !== task.productId) {
      const current = [floorLead.model.group.position.x, 0, floorLead.model.group.position.z];
      const destination = stage === 'walking-to-shelf' || stage === 'stocking' ? target : floorLead.home;
      floorLead.route = planWalkRoute(current, [destination]);
      floorLead.routeStage = stage;
      floorLead.routeProduct = task.productId;
    }
    if (stage === 'walking-to-shelf' || stage === 'walking-back') {
      const progress = Math.min(1, Math.max(0, 1 - task.timer / Math.max(0.01, task.duration)));
      const point = pointOnRoute(floorLead.route, progress);
      const ahead = pointOnRoute(floorLead.route, Math.min(1, progress + 0.035));
      floorLead.model.group.position.set(point[0], floorLead.home[1], point[2]);
      if (progress < 1) faceAlong(floorLead.model.group, point, ahead);
    } else if (stage === 'stocking') {
      const end = floorLead.route[floorLead.route.length - 1];
      floorLead.model.group.position.set(end[0], floorLead.home[1], end[2]);
    } else {
      floorLead.model.group.position.set(...floorLead.home);
    }
    for (const worker of staffModels) {
      worker.time += dt;
      worker.poseAccumulator = (worker.poseAccumulator ?? 0) + dt;
      if (worker.poseAccumulator >= 0.05) {
        const moving = worker === floorLead && (stage === 'walking-to-shelf' || stage === 'walking-back');
        worker.model.pose({ clip: moving ? 'walk' : 'idle', t: worker.time, time: worker.time, seed: worker.name.length });
        worker.poseAccumulator %= 0.05;
      }
    }
  }

  function updateCats(dt) {
    for (const cat of cats) {
      cat.time += dt;
      cat.poseAccumulator = (cat.poseAccumulator ?? 0) + dt;
      const total = routeLength(cat.route);
      if (cat.wait > 0) {
        cat.wait -= dt;
        if (cat.poseAccumulator >= 0.08) {
          cat.model.pose({ clip: cat.wait > 1.2 ? 'sit' : 'look', t: cat.time, time: cat.time, seed: cat.time * 0.1, pace: 0.7 });
          cat.poseAccumulator %= 0.08;
        }
        continue;
      }
      cat.distance += dt * (cat.id === 'nyx' ? 0.52 : 0.62);
      const progress = total > 0 ? cat.distance / total : 1;
      if (progress >= 1) {
        cat.patrolIndex = (cat.patrolIndex + 1) % cat.patrolStops.length;
        const current = [cat.model.group.position.x, 0, cat.model.group.position.z];
        const nextStop = cat.patrolStops[cat.patrolIndex];
        cat.route = findWalkPath(current, nextStop);
        cat.distance = 0;
        cat.wait = 1.8 + ((cat.patrolIndex + cat.id.length) % 4) * 0.65;
        continue;
      }
      const point = pointOnRoute(cat.route, progress);
      const ahead = pointOnRoute(cat.route, Math.min(1, progress + 0.025));
      cat.model.group.position.set(point[0], cat.place[1], point[2]);
      faceAlong(cat.model.group, point, ahead);
      if (cat.poseAccumulator >= 0.05) {
        cat.model.pose({ clip: 'walk', t: cat.time, time: cat.time, seed: cat.id.length, pace: 0.8 });
        cat.poseAccumulator %= 0.05;
      }
    }
  }

  function syncDisplays(state) {
    for (const [id, display] of displayGroups) {
      const qty = shelfQuantity(state, id);
      if (display.lastQty === qty) continue;
      display.lastQty = qty;
      const visiblePacks = Math.min(display.packs.length, Math.ceil(qty / 2));
      display.packs.forEach((pack, i) => { pack.visible = i < visiblePacks; });
      display.group.visible = true;
      display.shelfLabel.material.opacity = 1;
      // A shelf with no stock gets a subtle warning colour on its price rail.
      if (qty === 0) display.shelfLabel.material.color.set('#777777');
      else display.shelfLabel.material.color.set('#ffffff');
    }
    // Staff and cats get a little life even when the shop is quiet.
  }

  function updatePlayer(state, dt) {
    const canMove = state.started && !state.paused && !state.dayEnded && !state.gameOver;
    let dx = (playerKeys.has('right') ? 1 : 0) - (playerKeys.has('left') ? 1 : 0);
    let dz = (playerKeys.has('down') ? 1 : 0) - (playerKeys.has('up') ? 1 : 0);
    const magnitude = Math.hypot(dx, dz);
    const moving = canMove && magnitude > 0;
    if (moving) {
      dx /= magnitude; dz /= magnitude;
      const speed = PLAYER_SPEED * (playerKeys.has('run') ? 1.45 : 1);
      const stepX = dx * speed * dt;
      const stepZ = dz * speed * dt;
      const nextX = player.x + stepX;
      const nextZ = player.z + stepZ;
      // Resolve axes separately so the owner can slide along a shelf edge.
      if (!navBlocked(nextX, player.z)) player.x = nextX;
      if (!navBlocked(player.x, nextZ)) player.z = nextZ;
      const direction = [dx, 0, dz];
      playerModel.group.rotation.y = Math.atan2(direction[0], direction[2]);
    }
    playerModel.group.position.set(player.x, player.floor, player.z);
    player.time += dt;
    player.poseAccumulator += dt;
    if (player.poseAccumulator >= 0.04) {
      playerModel.pose({ clip: moving ? 'walk' : 'idle', t: player.time, time: player.time, seed: 29, pace: playerKeys.has('run') ? 1.35 : 1 });
      player.poseAccumulator %= 0.04;
    }
    ownerTag.position.set(player.x, player.floor + 1.56, player.z);
    ownerTag.quaternion.copy(stage.camera.quaternion);
    ownerTag.visible = state.started;
    state.playerPosition = { x: player.x, z: player.z };
  }

  function updatePurchasingManager(state, dt) {
    const hired = Boolean(state.purchasingManagerHired);
    purchasingManagerModel.group.visible = hired;
    managerTag.visible = hired;
    if (!hired) return;
    managerTime += dt;
    managerPoseAccumulator += dt;
    if (managerPoseAccumulator >= 0.05) {
      purchasingManagerModel.pose({ clip: 'idle', t: managerTime, time: managerTime, seed: 43 });
      managerPoseAccumulator %= 0.05;
    }
    managerTag.position.set(managerHome[0], managerHome[1] + 1.56, managerHome[2]);
    managerTag.quaternion.copy(stage.camera.quaternion);
  }

  function update(state, dt, realTime = 0) {
    if (!state) return;
    syncDisplays(state);
    syncCustomers(state, dt);
    updateStaff(state, dt);
    updateCats(dt);
    updatePlayer(state, dt);
    updatePurchasingManager(state, dt);
    stage.target.set(0, 0.55, 0);
    // Slow, almost imperceptible neon / pendant movement keeps the room warm rather than static.
    if (stage.lantern) stage.lantern.intensity = 1.1 + Math.sin(realTime * 0.8) * 0.04;
  }

  onProgress('Setting up customer routes and cat patrols', 88);
  // Pointer drag rotates the store camera; the management panel remains ordinary DOM UI.
  let dragging = null;
  host.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
    host.setPointerCapture?.(event.pointerId);
  });
  host.addEventListener('pointermove', (event) => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    dragging.x = event.clientX; dragging.y = event.clientY;
    stage.view.turn(-dx * 0.006, dy * 0.0038);
  });
  const stopDrag = () => { dragging = null; };
  host.addEventListener('pointerup', stopDrag);
  host.addEventListener('pointercancel', stopDrag);
  host.addEventListener('wheel', (event) => {
    event.preventDefault();
    stage.view.zoomBy(Math.exp(event.deltaY * 0.001));
  }, { passive: false });

  const run = stage.run((dt) => {
    stage.view.step(dt);
    update(window.__bodegaState ?? null, dt, performance.now() / 1000);
  });

  const world = {
    stage,
    scene,
    cats,
    staffModels,
    player,
    purchasingManagerModel,
    displayGroups,
    update,
    setState(state) { window.__bodegaState = state; },
    setOpen(open) { openSign.material.color.set(open ? '#ffffff' : '#a0a0a0'); },
    dispose() { run?.(); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); },
  };
  window.__bodegaWorld = world;
  onProgress('The shutters are ready', 100);
  return world;
}
