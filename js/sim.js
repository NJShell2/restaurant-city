/* Restaurant City rebuild - simulation: game state, staff/customer AI, economy.
   No DOM here; ui.js and render.js consume this. */

function rc_uid() { return Math.random().toString(36).slice(2, 10); }
function rc_rand(a, b) { return a + Math.random() * (b - a); }
function rc_choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rc_clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rc_key(x, y) { return x + ',' + y; }

/* ---------------- state ---------------- */

function rc_newGame() {
  const s = {
    v: 1,
    coins: CFG.START_COINS,
    gp: 0, level: 1,
    popularity: CFG.START_POPULARITY,
    gridSize: CFG.GRID_START,
    floorId: 'floor_wood', wallId: 'wall_cream',
    tiles: {},            // "x,y" -> { itemId, extra... }
    staff: [],
    customers: [],
    dishes: {},           // dishId -> { learned: true, level: n }
    menu: { starter: [], main: [], dessert: [], drink: [] },
    ingredients: {},
    cookQueue: [],        // { id, dishId, tx, ty, cx, cy, customerId }
    readyDishes: [],      // { id, dishId, tx, ty, customerId } waiting on counter/stove
    trash: [],            // { id, x, y }
    garden: {},           // "x,y" -> { plantedAt, water, grown }
    market: { day: '', offers: [] },
    streak: { lastDay: '', count: 0 },
    themeOverride: 0,     // 0 = auto by month
    stats: { served: 0, earned: 0, angry: 0 },
    lastSeen: Date.now(),
    spawnT: 8, trashT: CFG.TRASH_SPAWN_SECS,
    gourmetKing: null,    // { x, y, t } when visiting
    gkT: rc_rand(240, 420),
    tutorial: 0,
    closed: false,
  };
  // Starter restaurant so the heart loop is visible immediately.
  const put = (id, x, y, extra) => { s.tiles[rc_key(x, y)] = Object.assign({ itemId: id }, extra || {}); };
  const n = CFG.GRID_START, mid = Math.floor(n / 2);
  put('door_wood', mid, n - 1);
  put('stove_basic', 1, 1); put('stove_basic', 1, 2); put('counter', 2, 1);
  put('table_square', 4, 3); put('table_square', 5, 5);
  put('chair_wood', 4, 2); put('chair_wood', 4, 4); put('chair_wood', 3, 3); put('chair_wood', 5, 3);
  put('chair_wood', 5, 4); put('chair_wood', 5, 6); put('chair_wood', 4, 5); put('chair_wood', 6, 5);
  put('plant', 0, 0); put('painting', 0, 3);
  // Starter staff: you (chef) + one waiter.
  s.staff.push(rc_makeStaff(s, 'You', 'chef', true));
  s.staff.push(rc_makeStaff(s, 'Maya Rossi', 'waiter', false));
  // Starter dishes learned.
  DISHES.filter(d => d.learned).forEach(d => {
    s.dishes[d.id] = { learned: true, level: 1 };
    s.menu[d.cat].push(d.id);
  });
  ['tomato', 'cheese', 'flour', 'strawberry', 'apple', 'water', 'ice'].forEach(i => s.ingredients[i] = 3);
  return s;
}

function rc_makeStaff(s, name, role, isYou) {
  return {
    id: rc_uid(), name, role, isYou: !!isYou,
    energy: CFG.ENERGY_MAX, resting: false,
    x: 2, y: 3, tx: null, ty: null, path: [], pathi: 0,
    state: 'idle', stateT: 0, carry: null, // carry: { dishId, tx, ty, customerId }
    skin: rc_choice(STAFF_SKIN), hair: rc_choice(STAFF_HAIR),
    shirt: role === 'chef' ? '#f5f5f5' : role === 'waiter' ? '#2e4053' : '#4a7d4f',
    wage: 0,
  };
}

function rc_randomStaffName(s) {
  for (let i = 0; i < 50; i++) {
    const n = rc_choice(STAFF_FIRST) + ' ' + rc_choice(STAFF_LAST);
    if (!s.staff.some(st => st.name === n)) return n;
  }
  return rc_choice(STAFF_FIRST) + ' ' + rc_choice(STAFF_LAST) + ' ' + Math.floor(rc_rand(2, 99));
}

/* ---------------- queries ---------------- */

function rc_tileAt(s, x, y) { return s.tiles[rc_key(x, y)] || null; }
function rc_itemAt(s, x, y) { const t = rc_tileAt(s, x, y); return t ? itemById(t.itemId) : null; }

function rc_isBlocked(s, x, y) {
  if (x < 0 || y < 0 || x >= s.gridSize || y >= s.gridSize) return true;
  const it = rc_itemAt(s, x, y);
  return !!(it && it.blocksWalk);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function rc_findPath(s, sx, sy, tx, ty) {
  sx = Math.round(sx); sy = Math.round(sy);
  if (sx === tx && sy === ty) return [];
  if (rc_isBlocked(s, tx, ty)) {
    // try adjacent tiles of target
    let alt = null;
    for (const [dx, dy] of DIRS) {
      if (!rc_isBlocked(s, tx + dx, ty + dy)) { alt = [tx + dx, ty + dy]; break; }
    }
    if (!alt) return null;
    tx = alt[0]; ty = alt[1];
  }
  const key = rc_key, prev = {}, seen = {};
  const q = [[sx, sy]]; seen[key(sx, sy)] = true;
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === tx && cy === ty) {
      const path = []; let k = key(tx, ty);
      while (k !== key(sx, sy)) { const [px, py] = k.split(',').map(Number); path.unshift([px, py]); k = prev[k]; }
      return path;
    }
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
      if (!seen[k] && !rc_isBlocked(s, nx, ny)) { seen[k] = true; prev[k] = key(cx, cy); q.push([nx, ny]); }
    }
  }
  return null;
}

