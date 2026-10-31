import './style.css';
import { createAudio } from 'madness-engine/audio';
import {
  PRODUCTS, PRODUCT_BY_ID, STAFF, CAT_ROSTER, createGameState, money, productNow,
  shelfQuantity, stockroomQuantity, expiredQuantity, oldestShelfBatch, inventoryHealth,
  restockProduct, restockAll, placeOrder, pullExpired, adjustPrice, borrowCredit,
  repayCredit, advanceGame, beginDay, togglePause, startNextDay, saveGameState, loadGameState,
  trafficLabel, reviewSummary,
} from './sim.js';
import { createBodegaWorld } from './world.js';

const $ = (selector) => document.querySelector(selector);
const panel = $('#panel-content');
const SAVE_KEY = 'bodega.corner-store.save.v1';
let state;
try { state = loadGameState(window.localStorage.getItem(SAVE_KEY)); } catch { state = null; }
state ??= createGameState();
state.orderCases ??= Object.fromEntries(PRODUCTS.map((p) => [p.id, 1]));
window.__bodegaState = state;

let currentTab = 'overview';
let selectedProduct = 'milk';
let stockFilter = 'All';
let stockSearch = '';
let audioMuted = false;
let previousEventSequence = state.eventSequence;
let previousReviewSequence = state.reviewSequence;
let lastPanelRender = 0;
let lastHeaderRender = 0;
let realTime = 0;

const audio = createAudio({ storageKey: 'bodega.muted', glue: true });
audioMuted = audio.muted;
const world = await createBodegaWorld($('#world'));
world.setState(state);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function fmtClock(minute) {
  const hour24 = Math.floor(minute / 60) % 24;
  const mins = Math.floor(minute % 60).toString().padStart(2, '0');
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return `${hour}:${mins} ${suffix}`;
}

function expiryCopy(batch) {
  if (!batch) return 'NO BATCH ON SHELF';
  const left = batch.expiresAt - productNow(state);
  if (left <= 0) return 'EXPIRED · PULL NOW';
  if (left < 1) return `EXPIRES TODAY · ${Math.max(1, Math.ceil(left * 24))}H LEFT`;
  if (left < 3) return `EXPIRES IN ${Math.ceil(left)} DAYS`;
  return `${Math.floor(left)} DAYS LEFT`;
}

function expiryTone(batch) {
  if (!batch) return 'muted';
  const left = batch.expiresAt - productNow(state);
  return left <= 0 ? 'danger' : left < 2 ? 'warning' : 'good';
}

