/**
 * Bodega's authoritative store simulation.
 * All dates are measured in fractional store-days. A batch's expiry is fixed
 * when it is received; moving it between the stockroom and shelf never resets it.
 */
export const PRODUCTS = [
  { id: 'apples', name: 'Gala apples', short: 'Apples', category: 'Produce', section: 'produce', cost: 0.48, price: 1.29, shelfLife: 8, caseSize: 12, demand: 1.25, color: '#d75c43', kind: 'produce', description: 'Crisp, sweet, one of the regulars.' },
  { id: 'bananas', name: 'Bananas', short: 'Bananas', category: 'Produce', section: 'produce', cost: 0.32, price: 0.89, shelfLife: 4, caseSize: 12, demand: 1.35, color: '#e6c84a', kind: 'produce', description: 'Best sellers. They turn fast.' },
  { id: 'tomatoes', name: 'Vine tomatoes', short: 'Tomatoes', category: 'Produce', section: 'produce', cost: 0.42, price: 1.19, shelfLife: 5, caseSize: 12, demand: 0.9, color: '#d94b39', kind: 'produce', description: 'Keep them out of the fridge.' },
  { id: 'lettuce', name: 'Green lettuce', short: 'Lettuce', category: 'Produce', section: 'produce', cost: 0.62, price: 1.69, shelfLife: 3, caseSize: 8, demand: 0.78, color: '#80a74f', kind: 'produce', description: 'The shortest clock in the produce crate.' },
  { id: 'potatoes', name: 'Russet potatoes', short: 'Potatoes', category: 'Produce', section: 'produce', cost: 0.24, price: 0.79, shelfLife: 18, caseSize: 12, demand: 0.85, color: '#a77b4f', kind: 'produce', description: 'A sturdy staple with a longer shelf life.' },
  { id: 'milk', name: 'Whole milk · 1 qt', short: 'Whole milk', category: 'Dairy', section: 'chilled', cost: 1.34, price: 2.79, shelfLife: 6, caseSize: 6, demand: 1.5, color: '#e5e1cf', kind: 'carton', description: 'Keep chilled. A neighborhood essential.' },
  { id: 'yogurt', name: 'Plain yogurt', short: 'Yogurt', category: 'Dairy', section: 'chilled', cost: 0.54, price: 1.29, shelfLife: 10, caseSize: 8, demand: 0.7, color: '#e8dfcc', kind: 'tub', description: 'A little more forgiving than milk.' },
  { id: 'cheese', name: 'Cheddar cheese', short: 'Cheddar', category: 'Dairy', section: 'chilled', cost: 1.55, price: 3.49, shelfLife: 24, caseSize: 6, demand: 0.72, color: '#e4a93d', kind: 'carton', description: 'Longer dated, still belongs in the cooler.' },
  { id: 'butter', name: 'Salted butter', short: 'Butter', category: 'Dairy', section: 'chilled', cost: 1.22, price: 2.79, shelfLife: 36, caseSize: 6, demand: 0.58, color: '#e8d58a', kind: 'carton', description: 'A slower-moving dairy line.' },
  { id: 'eggs', name: 'Large brown eggs · 6', short: 'Eggs', category: 'Eggs', section: 'chilled', cost: 1.28, price: 2.99, shelfLife: 28, caseSize: 6, demand: 1.05, color: '#c9a77a', kind: 'eggbox', description: 'Check the date and keep them cold.' },
  { id: 'bread', name: 'Fresh sandwich bread', short: 'Bread', category: 'Bakery', section: 'bakery', cost: 0.92, price: 2.29, shelfLife: 5, caseSize: 8, demand: 1.12, color: '#bd8950', kind: 'loaf', description: 'Delivered often. Stales quickly.' },
  { id: 'chicken', name: 'Chicken breast · 1 lb', short: 'Chicken', category: 'Meat', section: 'chilled', cost: 3.15, price: 6.49, shelfLife: 3, caseSize: 4, demand: 0.55, color: '#dfb49a', kind: 'tray', description: 'Short-dated fresh meat. Do not let it sit.' },
  { id: 'beef', name: 'Ground beef · 1 lb', short: 'Ground beef', category: 'Meat', section: 'chilled', cost: 2.8, price: 5.99, shelfLife: 4, caseSize: 4, demand: 0.58, color: '#ad5144', kind: 'tray', description: 'Keep cold; watch the sell-by date.' },
  { id: 'deli', name: 'Sliced turkey', short: 'Deli turkey', category: 'Meat', section: 'chilled', cost: 1.46, price: 3.49, shelfLife: 7, caseSize: 6, demand: 0.62, color: '#cf9b83', kind: 'tray', description: 'Refrigerated and moderately perishable.' },
  { id: 'rice', name: 'Long-grain rice · 2 lb', short: 'Rice', category: 'Dry goods', section: 'dry', cost: 1.2, price: 2.99, shelfLife: 240, caseSize: 8, demand: 0.85, color: '#e3d7b5', kind: 'bag', description: 'A long-dated pantry staple.' },
  { id: 'pasta', name: 'Spaghetti', short: 'Pasta', category: 'Dry goods', section: 'dry', cost: 0.62, price: 1.69, shelfLife: 240, caseSize: 12, demand: 1.0, color: '#e0c17e', kind: 'bag', description: 'High margin and easy to store.' },
  { id: 'cereal', name: 'Corn flakes', short: 'Cereal', category: 'Dry goods', section: 'dry', cost: 1.62, price: 3.79, shelfLife: 120, caseSize: 6, demand: 0.72, color: '#d7b45c', kind: 'box', description: 'Bulky but slow to expire.' },
  { id: 'beans', name: 'Black beans · can', short: 'Black beans', category: 'Dry goods', section: 'dry', cost: 0.48, price: 1.29, shelfLife: 540, caseSize: 12, demand: 1.05, color: '#5e6a55', kind: 'can', description: 'A very long-dated cupboard staple.' },
  { id: 'coffee', name: 'Ground coffee', short: 'Coffee', category: 'Dry goods', section: 'dry', cost: 2.35, price: 5.29, shelfLife: 180, caseSize: 6, demand: 0.92, color: '#81533d', kind: 'bag', description: 'Premium item with a healthy margin.' },
  { id: 'soda', name: 'Cola · 2 L', short: 'Cola', category: 'Drinks', section: 'drinks', cost: 0.78, price: 1.99, shelfLife: 180, caseSize: 8, demand: 1.42, color: '#8b3c35', kind: 'bottle', description: 'A reliable cooler-door impulse buy.' },
  { id: 'water', name: 'Spring water · 1 L', short: 'Water', category: 'Drinks', section: 'drinks', cost: 0.28, price: 0.99, shelfLife: 540, caseSize: 12, demand: 1.38, color: '#85b9cf', kind: 'bottle', description: 'Long dated, quick turnover.' },
  { id: 'pizza', name: 'Cheese pizza', short: 'Frozen pizza', category: 'Frozen', section: 'frozen', cost: 2.05, price: 4.99, shelfLife: 180, caseSize: 6, demand: 0.7, color: '#d8a75e', kind: 'frozen', description: 'Frozen stock is forgiving, not immortal.' },
  { id: 'icecream', name: 'Vanilla ice cream', short: 'Ice cream', category: 'Frozen', section: 'frozen', cost: 1.9, price: 4.79, shelfLife: 100, caseSize: 6, demand: 0.78, color: '#e7dfc9', kind: 'tub', description: 'Keep frozen. Watch freezer temperature.' },
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
export const STAFF = [
  { id: 'lou', name: 'Lou Rivera', role: 'Cashier · opens the store', character: 'gent', wage: 14, color: '#e0b982' },
  { id: 'marisol', name: 'Marisol Vega', role: 'Floor lead · stock rotation', character: 'vendor', wage: 12, color: '#64a9a3' },
];
export const PURCHASING_MANAGER = { id: 'rafael', name: 'Rafael Ortiz', role: 'Purchasing manager · supplier orders', character: 'suit', wage: 18, hireCost: 300, unlockLevel: 5, cashReserve: 240, firstReviewDelay: 5, reviewInterval: 30, maxLinesPerReview: 3 };

export const CAT_ROSTER = [
  { id: 'blaze', name: 'Blaze', coat: 'ginger', job: 'Produce supervisor', character: 'cat-ginger', place: [-4.25, 0, -5.65] },
  { id: 'jinx', name: 'Jinx', coat: 'calico', job: 'Window manager', character: 'cat-calico', place: [0.55, 0, 4.8] },
  { id: 'nyx', name: 'Nyx', coat: 'black', job: 'Night auditor', character: 'cat-black', place: [4.65, 0, 4.8] },
];

/**
 * A small, hand-written review history establishes the shop's reputation
 * before the new owner takes over. New reviews are chosen from the banks
 * below, then personalised with the shopper and the item they came for.
 */
const OPENING_REVIEWS = [
  { id: 1, name: 'A. Brooks', rating: 5, text: 'The cats run this place and somehow the produce is still perfect. Lou always remembers my coffee.', day: 0, minute: 0, source: 'Local regular' },
  { id: 2, name: 'S. Morales', rating: 4, text: 'Good neighborhood basics, fair prices, and Marisol keeps the shelves looking sharp. Gets packed after work.', day: 0, minute: 0, source: 'Local regular' },
  { id: 3, name: 'J. Kim', rating: 5, text: 'Fresh bread in the morning, cold drinks at night, and a very serious-looking cat by the window.', day: 0, minute: 0, source: 'Nearby resident' },
  { id: 4, name: 'T. Rivera', rating: 4, text: 'A proper corner store. Not a supermarket, but the people are nice and I can get what I need.', day: 0, minute: 0, source: 'Nearby resident' },
];

/** Prewritten, deliberately varied copy for the simulated neighborhood review feed. */
export const REVIEW_BANK = Object.freeze({
  expired: [
    'Found expired {{product}} right at the front of the shelf. That is not okay.',
    'I checked the date on the {{product}} and it was already past. Glad I noticed before taking it home.',
    'Tried to buy {{product}}, but the date had gone. Please check the stock rotation.',
    'Not acceptable: expired {{product}} was still out for sale. I will shop somewhere else next time.',
    'The {{product}} looked fine until I checked the label. Dates matter, especially on food.',
    'I came in for {{product}} and left empty-handed after finding an expired batch at the front.',
    'One look at the date on the {{product}} and I put it straight back. Someone needs to check these shelves.',
    'I like this little shop, which makes the expired {{product}} even more disappointing.',
    'Please do better with the {{product}}. A past-date item should never make it to checkout.',
    'The front-facing {{product}} was out of date. I told the cashier, but it should have been caught earlier.',
  ],
  stockout: [
    'Stopped in for {{product}}, but the shelf was empty. A little frustrating on the way home.',
    'Good people, but somehow they are always out of {{product}} when I need it.',
    'Wanted {{product}} and left without it. I hope they get the delivery in tomorrow.',
    'A useful little shop, although the {{product}} shelf could use more attention.',
    'I had to make a second stop because they were out of {{product}}. Not ideal.',
    'The basics are usually here, but today there was no {{product}} to be found.',
  ],
  partial: [
    'Found most of what I needed, but the {{product}} shelf was bare. Still a decent stop.',
    'A mixed visit: friendly checkout, but I could only get part of my list because {{product}} was missing.',
    'Convenient location and nice staff. Stock levels are a bit inconsistent, especially {{product}}.',
    'Got a few things and skipped the rest. I will give them another try when the shelves are fuller.',
    'The store has character, but the shopping list did not quite survive the trip. No {{product}} today.',
  ],
  five: [
    'My favorite little stop on the block. Lou knows the regulars and the checkout is always easy.',
    'Fresh produce, cold drinks, and friendly faces. Exactly what a neighborhood shop should be.',
    'Marisol helped me find everything in about thirty seconds. Lovely service.',
    'Stopped in for one thing and left with dinner sorted. Great little store.',
    'The cats are excellent greeters. The prices are fair too, which is a nice bonus.',
    'Good selection for a small shop, shelves are tidy, and the people are genuinely kind.',
    'Fresh bread, decent coffee, and open when I need it. Five stars from me.',
    'This place has real neighborhood energy. I would rather shop here than walk to the big store.',
    'Quick in, quick out, no fuss. The staff make it feel like a local place.',
    'Blaze was supervising the apples again. Produce looked great and checkout was a breeze.',
    'The little shop that saves the evening when you forgot one ingredient. Always appreciated.',
    'Everything I needed was in stock, the store was clean, and the line moved quickly.',
  ],
  four: [
    'A dependable neighborhood stop. A couple of prices are higher than the big supermarket, but it is convenient.',
    'Friendly staff and a good everyday range. Could use a little more room in the aisles.',
    'Nice produce and a surprisingly good pantry selection. Busy at lunch, so plan accordingly.',
    'Good local shop with a bit of personality. The cats are part of the experience.',
    'Usually has what I need. I wish the bread delivery came a little earlier.',
    'Much better than a quick-stop chain. A few shelves were thin today, but the service was great.',
    'Fair prices, helpful people, and a good cold case. Four stars because the queue can build up.',
    'I like supporting the neighborhood. Keep the good staples coming and this stays my regular stop.',
    'Marisol was lovely. The shop is small, but the selection is thoughtfully put together.',
  ],
  three: [
    'It does the job. Some days the shelves are full, other days it is a bit hit or miss.',
    'A convenient shop, though the range is limited and prices vary quite a bit.',
    'Nothing terrible, nothing amazing. Fine for a quick top-up.',
    'The staff were nice. I just could not find two of the things on my list.',
    'Good location and a lot of character. The shopping experience was pretty average today.',
    'I want to like this place more. A little consistency with stock would make a difference.',
    'Handy for the essentials, but I would not plan a full grocery run around it.',
  ],
  two: [
    'The shop was untidy and I could not get half the things I came for. Needs attention.',
    'A frustrating stop. The queue was slow and the shelf I needed was empty.',
    'I know it is a small store, but the selection was very thin today.',
    'Convenient location, disappointing visit. I had to go elsewhere to finish my shopping.',
    'Not the usual friendly experience. Hopefully today was just an off day.',
    'Too many gaps on the shelves and not much help finding what was missing.',
  ],
  catLoved: [
    'Came in for {{product}} and stayed an extra minute to say hello to {{cat}}. Five stars for the welcome.',
    '{{cat}} rolled over by the apples and made my whole afternoon. Good shop, good people, good cat.',
    'The little greeter {{cat}} is the reason I take this route home. Also, the {{product}} was great.',
    'A proper neighborhood place. {{cat}} let me offer a polite hello while Lou rang up my {{product}}.',
    'My kid talks about {{cat}} all week. We came for {{product}}, but the bodega cat was the highlight.',
    'Fresh groceries and a friendly cat encounter. {{cat}} deserves an employee-of-the-month plaque.',
    'I am not usually a cat person, but {{cat}} was very sweet. Checkout was quick too.',
    'The shop has character, and apparently that character has whiskers. Lovely visit for {{product}}.',
    '{{cat}} was asleep in the sun and somehow made the whole place feel welcoming. Great little stop.',
    'Came for one thing, left with a full bag and a new favorite cat. Thanks, {{cat}}.',
  ],
  catAnnoyed: [
    '{{cat}} was under my feet in the aisle. Cute from a distance, but I nearly tripped carrying my groceries.',
    'I like cats, but {{cat}} climbed right onto the bagging counter while I was paying for {{product}}.',
    'The cat hair on my coat after visiting for {{product}} was not ideal. Please keep the counter clear.',
    '{{cat}} startled me by darting across the aisle. I just wanted to grab {{product}} and get home.',
    'The cats are part of the charm for some people, I guess. {{cat}} blocked the shelf I needed today.',
    'I came in for {{product}}, not to negotiate aisle space with {{cat}}. The staff were nice about it.',
    '{{cat}} knocked a little display over right beside me. No harm done, but it made the visit stressful.',
    'Not a fan of animals around food. {{cat}} was on the produce display while I was shopping.',
    'The shop is handy, but {{cat}} kept weaving around my ankles. A bit too much cat for me.',
    'I was trying to check the date on {{product}} and the cat was rubbing against the shelf. Distracting.',
  ],
});

const STARTING_CASH = 1250;
const CREDIT_LIMIT = 1800;
const DAY_OPEN = 7 * 60;
const DAY_CLOSE = 21 * 60;
const EXPIRY_BUFFER = 1e-8;
const STAFF_PAYROLL = STAFF.reduce((n, s) => n + s.wage, 0);
const STORE_LEVEL_XP = 250;
export const getStoreLevel = (state) => 1 + Math.floor(Math.max(0, state.experience ?? 0) / STORE_LEVEL_XP);
export function getStoreLevelProgress(state) {
  const level = getStoreLevel(state);
  const floor = (level - 1) * STORE_LEVEL_XP;
  const next = level * STORE_LEVEL_XP;
  const experience = Math.max(0, state.experience ?? 0);
  return { level, experience, currentFloor: floor, nextTarget: next, remaining: Math.max(0, next - experience), progress: Math.max(0, Math.min(100, (experience - floor) / STORE_LEVEL_XP * 100)) };
}


export const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
export const productNow = (state) => state.day + state.minute / 1440;
export const productOf = (id) => PRODUCT_BY_ID[id];
export const qtyOf = (batches = []) => batches.reduce((n, batch) => n + batch.qty, 0);
export const isExpired = (batch, now) => batch.expiresAt <= now + EXPIRY_BUFFER;
export const expiryDaysLeft = (batch, now) => Math.max(0, batch.expiresAt - now);
export const sortOldestFirst = (batches) => batches.sort((a, b) => a.expiresAt - b.expiresAt || a.receivedAt - b.receivedAt || a.lotId - b.lotId);

function createRng(seed, restore = false) {
  let value = seed >>> 0 || 1;
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  random.getState = () => value;
  return random;
}

/** A JSON-safe snapshot for local saves. The random stream resumes exactly where it left off. */
export function saveGameState(state) {
  const { random, ...serializable } = state;
  return JSON.stringify({ ...serializable, rngState: random.getState() });
}

/** Restore a save while keeping the simulation's functions out of storage. */
export function loadGameState(serialized) {
  try {
    const saved = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
    if (!saved || saved.version !== 1 || !Number.isFinite(saved.day) || !saved.shelves || !saved.stockroom) return null;
    const state = createGameState(saved.rngState ?? 1);
    Object.assign(state, saved);
    state.random = createRng(saved.rngState ?? 1);
    state.paused = false; // Resume active days on reload; no offline time is simulated.
    state.orderCases ??= Object.fromEntries(PRODUCTS.map((p) => [p.id, 1]));
    state.reviews ??= OPENING_REVIEWS.map((review) => ({ ...review })).reverse();
    state.dayStats ??= {};
    state.dayStats.catLoved ??= 0;
    state.dayStats.catAnnoyed ??= 0;
    state.reviewSequence ??= Math.max(0, ...state.reviews.map((review) => review.id || 0));
    state.staffWork ??= { stage: 'idle', productId: null, timer: 0, duration: 0, moved: 0 };
    state.experience ??= 0;
    state.purchasingManagerHired ??= false;
    state.automaticPurchasingEnabled ??= true;
    state.nextAutoOrderAt ??= state.minute + (state.purchasingManagerHired ? PURCHASING_MANAGER.firstReviewDelay : 35);
    state.playerPosition ??= { x: 0.35, z: 5.15 };
    state.dailyCosts.payroll = STAFF_PAYROLL + (state.purchasingManagerHired ? PURCHASING_MANAGER.wage : 0);
    // Give existing saves a one-time, prepaid opening reserve so the floor lead
    // can demonstrate automatic replenishment immediately after this update.
    if (!state.staffReserveSeeded) {
      const openingReserve = new Set(['apples','bananas','lettuce','milk','eggs','bread','chicken','beef','rice','pasta','soda','water']);
      for (const product of PRODUCTS) {
        if (openingReserve.has(product.id) && qtyOf(state.stockroom[product.id] ?? []) === 0) {
          state.stockroom[product.id] ??= [];
          state.stockroom[product.id].push(newBatch(state, product, product.caseSize));
        }
      }
      state.staffReserveSeeded = true;
    }
    return state;
  } catch { return null; }
}

function pushEvent(state, type, message, detail = '') {
  state.events.unshift({ id: ++state.eventSequence, type, message, detail, time: state.minute, day: state.day });
  state.events.length = Math.min(state.events.length, 32);
}

function newBatch(state, product, qty, { age = 0 } = {}) {
  const now = productNow(state);
  return {
    lotId: ++state.lotSequence,
    qty,
    receivedAt: now - age,
    expiresAt: now + product.shelfLife - age,
    unitCost: product.cost,
  };
}

function inventoryFor(products, make) {
  return Object.fromEntries(products.map((product) => [product.id, make(product)]));
}

export function createGameState(seed = 20261031) {
  const random = createRng(seed);
  const state = {
    version: 1,
    day: 1,
    minute: DAY_OPEN,
    cash: STARTING_CASH,
    debt: 0,
    creditLimit: CREDIT_LIMIT,
    creditRate: 0.0125,
    reputation: 78,
    experience: 0,
    purchasingManagerHired: false,
    automaticPurchasingEnabled: true,
    nextAutoOrderAt: DAY_OPEN + 35,
    playerPosition: { x: 0.35, z: 5.15 },
    started: false,
    paused: true,
    dayEnded: false,
    gameOver: false,
    speed: 1,
    shelves: inventoryFor(PRODUCTS, () => []),
    stockroom: inventoryFor(PRODUCTS, () => []),
    prices: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price])),
    customers: [],
    nextArrival: DAY_OPEN + 18,
    customerSequence: 0,
    lotSequence: 0,
    eventSequence: 0,
    events: [],
    reviews: OPENING_REVIEWS.map((review) => ({ ...review })).reverse(),
    reviewSequence: OPENING_REVIEWS.length,
    random,
    dayStats: { revenue: 0, unitsSold: 0, customers: 0, complaints: 0, waste: 0, purchases: 0, grossProfit: 0, stockouts: 0, catLoved: 0, catAnnoyed: 0 },
    lifetime: { revenue: 0, customers: 0, complaints: 0, waste: 0, days: 0 },
    dailyCosts: { rent: 24, payroll: STAFF_PAYROLL, utilities: 8 },
    supplierOrders: 0,
    staffReserveSeeded: true,
    staffWork: { stage: 'idle', productId: null, timer: 0, duration: 0, moved: 0 },
    lastDaySummary: null,
  };

  // Most opening stock is already on the shop floor; perishable lines include
  // a small older delivery so rotation is a real first-day responsibility.
  for (const product of PRODUCTS) {
    const startingQty = product.section === 'chilled' ? 5 : product.section === 'produce' ? 7 : 6;
    const olderQty = ['bananas', 'lettuce', 'milk', 'bread', 'chicken', 'beef', 'tomatoes'].includes(product.id) ? 2 : 0;
    if (olderQty) state.shelves[product.id].push(newBatch(state, product, olderQty, { age: Math.min(1.2, product.shelfLife * 0.3) }));
    state.shelves[product.id].push(newBatch(state, product, startingQty - olderQty));
    sortOldestFirst(state.shelves[product.id]);
  }
  // Opening reserve is already-paid inventory. Marisol has real backroom stock
  // to work from on day one, rather than being a decorative employee.
  const openingReserve = new Set(['apples','bananas','lettuce','milk','eggs','bread','chicken','beef','rice','pasta','soda','water']);
  for (const product of PRODUCTS) {
    if (!openingReserve.has(product.id)) continue;
    state.stockroom[product.id].push(newBatch(state, product, product.caseSize));
  }
  pushEvent(state, 'note', 'The keys are yours.', 'Lou and Marisol are ready for the morning rush.');
  pushEvent(state, 'stock', 'Opening reserve is ready in the stockroom.', 'Marisol will automatically replenish low shelves and rotate the oldest valid lots first.');
  pushEvent(state, 'note', 'Three new managers clocked in.', 'Blaze, Jinx, and Nyx are already on the floor.');
  return state;
}

