import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS, createGameState, productNow, placeOrder, restockProduct, pullExpired,
  oldestShelfBatch, sellFromShelf, borrowCredit, repayCredit, advanceGame,
  beginDay, startNextDay, adjustPrice, PRODUCT_BY_ID, saveGameState, loadGameState,
  REVIEW_BANK, maybeLeaveReview, customerArrivalInterval, trafficLabel, reviewSummary,
  RESIDENTS, RESIDENT_BY_ID, chooseResident, buildBasket, PURCHASING_MANAGER, getStoreLevel, getStoreLevelProgress, hirePurchasingManager, setAutomaticPurchasing, activeFrameDelta,
} from '../src/sim.js';

function prepareState() {
  const state = createGameState(7);
  state.started = true;
  state.paused = false;
  return state;
}

test('the shared frame delta respects pause state and selected game speed', () => {
  const state = createGameState();
  assert.equal(activeFrameDelta(state, 0.1), 0);
  state.started = true;
  state.paused = false;
  assert.equal(activeFrameDelta(state, 0.1), 0.1);
  state.speed = 0.5;
  assert.equal(activeFrameDelta(state, 0.1), 0.05);
  state.speed = 2;
  assert.equal(activeFrameDelta(state, 0.1), 0.2);
  state.paused = true;
  assert.equal(activeFrameDelta(state, 0.1), 0);
  state.paused = false;
  state.dayEnded = true;
  assert.equal(activeFrameDelta(state, 0.1), 0);
  state.dayEnded = false;
  state.gameOver = true;
  assert.equal(activeFrameDelta(state, 0.1), 0);
  assert.equal(activeFrameDelta(state, Number.NaN), 0);
});

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

test('a saved store resumes its exact ledger and active simulation after reload', () => {
  const state = prepareState();
  placeOrder(state, 'eggs', 2);
  borrowCredit(state, 125);
  const copy = loadGameState(saveGameState(state));
  assert.ok(copy);
  assert.equal(copy.cash, state.cash);
  assert.equal(copy.debt, state.debt);
  assert.equal(copy.stockroom.eggs[0].qty, state.stockroom.eggs[0].qty);
  assert.equal(copy.paused, false);
  assert.equal(typeof copy.random, 'function');
  assert.equal(copy.random(), state.random());
  assert.equal(loadGameState('{broken'), null);
});

