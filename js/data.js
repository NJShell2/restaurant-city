/* Restaurant City rebuild - game data: items, dishes, ingredients.
   Dish recipes and ingredient lists follow the original game's recipe data. */

/* ---------- Ingredients (star = trade value tier, 1-5) ---------- */
const INGREDIENTS = {
  tomato:   { name: 'Tomato', star: 1 }, basil: { name: 'Basil', star: 1 },
  cheese:   { name: 'Cheese', star: 1 }, flour: { name: 'Flour', star: 1 },
  bread:    { name: 'Bread', star: 1 },  potato: { name: 'Potato', star: 1 },
  egg:      { name: 'Egg', star: 1 },    milk: { name: 'Milk', star: 1 },
  sugar:    { name: 'Sugar', star: 1 },  water: { name: 'Water', star: 1 },
  ice:      { name: 'Ice', star: 1 },    salad: { name: 'Salad', star: 1 },
  chicken:  { name: 'Chicken', star: 2 }, beef: { name: 'Beef', star: 2 },
  pork:     { name: 'Pork', star: 2 },   sausage: { name: 'Sausage', star: 2 },
  tuna:     { name: 'Tuna', star: 2 },   strawberry: { name: 'Strawberry', star: 2 },
  apple:    { name: 'Apple', star: 2 },  banana: { name: 'Banana', star: 2 },
  lemon:    { name: 'Lemon', star: 2 },  onion: { name: 'Onion', star: 2 },
  garlic:   { name: 'Garlic', star: 2 }, mushroom: { name: 'Mushroom', star: 2 },
  butter:   { name: 'Butter', star: 2 }, cream: { name: 'Cream', star: 2 },
  rice:     { name: 'Rice', star: 2 },   pasta: { name: 'Pasta', star: 2 },
  bacon:    { name: 'Bacon', star: 2 },  beans: { name: 'Beans', star: 2 },
  coffee:   { name: 'Coffee Beans', star: 2 }, chocolate: { name: 'Chocolate', star: 3 },
  lobster:  { name: 'Lobster', star: 3 }, prawn: { name: 'Prawn', star: 3 },
  lamb:     { name: 'Lamb', star: 3 },   icecream: { name: 'Ice Cream', star: 3 },
  mango:    { name: 'Mango', star: 3 },  kiwi: { name: 'Kiwi', star: 3 },
  pumpkin:  { name: 'Pumpkin', star: 3 }, vanilla: { name: 'Vanilla', star: 3 },
  chili:    { name: 'Chili', star: 3 },  pepperoni: { name: 'Pepperoni', star: 3 },
  leek:     { name: 'Leek', star: 2 },   peas: { name: 'Peas', star: 1 },
  carrot:   { name: 'Carrot', star: 1 },  bayleaf: { name: 'Bay Leaf', star: 2 },
  lime:     { name: 'Lime', star: 2 },   tea: { name: 'Tea Leaves', star: 2 },
  orange:   { name: 'Orange', star: 2 },  peach: { name: 'Peach', star: 3 },
  tofu:     { name: 'Tofu', star: 2 },   noodles: { name: 'Noodles', star: 2 },
  saffron:  { name: 'Saffron', star: 4 }, wasabi: { name: 'Wasabi', star: 3 },
  ginger:   { name: 'Ginger', star: 2 },  coriander: { name: 'Coriander', star: 2 },
  oregano:  { name: 'Oregano', star: 2 }, pomegranate: { name: 'Pomegranate', star: 4 },
  dragonfruit: { name: 'Dragon Fruit', star: 4 },
};

/* ---------- Dishes ----------
   ingredients: list of ingredient ids (duplicates count twice, as in the original).
   learned: starter dishes are known from the beginning. */