function rc_tables(s) {
  const out = [];
  for (const k in s.tiles) {
    const it = itemById(s.tiles[k].itemId);
    if (it && it.kind === 'table') {
      const [x, y] = k.split(',').map(Number);
      out.push({ x, y, item: it, tile: s.tiles[k] });
    }
  }
  return out;
}

function rc_chairsFor(s, tx, ty) {
  const out = [];
  for (const [dx, dy] of DIRS) {
    const t = rc_tileAt(s, tx + dx, ty + dy);
    if (t) {
      const it = itemById(t.itemId);
      if (it && it.kind === 'chair') out.push({ x: tx + dx, y: ty + dy, occupiedBy: t.occupiedBy || null });
    }
  }
  return out;
}

function rc_freeTable(s) {
  for (const t of rc_tables(s)) {
    if (t.tile.dirty) continue;
    if (t.tile.reservedBy) continue;
    const chairs = rc_chairsFor(s, t.x, t.y);
    const free = chairs.filter(c => !c.occupiedBy);
    if (free.length > 0 && chairs.length > 0) return { table: t, chair: free[0] };
  }
  return null;
}

function rc_energyTier(energy) {
  for (const t of CFG.ENERGY_TIERS) if (energy >= t.min) return t;
  return CFG.ENERGY_TIERS[CFG.ENERGY_TIERS.length - 1];
}
function rc_speedMult(st) { return st.resting || st.energy <= 0 ? 0 : CFG.STAFF_SPEED_MULT[rc_energyTier(st.energy).name]; }
function rc_working(s, role) {
  return s.staff.filter(st => (!role || st.role === role) && !st.resting && st.energy > 0);
}
function rc_staffSlots(s) {
  let slots = 2;
  const order = [2, 5, 8, 11, 14, 17, 21];
  order.forEach((lvl, i) => { if (s.level >= lvl) slots = i + 3; });
  return Math.min(slots, CFG.MAX_STAFF);
}
function rc_menuSlots(s) {
  if (s.level >= 20) return 3;
  if (s.level >= 10) return 2;
  return 1;
}
function rc_allDishes(s) {
  const month = s.themeOverride || (new Date().getMonth() + 1);
  return DISHES.concat(seasonalDishes(month));
}
function rc_dishDef(s, id) { return rc_allDishes(s).find(d => d.id === id); }
function rc_decorShop(s) {
  const month = s.themeOverride || (new Date().getMonth() + 1);
  return ITEMS.concat(seasonalDecor(month));
}

/* ---------------- actions ---------------- */

function rc_itemDefAny(id) {
  let def = itemById(id);
  if (def) return def;
  for (let m = 1; m <= 12; m++) {
    const d = seasonalDecor(m).find(d => d.id === id);
    if (d) return d;
  }
  return null;
}

function rc_canPlace(s, itemId, x, y) {
  const def = rc_itemDefAny(itemId);
  if (!def) return { ok: false, why: 'Unknown item' };
  if (x < 0 || y < 0 || x >= s.gridSize || y >= s.gridSize) return { ok: false, why: 'Outside the restaurant' };
  if (rc_tileAt(s, x, y)) return { ok: false, why: 'Tile is occupied' };
  if (def.edgeOnly && y !== s.gridSize - 1) return { ok: false, why: 'Doors go on the front (south) edge' };
  if (def.kind === 'walldecor' && !(y === 0 || x === 0)) return { ok: false, why: 'Wall decor goes on the back walls (north or west edge)' };
  if (def.needsTable) {
    let near = false;
    for (const [dx, dy] of DIRS) { const it = rc_itemAt(s, x + dx, y + dy); if (it && it.kind === 'table') near = true; }
    if (!near) return { ok: false, why: 'Chairs must be placed next to a table' };
  }
  if (def.unlock && s.level < def.unlock) return { ok: false, why: 'Unlocks at level ' + def.unlock };
  if (s.coins < def.cost) return { ok: false, why: 'Not enough coins' };
  return { ok: true, def };
}

function rc_placeItem(s, itemId, x, y) {
  const c = rc_canPlace(s, itemId, x, y);
  if (!c.ok) return c;
  s.coins -= c.def.cost;
  s.tiles[rc_key(x, y)] = { itemId };
  return { ok: true };
}