export function shelfQuantity(state, productId) { return qtyOf(state.shelves[productId]); }
export function stockroomQuantity(state, productId) { return qtyOf(state.stockroom[productId]); }
export function expiredQuantity(state, productId) {
  const now = productNow(state);
  return qtyOf(state.shelves[productId].filter((b) => isExpired(b, now))) + qtyOf(state.stockroom[productId].filter((b) => isExpired(b, now)));
}
export function oldestShelfBatch(state, productId) {
  sortOldestFirst(state.shelves[productId]);
  return state.shelves[productId][0] ?? null;
}
export function inventoryHealth(state) {
  return PRODUCTS.reduce((out, product) => {
    const shelf = state.shelves[product.id];
    out.expired += qtyOf(shelf.filter((b) => isExpired(b, productNow(state))));
    out.low += shelfQuantity(state, product.id) <= 2 ? 1 : 0;
    out.empty += shelfQuantity(state, product.id) === 0 ? 1 : 0;
    return out;
  }, { expired: 0, low: 0, empty: 0 });
}

/** Transfer the earliest-expiring backroom lots to the shelf without resetting their dates. */
export function restockProduct(state, productId, requested = Infinity) {
  const product = PRODUCT_BY_ID[productId];
  if (!product) return { moved: 0, reason: 'unknown-product' };
  const shelf = sortOldestFirst(state.shelves[productId]);
  const stockroom = sortOldestFirst(state.stockroom[productId]);
  const onShelf = qtyOf(shelf);
  const capacity = product.section === 'produce' ? 24 : product.section === 'chilled' ? 30 : 36;
  const space = Math.max(0, capacity - onShelf);
  let remaining = Math.min(space, Math.max(0, requested));
  let moved = 0;
  const now = productNow(state);
  // Never put already-expired stock back on the floor. Valid lots retain their
  // original received/expiry dates and are merged by earliest expiry.
  for (const batch of stockroom) {
    if (remaining <= 0) break;
    if (batch.qty <= 0 || isExpired(batch, now)) continue;
    const take = Math.min(batch.qty, remaining);
    const existing = shelf.find((b) => b.lotId === batch.lotId);
    if (existing) existing.qty += take;
    else shelf.push({ ...batch, qty: take });
    batch.qty -= take;
    moved += take;
    remaining -= take;
  }
  state.stockroom[productId] = sortOldestFirst(stockroom.filter((batch) => batch.qty > 0));
  state.shelves[productId] = sortOldestFirst(shelf);
  if (moved) pushEvent(state, 'stock', `${moved} ${product.short.toLowerCase()} moved to the shelf.`, 'Oldest valid date is at the front; expired backroom stock was left out.');
  return {
    moved,
    remainingSpace: space - moved,
    reason: moved ? 'restocked' : onShelf >= capacity ? 'shelf-full' : stockroom.some((batch) => batch.qty > 0) ? 'only-expired-stock' : 'backroom-empty',
  };
}

