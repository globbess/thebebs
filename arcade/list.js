/* The List. Andrea prayed for her person every day, with a very specific list.
   Catch everything on it, dodge the red flags. Check every box and Lonis drops
   in from the sky. Scored on time: the faster, the better. */

(() => {
  'use strict';
  const T = s => (window.tr ? window.tr(s) : s);   // lang.js
  const D = window.Dots, { rgb, rgba, PAL } = D;

  const TRAITS = [
    { k: 'curls', label: 'curly hair' },
    { k: 'tall', label: 'tall' },
    { k: 'nerd', label: 'tech nerd' },
    { k: 'kind', label: 'kind' },
    { k: 'funny', label: 'makes me laugh' },
    { k: 'adv', label: 'loves adventures' }
  ];
  const FLAGS = ["replies 'k'", 'no passport', 'hates dancing', 'allergic to fun', "doesn't do brunch", 'ghosts', 'bad vibes', 'skips leg day', 'no curls'];

  const ICONS = {
    curls: ['..###..', '.#...#.', '#..#..#', '#.#.#.#', '#..##.#', '.#...#.', '..###..'],
    tall:  ['...#...', '..###..', '.#####.', '...#...', '...#...', '..###..', '...#...'],
    nerd:  ['.......', '.#####.', '.#ooo#.', '.#ooo#.', '.#####.', '#######', '.......'],
    kind:  ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
    funny: ['.#####.', '#######', '##d#d##', '#######', '#d###d#', '##ddd##', '.#####.'],
    adv:   ['...#...', '...#...', '.#####.', '#######', '...#...', '..###..', '...#...'],
    flag0: ['p####..', 'p#####.', 'p####..', 'p......', 'p......', 'p......', 'p......'],
    flag1: ['p###...', 'p######', 'p#####.', 'p......', 'p......', 'p......', 'p......']
  };
  const iconMap = k => ({
    curls: { '#': D.light ? [120, 70, 44] : [196, 128, 86] },
    tall:  { '#': PAL.gold },
    nerd:  { '#': PAL.silver, o: PAL.lime },
    kind:  { '#': PAL.pink },
    funny: { '#': [255, 214, 60], d: [90, 50, 20] },
    adv:   { '#': D.light ? [70, 140, 230] : [190, 226, 255] },
    flag:  { '#': [240, 34, 48], p: D.light ? [90, 70, 70] : [210, 196, 220] }
  }[k]);

  let S = null;   // the round

  // the beach in front of the landscape: sand from just below the lake line, and a palm
  function scene(g, w, h, t) {
    const sand = Math.round(h * 0.82);
    D.grad(g, 0, sand, w, h, D.light && D.day ? [[252, 224, 176], [236, 190, 130]] : [[236, 180, 120], [170, 110, 80]]);
    for (let i = 0; i < 40; i++) { g.fillStyle = rgba([255, 240, 210], 0.6); g.fillRect((D.hash(i * 3.1) * w) | 0, sand + 2 + (D.hash(i * 1.9) * (h - sand - 2)) | 0, 1, 1); }
    // a little foam where the sand meets the water
    g.fillStyle = rgba([255, 252, 248], 0.85);
    for (let x = 0; x < w; x++) if (Math.sin(x * 0.45 + t * 0.002) > 0.2) g.fillRect(x, sand - 1, 1, 1);
    palm(g, Math.round(w * 0.08), sand + 2, h * 0.26, t);
  }

  function palm(g, x, y, hh, t) {
    const trunk = D.light ? [140, 96, 60] : [150, 100, 70];
    for (let i = 0; i < hh; i++) {
      const k = i / hh, px = x + Math.sin(k * 1.4) * hh * 0.28;
      g.fillStyle = rgb(i % 3 === 0 ? D.mix(trunk, [60, 40, 30], 0.3) : trunk);
      g.fillRect(Math.round(px) - 1, Math.round(y - i), 2, 1);
    }
    const tx = x + Math.sin(1.4) * hh * 0.28, ty = y - hh;
    const leaf = D.light ? PAL.teal : [60, 190, 90];
    for (let f = 0; f < 6; f++) {
      const a = -Math.PI * 0.95 + f * Math.PI * 0.38 + Math.sin(t * 0.0015 + f) * 0.06;
      for (let i = 0; i < hh * 0.42; i++) {
        const px = tx + Math.cos(a) * i, py = ty + Math.sin(a) * i + (i * i) * 0.035;
        g.fillStyle = rgb(leaf);
        g.fillRect(Math.round(px), Math.round(py), 1, 2);
        if (i > 1 && i < hh * 0.36) g.fillRect(Math.round(px), Math.round(py) + 2, 1, 1);
      }
    }
    g.fillStyle = rgb([110, 70, 40]);
    g.fillRect(Math.round(tx) - 1, Math.round(ty) + 1, 2, 2);
  }

  function drawItem(g, it, t) {
    // their own size, with a dark line round them (like Island to Sweden), so they read at a glance
    if (it.kind === 'flag') D.spriteBig(g, ICONS[(Math.floor(t / 180) + (it.seed * 4 | 0)) % 2 ? 'flag0' : 'flag1'], it.x - 3, it.y - 3, iconMap('flag'), false, 1);
    else D.spriteBig(g, ICONS[it.k], it.x - 3, it.y - 3, iconMap(it.k), false, 1);
  }

  function renderStrip(api) {
    api.strip.innerHTML = TRAITS.map(it => '<span class="tick" data-k="' + it.k + '"><span class="box"></span>' + T(it.label) + '</span>').join('');
  }
  function check(api, k) {
    const n = api.strip.querySelector('[data-k="' + k + '"]');
    if (!n) return;
    n.classList.add('on', 'pop');
    n.querySelector('.box').textContent = '✓';
  }
  function hud(api) {
    const s = Math.floor(S.won ? S.winT : S.t), m = Math.floor(s / 60);
    api.hud('<span class="chip lives" aria-label="' + T(S.lives + ' lives') + '">' + '♥'.repeat(S.lives) + '<span style="opacity:.3">' + '♥'.repeat(3 - S.lives) + '</span></span><span class="chip">' + m + ':' + String(s % 60).padStart(2, '0') + '</span>');
  }

  const game = {
    id: 'list', name: 'The List', kicker: 'Game 7',
    blurb: 'Catch every box on her list. Dodge the red flags.',
    how: 'Andrea prayed for her person with a very specific list. Drag to move her. Catch everything on the list and dodge the red flags.',
    better: 'low', scene: 0.64, disco: false,            // the sun going down into the Caribbean
    fmt: s => Math.floor(s / 60) + ':' + String(Math.floor(s) % 60).padStart(2, '0'),

    thumb(g, w, h, t) {
      scene(g, w, h, t);
      D.spriteBig(g, ICONS.kind, w * 0.55, h * 0.2, iconMap('kind'), false, 1);
      D.spriteBig(g, ICONS.flag0, w * 0.28, h * 0.36, iconMap('flag'), false, 1);
      D.spriteBig(g, ICONS.curls, w * 0.75, h * 0.46, iconMap('curls'), false, 1);
      Bebs.andrea(g, w * 0.58, h - 2, h / 40, { pose: 'up', t: 1, face: 'smile' });
    },

    setup(api) {
      S = { idle: true, x: api.st.w / 2, tx: api.st.w / 2, items: [], lives: 3, got: new Set(), t: 0, spawn: 0, hit: -9, yay: -9, won: false, lonis: null, keys: {} };
      renderStrip(api);
      hud(api);
    },

    start(api) {
      const w = api.st.w;
      S = { idle: false, x: w / 2, tx: w / 2, items: [], lives: 3, got: new Set(), t: 0, spawn: 0.6, hit: -9, yay: -9, won: false, lonis: null, keys: {}, flagN: 0 };
      renderStrip(api);
      hud(api);
    },

    update(dt, api) {
      if (S.over) return;
      const w = api.st.w, h = api.st.h;
      S.t += dt;
      const u = h / 104, feet = h - 3, hands = feet - 21 * u;
      // move towards the finger (or the arrow keys)
      if (S.keys.left) S.tx = S.x - 6;
      if (S.keys.right) S.tx = S.x + 6;
      S.tx = D.clamp(S.tx, 5, w - 5);
      const sp = 70 * dt * Math.max(1, w / 64);
      S.x += D.clamp(S.tx - S.x, -sp, sp);

      if (!S.won) {
        // new things falling
        S.spawn -= dt;
        if (S.spawn <= 0) {
          const pace = Math.min(1, S.t / 50);
          S.spawn = 0.95 - pace * 0.45 + Math.random() * 0.25;
          const missing = TRAITS.filter(tr => !S.got.has(tr.k));
          const flag = Math.random() < 0.42 + pace * 0.12;
          let it;
          if (flag) it = { kind: 'flag', label: FLAGS[S.flagN++ % FLAGS.length] };
          else { const pool = Math.random() < 0.75 && missing.length ? missing : TRAITS; const tr = pool[(Math.random() * pool.length) | 0]; it = { kind: 'trait', k: tr.k, label: tr.label }; }
          it.x = 5 + Math.random() * (w - 10); it.y = -5; it.vy = (h * 0.16) * (1 + pace * 0.9) * (0.85 + Math.random() * 0.3); it.seed = Math.random();
          if (flag && Math.random() < 0.35) it.x = D.clamp(S.x + (Math.random() - 0.5) * 14, 5, w - 5);   // some aim for her
          S.items.push(it);
        }
      }
      for (const it of S.items) {
        it.y += it.vy * dt;
        if (it.gone) continue;
        if (Math.abs(it.x - S.x) < 7 && it.y > hands - 5 && it.y < hands + 8) {
          it.gone = true;
          if (it.kind === 'flag') {
            if (S.t - S.hit < 0.8 || S.won) continue;
            S.lives--; S.hit = S.t;
            api.toast('🚩 ' + it.label, it.x, it.y - 6, 'flag');
            api.buzz(40);
            hud(api);
            if (S.lives <= 0) {
              S.over = true;
              api.end({ title: 'Back to praying', text: 'Too many red flags. The right one is still out there, curly hair and all.', counts: false, scoreText: S.got.size + ' of 6 boxes checked' });
            }
          } else {
            S.yay = S.t;
            if (!S.got.has(it.k)) { S.got.add(it.k); check(api, it.k); api.toast('✓ ' + it.label, it.x, it.y - 6); api.buzz(12); }
            else api.toast('already checked', it.x, it.y - 6, 'warm');
            if (S.got.size === TRAITS.length) win(api);
          }
        }
      }
      S.items = S.items.filter(it => !it.gone && it.y < h + 16);
      if (S.lonis) {
        const L = S.lonis;
        if (!L.landed) { L.vy += 160 * dt; L.y += L.vy * dt; if (L.y >= feet) { L.y = feet; L.landed = S.t; api.buzz(30); api.toast('every box checked', S.x, h * 0.45, 'big'); } }
      }
      hud(api);
    },

    draw(api, now) {
      const g = api.st.g, w = api.st.w, h = api.st.h, t = now;
      scene(g, w, h, t);
      const u = h / 104, feet = h - 3;
      if (S.won && S.lonis && S.lonis.landed) {
        const k = Math.min(1, (S.t - S.lonis.landed) / 0.8);
        D.mirrorBall(g, w * 0.5, h * 0.12 * k + 1, Math.max(3, w * 0.07), t, true);
      }
      for (const it of S.items) drawItem(g, it, t);
      const hurt = S.t - S.hit < 0.8, happy = S.t - S.yay < 0.5;
      const blink = hurt && Math.floor(S.t * 12) % 2 === 0;
      if (S.lonis) {
        const L = S.lonis, lx = S.x + 10 * u > w - 6 ? S.x - 10 * u : S.x + 10 * u;
        Bebs.lonis(g, lx, L.y, u, { pose: L.landed ? 'hold' : 'out', t: t / 1000, face: 'grin', flip: lx < S.x });
        Bebs.andrea(g, S.x, feet, u, { pose: L.landed ? 'hold' : 'up', t: t / 1000, face: L.landed ? 'grin' : 'wow', flip: lx < S.x });
        if (L.landed) {
          for (let i = 0; i < 6; i++) {
            const a = ((t / 1000 - i * 0.4) % 2.4) / 2.4;
            D.pixelHeart(g, (S.x + lx) / 2 + Math.sin(i * 2.1 + a * 4) * 6, feet - 30 * u - a * h * 0.4, i % 2 === 0, D.HEART_COLS[i % 3], 1 - a);
          }
        }
      } else if (!blink) {
        Bebs.andrea(g, S.x, feet, u, { pose: 'up', t: t / 1000, face: hurt ? 'sad' : happy ? 'grin' : 'smile' });
      }
    },

    down(p) { S.tx = p.x; },
    move(p, api, e) { if (e.buttons || e.pointerType === 'touch') S.tx = p.x; },
    key(e) {
      const on = e.type !== 'keyup';
      if (e.key === 'ArrowLeft') S.keys.left = on;
      if (e.key === 'ArrowRight') S.keys.right = on;
    }
  };

  function win(api) {
    S.won = true; S.winT = S.t;
    S.items.forEach(it => { if (it.kind === 'flag') it.gone = true; });
    S.lonis = { y: -30, vy: 0, landed: 0 };
    api.end({ title: 'She wasn’t delusional', text: 'Every box checked, curly hair included. Then he fell out of the sky.', score: S.t, scoreText: 'done in ' + game.fmt(S.t), delay: 2600 });
  }

  // arrow keys need key-up too
  window.addEventListener('keyup', e => { if (S && S.keys) { if (e.key === 'ArrowLeft') S.keys.left = false; if (e.key === 'ArrowRight') S.keys.right = false; } });

  Arcade.add(game);
})();