function rc_moveItem(s, fx, fy, tx, ty) {
  const t = rc_tileAt(s, fx, fy);
  if (!t) return { ok: false, why: 'Nothing there' };
  if (fx === tx && fy === ty) return { ok: true };
  const def = itemById(t.itemId);
  delete s.tiles[rc_key(fx, fy)];
  const c = rc_canPlace(s, t.itemId, tx, ty);
  // moving is free: temporarily refund the validity of cost/level checks
  if (!c.ok && c.why !== 'Not enough coins' && !(def.unlock && s.level < def.unlock)) {
    s.tiles[rc_key(fx, fy)] = t; return c;
  }
  if (tx < 0 || ty < 0 || tx >= s.gridSize || ty >= s.gridSize || rc_tileAt(s, tx, ty)) {
    s.tiles[rc_key(fx, fy)] = t; return { ok: false, why: 'Cannot move there' };
  }
  if (def.edgeOnly && ty !== s.gridSize - 1) { s.tiles[rc_key(fx, fy)] = t; return { ok: false, why: 'Doors go on the front edge' }; }
  if (def.kind === 'walldecor' && !(ty === 0 || tx === 0)) { s.tiles[rc_key(fx, fy)] = t; return { ok: false, why: 'Wall decor goes on the back walls' }; }
  if (def.needsTable) {
    let near = false;
    for (const [dx, dy] of DIRS) { const it = rc_itemAt(s, tx + dx, ty + dy); if (it && it.kind === 'table') near = true; }
    if (!near) { s.tiles[rc_key(fx, fy)] = t; return { ok: false, why: 'Chairs must be next to a table' }; }
  }
  s.tiles[rc_key(tx, ty)] = t;
  return { ok: true };
}

function rc_sellItem(s, x, y) {
  const t = rc_tileAt(s, x, y);
  if (!t) return { ok: false, why: 'Nothing there' };
  const def = itemById(t.itemId) || {};
  const refund = Math.floor((def.cost || 0) * CFG.SELLBACK_RATE);
  s.coins += refund;
  delete s.tiles[rc_key(x, y)];
  return { ok: true, refund };
}

function rc_setFloor(s, id) {
  const f = FLOORS.find(f => f.id === id);
  if (!f || s.floorId === id) return { ok: false };
  if (s.coins < f.cost) return { ok: false, why: 'Not enough coins' };
  s.coins -= f.cost; s.floorId = id;
  return { ok: true };
}
function rc_setWallpaper(s, id) {
  const w = WALLPAPERS.find(f => f.id === id);
  if (!w || s.wallId === id) return { ok: false };
  if (s.coins < w.cost) return { ok: false, why: 'Not enough coins' };
  s.coins -= w.cost; s.wallId = id;
  return { ok: true };
}

function rc_hireStaff(s) {
  if (s.staff.length >= rc_staffSlots(s)) return { ok: false, why: 'No free staff slot (level up for more)' };
  const cost = CFG.HIRE_COSTS[s.staff.length] || 20000;
  if (s.coins < cost) return { ok: false, why: 'Not enough coins' };
  s.coins -= cost;
  const st = rc_makeStaff(s, rc_randomStaffName(s), 'waiter', false);
  s.staff.push(st);
  return { ok: true, staff: st };
}
function rc_fireStaff(s, id) {
  const i = s.staff.findIndex(st => st.id === id);
  if (i < 0) return { ok: false };
  if (s.staff[i].isYou) return { ok: false, why: 'You cannot fire yourself' };
  const severance = 200;
  if (s.coins < severance) return { ok: false, why: 'Severance pay is 200 coins' };
  s.coins -= severance;
  s.staff.splice(i, 1);
  return { ok: true };
}
function rc_setRole(s, id, role) {
  const st = s.staff.find(st => st.id === id);
  if (!st) return;
  st.role = role;
  st.shirt = role === 'chef' ? '#f5f5f5' : role === 'waiter' ? '#2e4053' : '#4a7d4f';
  st.state = 'idle'; st.carry = null; st.tx = null;
}
function rc_feedStaff(s, id, snackId) {
  const st = s.staff.find(st => st.id === id);
  const snack = CFG.SNACKS.find(x => x.id === snackId);
  if (!st || !snack) return { ok: false };
  if (s.coins < snack.cost) return { ok: false, why: 'Not enough coins' };
  s.coins -= snack.cost;
  st.energy = Math.min(CFG.ENERGY_MAX, st.energy + snack.restore);
  return { ok: true };
}

/* Dishes */
function rc_canLearn(s, dishId) {
  const def = rc_dishDef(s, dishId);
  if (!def || (s.dishes[dishId] && s.dishes[dishId].learned)) return false;
  if (def.unlock && s.level < def.unlock) return false;
  if (def.cat === 'drink' && s.level < CFG.DRINKS_UNLOCK_LEVEL && !def.seasonal) return false;
  const need = {};
  def.ingredients.forEach(i => need[i] = (need[i] || 0) + 1);
  return Object.keys(need).every(i => (s.ingredients[i] || 0) >= need[i]);
}
function rc_learnDish(s, dishId) {
  if (!rc_canLearn(s, dishId)) return { ok: false, why: 'Missing ingredients' };
  const def = rc_dishDef(s, dishId);
  def.ingredients.forEach(i => s.ingredients[i]--);
  s.dishes[dishId] = { learned: true, level: 1 };
  rc_addGP(s, CFG.DISH_LEVELUP_GP[1]);
  return { ok: true };
}
function rc_canLevelDish(s, dishId) {
  const d = s.dishes[dishId];
  const def = rc_dishDef(s, dishId);
  if (!d || !d.learned || d.level >= 10) return false;
  const need = {};
  def.ingredients.forEach(i => need[i] = (need[i] || 0) + 1);
  return Object.keys(need).every(i => (s.ingredients[i] || 0) >= need[i]);
}
function rc_levelUpDish(s, dishId) {
  if (!rc_canLevelDish(s, dishId)) return { ok: false, why: 'Missing ingredients' };
  const def = rc_dishDef(s, dishId);
  def.ingredients.forEach(i => s.ingredients[i]--);
  s.dishes[dishId].level++;
  rc_addGP(s, CFG.DISH_LEVELUP_GP[s.dishes[dishId].level]);
  return { ok: true, level: s.dishes[dishId].level };
}
function rc_toggleMenuDish(s, dishId) {
  const def = rc_dishDef(s, dishId);
  if (!def || !(s.dishes[dishId] && s.dishes[dishId].learned)) return;
  const arr = s.menu[def.cat];
  const i = arr.indexOf(dishId);
  if (i >= 0) { if (arr.length > 1) arr.splice(i, 1); }
  else if (arr.length < rc_menuSlots(s)) arr.push(dishId);
}

