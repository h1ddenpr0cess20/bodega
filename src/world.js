import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { createView } from 'madness-engine/view';
import { createModel } from 'madness-engine/models/model';
import { floorTexture, wallTexture } from 'madness-engine/textures/venue';
import { paintRoom } from 'madness-engine/textures/rooms/town';
import { paintSky } from 'madness-engine/textures/skies/haze';
import gent from 'madness-engine/characters/gent';
import vendor from 'madness-engine/characters/vendor';
import tourist from 'madness-engine/characters/tourist';
import punk from 'madness-engine/characters/punk';
import hippie from 'madness-engine/characters/hippie';
import neighbour from 'madness-engine/characters/neighbour';
import hipster from 'madness-engine/characters/hipster';
import cabbie from 'madness-engine/characters/cabbie';
import nonna from 'madness-engine/characters/nonna';
import beerguy from 'madness-engine/characters/beerguy';
import salaryman from 'madness-engine/characters/salaryman';
import pizzaiolo from 'madness-engine/characters/pizzaiolo';
import skater from 'madness-engine/characters/skater';
import { CAT_DEFS } from 'madness-engine/characters/cat';
import { PRODUCTS, CAT_ROSTER, STAFF, PRODUCT_BY_ID, shelfQuantity } from './sim.js';

const CUSTOMER_MODELS = { tourist, punk, hippie, neighbour, hipster, cabbie, nonna, beerguy, salaryman, pizzaiolo, skater };
const EXIT = [4.6, 0, 6.2];
const CHECKOUT = [6.4, 0, 3.45];
const DISPLAY = {
  apples: [-7.1, 0, -4.8], bananas: [-5.55, 0, -4.8], tomatoes: [-7.1, 0, -3.3], lettuce: [-5.55, 0, -3.3], potatoes: [-6.3, 0, -1.8],
  bread: [-6.3, 0, 0.45],
  rice: [-3.8, 0, -4.65], pasta: [-1.75, 0, -4.65], cereal: [0.3, 0, -4.65], beans: [-3.8, 0, -2.55], coffee: [-1.75, 0, -2.55],
  milk: [5.35, 0, -4.8], yogurt: [7.0, 0, -4.8], cheese: [5.35, 0, -3.4], butter: [7.0, 0, -3.4], eggs: [5.35, 0, -2.0], chicken: [7.0, 0, -2.0], beef: [5.35, 0, -0.6], deli: [7.0, 0, -0.6],
  soda: [1.85, 0, -4.8], water: [3.55, 0, -4.8], pizza: [1.85, 0, -3.0], icecream: [3.55, 0, -3.0],
};
const GROUP_TARGET = {
  produce: [-6.35, 0, -3.35], bakery: [-6.2, 0, 0.5], dry: [-2.65, 0, -3.15],
  chilled: [6.2, 0, -2.55], drinks: [2.8, 0, -4.5], frozen: [2.8, 0, -2.85],
};

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