test('a restored open store advances customer movement and the business clock without pressing resume', () => {
  const state = prepareState();
  state.minute = 9 * 60;
  state.customers.push({
    id: 9991, character: 'artist', name: 'Maya', tag: 'visitor', demandId: 'apples',
    basket: [{ productId: 'apples', qty: 1 }], phase: 'browsing',
    phaseTotal: 30, phaseTimer: 30, result: null, bought: 0, spend: 0,
  });
  const restored = loadGameState(saveGameState(state));
  assert.ok(restored);
  assert.equal(restored.paused, false);
  const beforeMinute = restored.minute;
  const beforeTimer = restored.customers[0].phaseTimer;
  advanceGame(restored, 0.5);
  assert.ok(restored.minute > beforeMinute);
  assert.ok(restored.customers[0].phaseTimer < beforeTimer);
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
  const middling = prepareState();
  middling.random = () => 0.3;
  middling.nextArrival = middling.minute + 0.01;
  advanceGame(middling, 0.05);
  const resident = RESIDENT_BY_ID[middling.customers[0].residentId];
  // The same roll lands differently for a cat person and for someone who is not.
  assert.equal(middling.customers[0].catReaction, 0.3 < 0.25 + resident.cats ? 'delighted' : 'annoyed');
  assert.ok(middling.customers[0].catName);
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

test('Rafael starts monitoring quickly and orders multiple low-stock lines without using credit', () => {
  const state = prepareState();
  state.experience = 1000;
  state.cash = 900;
  assert.equal(hirePurchasingManager(state).ok, true);
  assert.equal(state.nextAutoOrderAt, state.minute + PURCHASING_MANAGER.firstReviewDelay);
  for (const id of ['bananas', 'milk', 'water', 'bread']) {
    state.shelves[id] = [];
    state.stockroom[id] = [];
  }
  const cashBeforeOrder = state.cash;
  const debtBeforeOrder = state.debt;
  state.nextAutoOrderAt = state.minute;
  advanceGame(state, 0.2);
  const orderEvents = state.events.filter((event) => event.type === 'staff' && /Rafael Ortiz ordered/.test(event.message));
  assert.equal(orderEvents.length, PURCHASING_MANAGER.maxLinesPerReview);
  for (const id of ['bananas', 'milk', 'water', 'bread']) {
    const received = state.stockroom[id].reduce((sum, batch) => sum + batch.qty, 0);
    assert.ok(received >= 0);
  }
  assert.ok(state.cash < cashBeforeOrder);
  assert.ok(state.cash >= PURCHASING_MANAGER.cashReserve);
  assert.equal(state.debt, debtBeforeOrder);
  assert.equal(state.nextAutoOrderAt, state.minute + PURCHASING_MANAGER.reviewInterval);
});

test('Rafael does not order before a review is due', () => {
  const state = prepareState();
  state.experience = 1000;
  state.cash = 900;
  assert.equal(hirePurchasingManager(state).ok, true);
  state.shelves.bananas = [];
  state.stockroom.bananas = [];
  const before = state.cash;
  advanceGame(state, PURCHASING_MANAGER.firstReviewDelay - 0.1);
  assert.equal(state.cash, before);
  advanceGame(state, 0.2);
  assert.ok(state.cash < before);
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

test('the resident cast is a varied neighborhood with valid habits', () => {
  assert.ok(RESIDENTS.length >= 16);
  assert.equal(new Set(RESIDENTS.map((r) => r.id)).size, RESIDENTS.length);
  assert.ok(new Set(RESIDENTS.map((r) => r.character)).size >= 16, 'every resident is a different person from the engine cast');
  assert.ok(new Set(RESIDENTS.map((r) => r.look.skin)).size >= 8, 'a range of skin tones');
  assert.ok(new Set(RESIDENTS.map((r) => r.look.hair)).size >= 6, 'a range of hair colors');
  assert.ok(Math.min(...RESIDENTS.map((r) => r.height)) < 1.3 && Math.max(...RESIDENTS.map((r) => r.height)) > 1.4, 'children, elders and grown-ups');
  for (const r of RESIDENTS) {
    assert.ok(r.favorites.length >= 3 && r.favorites.every((id) => PRODUCT_BY_ID[id]), `${r.id} favorites`);
    assert.ok(r.thrift > 0 && r.lines >= 0 && r.lines <= 1 && r.peak[0] < r.peak[1], `${r.id} habits`);
  }
});

test('residents buy what they like, never two of them are inside at once, and arrive when they usually do', () => {
  const state = prepareState();
  state.minute = 8 * 60;
  const seen = new Map();
  for (let i = 0; i < 300; i++) {
    state.customers = [];
    const customer = spawnForTest(state);
    seen.set(customer.residentId, (seen.get(customer.residentId) ?? 0) + 1);
    const resident = RESIDENT_BY_ID[customer.residentId];
    assert.ok(customer.basket.length >= 2 && customer.basket.length <= 3);
    assert.equal(new Set(customer.basket.map((l) => l.productId)).size, customer.basket.length);
    assert.equal(customer.character, resident.character);
  }
  assert.ok(seen.size >= 14, `${seen.size} different residents in 300 visits`);
  // Morning people are in at eight far more than the night-shift driver.
  assert.ok((seen.get('walt') ?? 0) > (seen.get('sal') ?? 0));
  const russo = RESIDENT_BY_ID.russo;
  let favorite = 0, lines = 0;
  const stream = prepareState();
  for (let i = 0; i < 200; i++) {
    for (const l of buildBasket(stream, russo)) { lines++; if (russo.favorites.includes(l.productId)) favorite++; }
  }
  assert.ok(favorite / lines > 0.38, `${favorite}/${lines} lines were favorites (chance alone is about 0.22)`);
  const doubled = prepareState();
  doubled.customers = RESIDENTS.slice(0, -1).map((r) => ({ residentId: r.id }));
  assert.equal(chooseResident(doubled).id, RESIDENTS.at(-1).id);
});

function spawnForTest(state) {
  state.nextArrival = state.minute + 0.01;
  state.started = true; state.paused = false;
  const before = state.customers.length;
  advanceGame(state, 0.05);
  return state.customers[before] ?? state.customers.at(-1);
}

test('shoppers want what is on their list even when the shelf is empty, so a bare shelf costs sales', () => {
  const state = prepareState();
  for (const p of PRODUCTS) { state.shelves[p.id] = []; state.stockroom[p.id] = []; }
  state.random = (() => { let v = 11; return () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; })();
  state.minute = 8 * 60;
  const c = spawnForTest(state);
  assert.ok(c, 'a customer still comes in to an empty store');
  assert.ok(c.basket.length >= 2);
  advanceGame(state, 40);
  assert.ok(state.dayStats.stockouts >= 1, 'their empty-shelf lines were recorded as stockouts');
});

test('a price past what a shopper will pay is put back, and the store hears about it', () => {
  const state = prepareState();
  state.nextArrival = 100000;
  state.prices.milk = PRODUCT_BY_ID.milk.price * 2;
  state.customers.push({ id: 5001, name: 'Ari', thrift: 0.3, basket: [{ productId: 'milk', qty: 1 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0 });
  const stockBefore = state.shelves.milk.reduce((n, b) => n + b.qty, 0);
  advanceGame(state, 0.05);
  assert.equal(state.customers[0].result, 'priced-out');
  assert.equal(state.shelves.milk.reduce((n, b) => n + b.qty, 0), stockBefore);
  assert.equal(state.dayStats.pricedOut, 1);
  const fair = prepareState();
  fair.nextArrival = 100000;
  fair.customers.push({ id: 5002, name: 'Ari', thrift: 0.3, basket: [{ productId: 'milk', qty: 1 }], phase: 'browsing', phaseTotal: 0.04, phaseTimer: 0.04, result: null, bought: 0, spend: 0 });
  advanceGame(fair, 0.05);
  assert.equal(fair.customers[0].result, 'sold');
});

test('credit interest compounds into the balance and is not also taken from the till', () => {
  const state = prepareState();
  beginDay(state);
  borrowCredit(state, 200);
  state.nextArrival = 100000;
  const cashBefore = state.cash;
  const { rent, payroll, utilities } = state.dailyCosts;
  state.minute = 20 * 60 + 59;
  advanceGame(state, 2);
  assert.equal(state.debt, 202.5);
  assert.equal(state.cash, Math.round((cashBefore - rent - payroll - utilities) * 100) / 100);
  assert.equal(state.lastDaySummary.expenses.interest, 2.5);
});

test('shoppers still inside at closing time finish their shop instead of vanishing', () => {
  const state = prepareState();
  beginDay(state);
  state.nextArrival = 100000;
  state.minute = 20 * 60 + 58;
  state.customers.push({ id: 6001, name: 'Kenji', basket: [{ productId: 'rice', qty: 1 }], phase: 'browsing', phaseTotal: 20, phaseTimer: 15, result: null, bought: 0, spend: 0 });
  advanceGame(state, 3);
  assert.equal(state.dayEnded, true);
  assert.equal(state.dayStats.unitsSold, 1);
  assert.ok(state.dayStats.revenue > 0);
  assert.equal(state.customers.length, 0);
});

test('nobody is let in after last call', () => {
  const state = prepareState();
  beginDay(state);
  state.minute = 20 * 60 + 40;
  state.nextArrival = state.minute + 0.01;
  advanceGame(state, 0.05);
  assert.equal(state.customers.length, 0);
});

test('repaying credit works to the cent', () => {
  const state = prepareState();
  state.debt = 100.01;
  state.cash = 500;
  const result = repayCredit(state, 100.01);
  assert.equal(result.amount, 100.01);
  assert.equal(state.debt, 0);
});

test('a delighted cat lover who found nothing does not post a cat rave', () => {
  const state = prepareState();
  state.random = () => 0;
  const review = maybeLeaveReview(state, { id: 7001, name: 'Zoe', result: 'stockout', demandId: 'milk', stockoutProductId: 'milk', catReaction: 'delighted', catName: 'Jinx' });
  assert.ok(review);
  assert.equal(review.outcome, 'stockout');
  assert.ok(review.rating <= 3);
});

test('the range is in three tiers by store level, and the new lines also need their fixture bought', async () => {
  const { TIERS, FIXTURES, isAvailable, availableProducts, buyFixture, fixtureBlock, getStoreLevel } = await import('../src/sim.js');
  assert.deepEqual(TIERS.map((t) => t.tier), [1, 2, 3]);
  const state = createGameState(5);
  const tierOf = (n) => PRODUCTS.filter((p) => p.tier === n);
  assert.ok(tierOf(1).length > 0 && tierOf(2).length > 0 && tierOf(3).length > 0);
  assert.ok(tierOf(2).some((p) => !p.fixture), 'some established lines open at tier 2');
  assert.ok(tierOf(1).every((p) => !p.fixture), 'tier 1 needs nothing bought');
  assert.deepEqual(availableProducts(state).map((p) => p.id), tierOf(1).map((p) => p.id));
  assert.equal(placeOrder(state, 'tomatoes', 1).reason, 'not-stocked');
  assert.equal(placeOrder(state, 'oranges', 1).reason, 'not-stocked');

  // A fixture waits for the level that opens its tier, then for the cash.
  const bin = FIXTURES.find((f) => f.id === 'bin-1');
  assert.equal(fixtureBlock(state, 'bin-1'), 'level');
  assert.equal(buyFixture(state, 'bin-1').reason, 'level-too-low');
  state.experience = 500;
  assert.equal(getStoreLevel(state), 3);
  assert.ok(isAvailable(state, PRODUCT_BY_ID.tomatoes), 'an established tier 2 line opens with the level');
  assert.ok(!isAvailable(state, PRODUCT_BY_ID.oranges), 'a new line still needs its bin');
  state.cash = 10;
  assert.equal(buyFixture(state, 'bin-1').reason, 'insufficient-funds');
  state.cash = 1000;
  const bought = buyFixture(state, 'bin-1');
  assert.ok(bought.ok);
  assert.equal(state.cash, 1000 - bin.cost);
  assert.equal(buyFixture(state, 'bin-1').reason, 'already-owned');
  assert.ok(isAvailable(state, PRODUCT_BY_ID.oranges) && isAvailable(state, PRODUCT_BY_ID.carrots));
  assert.ok(!isAvailable(state, PRODUCT_BY_ID.onions), 'tier 3 stays shut at level 3');
  assert.equal(fixtureBlock(state, 'bin-2'), 'level');
  assert.ok(placeOrder(state, 'oranges', 1).ok);
  state.experience = 1000;
  assert.ok(buyFixture(state, 'bin-2').ok);
  assert.ok(isAvailable(state, PRODUCT_BY_ID.onions));
});

test('shoppers only ask for lines that are on sale, and old saves gain the new lines', async () => {
  const { availableProducts } = await import('../src/sim.js');
  const state = createGameState(9);
  const open = new Set(availableProducts(state).map((p) => p.id));
  for (let i = 0; i < 200; i++) for (const line of buildBasket(state, RESIDENTS[i % RESIDENTS.length])) assert.ok(open.has(line.productId), line.productId);
  const old = JSON.parse(saveGameState(state));
  for (const id of ['oranges', 'chips', 'bacon']) { delete old.shelves[id]; delete old.stockroom[id]; delete old.prices[id]; }
  delete old.fixtures;
  const loaded = loadGameState(old);
  assert.deepEqual(loaded.fixtures, []);
  assert.deepEqual(loaded.shelves.oranges, []);
  assert.equal(loaded.prices.chips, PRODUCT_BY_ID.chips.price);
});