/* Market / garden / gourmet king */
function rc_marketCost(ingId) { return 50 * (INGREDIENTS[ingId] ? INGREDIENTS[ingId].star : 1); }
function rc_buyIngredient(s, ingId) {
  const cost = rc_marketCost(ingId);
  if (s.coins < cost) return { ok: false, why: 'Not enough coins' };
  if (!s.market.offers.includes(ingId)) return { ok: false };
  s.coins -= cost;
  s.ingredients[ingId] = (s.ingredients[ingId] || 0) + 1;
  s.market.offers = s.market.offers.filter(o => o !== ingId);
  return { ok: true };
}
function rc_refreshMarket(s, force) {
  const today = new Date().toDateString();
  if (!force && s.market.day === today && s.market.offers.length) return;
  s.market.day = today;
  const keys = Object.keys(INGREDIENTS);
  s.market.offers = [];
  while (s.market.offers.length < 3) {
    const k = rc_choice(keys);
    if (!s.market.offers.includes(k)) s.market.offers.push(k);
  }
}
function rc_plantGarden(s, x, y) {
  const t = rc_tileAt(s, x, y);
  if (!t || itemById(t.itemId).id !== 'garden_plot') return { ok: false };
  const k = rc_key(x, y);
  if (s.garden[k] && !s.garden[k].grown) return { ok: false, why: 'Already growing' };
  if (s.coins < 2000) return { ok: false, why: 'Seeds cost 2,000 coins' };
  s.coins -= 2000;
  s.garden[k] = { t: 0, need: 360, water: 0, grown: false }; // ~6 min, watering speeds up
  return { ok: true };
}
function rc_waterGarden(s, x, y) {
  const g = s.garden[rc_key(x, y)];
  if (!g || g.grown || g.water >= 3) return { ok: false };
  g.water++; g.t += 60;
  return { ok: true };
}
function rc_harvestGarden(s, x, y) {
  const k = rc_key(x, y);
  const g = s.garden[k];
  if (!g || !g.grown) return { ok: false };
  const keys = Object.keys(INGREDIENTS);
  for (let i = 0; i < 3; i++) { const ing = rc_choice(keys); s.ingredients[ing] = (s.ingredients[ing] || 0) + 1; }
  delete s.garden[k];
  return { ok: true };
}
function rc_claimGourmetKing(s) {
  if (!s.gourmetKing) return { ok: false };
  const roll = Math.random();
  let msg;
  if (roll < 0.5) { const ing = rc_choice(Object.keys(INGREDIENTS)); s.ingredients[ing] = (s.ingredients[ing] || 0) + 2; msg = '+2 ' + INGREDIENTS[ing].name; }
  else if (roll < 0.8) { s.coins += 500; msg = '+500 coins'; }
  else { s.coins += 1500; msg = '+1,500 coins'; }
  s.gourmetKing = null;
  return { ok: true, msg };
}

/* ---------------- economy ---------------- */

function rc_addGP(s, n) {
  s.gp += n;
  // level ups
  for (const L of LEVELS) {
    if (L.lvl > s.level && s.gp >= L.gp) {
      s.level = L.lvl;
      s.coins += L.coins;
      if (L.expand) { s.gridSize = Math.min(CFG.GRID_MAX, s.gridSize + L.expand); }
      s.staff.forEach(st => st.energy = CFG.ENERGY_MAX); // level-up refreshes energy, like the original
      rc_toast(s, 'Level ' + L.lvl + '! +' + L.coins.toLocaleString() + ' coins' +
        (L.expand ? ', restaurant expanded' : '') + (L.staff ? ', staff slot unlocked' : '') +
        (L.menuSlots ? ', +' + ' menu slot per category' : '') + (L.drinks ? ', drinks unlocked' : '') +
        (L.garden ? ', garden plots unlocked' : ''));
    }
  }
}
function rc_toast(s, msg) {
  s._toasts = s._toasts || [];
  s._toasts.push({ id: rc_uid(), msg, t: 0 });
}
function rc_servePlate(s, dishId) {
  const d = s.dishes[dishId];
  const lvl = d ? d.level : 1;
  const gp = CFG.GP_PER_LEVEL[lvl];
  s.coins += CFG.COINS_PER_PLATE;
  s.stats.earned += CFG.COINS_PER_PLATE;
  rc_addGP(s, gp);
  s.popularity = rc_clamp(s.popularity + 0.01, 0, CFG.MAX_POPULARITY);
}
function rc_angryCustomer(s) {
  s.stats.angry++;
  s.popularity = rc_clamp(s.popularity - 0.01, 0, CFG.MAX_POPULARITY);
}

/* ---------------- per-frame update ---------------- */