export async function createBodegaWorld(host) {
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
  gondola(-2.55, -1.62, 5.8);
  gondola(2.3, -1.62, 3.5);
  const groceryHeader = new GFX.Mesh(new GFX.PlaneGeometry(3.3, 0.48), new GFX.MeshBasicMaterial({ map: makeSignTexture('PANTRY & DRY GOODS', { background: '#33464c', foreground: '#f4e9d1', accent: '#d16f53', fontSize: 40, height: 96 }), side: GFX.DoubleSide }));
  groceryHeader.position.set(-2.55, 2.22, -1.99); scene.add(groceryHeader);

  // Refrigerated wall: compressor plinth, glass doors, aluminium dividers and chilled shelves.
  box(scene, 6.15, 0.16, -2.75, 3.85, 0.3, 4.55, mats.steelDark);
  box(scene, 6.15, 2.22, -4.93, 3.85, 0.22, 0.16, mats.metal);
  box(scene, 6.15, 1.14, -0.54, 3.85, 0.2, 0.16, mats.metal);
  box(scene, 6.15, 1.21, -2.76, 3.7, 1.9, 0.08, mats.glass, { castShadow: false });
  for (const x of [4.28, 6.15, 8.02]) box(scene, x, 1.23, -2.76, 0.065, 2.0, 0.12, mats.metal);
  for (const z of [-4.15, -2.72, -1.28]) box(scene, 6.15, 0.78, z, 3.72, 0.075, 0.08, mats.trim);
  for (const x of [4.5, 5.75, 7.05, 7.8]) {
    const lamp = new GFX.PointLight('#b8e7f0', 5.5, 3.8, 1.6); lamp.position.set(x, 2.1, -2.7); scene.add(lamp);
  }
  const coldLabel = new GFX.Mesh(new GFX.PlaneGeometry(3.3, 0.42), new GFX.MeshBasicMaterial({ map: makeSignTexture('MILK · EGGS · MEAT', { background: '#38545a', foreground: '#eef3e5', accent: '#b3d9d2', fontSize: 35, height: 96 }), side: GFX.DoubleSide }));
  coldLabel.position.set(6.15, 2.45, -4.82); scene.add(coldLabel);

  // Beverage and freezer island at the far right of the centre aisle.
  box(scene, 2.72, 0.19, -4.0, 3.85, 0.32, 1.45, mats.steelDark);
  box(scene, 2.72, 0.64, -4.0, 3.85, 0.1, 1.42, mats.metal);
  box(scene, 2.72, 1.2, -4.0, 3.85, 0.12, 1.4, mats.metal);
  box(scene, 2.72, 1.76, -4.0, 3.85, 0.12, 1.4, mats.metal);
  const chilledHeader = new GFX.Mesh(new GFX.PlaneGeometry(2.9, 0.4), new GFX.MeshBasicMaterial({ map: makeSignTexture('COLD DRINKS · FROZEN', { background: '#31515b', foreground: '#f1eee0', accent: '#8ec6d6', fontSize: 34, height: 96 }), side: GFX.DoubleSide }));
  chilledHeader.position.set(2.72, 2.07, -4.69); scene.add(chilledHeader);

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

  // Small comforts: a newspaper rack, coffee station, trash bin, milk crate and hand trolley.
  box(scene, -8.05, 0.42, 1.75, 0.62, 0.82, 0.45, mats.dark);
  for (let k = 0; k < 5; k++) box(scene, -8.05, 0.57 + k * 0.03, 1.75 - k * 0.012, 0.52, 0.22, 0.015, mats.chalk, { rotation: [0.09, 0, (k - 2) * 0.035] });
  cylinder(scene, 0.15, 0.48, 4.7, 0.34, 0.34, 0.9, mats.steelDark, 20);
  box(scene, 0.15, 0.95, 4.7, 0.66, 0.11, 0.58, mats.dark);
  for (const x of [-0.65, 0.85]) cylinder(scene, x, 0.13, 4.15, 0.16, 0.16, 0.28, mats.steelDark, 12);
  box(scene, -7.95, 0.2, -0.5, 0.65, 0.42, 0.56, mats.wood);
  box(scene, -7.95, 0.44, -0.5, 0.68, 0.08, 0.6, mats.woodLight);

  // Product sign rails and the merchandise itself. Every shelf count is reflected in the scene.
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

  // Employee models are actual sculpted engine characters, with a distinct job and a home position.
  const staffModels = [];
  const lou = createModel(GFX, gent, { detail: 0.75 });
  lou.group.position.set(6.95, 0, 2.25); lou.group.rotation.y = -0.18; scene.add(lou.group);
  staffModels.push({ model: lou, character: 'gent', name: STAFF[0].name, time: 0, home: [6.95, 0, 2.25] });
  const marisol = createModel(GFX, vendor, { detail: 0.75 });
  marisol.group.position.set(-4.6, 0, -0.35); marisol.group.rotation.y = 0.8; scene.add(marisol.group);
  staffModels.push({ model: marisol, character: 'vendor', name: STAFF[1].name, time: 1.5, home: [-4.6, 0, -0.35] });

  // The cats are the most senior members of staff. Each coat comes from the engine's cat sculpt library.
  const cats = CAT_ROSTER.map((cat, index) => {
    const model = createModel(GFX, CAT_DEFS[`cat-${cat.coat}`], { detail: 0.82 });
    model.group.position.set(...cat.place);
    model.group.rotation.y = index * 1.5;
    scene.add(model.group);
    return { ...cat, model, time: index * 3.7 };
  });

  const customerActors = new Map();
  function targetFor(customer) {
    if (customer.phase === 'browsing') return GROUP_TARGET[PRODUCT_BY_ID[customer.demandId].section] ?? GROUP_TARGET.dry;
    if (customer.phase === 'checkout') return CHECKOUT;
    return EXIT;
  }
  function createCustomerActor(customer) {
    const def = CUSTOMER_MODELS[customer.character] ?? tourist;
    const model = createModel(GFX, def, { detail: 0.7 });
    model.group.position.set(...EXIT);
    model.group.rotation.y = Math.PI;
    scene.add(model.group);

    // A small billboard makes the random customer reaction visible in the shop.
    // It is deliberately separate from the character rig and disposed on exit.
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
    const actor = { model, id: customer.id, catBadge, phase: customer.phase, from: [...EXIT], to: [...targetFor(customer)], time: customer.id * 0.7, poseAccumulator: 0 };
    customerActors.set(customer.id, actor);
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
        customerActors.delete(id);
      }
    }
    for (const customer of state.customers) {
      let actor = customerActors.get(customer.id);
      if (!actor) actor = createCustomerActor(customer);
      if (actor.phase !== customer.phase) {
        actor.from = [actor.model.group.position.x, actor.model.group.position.y, actor.model.group.position.z];
        actor.to = [...targetFor(customer)];
        actor.phase = customer.phase;
      }
      const progress = 1 - Math.max(0, customer.phaseTimer) / Math.max(0.01, customer.phaseTotal);
      const smooth = progress * progress * (3 - 2 * progress);
      actor.model.group.position.set(
        actor.from[0] + (actor.to[0] - actor.from[0]) * smooth,
        0,
        actor.from[2] + (actor.to[2] - actor.from[2]) * smooth,
      );
      actor.model.group.rotation.y = customer.phase === 'leaving' ? Math.PI : 0;
      if (actor.catBadge) {
        actor.catBadge.position.set(actor.model.group.position.x, 1.48, actor.model.group.position.z);
        actor.catBadge.quaternion.copy(stage.camera.quaternion);
        actor.catBadge.visible = customer.phase !== 'leaving';
      }
      actor.time += dt;
      actor.poseAccumulator += dt;
      if (actor.poseAccumulator >= 0.05) {
        actor.model.pose({ clip: customer.phase === 'checkout' ? 'idle' : 'walk', t: actor.time, time: actor.time, seed: customer.id });
        actor.poseAccumulator %= 0.05;
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

  function update(state, dt, realTime = 0) {
    if (!state) return;
    syncDisplays(state);
    syncCustomers(state, dt);
    for (const worker of staffModels) {
      worker.time += dt;
      worker.poseAccumulator = (worker.poseAccumulator ?? 0) + dt;
      if (worker.poseAccumulator >= 0.05) {
        worker.model.pose({ clip: 'idle', t: worker.time, time: worker.time, seed: worker.name.length });
        worker.poseAccumulator %= 0.05;
      }
    }
    for (const cat of cats) {
      cat.time += dt;
      cat.poseAccumulator = (cat.poseAccumulator ?? 0) + dt;
      const playing = cat.id === 'jinx' && Math.sin(cat.time * 0.22) > 0.88;
      if (cat.poseAccumulator >= 0.05) {
        cat.model.pose({ clip: playing ? 'play' : 'sit', t: cat.time, time: cat.time, seed: cat.time * 0.1 });
        cat.poseAccumulator %= 0.05;
      }
      cat.model.group.rotation.y = Math.sin(cat.time * 0.28 + cat.time * 0.03) * 0.18;
    }
    stage.target.set(0, 0.55, 0);
    // Slow, almost imperceptible neon / pendant movement keeps the room warm rather than static.
    if (stage.lantern) stage.lantern.intensity = 1.1 + Math.sin(realTime * 0.8) * 0.04;
  }

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
    displayGroups,
    update,
    setState(state) { window.__bodegaState = state; },
    setOpen(open) { openSign.material.color.set(open ? '#ffffff' : '#a0a0a0'); },
    dispose() { run?.(); },
  };
  window.__bodegaWorld = world;
  return world;
}