export function restockAll(state) {
  const results = PRODUCTS.map((product) => ({ productId: product.id, ...restockProduct(state, product.id) })).filter((r) => r.moved > 0);
  return results.reduce((total, r) => total + r.moved, 0);
}

/** Place a wholesale case order. Delivery goes into the stockroom, never straight onto the shelf. */
export function placeOrder(state, productId, cases = 1) {
  const product = PRODUCT_BY_ID[productId];
  const count = Math.floor(Number(cases));
  if (!product || !Number.isFinite(count) || count < 1 || count > 20) return { ok: false, reason: 'invalid-quantity' };
  const qty = product.caseSize * count;
  const total = Math.round(product.cost * qty * 100) / 100;
  if (state.cash + 1e-8 < total) return { ok: false, reason: 'insufficient-funds', total, shortfall: total - state.cash };
  state.cash = Math.round((state.cash - total) * 100) / 100;
  state.stockroom[productId].push(newBatch(state, product, qty));
  sortOldestFirst(state.stockroom[productId]);
  state.dayStats.purchases += total;
  state.supplierOrders += 1;
  pushEvent(state, 'order', `${count} case${count === 1 ? '' : 's'} of ${product.short.toLowerCase()} delivered.`, `${qty} units · ${money(total)} · stockroom delivery`);
  return { ok: true, qty, total, expiresAt: productNow(state) + product.shelfLife };
}