function rc_update(s, dt) {
  // energy drain / rest
  let anyWorking = false;
  for (const st of s.staff) {
    if (st.resting) {
      st.energy = Math.min(CFG.ENERGY_MAX, st.energy + CFG.ENERGY_DRAIN_PER_SEC * CFG.ENERGY_REST_MULT * dt);
      if (st.energy >= CFG.ENERGY_MAX) { st.resting = false; st.energy = CFG.ENERGY_MAX; }
    } else if (st.energy > 0 && (st.role === 'chef' || st.role === 'waiter' || st.role === 'janitor')) {
      st.energy = Math.max(0, st.energy - CFG.ENERGY_DRAIN_PER_SEC * dt);
      if (st.energy <= 0) { st.resting = true; st.state = 'idle'; st.carry = null; rc_toast(s, st.name + ' collapsed from exhaustion! Let them rest.'); }
      else anyWorking = true;
    }
  }
  s.closed = !anyWorking && s.staff.length > 0;

  // customer spawning
  s.spawnT -= dt;
  if (s.spawnT <= 0) {
    s.spawnT = rc_rand(CFG.CUSTOMER_SPAWN_MIN_SECS, CFG.CUSTOMER_SPAWN_BASE_SECS) * rc_clamp(30 / Math.max(s.popularity, 5), 0.5, 2);
    rc_trySpawnCustomer(s);
  }
  // trash
  s.trashT -= dt;
  if (s.trashT <= 0) {
    s.trashT = CFG.TRASH_SPAWN_SECS;
    if (s.trash.length < CFG.MAX_TRASH) {
      s.trash.push({ id: rc_uid(), x: Math.floor(rc_rand(0, s.gridSize)), y: Math.floor(rc_rand(0, s.gridSize)) });
    }
  }
  // gourmet king visits
  s.gkT -= dt;
  if (s.gkT <= 0 && !s.gourmetKing) {
    s.gkT = rc_rand(300, 600);
    const doors = rc_doorTiles(s);
    if (doors.length) {
      const d = rc_choice(doors);
      s.gourmetKing = { x: d.x, y: Math.max(0, d.y - 1), t: 90 };
      rc_toast(s, 'The Gourmet King is visiting! Click him for a gift.');
    }
  }
  if (s.gourmetKing) { s.gourmetKing.t -= dt; if (s.gourmetKing.t <= 0) s.gourmetKing = null; }
  // garden growth
  for (const k in s.garden) {
    const g = s.garden[k];
    if (!g.grown) { g.t += dt; if (g.t >= g.need) { g.grown = true; rc_toast(s, 'Your garden is ready to harvest!'); } }
  }

  rc_updateStaff(s, dt);
  rc_updateCustomers(s, dt);

  // toasts age
  if (s._toasts) for (const t of s._toasts) t.t += dt;
}

function rc_doorTiles(s) {
  const out = [];
  for (const k in s.tiles) {
    const it = itemById(s.tiles[k].itemId);
    if (it && it.kind === 'door') { const [x, y] = k.split(',').map(Number); out.push({ x, y }); }
  }
  return out;
}

function rc_trySpawnCustomer(s) {
  if (s.closed) return;
  const doors = rc_doorTiles(s);
  if (!doors.length) return;
  if (!rc_working(s, 'waiter').length) return;
  if (!rc_freeTable(s)) {
    // no free table: would-be customer may still come play the arcade
    const arcades = [];
    for (const k in s.tiles) { const it = itemById(s.tiles[k].itemId); if (it && it.kind === 'arcade') { const [x, y] = k.split(',').map(Number); arcades.push({ x, y, tile: s.tiles[k] }); } }
    const a = arcades.find(a => !a.tile.broken && !a.tile.inUse);
    if (a && Math.random() < 0.5) {
      const d = rc_choice(doors);
      const c = rc_makeCustomer(s, d.x, Math.max(0, d.y - 1));
      c.state = 'toArcade'; c.arcade = a; a.tile.inUse = c.id;
      c.path = rc_findPath(s, c.x, c.y, a.x, a.y) || [];
      s.customers.push(c);
    }
    return;
  }
  const d = rc_choice(doors);
  const c = rc_makeCustomer(s, d.x, Math.max(0, d.y - 1));
  s.customers.push(c);
}

function rc_makeCustomer(s, x, y) {
  return {
    id: rc_uid(), x, y, path: [], pathi: 0,
    state: 'arriving', stateT: 0,
    table: null, chair: null, dishId: null,
    patience: CFG.CUSTOMER_PATIENCE_SECS, mood: 'ok',
    eatT: 0, paid: false,
    skin: rc_choice(STAFF_SKIN), hair: rc_choice(STAFF_HAIR),
    shirt: rc_choice(['#d94f6c', '#3f6fbf', '#3fae5a', '#e07b39', '#7d3fa0', '#2fa3a0', '#c9a227']),
    thought: null, thoughtT: 0,
  };
}

function rc_moveAlong(c, dt) {
  if (c.pathi >= c.path.length) return true;
  const [tx, ty] = c.path[c.pathi];
  const dx = tx - c.x, dy = ty - c.y;
  const dist = Math.hypot(dx, dy);
  const step = CFG.CUSTOMER_WALK_SPEED * dt;
  if (dist <= step) { c.x = tx; c.y = ty; c.pathi++; }
  else { c.x += dx / dist * step; c.y += dy / dist * step; }
  return c.pathi >= c.path.length;
}

function rc_setThought(c, txt, dur) { c.thought = txt; c.thoughtT = dur || 2.5; }

