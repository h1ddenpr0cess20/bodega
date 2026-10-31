# BODEGA — Corner Store Stories

A three-dimensional neighborhood grocery-store management game built on [Madness Engine](https://github.com/h1ddenpr0cess20/madness-engine). The shop is a real-time, day-by-day business: buy wholesale, receive deliveries, rotate lots, keep perishables fresh, serve customers, manage cash, and repay credit before interest gets away from you.

## Run it

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local Vite URL. To create a production build:

```sh
npm run build
npm run preview
```

Run the business-logic test suite with:

```sh
npm test
```

The Madness Engine dependency is pinned to a specific commit so character, texture, renderer, and animation APIs remain reproducible.

## The game

- **A built 3D corner store.** Painted checker-linoleum and brick textures from Madness Engine, produce bins, pantry gondolas, a refrigerated wall, bakery, freezer/drinks island, front windows, neon signage, a full checkout, pendant lighting, and a hand-dressed shop sign.
- **A cast, not mannequins.** Lou works the register; Marisol works the floor. Customers shop with 2–3 distinct lines in their basket and are selected from the engine's tourist, punk, hippie, artist, hipster, cabbie, Nonna, salaryman, skater, and other character sculpts. Three engine-sculpted, house-sized bodega cats—Blaze, Jinx, and Nyx—roam separate patrol loops through the aisles, pause and look around, and keep out of the shelf fixtures. Each visitor independently rolls a reaction: 25% are charmed, 20% get annoyed, and 55% are indifferent. Hearts and warning markers show non-neutral reactions above customers; cat encounters alter browsing time, neighborhood trust, and the likelihood and tone of a public review.
- **Clear circulation and obstacle-aware movement.** The dry-goods gondolas are split into separate bays, the drinks island is narrowed to open the aisle, and shoppers, staff, and cats follow a waypoint path around shelf, counter, and display footprints rather than walking through them.
- **Autonomous floor replenishment.** Marisol checks low shelves, walks to the relevant section, moves the earliest-expiring in-date lots from the stockroom to the floor, and returns to receiving. Opening reserve stock means she can work from the first trading day; expired stock is never restocked.
- **A proper grocery mix.** Twenty-three lines across produce, dairy, eggs, bakery, meat, dry goods, drinks, and frozen food. Each product has its own wholesale cost, retail price, case size, demand weight, and expiry horizon.
- **Different spoilage clocks.** Examples: lettuce 3 days, bananas 4, milk 6, Gala apples 8, eggs 28, pasta 240, canned beans 540. All dates use the same store-day clock, but each product has its own shelf life.
- **FEFO / FIFO date rotation.** Lots carry their received and expiry dates from supplier delivery onward. Deliveries land in the stockroom; restocking merges lots into the shelf and sorts them by earliest expiry first. Sales consume the first eligible lot. Restocking never resets a date.
- **Expired-stock consequences.** An expired lot at the front is not sellable. A customer who reaches it complains, leaves without the item, and damages neighborhood reputation. Pull expired units from both shelf and stockroom; waste is booked at wholesale cost.
- **Neighborhood review network.** A live, Google-style local review feed shows prewritten, varied comments from actual simulated visitors. Good visits sometimes earn 4–5 stars; stockouts produce mixed reviews; customers who discover expired food are especially likely to publish 1–2-star food-safety complaints. Cat lovers and cat-averse shoppers have separate, varied review banks, and expired-food complaints take precedence when both happen on one visit. The average rating and trust score move with those posts.
- **Reputation-driven foot traffic.** The review score is not decorative: neighborhood trust changes the interval between walk-ins. Strong word of mouth brings a busier store; repeated food-safety complaints and poor visits slow the flow of customers and can eventually close the business.
- **Business management.** Change retail prices, buy cases from the supplier with register funds, restock to shelf capacity, borrow against a revolving credit line, and repay partial or full balances. Credit charges 1.25% interest at each day close.
- **Playable store owner.** You control a regular, custom-dressed human avatar in the 3D store (not a boss character). Move with WASD or arrow keys, hold Shift to hurry, or use the touch directional pad. Movement respects shelf and counter collisions, and your position is saved with the store.
- **Store-level progression and purchasing manager.** Customer visits earn experience, with better baskets and good service earning more. Every 250 XP advances a level. At Level 5, hire Rafael Ortiz for $300 plus an $18 daily wage. He checks product demand and valid shelf/backroom coverage every 90 in-game minutes, ordering up to two cases when a product reaches its reorder point. Orders use register cash only, protect a $240 operating reserve, and never draw on credit. Automatic buying can be paused or resumed from the Staff tab.
- **Loading screen.** The game builds the 3D scene, character models, and navigation before showing the title card, with a staged progress indicator.
- **Trading days.** The shutters open at 7 AM and close at 9 PM. Rent, payroll, refrigeration/utilities, and credit interest are charged at close. The day-end statement separates sales, gross profit, purchases, waste, overhead, net trading result, cash, and debt.
- **Save and resume.** State is periodically saved to browser storage, including inventory lots, customer reactions, reviews, debt, and the random stream. A resumed store starts paused so time does not run while the page is closed.

## Controls

Drag the 3D shop to orbit the camera; use the mouse wheel to zoom. Move the owner with WASD or arrow keys; hold Shift to hurry. On touch layouts, use the on-screen directional pad. The 1× / 2× / 3× controls change simulation speed. The pause button freezes the business clock. Use the tabs on the right to manage stock, supplier orders, finance, and staff.

## Project layout

```text
src/
  main.js      UI, interactions, owner controls, loading gate, day clock, save/resume
  sim.js       store rules, inventory lots, progression, staff automation, finance, customer outcomes
  controls.js  camera-relative keyboard, arrow-key and touch movement vectors
  world.js     Madness Engine scene, player, characters, cats, pathfinding, products and shop fixtures
  style.css    responsive management interface and title/day-end overlays
test/
  sim.test.js      business-rule regression tests
  controls.test.js camera-relative player movement tests
```

## Inventory rule

The store uses **first-expiring, first-out (FEFO)** rotation. It is FIFO in the normal case because a given grocery line has a fixed shelf life, but it sorts by the lot's actual expiry date rather than trusting delivery order. That prevents a shorter-dated delivery from being buried behind newer, longer-dated product.
