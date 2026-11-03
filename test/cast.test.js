import test from 'node:test';
import assert from 'node:assert/strict';
import { CAST, PRODUCT_PROP, DETAIL, detailOf, loadingJobs, backgroundJobs, FIRST_WAVE } from '../src/cast.js';
import { PRODUCTS, RESIDENTS, CAT_ROSTER } from '../src/sim.js';
import tourist from 'madness-engine/characters/tourist';

test('every product on the shelf is an engine prop, and every resident is a person of their own', () => {
  for (const product of PRODUCTS) {
    assert.ok(PRODUCT_PROP[product.id], `${product.id} has no prop`);
    const def = CAST[`prop:${product.id}`];
    assert.equal(typeof def.sculpt, 'function', `${product.id} is not a sculpted prop`);
  }
  const defs = new Set();
  for (const r of RESIDENTS) {
    const def = CAST[`resident:${r.id}`];
    assert.ok(def && typeof def.sculpt === 'function', `${r.id} was not dressed`);
    assert.equal(def.name, `resident-${r.id}`);
    defs.add(def);
  }
  assert.equal(defs.size, RESIDENTS.length, 'no two residents share a model');
  for (const cat of CAT_ROSTER) assert.ok(CAST[`cat:${cat.id}`], cat.id);
  for (const name of ['staff:lou', 'staff:marisol', 'staff:rafael', 'owner']) assert.ok(CAST[name], name);
});

test('a resident is the same person dressed in their own skin, hair and eyes', () => {
  const maya = RESIDENTS.find((r) => r.id === 'maya');
  assert.equal(maya.character, 'tourist');
  // Asking the engine again for the same colors gives the same model, so it is baked once however often it is asked.
  assert.equal(tourist.variant({ ...maya.look, name: 'resident-maya' }), CAST['resident:maya']);
  assert.notEqual(tourist.variant({ ...maya.look, skin: '#f6dcc8', name: 'resident-maya' }), CAST['resident:maya']);
});

test('the models baked behind the loading screen and in the background cover the cast exactly once', () => {
  const first = loadingJobs().map(([n]) => n), later = backgroundJobs().map(([n]) => n);
  assert.deepEqual(first.filter((n) => later.includes(n)), [], 'nothing is baked twice');
  assert.deepEqual([...first, ...later].sort(), Object.keys(CAST).sort(), 'everything is baked');
  for (const id of FIRST_WAVE) assert.ok(first.includes(`resident:${id}`), `${id} is in the first wave`);
  assert.ok(later.includes('staff:rafael'), 'the purchasing manager bakes in the background until he is hired');
  for (const [name, detail] of [...loadingJobs(), ...backgroundJobs()]) assert.equal(detail, detailOf(name));
  assert.ok(DETAIL.prop < 1 && DETAIL.resident < 1);
});
