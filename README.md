# Restaurant City (tribute remake)

A fan-made tribute to Playfish's **Restaurant City** (Facebook, 2009-2012): design your restaurant, hire and assign staff, and watch your crew cook and serve automatically.

Play it here: https://njshell2.github.io/restaurant-city/

## The heart of the game
1. **Design** your restaurant on an isometric grid: tables, chairs, doors, stoves, counters, decor, restrooms, arcade machines.
2. **Staff it**: hire chefs, waiters, and janitors. Everyone works a 4-hour energy shift; feed them snacks or let them rest.
3. **Watch them work**: customers walk in, get seated, order, get cooked for, eat, and pay. You earn coins and Gourmet Points per plate.

## Systems
- **Menu**: 4 categories (Starter, Main, Dessert, Drink), 22 recipes with real ingredient lists. Learn dishes and level them 1-10 (Simple to Royal) for more GP per plate.
- **Ingredients**: daily login streaks, Fresh Ingredient Market (3/day), garden plots, and the wandering Gourmet King.
- **Economy**: coins, Gourmet Points, 35 restaurant levels with unlocks (bigger floor, staff slots, menu slots, drinks, garden), popularity rating 0-50.
- **Staff energy**: five tiers from Dynamic to Exhausted; tired staff work slower; if everyone collapses the restaurant closes.
- **Holiday themes**: a new seasonal theme drops every month (decor + seasonal dishes). October ships with Halloween.

## Tech
Pure static site: HTML5 canvas, vanilla JS, no dependencies, no backend. Saves to `localStorage` automatically.

Not affiliated with EA or Playfish. All art drawn from scratch for this remake.
