/* Restaurant City rebuild - isometric renderer.
   All art is drawn procedurally from scratch (no copied assets). */

const RCV = { ox: 480, oy: 150, W: 960, H: 640 };

function rc_resizeCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const scale = Math.min(r.width / RCV.W, r.height / RCV.H) || 1;
  canvas.width = RCV.W; canvas.height = RCV.H;
  canvas.style.aspectRatio = RCV.W + '/' + RCV.H;
  return scale;
}

function rc_iso(x, y, gridSize) {
  const TW = CFG.TILE_W, TH = CFG.TILE_H;
  // center the grid horizontally; nudge up a bit for walls
  const ox = RCV.W / 2, oy = 150 - (gridSize * TH) / 4;
  return [ox + (x - y) * TW / 2, oy + (x + y) * TH / 2];
}

function rc_screenToTile(mx, my, gridSize) {
  const TW = CFG.TILE_W, TH = CFG.TILE_H;
  const ox = RCV.W / 2, oy = 150 - (gridSize * TH) / 4;
  const dx = mx - ox, dy = my - oy;
  const x = (dx / (TW / 2) + dy / (TH / 2)) / 2;
  const y = (dy / (TH / 2) - dx / (TW / 2)) / 2;
  return [Math.floor(x), Math.floor(y)];
}

function rc_diamond(ctx, px, py, w, h) {
  ctx.beginPath();
  ctx.moveTo(px, py - h / 2); ctx.lineTo(px + w / 2, py);
  ctx.lineTo(px, py + h / 2); ctx.lineTo(px - w / 2, py);
  ctx.closePath();
}

/* ---------- people ---------- */
function rc_drawPerson(ctx, px, py, o) {
  const s = o.sitting ? 0.85 : 1;
  const bob = o.walkPhase ? Math.sin(o.walkPhase) * 2 : 0;
  const base = py + bob * 0.3;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(px, py + 2, 10 * s, 4 * s, 0, 0, 7); ctx.fill();
  // legs
  ctx.fillStyle = '#3a3a4a';
  const legH = 10 * s;
  ctx.fillRect(px - 6 * s, base - legH, 5 * s, legH);
  ctx.fillRect(px + 1 * s, base - legH, 5 * s, legH);
  // body
  ctx.fillStyle = o.shirt || '#888';
  const bw = 13 * s, bh = 16 * s;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(px - bw / 2, base - legH - bh, bw, bh, 5 * s);
  else ctx.rect(px - bw / 2, base - legH - bh, bw, bh);
  ctx.fill();
  // waiter apron + bowtie
  if (o.role === 'waiter') {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(px - 4 * s, base - legH - bh + 6 * s, 8 * s, 9 * s);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(px, base - legH - bh + 4 * s, 2.2 * s, 0, 7); ctx.fill();
  }
  // arms
  ctx.fillStyle = o.skin;
  ctx.fillRect(px - bw / 2 - 3 * s, base - legH - bh + 3 * s, 3.5 * s, 10 * s);
  ctx.fillRect(px + bw / 2 - 0.5 * s, base - legH - bh + 3 * s, 3.5 * s, 10 * s);
  // head
  const hy = base - legH - bh - 8 * s;
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(px, hy, 8.5 * s, 0, 7); ctx.fill();
  // hair
  ctx.fillStyle = o.hair || '#4a2f1d';
  ctx.beginPath(); ctx.arc(px, hy - 2 * s, 8.5 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.fillRect(px - 8.5 * s, hy - 4 * s, 17 * s, 3.5 * s);
  // eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(px - 3 * s, hy + 1 * s, 1.3 * s, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 3 * s, hy + 1 * s, 1.3 * s, 0, 7); ctx.fill();
  // role hats
  if (o.role === 'chef') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px - 4 * s, hy - 9 * s, 4.5 * s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4 * s, hy - 9 * s, 4.5 * s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(px, hy - 11 * s, 5 * s, 0, 7); ctx.fill();
    ctx.fillRect(px - 7 * s, hy - 10 * s, 14 * s, 3.5 * s);
  } else if (o.role === 'janitor') {
    ctx.fillStyle = '#2e5fa3';
    ctx.beginPath(); ctx.arc(px, hy - 6 * s, 8 * s, Math.PI, 0); ctx.fill();
    ctx.fillRect(px - 9 * s, hy - 7 * s, 18 * s, 2.5 * s);
  } else if (o.role === 'king') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(px - 8, hy - 8); ctx.lineTo(px - 8, hy - 16); ctx.lineTo(px - 4, hy - 11);
    ctx.lineTo(px, hy - 18); ctx.lineTo(px + 4, hy - 11); ctx.lineTo(px + 8, hy - 16); ctx.lineTo(px + 8, hy - 8);
    ctx.closePath(); ctx.fill();
    // beard
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath(); ctx.ellipse(px, hy + 9, 6, 8, 0, 0, 7); ctx.fill();
  }
  // carried dish
  if (o.carry) {
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath(); ctx.ellipse(px + 12 * s, base - legH - bh + 8 * s, 7 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#c98d5f';
    ctx.beginPath(); ctx.ellipse(px + 12 * s, base - legH - bh + 7 * s, 4.5 * s, 2.2 * s, 0, 0, 7); ctx.fill();
  }
  // thought bubble
  if (o.thought) {
    const bx = px + 14, by = hy - 26;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(bx, by, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 6, by + 8); ctx.lineTo(bx - 2, by + 14); ctx.lineTo(bx + 1, by + 7); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    ctx.fillStyle = o.thought === '!' ? '#d84a4a' : o.thought === '$' ? '#2e8b57' : '#333';
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.thought, bx, by + 1);
  }
}