function rc_customerLeaveAngry(s, c, why) {
  rc_angryCustomer(s);
  rc_setThought(c, '!', 2);
  c.state = 'leavingAngry'; c.stateT = 0;
  if (c.table) { const t = rc_tileAt(s, c.table.x, c.table.y); if (t) t.reservedBy = null; }
  if (c.chair) { const t = rc_tileAt(s, c.chair.x, c.chair.y); if (t) t.occupiedBy = null; }
  const doors = rc_doorTiles(s);
  if (doors.length) { const d = rc_choice(doors); c.path = rc_findPath(s, c.x, c.y, d.x, Math.max(0, d.y - 1)) || []; c.pathi = 0; }
  else c.state = 'gone';
  void why;
}

function rc_updateCustomers(s, dt) {
  const jukebox = Object.keys(s.tiles).some(k => itemById(s.tiles[k].itemId).kind === 'jukebox');
  const patienceMult = jukebox ? 1.35 : 1;
  for (const c of s.customers) {
    if (c.thoughtT > 0) { c.thoughtT -= dt; if (c.thoughtT <= 0) c.thought = null; }
    switch (c.state) {
      case 'arriving': {
        const spot = rc_freeTable(s);
        if (!spot) { rc_customerLeaveAngry(s, c, 'no table'); break; }
        const t = rc_tileAt(s, spot.table.x, spot.table.y);
        t.reservedBy = c.id;
        const ch = rc_tileAt(s, spot.chair.x, spot.chair.y);
        ch.occupiedBy = c.id;
        c.table = { x: spot.table.x, y: spot.table.y };
        c.chair = { x: spot.chair.x, y: spot.chair.y };
        c.path = rc_findPath(s, c.x, c.y, spot.chair.x, spot.chair.y) || [];
        c.pathi = 0; c.state = 'toTable';
        break;
      }
      case 'toTable':
        if (rc_moveAlong(c, dt)) { c.state = 'waitingOrder'; c.stateT = 0; rc_setThought(c, '?', 3); }
        break;
      case 'waitingOrder': case 'waitingFood': {
        c.patience -= dt / patienceMult;
        if (c.patience <= 0) { rc_customerLeaveAngry(s, c, 'wait'); break; }
        if (c.patience < 25 && !c.warned) { c.warned = true; rc_setThought(c, '!', 4); }
        break;
      }
      case 'eating':
        c.eatT -= dt;
        if (Math.random() < dt * 0.05 && s.level >= CFG.TOILETS_UNLOCK_LEVEL && !c.toiletDone) {
          c.toiletDone = true;
          const toilets = [];
          for (const k in s.tiles) {
            const it = itemById(s.tiles[k].itemId);
            if (it && it.kind === 'toilet') { const [x, y] = k.split(',').map(Number); toilets.push({ x, y, tile: s.tiles[k] }); }
          }
          const clean = toilets.find(t => !t.tile.dirty);
          if (toilets.length && !clean) { rc_customerLeaveAngry(s, c, 'toilet'); break; }
          if (clean) {
            c.state = 'toToilet';
            c.path = rc_findPath(s, c.x, c.y, clean.x, clean.y) || []; c.pathi = 0;
            c.toilet = clean; c.stateT = 6;
            break;
          }
        }
        if (c.eatT <= 0) {
          // pay up
          let tip = 0;
          if (c.servedFast) { tip = CFG.TIP_COINS; rc_setThought(c, '$', 2); }
          s.coins += tip;
          rc_servePlate(s, c.dishId);
          s.stats.served++;
          const t = rc_tileAt(s, c.table.x, c.table.y);
          if (t) { t.reservedBy = null; t.dirty = true; }
          const ch = rc_tileAt(s, c.chair.x, c.chair.y);
          if (ch) ch.occupiedBy = null;
          const doors = rc_doorTiles(s);
          if (doors.length) { const d = rc_choice(doors); c.path = rc_findPath(s, c.x, c.y, d.x, Math.max(0, d.y - 1)) || []; c.pathi = 0; }
          c.state = 'leaving'; c.table = null; c.chair = null;
        }
        break;
      case 'toToilet':
        if (rc_moveAlong(c, dt)) {
          c.stateT -= dt;
          if (c.stateT <= 0) {
            const tl = c.toilet;
            tl.tile.uses = (tl.tile.uses || 0) + 1;
            if (tl.tile.uses >= CFG.TOILET_USES_BEFORE_DIRTY) { tl.tile.dirty = true; tl.tile.uses = 0; }
            c.state = 'eating';
          }
        }
        break;
      case 'toArcade': {
        const a = c.arcade;
        if (!a || a.tile.broken || a.tile.inUse !== c.id) { c.state = 'gone'; break; }
        if (rc_moveAlong(c, dt)) {
          c.state = 'playingArcade'; c.stateT = rc_rand(6, 12);
        }
        break;
      }
      case 'playingArcade':
        c.stateT -= dt;
        if (Math.random() < dt * 0.5) { s.coins += CFG.ARCADE_COIN_PER_PLAY; s.stats.earned += CFG.ARCADE_COIN_PER_PLAY; }
        if (c.stateT <= 0) {
          const a = c.arcade;
          a.tile.uses = (a.tile.uses || 0) + 1;
          a.tile.inUse = null;
          if (a.tile.uses >= CFG.ARCADE_USES_BEFORE_BREAK) { a.tile.broken = true; rc_toast(s, 'An arcade machine broke! A janitor can repair it.'); }
          // try for a table again
          const spot = rc_freeTable(s);
          if (spot) { c.state = 'arriving'; }
          else { const doors = rc_doorTiles(s); if (doors.length) { const d = rc_choice(doors); c.path = rc_findPath(s, c.x, c.y, d.x, Math.max(0, d.y - 1)) || []; c.pathi = 0; } c.state = 'leaving'; }
        }
        break;
      case 'leaving': case 'leavingAngry':
        if (rc_moveAlong(c, dt)) c.state = 'gone';
        break;
    }
  }
  s.customers = s.customers.filter(c => c.state !== 'gone');
}

