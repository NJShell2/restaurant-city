/* Restaurant City rebuild - entry point: load, loop, save. */
(function () {
  let s;
  try {
    const raw = localStorage.getItem(CFG.SAVE_KEY);
    s = raw ? rc_deserialize(raw) : rc_newGame();
  } catch (e) { s = rc_newGame(); }
  window.__rcGame = s;

  // daily streak + market + offline earnings
  rc_dailyCheck(s);
  const off = rc_applyOffline(s);
  if (off) setTimeout(() => rc_toast(s, 'While you were away: ' + off.plates + ' plates served, +' + off.coins + ' coins!'), 2500);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  rc_resizeCanvas(canvas);
  window.addEventListener('resize', () => rc_resizeCanvas(canvas));

  const view = { hover: null, ghostItem: null, tool: null, moving: null, selected: null };
  window.__rcView = view;

  rc_initUI(s, view, canvas);

  let last = performance.now(), saveT = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.5) dt = 0.5; // tab was asleep
    const t = now / 1000;
    rc_update(s, dt);
    rc_drawScene(ctx, s, view, t);
    rc_updateTopbar(s);
    rc_pumpToasts(s);
    saveT += dt;
    if (saveT > CFG.AUTOSAVE_SECS) { saveT = 0; rc_save(s); }
    requestAnimationFrame(frame);
  }
  function rc_save(st) {
    try { st.lastSeen = Date.now(); localStorage.setItem(CFG.SAVE_KEY, rc_serialize(st)); } catch (e) {}
  }
  window.addEventListener('beforeunload', () => rc_save(s));
  requestAnimationFrame(frame);
})();