export function adjustPrice(state, productId, delta) {
  const product = PRODUCT_BY_ID[productId];
  if (!product || !Number.isFinite(delta)) return false;
  const next = Math.round((state.prices[productId] + delta) * 100) / 100;
  state.prices[productId] = Math.max(product.cost * 1.08, Math.min(product.price * 2.25, next));
  return true;
}

/** Remove all expired units from shelves and stockroom. Waste is recorded at cost, not retail price. */
export function pullExpired(state, productId = null) {
  const ids = productId ? [productId] : PRODUCTS.map((p) => p.id);
  const now = productNow(state);
  let removed = 0, loss = 0;
  for (const id of ids) {
    const product = PRODUCT_BY_ID[id];
    if (!product) continue;
    for (const location of [state.shelves, state.stockroom]) {
      const keep = [];
      for (const batch of location[id]) {
        if (isExpired(batch, now)) { removed += batch.qty; loss += batch.qty * batch.unitCost; }
        else keep.push(batch);
      }
      location[id] = sortOldestFirst(keep);
    }
  }
  if (removed) {
    state.dayStats.waste += loss;
    state.lifetime.waste += loss;
    pushEvent(state, 'waste', `${removed} expired units pulled.`, `${money(loss)} written off at wholesale cost.`);
  } else pushEvent(state, 'good', 'No expired stock found.', 'The shelves and stockroom are clear.');
  return { removed, loss };
}

