/* The arcade's dot world. The site's own landscape (art.js, in its arcade mode) is live behind
   everything; each game paints only its own things (a floor, a goal, falling hearts...) into a tiny
   scene, one pixel per dot, and stage.render() prints them as dots the same size as the landscape's,
   each on a dark backing so the landscape doesn't show through between them. A pixel painted with
   alpha 254 (Dots.TILE_A) is drawn as a square tile instead of a round dot, like the mirror ball.
   The two of us (bebs.js) are drawn on top in much finer dots. */

(() => {
  'use strict';

  const TAU    = Math.PI * 2;
  const clamp  = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp   = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const mix    = (c, d, t) => [lerp(c[0], d[0], t), lerp(c[1], d[1], t), lerp(c[2], d[2], t)];
  const rgb    = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const rgba   = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hash   = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const TILE_A = 254 / 255;

  /* the site's palette, lifted from the coral photo */
  const PAL = {
    night:   [ 26, 11, 52], violet: [ 74, 38,128], indigo: [ 56, 40,168], blue:  [ 48, 88,222],
    teal:    [ 23,160,106], lime:   [143,214, 47], green:  [ 63,207, 74], gold:  [246,170, 38],
    orange:  [255,124, 26], magenta:[226, 69,124], wine:   [ 72, 20, 42], pink:  [255, 96,160],
    blush:   [255,180,208], cream:  [255,244,216], white:  [255,255,255], lilac: [196,180,246],
    red:     [236, 38, 52], sky:    [ 96,180,255], aqua:   [ 60,214,226], sand:  [244,206,140],
    grass:   [ 70,170, 60], falu:   [168, 40, 34], birch:  [236,232,226], silver:[196,200,216]
  };
  /* light mode's garden palette (art.js LPAL) */
  const LPAL = {
    dusty: [ 70,118,206], blue: [ 30,136,226], periwinkle: [110,104,222], lavender: [164,120,226],
    blush: [255,150,186], rose: [222, 90,140], peach: [255,158,120], champagne: [255,214,140],
    gold:  [240,170, 60], sage: [ 90,172,118], eucalyptus: [ 30,124,104], forest: [ 16, 72, 66],
    deepblue: [ 16, 44,112], dusk: [ 44, 36,112]
  };
  const PAPER = [255, 250, 246];
  const NIGHT_BG = [11, 5, 25];

  /* the sky's journey, straight from the site: night → dawn → day → golden → dusk */
  const SKY = [
    { p: 0.00, top: [ 24, 10, 50], bot: [ 68, 34,120] },
    { p: 0.22, top: [ 62, 32,146], bot: [226, 69,124] },
    { p: 0.46, top: [ 48, 88,222], bot: [160,212, 72] },
    { p: 0.70, top: [ 96, 34,152], bot: [255,124, 26] },
    { p: 1.00, top: [ 58, 23,120], bot: [176, 50, 96] }
  ];
  const SKY_LIGHT = [
    { p: 0.00, top: [ 52, 58,168], mid: [150,112,222], mid2: [240,140,200], bot: [255,196,170] },
    { p: 0.22, top: [  0,150,196], mid: [ 90,210,228], mid2: [255,120,178], bot: [255,196,214] },
    { p: 0.46, top: [ 26, 70,196], mid: [ 30,150,236], mid2: [110,214,236], bot: [255,164,206] },
    { p: 0.70, top: [ 80, 36,170], mid: [222, 40,170], mid2: [255, 92, 96], bot: [255,196, 64] },
    { p: 1.00, top: [ 22, 16, 72], mid: [ 70, 28,126], mid2: [176, 36,132], bot: [236, 96,120] }
  ];

  const D = {
    TAU, clamp, lerp, smooth, mix, rgb, rgba, hash, PAL, LPAL, PAPER, TILE_A,
    light: false,
    reduced: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  };

  /* colours that change with the theme */
  D.c = {
    black:  () => (D.light ? [24, 20, 26] : [52, 40, 96]),       // Lonis's wardrobe: violet-lifted at night, like the site does
    black2: () => (D.light ? [52, 46, 56] : [84, 68, 140]),      // its folds and seams
    line:   () => (D.light ? [44, 22, 32] : [14, 6, 32]),        // the outline around people
    hairA:  () => (D.light ? [52, 30, 24] : [96, 56, 46]),
    hairA2: () => (D.light ? [96, 58, 42] : [138, 86, 66]),
    hairL:  () => (D.light ? [66, 44, 32] : [112, 76, 56]),
    hairL2: () => (D.light ? [110, 76, 54] : [150, 108, 80]),
    skinA:  () => [224, 166, 126],
    skinA2: () => [196, 132, 98],
    skinL:  () => [246, 204, 178],
    skinL2: () => [222, 168, 142]
  };

  /* ---------- sky ---------- */

  D.sky = function (p) {
    const SK = D.light ? SKY_LIGHT : SKY;
    p = clamp(p);
    for (let i = 0; i < SK.length - 1; i++) {
      const a = SK[i], b = SK[i + 1];
      if (p <= b.p || i === SK.length - 2) {
        const t = smooth(clamp((p - a.p) / (b.p - a.p)));
        const o = { top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t) };
        if (a.mid) { o.mid = mix(a.mid, b.mid, t); o.mid2 = mix(a.mid2, b.mid2, t); }
        return o;
      }
    }
  };

  // paint a sky from y0 down to y1 (the horizon) for a point p in the day
  D.paintSky = function (g, w, y0, y1, p) {
    const s = D.sky(p);
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, rgb(s.top));
    if (s.mid) { gr.addColorStop(0.42, rgb(s.mid)); gr.addColorStop(0.76, rgb(s.mid2)); }
    gr.addColorStop(1, rgb(s.bot));
    g.fillStyle = gr;
    g.fillRect(0, y0, w, y1 - y0);
    return s;
  };

  // a custom vertical gradient from a list of colours
  D.grad = function (g, x, y0, w, y1, cols) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), rgb(c)));
    g.fillStyle = gr;
    g.fillRect(x, y0, w, y1 - y0);
  };

  /* ---------- the land: the site's ridge line ---------- */

  D.ridgeH = function (x, k) {
    let v = Math.sin(x * 0.071 + k * 2.1) * 0.52 + Math.sin(x * 0.143 + k * 5.3) * 0.28
          + Math.sin(x * 0.301 + k * 9.7) * 0.14 + Math.sin(x * 0.598 + k * 3.1) * 0.06;
    v = v * 0.5 + 0.5;
    return Math.pow(v, 1.6);
  };

  // a mountain range: base height + amp, scrolling by off (in pixels)
  D.ridge = function (g, w, base, amp, k, off, col, scale) {
    scale = scale || 1;
    g.fillStyle = rgb(col);
    for (let x = 0; x < w; x++) {
      const hh = amp * D.ridgeH((x + off) / scale, k);
      g.fillRect(x, base - hh, 1, hh + 400);
    }
  };

  // water with the sky's colours and a few ripples catching the light
  D.water = function (g, w, y0, y1, top, bot, time, glint) {
    D.grad(g, 0, y0, w, y1, [top, bot]);
    if (!glint) return;
    for (let i = 0; i < 26; i++) {
      const ry = y0 + 1 + hash(i * 3.3) * (y1 - y0 - 2);
      const rx = ((hash(i * 7.1) * w + time * 0.004 * (1 + hash(i) * 2)) % (w + 6)) - 3;
      const len = 1 + (hash(i * 5.7) * 4 | 0);
      g.fillStyle = rgba(glint, 0.5 + 0.5 * Math.sin(time * 0.003 + i));
      g.fillRect(rx | 0, ry | 0, len, 1);
    }
  };

  /* ---------- the site's little things: mirror ball, pixel hearts, stars ---------- */

  const DISCO = [PAL.green, PAL.magenta, PAL.orange, PAL.blue];
  D.mirrorBall = function (g, cx, cy, r, time, string) {
    if (string) { g.fillStyle = rgb(PAL.silver); g.fillRect(Math.round(cx - 0.5), 0, 1, Math.max(0, Math.floor(cy - r))); }
    const rot = time * 0.0016;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / r, r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const tu = Math.floor((Math.atan2(nx, nz) + rot) / 0.42), tv = Math.floor(Math.asin(ny) / 0.36);
        const glint = hash(tu * 12.99 + tv * 78.23 + Math.floor(time * 0.006 + hash(tu * 3.1 + tv) * 7));
        const sh = 0.30 + 0.70 * nz;
        let c = [186 * sh, 190 * sh, 208 * sh];
        if (glint > 0.88) c = [255, 255, 255];
        else if (glint > 0.70) c = mix(c, DISCO[((tu * 7 + tv * 3) % 4 + 4) % 4], 0.8);
        g.clearRect(x, y, 1, 1);
        g.fillStyle = rgba(c, TILE_A);           // square tiles
        g.fillRect(x, y, 1, 1);
      }
    }
  };

  // coloured light thrown by the ball: a few soft spots drifting over the scene
  D.discoLights = function (g, w, h, time, k) {
    if (k <= 0) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const c = DISCO[i % 4];
      const x = (hash(i * 4.1) * w + time * 0.02 * (0.5 + hash(i))) % (w + 20) - 10;
      const y = (hash(i * 9.3) * h + Math.sin(time * 0.001 + i) * 8);
      const gr = g.createRadialGradient(x, y, 0, x, y, 7);
      gr.addColorStop(0, rgba(c, 0.5 * k)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(x - 7, y - 7, 14, 14);
    }
    g.restore();
  };

  const HEART_S = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const HEART_L = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  D.HEART_COLS = [[255, 96, 160], [255, 140, 172], [255, 180, 208]];
  D.pixelHeart = function (g, x, y, big, col, a) {
    const shape = big ? HEART_L : HEART_S, w = shape[0].length, x0 = Math.round(x) - (w >> 1), y0 = Math.round(y);
    g.fillStyle = rgba(col, a == null ? 1 : a);
    for (let j = 0; j < shape.length; j++) for (let k = 0; k < w; k++) if (shape[j][k] === '#') g.fillRect(x0 + k, y0 + j, 1, 1);
    g.fillStyle = rgba([255, 255, 255], (a == null ? 1 : a) * 0.9);
    g.fillRect(x0 + 1, y0 + 1, 1, 1);
  };

  // a pixel sprite from strings; map = { char: colour }
  D.sprite = function (g, rows, x, y, map, flip) {
    const w = rows[0].length;
    for (let j = 0; j < rows.length; j++) {
      for (let k = 0; k < w; k++) {
        const ch = rows[j][flip ? w - 1 - k : k];
        const c = map[ch];
        if (!c) continue;
        g.fillStyle = typeof c === 'string' ? c : rgb(c);
        g.fillRect(Math.round(x) + k, Math.round(y) + j, 1, 1);
      }
    }
  };

  D.stars = function (g, w, h, time, a, seed) {
    if (a <= 0) return;
    for (let i = 0; i < 40; i++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 0.002 + i * 2.7);
      g.fillStyle = rgba(D.light ? [255, 230, 170] : [255, 250, 230], a * (0.35 + 0.65 * tw));
      g.fillRect((hash(i * 1.3 + (seed || 0)) * w) | 0, (hash(i * 2.9 + 7 + (seed || 0)) * h) | 0, 1, 1);
    }
  };

  D.cloud = function (g, cx, cy, s, col) {
    g.fillStyle = rgb(col);
    g.beginPath();
    g.ellipse(cx, cy, s * 1.6, s * 0.7, 0, 0, TAU);
    g.ellipse(cx - s * 0.7, cy - s * 0.3, s * 0.7, s * 0.6, 0, 0, TAU);
    g.ellipse(cx + s * 0.4, cy - s * 0.55, s * 0.8, s * 0.7, 0, 0, TAU);
    g.fill();
  };

  /* ---------- the stage: paints dots from the tiny scene ---------- */

  // the site's dot spacing (art.js cellFor), so the game's dots match the landscape's
  D.cell = w => D.light ? (w < 700 ? 4.5 : w < 1300 ? 5 : 6) : (w < 700 ? 7 : w < 1300 ? 9 : 10);
  D.BACKING = [10, 5, 22];
  D.PAPER_BACK = [250, 245, 238];
  D.day = false;                     // light mode, and the scene is daytime (the shell sets it)
  const tone = (R, G, B) => Math.max(Math.pow(1 - (0.299 * R + 0.587 * G + 0.114 * B) / 255, 0.8), 0.7 * Math.pow(clamp(Math.hypot(250 - R, 245 - G, 238 - B) / 190), 0.62));

  function Stage(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sc = document.createElement('canvas');
    this.g = this.sc.getContext('2d', { willReadFrequently: true });
    this.mask = document.createElement('canvas');
    this.mx = this.mask.getContext('2d');
    this.w = this.h = 0;
    this.people = [];
    this.g.__stage = this;            // so the dolls (bebs.js) know which stage they're on
  }

  // cssW × cssH on screen; cell: css pixels per dot (defaults to the site's)
  Stage.prototype.fit = function (cssW, cssH, cell) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.dpr = dpr;
    this.cv.width = Math.max(1, Math.round(cssW * dpr));
    this.cv.height = Math.max(1, Math.round(cssH * dpr));
    this.cv.style.width = cssW + 'px';
    this.cv.style.height = cssH + 'px';
    this.cell = cell || D.cell(window.innerWidth);
    const w = Math.max(8, Math.round(cssW / this.cell)), h = Math.max(8, Math.round(cssH / this.cell));
    if (w !== this.w || h !== this.h) {
      this.w = w; this.h = h;
      this.sc.width = w; this.sc.height = h;
      this.mask.width = w; this.mask.height = h;
      this.jit = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) this.jit[i] = hash(i * 1.37 + 0.71);
    }
    this.cssW = cssW; this.cssH = cssH;
  };

  // client coordinates → scene pixels
  Stage.prototype.toScene = function (clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width * this.w, y: (clientY - r.top) / r.height * this.h };
  };

  // a new frame: an empty scene and nobody drawn yet
  Stage.prototype.clear = function () {
    this.g.setTransform(1, 0, 0, 1, 0, 0);
    this.g.clearRect(0, 0, this.w, this.h);
    this.people.length = 0;
  };

  // opts: size (dot size multiplier), backing (false: no dark backing), solid (a colour behind everything)
  Stage.prototype.render = function (opts) {
    opts = opts || {};
    const w = this.w, h = this.h, ctx = this.ctx;
    if (!w) return;
    const data = this.g.getImageData(0, 0, w, h).data;
    const sx = this.cv.width / w, sy = this.cv.height / h;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    if (opts.solid) { ctx.fillStyle = rgb(opts.solid); ctx.fillRect(0, 0, this.cv.width, this.cv.height); }
    // the dark backing under everything painted, a little bigger than it, like the site's dots sit on the night
    if (opts.backing !== false) {
      const m = this.mx;
      m.globalCompositeOperation = 'copy';
      m.drawImage(this.sc, 0, 0);
      m.globalCompositeOperation = 'source-in';
      m.fillStyle = rgb(D.day ? D.PAPER_BACK : D.BACKING); m.fillRect(0, 0, w, h);
      m.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.mask, 0, 0, this.cv.width, this.cv.height);
    }
    const maxR = Math.min(sx, sy) * 0.56 * (opts.size || 1);
    const QS = 4, QK = 255 / ((256 >> QS) - 1);
    const buckets = new Map();
    for (let y = 0; y < h; y++) {
      const off = y % 2 ? 0.5 : 0;           // every other row shifted half a dot, like the site
      for (let x = 0; x < w; x++) {
        const i = y * w + x, o = i * 4, a = data[o + 3];
        if (a < 24) continue;
        let R = data[o], G = data[o + 1], B = data[o + 2];
        const tile = a === 254;
        const BK = D.day ? D.PAPER_BACK : D.BACKING;
        if (a < 250) { const t = a / 255; R = BK[0] + (R - BK[0]) * t; G = BK[1] + (G - BK[1]) * t; B = BK[2] + (B - BK[2]) * t; }
        const L = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
        const k = D.day ? 0.5 + 0.5 * tone(R, G, B) : 0.16 + 0.84 * Math.pow(L, 0.68);   // night: bright is big; paper: deep is big
        const rad = k * maxR * (0.86 + this.jit[i] * 0.28);
        if (rad < 0.3) continue;
        const qr = R >> QS, qg = G >> QS, qb = B >> QS;
        const key = ((qr << 10) | (qg << 5) | qb) + (tile ? 32768 : 0);
        let b = buckets.get(key);
        if (!b) { b = { p: new Path2D(), c: 'rgb(' + (qr * QK | 0) + ',' + (qg * QK | 0) + ',' + (qb * QK | 0) + ')' }; buckets.set(key, b); }
        const cx = (x + off + 0.25) * sx, cy = (y + 0.5) * sy;
        if (tile) { const hh = rad * 0.86; b.p.rect(cx - hh, cy - hh, hh * 2, hh * 2); }
        else { b.p.moveTo(cx + rad, cy); b.p.arc(cx, cy, rad, 0, TAU); }
      }
    }
    buckets.forEach(b => { ctx.fillStyle = b.c; ctx.fill(b.p); });
    // the two of us, in fine dots, on top (bebs.js)
    if (this.people.length && window.Bebs) window.Bebs.paint(this);
  };

  D.Stage = Stage;
  window.Dots = D;
})();
