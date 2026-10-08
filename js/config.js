/* Restaurant City rebuild - tuning constants.
   Time: game runs accelerated. ENERGY is in game-minutes; 1 real second = 0.25 game-min,
   so a full 240-min (4h) shift lasts ~16 real minutes of active play. */
const CFG = {
  TILE_W: 64,
  TILE_H: 32,

  START_COINS: 3500,
  START_POPULARITY: 10.0,
  MAX_POPULARITY: 50.0,
  SELLBACK_RATE: 1/3,

  GRID_START: 7,
  GRID_MAX: 12, // v1 cap (original reached 18x18 at level 31)
  GRID_EXPAND_LEVELS: [3, 4, 6, 7, 9], // each grants +1 row/col when reached

  MAX_STAFF: 9,
  STAFF_SLOT_LEVELS: [1, 2, 5, 8, 11, 14, 17, 21], // level -> total slots (index = slots-1)
  HIRE_COSTS: [0, 500, 1200, 2500, 4500, 7000, 10000, 14000, 19000], // per slot index
  ENERGY_MAX: 240, // game-minutes = 4h shift
  ENERGY_DRAIN_PER_SEC: 0.25, // game-min per real second while working
  ENERGY_REST_MULT: 3, // resting recovers 3x drain rate
  SNACKS: [
    { id: 'water', name: 'Water', cost: 60, restore: 60 },
    { id: 'apple', name: 'Apple', cost: 110, restore: 120 },
    { id: 'banana', name: 'Banana', cost: 160, restore: 180 },
    { id: 'sandwich', name: 'Sandwich', cost: 200, restore: 240 },
  ],
  // Energy tiers mirror the original's five color-coded tiers
  ENERGY_TIERS: [
    { min: 145, name: 'Dynamic', color: '#3fae5a' },
    { min: 109, name: 'Energetic', color: '#2fa3a0' },
    { min: 73, name: 'Okay', color: '#3f7fde' },
    { min: 37, name: 'Drowsy', color: '#8a5fbf' },
    { min: 1, name: 'Exhausted', color: '#d84a4a' },
  ],
  STAFF_SPEED_MULT: { 'Dynamic': 1.25, 'Energetic': 1.15, 'Okay': 1.0, 'Drowsy': 0.8, 'Exhausted': 0.55 },

  COINS_PER_PLATE: 2,
  GP_PER_LEVEL: [0, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8], // dish level 1..10
  DISH_LEVEL_TITLES: ['', 'Simple', 'Standard', 'Classic', 'Tasty', 'Delicious', 'Luxurious', 'Gourmet', 'Sensational', 'Ultimate', 'Royal'],
  DISH_LEVELUP_GP: [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800], // bonus when reaching level n

  MENU_SLOTS: [1, 2, 3], // slots per category at levels 1 / 10 / 20
  DRINKS_UNLOCK_LEVEL: 15,
  TOILETS_UNLOCK_LEVEL: 8,

  CUSTOMER_SPAWN_BASE_SECS: 26,
  CUSTOMER_SPAWN_MIN_SECS: 8,
  CUSTOMER_WALK_SPEED: 2.2, // tiles per second
  CUSTOMER_PATIENCE_SECS: 100, // waiting for order/service before anger
  CUSTOMER_EAT_SECS: 26,
  TIP_FAST_SECS: 45, // served within this -> tip
  TIP_COINS: 3,

  DISH_COOK_SECS: 18, // per dish at a stove (visible real-time cooking)
  ARCADE_USES_BEFORE_BREAK: 6,
  ARCADE_COIN_PER_PLAY: 1,
  TOILET_USES_BEFORE_DIRTY: 5,

  TRASH_SPAWN_SECS: 75,
  MAX_TRASH: 6,

  DAY_LENGTH_SECS: 480, // a "day" for stats; wages not used (energy is the pressure, as in original)

  OFFLINE_CAP_HOURS: 8,

  SAVE_KEY: 'rcity_save_v1',
  AUTOSAVE_SECS: 15,
};

/* Level table: GP threshold -> rewards (from research; v1 covers levels 1-21+). */
const LEVELS = [
  { lvl: 1,  gp: 0,      coins: 2500, note: 'Welcome' },
  { lvl: 2,  gp: 70,     coins: 1000, staff: 3 },
  { lvl: 3,  gp: 100,    coins: 1000, expand: 1 },
  { lvl: 4,  gp: 200,    coins: 1000, expand: 1 },
  { lvl: 5,  gp: 500,    coins: 1000, staff: 4 },
  { lvl: 6,  gp: 1000,   coins: 1000, expand: 1, garden: true },
  { lvl: 7,  gp: 2000,   coins: 1000, expand: 1 },
  { lvl: 8,  gp: 4000,   coins: 1000, staff: 5 },
  { lvl: 9,  gp: 6000,   coins: 1000, expand: 1 },
  { lvl: 10, gp: 8000,   coins: 1000, menuSlots: 2 },
  { lvl: 11, gp: 10000,  coins: 1000, staff: 6 },
  { lvl: 12, gp: 14000,  coins: 1000 },
  { lvl: 13, gp: 18000,  coins: 1000 },
  { lvl: 14, gp: 22000,  coins: 1000, staff: 7 },
  { lvl: 15, gp: 30000,  coins: 1000, drinks: true },
  { lvl: 16, gp: 38000,  coins: 1000 },
  { lvl: 17, gp: 46000,  coins: 1000, staff: 8 },
  { lvl: 18, gp: 58000,  coins: 1000 },
  { lvl: 19, gp: 70000,  coins: 1000 },
  { lvl: 20, gp: 86000,  coins: 1000, menuSlots: 3 },
  { lvl: 21, gp: 102000, coins: 1000, staff: 9 },
  // Beyond: keep climbing, coin bonus each level (original went to 65)
  { lvl: 22, gp: 122000, coins: 1000 }, { lvl: 23, gp: 142000, coins: 1000 },
  { lvl: 24, gp: 166000, coins: 1000 }, { lvl: 25, gp: 190000, coins: 1000 },
  { lvl: 26, gp: 218000, coins: 1000 }, { lvl: 27, gp: 246000, coins: 1000 },
  { lvl: 28, gp: 280000, coins: 1000 }, { lvl: 29, gp: 320000, coins: 1000 },
  { lvl: 30, gp: 370000, coins: 1000 }, { lvl: 31, gp: 430000, coins: 1000 },
  { lvl: 32, gp: 500000, coins: 1000 }, { lvl: 33, gp: 580000, coins: 1000 },
  { lvl: 34, gp: 661000, coins: 1000 }, { lvl: 35, gp: 743000, coins: 1000 },
];