function weightedProduct(state, excluded = new Set()) {
  const candidates = PRODUCTS.filter((p) => !excluded.has(p.id));
  const stocked = candidates.filter((p) => shelfQuantity(state, p.id) > 0);
  const pool = stocked.length ? stocked : candidates;
  const sum = pool.reduce((n, p) => n + p.demand, 0);
  let roll = state.random() * sum;
  for (const p of pool) { roll -= p.demand; if (roll <= 0) return p; }
  return pool[pool.length - 1];
}

function chooseCustomerLook(state) {
  const looks = [
    ['tourist', 'Maya', 'weekend visitor'], ['punk', 'Rico', 'regular'], ['hippie', 'Sunny', 'produce fan'],
    ['artist', 'Theo', 'local artist'], ['hipster', 'Ari', 'coffee regular'], ['cabbie', 'Sal', 'night-shift driver'],
    ['nonna', 'Mrs. Russo', 'neighbour'], ['beerguy', 'Dwayne', 'after-work regular'], ['salaryman', 'Kenji', 'commuter'],
    ['pizzaiolo', 'Marco', 'late lunch'], ['skater', 'Jules', 'local kid'],
  ];
  return looks[Math.floor(state.random() * looks.length)];
}

/** Every shopper independently forms an opinion about the resident cats. */
function rollCatEncounter(state) {
  const roll = state.random();
  const cat = CAT_ROSTER[Math.floor(state.random() * CAT_ROSTER.length)];
  return {
    catReaction: roll < 0.25 ? 'delighted' : roll < 0.45 ? 'annoyed' : 'indifferent',
    catName: cat.name,
    catId: cat.id,
  };
}

function spawnCustomer(state) {
  if (state.customers.length >= 4) return null;
  const [character, name, tag] = chooseCustomerLook(state);
  const demand = weightedProduct(state);
  const lineCount = state.random() < 0.72 ? 2 : 3;
  const basket = [{ productId: demand.id, qty: 1 + Math.floor(state.random() * 2) }];
  const picked = new Set([demand.id]);
  while (basket.length < lineCount) {
    const next = weightedProduct(state, picked);
    if (!next) break;
    picked.add(next.id);
    basket.push({ productId: next.id, qty: 1 + Math.floor(state.random() * 2) });
  }
  const catEncounter = rollCatEncounter(state);
  // Shoppers spend meaningful time walking the aisles and comparing their 2–3 basket lines.
  const browseTime = 12 + state.random() * 5 + basket.length * 1.4 + (catEncounter.catReaction === 'delighted' ? 1.2 : catEncounter.catReaction === 'annoyed' ? -0.7 : 0);
  const customer = {
    id: ++state.customerSequence,
    character, name, tag,
    ...catEncounter,
    demandId: demand.id,
    basket,
    phase: 'browsing',
    phaseTotal: browseTime,
    phaseTimer: browseTime,
    result: null,
    bought: 0,
    spend: 0,
  };
  state.customers.push(customer);
  state.dayStats.customers += 1;
  state.lifetime.customers += 1;
  pushEvent(state, 'customer', `${name} came in.`, `${tag} · ${basket.length} lines in the basket`);
  return customer;
}

/** FIFO checkout: the first unit sold is always from the oldest non-empty lot. */
export function sellFromShelf(state, productId, requestedQty = 1) {
  const product = PRODUCT_BY_ID[productId];
  if (!product) return { ok: false, reason: 'unknown-product' };
  const batches = sortOldestFirst(state.shelves[productId]);
  if (!batches.length) return { ok: false, reason: 'out-of-stock' };
  const first = batches[0];
  if (isExpired(first, productNow(state))) return { ok: false, reason: 'expired', batch: first };
  let qty = Math.max(1, Math.floor(requestedQty));
  let revenue = 0, cost = 0, sold = 0, stopReason = null;
  while (qty > 0 && batches.length) {
    const batch = batches[0];
    // If a date boundary is crossed mid-basket, stop rather than sell it.
    if (isExpired(batch, productNow(state))) { stopReason = 'expired'; break; }
    const take = Math.min(qty, batch.qty);
    batch.qty -= take;
    qty -= take;
    sold += take;
    cost += take * batch.unitCost;
    revenue += take * state.prices[productId];
    if (batch.qty <= 0) batches.shift();
  }
  if (!sold) return { ok: false, reason: stopReason ?? 'out-of-stock', batch: first };
  state.shelves[productId] = sortOldestFirst(batches);
  revenue = Math.round(revenue * 100) / 100;
  cost = Math.round(cost * 100) / 100;
  const grossProfit = Math.round((revenue - cost) * 100) / 100;
  state.cash = Math.round((state.cash + revenue) * 100) / 100;
  state.dayStats.revenue += revenue;
  state.dayStats.unitsSold += sold;
  state.dayStats.grossProfit += grossProfit;
  state.lifetime.revenue += revenue;
  return { ok: true, qty: sold, revenue, cost, grossProfit, shortfallReason: qty > 0 ? (stopReason ?? 'out-of-stock') : null };
}

function recordExpiredComplaint(state, customer, product) {
  customer.expiredProductId ??= product.id;
  state.dayStats.complaints += 1;
  state.lifetime.complaints += 1;
  const severity = product.category === 'Meat' ? 3.2 : ['Dairy', 'Eggs'].includes(product.category) ? 2.8 : 2.25;
  customer.expiredSeverity = Math.max(customer.expiredSeverity ?? 0, severity);
  state.reputation = Math.max(0, state.reputation - severity);
  pushEvent(state, 'danger', `${customer.name} found expired ${product.short.toLowerCase()}.`, 'They put it down and told everyone in earshot. Pull the expired batch now.');
}