function notify(message, kind = 'info') {
  const stack = $('#toast-stack');
  const toast = document.createElement('div');
  toast.className = `toast toast-${kind}`;
  toast.innerHTML = `<span class="toast-icon">${kind === 'danger' ? '!' : kind === 'good' ? '✓' : '✳'}</span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 3400);
}

function recordNewEvents() {
  const latest = state.events.filter((event) => event.id > previousEventSequence).reverse();
  for (const event of latest) {
    if (event.type === 'danger') {
      notify(event.message, 'danger');
      if (!audioMuted) audio.tone({ freq: 240, to: 150, length: 0.22, gain: 0.18, type: 'triangle' });
    } else if (event.type === 'sale') {
      if (!audioMuted) audio.jingle([64, 69, 76], { type: 'triangle', gain: 0.055, length: 0.12 });
    } else if (event.type === 'order') notify(event.message, 'good');
    else if (event.type === 'cat') notify(event.message, event.detail?.includes('happier customer') ? 'good' : 'info');
    else if (event.type === 'review') {
      const rating = Number(event.message.match(/(\d)-star/)?.[1] ?? 3);
      notify(`New neighborhood review · ${rating} stars`, rating <= 2 ? 'danger' : rating === 5 ? 'good' : 'info');
      renderReviewFeed();
      if (currentTab === 'reviews') renderPanel({ preserveScroll: true });
    }
  }
  previousEventSequence = Math.max(previousEventSequence, state.eventSequence);
  previousReviewSequence = Math.max(previousReviewSequence, state.reviewSequence);
}

function updateHeader() {
  $('#cash-value').textContent = money(state.cash);
  $('#debt-value').textContent = money(state.debt);
  $('#revenue-value').textContent = money(state.dayStats.revenue);
  $('#rep-value').textContent = Math.round(state.reputation);
  $('#rep-meter').style.width = `${state.reputation}%`;
  $('#day-label').textContent = `DAY ${String(state.day).padStart(2, '0')}`;
  $('#clock-value').textContent = fmtClock(state.minute);
  const status = !state.started ? 'SHUTTERS DOWN' : state.dayEnded ? 'CLOSED FOR THE DAY' : state.paused ? 'PAUSED' : 'SHUTTERS UP';
  $('#shop-status').textContent = status;
  $('#open-pill').classList.toggle('is-open', state.started && !state.dayEnded);
  $('#open-pill').querySelector('span').textContent = state.dayEnded ? 'CLOSED' : state.paused ? (state.started ? 'PAUSED' : 'CLOSED') : 'OPEN';
  $('#pause-toggle').textContent = state.paused ? '▶' : 'Ⅱ';
  $('#pause-toggle').title = state.paused ? 'Resume simulation' : 'Pause simulation';
  $('#foot-customers').textContent = `${state.customers.length} SHOPPERS INSIDE`;
  $('#foot-traffic').textContent = `FOOTFALL ${trafficLabel(state)}`;
  $('#foot-staff').textContent = `${STAFF.length} STAFF ON SHIFT`;
  const health = inventoryHealth(state);
  const alertCount = health.expired + health.empty;
  $('#shelf-alert-count').textContent = alertCount;
  $('#shelf-alert-count').classList.toggle('hidden', alertCount === 0);
  $('#bottom-message').textContent = state.dayStats.complaints
    ? `${state.dayStats.complaints} unhappy customer${state.dayStats.complaints === 1 ? '' : 's'} today. Check the dates.`
    : health.expired ? `${health.expired} expired units need to come off the shelf.`
      : 'Fresh stock. Fair prices. Good people.';
  $('#start-overlay').classList.toggle('hidden', state.started);
  $('#pause-toggle').disabled = !state.started || state.dayEnded;
  $('#sound-toggle').textContent = audioMuted ? '♫̸' : '♫';
  $('#sound-toggle').classList.toggle('muted', audioMuted);
  document.querySelectorAll('[data-speed]').forEach((button) => button.classList.toggle('active', Number(button.dataset.speed) === state.speed));
}

function eventIcon(type) {
  return ({ sale: '↗', customer: '♙', danger: '!', warning: '△', order: '▣', stock: '↔', waste: '×', finance: '$', close: '▣', good: '✓', note: '✳', review: '★', cat: '♥' })[type] ?? '·';
}

function renderActivity(limit = 6) {
  return `<div class="activity-list">${state.events.slice(0, limit).map((event) => `
    <div class="activity-row activity-${event.type}">
      <span class="activity-symbol">${eventIcon(event.type)}</span>
      <div class="activity-copy"><strong>${escapeHtml(event.message)}</strong><span>${escapeHtml(event.detail || '')}</span></div>
      <time>${event.day === state.day ? fmtClock(event.time) : `D${event.day}`}</time>
    </div>`).join('')}</div>`;
}

function reviewTimestamp(review) {
  if (!review.day) return 'BEFORE YOUR FIRST SHIFT';
  if (review.day === state.day) return `TODAY · ${fmtClock(review.minute)}`;
  return `DAY ${review.day} · ${fmtClock(review.minute)}`;
}

function reviewMarkup() {
  const summary = reviewSummary(state);
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: state.reviews.filter((review) => review.rating === rating).length,
  }));
  const total = Math.max(1, summary.count);
  const reviews = state.reviews.slice(0, 18);
  const recent = reviews[0];
  return `
    <div class="review-reputation">
      <div class="review-scoreline"><strong>${summary.rating.toFixed(1)}</strong><span class="review-stars">${'★'.repeat(Math.round(summary.rating))}<i>${'☆'.repeat(5 - Math.round(summary.rating))}</i></span></div>
      <div class="review-score-copy"><b>${summary.count} neighborhood reviews</b><span>${Math.round(state.reputation)} / 100 trust score</span></div>
      <div class="rating-distribution">${distribution.map((row) => `<div class="rating-bar"><span>${row.rating}</span><i><b style="width:${row.count / total * 100}%"></b></i><small>${row.count}</small></div>`).join('')}</div>
    </div>
    <div class="review-footfall"><span><i class="live-dot"></i> ESTIMATED FOOT TRAFFIC</span><strong class="traffic-${trafficLabel(state).toLowerCase()}">${trafficLabel(state)}</strong><small>${state.reputation >= 86 ? 'The block is talking you up.' : state.reputation >= 68 ? 'Regular neighborhood traffic.' : state.reputation >= 45 ? 'Fewer walk-ins than usual.' : 'Word of mouth is keeping people away.'}</small></div>
    <div class="review-feed-heading"><span>RECENT CUSTOMER POSTS</span><small>NEWEST FIRST</small></div>
    <div class="review-stream">${reviews.map((review) => {
      const initials = review.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
      const isNew = recent && review.id === recent.id && review.id > previousReviewSequence;
      const tag = review.outcome === 'expired' ? 'FOOD SAFETY'
        : review.outcome === 'cat-loved' || review.outcome === 'cat-annoyed' ? 'CAT EXPERIENCE'
          : review.outcome === 'stockout' || review.outcome === 'partial' ? 'AVAILABILITY' : review.source.toUpperCase();
      return `<article class="review-card ${isNew ? 'review-new' : ''} ${review.rating <= 2 ? 'review-negative' : ''}">
        <div class="review-person"><span class="review-avatar">${escapeHtml(initials)}</span><span class="review-person-copy"><strong>${escapeHtml(review.name)}</strong><small>${escapeHtml(review.source)} · ${reviewTimestamp(review)}</small></span>${isNew ? '<em>JUST IN</em>' : ''}</div>
        <div class="review-card-stars"><span>${'★'.repeat(review.rating)}<i>${'☆'.repeat(5 - review.rating)}</i></span><small>${tag}</small></div>
        <p>${escapeHtml(review.text)}</p>
        ${review.outcome === 'expired' ? '<div class="review-response-note">A date-check complaint. Pull the lot and tighten rotation.</div>' : review.outcome === 'cat-annoyed' ? '<div class="review-response-note">A customer found the cats disruptive. Keep checkout and food-contact surfaces clear.</div>' : review.outcome === 'cat-loved' ? '<div class="review-response-note review-response-good">A neighborhood regular for the cats. The bodega charm is working.</div>' : ''}
      </article>`;
    }).join('') || '<div class="empty-state compact">No reviews yet. The neighborhood will have something to say soon.</div>'}</div>
    <div class="review-disclaimer">SIMULATED NEIGHBORHOOD FEEDBACK · REVIEWS CHANGE WITH EVERY VISIT</div>`;
}

function renderReviewFeed({ preserveScroll = true } = {}) {
  const target = $('#review-feed-content');
  if (!target) return;
  const oldScroll = target.scrollTop;
  target.innerHTML = reviewMarkup();
  if (preserveScroll) target.scrollTop = oldScroll;
}

function reviewsPanel() {
  return `<div class="review-mobile-page">${reviewMarkup()}</div>`;
}

function productFlag(product) {
  const batch = oldestShelfBatch(state, product.id);
  const left = batch ? batch.expiresAt - productNow(state) : Infinity;
  if (expiredQuantity(state, product.id)) return '<span class="tag tag-danger">EXPIRED</span>';
  if (shelfQuantity(state, product.id) === 0) return '<span class="tag tag-muted">EMPTY</span>';
  if (left < 2) return '<span class="tag tag-warning">DATE CHECK</span>';
  if (shelfQuantity(state, product.id) <= 2) return '<span class="tag tag-warning">LOW</span>';
  return '<span class="tag tag-good">ON SHELF</span>';
}

function overviewPanel() {
  const health = inventoryHealth(state);
  const active = state.customers.length;
  const grossMargin = state.dayStats.revenue > 0 ? Math.round((state.dayStats.grossProfit / state.dayStats.revenue) * 100) : 0;
  const urgent = PRODUCTS.filter((product) => {
    const front = oldestShelfBatch(state, product.id);
    return expiredQuantity(state, product.id) || (front && front.expiresAt - productNow(state) < 2);
  }).slice(0, 4);
  const low = PRODUCTS.filter((product) => shelfQuantity(state, product.id) <= 2).slice(0, 4);
  return `
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">THE DAILY TILL</div><h3>Today's numbers</h3></div><span class="subtle">DAY ${state.day}</span></div>
      <div class="metric-grid">
        <div class="metric-card"><span>SALES</span><strong>${money(state.dayStats.revenue)}</strong><small>${state.dayStats.unitsSold} units out the door</small></div>
        <div class="metric-card"><span>GROSS MARGIN</span><strong>${grossMargin}%</strong><small>${money(state.dayStats.grossProfit)} before overhead</small></div>
        <div class="metric-card"><span>NEIGHBORS SERVED</span><strong>${state.dayStats.customers}</strong><small>${active} currently in store</small></div>
        <div class="metric-card"><span>DATE CHECKS</span><strong class="${health.expired ? 'text-danger' : ''}">${health.expired}</strong><small>expired units across both rooms</small></div>
      </div>
      <div class="cat-day-insight"><span>THE CATS HAVE HAD THEIR SAY</span><strong><b>♥ ${state.dayStats.catLoved ?? 0}</b><b>! ${state.dayStats.catAnnoyed ?? 0}</b></strong><small>customers charmed · customers bothered</small></div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">KEEP THE STORE MOVING</div><h3>Needs your eye</h3></div><span class="subtle">${health.low} low · ${health.expired} expired</span></div>
      ${urgent.length ? `<div class="attention-list">${urgent.map((product) => {
        const batch = oldestShelfBatch(state, product.id);
        const expired = expiredQuantity(state, product.id);
        return `<button class="attention-row" data-action="select-product" data-product="${product.id}"><span class="attention-mark ${expired ? 'mark-danger' : 'mark-warning'}">${expired ? '!' : '◷'}</span><span><strong>${escapeHtml(product.short)}</strong><small>${expired ? `${expired} expired unit${expired === 1 ? '' : 's'} · pull before sale` : expiryCopy(batch).toLowerCase()}</small></span><b>→</b></button>`;
      }).join('')}</div>` : '<div class="empty-state compact"><span class="empty-mark">✓</span><strong>Dates look good.</strong><p>No immediate expiry problems on the floor.</p></div>'}
      <div class="action-pair"><button class="secondary-button" data-action="pull-expired">PULL EXPIRED</button><button class="secondary-button" data-action="restock-all">RESTOCK BACKROOM</button></div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">THE BLOCK IS TALKING</div><h3>Latest activity</h3></div><span class="subtle">LIVE</span></div>
      ${renderActivity(5)}
    </div>`;
}

const FILTERS = ['All', 'Produce', 'Dairy', 'Eggs', 'Meat', 'Bakery', 'Dry goods', 'Drinks', 'Frozen'];

function shelfPanel() {
  const visible = PRODUCTS.filter((product) => (stockFilter === 'All' || product.category === stockFilter)
    && `${product.name} ${product.category}`.toLowerCase().includes(stockSearch.toLowerCase()));
  const rows = visible.map((product) => {
    const front = oldestShelfBatch(state, product.id);
    const shelf = shelfQuantity(state, product.id);
    const back = stockroomQuantity(state, product.id);
    const expiry = expiryCopy(front);
    return `<button class="stock-row ${product.id === selectedProduct ? 'selected' : ''}" data-action="select-product" data-product="${product.id}">
      <span class="product-swatch" style="--swatch:${product.color}"></span>
      <span class="stock-main"><strong>${escapeHtml(product.short)}</strong><small>${escapeHtml(product.category)} · ${expiry}</small></span>
      <span class="stock-count"><b>${shelf}</b><small>FLOOR</small></span>
      <span class="stock-back"><b>${back}</b><small>BACK</small></span>
      <span class="stock-chevron">›</span>
    </button>`;
  }).join('');
  const product = PRODUCT_BY_ID[selectedProduct];
  const shelfBatches = [...state.shelves[selectedProduct]].sort((a, b) => a.expiresAt - b.expiresAt);
  const backBatches = [...state.stockroom[selectedProduct]].sort((a, b) => a.expiresAt - b.expiresAt);
  const front = shelfBatches[0];
  const totalExpired = expiredQuantity(state, selectedProduct);
  return `
    <div class="panel-section inventory-toolbar">
      <div class="section-heading"><div><div class="eyebrow">FLOOR + STOCKROOM</div><h3>Inventory</h3></div><span class="subtle">23 LINES</span></div>
      <label class="search-box"><span>⌕</span><input id="stock-search" type="search" placeholder="Find a grocery item…" value="${escapeHtml(stockSearch)}" /></label>
      <div class="filter-row">${FILTERS.map((filter) => `<button class="filter-chip ${stockFilter === filter ? 'active' : ''}" data-action="filter-stock" data-filter="${filter}">${filter}</button>`).join('')}</div>
      <div class="stock-list">${rows || '<div class="empty-state compact">No products match that search.</div>'}</div>
    </div>
    <div class="panel-section product-detail">
      <div class="section-heading"><div><div class="eyebrow">SELECTED LINE</div><h3>${escapeHtml(product.name)}</h3></div>${productFlag(product)}</div>
      <p class="product-description">${escapeHtml(product.description)}</p>
      <div class="detail-quantities"><div><span>ON THE FLOOR</span><strong>${shelfQuantity(state, selectedProduct)}</strong></div><div><span>IN BACK</span><strong>${stockroomQuantity(state, selectedProduct)}</strong></div><div><span>EXPIRED</span><strong class="${totalExpired ? 'text-danger' : ''}">${totalExpired}</strong></div></div>
      <div class="fifo-heading"><span>FIFO DATE ROTATION</span><span>OLDEST → FRONT</span></div>
      <div class="batch-list">${[...shelfBatches, ...backBatches].slice(0, 5).map((batch, index) => {
        const location = index < shelfBatches.length ? 'SHELF' : 'BACKROOM';
        const isFront = location === 'SHELF' && index === 0;
        return `<div class="batch-row"><span class="batch-position ${isFront ? 'front' : ''}">${isFront ? '01' : String(index + 1).padStart(2, '0')}</span><span class="batch-label"><strong>${isFront ? 'FRONT OF SHELF' : location}</strong><small>${batch.qty} units · received Day ${Math.max(1, Math.floor(batch.receivedAt))}</small></span><span class="batch-expiry ${expiryTone(batch)}">${expiryCopy(batch)}</span></div>`;
      }).join('') || '<div class="empty-state compact">No lots available. Place a supplier order.</div>'}</div>
      <div class="price-editor"><div><span>RETAIL PRICE</span><strong>${money(state.prices[selectedProduct])}</strong><small>Wholesale ${money(product.cost)} · case of ${product.caseSize}</small></div><div class="price-buttons"><button data-action="price-down" data-product="${selectedProduct}" aria-label="Lower price">−</button><button data-action="price-up" data-product="${selectedProduct}" aria-label="Raise price">+</button></div></div>
      <div class="action-pair"><button class="primary-button" data-action="restock" data-product="${selectedProduct}">RESTOCK SHELF ↗</button><button class="secondary-button ${totalExpired ? 'danger-button' : ''}" data-action="pull-product-expired" data-product="${selectedProduct}">PULL EXPIRED</button></div>
      ${front ? `<div class="rotation-note"><span>↻</span> ${expiryCopy(front)} · New deliveries stay behind older stock until dates are checked.</div>` : ''}
    </div>`;
}

const ORDER_GROUPS = ['Produce', 'Dairy', 'Eggs', 'Meat', 'Bakery', 'Dry goods', 'Drinks', 'Frozen'];
function ordersPanel() {
  const grouped = ORDER_GROUPS.map((category) => {
    const products = PRODUCTS.filter((p) => p.category === category);
    if (!products.length) return '';
    return `<div class="order-category"><div class="order-category-title">${category}<span>${products.length} LINES</span></div>${products.map((product) => {
      const cases = state.orderCases[product.id] || 1;
      const total = product.cost * product.caseSize * cases;
      const shelf = shelfQuantity(state, product.id);
      const back = stockroomQuantity(state, product.id);
      return `<div class="order-row">
        <span class="product-swatch" style="--swatch:${product.color}"></span>
        <span class="order-product"><strong>${escapeHtml(product.short)}</strong><small>${product.caseSize} / case · ${money(product.cost)} each</small><small>${shelf} shelf · ${back} backroom</small></span>
        <span class="order-controls"><span class="case-stepper"><button data-action="case-down" data-product="${product.id}">−</button><b>${cases}</b><button data-action="case-up" data-product="${product.id}">+</button></span><strong>${money(total)}</strong><button class="mini-order-button" data-action="place-order" data-product="${product.id}">ADD</button></span>
      </div>`;
    }).join('')}</div>`;
  }).join('');
  return `
    <div class="panel-section order-intro">
      <div class="section-heading"><div><div class="eyebrow">WHOLESALE DEPOT</div><h3>Place an order</h3></div><span class="tag tag-muted">SAME-DAY DROP</span></div>
      <p class="product-description">Cases arrive in the stockroom. You still have to put them on the floor, with the shortest-dated stock at the front.</p>
      <div class="supplier-credit"><span>AVAILABLE CASH</span><strong>${money(state.cash)}</strong><small>Credit is separate. Draw it on the Finance tab before ordering.</small></div>
    </div>
    <div class="order-catalog">${grouped}</div>
    <div class="panel-section supplier-tip"><span class="tip-mark">✳</span><span><strong>BUY TO THE CLOCK.</strong><small>Produce and fresh meat turn quickly. Dry goods and canned food hold much longer.</small></span></div>`;
}

function financePanel() {
  const available = Math.max(0, state.creditLimit - state.debt);
  const debtRatio = Math.min(100, state.debt / state.creditLimit * 100);
  const interest = state.debt * state.creditRate;
  return `
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">WORKING CAPITAL</div><h3>Books & borrowing</h3></div><span class="tag ${state.debt ? 'tag-warning' : 'tag-good'}">${state.debt ? 'CREDIT ACTIVE' : 'DEBT FREE'}</span></div>
      <div class="finance-card"><div class="finance-card-top"><span>OUTSTANDING BALANCE</span><strong>${money(state.debt)}</strong></div><div class="debt-meter"><i style="width:${debtRatio}%"></i></div><div class="finance-card-foot"><span>${money(available)} available</span><span>${money(state.creditLimit)} limit</span></div></div>
      <div class="loan-terms"><div><span>DAILY INTEREST</span><strong>1.25%</strong></div><div><span>INTEREST AT CURRENT BALANCE</span><strong>${money(interest)} / day</strong></div><div><span>PAYMENT DUE</span><strong>End of each day</strong></div></div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">SHORT-TERM CREDIT</div><h3>Draw funds</h3></div></div>
      <p class="product-description">Use credit to cover a supplier order or a rough day. Interest compounds into the balance at close. Borrow only what you can repay.</p>
      <div class="borrow-form"><label for="borrow-amount">AMOUNT TO DRAW</label><div class="borrow-input"><span>$</span><input id="borrow-amount" type="number" min="25" max="${available}" step="25" value="250" /></div><button class="primary-button" data-action="borrow-custom">DRAW CREDIT</button></div>
      <div class="quick-amounts">${[100, 250, 500].map((amount) => `<button class="secondary-button" data-action="borrow" data-amount="${amount}" ${available < amount ? 'disabled' : ''}>+${money(amount)}</button>`).join('')}</div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">PAY IT BACK</div><h3>Repayment</h3></div></div>
      <div class="repay-card"><div><strong>${money(state.debt)}</strong><small>Current principal + interest</small></div><button class="primary-button" data-action="repay-all" ${state.debt <= 0 || state.cash <= 0 ? 'disabled' : ''}>PAY IN FULL</button></div>
      <div class="quick-amounts">${[100, 250, 500].map((amount) => `<button class="secondary-button" data-action="repay" data-amount="${amount}" ${state.debt <= 0 || state.cash <= 0 ? 'disabled' : ''}>PAY ${money(amount)}</button>`).join('')}</div>
      <div class="fine-print">Repayments are taken from the register immediately. You cannot repay more cash than you have.</div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">THE COST OF OPENING</div><h3>Daily overhead</h3></div></div>
      <div class="cost-list"><div><span>Rent</span><b>${money(state.dailyCosts.rent)}</b></div><div><span>Payroll · 2 staff</span><b>${money(state.dailyCosts.payroll)}</b></div><div><span>Utilities & refrigeration</span><b>${money(state.dailyCosts.utilities)}</b></div><div><span>Interest at today's balance</span><b>${money(interest)}</b></div><div class="cost-total"><span>Expected daily overhead</span><b>${money(state.dailyCosts.rent + state.dailyCosts.payroll + state.dailyCosts.utilities + interest)}</b></div></div>
    </div>`;
}

function staffPanel() {
  return `
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">YOUR CREW</div><h3>People of the bodega</h3></div><span class="tag tag-good">ON SHIFT</span></div>
      <p class="product-description">Good people make a good store. Your crew is on the clock whenever the shutters are up.</p>
      <div class="staff-list">${STAFF.map((person, index) => `<div class="staff-card"><div class="staff-avatar staff-avatar-${index}">${index === 0 ? 'LR' : 'MV'}</div><div class="staff-copy"><strong>${person.name}</strong><span>${person.role}</span><small>${money(person.wage)} / day · full shift</small></div><span class="staff-status">ON DUTY</span></div>`).join('')}</div>
      <div class="staff-note"><span>✳</span><div><strong>LOU — THE REGISTER</strong><p>Keeps the queue moving and knows everybody's usual. Payroll: ${money(STAFF[0].wage)} per day.</p></div></div>
      <div class="staff-note"><span>↻</span><div><strong>MARISOL — THE FLOOR</strong><p>Runs deliveries out to the shelves and keeps the date rotation in order. Payroll: ${money(STAFF[1].wage)} per day.</p></div></div>
    </div>
    <div class="panel-section cat-section">
      <div class="section-heading"><div><div class="eyebrow">UNPAID, UNBOTHERED</div><h3>The bodega cats</h3></div><span class="tag tag-good">3 MANAGERS</span></div>
      <div class="cat-list">${CAT_ROSTER.map((cat) => `<div class="cat-card"><div class="cat-portrait cat-${cat.coat}"><span>✦</span></div><div><strong>${cat.name}</strong><span>${cat.coat} coat · ${cat.job}</span></div><small>PERMANENT</small></div>`).join('')}</div>
      <div class="fine-print">They do not take a salary. They do occasionally take the warmest chair, a patch of sunlight, or an entire shelf to themselves.</div>
      <div class="cat-odds-note"><strong>THE CUSTOMER FACTOR</strong><span>25% of shoppers are charmed · 20% get annoyed · 55% are indifferent. Cat encounters can sway mood, reputation, and reviews.</span></div>
    </div>
    <div class="panel-section">
      <div class="section-heading"><div><div class="eyebrow">HOUSEKEEPING</div><h3>Store standards</h3></div></div>
      <div class="standards-list"><div><span>✓</span> Rotate stock by expiry date, not delivery date.</div><div><span>✓</span> Keep dairy, eggs and meat in the cold case.</div><div><span>✓</span> Pull expired items from the shelf and stockroom.</div><div><span>✓</span> Pay the supplier before the next order.</div></div>
    </div>`;
}

function renderPanel({ preserveScroll = false } = {}) {
  const oldScroll = panel.scrollTop;
  if (currentTab === 'overview') panel.innerHTML = overviewPanel();
  else if (currentTab === 'shelves') panel.innerHTML = shelfPanel();
  else if (currentTab === 'orders') panel.innerHTML = ordersPanel();
  else if (currentTab === 'finance') panel.innerHTML = financePanel();
  else if (currentTab === 'staff') panel.innerHTML = staffPanel();
  else if (currentTab === 'reviews') panel.innerHTML = reviewsPanel();
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === currentTab));
  panel.scrollTop = preserveScroll ? oldScroll : 0;
}

function renderDaySummary() {
  const summary = state.lastDaySummary;
  const modal = $('#day-summary');
  if (!state.dayEnded || !summary) { modal.classList.add('hidden'); return; }
  modal.classList.remove('hidden');
  const isOver = summary.net < 0;
  modal.innerHTML = `
    <div class="summary-card">
      <div class="summary-eyebrow">THE BOOKS ARE CLOSED · DAY ${summary.day}</div>
      <div class="summary-icon">${state.gameOver ? '×' : '✳'}</div>
      <h2>${state.gameOver ? 'The shutters stay down.' : 'Another day on the block.'}</h2>
      <p>${state.gameOver ? 'The register or the neighborhood ran out of patience. This store has closed.' : 'Count the till, check the shelves, and get ready for tomorrow.'}</p>
      <div class="summary-metrics"><div><span>SALES</span><b>${money(summary.revenue)}</b></div><div><span>GROSS PROFIT</span><b>${money(summary.grossProfit)}</b></div><div><span>SHOPPERS</span><b>${summary.customers}</b></div><div><span>COMPLAINTS</span><b>${summary.complaints}</b></div></div>
      <div class="summary-cat-line"><span>CAT ENCOUNTERS</span><b>♥ ${summary.catLoved ?? 0} charmed</b><b>! ${summary.catAnnoyed ?? 0} annoyed</b></div>
      <div class="summary-costs"><div><span>Rent</span><b>${money(summary.expenses.rent)}</b></div><div><span>Payroll</span><b>${money(summary.expenses.payroll)}</b></div><div><span>Utilities</span><b>${money(summary.expenses.utilities)}</b></div><div><span>Credit interest</span><b>${money(summary.expenses.interest)}</b></div><div><span>Inventory purchased</span><b>${money(summary.purchases)}</b></div><div><span>Expired stock written off</span><b>${money(summary.waste)}</b></div></div>
      <div class="summary-net ${isOver ? 'negative' : 'positive'}"><span>TRADING RESULT AFTER OVERHEAD</span><strong>${summary.net >= 0 ? '+' : '−'}${money(Math.abs(summary.net))}</strong></div>
      <div class="summary-balance"><span>REGISTER ${money(summary.cash)}</span><span>CREDIT ${money(summary.debt)}</span></div>
      ${state.gameOver ? '<button class="primary-button summary-next" data-action="restart">TRY A NEW STORE ↗</button>' : '<button class="primary-button summary-next" data-action="next-day">OPEN TOMORROW ↗</button>'}
    </div>`;
}

function refresh() {
  updateHeader();
  renderPanel();
  renderReviewFeed({ preserveScroll: false });
  renderDaySummary();
}

function setTab(tab) {
  currentTab = tab;
  renderPanel();
}

function withAudioWake() {
  if (!audioMuted) audio.wake();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  withAudioWake();
  if (button.dataset.tab) { setTab(button.dataset.tab); return; }
  const action = button.dataset.action;
  const productId = button.dataset.product;
  const amount = Number(button.dataset.amount);
  if (action === 'select-product') { selectedProduct = productId; currentTab = 'shelves'; renderPanel(); return; }
  if (action === 'filter-stock') { stockFilter = button.dataset.filter; renderPanel(); return; }
  if (action === 'restock') {
    const result = restockProduct(state, productId);
    notify(result.moved ? `${result.moved} ${PRODUCT_BY_ID[productId].short.toLowerCase()} moved to the floor.` : result.reason === 'shelf-full' ? 'That shelf is already full.' : 'No backroom stock to move.', result.moved ? 'good' : 'info');
  }
  if (action === 'restock-all') {
    const moved = restockAll(state);
    notify(moved ? `${moved} units moved from the stockroom. Oldest dates went to the front.` : 'The shelves are already full or the stockroom is empty.', moved ? 'good' : 'info');
  }
  if (action === 'pull-expired') {
    const result = pullExpired(state);
    notify(result.removed ? `${result.removed} expired units pulled · ${money(result.loss)} written off.` : 'No expired stock found.', result.removed ? 'good' : 'info');
  }
  if (action === 'pull-product-expired') {
    const product = PRODUCT_BY_ID[productId];
    const result = pullExpired(state, productId);
    notify(result.removed ? `${result.removed} ${product.short.toLowerCase()} removed.` : `No expired ${product.short.toLowerCase()} found.`, result.removed ? 'good' : 'info');
  }
  if (action === 'price-up') { adjustPrice(state, productId, 0.25); }
  if (action === 'price-down') { adjustPrice(state, productId, -0.25); }
  if (action === 'case-up') { state.orderCases[productId] = Math.min(20, (state.orderCases[productId] || 1) + 1); }
  if (action === 'case-down') { state.orderCases[productId] = Math.max(1, (state.orderCases[productId] || 1) - 1); }
  if (action === 'place-order') {
    const result = placeOrder(state, productId, state.orderCases[productId] || 1);
    if (result.ok) {
      notify(`${result.qty} ${PRODUCT_BY_ID[productId].short.toLowerCase()} delivered to backroom.`, 'good');
      state.orderCases[productId] = 1;
    } else notify(result.reason === 'insufficient-funds' ? `Short ${money(result.shortfall)}. Use the credit line or choose fewer cases.` : 'That order could not be placed.', 'danger');
  }
  if (action === 'borrow') {
    const result = borrowCredit(state, amount);
    notify(result.ok ? `${money(amount)} added to the register.` : `Only ${money(result.available || 0)} credit is available.`, result.ok ? 'good' : 'danger');
  }
  if (action === 'borrow-custom') {
    const value = Number($('#borrow-amount')?.value);
    const result = borrowCredit(state, value);
    notify(result.ok ? `${money(value)} added to the register.` : result.reason === 'credit-limit' ? `Only ${money(result.available)} credit is available.` : 'Enter a positive amount.', result.ok ? 'good' : 'danger');
  }
  if (action === 'repay') {
    const result = repayCredit(state, amount);
    notify(result.ok ? `${money(result.amount)} repaid.` : 'There is no available cash to repay.', result.ok ? 'good' : 'info');
  }
  if (action === 'repay-all') {
    const result = repayCredit(state);
    notify(result.ok ? `${money(result.amount)} repaid. Outstanding balance: ${money(state.debt)}.` : 'There is no available cash to repay.', result.ok ? 'good' : 'info');
  }
  if (action === 'next-day') {
    startNextDay(state);
    $('#day-summary').classList.add('hidden');
    notify(`Day ${state.day} is open. Make it count.`, 'good');
  }
  if (action === 'restart') {
    window.location.reload();
    return;
  }
  if (action && action !== 'next-day' && action !== 'restart') renderPanel();
  updateHeader();
  world.setState(state);
});

// The search input is replaced as the panel is re-rendered; delegate its listener.
panel.addEventListener('input', (event) => {
  if (event.target.id === 'stock-search') {
    const cursor = event.target.selectionStart;
    stockSearch = event.target.value;
    const y = panel.scrollTop;
    renderPanel();
    const next = $('#stock-search');
    next?.focus(); next?.setSelectionRange(cursor, cursor);
    panel.scrollTop = y;
  }
});

$('#open-store').addEventListener('click', () => {
  withAudioWake();
  beginDay(state);
  world.setOpen(true);
  refresh();
  notify('The shutters are up. Here comes the neighborhood.', 'good');
});

$('#pause-toggle').addEventListener('click', () => {
  togglePause(state);
  updateHeader();
});

$('#sound-toggle').addEventListener('click', () => {
  audioMuted = !audioMuted;
  audio.setMuted(audioMuted);
  if (!audioMuted) audio.wake();
  $('#sound-toggle').textContent = audioMuted ? '♫̸' : '♫';
  $('#sound-toggle').classList.toggle('muted', audioMuted);
});

document.querySelectorAll('[data-speed]').forEach((button) => button.addEventListener('click', () => {
  state.speed = Number(button.dataset.speed);
  document.querySelectorAll('[data-speed]').forEach((control) => control.classList.toggle('active', control === button));
}));

// The world owns the render loop; this loop owns the business clock and UI.
let last = performance.now();
let lastSave = last;
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  realTime += dt;
  advanceGame(state, dt * 1.65 * state.speed);
  recordNewEvents();
  if (now - lastHeaderRender > 160) { updateHeader(); lastHeaderRender = now; }
  if (now - lastPanelRender > 900) {
    if (currentTab === 'overview' || (currentTab === 'shelves' && !$('#stock-search')?.matches(':focus'))) renderPanel({ preserveScroll: true });
    renderDaySummary();
    lastPanelRender = now;
  }
  world.setState(state);
  if (now - lastSave > 4000) {
    try { window.localStorage.setItem(SAVE_KEY, saveGameState(state)); } catch { /* Storage can be disabled or full. */ }
    lastSave = now;
  }
  requestAnimationFrame(frame);
}

refresh();
world.setOpen(state.started && !state.dayEnded);
window.addEventListener('beforeunload', () => { try { window.localStorage.setItem(SAVE_KEY, saveGameState(state)); } catch { /* Ignore unavailable storage. */ } });
requestAnimationFrame(frame);