const DISHES = [
  // Starters
  { id: 'tomato_basil_soup', cat: 'starter', name: 'Tomato & Basil Soup', ingredients: ['tomato'], learned: true },
  { id: 'garden_soup', cat: 'starter', name: 'Garden Soup', ingredients: ['salad', 'tomato', 'egg'] },
  { id: 'bruschetta', cat: 'starter', name: 'Bruschetta', ingredients: ['bread', 'tomato', 'basil'] },
  { id: 'tuna_fishcakes', cat: 'starter', name: 'Tuna Fishcakes', ingredients: ['tuna', 'flour', 'potato'] },
  { id: 'lobster_soup', cat: 'starter', name: 'Lobster Soup', ingredients: ['lobster', 'butter', 'lemon'], unlock: 12 },
  { id: 'pumpkin_soup', cat: 'starter', name: 'Pumpkin Soup', ingredients: ['pumpkin', 'cream', 'chili'], unlock: 6 },
  // Mains
  { id: 'margarita_pizza', cat: 'main', name: 'Margarita Pizza', ingredients: ['cheese', 'tomato', 'flour'], learned: true },
  { id: 'burger_fries', cat: 'main', name: 'Burger & Fries', ingredients: ['beef', 'potato'] },
  { id: 'spag_bolognese', cat: 'main', name: 'Spaghetti Bolognese', ingredients: ['pasta', 'beef', 'tomato'] },
  { id: 'roast_chicken', cat: 'main', name: 'Roast Chicken', ingredients: ['chicken', 'potato', 'salad'] },
  { id: 'tuna_sushi', cat: 'main', name: 'Tuna Sushi', ingredients: ['tuna', 'rice', 'wasabi'], unlock: 10 },
  { id: 'chili_con_carne', cat: 'main', name: 'Chili con Carne', ingredients: ['chili', 'beans', 'rice'] },
  // Desserts
  { id: 'fruit_selection', cat: 'dessert', name: 'Fruit Selection', ingredients: ['strawberry', 'apple'], learned: true },
  { id: 'strawberry_cake', cat: 'dessert', name: 'Strawberry Cake', ingredients: ['strawberry', 'flour', 'butter', 'sugar'] },
  { id: 'choc_cake_icecream', cat: 'dessert', name: 'Chocolate Cake with Ice Cream', ingredients: ['chocolate', 'flour', 'icecream'] },
  { id: 'pancakes', cat: 'dessert', name: 'Pancakes', ingredients: ['flour', 'egg', 'butter'] },
  { id: 'banana_split', cat: 'dessert', name: 'Banana Split', ingredients: ['banana', 'cream', 'icecream'] },
  { id: 'tiramisu', cat: 'dessert', name: 'Tiramisu', ingredients: ['egg', 'cream', 'coffee'], unlock: 8 },
  // Drinks (unlock at restaurant level 15 in the original)
  { id: 'glass_of_water', cat: 'drink', name: 'Glass of Water', ingredients: ['water', 'ice', 'lime'], learned: true },
  { id: 'espresso', cat: 'drink', name: 'Espresso', ingredients: ['coffee', 'coffee', 'water'] },
  { id: 'lemonade', cat: 'drink', name: 'Lemonade', ingredients: ['lemon', 'ice', 'water'] },
  { id: 'choc_milkshake', cat: 'drink', name: 'Chocolate Milkshake', ingredients: ['chocolate', 'icecream', 'milk'] },
];
const CATS = ['starter', 'main', 'dessert', 'drink'];
const CAT_NAMES = { starter: 'Starters', main: 'Mains', dessert: 'Desserts', drink: 'Drinks' };

/* ---------- Shop items ----------
   kind: door | table | chair | stove | counter | toilet | arcade | jukebox | sink | decor | walldecor | divider
   footprint w,h in tiles. blocksWalk: staff/customers cannot walk through. */
