/* Restaurant City rebuild - holiday theme engine.
   Each month (1-12) has a theme: seasonal decor items, seasonal dishes,
   banner text, and accent colors. The active theme is picked by calendar
   month (auto) or manual override in the Theme tab (persisted).
   Format documented in hidden_files/holiday-system.md. */

const THEMES = {
  1: { name: 'New Year Winter', short: 'Winter', banner: 'Happy New Year! Cozy winter dining is in.',
    accent: '#7fb2d9', accent2: '#dfeef7',
    decor: [
      { id: 't_snowflake', name: 'Snowflake Cling', kind: 'walldecor', cost: 150, rating: 1, desc: 'Frosty window sparkle.' },
      { id: 't_icesculpt', name: 'Ice Sculpture', kind: 'decor', cost: 700, rating: 3, blocksWalk: true, desc: 'A swan, carved from ice.' },
      { id: 't_wreath_winter', name: 'Winter Wreath', kind: 'walldecor', cost: 200, rating: 1 },
      { id: 't_fireplace', name: 'Mini Fireplace', kind: 'decor', cost: 900, rating: 3, blocksWalk: true, desc: 'Customers linger near the warmth.' },
    ],
    dishes: [
      { id: 't_winter_root_soup', cat: 'starter', name: 'Winter Root Soup', ingredients: ['carrot', 'potato', 'onion'] },
      { id: 't_hot_choc_deluxe', cat: 'drink', name: 'Hot Chocolate Deluxe', ingredients: ['chocolate', 'milk', 'cream'] },
    ] },
  2: { name: "Valentine's Day", short: 'Valentine', banner: "Love is on the menu. Happy Valentine's Day!",
    accent: '#d94f6c', accent2: '#f7dfe6',
    decor: [
      { id: 't_heart_balloon', name: 'Heart Balloon', kind: 'decor', cost: 180, rating: 2 },
      { id: 't_rose_bouquet', name: 'Rose Bouquet', kind: 'decor', cost: 250, rating: 2 },
      { id: 't_love_painting', name: 'Love Painting', kind: 'walldecor', cost: 300, rating: 2 },
      { id: 't_candle_table', name: 'Candle Centerpiece', kind: 'decor', cost: 220, rating: 2, desc: 'Romance, now with 20% more candles.' },
    ],
    dishes: [
      { id: 't_choc_fondue', cat: 'dessert', name: 'Chocolate Fondue', ingredients: ['chocolate', 'strawberry', 'cream'] },
      { id: 't_berry_kiss_shake', cat: 'drink', name: 'Berry Kiss Shake', ingredients: ['strawberry', 'icecream', 'milk'] },
    ] },
  3: { name: "St. Patrick's Day", short: 'St Patrick', banner: 'Top o the morning! St. Patrick specials are here.',
    accent: '#3fae5a', accent2: '#dff2e3',
    decor: [
      { id: 't_shamrock', name: 'Shamrock Plant', kind: 'decor', cost: 150, rating: 1 },
      { id: 't_leprechaun', name: 'Leprechaun Statue', kind: 'decor', cost: 800, rating: 3, blocksWalk: true },
      { id: 't_green_banner', name: 'Green Banner', kind: 'walldecor', cost: 180, rating: 1 },
      { id: 't_pot_gold', name: 'Pot of Gold', kind: 'decor', cost: 1200, rating: 4, desc: 'Definitely not chocolate coins.' },
    ],
    dishes: [
      { id: 't_irish_stew', cat: 'main', name: 'Irish Stew', ingredients: ['beef', 'potato', 'carrot'] },
      { id: 't_shamrock_shake', cat: 'drink', name: 'Shamrock Shake', ingredients: ['icecream', 'milk', 'sugar'] },
    ] },
  4: { name: 'Easter Spring', short: 'Easter', banner: 'Spring has sprung! Easter treats now serving.',
    accent: '#e8a0bf', accent2: '#fbe9f2',
    decor: [
      { id: 't_egg_basket', name: 'Easter Egg Basket', kind: 'decor', cost: 200, rating: 2 },
      { id: 't_bunny', name: 'Bunny Statue', kind: 'decor', cost: 650, rating: 3, blocksWalk: true },
      { id: 't_spring_garland', name: 'Spring Garland', kind: 'walldecor', cost: 180, rating: 1 },
      { id: 't_tulip', name: 'Tulip Vase', kind: 'decor', cost: 160, rating: 1 },
    ],
    dishes: [
      { id: 't_spring_salad', cat: 'starter', name: 'Spring Garden Salad', ingredients: ['salad', 'carrot', 'egg'] },
      { id: 't_lemon_cake', cat: 'dessert', name: 'Lemon Drizzle Cake', ingredients: ['lemon', 'flour', 'sugar'] },
    ] },
  5: { name: 'Cinco de Mayo', short: 'Cinco de Mayo', banner: 'Fiesta time! Cinco de Mayo specials are here.',
    accent: '#e07b39', accent2: '#fbeedf',
    decor: [
      { id: 't_papel_picado', name: 'Papel Picado', kind: 'walldecor', cost: 180, rating: 1 },
      { id: 't_cactus', name: 'Cactus Pot', kind: 'decor', cost: 220, rating: 2 },
      { id: 't_maracas', name: 'Maraca Display', kind: 'decor', cost: 260, rating: 2 },
      { id: 't_fiesta_banner', name: 'Fiesta Banner', kind: 'walldecor', cost: 200, rating: 1 },
    ],
    dishes: [
      { id: 't_lime_chicken', cat: 'main', name: 'Zesty Lime Chicken', ingredients: ['chicken', 'lime', 'garlic'] },
      { id: 't_mango_mocktail', cat: 'drink', name: 'Mango Fiesta Cooler', ingredients: ['mango', 'lime', 'ice'] },
    ] },
  6: { name: 'Summer Kickoff', short: 'Summer', banner: 'Summer is here! Cool treats and sunny vibes.',
    accent: '#f2b134', accent2: '#fdf3dd',
    decor: [
      { id: 't_umbrella', name: 'Beach Umbrella', kind: 'decor', cost: 400, rating: 2, blocksWalk: true },
      { id: 't_surfboard', name: 'Surfboard', kind: 'walldecor', cost: 350, rating: 2 },
      { id: 't_beachball', name: 'Beach Ball', kind: 'decor', cost: 120, rating: 1 },
      { id: 't_tiki_torch', name: 'Tiki Torch', kind: 'decor', cost: 280, rating: 2 },
    ],
    dishes: [
      { id: 't_summer_skewers', cat: 'dessert', name: 'Summer Fruit Skewers', ingredients: ['mango', 'kiwi', 'strawberry'] },
      { id: 't_peach_cooler', cat: 'drink', name: 'Peach Iced Cooler', ingredients: ['peach', 'ice', 'water'] },
    ] },
  7: { name: '4th of July', short: 'July 4th', banner: 'Happy 4th of July! All-American specials now serving.',
    accent: '#3f6fbf', accent2: '#e3ebfa',
    decor: [
      { id: 't_bunting', name: 'Flag Bunting', kind: 'walldecor', cost: 180, rating: 1 },
      { id: 't_star_statue', name: 'Star Statue', kind: 'decor', cost: 700, rating: 3, blocksWalk: true },
      { id: 't_bbq_grill', name: 'BBQ Grill', kind: 'decor', cost: 850, rating: 3, blocksWalk: true, desc: 'For show. The chefs use the stoves.' },
      { id: 't_fireworks', name: 'Firework Poster', kind: 'walldecor', cost: 220, rating: 1 },
    ],
    dishes: [
      { id: 't_american_burger', cat: 'main', name: 'All-American Burger', ingredients: ['beef', 'bread', 'salad'] },
      { id: 't_apple_pie', cat: 'dessert', name: 'Classic Apple Pie', ingredients: ['apple', 'flour', 'sugar'] },
    ] },
  8: { name: 'Summer Luau', short: 'Luau', banner: 'Aloha! The summer luau is on.',
    accent: '#e07856', accent2: '#fbe7de',
    decor: [
      { id: 't_tiki_mask', name: 'Tiki Mask', kind: 'walldecor', cost: 260, rating: 2 },
      { id: 't_pineapple', name: 'Pineapple Vase', kind: 'decor', cost: 200, rating: 2 },
      { id: 't_luau_torch', name: 'Luau Torch', kind: 'decor', cost: 280, rating: 2 },
      { id: 't_hibiscus', name: 'Hibiscus Garland', kind: 'walldecor', cost: 180, rating: 1 },
    ],
    dishes: [
      { id: 't_hawaiian_platter', cat: 'starter', name: 'Hawaiian Fruit Platter', ingredients: ['dragonfruit', 'mango', 'kiwi'] },
      { id: 't_tropical_drink', cat: 'drink', name: 'Tropical Sunset', ingredients: ['orange', 'mango', 'ice'] },
    ] },
  9: { name: 'Harvest', short: 'Harvest', banner: 'Harvest season! Warm autumn flavors have arrived.',
    accent: '#b06a2e', accent2: '#f5e8d8',
    decor: [
      { id: 't_cornucopia', name: 'Cornucopia', kind: 'decor', cost: 450, rating: 3 },
      { id: 't_haybale', name: 'Hay Bale', kind: 'decor', cost: 200, rating: 1, blocksWalk: true },
      { id: 't_harvest_wreath', name: 'Harvest Wreath', kind: 'walldecor', cost: 200, rating: 1 },
      { id: 't_scarecrow', name: 'Scarecrow', kind: 'decor', cost: 550, rating: 3, blocksWalk: true },
    ],
    dishes: [
      { id: 't_harvest_soup', cat: 'starter', name: 'Harvest Pumpkin Soup', ingredients: ['pumpkin', 'potato', 'onion'] },
      { id: 't_caramel_apple_tart', cat: 'dessert', name: 'Caramel Apple Tart', ingredients: ['apple', 'sugar', 'butter'] },
    ] },
  10: { name: 'Halloween', short: 'Halloween', banner: 'Spooky season! Halloween specials are creeping in.',
    accent: '#7d3fa0', accent2: '#efe0f7',
    decor: [
      { id: 't_jackolantern', name: "Jack-o'-Lantern", kind: 'decor', cost: 300, rating: 2, desc: 'Grinning all night long.' },
      { id: 't_ghost', name: 'Ghost Statue', kind: 'decor', cost: 800, rating: 3, blocksWalk: true, desc: 'Boo. (It is friendly.)' },
      { id: 't_spooky_painting', name: 'Spooky Painting', kind: 'walldecor', cost: 250, rating: 2, desc: 'The eyes follow you. Probably.' },
      { id: 't_candy_bowl', name: 'Candy Bowl', kind: 'decor', cost: 150, rating: 1, desc: 'Take one. Take two. We are not counting.' },
      { id: 't_witch_hat', name: 'Witch Hat Stand', kind: 'decor', cost: 400, rating: 2 },
    ],
    dishes: [
      { id: 't_scary_pumpkin_soup', cat: 'starter', name: 'Scary Pumpkin Soup', ingredients: ['pumpkin', 'cream', 'chili'] },
      { id: 't_candy_apple', cat: 'dessert', name: 'Candy Apple Fright', ingredients: ['apple', 'sugar', 'lemon'] },
    ] },
  11: { name: 'Thanksgiving', short: 'Thanksgiving', banner: 'Give thanks! Thanksgiving specials are on the table.',
    accent: '#a05a2e', accent2: '#f7e9d8',
    decor: [
      { id: 't_turkey_center', name: 'Turkey Centerpiece', kind: 'decor', cost: 500, rating: 3 },
      { id: 't_autumn_wreath', name: 'Autumn Wreath', kind: 'walldecor', cost: 200, rating: 1 },
      { id: 't_gold_cornucopia', name: 'Golden Cornucopia', kind: 'decor', cost: 900, rating: 4, blocksWalk: true },
      { id: 't_pilgrim_art', name: 'Harvest Mural', kind: 'walldecor', cost: 280, rating: 2 },
    ],
    dishes: [
      { id: 't_turkey_dinner', cat: 'main', name: 'Roast Turkey Dinner', ingredients: ['chicken', 'potato', 'carrot'] },
      { id: 't_pumpkin_pie', cat: 'dessert', name: 'Pumpkin Pie', ingredients: ['pumpkin', 'flour', 'sugar'] },
    ] },
  12: { name: 'Christmas', short: 'Christmas', banner: 'Merry Christmas! Holiday specials are here.',
    accent: '#2e7d4f', accent2: '#dff0e5',
    decor: [
      { id: 't_christmas_tree', name: 'Christmas Tree', kind: 'decor', cost: 1000, rating: 4, blocksWalk: true },
      { id: 't_stocking', name: 'Stocking', kind: 'walldecor', cost: 150, rating: 1 },
      { id: 't_snowman', name: 'Snowman', kind: 'decor', cost: 600, rating: 3, blocksWalk: true },
      { id: 't_string_lights', name: 'String Lights', kind: 'walldecor', cost: 300, rating: 2 },
      { id: 't_nutcracker', name: 'Nutcracker', kind: 'decor', cost: 700, rating: 3 },
    ],
    dishes: [
      { id: 't_gingerbread', cat: 'dessert', name: 'Gingerbread Cookies', ingredients: ['flour', 'sugar', 'ginger'] },
      { id: 't_eggnog', cat: 'drink', name: 'Holiday Eggnog', ingredients: ['egg', 'milk', 'sugar'] },
    ] },
};

/* Seasonal dishes behave like normal dishes (learn with ingredients, level 1-10)
   but only while their theme is active. They are merged into DISHES at runtime. */
function activeTheme(monthOverride) {
  const m = monthOverride || (new Date().getMonth() + 1);
  return { month: m, theme: THEMES[m] };
}
function seasonalDishes(month) {
  const t = THEMES[month || (new Date().getMonth() + 1)];
  return (t.dishes || []).map(d => Object.assign({ seasonal: true, themeName: t.name }, d));
}
function seasonalDecor(month) {
  const t = THEMES[month || (new Date().getMonth() + 1)];
  return (t.decor || []).map(d => Object.assign({ seasonal: true, themeName: t.name, w: 1, h: 1, unlock: 1 }, d));
}