/* ---- staff AI ---- */

function rc_updateStaff(s, dt) {
  for (const st of s.staff) {
    if (st.resting || st.energy <= 0) { st.state = 'resting'; continue; }
    const mult = rc_speedMult(st);
    if (st.role === 'chef') rc_chefAI(s, st, dt, mult);
    else if (st.role === 'waiter') rc_waiterAI(s, st, dt, mult);
    else if (st.role === 'janitor') rc_janitorAI(s, st, dt, mult);
    else st.state = 'idle';
  }
}

/* rc_gotoDt (below) is the staff movement helper. */

function rc_chefAI(s, st, dt, mult) {
  // find a stove to work at (drop stale refs if the stove was sold/moved)
  if (st.stove) {
    const t = rc_tileAt(s, st.stove.x, st.stove.y);
    const it = t ? itemById(t.itemId) : null;
    if (!it || it.kind !== 'stove') { st.stove = null; st.cooking = null; }
  }
  if (!st.stove) {
    for (const k in s.tiles) {
      const it = itemById(s.tiles[k].itemId);
      if (it && it.kind === 'stove' && !s.tiles[k].chefId) {
        const [x, y] = k.split(',').map(Number);
        st.stove = { x, y }; s.tiles[k].chefId = st.id;
        break;
      }
    }
  }
  if (!st.stove) { st.state = 'idle'; return; }
  // walk to stove
  if (!rc_gotoDt(s, st, st.stove.x, st.stove.y, dt)) { st.state = 'walking'; return; }
  st.state = 'idle';
  // cook next order
  const order = s.cookQueue[0];
  if (order && !order.chefId) {
    order.chefId = st.id;
    st.cooking = order;
  }
  if (st.cooking) {
    const o = st.cooking;
    st.state = 'cooking';
    o.progress = (o.progress || 0) + dt * mult;
    if (o.progress >= CFG.DISH_COOK_SECS) {
      // done: to counter (or stove-side pickup if no counter)
      s.cookQueue = s.cookQueue.filter(q => q.id !== o.id);
      s.readyDishes.push({ id: rc_uid(), dishId: o.dishId, tx: o.tx, ty: o.ty, customerId: o.customerId, t: 0 });
      st.cooking = null;
      st.state = 'idle';
    }
  }
}

function rc_waiterAI(s, st, dt, mult) {
  // 1. carrying a dish -> deliver
  if (st.carry) {
    if (rc_gotoDt(s, st, st.carry.tx, st.carry.ty, dt)) {
      const c = s.customers.find(c => c.id === st.carry.customerId);
      if (c && (c.state === 'waitingFood')) {
        c.dishId = st.carry.dishId;
        c.state = 'eating';
        c.eatT = CFG.CUSTOMER_EAT_SECS;
        c.servedFast = (CFG.CUSTOMER_PATIENCE_SECS - c.patience) < CFG.TIP_FAST_SECS;
        rc_setThought(c, '$', 1.5);
      }
      st.carry = null; st.state = 'idle';
    } else st.state = 'walking';
    return;
  }
  // 2. pick up ready dish for a waiting customer
  const rd = s.readyDishes.find(r => s.customers.some(c => c.id === r.customerId && c.state === 'waitingFood'));
  if (rd) {
    const counters = rc_counterTiles(s);
    const px = counters.length ? counters[0] : { x: Math.round(st.x), y: Math.round(st.y) };
    if (rc_gotoDt(s, st, px.x, px.y, dt)) {
      s.readyDishes = s.readyDishes.filter(r => r.id !== rd.id);
      st.carry = rd; st.state = 'walking';
    } else st.state = 'walking';
    return;
  }
  // 3. take order from seated customer
  const cust = s.customers.find(c => c.state === 'waitingOrder');
  if (cust && cust.table) {
    if (rc_gotoDt(s, st, cust.table.x, cust.table.y, dt)) {
      const menuDish = rc_choice(s.menu[cust.dishCat || 'main'].length ? s.menu[cust.dishCat || 'main'] : s.menu.main);
      const dishId = menuDish || s.menu.main[0];
      if (dishId) {
        const def = rc_dishDef(s, dishId);
        cust.dishCat = def.cat;
        s.cookQueue.push({ id: rc_uid(), dishId, tx: cust.table.x, ty: cust.table.y, customerId: cust.id, progress: 0 });
        cust.state = 'waitingFood';
        rc_setThought(cust, null, 0.01);
      }
      st.state = 'idle';
    } else st.state = 'walking';
    return;
  }
  // 4. clear dirty tables
  const dirty = rc_tables(s).find(t => t.tile.dirty);
  if (dirty) {
    if (rc_gotoDt(s, st, dirty.x, dirty.y, dt)) {
      dirty.tile.dirty = false;
      st.state = 'idle';
    } else st.state = 'walking';
    return;
  }
  // 5. idle: wander near door
  st.state = 'idle';
  if (Math.random() < dt * 0.1) {
    const doors = rc_doorTiles(s);
    if (doors.length) {
      const d = rc_choice(doors);
      const nx = rc_clamp(d.x + Math.floor(rc_rand(-2, 2)), 0, s.gridSize - 1);
      const ny = rc_clamp(d.y - 1 + Math.floor(rc_rand(-2, 0)), 0, s.gridSize - 1);
      if (!rc_isBlocked(s, nx, ny)) { st.path = rc_findPath(s, st.x, st.y, nx, ny) || []; st.pathi = 0; st.tx = nx; st.ty = ny; }
    }
  }
  if (st.tx != null && st.pathi < st.path.length) rc_moveAlong(st, dt);
}

