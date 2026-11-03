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

- **A built 3D corner store, inside and out.** A brick shop on a Brooklyn block: a striped awning, a sign, display windows and a glass street door that swings open for anyone coming or going, with a sidewalk, curb and street dressed with the engine's own street furniture (`scenery/street`: sodium lamps, a hydrant, a bin, a bench, a mailbox, shrubs by the door and a dumpster in the alley) and the neighbors' buildings either side. Inside: a real checkout counter along the right wall (belt, register, card reader, candy rack, and the cashier's shelving behind it), a cooler wall across the back (dairy, eggs and meat, cold drinks, frozen), a double-sided pantry gondola, produce bins, a bakery table, and a walled **backroom for receiving** with a delivery door onto the alley, pallet racking, a pallet and a receiving desk. Cartons pile up on the rack and the pallet as the stockroom fills.
- **Walls that get out of the way.** Whichever walls stand between the camera and the shop fade to a ghost as you orbit, and come back solid when you move round behind them; the backroom's walls fade from either side. The **WALLS** button cycles Auto, Solid and Ghost.
- **Real stock on the shelves.** Every one of the 38 products is a sculpted prop from Madness Engine's `props/groceries` (a gable milk carton, an open carton of eggs, a 2 L cola, a twist-tied loaf, a can of beans, a frozen pizza...) and the number you see on a shelf follows the stock you actually hold.
- **A neighborhood, not mannequins.** Eighteen residents, each a different person from the engine's cast in their own skin tone, hair and eyes (`character.variant`): Mrs. Russo, Walt, Jules, Priya, Kenji, Dmitri and the rest. They have habits that shape your day: favorite products, how much a price rise bothers them, how big a shop they make, the hours they usually come in, and how they feel about the cats. Lou works the register and Marisol runs the floor and the backroom. Three engine-sculpted, house-sized bodega cats (Blaze, Jinx and Nyx) roam separate patrol loops. Each visitor rolls a reaction to the cats (cat people are charmed more often), and hearts and warning markers show above customers.
- **Clear circulation and obstacle-aware movement.** Shoppers walk in off the sidewalk through the door, browse the shelves on their lists, queue at the counter and leave; staff and cats follow the same waypoint paths around shelf, counter and wall footprints rather than through them.
- **Autonomous floor replenishment.** Marisol checks low shelves, walks to the relevant section, moves the earliest-expiring in-date lots from the stockroom to the floor, and returns to receiving. Opening reserve stock means she can work from the first trading day; expired stock is never restocked.
- **A proper grocery mix, in three tiers.** Thirty-eight lines across produce, dairy, eggs, bakery, meat, dry goods, snacks, drinks, and frozen food. Tier 1 (15 basics) is on sale from day one; tier 2 opens at store level 3 (eight lines the shop already has room for, plus oranges, carrots, flour, sugar, orange juice and chips); tier 3 opens at level 5 (onions, peppers, grapes, oats, peanut butter, bacon, sour cream, cookies and candy bars). More tiers can be added in `TIERS` in `src/sim.js`.
- **Buy fixtures and rearrange the shop.** The new lines also need somewhere to stand. On the Floor tab, buy produce bins (one per new line), snack-gondola boards and reach-in coolers with register cash; each opens once its tier does. Then move anything on the floor, from the first day: the pantry gondola, every produce bin, the bakery table, each cooler and whatever you bought. Pick a piece up and click the floor to put it down (R turns it, Esc cancels). Shelves, bins and tables must stand clear of walls; coolers go flat against a wall, windows included, with the glass facing in. A spot that would shut off the door, the till or a shelf is refused. The checkout counter, the backroom and the walls stay put.
- **Different spoilage clocks.** Examples: lettuce 3 days, bananas 4, milk 6, Gala apples 8, eggs 28, pasta 240, canned beans 540. All dates use the same store-day clock, but each product has its own shelf life.
- **FEFO / FIFO date rotation.** Lots carry their received and expiry dates from supplier delivery onward. Deliveries land in the stockroom; restocking merges lots into the shelf and sorts them by earliest expiry first. Sales consume the first eligible lot. Restocking never resets a date.
- **Expired-stock consequences.** An expired lot at the front is not sellable. A customer who reaches it complains, leaves without the item, and damages neighborhood reputation. Pull expired units from both shelf and stockroom; waste is booked at wholesale cost.
- **Neighborhood review network.** A live, Google-style local review feed shows prewritten, varied comments from actual simulated visitors. Good visits sometimes earn 4–5 stars; stockouts produce mixed reviews; customers who discover expired food are especially likely to publish 1–2-star food-safety complaints. Cat lovers and cat-averse shoppers have separate, varied review banks, and expired-food complaints take precedence when both happen on one visit. The average rating and trust score move with those posts.
- **Reputation-driven foot traffic.** The review score is not decorative: neighborhood trust changes the interval between walk-ins. Strong word of mouth brings a busier store; repeated food-safety complaints and poor visits slow the flow of customers and can eventually close the business.
- **Business management.** Change retail prices (shoppers put a line back if it costs more than they will pay, so the highest price is not the best one), buy cases from the supplier with register funds, restock to shelf capacity, borrow against a revolving credit line, and repay partial or full balances. Credit charges 1.25% interest at each day close, added to the balance (it is not also taken from the till).
- **Playable store owner.** You control a regular, custom-dressed human avatar in the 3D store (not a boss character). Move with WASD or arrow keys, hold Shift to hurry, or use the touch directional pad. Movement respects shelf and counter collisions, and your position is saved with the store.
- **Store-level progression and purchasing manager.** Customer visits earn experience, with better baskets and good service earning more. Every 250 XP advances a level. At Level 5, hire Rafael Ortiz for $300 plus an $18 daily wage. He checks product demand and valid shelf/backroom coverage every 90 in-game minutes, ordering up to two cases when a product reaches its reorder point. Orders use register cash only, protect a $240 operating reserve, and never draw on credit. Automatic buying can be paused or resumed from the Staff tab.
- **Loading screen.** The scene is built while the stock, staff and first residents are sculpted in background workers, with a progress indicator; the rest of the neighborhood is sculpted while the shop is open, and only residents who are ready come in.
- **Trading days.** The shutters open at 7 AM, the last shopper is let in at 8:30 PM, and anyone still shopping at 9 PM finishes their shop before the books close. Rent, payroll, refrigeration/utilities, and credit interest are charged at close. The day-end statement separates sales, gross profit, purchases, waste, overhead, net trading result, cash, and debt.
- **Save and resume.** State is periodically saved to browser storage, including inventory lots, customer reactions, reviews, debt, and the random stream. No time passes while the page is closed; a resumed store carries on from the moment you left.

## Controls

Click and hold the middle mouse button (the wheel) and drag to orbit the camera (on a touch screen, drag with a finger); use the mouse wheel to zoom; the WALLS button chooses whether near walls fade (Auto), stay solid or are always ghosted. Move the owner with WASD or arrow keys; hold Shift to hurry. On touch layouts, use the on-screen directional pad. The 1× / 2× / 3× controls change simulation speed. The pause button freezes the business clock. Use the tabs on the right to manage stock, supplier orders, finance, and staff.

## Project layout

```text
src/
  main.js        UI, interactions, owner controls, loading gate, day clock, save/resume
  sim.js         store rules, inventory lots, residents, progression, staff automation, finance, customer outcomes
  layout.js      the floor plan: doors, fixtures, product shelf slots, waypoint pathfinding (no rendering)
  walls.js       which walls fade, and by how much, for the camera's position (no rendering)
  cast.js        every model by name: staff, owner, cats, the residents in their own colors, the stock
  bake.worker.js sculpts those models off the page's thread
  controls.js    camera-relative keyboard, arrow-key and touch movement vectors
  world.js       Madness Engine scene: the shell and street, fixtures, stock, people, doors and fading walls
  style.css      responsive management interface and title/day-end overlays
test/
  sim.test.js       business-rule regression tests
  layout.test.js    every shelf is reachable, the door and backroom are passable, walls fade correctly
  cast.test.js      every product and resident has a model, and the bake lists cover the cast
  controls.test.js  camera-relative player movement tests
```

## Inventory rule

The store uses **first-expiring, first-out (FEFO)** rotation. It is FIFO in the normal case because a given grocery line has a fixed shelf life, but it sorts by the lot's actual expiry date rather than trusting delivery order. That prevents a shorter-dated delivery from being buried behind newer, longer-dated product.