const ITEMS = [
  // Doors
  { id: 'door_wood', name: 'Wooden Door', kind: 'door', w: 1, h: 1, cost: 50, unlock: 1, blocksWalk: false, edgeOnly: true, desc: 'Customers enter here. Never block the doorway.' },
  { id: 'door_glass', name: 'Glass Door', kind: 'door', w: 1, h: 1, cost: 400, unlock: 5, blocksWalk: false, edgeOnly: true },
  // Tables & chairs
  { id: 'table_square', name: 'Square Table', kind: 'table', w: 1, h: 1, cost: 150, unlock: 1, seats: 4, blocksWalk: true, desc: 'Seats 4, one chair per side.' },
  { id: 'table_round', name: 'Round Table', kind: 'table', w: 1, h: 1, cost: 120, unlock: 1, seats: 2, blocksWalk: true, desc: 'Seats 2. Cozy 2-top.' },
  { id: 'chair_wood', name: 'Wooden Chair', kind: 'chair', w: 1, h: 1, cost: 40, unlock: 1, blocksWalk: false, needsTable: true, desc: 'Place next to a table.' },
  { id: 'chair_cushion', name: 'Cushioned Chair', kind: 'chair', w: 1, h: 1, cost: 90, unlock: 4, blocksWalk: false, needsTable: true },
  // Kitchen
  { id: 'stove_basic', name: 'Basic Stove', kind: 'stove', w: 1, h: 1, cost: 300, unlock: 1, blocksWalk: true, desc: 'Every chef needs a stove. All stoves cook at the same speed.' },
  { id: 'stove_deluxe', name: 'Deluxe Stove', kind: 'stove', w: 1, h: 1, cost: 900, unlock: 6, blocksWalk: true, desc: 'Same speed, fancier looks.' },
  { id: 'stove_pro', name: 'Pro Range', kind: 'stove', w: 1, h: 1, cost: 2500, unlock: 12, blocksWalk: true, desc: 'Same speed, professional shine.' },
  { id: 'counter', name: 'Serving Counter', kind: 'counter', w: 1, h: 1, cost: 200, unlock: 1, blocksWalk: true, desc: 'Cooked dishes wait here for waiters.' },
  { id: 'sink', name: 'Sink', kind: 'sink', w: 1, h: 1, cost: 800, unlock: 3, blocksWalk: true, desc: 'Decorative. Looks expensive because it is.' },
  { id: 'garden_plot', name: 'Garden Plot', kind: 'garden', w: 1, h: 1, cost: 2000, unlock: 6, blocksWalk: false, desc: 'Grow mystery ingredients. Click to plant, water, harvest.' },
  // Restroom (level 8+ in the original)
  { id: 'toilet', name: 'Toilet', kind: 'toilet', w: 1, h: 1, cost: 350, unlock: 8, blocksWalk: true, desc: 'Customers need restrooms from level 8. Janitors keep them clean.' },
  // Fun
  { id: 'arcade', name: 'Arcade Machine', kind: 'arcade', w: 1, h: 1, cost: 600, unlock: 2, blocksWalk: true, desc: 'Waiting customers play for 1 coin. Breaks after 6 plays.' },
  { id: 'jukebox', name: 'Jukebox', kind: 'jukebox', w: 1, h: 1, cost: 1200, unlock: 5, blocksWalk: true, desc: 'Music keeps customers happy. Boosts patience.' },
  // Decor
  { id: 'plant', name: 'Potted Plant', kind: 'decor', w: 1, h: 1, cost: 80, unlock: 1, blocksWalk: false, rating: 1 },
  { id: 'plant_big', name: 'Palm Tree', kind: 'decor', w: 1, h: 1, cost: 250, unlock: 5, blocksWalk: false, rating: 2 },
  { id: 'flowers', name: 'Flower Vase', kind: 'decor', w: 1, h: 1, cost: 120, unlock: 2, blocksWalk: false, rating: 1 },
  { id: 'statue', name: 'Marble Statue', kind: 'decor', w: 1, h: 1, cost: 1500, unlock: 9, blocksWalk: true, rating: 4 },
  { id: 'divider', name: 'Room Divider', kind: 'divider', w: 1, h: 1, cost: 100, unlock: 2, blocksWalk: true, desc: 'Guides foot traffic. Maze builders love these.' },
  { id: 'rug', name: 'Rug', kind: 'rug', w: 1, h: 1, cost: 150, unlock: 3, blocksWalk: false, rating: 1 },
  // Wall decor
  { id: 'painting', name: 'Painting', kind: 'walldecor', w: 1, h: 1, cost: 200, unlock: 1, blocksWalk: false, rating: 1 },
  { id: 'clock', name: 'Wall Clock', kind: 'walldecor', w: 1, h: 1, cost: 180, unlock: 3, blocksWalk: false, rating: 1 },
  { id: 'darts', name: 'Dartboard', kind: 'walldecor', w: 1, h: 1, cost: 350, unlock: 6, blocksWalk: false, rating: 2 },
];

/* Floors and wallpapers: whole-area fill, like the original. */
const FLOORS = [
  { id: 'floor_wood', name: 'Wood Floor', cost: 500, c1: '#c98f4e', c2: '#b57e42' },
  { id: 'floor_tile', name: 'Checker Tile', cost: 800, c1: '#e8e0d0', c2: '#b03a2e' },
  { id: 'floor_marble', name: 'Marble', cost: 2000, c1: '#efe9dc', c2: '#d8cfbb' },
  { id: 'floor_dark', name: 'Dark Wood', cost: 1200, c1: '#7a5230', c2: '#68452a' },
];
const WALLPAPERS = [
  { id: 'wall_cream', name: 'Cream Walls', cost: 400, color: '#f2e3c6' },
  { id: 'wall_red', name: 'Bistro Red', cost: 900, color: '#c0392b' },
  { id: 'wall_blue', name: 'Ocean Blue', cost: 900, color: '#3f6f9e' },
  { id: 'wall_green', name: 'Sage Green', cost: 900, color: '#7d9b6a' },
];

/* Generated staff names (the original hired Facebook friends; we generate a crew). */
const STAFF_FIRST = ['Maya', 'Leo', 'Sofia', 'Raj', 'Nina', 'Omar', 'Lena', 'Kai', 'Ivy', 'Theo', 'Ava', 'Milo', 'Zoe', 'Eli', 'Ruby', 'Finn', 'Luna', 'Max', 'Ella', 'Sam'];
const STAFF_LAST = ['Rossi', 'Chen', 'Garcia', 'Patel', 'Kim', 'Haddad', 'Novak', 'Tanaka', 'Silva', 'Okafor', 'Muller', 'Dubois', 'Khan', 'Moreau', 'Santos', 'Weber', 'Costa', 'Ali', 'Fischer', 'Reyes'];
const STAFF_SKIN = ['#f6d3b3', '#eab88a', '#c98d5f', '#8d5a3b', '#5f3a26'];
const STAFF_HAIR = ['#2b2b2b', '#5a3a1e', '#a06a2c', '#d9a441', '#b03a2e', '#7d7d7d', '#3f6f9e'];

function dishById(id) { return DISHES.find(d => d.id === id); }
function itemById(id) { return ITEMS.find(i => i.id === id); }