function recordStockout(state, customer, product, { partial = false, requested = 0, available = 0 } = {}) {
  customer.stockoutProductId ??= product.id;
  state.dayStats.stockouts += 1;
  state.reputation = Math.max(0, state.reputation - 0.25);
  const message = partial
    ? `${customer.name} could only get ${available} of ${requested} ${product.short.toLowerCase()}.`
    : `${customer.name} couldn't find ${product.short.toLowerCase()}.`;
  pushEvent(state, 'warning', message, partial ? 'The shelf ran short, so the basket was only partly filled.' : 'A shelf gap means a missed line in the basket. Reorder and restock.');
}

function awardStoreExperience(state, amount) {
  const previousLevel = getStoreLevel(state);
  state.experience = Math.max(0, Math.floor((state.experience ?? 0) + amount));
  const level = getStoreLevel(state);
  if (level > previousLevel) {
    pushEvent(state, 'level', `Store level up · Level ${level}!`, level >= PURCHASING_MANAGER.unlockLevel
      ? 'Purchasing manager hiring is now unlocked in the Staff tab.'
      : `Business experience ${state.experience} · keep serving the neighborhood to unlock new staff.`);
  }
}

function checkoutCustomer(state, customer) {
  const basket = customer.basket ?? [{ productId: customer.demandId, qty: customer.basketUnits ?? 1 }];
  let totalSpend = 0, totalBought = 0, hadExpired = false, hadStockout = false;
  for (const line of basket) {
    const product = PRODUCT_BY_ID[line.productId];
    if (!product) continue;
    const result = sellFromShelf(state, product.id, line.qty);
    if (result.ok) {
      totalBought += result.qty;
      totalSpend += result.revenue;
      if (result.shortfallReason === 'expired') {
        hadExpired = true;
        recordExpiredComplaint(state, customer, product);
      } else if (result.qty < line.qty) {
        hadStockout = true;
        recordStockout(state, customer, product, { partial: true, requested: line.qty, available: result.qty });
      }
    } else if (result.reason === 'expired') {
      hadExpired = true;
      recordExpiredComplaint(state, customer, product);
    } else {
      hadStockout = true;
      recordStockout(state, customer, product);
    }
  }
  customer.bought = totalBought;
  customer.spend = Math.round(totalSpend * 100) / 100;
  customer.result = hadExpired ? 'expired' : hadStockout ? (totalBought ? 'partial' : 'stockout') : 'sold';
  if (totalBought) {
    state.reputation = Math.min(100, state.reputation + 0.12);
    pushEvent(state, 'sale', `${customer.name} checked out.`, `${totalBought} units · ${money(customer.spend)} · ${basket.length} basket lines`);
  }
  // A cat encounter affects the visit even if the shopper came for groceries.
  // Food-safety complaints remain the dominant reputation event.
  if (customer.catReaction === 'delighted') {
    state.dayStats.catLoved = (state.dayStats.catLoved ?? 0) + 1;
    if (!hadExpired) state.reputation = Math.min(100, state.reputation + 0.32);
    pushEvent(state, 'cat', `${customer.name} stopped to see ${customer.catName}.`, 'A little purring, a little patience, and a happier customer.');
  } else if (customer.catReaction === 'annoyed') {
    state.dayStats.catAnnoyed = (state.dayStats.catAnnoyed ?? 0) + 1;
    if (!hadExpired) state.reputation = Math.max(0, state.reputation - 0.48);
    pushEvent(state, 'cat', `${customer.name} was bothered by ${customer.catName}.`, 'The cat got underfoot. Not every shopper wants a four-legged welcome.');
  }
  const experienceEarned = customer.result === 'sold' ? 18 + Math.floor(customer.spend * 2)
    : customer.result === 'partial' ? 8 + Math.floor(customer.spend)
      : customer.result === 'expired' ? 2 : 5;
  awardStoreExperience(state, experienceEarned);
}

function pickReviewText(state, bank, product, catName = 'the bodega cat') {
  const template = bank[Math.floor(state.random() * bank.length)];
  return template
    .replaceAll('{{product}}', product?.short?.toLowerCase() ?? 'item')
    .replaceAll('{{cat}}', catName);
}

/**
 * Publish an occasional post-visit review. Unhappy customers are substantially
 * more likely to write one, and a one-star review costs more neighborhood trust
 * than an ordinary stockout. Reviews also alter the arrival interval below.
 */
export function maybeLeaveReview(state, customer) {
  if (customer.reviewLeft) return null;
  const outcome = customer.result ?? 'sold';
  const catReaction = customer.catReaction ?? 'indifferent';
  const catReview = outcome !== 'expired' && catReaction !== 'indifferent';
  const chance = outcome === 'expired' ? 0.9
    : catReview ? (catReaction === 'annoyed' ? 0.48 : 0.34)
      : outcome === 'stockout' ? 0.34
        : outcome === 'partial' ? 0.28 : 0.11;
  if (state.random() >= chance) return null;

  let rating, bank, reviewOutcome = outcome;
  if (outcome === 'expired') {
    rating = state.random() < 0.78 ? 1 : 2;
    bank = REVIEW_BANK.expired;
  } else if (catReview && catReaction === 'annoyed') {
    rating = state.random() < 0.68 ? 2 : 3;
    bank = REVIEW_BANK.catAnnoyed;
    reviewOutcome = 'cat-annoyed';
  } else if (catReview && catReaction === 'delighted') {
    rating = state.random() < 0.72 ? 5 : 4;
    bank = REVIEW_BANK.catLoved;
    reviewOutcome = 'cat-loved';
  } else if (outcome === 'stockout') {
    rating = state.random() < 0.58 ? 2 : 3;
    bank = REVIEW_BANK.stockout;
  } else if (outcome === 'partial') {
    rating = state.random() < 0.38 ? 2 : 3;
    bank = REVIEW_BANK.partial;
  } else {
    rating = state.random() < 0.68 ? 5 : 4;
    bank = REVIEW_BANK[rating === 5 ? 'five' : 'four'];
  }
  const product = PRODUCT_BY_ID[customer.expiredProductId ?? customer.stockoutProductId ?? customer.demandId];
  const text = pickReviewText(state, bank, product, customer.catName);
  const review = {
    id: ++state.reviewSequence,
    name: customer.name,
    rating,
    text,
    day: state.day,
    minute: state.minute,
    source: state.random() < 0.22 ? 'Local guide' : 'Verified visit',
    outcome: reviewOutcome,
    productId: product?.id ?? null,
    catName: catReview ? customer.catName : null,
  };
  state.reviews.unshift(review);
  state.reviews.length = Math.min(state.reviews.length, 48);
  customer.reviewLeft = true;

  const reputationImpact = ({ 1: -0.48, 2: -0.28, 3: -0.06, 4: 0.05, 5: 0.14 })[rating];
  state.reputation = Math.max(0, Math.min(100, state.reputation + reputationImpact));
  pushEvent(state, 'review', `${customer.name} left a ${rating}-star review.`, text);
  return review;
}

