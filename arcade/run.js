/* Island to Sweden. The two of them run hand in hand from the beach on Roatán,
   through San Francisco and Stockholm, and finish under the mirror ball at Rösås.
   Tap to jump, tap again in the air to jump higher. */

(() => {
  'use strict';
  const D = window.Dots, { rgb, rgba, PAL, hash } = D;

  const LEVELS = [
    { name: 'Roatán', p: 0.5, speed: 40, kinds: ['crab', 'coconut', 'iguana', 'crab'] },
    { name: 'San Francisco', p: 0.7, speed: 46, kinds: ['cone', 'hydrant', 'robotaxi', 'cone'] },
    { name: 'Stockholm', p: 0.94, speed: 52, kinds: ['scooter', 'bike', 'dala', 'scooter'] }
  ];
  const LEVEL_T = 24;           // seconds per place
  const GRAV = 470, JUMP = 175, JUMP2 = 150;
  // the things on the road are drawn two dots to a pixel, with a dark line round them, so they read
  const SC = 2, INSET = 2, EDGE = [22, 12, 34];

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
    moose:    { rows: ['#.#..#.#....', '###..###....', '.######.....', '..####......', '..#####.....', '..########..', '...#########', '...#########', '...########.', '...#.#..#.#.', '...#.#..#.#.', '...#.#..#.#.', '...#.#..#.#.'], map: { '#': [120, 80, 50] } },
    // Stockholm: an e-scooter left on the pavement, a city bike, a Dala horse
    scooter:  { rows: ['.....hh.', '......#.', '......#.', '......#.', '.....#..', '#######.', 'o.....o.'], map: { '#': [126, 206, 70], h: [40, 36, 48], o: [70, 66, 84] } },   // someone else's, green
    bike:     { rows: ['....ss.hh.', '.....#.#..', '...#####..', '.oo#..#oo.', 'o..o##o..o', 'o..o..o..o', '.oo....oo.'], map: { '#': [52, 130, 210], s: [40, 36, 48], h: [40, 36, 48], o: [110, 106, 124] } },
    dala:     { rows: ['..##.....', '.###.....', '####.....', '..##.....', '..#######', '..#y#g#y#', '..#######', '..##...##', '..##...##'], map: { '#': [204, 34, 44], y: [255, 214, 90], g: [90, 170, 90] } }
  };
  // the Australian shepherd waiting at Rösås: red tri like ours (chocolate, the white blaze, copper cheeks,
  // pale blue eyes, tongue out), sitting, facing you
  const DOG = { rows: ['.bb.......bb.', 'bbbb.....bbbb', 'bbbbbbwbbbbbb', '.bbbbbwbbbbb.', '.bebtbwbtbeb.', '.bbbbwwwbbbb.', '..bbwwnwwbb..', '..bwwwpwwwb..', '...wwwpwww...', '..bwwwwwwwb..', '.bbwwwwwwwbb.', '.bbbwwwwwbbb.', '.bbbwwwwwbbb.', '.bb.w...w.bb.', '.bbww...wwbb.'],
    map: { b: [124, 66, 40], w: [250, 246, 240], t: [214, 146, 84], e: [160, 214, 244], n: [56, 34, 30], p: [242, 128, 150] } };
  const FACING = { iguana: 1, moose: 1, scooter: 1, bike: 1, dala: 1 };   // drawn the way they're written

  function spriteBig(g, rows, x, y, map, flip, sc) {
    const SC = sc || 2;   // (shadows the module's SC: a sprite can be drawn at its own scale)
    const w = rows[0].length, X = Math.round(x), Y = Math.round(y);
    const at = (j, k) => map[rows[j][flip ? w - 1 - k : k]];
    g.fillStyle = rgb(EDGE);                                  // the line round it first
    for (let j = 0; j < rows.length; j++) for (let k = 0; k < w; k++) if (at(j, k)) g.fillRect(X + k * SC - 1, Y + j * SC - 1, SC + 2, SC + 2);
    for (let j = 0; j < rows.length; j++) for (let k = 0; k < w; k++) { const c = at(j, k); if (c) { g.fillStyle = typeof c === 'string' ? c : rgb(c); g.fillRect(X + k * SC, Y + j * SC, SC, SC); } }
  }

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
    } else if (lv === 2) {
      gamlaStan(g, w, h, hz + 2, scroll);    // the old town across the water, windows lit
      D.grad(g, 0, gy, w, h, D.day ? [[150, 140, 150], [116, 106, 120]] : [[110, 96, 120], [70, 58, 86]]);
      for (let i = 0; i < 40; i++) {         // cobbles
        const x = ((i * 9.7 - scroll) % w + w) % w, y = gy + 2 + (i * 5) % Math.max(2, Math.round(h - gy - 3));
        g.fillStyle = rgba([220, 210, 228], 0.55); g.fillRect(x | 0, y, 2, 1);
      }
    } else {                                 // Rösås: the Swedish countryside, little red houses and birches
      for (let i = 0; i < 4; i++) {          // far away, across the lake
        const x = ((i * 61 + 20 - scroll * 0.15) % (w + 60) + w + 60) % (w + 60) - 30;
        cottage(g, x, hz + 3, h * 0.045);
      }
      for (let i = 0; i < 9; i++) {
        const x = ((i * 23 - scroll * 0.6) % (w + 30) + w + 30) % (w + 30) - 15;
        birch(g, x, gy, h * (0.2 + hash(i) * 0.1));
      }
      for (let i = 0; i < 2; i++) {          // and close by, along the path
        const x = ((i * 120 + 50 - scroll * 0.8) % (w + 120) + w + 120) % (w + 120) - 60;
        cottage(g, x, gy - 2, h * 0.1);
      }
      D.grad(g, 0, gy, w, h, D.day ? [[110, 190, 110], [70, 150, 90]] : [[70, 160, 70], [30, 100, 60]]);
      for (let i = 0; i < 14; i++) { const x = ((i * 13 - scroll) % w + w) % w; g.fillStyle = rgb(i % 2 ? [255, 255, 255] : [255, 220, 80]); g.fillRect(x | 0, gy + 2 + (i % 3), 1, 1); }   // flowers
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
  // the Golden Gate: two tall International Orange towers (two legs, braced like ladders, standing in the
  // water), the main cable swooping between them down to the deck, side cables to the shore, suspenders
  function bridge(g, w, h, wy, off) {
    const col = D.light ? [204, 62, 44] : [244, 98, 52], dark = D.light ? [140, 40, 32] : [176, 62, 40];
    const span = Math.max(70, Math.round(w * 1.1)), between = Math.round(span * 0.58);
    const top = Math.round(wy - h * 0.36), deck = Math.round(wy - h * 0.08);
    const x0 = ((-off) % span + span) % span - span;
    for (let base = x0; base < w + span; base += span) {
      const t1 = Math.round(base + (span - between) / 2), t2 = t1 + between;
      g.fillStyle = rgb(col);
      g.fillRect(Math.round(base), deck, span + 1, 2);                                   // the road deck
      g.fillStyle = rgb(dark);
      for (let x = Math.round(base); x < base + span; x += 2) g.fillRect(x, deck + 2, 1, 1);   // its truss
      g.fillStyle = rgb(col);
      for (let x = 0; x <= between; x++) {                                               // the main cable
        const k = x / between, yy = Math.round(top + 2 + (deck - 4 - top) * (1 - (2 * k - 1) * (2 * k - 1)));
        g.fillRect(t1 + x, yy, 1, 1);
        if (x % 4 === 0 && yy < deck) { g.fillStyle = rgba(col, 0.45); g.fillRect(t1 + x, yy + 1, 1, deck - yy - 1); g.fillStyle = rgb(col); }
      }
      const side = (t1 - base);                                                          // down to the shore
      for (let x = 0; x <= side; x++) {
        const k = x / side, yy = Math.round(top + 2 + (deck - 1 - top - 2) * k * k);
        g.fillRect(t1 - x, yy, 1, 1); g.fillRect(t2 + x, yy, 1, 1);
        if (x % 4 === 0 && yy < deck) { g.fillStyle = rgba(col, 0.45); g.fillRect(t1 - x, yy + 1, 1, deck - yy - 1); g.fillRect(t2 + x, yy + 1, 1, deck - yy - 1); g.fillStyle = rgb(col); }
      }
      [t1, t2].forEach(tx => {                                                           // the towers
        g.fillStyle = rgb(col);
        g.fillRect(tx - 2, top, 1, wy - top); g.fillRect(tx + 2, top, 1, wy - top);
        g.fillRect(tx - 2, top - 1, 5, 2);
        [0.2, 0.42, 0.64].forEach(f => g.fillRect(tx - 2, Math.round(top + (deck - top) * f), 5, 1));
        g.fillRect(tx - 3, deck + 2, 7, 1);
        g.fillStyle = rgb(dark); g.fillRect(tx - 1, top + 1, 3, 1);
      });
    }
  }

  // Stockholm's old town: tall narrow houses in ochre, rust and yellow, little lit windows, and the
  // iron spire of Riddarholmen behind them
  function gamlaStan(g, w, h, base, scroll) {
    const cols = [[214, 150, 60], [190, 84, 52], [236, 196, 96], [226, 140, 112], [150, 156, 112], [200, 120, 70]];
    const lit = D.day ? [250, 246, 236] : [255, 214, 120];
    const span = w + 60;
    for (let i = 0; i < 2; i++) {
      const x = ((i * span * 0.55 + 40 - scroll * 0.18) % span + span) % span - 20, hh = h * 0.22, tw = 3;
      g.fillStyle = rgb([40, 32, 52]);
      g.fillRect(Math.round(x - 1), Math.round(base - hh * 0.5), tw + 2, Math.round(hh * 0.5));
      for (let k = 0; k < hh * 0.5; k++) { const ww = Math.max(1, Math.round(tw * (1 - k / (hh * 0.5)))); g.fillRect(Math.round(x + (tw - ww) / 2), Math.round(base - hh * 0.5 - k), ww, 1); }
    }
    const unit = Math.max(5, Math.round(h * 0.032)), off = scroll * 0.4, first = Math.floor(off / unit) - 1;
    for (let n = first; n < first + w / unit + 3; n++) {
      const x = Math.round(n * unit - off), hh = Math.round(unit * (1.5 + hash(n * 1.7 + 3) * 1.1)), col = cols[Math.floor(hash(n * 3.1 + 7) * cols.length) % cols.length];
      g.fillStyle = rgb(col); g.fillRect(x, base - hh, unit, hh);
      for (let k = 0; k < Math.ceil(unit / 2); k++) g.fillRect(x + k, base - hh - k, unit - 2 * k, 1);            // the gable
      g.fillStyle = rgb(lit);
      for (let y = base - hh + 3; y < base - 2; y += 3) { if (hash(n * 5 + y) > 0.35) g.fillRect(x + 1, y, 1, 1); if (hash(n * 7 + y) > 0.35) g.fillRect(x + unit - 2, y, 1, 1); }
    }
  }

  // San Francisco: they ride through in a matte black Roadster, top down (the two of them drawn
  // behind it, from the waist up: Bebs o.cut)
  function roadster(g, cx, gy, u) {
    const L = Math.round(34 * u), x0 = Math.round(cx - L / 2), r = Math.max(2, Math.round(2.6 * u));
    const body = D.light ? [30, 28, 34] : [36, 33, 44], rim = D.light ? [92, 88, 104] : [116, 110, 138];
    const deckH = 8 * u, noseH = 5 * u;
    for (let x = 0; x <= L; x++) {                                       // the body: a low wedge, rounded at the back
      const k = x / L, top = k < 0.08 ? deckH * (0.7 + 0.3 * k / 0.08) : k < 0.62 ? deckH : deckH + (noseH - deckH) * ((k - 0.62) / 0.38);
      g.fillStyle = rgb(body); g.fillRect(x0 + x, Math.round(gy - r - top), 1, Math.round(top + r * 0.4));
      g.fillStyle = rgb(rim); g.fillRect(x0 + x, Math.round(gy - r - top), 1, 1);   // a sheen along the top
    }
    g.fillStyle = rgb([150, 170, 200]);                                  // the windscreen, raked back
    for (let i = 0; i < 4 * u; i++) g.fillRect(Math.round(x0 + L * 0.62 - i * 0.6), Math.round(gy - r - deckH - i), 1, 1);
    g.fillStyle = rgb([230, 40, 50]); g.fillRect(x0, Math.round(gy - r - deckH * 0.75), 1, Math.max(1, Math.round(u * 1.4)));   // tail light
    g.fillStyle = rgb([255, 250, 230]); g.fillRect(x0 + L - 1, Math.round(gy - r - noseH * 0.7), 1, 1);                        // headlight
    [x0 + Math.round(6 * u), x0 + L - Math.round(7 * u)].forEach(wx => {  // wheels, silver rims
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        const d = xx * xx + yy * yy;
        if (d > r * r + 0.5) continue;
        g.fillStyle = rgb(d < (r * 0.5) * (r * 0.5) + 0.5 ? [200, 200, 212] : [18, 16, 22]);
        g.fillRect(wx + xx, gy - r + yy, 1, 1);
      }
    });
    return { top: gy - r - deckH };
  }

  // when it jumps, the Roadster flies on its thrusters: jets of cold air blasting down from under it
  // (flickering, fading as they go), and the air kicking up dust where it hits the road
  function thrusters(g, cx, feet, gy, u, now) {
    const len = Math.min(gy - feet + 4, 16 * u);
    [-11, -2, 8].forEach((dx, n) => {
      const x = Math.round(cx + dx * u);
      for (let k = 0; k < len; k++) {
        const fade = 1 - k / len, wob = Math.round(Math.sin(now * 0.05 + k * 0.9 + n) * (k / len) * 1.5);
        g.fillStyle = rgba(k < 4 ? [255, 255, 255] : [196, 232, 255], Math.min(1, fade * (0.85 + 0.25 * Math.sin(now * 0.08 + k + n * 2))));
        const wd = k < len * 0.35 ? 2 : k < len * 0.7 ? 3 : 4;
        g.fillRect(x + wob - (wd >> 1) + 1, Math.round(feet + k), wd, 1);
      }
    });
    const air = gy - feet;
    if (air < 22 * u) {                                                 // close to the road: a puff of dust
      const a = 1 - air / (22 * u);
      for (let i = 0; i < 14; i++) {
        const spread = (i % 2 ? 1 : -1) * (6 + (i * 3.3 + now * 0.03) % (18 * u));
        g.fillStyle = rgba([220, 214, 236], a * 0.55 * (1 - Math.abs(spread) / (24 * u)));
        g.fillRect(Math.round(cx + spread), gy - 1 - (i % 3), 2, 1);
      }
    }
  }

  // Stockholm: the two of them on one pink Voi, Lonis driving, Andrea behind him
  function voi(g, cx, gy, u) {
    const pink = [246, 112, 150], dark = [40, 34, 48], r = Math.max(2, Math.round(1.7 * u));
    const x0 = Math.round(cx - 10 * u), x1 = Math.round(cx + 9 * u), deckY = gy - 2 * r;
    g.fillStyle = rgb(pink); g.fillRect(x0, deckY - 1, x1 - x0, 2);                       // the deck
    g.fillStyle = rgb(dark); g.fillRect(x0 + 1, deckY + 1, x1 - x0 - 2, 1);
    g.fillStyle = rgb(pink);
    for (let i = 0; i < 15 * u; i++) g.fillRect(Math.round(x1 - 1 + i * 0.12), Math.round(deckY - 1 - i), 2, 1);   // the stem
    const topX = Math.round(x1 + 15 * u * 0.12), topY = Math.round(deckY - 1 - 15 * u);
    g.fillStyle = rgb(pink); g.fillRect(topX - Math.round(3 * u), topY, Math.round(4 * u) + 1, 2);              // handlebar
    g.fillStyle = rgb(dark); g.fillRect(topX - Math.round(3 * u), topY, 1, 2);                                   // its grip
    g.fillStyle = rgb([255, 250, 230]); g.fillRect(topX + 1, topY + 2, 1, 1);                                    // its light
    [x0 + r, x1 - 1].forEach(wx => {                                                                            // wheels
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        const d = xx * xx + yy * yy;
        if (d > r * r + 0.5) continue;
        g.fillStyle = rgb(d < 1.5 ? [210, 206, 220] : dark); g.fillRect(wx + xx, gy - r + yy, 1, 1);
      }
    });
    return { feet: deckY - 1 };
  }

  // a little red Swedish house (falu red, white corners and window frames, lit windows, a dark roof)
  function cottage(g, x, gy, s) {
    const red = [214, 58, 46], white = [250, 246, 240], roof = [84, 64, 88], lit = [255, 214, 120];
    const W = Math.round(s * 1.6), H = Math.round(s), X = Math.round(x), Y = Math.round(gy - s);
    g.fillStyle = rgb(red); g.fillRect(X, Y, W, H);
    g.fillStyle = rgb(roof);
    for (let i = 0; i < s * 0.6; i++) g.fillRect(X - 1 + i, Y - 1 - i, Math.max(1, W + 2 - i * 2), 1);
    g.fillStyle = rgb(white);
    g.fillRect(X, Y, 1, H); g.fillRect(X + W - 1, Y, 1, H);                         // the corners
    const win = Math.max(2, Math.round(s * 0.28));
    [X + Math.round(s * 0.25), X + W - Math.round(s * 0.25) - win].forEach(wx => {   // two windows
      g.fillStyle = rgb(white); g.fillRect(wx - 1, Y + Math.round(s * 0.3) - 1, win + 2, win + 2);
      g.fillStyle = rgb(lit); g.fillRect(wx, Y + Math.round(s * 0.3), win, win);
    });
    if (s > 8) { g.fillStyle = rgb(white); g.fillRect(X + Math.round(W / 2) - 1, Y + Math.round(s * 0.45), 3, H - Math.round(s * 0.45)); }   // the door
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

  // a secret way to look at a stop without running the whole way there: ?stop=sf, ?stop=stockholm,
  // ?stop=rosas (a run started like that doesn't count for the high scores)
  function startAt() {
    const k = (new URLSearchParams(location.search).get('stop') || '').toLowerCase().replace(/[^a-z]/g, '');
    return { sf: 1, sanfrancisco: 1, stockholm: 2, rosas: 3 }[k] ? { sf: LEVEL_T, sanfrancisco: LEVEL_T, stockholm: LEVEL_T * 2, rosas: LEVEL_T * 3 }[k] : 0;
  }

  function fresh(w, h) {
    const at = startAt();
    return { lv: Math.min(2, Math.floor(at / LEVEL_T)), t: at, skip: at > 0, scroll: 0, y: 0, vy: 0, onGround: true, jumps: 0, obs: [], pick: [], next: 60, lives: 3, hit: -9, hearts: 0, done: false, arrive: null, fade: 0 };
  }

  const game = {
    id: 'run', name: 'Island to Sweden', kicker: 'Game 3',
    blurb: 'Run from Roatán through San Francisco to Rösås.',
    how: 'From the island to the wedding, one stop at a time. Make it through one and the next unlocks. Tap to jump, tap again in the air to jump higher. Collect hearts, dodge everything else. Three lives.',
    better: 'high', disco: false, thumbScene: 0.7,
    sceneAt: () => S ? LEVELS[S.lv].p : LEVELS[0].p,
    fmt: v => v + ' ♡',

    thumb(g, w, h, t) {
      placeScene(g, w, h, 1, 40, t);
      const gy = Math.round(h * 0.8), u = h / 64;
      spriteBig(g, SPR.cone.rows, w * 0.8, gy - SPR.cone.rows.length * SC, SPR.cone.map);
      D.pixelHeart(g, w * 0.62, gy - h * 0.42, true, D.HEART_COLS[0]);
      D.pixelHeart(g, w * 0.7, gy - h * 0.46, true, D.HEART_COLS[1]);
      Bebs.andrea(g, w * 0.3, gy - h * 0.1, u, { pose: 'jump', t: 1 });
      Bebs.lonis(g, w * 0.3 + 9 * u, gy - h * 0.1, u, { pose: 'jump', t: 1 });
    },

    setup(api) { S = fresh(api.st.w, api.st.h); hudAll(api); stripAll(api); },
    start(api) { S = fresh(api.st.w, api.st.h); hudAll(api); stripAll(api); },

    update(dt, api) {
      if (S.over) return;
      const w = api.st.w, h = api.st.h, gy = Math.round(h * 0.8), u = h / 112;
      S.t += dt;
      const lv = Math.min(2, Math.floor(S.t / LEVEL_T));
      if (lv !== S.lv) {
        S.lv = lv; S.fade = 1; api.toast('Next stop: ' + LEVELS[lv].name, w * 0.5, h * 0.3, 'big warm'); stripAll(api);
        const ride = ['', 'Matte black Tesla Roadster unlocked', 'Voi scooter unlocked'][lv];   // the surprise
        if (ride) setTimeout(() => { if (S && S.lv === lv && api.running) api.toast('🔓 ' + ride, w * 0.5, h * 0.42, 'big unlock'); }, 1100);
      }
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
          S.obs.push({ k, x: w + 4, w: spr.rows[0].length * SC, h: spr.rows.length * SC, vx: k === 'coconut' ? -12 : k === 'crab' ? (Math.random() < 0.5 ? -6 : 6) : 0 });
          // hearts: a little arc over it, or a line along the ground
          const n = 3 + ((Math.random() * 3) | 0), arcUp = Math.random() < 0.6;
          for (let i = 0; i < n; i++) S.pick.push({ x: w + 4 + spr.rows[0].length * SC / 2 + (i - (n - 1) / 2) * 9 + (arcUp ? 0 : 40), y: arcUp ? gy - spr.rows.length * SC - 12 - Math.sin((i + 0.5) / n * Math.PI) * 10 : gy - 8 });
          S.next = 52 + Math.random() * 46 + speed * 0.4 + spr.rows[0].length * SC + (k === 'robotaxi' ? 22 : 0);
        }
      } else if (!S.arrive) { S.arrive = { x: w + 30 + w * 2 }; api.toast('Next stop: Rösås', w * 0.5, h * 0.3, 'big warm'); }   // a little stretch of countryside first

      const px = Math.round(w * 0.24), feet = gy + S.y;
      const box = { l: px - 7 * u, r: px + 9 * u, t: feet - 27 * u, b: feet };
      for (const o of S.obs) {
        o.x -= speed * dt - o.vx * dt * (S.done ? 0 : 1);
        const ob = { l: o.x + INSET, r: o.x + o.w - INSET, t: gy - o.h + INSET, b: gy };   // a little forgiving
        if (!o.hit && S.t - S.hit > 1.4 && box.r > ob.l && box.l < ob.r && box.b > ob.t && box.t < ob.b) {
          o.hit = true; S.hit = S.t; S.lives--; api.buzz(40); hudAll(api);
          const ouch = { crab: 'pinched!', coconut: 'bonk', iguana: 'iguana!', cone: 'oops', hydrant: 'splash', robotaxi: 'it had right of way', scooter: 'who left that there', bike: 'ring ring!', dala: 'dalahäst!' }[o.k];
          api.toast(ouch, px, feet - 30 * u, 'flag');
          if (S.lives <= 0) {
            S.over = true;
            api.end({ title: 'Missed the flight', text: 'There’s always another one. The wedding will wait for you.', score: S.hearts, scoreText: S.hearts + ' hearts on the way', counts: !S.skip });
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
          api.end({ title: 'Welcome to Rösås', text: 'June 12, 2027. You made it all the way from Roatán, with ' + S.hearts + ' hearts and a bonus for arriving.', score: total, scoreText: total + ' hearts', counts: !S.skip, delay: 2200 });
        }
      }
    },

    draw(api, now) {
      const g = api.st.g, w = api.st.w, h = api.st.h, gy = Math.round(h * 0.8), u = h / 112;
      placeScene(g, w, h, S.t >= LEVEL_T * 3 ? 3 : S.lv, S.scroll, now);
      if (S.arrive) {
        arch(g, S.arrive.x, gy, h, now);
        const hop = S.done ? Math.abs(Math.sin(now * 0.012)) * 4 : 0;          // so happy to see you
        spriteBig(g, DOG.rows, S.arrive.x + 18, gy - DOG.rows.length - hop, DOG.map, false, 1);
      }
      for (const p of S.pick) D.pixelHeart(g, p.x, p.y + Math.sin(now * 0.005 + p.x) * 0.8, true, D.HEART_COLS[0]);
      for (const o of S.obs) {
        const spr = SPR[o.k], flip = !!FACING[o.k];
        let rows = spr.rows;
        if (o.k === 'robotaxi' && Math.floor(now / 150) % 2) rows = rows.map((r, i) => i === 0 ? r.replace('ss', 's.') : r);
        spriteBig(g, rows, o.x, gy - rows.length * SC + (o.k === 'crab' && Math.floor(now / 120) % 2 ? -1 : 0), spr.map, !flip);
      }
      const px = Math.round(w * 0.24), feet = gy + S.y;
      const blink = S.t - S.hit < 1.4 && Math.floor(S.t * 12) % 2 === 0 && api.running;
      if (S.lv === 1 && !S.onGround) thrusters(g, px + u, feet, gy, u, now);   // the Roadster's cold-air jets
      if (!blink && S.lv === 1) {                                     // San Francisco: in the Roadster
        const car = roadster(g, px + u, feet, u);
        const seat = feet + 6 * u;                                     // sitting low: from the waist up shows
        // Andrea drives (her side is the one we see), Lonis in the passenger seat beside her
        g.fillStyle = rgb([24, 22, 30]);                               // the steering wheel in front of her
        for (let i = 0; i < 3 * u; i++) g.fillRect(Math.round(px + 4.5 * u + i * 0.5), Math.round(car.top - i), 1, 1);
        g.fillRect(Math.round(px + 5.2 * u), Math.round(car.top - 3.2 * u), 2, 1);
        Bebs.lonis(g, px - 2 * u, seat, u, { pose: 'stand', t: now / 1000, cut: (seat - car.top - u) / (28 * u) });
        Bebs.andrea(g, px + 1.5 * u, seat, u, { pose: 'stand', t: now / 1000, cut: (seat - car.top - u) / (24 * u) });
      } else if (!blink && S.lv === 2 && S.t < LEVEL_T * 3) {          // Stockholm: both on one pink Voi
        const sc = voi(g, px + u, feet, u);
        Bebs.andrea(g, px - 3.5 * u, sc.feet, u, { pose: 'stand', t: now / 1000 });   // holding on behind him
        Bebs.lonis(g, px + 2.5 * u, sc.feet, u, { pose: 'stand', t: now / 1000 });    // Lonis drives
      } else if (!blink) {
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
