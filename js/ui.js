/* Restaurant City rebuild - UI: toolbar, panels, canvas interaction, toasts. */

function rc_initUI(s, view, canvas) {
  const $ = id => document.getElementById(id);

  // ---- toolbar buttons ----
  const tabs = ['design', 'staff', 'menu', 'market', 'theme', 'help'];
  tabs.forEach(tab => {
    $('tab-' + tab).addEventListener('click', () => rc_showPanel(s, tab));
  });
  $('btn-settings').addEventListener('click', () => rc_showPanel(s, 'settings'));
  $('btn-sound').addEventListener('click', () => {
    s.sound = !s.sound;
    $('btn-sound').textContent = s.sound === false ? 'Sound: off' : 'Sound: on';
  });
  if (s.sound === false) $('btn-sound').textContent = 'Sound: off';

  rc_buildDesignPanel(s, view);
  rc_showPanel(s, 'design');

  // ---- canvas mouse ----
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (RCV.W / r.width), (e.clientY - r.top) * (RCV.H / r.height)];
  };
  canvas.addEventListener('mousemove', e => {
    const [mx, my] = pos(e);
    const [tx, ty] = rc_screenToTile(mx, my, s.gridSize);
    view.hover = { x: tx, y: ty };
  });
  canvas.addEventListener('mouseleave', () => { view.hover = null; });
  canvas.addEventListener('click', e => {
    const [mx, my] = pos(e);
    const [tx, ty] = rc_screenToTile(mx, my, s.gridSize);
    rc_canvasClick(s, view, tx, ty, mx, my);
  });

  // ---- tutorial ----
  if (!s.tutorial) {
    setTimeout(() => rc_toast(s, 'Welcome to your restaurant! Customers arrive at the door when you have a free table and a waiter on duty.'), 800);
    setTimeout(() => rc_toast(s, 'Your chef cooks, your waiter serves, all automatically. Use the Design tab to expand, the Staff tab to manage your crew.'), 6000);
    setTimeout(() => rc_toast(s, 'Learn new dishes in the Menu tab with ingredients from the Market, your garden, daily logins, and the Gourmet King.'), 12000);
    s.tutorial = 1;
  }
}