/** The same neighborhood reputation that earns reviews also determines footfall. */
export function customerArrivalInterval(state) {
  return (32 + state.random() * 18) / trafficMultiplier(state);
}

function trafficMultiplier(state) {
  return 0.66 + Math.max(0, Math.min(100, state.reputation)) / 100 * 0.92;
}

export function trafficLabel(state) {
  if (state.reputation >= 86) return 'BUSY';
  if (state.reputation >= 68) return 'STEADY';
  if (state.reputation >= 45) return 'QUIET';
  return 'SLOW';
}

export function reviewSummary(state) {
  const reviews = state.reviews ?? [];
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return { rating: Math.round(rating * 10) / 10, count: reviews.length };
}

function endDay(state) {
  const costs = state.dailyCosts;
  const interest = Math.round(state.debt * state.creditRate * 100) / 100;
  const total = costs.rent + costs.payroll + costs.utilities + interest;
  state.cash = Math.round((state.cash - total) * 100) / 100;
  state.debt = Math.round((state.debt + interest) * 100) / 100;
  state.lastDaySummary = {
    day: state.day,
    revenue: Math.round(state.dayStats.revenue * 100) / 100,
    grossProfit: Math.round(state.dayStats.grossProfit * 100) / 100,
    customers: state.dayStats.customers,
    catLoved: state.dayStats.catLoved ?? 0,
    catAnnoyed: state.dayStats.catAnnoyed ?? 0,
    unitsSold: state.dayStats.unitsSold,
    complaints: state.dayStats.complaints,
    waste: Math.round(state.dayStats.waste * 100) / 100,
    purchases: Math.round(state.dayStats.purchases * 100) / 100,
    expenses: { ...costs, interest },
    totalExpenses: total,
    net: Math.round((state.dayStats.grossProfit - total - state.dayStats.waste) * 100) / 100,
    cash: state.cash,
    debt: state.debt,
  };
  pushEvent(state, 'close', `Day ${state.day} is in the books.`, `${money(state.dayStats.revenue)} sales · ${money(total)} running costs`);
  state.dayEnded = true;
  state.paused = true;
  state.lifetime.days += 1;
  if (state.cash < -250 || state.reputation <= 0) {
    state.gameOver = true;
    pushEvent(state, 'danger', 'The doors are shut for good.', 'The store ran out of runway.');
  }
}

export function startNextDay(state) {
  if (!state.dayEnded || state.gameOver) return false;
  state.day += 1;
  state.minute = DAY_OPEN;
  state.dayEnded = false;
  state.paused = false;
  state.customers = [];
  state.staffWork = { stage: 'idle', productId: null, timer: 0, duration: 0, moved: 0 };
  state.nextAutoOrderAt = DAY_OPEN + (state.purchasingManagerHired ? PURCHASING_MANAGER.firstReviewDelay : 35);
  state.nextArrival = DAY_OPEN + (12 + state.random() * 20) / trafficMultiplier(state);
  state.dayStats = { revenue: 0, unitsSold: 0, customers: 0, complaints: 0, waste: 0, purchases: 0, grossProfit: 0, stockouts: 0, catLoved: 0, catAnnoyed: 0 };
  pushEvent(state, 'note', `Day ${state.day} begins.`, 'Fresh start. Check the cold case before the rush.');
  return true;
}

export function borrowCredit(state, amount) {
  const value = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'invalid-amount' };
  const available = Math.max(0, state.creditLimit - state.debt);
  if (value > available + 1e-8) return { ok: false, reason: 'credit-limit', available };
  state.debt = Math.round((state.debt + value) * 100) / 100;
  state.cash = Math.round((state.cash + value) * 100) / 100;
  pushEvent(state, 'finance', `${money(value)} drawn from the credit line.`, `Outstanding balance: ${money(state.debt)} · 1.25% daily interest`);
  return { ok: true, amount: value, debt: state.debt };
}

export function repayCredit(state, amount = state.debt) {
  const value = Math.min(state.cash, state.debt, Math.max(0, Math.floor(Number(amount) * 100) / 100));
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'nothing-to-repay' };
  state.cash = Math.round((state.cash - value) * 100) / 100;
  state.debt = Math.round((state.debt - value) * 100) / 100;
  pushEvent(state, 'finance', `${money(value)} credit repaid.`, `Remaining balance: ${money(state.debt)}`);
  return { ok: true, amount: value, debt: state.debt };
}

export function hirePurchasingManager(state) {
  if (state.purchasingManagerHired) return { ok: false, reason: 'already-hired' };
  const level = getStoreLevel(state);
  if (level < PURCHASING_MANAGER.unlockLevel) return { ok: false, reason: 'level-required', level, requiredLevel: PURCHASING_MANAGER.unlockLevel };
  if (state.cash < PURCHASING_MANAGER.hireCost) return { ok: false, reason: 'insufficient-funds', required: PURCHASING_MANAGER.hireCost, cash: state.cash };
  state.cash = Math.round((state.cash - PURCHASING_MANAGER.hireCost) * 100) / 100;
  state.purchasingManagerHired = true;
  state.automaticPurchasingEnabled = true;
  state.dailyCosts.payroll = STAFF_PAYROLL + PURCHASING_MANAGER.wage;
  state.nextAutoOrderAt = state.minute + PURCHASING_MANAGER.firstReviewDelay;
  pushEvent(state, 'staff', `${PURCHASING_MANAGER.name} joined the team.`, `Hiring ${money(PURCHASING_MANAGER.hireCost)} · ${money(PURCHASING_MANAGER.wage)} daily wage · automatic ordering is enabled.`);
  return { ok: true, cash: state.cash, wage: PURCHASING_MANAGER.wage, hireCost: PURCHASING_MANAGER.hireCost };
}

export function setAutomaticPurchasing(state, enabled) {
  if (!state.purchasingManagerHired) return false;
  state.automaticPurchasingEnabled = Boolean(enabled);
  state.nextAutoOrderAt = state.minute + PURCHASING_MANAGER.firstReviewDelay;
  pushEvent(state, 'staff', `Automatic purchasing ${state.automaticPurchasingEnabled ? 'enabled' : 'paused'}.`, state.automaticPurchasingEnabled ? 'Rafael will check stock coverage before placing a cash-funded order.' : 'Supplier orders are back under your direct control.');
  return true;
}

