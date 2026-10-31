import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS, createGameState, productNow, placeOrder, restockProduct, pullExpired,
  oldestShelfBatch, sellFromShelf, borrowCredit, repayCredit, advanceGame,
  beginDay, startNextDay, adjustPrice, PRODUCT_BY_ID, saveGameState, loadGameState,
  REVIEW_BANK, maybeLeaveReview, customerArrivalInterval, trafficLabel, reviewSummary,
  PURCHASING_MANAGER, getStoreLevel, getStoreLevelProgress, hirePurchasingManager, setAutomaticPurchasing,
} from '../src/sim.js';

function prepareState() {
  const state = createGameState(7);
  state.started = true;
  state.paused = false;
  return state;
}

test('the catalogue covers produce, dry goods, dairy, eggs, meat, bakery and frozen groceries', () => {
  const categories = new Set(PRODUCTS.map((p) => p.category));
  for (const category of ['Produce', 'Dry goods', 'Dairy', 'Eggs', 'Meat', 'Bakery', 'Frozen', 'Drinks']) assert.ok(categories.has(category), category);
});

test('fresh produce, chilled goods and dry pantry staples have distinct expiry horizons', () => {
  assert.equal(PRODUCT_BY_ID.lettuce.shelfLife, 3);
  assert.equal(PRODUCT_BY_ID.milk.shelfLife, 6);
  assert.equal(PRODUCT_BY_ID.eggs.shelfLife, 28);
  assert.equal(PRODUCT_BY_ID.pasta.shelfLife, 240);
  assert.ok(PRODUCT_BY_ID.lettuce.shelfLife < PRODUCT_BY_ID.milk.shelfLife);
  assert.ok(PRODUCT_BY_ID.milk.shelfLife < PRODUCT_BY_ID.eggs.shelfLife);
  assert.ok(PRODUCT_BY_ID.eggs.shelfLife < PRODUCT_BY_ID.pasta.shelfLife);
});

test('supplier deliveries go to the stockroom, not directly to a shelf', () => {
  const state = prepareState();
  const beforeShelf = state.shelves.rice.reduce((n, b) => n + b.qty, 0);
  const beforeBackroom = state.stockroom.rice.reduce((n, b) => n + b.qty, 0);
  const order = placeOrder(state, 'rice', 2);
  assert.equal(order.ok, true);
  assert.equal(state.shelves.rice.reduce((n, b) => n + b.qty, 0), beforeShelf);
  assert.equal(state.stockroom.rice.reduce((n, b) => n + b.qty, 0), beforeBackroom + PRODUCT_BY_ID.rice.caseSize * 2);
});

test('restocking moves earliest-expiring stock to the shelf and preserves its original expiry', () => {
  const state = prepareState();
  const ordered = placeOrder(state, 'milk', 1);
  assert.equal(ordered.ok, true);
  const delivery = state.stockroom.milk[0];
  const originalExpiry = delivery.expiresAt;
  const deliveryLotId = delivery.lotId;
  const originalFront = oldestShelfBatch(state, 'milk').expiresAt;
  const result = restockProduct(state, 'milk');
  assert.ok(result.moved > 0);
  assert.equal(state.stockroom.milk.length, 0);
  const movedLot = state.shelves.milk.find((batch) => batch.lotId === deliveryLotId);
  assert.equal(movedLot.expiresAt, originalExpiry);
  assert.equal(state.shelves.milk[0].expiresAt, originalFront);
  assert.ok(state.shelves.milk.every((batch, i, all) => i === 0 || all[i - 1].expiresAt <= batch.expiresAt));
});

test('FIFO checkout consumes the oldest lot first', () => {
  const state = prepareState();
  const productId = 'rice';
  const later = state.shelves[productId].at(-1);
  const older = { ...later, lotId: later.lotId + 10000, qty: 2, expiresAt: later.expiresAt - 4, receivedAt: later.receivedAt - 4 };
  state.shelves[productId].push(older);
  const beforeOldest = older.qty;
  sellFromShelf(state, productId, 1);
  assert.equal(older.qty, beforeOldest - 1);
  assert.equal(state.shelves[productId][0].lotId, older.lotId);
});

test('expired stock at the front of the shelf cannot be sold', () => {
  const state = prepareState();
  const batch = state.shelves.bananas[0];
  batch.expiresAt = productNow(state) - 0.01;
  const cash = state.cash;
  const result = sellFromShelf(state, 'bananas', 1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'expired');
  assert.equal(state.cash, cash);
});