function rc_showPanel(s, tab) {
  ['design', 'staff', 'menu', 'market', 'theme', 'help', 'settings'].forEach(t => {
    const el = document.getElementById('panel-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
    const b = document.getElementById('tab-' + t);
    if (b) b.classList.toggle('active', t === tab);
  });
  if (tab === 'staff') rc_buildStaffPanel(s);
  if (tab === 'menu') rc_buildMenuPanel(s);
  if (tab === 'market') rc_buildMarketPanel(s);
  if (tab === 'theme') rc_buildThemePanel(s);
  if (tab === 'settings') rc_buildSettingsPanel(s);
  if (tab === 'design') { view_tool(s, 'design'); }
}

function view_tool(s, tool) {
  window.__rcView.tool = tool === 'design' ? null : window.__rcView.tool;
}

/* ---------------- canvas clicks ---------------- */
function rc_canvasClick(s, view, tx, ty, mx, my) {
  // gourmet king?
  if (s.gourmetKing) {
    const [kx, ky] = rc_iso(s.gourmetKing.x, s.gourmetKing.y, s.gridSize);
    if (Math.hypot(mx - kx, my - (ky - 20)) < 40) {
      const r = rc_claimGourmetKing(s);
      if (r.ok) { rc_toast(s, 'The Gourmet King gifts you ' + r.msg + '!'); rc_sfx('coin'); }
      return;
    }
  }
  if (tx < 0 || ty < 0 || tx >= s.gridSize || ty >= s.gridSize) return;
  const t = rc_tileAt(s, tx, ty);

  // trash pickup
  const tr = s.trash.find(tr => tr.x === tx && tr.y === ty);
  if (tr) { s.trash = s.trash.filter(x => x.id !== tr.id); s.coins += 1; rc_sfx('pop'); return; }

  // garden interactions
  if (t && itemById(t.itemId).kind === 'garden') {
    const g = s.garden[rc_key(tx, ty)];
    if (g && g.grown) { const r = rc_harvestGarden(s, tx, ty); if (r.ok) { rc_toast(s, 'Harvested 3 ingredients!'); rc_sfx('coin'); } }
    else if (g) { const r = rc_waterGarden(s, tx, ty); if (r.ok) rc_toast(s, 'Watered (+1h growth)'); else rc_toast(s, 'Already watered enough'); }
    else { const r = rc_plantGarden(s, tx, ty); if (r.ok) rc_toast(s, 'Planted mystery seeds (2,000 coins)'); else rc_toast(s, r.why || 'Cannot plant'); }
    return;
  }

  // design tools
  if (view.tool === 'sell') {
    if (t) {
      const r = rc_sellItem(s, tx, ty);
      if (r.ok) { rc_toast(s, 'Sold for ' + r.refund + ' coins'); rc_sfx('coin'); }
    }
    return;
  }
  if (view.tool === 'move') {
    if (view.moving && (view.moving.x !== tx || view.moving.y !== ty)) {
      const r = rc_moveItem(s, view.moving.x, view.moving.y, tx, ty);
      rc_toast(s, r.ok ? 'Moved' : r.why);
      view.moving = null;
    } else if (t) {
      view.moving = { x: tx, y: ty };
      rc_toast(s, 'Picked up ' + (rc_itemDefAny(t.itemId).name || 'item') + '. Click a tile to drop it.');
    }
    return;
  }
  if (view.ghostItem) {
    const r = rc_placeItem(s, view.ghostItem, tx, ty);
    if (!r.ok) rc_toast(s, r.why);
    else { rc_sfx('place'); if (!view.stickyPlace) { view.ghostItem = null; rc_refreshDesignGhost(); } }
    return;
  }
  // default: select / contextual actions
  if (t) {
    const def = rc_itemDefAny(t.itemId);
    view.selected = { x: tx, y: ty };
    if (def.kind === 'arcade' && t.broken) {
      t.broken = false; t.uses = 0;
      rc_toast(s, 'You repaired the arcade machine yourself.');
    } else if (def.kind === 'toilet' && t.dirty) {
      t.dirty = false;
      rc_toast(s, 'You cleaned the toilet yourself. Your janitor thanks you.');
    } else {
      rc_toast(s, def.name + (def.desc ? ' - ' + def.desc : ''));
    }
  } else {
    view.selected = null;
  }
}

/* ---------------- design panel ---------------- */
const RC_DESIGN_CATS = [
  { id: 'tables', name: 'Tables', kinds: ['table'] },
  { id: 'chairs', name: 'Chairs', kinds: ['chair'] },
  { id: 'doors', name: 'Doors', kinds: ['door'] },
  { id: 'kitchen', name: 'Kitchen', kinds: ['stove', 'counter', 'sink', 'garden'] },
  { id: 'restroom', name: 'Restroom', kinds: ['toilet'] },
  { id: 'fun', name: 'Fun', kinds: ['arcade', 'jukebox'] },
  { id: 'decor', name: 'Decor', kinds: ['decor', 'divider', 'rug'] },
  { id: 'walls', name: 'Wall Decor', kinds: ['walldecor'] },
  { id: 'seasonal', name: 'Seasonal', kinds: ['__seasonal'] },
  { id: 'floors', name: 'Floors', kinds: ['__floor'] },
  { id: 'wallpaper', name: 'Walls', kinds: ['__wall'] },
];

function rc_buildDesignPanel(s, view) {
  const catBar = document.getElementById('design-cats');
  const grid = document.getElementById('design-items');
  const tools = document.getElementById('design-tools');
  tools.innerHTML = '';
  const mkBtn = (label, fn, active) => {
    const b = document.createElement('button');
    b.textContent = label; b.className = 'toolbtn' + (active ? ' active' : '');
    b.addEventListener('click', fn);
    tools.appendChild(b);
    return b;
  };
  window.__rcToolBtns = {};
  window.__rcToolBtns.move = mkBtn('Move', () => rc_setTool(s, 'move'));
  window.__rcToolBtns.sell = mkBtn('Sell (1/3 back)', () => rc_setTool(s, 'sell'));
  window.__rcToolBtns.cancel = mkBtn('Cancel tool', () => rc_setTool(s, null));

  catBar.innerHTML = '';
  RC_DESIGN_CATS.forEach((c, i) => {
    const b = document.createElement('button');
    b.textContent = c.name;
    b.className = i === 0 ? 'active' : '';
    b.addEventListener('click', () => {
      catBar.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      rc_renderDesignItems(s, view, c);
    });
    catBar.appendChild(b);
  });
  rc_renderDesignItems(s, view, RC_DESIGN_CATS[0]);
}

function rc_setTool(s, tool) {
  const view = window.__rcView;
  view.tool = tool; view.ghostItem = null; view.moving = null;
  Object.keys(window.__rcToolBtns || {}).forEach(k => {
    window.__rcToolBtns[k].classList.toggle('active',
      (k === 'move' && tool === 'move') || (k === 'sell' && tool === 'sell'));
  });
  rc_refreshDesignGhost();
}

function rc_renderDesignItems(s, view, cat) {
  const grid = document.getElementById('design-items');
  grid.innerHTML = '';
  const shop = rc_decorShop(s);
  let items = [];
  if (cat.kinds.includes('__seasonal')) items = seasonalDecor(s.themeOverride || (new Date().getMonth() + 1));
  else if (cat.kinds.includes('__floor')) items = FLOORS.map(f => ({ id: 'floor:' + f.id, name: f.name, cost: f.cost, kind: '__floor' }));
  else if (cat.kinds.includes('__wall')) items = WALLPAPERS.map(f => ({ id: 'wall:' + f.id, name: f.name, cost: f.cost, kind: '__wall' }));
  else items = shop.filter(i => cat.kinds.includes(i.kind));

  if (!items.length) { grid.innerHTML = '<div class="empty">Nothing here yet.</div>'; return; }
  items.forEach(def => {
    const card = document.createElement('div');
    card.className = 'itemcard' + (view.ghostItem === def.id ? ' selected' : '');
    const locked = def.unlock && s.level < def.unlock;
    card.innerHTML = '<div class="iname">' + def.name + '</div>' +
      '<div class="icost">' + (locked ? 'Lvl ' + def.unlock : def.cost.toLocaleString() + ' coins') + '</div>' +
      (def.desc ? '<div class="idesc">' + def.desc + '</div>' : '') +
      (def.seasonal ? '<div class="seasonal-tag">' + def.themeName + '</div>' : '');
    if (locked) card.classList.add('locked');
    else card.addEventListener('click', () => {
      if (def.kind === '__floor') { const r = rc_setFloor(s, def.id.slice(6)); rc_toast(s, r.ok ? 'Floor installed!' : (r.why || 'Cannot')); return; }
      if (def.kind === '__wall') { const r = rc_setWallpaper(s, def.id.slice(5)); rc_toast(s, r.ok ? 'Walls painted!' : (r.why || 'Cannot')); return; }
      rc_setTool(s, null);
      view.ghostItem = def.id;
      rc_refreshDesignGhost();
      rc_renderDesignItems(s, view, cat);
    });
    grid.appendChild(card);
  });
}

function rc_refreshDesignGhost() {
  document.querySelectorAll('#design-items .itemcard').forEach(el => el.classList.remove('selected'));
}

/* ---------------- staff panel ---------------- */
function rc_buildStaffPanel(s) {
  const el = document.getElementById('panel-staff');
  el.innerHTML = '<h3>Staff (' + s.staff.length + '/' + rc_staffSlots(s) + ')</h3>';
  const hire = document.createElement('button');
  const cost = CFG.HIRE_COSTS[s.staff.length] || 20000;
  hire.textContent = s.staff.length >= rc_staffSlots(s) ? 'No free slot (level up!)' : 'Hire staff (' + cost.toLocaleString() + ' coins)';
  hire.className = 'primary';
  hire.disabled = s.staff.length >= rc_staffSlots(s);
  hire.addEventListener('click', () => {
    const r = rc_hireStaff(s);
    rc_toast(s, r.ok ? r.staff.name + ' joined as a waiter! Assign a role below.' : r.why);
    rc_buildStaffPanel(s);
  });
  el.appendChild(hire);

  s.staff.forEach(st => {
    const tier = rc_energyTier(st.energy);
    const card = document.createElement('div');
    card.className = 'staffcard';
    const pct = Math.round(st.energy / CFG.ENERGY_MAX * 100);
    card.innerHTML =
      '<div class="shead"><span class="scolor" style="background:' + st.shirt + '"></span><b>' + st.name + '</b>' +
      (st.isYou ? ' (you)' : '') + '</div>' +
      '<div class="senergy"><div class="ebar"><div class="efill" style="width:' + pct + '%;background:' + tier.color + '"></div></div>' +
      '<span>' + tier.name + ' (' + pct + '%)</span></div>' +
      (st.resting ? '<div class="resting">Resting...</div>' : '');
    // role select
    const roles = document.createElement('div');
    roles.className = 'roles';
    ['chef', 'waiter', 'janitor'].forEach(r => {
      const b = document.createElement('button');
      b.textContent = r[0].toUpperCase() + r.slice(1);
      b.className = st.role === r ? 'active' : '';
      b.addEventListener('click', () => { rc_setRole(s, st.id, r); rc_buildStaffPanel(s); });
      roles.appendChild(b);
    });
    card.appendChild(roles);
    // feed
    const feed = document.createElement('div');
    feed.className = 'feedrow';
    feed.innerHTML = '<span>Feed:</span>';
    CFG.SNACKS.forEach(sn => {
      const b = document.createElement('button');
      b.textContent = sn.name + ' (' + sn.cost + ')';
      b.title = 'Restores ' + sn.restore + ' energy';
      b.addEventListener('click', () => {
        const r = rc_feedStaff(s, st.id, sn.id);
        rc_toast(s, r.ok ? st.name + ' munches happily.' : r.why);
        rc_buildStaffPanel(s);
      });
      feed.appendChild(b);
    });
    card.appendChild(feed);
    // rest / fire
    const row = document.createElement('div');
    row.className = 'feedrow';
    const rest = document.createElement('button');
    rest.textContent = st.resting ? 'Wake up' : 'Rest';
    rest.addEventListener('click', () => { st.resting = !st.resting; if (!st.resting && st.energy <= 0) st.energy = 1; rc_buildStaffPanel(s); });
    row.appendChild(rest);
    if (!st.isYou) {
      const fire = document.createElement('button');
      fire.textContent = 'Fire (200 severance)';
      fire.className = 'danger';
      fire.addEventListener('click', () => {
        const r = rc_fireStaff(s, st.id);
        rc_toast(s, r.ok ? st.name + ' was let go.' : r.why);
        rc_buildStaffPanel(s);
      });
      row.appendChild(fire);
    }
    card.appendChild(row);
    el.appendChild(card);
  });
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Energy drains over a ~4 hour shift. Tired staff work slower. Rest is free but they leave the floor. If everyone collapses, the restaurant closes.';
  el.appendChild(note);
}

/* ---------------- menu panel ---------------- */
function rc_buildMenuPanel(s) {
  const el = document.getElementById('panel-menu');
  el.innerHTML = '<h3>Menu <span class="note">(' + rc_menuSlots(s) + ' slot(s) per category)</span></h3>';
  const inv = document.createElement('div');
  inv.className = 'inv';
  const ings = Object.keys(s.ingredients).filter(k => s.ingredients[k] > 0);
  inv.innerHTML = '<b>Ingredients:</b> ' + (ings.length ? ings.map(k => INGREDIENTS[k].name + ' x' + s.ingredients[k]).join(', ') : 'none yet - visit the Market');
  el.appendChild(inv);

  CATS.forEach(cat => {
    const h = document.createElement('h4');
    h.textContent = CAT_NAMES[cat] + (cat === 'drink' && s.level < CFG.DRINKS_UNLOCK_LEVEL ? ' (unlocks at level 15)' : '');
    el.appendChild(h);
    const list = rc_allDishes(s).filter(d => d.cat === cat);
    list.forEach(def => {
      const st = s.dishes[def.id];
      const learned = st && st.learned;
      const card = document.createElement('div');
      card.className = 'dishcard';
      const need = {};
      def.ingredients.forEach(i => need[i] = (need[i] || 0) + 1);
      const needTxt = Object.keys(need).map(i => INGREDIENTS[i].name + ' x' + need[i]).join(', ');
      const haveTxt = Object.keys(need).map(i => {
        const has = s.ingredients[i] || 0;
        return '<span class="' + (has >= need[i] ? 'have' : 'missing') + '">' + INGREDIENTS[i].name + ' ' + has + '/' + need[i] + '</span>';
      }).join(' ');
      card.innerHTML = '<div class="dhead"><b>' + def.name + '</b>' +
        (def.seasonal ? '<span class="seasonal-tag">' + def.themeName + '</span>' : '') +
        (learned ? '<span class="dlvl">' + CFG.DISH_LEVEL_TITLES[st.level] + ' Lv' + st.level + ' (' + CFG.GP_PER_LEVEL[st.level] + ' GP)</span>' : '') +
        '</div><div class="ding">' + (learned ? haveTxt : needTxt) + '</div>';
      const row = document.createElement('div');
      row.className = 'feedrow';
      if (!learned) {
        const b = document.createElement('button');
        b.textContent = 'Learn dish';
        b.className = 'primary';
        b.disabled = !rc_canLearn(s, def.id);
        b.title = b.disabled ? 'Need: ' + needTxt : 'Learn for ' + needTxt;
        b.addEventListener('click', () => {
          const r = rc_learnDish(s, def.id);
          rc_toast(s, r.ok ? def.name + ' learned! (+25 GP)' : r.why);
          rc_buildMenuPanel(s);
        });
        row.appendChild(b);
      } else {
        if (st.level < 10) {
          const b = document.createElement('button');
          b.textContent = 'Level up (to ' + CFG.DISH_LEVEL_TITLES[st.level + 1] + ')';
          b.disabled = !rc_canLevelDish(s, def.id);
          b.title = 'Needs: ' + needTxt;
          b.addEventListener('click', () => {
            const r = rc_levelUpDish(s, def.id);
            rc_toast(s, r.ok ? def.name + ' is now ' + CFG.DISH_LEVEL_TITLES[r.level] + '!' : r.why);
            rc_buildMenuPanel(s);
          });
          row.appendChild(b);
        }
        const onMenu = s.menu[cat].includes(def.id);
        const b2 = document.createElement('button');
        b2.textContent = onMenu ? 'On menu (tap to remove)' : 'Add to menu';
        b2.className = onMenu ? 'active' : '';
        b2.addEventListener('click', () => { rc_toggleMenuDish(s, def.id); rc_buildMenuPanel(s); });
        row.appendChild(b2);
      }
      card.appendChild(row);
      el.appendChild(card);
    });
  });
}

/* ---------------- market panel ---------------- */
function rc_buildMarketPanel(s) {
  const el = document.getElementById('panel-market');
  el.innerHTML = '<h3>Fresh Ingredient Market</h3><p class="note">3 new ingredients every day. Today: ' + (s.market.day || 'just refreshed') + '</p>';
  rc_refreshMarket(s);
  s.market.offers.forEach(ing => {
    const cost = rc_marketCost(ing);
    const card = document.createElement('div');
    card.className = 'dishcard';
    card.innerHTML = '<div class="dhead"><b>' + INGREDIENTS[ing].name + '</b><span class="dlvl">' + '★'.repeat(INGREDIENTS[ing].star) + '</span></div>';
    const b = document.createElement('button');
    b.textContent = 'Buy (' + cost + ' coins)';
    b.className = 'primary';
    b.disabled = s.coins < cost;
    b.addEventListener('click', () => {
      const r = rc_buyIngredient(s, ing);
      rc_toast(s, r.ok ? INGREDIENTS[ing].name + ' bought!' : r.why);
      rc_buildMarketPanel(s);
    });
    card.appendChild(b);
    el.appendChild(card);
  });
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Also earn ingredients from daily login streaks, your garden (level 6), and the wandering Gourmet King.';
  el.appendChild(note);
}

/* ---------------- theme panel ---------------- */
function rc_buildThemePanel(s) {
  const el = document.getElementById('panel-theme');
  const month = s.themeOverride || (new Date().getMonth() + 1);
  const th = THEMES[month];
  el.innerHTML = '<h3>Holiday Themes</h3>' +
    '<div class="themebanner" style="background:' + th.accent2 + ';border-color:' + th.accent + '">' + th.banner + '</div>' +
    '<p class="note">Seasonal decor and dishes are only available during their month. A new theme drops on the 1st of every month.</p>';
  const sel = document.createElement('select');
  const auto = document.createElement('option');
  auto.value = 0; auto.textContent = 'Auto (this month: ' + THEMES[new Date().getMonth() + 1].short + ')';
  sel.appendChild(auto);
  for (let m = 1; m <= 12; m++) {
    const o = document.createElement('option');
    o.value = m; o.textContent = THEMES[m].name;
    sel.appendChild(o);
  }
  sel.value = s.themeOverride;
  sel.addEventListener('change', () => {
    s.themeOverride = parseInt(sel.value, 10);
    rc_buildThemePanel(s);
    rc_toast(s, 'Theme: ' + THEMES[s.themeOverride || (new Date().getMonth() + 1)].name);
  });
  el.appendChild(sel);
  const h = document.createElement('h4');
  h.textContent = 'Seasonal decor';
  el.appendChild(h);
  seasonalDecor(month).forEach(def => {
    const card = document.createElement('div');
    card.className = 'itemcard';
    card.innerHTML = '<div class="iname">' + def.name + '</div><div class="icost">' + def.cost.toLocaleString() + ' coins</div>' +
      (def.desc ? '<div class="idesc">' + def.desc + '</div>' : '');
    card.addEventListener('click', () => {
      rc_showPanel(s, 'design');
      const view = window.__rcView;
      rc_setTool(s, null);
      view.ghostItem = def.id;
      rc_toast(s, 'Placing ' + def.name + '. Click a tile in your restaurant.');
    });
    el.appendChild(card);
  });
  const h2 = document.createElement('h4');
  h2.textContent = 'Seasonal dishes (learn in the Menu tab)';
  el.appendChild(h2);
  seasonalDishes(month).forEach(d => {
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = d.name + ' (' + CAT_NAMES[d.cat] + ')';
    el.appendChild(p);
  });
}

/* ---------------- settings / help ---------------- */
function rc_buildSettingsPanel(s) {
  const el = document.getElementById('panel-settings');
  el.innerHTML = '<h3>Settings</h3>' +
    '<p class="note">Your restaurant saves automatically to this browser.</p>' +
    '<p class="note">Served: ' + s.stats.served + ' plates | Earned: ' + s.stats.earned.toLocaleString() + ' coins | Walkouts: ' + s.stats.angry + '</p>';
  const b = document.createElement('button');
  b.textContent = 'Start over (reset restaurant)';
  b.className = 'danger';
  b.addEventListener('click', () => {
    if (confirm('Reset your restaurant and start over?')) {
      localStorage.removeItem(CFG.SAVE_KEY);
      location.reload();
    }
  });
  el.appendChild(b);
}

/* ---------------- top bar + toasts ---------------- */
function rc_updateTopbar(s) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('tb-coins', Math.floor(s.coins).toLocaleString());
  set('tb-level', s.level);
  const cur = LEVELS.find(l => l.lvl === s.level) || LEVELS[0];
  const nxt = LEVELS.find(l => l.lvl === s.level + 1);
  let pct = 100, label = 'MAX';
  if (nxt) { pct = Math.min(100, (s.gp - cur.gp) / (nxt.gp - cur.gp) * 100); label = Math.floor(s.gp) + ' / ' + nxt.gp + ' GP'; }
  const fill = document.getElementById('tb-gpfill');
  if (fill) fill.style.width = pct + '%';
  set('tb-gplabel', label);
  set('tb-pop', s.popularity.toFixed(2));
  const stars = document.getElementById('tb-stars');
  if (stars) stars.textContent = '★'.repeat(Math.round(s.popularity / 10)) + '☆'.repeat(5 - Math.round(s.popularity / 10));
  const month = s.themeOverride || (new Date().getMonth() + 1);
  const th = THEMES[month];
  const banner = document.getElementById('theme-banner');
  if (banner) { banner.textContent = th.short + ': ' + th.banner; banner.style.background = th.accent2; banner.style.borderColor = th.accent; }
}

function rc_pumpToasts(s) {
  const box = document.getElementById('toasts');
  if (!box || !s._toasts) return;
  // expire old
  s._toasts = s._toasts.filter(t => t.t < 9);
  // render (keep last 4)
  const show = s._toasts.slice(-4);
  box.innerHTML = '';
  show.forEach(t => {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = t.msg;
    box.appendChild(d);
  });
}
