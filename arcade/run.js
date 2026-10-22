/* Island to Sweden. The two of them run hand in hand from the beach on Roatán,
   through San Francisco, into the Småland countryside, and finish under the
   mirror ball at Rösås. Tap to jump, tap again in the air to jump higher. */

(() => {
  'use strict';
  const D = window.Dots, { rgb, rgba, PAL, hash } = D;

  const LEVELS = [
    { name: 'Roatán', p: 0.5, speed: 40, kinds: ['crab', 'coconut', 'iguana', 'crab'] },
    { name: 'San Francisco', p: 0.7, speed: 46, kinds: ['cone', 'hydrant', 'robotaxi', 'cone'] },
    { name: 'Småland', p: 0.94, speed: 52, kinds: ['rock', 'shroom', 'moose', 'hay', 'shroom'] }
  ];
  const LEVEL_T = 24;           // seconds per place
  const GRAV = 430, JUMP = 150, JUMP2 = 128;

  const SPR = {
    crab:     { rows: ['.#...#.', '##.#.##', '.#####.', '#.#.#.#'], map: { '#': [236, 70, 50] } },
    coconut:  { rows: ['.##.', '#hh#', '####', '.##.'], map: { '#': [110, 70, 40], h: [150, 100, 60] } },
    iguana:   { rows: ['......##.', '.#######e', '#..#..#..', '.........'], map: { '#': [70, 180, 80], e: [20, 20, 20] } },
    cone:     { rows: ['.#.', '.w.', '###', '#w#', '###', '#####'.slice(0, 3)], map: { '#': PAL.orange, w: [255, 255, 255] } },
    hydrant:  { rows: ['.##.', '####', '#..#'.replace(/\./g, '#'), '.##.', '.##.', '####'], map: { '#': [220, 40, 50] } },
    robotaxi: { rows: ['.....ss......', '....####.....', '..#gggggg#...', '.#ggggggggg#.', '#############', '#############', '.oo.......oo.'], map: { '#': [244, 244, 250], g: [80, 120, 170], s: PAL.lime, o: [30, 30, 40] } },
    rock:     { rows: ['..###.', '.#####', '######', '######'], map: { '#': [150, 150, 164] } },
    shroom:   { rows: ['.###.', '#w#w#', '#####', '..w..', '..w..'], map: { '#': [230, 40, 40], w: [255, 255, 255] } },
    hay:      { rows: ['########', '#y#y#y##', '########', '##y#y#y#', '########', '########'], map: { '#': [230, 180, 70], y: [190, 140, 40] } },
    moose:    { rows: ['#.#..#.#....', '###..###....', '.######.....', '..####......', '..#####.....', '..########..', '...#########', '...#########', '...########.', '...#.#..#.#.', '...#.#..#.#.', '...#.#..#.#.', '...#.#..#.#.'], map: { '#': [120, 80, 50] } }
  };

  let S = null;

  /* ---------- the three places ---------- */
  // what goes by in front of the landscape (art.js draws the sky, the hills and the lake): the ground
  // underfoot, and a few things along the shore
  function placeScene(g, w, h, lv, scroll, t) {
    const gy = Math.round(h * 0.8), hz = Math.round(h * 0.58);
    if (lv === 0) {
      for (let i = 0; i < 4; i++) {           // palms going by
        const x = ((i * 47 - scroll * 0.5) % (w + 40) + w + 40) % (w + 40) - 20;
        palmSmall(g, x, gy, h * 0.24, t + i * 900);
      }
      D.grad(g, 0, gy, w, h, D.day ? [[252, 226, 180], [236, 196, 140]] : [[240, 196, 130], [190, 130, 90]]);
      g.fillStyle = rgba([255, 252, 248], 0.9);
      for (let x = 0; x < w; x++) if (Math.sin((x + scroll) * 0.4 + t * 0.002) > 0.3) g.fillRect(x, gy - 1, 1, 1);   // foam on the sand
    } else if (lv === 1) {
      bridge(g, w, h, hz + 2, scroll * 0.3);
      D.grad(g, 0, gy, w, h, D.day ? [[120, 116, 140], [90, 86, 110]] : [[96, 86, 120], [60, 50, 84]]);
      for (let x = 0; x < w; x++) if (((x + scroll) | 0) % 12 < 5) { g.fillStyle = rgb([255, 214, 90]); g.fillRect(x, gy + Math.round((h - gy) * 0.5), 1, 1); }
    } else {
      for (let i = 0; i < 3; i++) {           // red cottages with white trim
        const x = ((i * 70 + 20 - scroll * 0.3) % (w + 60) + w + 60) % (w + 60) - 30;
        cottage(g, x, hz + 4, h * 0.07);
      }
      for (let i = 0; i < 9; i++) {           // birches
        const x = ((i * 23 - scroll * 0.6) % (w + 30) + w + 30) % (w + 30) - 15;
        birch(g, x, gy, h * (0.2 + hash(i) * 0.1));
      }
      D.grad(g, 0, gy, w, h, D.day ? [[110, 190, 110], [70, 150, 90]] : [[70, 160, 70], [30, 100, 60]]);
      for (let i = 0; i < 14; i++) { const x = ((i * 13 - scroll) % w + w) % w; g.fillStyle = rgb(i % 2 ? [255, 255, 255] : [255, 220, 80]); g.fillRect(x | 0, gy + 2 + (i % 3), 1, 1); }
    }
  }

  function palmSmall(g, x, gy, hh, t) {
    const lean = 0.25;
    for (let i = 0; i < hh; i++) { g.fillStyle = rgb(D.light ? [130, 90, 60] : [150, 100, 70]); g.fillRect(Math.round(x + i * lean * (i / hh)), Math.round(gy - i), 1, 1); }
    const tx = x + hh * lean, ty = gy - hh;
    g.fillStyle = rgb(D.light ? PAL.teal : [60, 190, 90]);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI + f * Math.PI / 4 + Math.sin(t * 0.002 + f) * 0.05;
      for (let i = 0; i < hh * 0.35; i++) g.fillRect(Math.round(tx + Math.cos(a) * i), Math.round(ty + Math.sin(a) * i + i * i * 0.04), 1, 1);
    }
  }
  function bridge(g, w, h, wy, off) {
    const col = D.light ? [214, 70, 50] : [240, 96, 50];
    const span = 120, x0 = ((-off) % span + span) % span - span;
    for (let base = x0; base < w + span; base += span) {
      const t1 = base + 20, t2 = base + 80, top = wy - h * 0.3, deck = wy - h * 0.07;
      g.fillStyle = rgb(col);
      [t1, t2].forEach(tx => { g.fillRect(Math.round(tx), Math.round(top), 2, Math.round(wy - top)); g.fillRect(Math.round(tx) - 1, Math.round(top + 3), 4, 1); g.fillRect(Math.round(tx) - 1, Math.round(top + (wy - top) * 0.45), 4, 1); });
      g.fillRect(Math.round(base - 10), Math.round(deck), span + 20, 1);
      for (let x = 0; x <= 60; x++) {             // the cables
        const k = x / 60, yy = top + 1 + (deck - top - 1) * (1 - 4 * k * (1 - k)) * 0.98;
        g.fillRect(Math.round(t1 + 1 + x), Math.round(yy), 1, 1);
        if (x % 5 === 0) g.fillRect(Math.round(t1 + 1 + x), Math.round(yy), 1, Math.max(0, Math.round(deck - yy)));
      }
      for (let x = 0; x < 30; x++) { const yy = top + 1 + (deck - top) * Math.pow(x / 30, 1.4); g.fillRect(Math.round(t1 - x), Math.round(yy), 1, 1); g.fillRect(Math.round(t2 + 2 + x), Math.round(yy), 1, 1); }
    }
  }
  function cottage(g, x, gy, s) {
    const red = D.light ? [178, 40, 34] : PAL.falu, white = [250, 246, 240];
    g.fillStyle = rgb(red); g.fillRect(Math.round(x), Math.round(gy - s), Math.round(s * 1.6), Math.round(s));
    g.fillStyle = rgb(D.light ? [60, 50, 60] : [40, 30, 50]);
    for (let i = 0; i < s * 0.6; i++) g.fillRect(Math.round(x - 1 + i), Math.round(gy - s - i), Math.max(1, Math.round(s * 1.6 + 2 - i * 2)), 1);
    g.fillStyle = rgb(white); g.fillRect(Math.round(x + s * 0.3), Math.round(gy - s * 0.65), 2, 2); g.fillRect(Math.round(x + s * 1.0), Math.round(gy - s * 0.65), 2, 2);
    g.fillRect(Math.round(x), Math.round(gy - s), 1, Math.round(s)); g.fillRect(Math.round(x + s * 1.6) - 1, Math.round(gy - s), 1, Math.round(s));
  }
  function birch(g, x, gy, hh) {
    for (let i = 0; i < hh; i++) { g.fillStyle = rgb(i % 5 === 2 ? [40, 34, 40] : PAL.birch); g.fillRect(Math.round(x), Math.round(gy - i), 1, 1); }
    g.fillStyle = rgb(D.light ? [90, 170, 90] : [80, 180, 70]);
    for (let i = 0; i < 18; i++) g.fillRect(Math.round(x - 3 + hash(i * 3 + x) * 7), Math.round(gy - hh - 2 + hash(i * 7 + x) * hh * 0.45), 1, 1);
  }

  function arch(g, x, gy, h, t) {
    const hh = h * 0.42, white = [250, 248, 255];
    g.fillStyle = rgb(white);
    g.fillRect(Math.round(x - 14), Math.round(gy - hh), 2, Math.round(hh)); g.fillRect(Math.round(x + 12), Math.round(gy - hh), 2, Math.round(hh));
    for (let i = -16; i <= 16; i++) { const yy = gy - hh - 4 * Math.cos(i / 16 * Math.PI / 2); g.fillRect(Math.round(x + i), Math.round(yy), 1, 2); }
    const fl = [[255, 255, 255], [255, 120, 160], [214, 34, 74], [255, 200, 220], [120, 200, 90]];
    for (let i = 0; i < 26; i++) { g.fillStyle = rgb(fl[i % 5]); g.fillRect(Math.round(x - 15 + hash(i) * 30), Math.round(gy - hh - 5 + hash(i * 3) * 4), 1, 1); }
    for (let i = 0; i < 16; i++) { g.fillStyle = rgb(fl[(i + 2) % 5]); g.fillRect(Math.round(x + (i < 8 ? -14 : 12) + hash(i * 5) * 3 - 0.5), Math.round(gy - hh * hash(i * 9)), 1, 1); }
    D.mirrorBall(g, x, gy - hh + 6, Math.max(3, h * 0.05), t, false);
    g.fillStyle = rgb(PAL.silver); g.fillRect(Math.round(x), Math.round(gy - hh - 2), 1, 4);
  }

  function hudAll(api) {
    api.hud('<span class="chip lives" aria-label="' + S.lives + ' lives">' + '♥'.repeat(Math.max(0, S.lives)) + '<span style="opacity:.3">' + '♥'.repeat(3 - Math.max(0, S.lives)) + '</span></span><span class="chip">♡ ' + S.hearts + '</span>');
  }
  function stripAll(api) {
    api.strip.innerHTML = LEVELS.map((l, i) => '<span class="tick' + (i <= S.lv ? ' on' : '') + '"><span class="box">' + (i < S.lv || S.done ? '✓' : '') + '</span>' + l.name + '</span>').join('') + '<span class="tick' + (S.done ? ' on' : '') + '"><span class="box">' + (S.done ? '✓' : '') + '</span>Rösås</span>';
  }

  function jump(api) {
    if (!api.running || S.done || S.over) return;
    if (S.onGround) { S.vy = -JUMP; S.onGround = false; S.jumps = 1; }
    else if (S.jumps < 2) { S.vy = -JUMP2; S.jumps = 2; }
  }

  function fresh(w, h) {
    return { lv: 0, t: 0, scroll: 0, y: 0, vy: 0, onGround: true, jumps: 0, obs: [], pick: [], next: 60, lives: 3, hit: -9, hearts: 0, done: false, arrive: null, fade: 0 };
  }

  const game = {
    id: 'run', name: 'Island to Sweden', kicker: 'Game 4',
    blurb: 'Run from Roatán through San Francisco to Rösås.',
    how: 'Tap to jump, tap again in the air to jump higher. Collect hearts, dodge crabs, robotaxis and moose, and make it to Rösås.',
    better: 'high', disco: false,
    sceneAt: () => S ? LEVELS[S.lv].p : LEVELS[0].p,
    fmt: v => v + ' ♡',

    thumb(g, w, h, t) {
      placeScene(g, w, h, 1, 40, t);
      const gy = Math.round(h * 0.8), u = h / 112;
      D.sprite(g, SPR.cone.rows, w * 0.78, gy - SPR.cone.rows.length, SPR.cone.map);
      D.pixelHeart(g, w * 0.6, gy - 22, false, D.HEART_COLS[0]);
      Bebs.andrea(g, w * 0.3, gy - 4, u, { pose: 'jump', t: 1 });
      Bebs.lonis(g, w * 0.3 + 9 * u, gy - 4, u, { pose: 'jump', t: 1 });
    },

    setup(api) { S = fresh(api.st.w, api.st.h); hudAll(api); stripAll(api); },
    start(api) { S = fresh(api.st.w, api.st.h); hudAll(api); stripAll(api); },

    update(dt, api) {
      if (S.over) return;
      const w = api.st.w, h = api.st.h, gy = Math.round(h * 0.8), u = h / 112;
      S.t += dt;
      const lv = Math.min(2, Math.floor(S.t / LEVEL_T));
      if (lv !== S.lv) { S.lv = lv; S.fade = 1; api.toast(LEVELS[lv].name, w * 0.5, h * 0.3, 'big warm'); stripAll(api); }
      S.fade = Math.max(0, S.fade - dt * 0.8);
      const speed = (S.done ? 0 : LEVELS[S.lv].speed + (S.t % LEVEL_T) * 0.25) * Math.max(1, w / 72);
      S.scroll += speed * dt;

      // jumping
      if (!S.onGround) { S.vy += GRAV * dt; S.y += S.vy * dt; if (S.y >= 0) { S.y = 0; S.vy = 0; S.onGround = true; S.jumps = 0; } }

      // the road ahead
      const finishing = S.t >= LEVEL_T * 3;
      if (!finishing) {
        S.next -= speed * dt;
        if (S.next <= 0) {
          const kinds = LEVELS[S.lv].kinds;
          const k = kinds[(Math.random() * kinds.length) | 0];
          const spr = SPR[k];
          S.obs.push({ k, x: w + 4, w: spr.rows[0].length, h: spr.rows.length, vx: k === 'coconut' ? -12 : k === 'crab' ? (Math.random() < 0.5 ? -6 : 6) : 0 });
          // hearts: a little arc over it, or a line along the ground
          const n = 3 + ((Math.random() * 3) | 0), arcUp = Math.random() < 0.6;
          for (let i = 0; i < n; i++) S.pick.push({ x: w + 4 + spr.rows[0].length / 2 + (i - (n - 1) / 2) * 7 + (arcUp ? 0 : 40), y: arcUp ? gy - spr.rows.length - 10 - Math.sin((i + 0.5) / n * Math.PI) * 10 : gy - 6 });
          S.next = 52 + Math.random() * 46 + speed * 0.4 + (k === 'moose' || k === 'robotaxi' ? 22 : 0);
        }
      } else if (!S.arrive) S.arrive = { x: w + 30 };

      const px = Math.round(w * 0.24), feet = gy + S.y;
      const box = { l: px - 7 * u, r: px + 9 * u, t: feet - 27 * u, b: feet };
      for (const o of S.obs) {
        o.x -= speed * dt - o.vx * dt * (S.done ? 0 : 1);
        const ob = { l: o.x + 1, r: o.x + o.w - 1, t: gy - o.h + 1, b: gy };
        if (!o.hit && S.t - S.hit > 1.4 && box.r > ob.l && box.l < ob.r && box.b > ob.t && box.t < ob.b) {
          o.hit = true; S.hit = S.t; S.lives--; api.buzz(40); hudAll(api);
          const ouch = { crab: 'pinched!', coconut: 'bonk', iguana: 'iguana!', cone: 'oops', hydrant: 'splash', robotaxi: 'it had right of way', rock: 'ow', shroom: "don't eat that", moose: 'älg!', hay: 'hay!' }[o.k];
          api.toast(ouch, px, feet - 30 * u, 'flag');
          if (S.lives <= 0) {
            S.over = true;
            api.end({ title: 'Missed the flight', text: 'There’s always another one. The wedding will wait for you.', score: S.hearts, scoreText: S.hearts + ' hearts on the way', counts: true });
          }
        }
      }
      for (const p of S.pick) {
        p.x -= speed * dt;
        if (!p.got && Math.abs(p.x - (box.l + box.r) / 2) < 9 * u + 2 && p.y > box.t - 3 && p.y < box.b + 2) { p.got = true; S.hearts++; hudAll(api); }
      }
      S.obs = S.obs.filter(o => o.x > -20);
      S.pick = S.pick.filter(p => p.x > -8 && !p.got);

      if (S.arrive && !S.done) {
        S.arrive.x -= speed * dt;
        if (S.arrive.x <= px + 2) {
          S.done = true; S.arrive.x = px + 2; S.doneAt = S.t;
          stripAll(api);
          api.toast('Rösås!', w * 0.5, h * 0.3, 'big');
          api.buzz(30);
          const total = S.hearts + 25;
          api.end({ title: 'Welcome to Rösås', text: 'June 12, 2027. You made it all the way from Roatán, with ' + S.hearts + ' hearts and a bonus for arriving.', score: total, scoreText: total + ' hearts', delay: 2200 });
        }
      }
    },

    draw(api, now) {
      const g = api.st.g, w = api.st.w, h = api.st.h, gy = Math.round(h * 0.8), u = h / 112;
      placeScene(g, w, h, S.lv, S.scroll, now);
      if (S.arrive) arch(g, S.arrive.x, gy, h, now);
      for (const p of S.pick) D.pixelHeart(g, p.x, p.y + Math.sin(now * 0.005 + p.x) * 0.8, false, D.HEART_COLS[0]);
      for (const o of S.obs) {
        const spr = SPR[o.k], flip = o.k === 'iguana' || o.k === 'moose';
        let rows = spr.rows;
        if (o.k === 'robotaxi' && Math.floor(now / 150) % 2) rows = rows.map((r, i) => i === 0 ? r.replace('ss', 's.') : r);
        D.sprite(g, rows, o.x, gy - rows.length + (o.k === 'crab' && Math.floor(now / 120) % 2 ? -1 : 0), spr.map, !flip);
      }
      const px = Math.round(w * 0.24), feet = gy + S.y;
      const blink = S.t - S.hit < 1.4 && Math.floor(S.t * 12) % 2 === 0 && api.running;
      if (!blink) {
        const air = !S.onGround, ph = S.scroll * 0.22;
        const pose = S.done ? 'hold' : air ? 'jump' : 'run';
        Bebs.andrea(g, px - 4 * u, feet, u, { pose, phase: ph, t: now / 1000, face: S.done ? 'grin' : 'smile', fit: { top: 'crop-white', bottom: 'lowrise' } });
        Bebs.lonis(g, px + 5 * u, feet, u, { pose: S.done ? 'hold' : pose, phase: ph + Math.PI, t: now / 1000, face: 'grin', flip: S.done, fit: S.lv === 0 ? { top: 'white', bottom: 'shorts' } : {} });
      }
    },

    down(p, api) { if (api.running && !api.paused) jump(api); },
    key(e, api) { if (e.type === 'keydown' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) { e.preventDefault(); jump(api); } }
  };

  Arcade.add(game);
})();