function rc_janitorAI(s, st, dt, mult) {
  // 1. clean dirty toilets
  for (const k in s.tiles) {
    const it = itemById(s.tiles[k].itemId);
    if (it && it.kind === 'toilet' && s.tiles[k].dirty) {
      const [x, y] = k.split(',').map(Number);
      if (rc_gotoDt(s, st, x, y, dt)) { s.tiles[k].dirty = false; }
      else st.state = 'walking';
      return;
    }
  }
  // 2. repair arcade
  for (const k in s.tiles) {
    const it = itemById(s.tiles[k].itemId);
    if (it && it.kind === 'arcade' && s.tiles[k].broken) {
      const [x, y] = k.split(',').map(Number);
      if (rc_gotoDt(s, st, x, y, dt)) { s.tiles[k].broken = false; s.tiles[k].uses = 0; rc_toast(s, 'Arcade machine repaired!'); }
      else st.state = 'walking';
      return;
    }
  }
  // 3. pick up trash
  const tr = s.trash[0];
  if (tr) {
    if (rc_gotoDt(s, st, tr.x, tr.y, dt)) { s.trash.shift(); s.coins += 1; }
    else st.state = 'walking';
    return;
  }
  st.state = 'idle';
}

function rc_counterTiles(s) {
  const out = [];
  for (const k in s.tiles) {
    const it = itemById(s.tiles[k].itemId);
    if (it && it.kind === 'counter') { const [x, y] = k.split(',').map(Number); out.push({ x, y }); }
  }
  return out;
}

// goto with explicit dt (staff move slightly slower than customers)
function rc_gotoDt(s, st, x, y, dt) {
  if (st.tx !== x || st.ty !== y || st.pathi >= st.path.length) {
    if (st.tx !== x || st.ty !== y) {
      st.path = rc_findPath(s, st.x, st.y, x, y) || [];
      st.pathi = 0; st.tx = x; st.ty = y;
    } else return true;
  }
  if (!st.path.length) return Math.round(st.x) === x && Math.round(st.y) === y;
  const [tx, ty] = st.path[st.pathi];
  const dx = tx - st.x, dy = ty - st.y;
  const dist = Math.hypot(dx, dy);
  const step = CFG.CUSTOMER_WALK_SPEED * 0.9 * dt;
  if (dist <= step) { st.x = tx; st.y = ty; st.pathi++; }
  else { st.x += dx / dist * step; st.y += dy / dist * step; }
  return st.pathi >= st.path.length;
}
/* ---------------- save / load ---------------- */

function rc_serialize(s) {
  const c = Object.assign({}, s);
  delete c._toasts;
  c.customers.forEach(c => { c.path = []; c.pathi = 0; });
  c.staff.forEach(st => { st.path = []; st.pathi = 0; st.tx = null; st.ty = null; st.cooking = null; st.stove = null; });
  for (const k in c.tiles) { delete c.tiles[k].chefId; delete c.tiles[k].inUse; }
  return JSON.stringify(c);
}
function rc_deserialize(json) {
  const s = JSON.parse(json);
  s._toasts = [];
  return s;
}

/* Offline earnings: grant a modest catch-up for time away (capped). */
function rc_applyOffline(s) {
  const elapsedMin = Math.min((Date.now() - (s.lastSeen || Date.now())) / 60000, CFG.OFFLINE_CAP_HOURS * 60);
  if (elapsedMin < 2) return null;
  const tables = rc_tables(s).length;
  const staff = rc_working(s).length;
  if (!tables || !staff || s.closed) return null;
  const plates = Math.floor(elapsedMin * tables * 0.12 * Math.min(staff / 3, 1));
  if (plates <= 0) return null;
  const coins = plates * CFG.COINS_PER_PLATE;
  const gp = plates * 1.4;
  s.coins += coins;
  rc_addGP(s, gp);
  s.stats.served += plates;
  s.stats.earned += coins;
  return { plates, coins: Math.round(coins) };
}

/* Daily login streak + market refresh. */
function rc_dailyCheck(s) {
  const today = new Date().toDateString();
  if (s.streak.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.streak.count = (s.streak.lastDay === yesterday) ? s.streak.count + 1 : 1;
    s.streak.lastDay = today;
    const n = s.streak.count >= 3 ? 3 : s.streak.count;
    const keys = Object.keys(INGREDIENTS);
    const got = [];
    for (let i = 0; i < n; i++) { const ing = rc_choice(keys); s.ingredients[ing] = (s.ingredients[ing] || 0) + 1; got.push(INGREDIENTS[ing].name); }
    rc_toast(s, 'Day ' + s.streak.count + ' login streak! Got: ' + got.join(', '));
  }
  rc_refreshMarket(s);
}
