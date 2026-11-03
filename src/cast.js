/**
 * Every model the shop uses, by name: the staff, the owner, the cats, the
 * residents (each their own person from the engine's cast, in their own skin,
 * hair and eyes) and the stock. The page and the bake worker both import this,
 * so a name means the same definition in both and a mesh baked in a worker can be
 * adopted on the page.
 */
import { cloth, person } from 'madness-engine/characters/person';
import { CAT_DEFS } from 'madness-engine/characters/cat';
import { GROCERIES } from 'madness-engine/props/groceries';
import gent from 'madness-engine/characters/gent';
import vendor from 'madness-engine/characters/vendor';
import purchasingSuit from 'madness-engine/characters/suit';
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
import shopper from 'madness-engine/characters/shopper';
import oldtimer from 'madness-engine/characters/oldtimer';
import mailcarrier from 'madness-engine/characters/mailcarrier';
import crossingguard from 'madness-engine/characters/crossingguard';
import engineer from 'madness-engine/characters/engineer';
import barista from 'madness-engine/characters/barista';
import influencer from 'madness-engine/characters/influencer';
import foreman from 'madness-engine/characters/foreman';
import { RESIDENTS, CAT_ROSTER } from './sim.js';

const BASES = { tourist, punk, hippie, artist, hipster, cabbie, nonna, beerguy, salaryman, pizzaiolo, skater, shopper, oldtimer, mailcarrier, crossingguard, engineer, barista, influencer, foreman };

/** The store owner, whom the player walks about as: a regular person in a green work shirt, not a boss. */
export const OWNER_CHARACTER = person({
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

/** Which engine prop is each product on the shelf. */
export const PRODUCT_PROP = {
  apples: 'apples', bananas: 'bananas', tomatoes: 'tomatoes', lettuce: 'lettuce', potatoes: 'potatoes',
  milk: 'milk', yogurt: 'yogurt', cheese: 'cheddar', butter: 'butter', eggs: 'eggs',
  bread: 'bread', chicken: 'chicken', beef: 'beef', deli: 'turkey',
  rice: 'rice', pasta: 'spaghetti', cereal: 'cereal', beans: 'beans', coffee: 'coffee',
  soda: 'cola', water: 'water', pizza: 'pizza', icecream: 'icecream',
  oranges: 'oranges', carrots: 'carrots', onions: 'onions', peppers: 'peppers', grapes: 'grapes',
  flour: 'flour', sugar: 'sugar', oats: 'oats', peanutbutter: 'peanutbutter',
  chips: 'chips', cookies: 'cookies', candybar: 'candybar',
  orangejuice: 'orangejuice', bacon: 'bacon', sourcream: 'sourcream',
};

export const CAST = {
  'staff:lou': gent,
  'staff:marisol': vendor,
  'staff:rafael': purchasingSuit,
  owner: OWNER_CHARACTER,
  'prop:carton': GROCERIES.carton,
};
for (const cat of CAT_ROSTER) CAST[`cat:${cat.id}`] = CAT_DEFS[`cat-${cat.coat}`];
for (const resident of RESIDENTS) CAST[`resident:${resident.id}`] = BASES[resident.character].variant({ ...resident.look, name: `resident-${resident.id}` });
for (const [productId, prop] of Object.entries(PRODUCT_PROP)) CAST[`prop:${productId}`] = GROCERIES[prop];

/** How finely each kind of model is baked: shelf stock and passers-by are small on screen, and a person takes seconds to sculpt. */
export const DETAIL = { prop: 0.55, resident: 0.45, staff: 0.6, owner: 0.7, cat: 0.6 };
export const detailOf = (name) => DETAIL[name.split(':')[0]] ?? 0.6;

/** What is baked behind the loading screen; the rest of the residents are baked while the shop is open. */
export const FIRST_WAVE = ['russo', 'walt', 'jules', 'priya'];
export const loadingJobs = () => Object.keys(CAST)
  .filter((name) => !name.startsWith('resident:') || FIRST_WAVE.includes(name.slice(9)))
  .filter((name) => name !== 'staff:rafael')
  .map((name) => [name, detailOf(name)]);
export const backgroundJobs = () => Object.keys(CAST)
  .filter((name) => (name.startsWith('resident:') && !FIRST_WAVE.includes(name.slice(9))) || name === 'staff:rafael')
  .map((name) => [name, detailOf(name)]);
