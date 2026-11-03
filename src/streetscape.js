/**
 * The street and the alley round the shop, dressed with the engine's own street
 * furniture (`scenery/street`): sodium lamps, a hydrant, a bin, a bench, a mailbox,
 * shrubs by the door and a dumpster out back. The placements are plain data, so they
 * can be tested against the routes customers walk; `world.js` stands them up.
 * Where each goes is `STREET_ITEMS` in layout.js, which also keeps people from
 * walking through them.
 */
import { STREET } from 'madness-engine/scenery/street';
import { STREET_ITEMS } from './layout.js';

/** How much coarser than sculpted each is meshed: they are seen from across the street, and there are only a few. */
const COARSE = 1.5;

export { STREET_ITEMS as STREETSCAPE };

/** The engine's definition of each thing used, at the coarseness it is baked at. Made once, so each is baked once. */
export const STREET_MODELS = Object.fromEntries([...new Set(STREET_ITEMS.map((p) => p.model))].map((name) => {
  if (!STREET[name]) throw new Error(`the engine has no street model called ${name}`);
  return [name, { ...STREET[name], coarse: COARSE }];
}));