test('pulling expired stock clears shelf and stockroom batches and books wholesale waste', () => {
  const state = prepareState();
  const reputation = state.reputation;
  state.shelves.bananas[0].expiresAt = productNow(state) - 1;
  state.stockroom.beans.push({ lotId: 999, qty: 4, receivedAt: 0, expiresAt: productNow(state) - 1, unitCost: 0.48 });
  const result = pullExpired(state);
  assert.ok(result.removed >= 6);
  assert.equal(state.shelves.bananas.some((batch) => batch.expiresAt <= productNow(state)), false);
  assert.equal(state.stockroom.beans.length, 0);
  assert.ok(state.dayStats.waste > 0);
  assert.equal(state.reputation, reputation, 'proactive removal prevents complaints and should not itself cost trust');
});

test('credit can be drawn and repaid, but never beyond the credit limit or cash balance', () => {
  const state = prepareState();
  const loan = borrowCredit(state, 500);
  assert.equal(loan.ok, true);
  assert.equal(state.debt, 500);
  assert.equal(borrowCredit(state, 2000).ok, false);
  const paid = repayCredit(state, 125);
  assert.equal(paid.amount, 125);
  assert.equal(state.debt, 375);
  state.cash = 20;
  assert.equal(repayCredit(state, 100).amount, 20);
});

test('prices cannot be reduced below cost or raised without a sensible cap', () => {
  const state = prepareState();
  adjustPrice(state, 'milk', -100);
  assert.ok(state.prices.milk > PRODUCT_BY_ID.milk.cost);
  adjustPrice(state, 'milk', 100);
  assert.ok(state.prices.milk <= PRODUCT_BY_ID.milk.price * 2.25);
});

test('day closure charges fixed operating costs and daily interest; next day resets the books', () => {
  const state = prepareState();
  beginDay(state);
  borrowCredit(state, 200);
  state.minute = 20 * 60 + 59;
  advanceGame(state, 2);
  assert.equal(state.dayEnded, true);
  assert.equal(state.paused, true);
  assert.equal(state.debt, 202.5);
  assert.ok(state.cash < 1450);
  const previousDay = state.day;
  assert.equal(startNextDay(state), true);
  assert.equal(state.day, previousDay + 1);
  assert.equal(state.minute, 7 * 60);
  assert.equal(state.dayEnded, false);
  assert.equal(state.paused, false);
});