function advancePurchasingManager(state) {
  if (!state.purchasingManagerHired || !state.automaticPurchasingEnabled || state.minute < state.nextAutoOrderAt) return;
  state.nextAutoOrderAt = state.minute + PURCHASING_MANAGER.reviewInterval;
  const now = productNow(state);
  const reserve = PURCHASING_MANAGER.cashReserve;
  const options = PRODUCTS.map((product) => {
    const shelf = qtyOf(state.shelves[product.id].filter((batch) => !isExpired(batch, now)));
    const back = qtyOf(state.stockroom[product.id].filter((batch) => !isExpired(batch, now)));
    const total = shelf + back;
    const reorderPoint = Math.max(2, Math.ceil(product.demand * 3));
    const target = Math.max(product.caseSize, Math.ceil(product.demand * 7));
    const shortage = target - total;
    if (total > reorderPoint || shortage <= 0) return null;
    const cases = Math.min(2, Math.max(1, Math.ceil(shortage / product.caseSize)));
    const cost = Math.round(product.cost * product.caseSize * cases * 100) / 100;
    const urgency = (reorderPoint - total + 1) / reorderPoint;
    const score = urgency * (0.7 + product.demand) + (shelf === 0 ? 0.45 : 0) + (product.shelfLife <= 7 ? 0.12 : 0);
    return { product, cases, cost, total, target, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.cost - b.cost);

  let ordersPlaced = 0;
  for (const choice of options) {
    if (ordersPlaced >= PURCHASING_MANAGER.maxLinesPerReview) break;
    // Rafael can use register cash above the operating reserve only; he never
    // draws on the credit line or spends the protected buffer.
    if (state.cash - choice.cost < reserve) continue;
    const order = placeOrder(state, choice.product.id, choice.cases);
    if (!order.ok) continue;
    ordersPlaced += 1;
    pushEvent(state, 'staff', `${PURCHASING_MANAGER.name} ordered ${choice.cases} case(s) of ${choice.product.short.toLowerCase()}.`, `${choice.total} usable units against a target of ${choice.target} · ${money(order.total)} paid from the register.`);
  }

  if (!ordersPlaced) {
    const detail = options.length
      ? `Low-stock lines were found, but available register cash could not cover an order while preserving the ${money(reserve)} operating reserve.`
      : 'Shelf and backroom coverage are healthy; no supplier order is needed yet.';
    pushEvent(state, 'staff', `${PURCHASING_MANAGER.name} completed a stock review.`, detail);
  }
}

function advanceCustomerPhases(state, deltaMinutes) {
  for (const customer of state.customers) {
    customer.phaseTimer -= deltaMinutes;
    if (customer.phaseTimer > 0) continue;
    if (customer.phase === 'browsing') {
      checkoutCustomer(state, customer);
      customer.phase = 'checkout';
      customer.phaseTotal = 3.8;
      customer.phaseTimer = customer.phaseTotal;
    } else if (customer.phase === 'checkout') {
      customer.phase = 'leaving';
      customer.phaseTotal = 3.2;
      customer.phaseTimer = customer.phaseTotal;
    } else if (customer.phase === 'leaving') {
      maybeLeaveReview(state, customer);
      customer.phase = 'gone';
      customer.phaseTimer = 0;
    }
  }
  state.customers = state.customers.filter((customer) => customer.phase !== 'gone');
}

/**
 * Marisol automatically replenishes a low or empty shelf from the stockroom.
 * She only carries in-date lots; expiry checks and date rotation remain active.
 */
function chooseStaffRestockProduct(state) {
  const now = productNow(state);
  const candidates = PRODUCTS.map((product) => {
    const validBackroom = qtyOf(state.stockroom[product.id].filter((batch) => !isExpired(batch, now)));
    const shelf = shelfQuantity(state, product.id);
    const target = product.section === 'produce' ? 12 : product.section === 'chilled' ? 13 : 15;
    if (!validBackroom || shelf >= target) return null;
    const urgency = (target - shelf) / target;
    return { product, score: urgency * (1 + product.demand * 0.32) + (shelf === 0 ? 1.2 : 0) };
  }).filter(Boolean);
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.product ?? null;
}

function beginStaffRestock(state) {
  const product = chooseStaffRestockProduct(state);
  if (!product) return false;
  state.staffWork = { stage: 'walking-to-shelf', productId: product.id, timer: 2.6, duration: 2.6, moved: 0 };
  pushEvent(state, 'staff', `Marisol is taking ${product.short.toLowerCase()} out to the shelf.`, 'Floor restock underway · deliveries stay in the stockroom until she works them.');
  return true;
}

function advanceStaffWork(state, deltaMinutes) {
  let remaining = deltaMinutes;
  let transitions = 0;
  while (remaining > 0 && transitions < 4) {
    let task = state.staffWork;
    if (!task || task.stage === 'idle') {
      if (!beginStaffRestock(state)) return;
      task = state.staffWork;
    }
    const step = Math.min(remaining, Math.max(0, task.timer));
    task.timer -= step;
    remaining -= step;
    if (task.timer > 1e-8) return;
    transitions += 1;
    if (task.stage === 'walking-to-shelf') {
      task.stage = 'stocking';
      task.timer = task.duration = 1.65;
      pushEvent(state, 'staff', `Marisol is stocking ${PRODUCT_BY_ID[task.productId].short.toLowerCase()}.`, 'She checks the dates and puts the oldest valid lot at the front.');
    } else if (task.stage === 'stocking') {
      const result = restockProduct(state, task.productId);
      task.moved = result.moved;
      task.stage = 'walking-back';
      task.timer = task.duration = 2.1;
      if (result.moved) {
        pushEvent(state, 'staff', `Marisol put ${result.moved} ${PRODUCT_BY_ID[task.productId].short.toLowerCase()} on the shelf.`, 'Automatic restock completed · expiry order preserved.');
      } else {
        pushEvent(state, 'staff', `Marisol found no in-date ${PRODUCT_BY_ID[task.productId].short.toLowerCase()} to stock.`, 'Expired backroom lots were left out of the sale area.');
      }
    } else {
      state.staffWork = { stage: 'idle', productId: null, timer: 0, duration: 0, moved: task.moved };
      // Start at most one additional task in this clock step; normal frame
      // increments are small, so this only matters after a suspended tab.
      if (remaining > 0) beginStaffRestock(state);
    }
  }
}

/** Advance the store clock by game-minutes (not real seconds). */
export function advanceGame(state, deltaMinutes) {
  if (!state.started || state.paused || state.dayEnded || state.gameOver || !Number.isFinite(deltaMinutes) || deltaMinutes <= 0) return;
  let remaining = deltaMinutes;
  while (remaining > 0 && !state.dayEnded) {
    const untilArrival = Math.max(0, state.nextArrival - state.minute);
    const untilClose = DAY_CLOSE - state.minute;
    const step = Math.min(remaining, Math.max(0.02, untilArrival || 0.02), untilClose);
    state.minute += step;
    remaining -= step;
    advanceCustomerPhases(state, step);
    advanceStaffWork(state, step);
    advancePurchasingManager(state);
    if (state.minute >= state.nextArrival && state.minute < DAY_CLOSE) {
      spawnCustomer(state);
      state.nextArrival = state.minute + customerArrivalInterval(state);
    }
    if (state.reputation <= 0) { endDay(state); state.gameOver = true; break; }
    if (state.minute >= DAY_CLOSE - 1e-6) {
      state.minute = DAY_CLOSE;
      endDay(state);
      break;
    }
  }
}

export function beginDay(state) {
  if (state.started || state.gameOver) return false;
  state.started = true;
  state.paused = false;
  state.nextArrival = state.minute + (10 + state.random() * 14) / trafficMultiplier(state);
  pushEvent(state, 'good', 'The shutters are up.', 'First customer should be along shortly.');
  return true;
}

export function togglePause(state) {
  if (!state.started || state.dayEnded || state.gameOver) return state.paused;
  state.paused = !state.paused;
  return state.paused;
}