/* ---------- item art ---------- */
function rc_drawItem(ctx, px, py, def, tile, s, t) {
  const TW = CFG.TILE_W, TH = CFG.TILE_H;
  ctx.save();
  switch (def.kind) {
    case 'table': {
      // legs + wooden top
      ctx.fillStyle = '#6b4a2c';
      [[-14, -4], [14, -4], [-14, 4], [14, 4]].forEach(([ox, oy]) => ctx.fillRect(px + ox - 2, py + oy - 2, 4, 12));
      ctx.fillStyle = def.id === 'table_round' ? '#a5713d' : '#8a5a30';
      if (def.id === 'table_round') { ctx.beginPath(); ctx.ellipse(px, py - 6, 24, 12, 0, 0, 7); ctx.fill(); }
      else { rc_diamond(ctx, px, py - 6, 52, 26); ctx.fill(); }
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 2;
      if (def.id === 'table_round') { ctx.beginPath(); ctx.ellipse(px, py - 6, 24, 12, 0, 0, 7); ctx.stroke(); }
      else { rc_diamond(ctx, px, py - 6, 52, 26); ctx.stroke(); }
      // tablecloth stripe
      ctx.fillStyle = 'rgba(200,60,50,0.55)';
      rc_diamond(ctx, px, py - 6, 30, 15); ctx.fill();
      if (tile && tile.dirty) {
        ctx.fillStyle = 'rgba(120,90,60,0.8)';
        ctx.beginPath(); ctx.ellipse(px - 6, py - 10, 7, 3.5, 0.3, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + 8, py - 4, 5, 2.5, -0.2, 0, 7); ctx.fill();
      }
      break;
    }
    case 'chair': {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(px - 8, py - 14, 16, 6);
      ctx.fillRect(px - 8, py - 26, 4, 14);
      ctx.fillRect(px + 4, py - 26, 4, 14);
      ctx.fillStyle = '#8a5f36';
      ctx.beginPath(); ctx.ellipse(px, py - 12, 11, 5.5, 0, 0, 7); ctx.fill();
      if (def.id === 'chair_cushion') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(px, py - 13, 8, 4, 0, 0, 7); ctx.fill(); }
      break;
    }
    case 'door': {
      // welcome mat + posts on the front edge
      ctx.fillStyle = '#a03a2e';
      rc_diamond(ctx, px, py, 56, 28); ctx.fill();
      ctx.fillStyle = '#7a2a20';
      rc_diamond(ctx, px, py, 40, 20); ctx.fill();
      ctx.fillStyle = '#6b4a2c';
      ctx.fillRect(px - 26, py - 34, 6, 34); ctx.fillRect(px + 20, py - 34, 6, 34);
      ctx.fillStyle = '#8a5a30';
      ctx.fillRect(px - 28, py - 38, 10, 6); ctx.fillRect(px + 18, py - 38, 10, 6);
      break;
    }
    case 'stove': {
      ctx.fillStyle = def.id === 'stove_pro' ? '#9aa2ab' : def.id === 'stove_deluxe' ? '#4a4a52' : '#707880';
      ctx.fillRect(px - 20, py - 34, 40, 30);
      ctx.fillStyle = '#3a3f45';
      ctx.fillRect(px - 20, py - 40, 40, 8);
      // burners
      ctx.fillStyle = '#22262b';
      [[-10, -36], [10, -36], [-10, -28], [10, -28]].forEach(([ox, oy]) => { ctx.beginPath(); ctx.arc(px + ox, py + oy, 5, 0, 7); ctx.fill(); });
      // oven window with fire glow when cooking
      const cooking = tile && tile.chefId;
      ctx.fillStyle = cooking ? '#ff9a3c' : '#22262b';
      ctx.fillRect(px - 14, py - 26, 28, 14);
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 2; ctx.strokeRect(px - 20, py - 34, 40, 30);
      if (cooking && tile.cookProgress != null) {
        ctx.fillStyle = '#333'; ctx.fillRect(px - 20, py - 48, 40, 5);
        ctx.fillStyle = '#ff9a3c'; ctx.fillRect(px - 20, py - 48, 40 * Math.min(tile.cookProgress, 1), 5);
      }
      break;
    }
    case 'counter': {
      ctx.fillStyle = '#b08954';
      ctx.fillRect(px - 24, py - 26, 48, 22);
      ctx.fillStyle = '#d9b983';
      rc_diamond(ctx, px, py - 26, 52, 20); ctx.fill();
      ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 2;
      rc_diamond(ctx, px, py - 26, 52, 20); ctx.stroke();
      // ready dishes waiting
      const n = Math.min(s.readyDishes.length, 4);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = '#f8f8f8';
        ctx.beginPath(); ctx.ellipse(px - 15 + i * 10, py - 28, 5, 2.5, 0, 0, 7); ctx.fill();
      }
      break;
    }
    case 'sink': {
      ctx.fillStyle = '#8a939c';
      ctx.fillRect(px - 20, py - 30, 40, 26);
      ctx.fillStyle = '#c8d2da';
      ctx.beginPath(); ctx.ellipse(px, py - 30, 14, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#9aa4ad';
      ctx.fillRect(px + 8, py - 44, 4, 14);
      break;
    }
    case 'toilet': {
      ctx.fillStyle = '#eef1f4';
      ctx.fillRect(px - 12, py - 34, 24, 12); // tank
      ctx.beginPath(); ctx.ellipse(px, py - 14, 13, 8, 0, 0, 7); ctx.fill(); // bowl
      ctx.fillStyle = '#d5dbe1';
      ctx.beginPath(); ctx.ellipse(px, py - 16, 8, 4.5, 0, 0, 7); ctx.fill();
      if (tile && tile.dirty) {
        ctx.fillStyle = 'rgba(120,100,40,0.7)';
        ctx.beginPath(); ctx.ellipse(px, py - 16, 8, 4.5, 0, 0, 7); ctx.fill();
        rc_drawFloatIcon(ctx, px, py - 44, '!', '#d84a4a', t);
      }
      break;
    }
    case 'arcade': {
      const broken = tile && tile.broken;
      ctx.fillStyle = broken ? '#5a5a5a' : '#2e5fa3';
      ctx.fillRect(px - 14, py - 52, 28, 48);
      ctx.fillStyle = broken ? '#333' : (Math.floor(t * 2) % 2 ? '#7fd4ff' : '#2e8fd4');
      ctx.fillRect(px - 10, py - 48, 20, 16);
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.arc(px, py - 24, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2c230'; ctx.fillRect(px - 8, py - 18, 16, 3);
      if (broken) rc_drawFloatIcon(ctx, px, py - 60, 'X', '#d84a4a', t);
      break;
    }
    case 'jukebox': {
      ctx.fillStyle = '#7d3fa0';
      ctx.beginPath(); ctx.arc(px, py - 30, 16, Math.PI, 0); ctx.fill();
      ctx.fillRect(px - 16, py - 30, 32, 26);
      const cols = ['#ff5a5a', '#ffd23f', '#5aff8a'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = cols[(Math.floor(t * 3) + i) % 3];
        ctx.beginPath(); ctx.arc(px - 8 + i * 8, py - 34, 3, 0, 7); ctx.fill();
      }
      break;
    }
    case 'decor': {
      rc_drawDecor(ctx, px, py, def, t);
      break;
    }
    case 'walldecor': break; // drawn on walls separately
    case 'divider': {
      ctx.fillStyle = '#a5713d';
      ctx.fillRect(px - 22, py - 40, 44, 36);
      ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.strokeRect(px + i * 15 - 7, py - 38, 14, 32); }
      break;
    }
    case 'rug': break; // drawn flat in floor pass
    case 'garden': {
      ctx.fillStyle = '#6b4a2c';
      rc_diamond(ctx, px, py, TW - 14, TH - 7); ctx.fill();
      ctx.strokeStyle = '#4e3420'; ctx.lineWidth = 1.5;
      rc_diamond(ctx, px, py, TW - 14, TH - 7); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function rc_drawFloatIcon(ctx, px, py, ch, color, t) {
  const bobY = Math.sin(t * 3) * 2;
  ctx.fillStyle = color;
  ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, px, py + bobY);
}

function rc_drawDecor(ctx, px, py, def, t) {
  const id = def.id;
  if (id === 'plant' || id === 't_shamrock' || id === 't_cactus' || id === 't_tulip' || id === 't_pineapple') {
    ctx.fillStyle = '#a05a2c'; ctx.fillRect(px - 8, py - 16, 16, 12); // pot
    ctx.fillStyle = id === 't_cactus' ? '#3f7d3a' : '#3fae5a';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.ellipse(px + i * 5, py - 24 - Math.abs(i) * -2, 4, 10, i * 0.25, 0, 7); ctx.fill();
    }
    if (id === 't_tulip') { ctx.fillStyle = '#e86a9a'; ctx.beginPath(); ctx.arc(px, py - 32, 5, 0, 7); ctx.fill(); }
    if (id === 't_pineapple') { ctx.fillStyle = '#e8a83c'; ctx.beginPath(); ctx.ellipse(px, py - 24, 8, 10, 0, 0, 7); ctx.fill(); }
  } else if (id === 'plant_big') {
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(px - 4, py - 40, 8, 36);
    ctx.fillStyle = '#3fae5a';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.sin(t) * 0.05;
      ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * 14, py - 42 + Math.sin(a) * 6, 12, 5, a, 0, 7); ctx.fill();
    }
  } else if (id === 'flowers' || id === 't_rose_bouquet' || id === 't_egg_basket') {
    ctx.fillStyle = '#8a6a9a'; ctx.fillRect(px - 6, py - 14, 12, 10);
    const cols = id === 't_rose_bouquet' ? ['#d94f6c'] : id === 't_egg_basket' ? ['#f2b134', '#7fb2d9', '#e8a0bf'] : ['#e86a9a', '#f2d13c', '#ffffff'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px - 8 + i * 8, py - 20, 4.5, 0, 7); ctx.fill(); });
  } else if (id === 'statue' || id === 't_leprechaun' || id === 't_bunny' || id === 't_nutcracker' || id === 't_ghost' || id === 't_scarecrow' || id === 't_snowman' || id === 't_star_statue') {
    ctx.fillStyle = '#cfc8bb'; ctx.fillRect(px - 10, py - 10, 20, 8); // pedestal
    if (id === 't_ghost') {
      ctx.fillStyle = 'rgba(245,245,250,0.95)';
      ctx.beginPath(); ctx.arc(px, py - 26, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(px - 10, py - 26, 20, 14);
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(px - 4, py - 28, 1.8, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 4, py - 28, 1.8, 0, 7); ctx.fill();
    } else if (id === 't_snowman') {
      ctx.fillStyle = '#f4f8fb';
      ctx.beginPath(); ctx.arc(px, py - 16, 9, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(px, py - 30, 6.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e07b39'; ctx.fillRect(px, py - 31, 7, 2.5);
    } else {
      ctx.fillStyle = id === 't_leprechaun' ? '#3fae5a' : '#cfc8bb';
      ctx.beginPath(); ctx.arc(px, py - 24, 8, 0, 7); ctx.fill();
      ctx.fillRect(px - 6, py - 22, 12, 12);
    }
  } else if (id === 't_jackolantern') {
    ctx.fillStyle = '#e07b39';
    ctx.beginPath(); ctx.ellipse(px, py - 14, 13, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a4a1a'; ctx.fillRect(px - 2, py - 28, 4, 5);
    ctx.fillStyle = '#ffe9a8';
    const flick = 0.7 + Math.sin(t * 5) * 0.3;
    ctx.globalAlpha = flick;
    [[-5, -16], [5, -16]].forEach(([ox, oy]) => { ctx.beginPath(); ctx.moveTo(px + ox - 3, py + oy); ctx.lineTo(px + ox + 3, py + oy); ctx.lineTo(px + ox, py + oy - 5); ctx.closePath(); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(px - 7, py - 8); ctx.lineTo(px + 7, py - 8); ctx.lineTo(px, py - 4); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (id === 't_candy_bowl' || id === 't_turkey_center' || id === 't_cornucopia' || id === 't_gold_cornucopia') {
    ctx.fillStyle = id === 't_gold_cornucopia' ? '#d9a441' : '#8a5a30';
    ctx.beginPath(); ctx.ellipse(px, py - 10, 14, 6, 0, 0, 7); ctx.fill();
    const cols = ['#d94f6c', '#f2b134', '#7fb2d9', '#3fae5a'];
    for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(px - 10 + i * 5, py - 16 - (i % 2) * 3, 3.5, 0, 7); ctx.fill(); }
    if (id === 't_turkey_center') { ctx.fillStyle = '#a05a2c'; ctx.beginPath(); ctx.ellipse(px, py - 20, 8, 6, 0, 0, 7); ctx.fill(); }
  } else if (id === 't_christmas_tree') {
    ctx.fillStyle = '#2e7d4f';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px, py - 52 + i * 12); ctx.lineTo(px - 14 + i * 3, py - 30 + i * 12); ctx.lineTo(px + 14 - i * 3, py - 30 + i * 12); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(px - 3, py - 12, 6, 10);
    const cols = ['#d94f6c', '#f2d13c', '#7fb2d9'];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.arc(px - 8 + (i % 3) * 8, py - 44 + Math.floor(i / 3) * 14, 2.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#f2d13c';
    ctx.beginPath(); ctx.moveTo(px, py - 58); ctx.lineTo(px - 4, py - 50); ctx.lineTo(px + 4, py - 50); ctx.closePath(); ctx.fill();
  } else if (id === 't_icesculpt') {
    ctx.fillStyle = 'rgba(180,220,240,0.85)';
    ctx.beginPath(); ctx.ellipse(px, py - 18, 10, 14, 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 6, py - 32, 6, 0, 7); ctx.fill();
  } else if (id === 't_fireplace') {
    ctx.fillStyle = '#7a4a3a'; ctx.fillRect(px - 14, py - 30, 28, 26);
    ctx.fillStyle = '#2b1a12'; ctx.fillRect(px - 9, py - 22, 18, 18);
    ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff9a3c' : '#ff6a2c';
    ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.quadraticCurveTo(px, py - 26, px + 6, py - 6); ctx.closePath(); ctx.fill();
  } else if (id === 't_bbq_grill') {
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.ellipse(px, py - 20, 14, 8, 0, 0, 7); ctx.fill();
    ctx.fillRect(px - 2, py - 20, 4, 16);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(px + i * 5, py - 26); ctx.lineTo(px + i * 5, py - 14); ctx.stroke(); }
  } else if (id === 't_haybale') {
    ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.ellipse(px, py - 10, 16, 10, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#a87c2c'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(px + i * 6, py - 19); ctx.lineTo(px + i * 6, py - 1); ctx.stroke(); }
  } else if (id === 't_pot_gold') {
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(px, py - 12, 12, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2d13c'; ctx.beginPath(); ctx.ellipse(px, py - 16, 9, 4, 0, 0, 7); ctx.fill();
  } else if (id === 't_beachball' || id === 't_umbrella' || id === 't_tiki_torch' || id === 't_luau_torch' || id === 't_heart_balloon' || id === 't_candle_table' || id === 't_witch_hat' || id === 't_fireworks') {
    // generic festive marker in the theme accent color
    const th = THEMES[(window.__rcThemeMonth || 10)];
    ctx.fillStyle = th ? th.accent : '#d94f6c';
    if (id === 't_heart_balloon') {
      ctx.beginPath(); ctx.arc(px - 4, py - 28, 6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 4, py - 28, 6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - 9, py - 25); ctx.lineTo(px + 9, py - 25); ctx.lineTo(px, py - 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(px, py - 16); ctx.lineTo(px, py - 4); ctx.stroke();
    } else if (id === 't_umbrella') {
      ctx.beginPath(); ctx.arc(px, py - 26, 16, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#7a4a24'; ctx.fillRect(px - 1.5, py - 26, 3, 22);
    } else if (id === 't_witch_hat') {
      ctx.beginPath(); ctx.moveTo(px, py - 40); ctx.lineTo(px - 8, py - 18); ctx.lineTo(px + 8, py - 18); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px, py - 18, 12, 4, 0, 0, 7); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(px, py - 18, 8, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(px - 2.5, py - 20.5, 2.5, 0, 7); ctx.fill();
    }
  } else {
    // fallback: cheerful bauble
    ctx.fillStyle = '#c9a227';
    ctx.beginPath(); ctx.arc(px, py - 20, 9, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(px - 3, py - 23, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a5a30'; ctx.fillRect(px - 4, py - 12, 8, 8);
  }
}

function rc_drawWallDecor(ctx, px, py, def, side) {
  // drawn on the back wall face above the tile
  const wy = py - CFG.TILE_H / 2 - 26;
  ctx.fillStyle = '#8a6a45';
  const w = 26, h = 20;
  ctx.fillRect(px - w / 2 - 2, wy - h / 2 - 2, w + 4, h + 4);
  const id = def.id;
  if (id === 'painting' || id === 't_spooky_painting' || id === 't_love_painting' || id === 't_pilgrim_art') {
    ctx.fillStyle = id === 't_spooky_painting' ? '#2b2b3a' : id === 't_love_painting' ? '#f7dfe6' : '#bcd3e8';
    ctx.fillRect(px - w / 2, wy - h / 2, w, h);
    ctx.fillStyle = id === 't_spooky_painting' ? '#7d3fa0' : '#3f6f9e';
    ctx.beginPath(); ctx.arc(px - 5, wy - 2, 5, 0, 7); ctx.fill();
    ctx.fillStyle = id === 't_spooky_painting' ? '#e8e8f2' : '#e8a83c';
    ctx.beginPath(); ctx.arc(px + 6, wy + 3, 4, 0, 7); ctx.fill();
  } else if (id === 'clock') {
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(px, wy, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
    const a = Date.now() / 1000;
    ctx.beginPath(); ctx.moveTo(px, wy); ctx.lineTo(px + 6 * Math.cos(a), wy + 6 * Math.sin(a)); ctx.stroke();
  } else if (id === 'darts') {
    const cols = ['#222', '#f5f5f5', '#c0392b'];
    for (let i = 3; i > 0; i--) { ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.arc(px, wy, i * 4, 0, 7); ctx.fill(); }
  } else {
    // generic wall hanging in theme accent
    const th = THEMES[(window.__rcThemeMonth || 10)];
    ctx.fillStyle = th ? th.accent2 : '#f2e3c6';
    ctx.fillRect(px - w / 2, wy - h / 2, w, h);
    ctx.fillStyle = th ? th.accent : '#c0392b';
    ctx.beginPath(); ctx.arc(px, wy, 5, 0, 7); ctx.fill();
  }
}

/* ---------- scene ---------- */
function rc_drawScene(ctx, s, view, t) {
  const n = s.gridSize, TW = CFG.TILE_W, TH = CFG.TILE_H;
  window.__rcThemeMonth = s.themeOverride || (new Date().getMonth() + 1);
  ctx.clearRect(0, 0, RCV.W, RCV.H);
  // backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, RCV.H);
  bg.addColorStop(0, '#1d2733'); bg.addColorStop(1, '#2e3d4f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, RCV.W, RCV.H);

  const floor = FLOORS.find(f => f.id === s.floorId) || FLOORS[0];
  const wall = WALLPAPERS.find(f => f.id === s.wallId) || WALLPAPERS[0];

  // floor tiles
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
    const [px, py] = rc_iso(x, y, n);
    const checker = (x + y) % 2 === 0;
    ctx.fillStyle = checker ? floor.c1 : floor.c2;
    rc_diamond(ctx, px, py, TW, TH); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
    rc_diamond(ctx, px, py, TW, TH); ctx.stroke();
  }
  // rugs (flat, before items)
  for (const k in s.tiles) {
    const def = rc_itemDefAny(s.tiles[k].itemId);
    if (def && def.kind === 'rug') {
      const [x, y] = k.split(',').map(Number);
      const [px, py] = rc_iso(x, y, n);
      ctx.fillStyle = 'rgba(176,58,46,0.75)';
      rc_diamond(ctx, px, py, TW - 10, TH - 5); ctx.fill();
      ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 2;
      rc_diamond(ctx, px, py, TW - 10, TH - 5); ctx.stroke();
    }
  }
  // back walls (north y=0, west x=0)
  const wallH = 30;
  ctx.fillStyle = wall.color;
  for (let x = 0; x < n; x++) {
    const [px, py] = rc_iso(x, 0, n);
    ctx.beginPath();
    ctx.moveTo(px - TW / 2, py - TH / 2); ctx.lineTo(px + TW / 2, py - TH / 2);
    ctx.lineTo(px + TW / 2, py - TH / 2 - wallH); ctx.lineTo(px - TW / 2, py - TH / 2 - wallH);
    ctx.closePath(); ctx.fill();
  }
  for (let y = 0; y < n; y++) {
    const [px, py] = rc_iso(0, y, n);
    ctx.beginPath();
    ctx.moveTo(px - TW / 2, py - TH / 2); ctx.lineTo(px - TW / 2, py + TH / 2);
    ctx.lineTo(px - TW / 2, py + TH / 2 - wallH); ctx.lineTo(px - TW / 2, py - TH / 2 - wallH);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = 0; x < n; x++) {
    const [px, py] = rc_iso(x, 0, n);
    ctx.fillRect(px - TW / 2, py - TH / 2 - wallH, TW, 4);
  }

  // collect drawables: items + characters, painter's order
  const draws = [];
  for (const k in s.tiles) {
    const [x, y] = k.split(',').map(Number);
    const def = rc_itemDefAny(s.tiles[k].itemId);
    if (!def || def.kind === 'rug') continue;
    draws.push({ depth: x + y, x, y, type: 'item', def, tile: s.tiles[k] });
  }
  // trash
  for (const tr of s.trash) draws.push({ depth: tr.x + tr.y + 0.05, x: tr.x, y: tr.y, type: 'trash' });
  // garden plots
  for (const k in s.garden) {
    const [x, y] = k.split(',').map(Number);
    draws.push({ depth: x + y + 0.05, x, y, type: 'garden', g: s.garden[k] });
  }
  for (const c of s.customers) draws.push({ depth: c.x + c.y + 0.1, type: 'customer', c });
  for (const st of s.staff) {
    if (st.resting) continue; // resting staff are off-screen
    draws.push({ depth: st.x + st.y + 0.1, type: 'staff', c: st });
  }
  if (s.gourmetKing) draws.push({ depth: s.gourmetKing.x + s.gourmetKing.y + 0.2, type: 'king', c: s.gourmetKing });
  draws.sort((a, b) => a.depth - b.depth);

  for (const d of draws) {
    const [px, py] = rc_iso(d.x, d.y, n);
    if (d.type === 'item') {
      if (d.def.kind === 'walldecor') rc_drawWallDecor(ctx, px, py, d.def);
      else rc_drawItem(ctx, px, py, d.def, d.tile, s, t);
    } else if (d.type === 'trash') {
      ctx.fillStyle = '#cfc8bb';
      ctx.beginPath(); ctx.arc(px, py - 4, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#a09a8e';
      ctx.beginPath(); ctx.arc(px - 2, py - 6, 2.5, 0, 7); ctx.fill();
    } else if (d.type === 'garden') {
      ctx.fillStyle = '#6b4a2c';
      rc_diamond(ctx, px, py, TW - 16, TH - 8); ctx.fill();
      if (d.g.grown) {
        ctx.fillStyle = '#3fae5a';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(px - 9 + i * 6, py - 8, 4, 0, 7); ctx.fill(); }
        const tw = Math.sin(t * 4) * 0.5 + 0.5;
        ctx.fillStyle = 'rgba(255,255,215,' + (0.4 + tw * 0.5) + ')';
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('*', px + 10, py - 16);
      } else {
        const stage = Math.min(3, Math.floor(d.g.t / d.g.need * 4));
        ctx.fillStyle = '#5fae4a';
        ctx.fillRect(px - 2, py - 8 - stage * 5, 4, 6 + stage * 5);
      }
    } else if (d.type === 'customer') {
      const c = d.c;
      const sitting = c.state === 'waitingOrder' || c.state === 'waitingFood' || c.state === 'eating';
      rc_drawPerson(ctx, px, py, {
        skin: c.skin, hair: c.hair, shirt: c.shirt, sitting,
        walkPhase: (c.state === 'toTable' || c.state === 'leaving' || c.state === 'leavingAngry') ? t * 10 : 0,
        thought: c.thought,
      });
      // cook/wait progress ring for hungry customers
      if ((c.state === 'waitingOrder' || c.state === 'waitingFood') && c.patience < CFG.CUSTOMER_PATIENCE_SECS * 0.5) {
        ctx.strokeStyle = c.patience < 25 ? '#d84a4a' : '#e8a83c';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, py - 46, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (c.patience / CFG.CUSTOMER_PATIENCE_SECS)); ctx.stroke();
      }
    } else if (d.type === 'staff') {
      const st = d.c;
      const walking = st.state === 'walking';
      rc_drawPerson(ctx, px, py, {
        skin: st.skin, hair: st.hair, shirt: st.shirt, role: st.role,
        walkPhase: walking ? t * 10 : 0,
        carry: st.carry ? true : false,
      });
      // chef cook progress above stove
      if (st.role === 'chef' && st.cooking) {
        const p = Math.min((st.cooking.progress || 0) / CFG.DISH_COOK_SECS, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px - 16, py - 58, 32, 5);
        ctx.fillStyle = '#ff9a3c'; ctx.fillRect(px - 16, py - 58, 32 * p, 5);
      }
      // energy ring
      const tier = rc_energyTier(st.energy);
      ctx.strokeStyle = tier.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px - 14, py - 40, 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (st.energy / CFG.ENERGY_MAX)); ctx.stroke();
    } else if (d.type === 'king') {
      const pulse = 1 + Math.sin(t * 3) * 0.05;
      ctx.save(); ctx.translate(px, py); ctx.scale(pulse, pulse); ctx.translate(-px, -py);
      ctx.fillStyle = 'rgba(242,194,48,0.25)';
      ctx.beginPath(); ctx.arc(px, py - 20, 26, 0, 7); ctx.fill();
      rc_drawPerson(ctx, px, py, { skin: '#f6d3b3', hair: '#eeeeee', shirt: '#7d3fa0', role: 'king' });
      ctx.restore();
      ctx.fillStyle = '#5a3a10'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Gourmet King! Click me!', px, py - 62);
    }
  }

  // hover highlight + ghost preview + selected tile
  const hi = view.hover;
  if (hi && hi.x >= 0 && hi.y >= 0 && hi.x < n && hi.y < n) {
    const [px, py] = rc_iso(hi.x, hi.y, n);
    ctx.strokeStyle = view.tool === 'sell' ? '#d84a4a' : '#7fd4ff';
    ctx.lineWidth = 2.5;
    rc_diamond(ctx, px, py, TW, TH); ctx.stroke();
    if (view.ghostItem) {
      const def = rc_itemDefAny(view.ghostItem);
      const c = rc_canPlace(s, view.ghostItem, hi.x, hi.y);
      ctx.globalAlpha = 0.55;
      if (def) rc_drawItem(ctx, px, py, def, null, s, t);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.ok ? '#3fae5a' : '#d84a4a';
      ctx.lineWidth = 3;
      rc_diamond(ctx, px, py, TW, TH); ctx.stroke();
    }
  }
  if (view.selected) {
    const [px, py] = rc_iso(view.selected.x, view.selected.y, n);
    ctx.strokeStyle = '#f2d13c'; ctx.lineWidth = 3;
    rc_diamond(ctx, px, py, TW, TH); ctx.stroke();
  }
  // closed banner
  if (s.closed) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(RCV.W / 2 - 170, 60, 340, 44);
    ctx.fillStyle = '#f2d13c'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CLOSED: all staff are resting', RCV.W / 2, 87);
  }
}