test('a shopper gets angry when the front-facing batch is expired', () => {
  const state = prepareState();
  state.shelves.bananas[0].expiresAt = productNow(state) - 0.01;
  state.nextArrival = 100000;
  state.customers.push({ id: 999, character: 'artist', name: 'Mrs. Russo', tag: 'regular', demandId: 'bananas', basket: [{ productId: 'bananas', qty: 1 }, { productId: 'milk', qty: 1 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0 });
  advanceGame(state, 0.05);
  assert.equal(state.dayStats.complaints, 1);
  assert.equal(state.customers[0].result, 'expired');
  assert.ok(state.events.some((event) => /expired bananas/i.test(event.message)));
});

test('a saved store resumes its exact ledger and pauses safely after reload', () => {
  const state = prepareState();
  placeOrder(state, 'eggs', 2);
  borrowCredit(state, 125);
  const copy = loadGameState(saveGameState(state));
  assert.ok(copy);
  assert.equal(copy.cash, state.cash);
  assert.equal(copy.debt, state.debt);
  assert.equal(copy.stockroom.eggs[0].qty, state.stockroom.eggs[0].qty);
  assert.equal(copy.paused, true);
  assert.equal(typeof copy.random, 'function');
  assert.equal(copy.random(), state.random());
  assert.equal(loadGameState('{broken'), null);
});

test('customers shop with multi-line baskets and can complete valid lines after rejecting an expired item', () => {
  const state = prepareState();
  state.shelves.bananas[0].expiresAt = productNow(state) - 0.01;
  const cash = state.cash;
  const customer = { id: 1000, character: 'artist', name: 'Mr. Delgado', tag: 'regular', demandId: 'bananas', basket: [{ productId: 'bananas', qty: 1 }, { productId: 'milk', qty: 2 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0 };
  state.nextArrival = 100000;
  state.customers.push(customer);
  advanceGame(state, 0.05);
  assert.equal(customer.result, 'expired');
  assert.equal(customer.bought, 2);
  assert.ok(customer.spend > 0);
  assert.ok(state.cash > cash);
  assert.equal(state.dayStats.complaints, 1);
});

test('unhappy expired-stock visits are very likely to create a low-star public review', () => {
  const state = prepareState();
  const customer = {
    id: 1001, name: 'Mrs. Russo', result: 'expired', expiredProductId: 'milk', demandId: 'milk',
  };
  state.random = () => 0;
  const before = state.reputation;
  const review = maybeLeaveReview(state, customer);
  assert.ok(review);
  assert.equal(review.rating, 1);
  assert.match(review.text, /whole milk/i);
  assert.equal(review.outcome, 'expired');
  assert.ok(state.reputation < before);
  assert.equal(reviewSummary(state).count, 5);
  assert.ok(REVIEW_BANK.expired.length >= 8);
});

test('happy customers occasionally leave positive reviews without every shopper posting', () => {
  const state = prepareState();
  const customer = { id: 1002, name: 'Maya', result: 'sold', demandId: 'bread' };
  state.random = () => 0;
  const before = state.reputation;
  const review = maybeLeaveReview(state, customer);
  assert.equal(review.rating, 5);
  assert.ok(state.reputation > before);
  assert.ok(REVIEW_BANK.five.length >= 10);
  assert.ok(REVIEW_BANK.four.length >= 8);
  assert.ok(REVIEW_BANK.three.length >= 6);
  assert.ok(REVIEW_BANK.two.length >= 5);
});

test('neighborhood reputation changes customer arrival intervals and displayed footfall', () => {
  const popular = createGameState(123);
  const struggling = createGameState(123);
  popular.reputation = 94;
  struggling.reputation = 32;
  assert.ok(customerArrivalInterval(popular) < customerArrivalInterval(struggling));
  assert.equal(trafficLabel(popular), 'BUSY');
  assert.equal(trafficLabel(struggling), 'SLOW');
});

test('expired-item complaints turn into a review when the unhappy shopper leaves', () => {
  const state = prepareState();
  state.random = () => 0;
  state.shelves.bananas[0].expiresAt = productNow(state) - 0.01;
  state.nextArrival = 100000;
  const customer = {
    id: 1003, character: 'artist', name: 'Mr. Delgado', tag: 'regular',
    demandId: 'bananas', basket: [{ productId: 'bananas', qty: 1 }],
    phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0,
  };
  state.customers.push(customer);
  const startingTrust = state.reputation;
  advanceGame(state, 0.05);
  assert.equal(customer.result, 'expired');
  assert.ok(state.reputation < startingTrust);
  advanceGame(state, 3.9);
  advanceGame(state, 3.3);
  assert.equal(state.customers.length, 0);
  assert.equal(state.reviews[0].rating, 1);
  assert.match(state.reviews[0].text, /bananas/i);
  assert.ok(state.reputation < startingTrust - 2.25);
  assert.ok(state.events.some((event) => event.type === 'review'));
});

test('older saves migrate to the review feed without losing their ledger', () => {
  const state = prepareState();
  placeOrder(state, 'eggs', 1);
  const legacy = JSON.parse(saveGameState(state));
  delete legacy.reviews;
  delete legacy.reviewSequence;
  const loaded = loadGameState(legacy);
  assert.ok(loaded);
  assert.equal(loaded.stockroom.eggs[0].qty, state.stockroom.eggs[0].qty);
  assert.ok(loaded.reviews.length >= 4);
  assert.equal(loaded.reviewSequence, loaded.reviews[0].id);
});

test('customers roll independent opinions of the cats when they enter the bodega', () => {
  const delighted = prepareState();
  delighted.random = () => 0;
  delighted.nextArrival = delighted.minute + 0.01;
  advanceGame(delighted, 0.05);
  assert.equal(delighted.customers[0].catReaction, 'delighted');
  assert.equal(delighted.customers[0].catName, 'Blaze');
  const annoyed = prepareState();
  annoyed.random = () => 0.3;
  annoyed.nextArrival = annoyed.minute + 0.01;
  advanceGame(annoyed, 0.05);
  assert.equal(annoyed.customers[0].catReaction, 'annoyed');
  assert.ok(annoyed.customers[0].catName);
});

test('cat encounters have a small direct effect on reputation and daily store stats', () => {
  const delighted = prepareState();
  const customer = {
    id: 1101, character: 'tourist', name: 'Maya', tag: 'visitor', demandId: 'apples',
    basket: [{ productId: 'apples', qty: 1 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04,
    result: null, bought: 0, spend: 0, catReaction: 'delighted', catName: 'Jinx',
  };
  delighted.customers.push(customer);
  delighted.nextArrival = 100000;
  const beforeDelighted = delighted.reputation;
  advanceGame(delighted, 0.05);
  assert.equal(delighted.dayStats.catLoved, 1);
  assert.ok(delighted.reputation > beforeDelighted);
  assert.ok(delighted.events.some((event) => /stopped to see Jinx/.test(event.message)));

  const annoyed = prepareState();
  const annoyedCustomer = {
    ...customer, id: 1102, name: 'Rico', catReaction: 'annoyed', catName: 'Nyx',
    basket: [{ productId: 'apples', qty: 1 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04,
  };
  annoyed.customers.push(annoyedCustomer);
  annoyed.nextArrival = 100000;
  const beforeAnnoyed = annoyed.reputation;
  advanceGame(annoyed, 0.05);
  assert.equal(annoyed.dayStats.catAnnoyed, 1);
  assert.ok(annoyed.reputation < beforeAnnoyed);
  assert.ok(annoyed.events.some((event) => /bothered by Nyx/.test(event.message)));
});

test('cat lovers and cat-averse customers can publish distinct public reviews', () => {
  assert.ok(REVIEW_BANK.catLoved.length >= 8);
  assert.ok(REVIEW_BANK.catAnnoyed.length >= 8);
  const loved = prepareState();
  loved.random = () => 0;
  const positive = maybeLeaveReview(loved, {
    id: 1201, name: 'Maya', result: 'sold', demandId: 'bread', catReaction: 'delighted', catName: 'Jinx',
  });
  assert.equal(positive.rating, 5);
  assert.equal(positive.outcome, 'cat-loved');
  assert.match(positive.text, /Jinx/);
  const annoyed = prepareState();
  annoyed.random = () => 0;
  const negative = maybeLeaveReview(annoyed, {
    id: 1202, name: 'Rico', result: 'sold', demandId: 'milk', catReaction: 'annoyed', catName: 'Nyx',
  });
  assert.equal(negative.rating, 2);
  assert.equal(negative.outcome, 'cat-annoyed');
  assert.match(negative.text, /Nyx/);
});

test('cat preferences survive saving and older saves gain safe reaction counters', () => {
  const state = prepareState();
  state.dayStats.catLoved = 3;
  state.dayStats.catAnnoyed = 2;
  state.customers.push({ id: 1301, name: 'Maya', catReaction: 'delighted', catName: 'Blaze' });
  const restored = loadGameState(saveGameState(state));
  assert.equal(restored.dayStats.catLoved, 3);
  assert.equal(restored.dayStats.catAnnoyed, 2);
  assert.equal(restored.customers[0].catReaction, 'delighted');
  assert.equal(restored.customers[0].catName, 'Blaze');
  const legacy = JSON.parse(saveGameState(state));
  delete legacy.dayStats.catLoved;
  delete legacy.dayStats.catAnnoyed;
  const migrated = loadGameState(legacy);
  assert.equal(migrated.dayStats.catLoved, 0);
  assert.equal(migrated.dayStats.catAnnoyed, 0);
});

test('a requested quantity that exceeds shelf stock is counted as a partial basket and stockout', () => {
  const state = prepareState();
  state.shelves.apples = [{ lotId: 50001, qty: 2, receivedAt: productNow(state), expiresAt: productNow(state) + 5, unitCost: PRODUCT_BY_ID.apples.cost }];
  state.nextArrival = 100000;
  const customer = {
    id: 1401, character: 'artist', name: 'Mr. Delgado', demandId: 'apples', basket: [{ productId: 'apples', qty: 4 }],
    phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0,
  };
  state.customers.push(customer);
  advanceGame(state, 0.05);
  assert.equal(customer.bought, 2);
  assert.equal(customer.result, 'partial');
  assert.equal(state.dayStats.stockouts, 1);
  assert.ok(state.events.some((event) => /only get 2 of 4 apples/.test(event.message)));
});

test('food-safety reviews take precedence when the same visit also has a cat encounter', () => {
  const state = prepareState();
  state.random = () => 0;
  const before = state.reputation;
  const review = maybeLeaveReview(state, {
    id: 1501, name: 'Mrs. Russo', result: 'expired', expiredProductId: 'milk', demandId: 'milk',
    catReaction: 'annoyed', catName: 'Nyx',
  });
  assert.equal(review.outcome, 'expired');
  assert.equal(review.rating, 1);
  assert.match(review.text, /whole milk/i);
  assert.doesNotMatch(review.text, /Nyx/);
  assert.ok(state.reputation < before);
});



test('purchasing manager stays locked until the store reaches Level 5', () => {
  const state = prepareState();
  const result = hirePurchasingManager(state);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'level-required');
  assert.equal(result.requiredLevel, 5);
  state.experience = 999;
  assert.equal(getStoreLevel(state), 4);
  assert.equal(hirePurchasingManager(state).reason, 'level-required');
});

test('store experience unlocks Level 5 and the experience bar reports progress', () => {
  const state = createGameState(77);
  state.experience = 999;
  assert.equal(getStoreLevel(state), 4);
  assert.equal(getStoreLevelProgress(state).remaining, 1);
  state.experience = 1000;
  assert.equal(getStoreLevel(state), 5);
  assert.equal(getStoreLevelProgress(state).progress, 0);
});

test('hiring Rafael charges the recruitment cost and adds his daily wage to payroll', () => {
  const state = prepareState();
  state.experience = 1000;
  state.cash = 800;
  const before = state.cash;
  const result = hirePurchasingManager(state);
  assert.equal(result.ok, true);
  assert.equal(result.hireCost, PURCHASING_MANAGER.hireCost);
  assert.equal(state.cash, before - PURCHASING_MANAGER.hireCost);
  assert.equal(state.purchasingManagerHired, true);
  assert.equal(state.automaticPurchasingEnabled, true);
  assert.equal(state.dailyCosts.payroll, 44);
  assert.equal(hirePurchasingManager(state).reason, 'already-hired');
});

test('Rafael automatically orders a needed case from cash, not borrowed credit', () => {
  const state = prepareState();
  state.experience = 1000;
  state.cash = 900;
  assert.equal(hirePurchasingManager(state).ok, true);
  state.shelves.bananas = [];
  state.stockroom.bananas = [];
  const cashBeforeOrder = state.cash;
  const debtBeforeOrder = state.debt;
  state.nextAutoOrderAt = state.minute;
  advanceGame(state, 0.2);
  const backroomQty = state.stockroom.bananas.reduce((sum, batch) => sum + batch.qty, 0);
  assert.ok(backroomQty >= PRODUCT_BY_ID.bananas.caseSize);
  assert.ok(state.cash < cashBeforeOrder);
  assert.equal(state.debt, debtBeforeOrder);
  assert.ok(state.events.some((event) => event.type === 'staff' && /Rafael Ortiz ordered/.test(event.message)));
});

test('Rafael protects the cash reserve and can pause automatic purchasing', () => {
  const state = prepareState();
  state.experience = 1000;
  state.cash = 900;
  assert.equal(hirePurchasingManager(state).ok, true);
  state.shelves.milk = [];
  state.stockroom.milk = [];
  state.cash = PURCHASING_MANAGER.cashReserve + 1;
  const cashAtReserve = state.cash;
  state.nextAutoOrderAt = state.minute;
  advanceGame(state, 0.2);
  assert.equal(state.stockroom.milk.reduce((sum, batch) => sum + batch.qty, 0), 0);
  assert.equal(state.cash, cashAtReserve);
  assert.equal(state.debt, 0);
  assert.equal(setAutomaticPurchasing(state, false), true);
  assert.equal(state.automaticPurchasingEnabled, false);
  assert.ok(state.events.some((event) => event.type === 'staff' && /Automatic purchasing paused/.test(event.message)));
});

test('player position, store level and manager status survive saving and migration', () => {
  const state = prepareState();
  state.playerPosition = { x: -2.4, z: 1.8 };
  state.experience = 725;
  state.purchasingManagerHired = true;
  state.automaticPurchasingEnabled = false;
  const restored = loadGameState(saveGameState(state));
  assert.deepEqual(restored.playerPosition, { x: -2.4, z: 1.8 });
  assert.equal(restored.experience, 725);
  assert.equal(restored.purchasingManagerHired, true);
  assert.equal(restored.automaticPurchasingEnabled, false);
  assert.equal(restored.dailyCosts.payroll, 44);
});
