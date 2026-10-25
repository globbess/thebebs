/* Halftone landscape that resolves as you scroll.
   Scene is drawn tiny (one pixel per dot), then re-drawn as dots. */

(() => {
  'use strict';

  const cv  = document.getElementById('art');
  const ctx = cv.getContext('2d');
  const sc  = document.createElement('canvas');
  const sx  = sc.getContext('2d', { willReadFrequently: true });

  const TAU    = Math.PI * 2;
  const clamp  = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp   = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const seg    = (p, a, b) => clamp((p - a) / (b - a));
  const mix    = (c, d, t) => [lerp(c[0],d[0],t), lerp(c[1],d[1],t), lerp(c[2],d[2],t)];
  const rgb    = c => 'rgb(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ')';
  const rgba   = (c, a) => 'rgba(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ',' + a + ')';

  // stable pseudo-random, same every load
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  let W = 0, H = 0, DPR = 1, CELL = 10, cols = 0, rows = 0;
  let dots = [];
  let target = 0, shown = 0, started = 0;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the arcade (arcade/index.html) runs this same landscape behind its games: no opening photo,
  // no cards, no scrolling. It sets window.ART_EMBED = { scene: 0..1 (on past 1 into the next day),
  // night: light mode's night, disco: keep the ball on, taps: let taps on the sky and water through,
  // noSun: leave the sun out } and may change it live.
  const EMBED = window.ART_EMBED || null;

  /* ---------- the disco ball ----------
     Every so often — or whenever someone taps the sun — the sun turns into a
     mirror ball for a few seconds and throws coloured light over everything. */

  const DISCO_LEN = 4200;                               // ms per party
  const FADE_IN = 380, FADE_OUT = 520;
  let discoStart = -1e9;              // when the party fades in
  let discoEnd   = -1e9;              // when it starts fading out (Infinity while switched on)
  let discoHeld  = false;             // switched on by a tap, stays on until tapped again
  let discoWho   = 'sun';             // which ball is the disco ball: 'sun' or 'moon'
  let discoOn    = false;
  let hoverSun   = false;
  const ball = { x: 0, y: 0, r: 0, lit: false, tappable: false };
  const moonBall = { x: 0, y: 0, r: 0, on: false };    // tap the moon and it's a mirror ball for a moment

  // the heart cloud drifts up into the sun around the schedule; when they touch, the party starts
  const HEART_MEET = 0.54;
  const heartC = { touching: false, wasTouching: false, visible: false };
  let eggsQuietUntil = 0;             // keeps the easter eggs from piling on top of each other

  /* ---------- hearts ----------
     Now and then — or wherever someone taps the water — a little stream of
     pixel hearts bubbles up out of the water and drifts off into the sky. */

  const hearts = [];
  let nextHearts = 32000 + Math.random() * 12000;
  let horizonY = 0;                   // in scene pixels, for tap detection
  let artReady = false;               // landscape has mostly assembled

  const HEART_S = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const HEART_L = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const HEART_COLS = [[255, 96, 160], [255, 140, 172], [255, 180, 208]];

  /* ---------- light mode (theme.js) ----------
     The same journey and layout as the night version (mountains growing out of the horizon,
     the sea with its ripples), only the colours change: slightly more traditional, a garden
     wedding at golden hour. Sky periwinkle → dusty blue → clear blue → lavender → blue dusk,
     with blush, peach and dusty-rose horizons; a champagne-gold sun; golden stars; hills
     layered dusty blue → sage → eucalyptus; blue water with champagne ripples. The opening is
     white, everything below sits on a soft blush. Dots are drawn like ink: deep colours big,
     highlights small, so it keeps all the night version's texture. */
  const LPAL = {
    dusty:     [ 70, 118, 206],   // cobalt-ish blue
    blue:      [ 30, 136, 226],
    periwinkle:[110, 104, 222],
    lavender:  [164, 120, 226],
    blush:     [255, 150, 186],
    rose:      [222,  90, 140],
    peach:     [255, 158, 120],
    champagne: [255, 214, 140],
    gold:      [240, 170,  60],
    sage:      [ 90, 172, 118],
    eucalyptus:[ 30, 124, 104],
    forest:    [ 16,  72,  66],
    deepblue:  [ 16,  44, 112],
    dusk:      [ 44,  36, 112]
  };
  const BLUSH_BG = [250, 236, 238];   // behind everything below the opening
  const CARD = [232, 212, 232];       // the night page's card: a soft lilac blush, not white
  // light mode's last page ("Are you in?") is a real night: black behind the dots, the
  // dots glowing like in dark mode, so the disco ball and the moon on the water shine
  let NIGHTK = 0;
  const lastSec = document.querySelector('.sec:last-child');
  const dayLook = () => LIGHT && NIGHTK < 0.5;      // drawing on paper (vs. glowing on black)
  // how big a dot prints on the paper: deep colours big, highlights small (the mirror of
  // dark mode, where bright is big), so ripples, glows and ridges keep all their texture
  const tone = (R, G, B) => Math.max(Math.pow(1 - (0.299 * R + 0.587 * G + 0.114 * B) / 255, 0.8), 0.7 * ink(R, G, B));
  let LIGHT = document.documentElement.classList.contains('light');
  const PAPER = [250, 245, 238];
  // colours are rounded into steps so dots of one colour can be drawn together: 8 steps per
  // channel at night, 16 by day (pale colours need the finer steps to stay sharp)
  let QS = LIGHT ? 4 : 5, QK = 255 / ((256 >> QS) - 1);
  const ink = (R, G, B) => Math.pow(clamp(Math.hypot(PAPER[0] - R, PAPER[1] - G, PAPER[2] - B) / 190), 0.62);

  /* ---------- the opening photograph ----------
     The first screen is a photo of the two of you, redrawn in dots and painted
     in the site's colours. As you scroll it loosens into dust and the landscape
     assembles in its place. */

  const photoDark = new Image(), photoLight = new Image();
  let photo = LIGHT && window.WEDDING_PHOTO_LIGHT ? photoLight : photoDark;   // the night silhouette, or the day photo in light mode
  const pc  = document.createElement('canvas');
  const pcx = pc.getContext('2d', { willReadFrequently: true });
  let photoReady = false;
  let photoA = null, photoL = null, photoC = null;   // per dot: presence, brightness, colour

  // where the faces are in the photo (0..1), so phones crop around them
  const PHOTO_FOCUS = { x: 0.47, y: 0.33 };
  const PHOTO_FOCUS_LIGHT = { x: 0.71, y: 0.73 };   // the photo by the sea: the two of us, low on the right

  // dark → light in the site's palette: violet shadows, magenta, orange, gold, cream
  const PHOTO_RAMP = [
    [0.00, [ 20,   8,  44]],
    [0.25, [ 74,  28, 124]],
    [0.50, [214,  66, 122]],
    [0.72, [255, 128,  34]],
    [0.88, [255, 196,  92]],
    [1.00, [255, 244, 216]]
  ];

  // in light mode, the same idea in the light palette: deep teal shadows, turquoise, pink, blush, airy aqua
  const PHOTO_RAMP_LIGHT = [
    [0.00, [ 18,  48,  84]],
    [0.25, [  8,  89, 124]],
    [0.46, [  0, 160, 196]],
    [0.66, [252, 110, 166]],
    [0.84, [240, 184, 204]],
    [1.00, [214, 244, 242]]
  ];

  function ramp(L) {
    const R = LIGHT ? PHOTO_RAMP_LIGHT : PHOTO_RAMP;
    for (let i = 1; i < R.length; i++) {
      if (L <= R[i][0]) {
        const a = R[i - 1], b = R[i];
        return mix(a[1], b[1], (L - a[0]) / (b[0] - a[0]));
      }
    }
    return R[R.length - 1][1];
  }

  const pl  = document.createElement('canvas');   // the photo, drawn once in fine dots
  const plx = pl.getContext('2d');
  let photoLayerReady = false;

  // where the photo sits on a grid of gw x gh cells
  function placePhoto(gw, gh) {
    const iw = photo.naturalWidth, ih = photo.naturalHeight;
    const wide = W / H >= 1.0;
    let dw, dh, dx, dy;
    const day = photo === photoLight, F = day ? PHOTO_FOCUS_LIGHT : PHOTO_FOCUS;
    if (wide && day) {
      // the day photo, zoomed in on the two of us so we fill the right half like the night one
      dh = gh * 2.3; dw = dh * iw / ih;
      dx = Math.max(gw - dw, gw * 0.78 - F.x * dw);   // a little to the right, and always reaching the right edge
      dy = gh - dh;
    } else if (wide) {
      // the photo on the right-hand side, cropped around the faces
      dh = gh * 1.2; dw = dh * iw / ih;
      dx = gw - dw * 0.95;
      dy = clamp(gh * 0.42 - F.y * dh, gh - dh, 0);
    } else if (day) {
      // phones, day photo: the whole screen, zoomed in on the two of us like the night one;
      // a touch right of centre, so Andrea isn't cut off at the left edge
      dh = Math.max(gh * 2.2, gw * ih / iw); dw = dh * iw / ih;
      dx = clamp(gw * 0.70 - F.x * dw, gw - dw, 0);
      dy = gh - dh;
    } else {
      // phones: fill the screen, cropped around the faces
      const k = Math.max(gw / iw, gh / ih) * 1.12;
      dw = iw * k; dh = ih * k;
      dx = clamp(gw * 0.5  - F.x * dw, gw - dw, 0);
      dy = clamp(gh * 0.36 - F.y * dh, gh - dh, 0);
    }
    return { dx: dx, dy: dy, dw: dw, dh: dh, wide: wide };
  }

  // read the photo at one value per cell: presence, brightness, colour
  function readPhoto(gw, gh) {
    pc.width = gw; pc.height = gh;
    pcx.clearRect(0, 0, gw, gh);
    const P = placePhoto(gw, gh);
    pcx.drawImage(photo, P.dx, P.dy, P.dw, P.dh);

    if (P.wide) {
      // fade its left edge into the dark (the zoomed day photo: from the middle of the screen)
      const day = photo === photoLight;
      const fadeFrom = day ? gw * 0.47 : P.dx, fadeTo = day ? gw * 0.575 : P.dx + P.dw * 0.38;   // the day photo's fade ends before Andrea's hair
      const g = pcx.createLinearGradient(fadeFrom, 0, fadeTo, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      pcx.globalCompositeOperation = 'destination-out';
      pcx.fillStyle = g;
      pcx.fillRect(0, 0, fadeTo, gh);
      pcx.globalCompositeOperation = 'source-over';
    }

    const px = pcx.getImageData(0, 0, gw, gh).data;   // throws if the browser won't let us read it
    const n = gw * gh;
    const A = new Float32Array(n), Lv = new Float32Array(n), C = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const o = i * 4, a = px[o + 3] / 255;
      A[i] = a;
      if (a < 0.01) continue;
      const R = px[o], G = px[o + 1], B = px[o + 2];
      const L = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
      let c;
      if (LIGHT) {
        // by day the photo keeps its own natural colours, a touch richer
        const g = (R + G + B) / 3;
        c = [R, G, B].map(v => Math.max(0, Math.min(255, (g + (v - g) * 1.5) * 0.84)));
      } else c = mix(ramp(L), [R, G, B], 0.38);         // mostly palette, some of the real light
      Lv[i] = LIGHT ? 0.6 + 0.4 * ink(c[0], c[1], c[2])           // on paper: every part prints full, the strong colours biggest
                    : Math.pow(clamp((L - 0.08) / 0.84), 1.15);   // a touch more contrast: crisp silhouettes
      C[i * 3] = c[0]; C[i * 3 + 1] = c[1]; C[i * 3 + 2] = c[2];
    }
    return { A: A, L: Lv, C: C };
  }

  // the opening screen: the photo in dots half the usual size, so faces read
  function drawPhotoLayer() {
    const fc = Math.max(2.4, cellFor(W, false) * 0.42);   // the same size in both modes
    const fcols = Math.ceil(W / fc) + 1, frows = Math.ceil(H / fc) + 1;
    const f = readPhoto(fcols, frows);

    // a gentle sharpen, so edges like profiles and hair hold up in dots
    const L0 = f.L.slice();
    for (let r = 1; r < frows - 1; r++) {
      for (let c = 1; c < fcols - 1; c++) {
        const i = r * fcols + c;
        const blur = (L0[i - 1] + L0[i + 1] + L0[i - fcols] + L0[i + fcols]) * 0.25;
        f.L[i] = clamp(L0[i] + 0.75 * (L0[i] - blur));
      }
    }

    pl.width  = Math.round(W * DPR);
    pl.height = Math.round(H * DPR);
    plx.setTransform(DPR, 0, 0, DPR, 0, 0);
    plx.clearRect(0, 0, W, H);

    const maxR = fc * 0.56;
    const buckets = new Map();
    for (let r = 0; r < frows; r++) {
      for (let c = 0; c < fcols; c++) {
        const i = r * fcols + c;
        const a = f.A[i];
        if (a < 0.01) continue;
        const rad = (0.07 + 0.93 * f.L[i]) * maxR * (0.92 + 0.16 * hash(i * 1.31 + 7)) * a;
        const x = c * fc + (r % 2 ? fc * 0.5 : 0), y = r * fc;
        if (rad < 0.2) continue;
        const qr = f.C[i * 3] >> QS, qg = f.C[i * 3 + 1] >> QS, qb = f.C[i * 3 + 2] >> QS;
        const key = (qr << 10) | (qg << 5) | qb;
        let b = buckets.get(key);
        if (b === undefined) {
          b = { p: new Path2D(), c: 'rgb(' + (qr * QK | 0) + ',' + (qg * QK | 0) + ',' + (qb * QK | 0) + ')' };
          buckets.set(key, b);
        }
        b.p.moveTo(x + rad, y);
        b.p.arc(x, y, rad, 0, TAU);
      }
    }
    buckets.forEach(b => { plx.fillStyle = b.c; plx.fill(b.p); });
    photoLayerReady = true;
  }

  // tell the page how wide the dark space left of the photo is, so the names can centre in it
  function markDarkSide() {
    const docEl = document.documentElement;
    // always measured from the night photo, so the words sit in exactly the same place in light mode
    if (!(photoDark.complete && photoDark.naturalWidth) || W / H < 1.0) { docEl.style.removeProperty('--dark-w'); return; }
    const dw = H * 1.2 * photoDark.naturalWidth / photoDark.naturalHeight;   // the photo's width on screen
    docEl.style.setProperty('--dark-w', Math.round(W - dw * 0.95 + dw * 0.12) + 'px');
  }

  function samplePhoto() {
    if (!photoReady || !cols) return;
    try {
      const coarse = readPhoto(cols, rows);           // the same photo on the main dot grid
      photoA = coarse.A; photoL = coarse.L; photoC = coarse.C;
      drawPhotoLayer();
      markDarkSide();
    } catch (err) {
      // the browser won't let us read the image: open on the blank field instead
      photoReady = false; photoLayerReady = false; photoA = null;
    }
  }

  photoDark.onload = () => { if (photo === photoDark) { photoReady = true; samplePhoto(); } else markDarkSide(); };

  photoLight.onload = () => { if (photo === photoLight) { photoReady = true; samplePhoto(); } };
  if (window.WEDDING_PHOTO_LIGHT && !EMBED) photoLight.src = window.WEDDING_PHOTO_LIGHT;
  function pickPhoto() {
    photo = LIGHT && photoLight.complete && photoLight.naturalWidth ? photoLight : photoDark;
    photoReady = photo.complete && photo.naturalWidth > 0;
  }
  document.addEventListener('themechange', () => {
    LIGHT = document.documentElement.classList.contains('light');
    QS = LIGHT ? 4 : 5; QK = 255 / ((256 >> QS) - 1);
    pickPhoto(); resize();                              // the dot grid changes size between modes
  });
  if (!EMBED) photoDark.src = window.WEDDING_PHOTO || 'photo.jpg';

  function releaseHearts(x, y, n, time) {
    for (let i = 0; i < n; i++) {
      hearts.push({
        x: x + (i - (n - 1) / 2) * 6 + (Math.random() - 0.5) * 5,   // fan out, one heart-width apart
        y: y + Math.random() * 3,
        born: time + i * 650 + Math.random() * 300,                  // and leave one at a time
        life: 5000 + Math.random() * 2600,                            // at different speeds
        big: Math.random() < 0.4,
        col: HEART_COLS[(Math.random() * HEART_COLS.length) | 0],
        seed: Math.random() * 10
      });
    }
  }

  function discoLevel(time) {
    if (time < discoStart) return 0;
    const up   = smooth(clamp((time - discoStart) / FADE_IN));
    const down = 1 - smooth(clamp((time - discoEnd) / FADE_OUT));
    return up * down;
  }

  // a party of a few seconds — the heart meeting the sun
  function startDisco(time) {
    if (discoHeld) return;
    const lvl = discoWho === 'sun' ? discoLevel(time) : 0;
    discoStart = lvl > 0 ? time - FADE_IN : time;      // already going: just keep it going
    discoEnd   = time + DISCO_LEN - FADE_OUT;
    discoWho   = 'sun';
  }

  // hovering an RSVP button turns the moon into a disco ball, to celebrate, only
  // for as long as the mouse is on it (unless the moon was tapped on)
  let celebrating = false;
  let rsvpHover = false;               // the mouse is resting on an RSVP button
  let arrivalParty = false;            // phones: a guest just reached "Are you in?"
  const ARRIVAL_LEN = 6500;            // ms of party when they get there
  // someone just RSVP'd yes (form.js): a long party, as soon as the moon is up
  let yesParty = false;
  const YES_LEN = 14000;
  window.rsvpYesParty = () => { yesParty = true; };

  // a short moon party that ends by itself (unless someone has tapped the moon on)
  function moonParty(time, ms) {
    if (discoHeld || reduced) return;
    const lvl = discoWho === 'moon' ? discoLevel(time) : 0;
    discoStart = lvl > 0 ? time - FADE_IN : time;
    discoEnd   = time + ms - FADE_OUT;
    discoWho   = 'moon';
  }
  function celebrate(on) {
    const t = performance.now();
    if (on) {
      if (!moonBall.on) return;
      const lvl = discoWho === 'moon' ? discoLevel(t) : 0;
      discoStart = lvl > 0 ? t - FADE_IN : t;
      discoEnd   = Infinity;
      discoWho   = 'moon';
      celebrating = true;
    } else if (celebrating) {
      celebrating = false;
      if (!discoHeld) discoEnd = t;            // settle back straight away
    }
  }

  // tapping a ball is a light switch: on until it's tapped again
  function toggleDisco(time, who) {
    const lvl = discoWho === who ? discoLevel(time) : 0;
    if (lvl > 0.5) {
      discoHeld = false;
      discoEnd  = time;                                 // fade out now
    } else {
      discoStart = lvl > 0 ? time - FADE_IN : time;
      discoEnd   = Infinity;
      discoHeld  = true;
      discoWho   = who;
    }
  }

  /* ---------- sky keyframes: night → dawn → day → golden → night ---------- */

  /* lifted from the coral: violet ground, lime tips, hot orange, wine centre */
  const PAL = {
    night:   [ 26, 11, 52],
    violet:  [ 74, 38,128],
    indigo:  [ 56, 40,168],
    blue:    [ 48, 88,222],
    teal:    [ 23,160,106],
    lime:    [134,204, 46],
    green:   [ 63,207, 74],
    gold:    [246,170, 38],
    orange:  [255,124, 26],
    magenta: [226, 69,124],
    wine:    [ 72, 20, 42]
  };

  const SKY = [
    { p: 0.00, top: [ 24, 10, 50], bot: [ 68, 34,120] },
    { p: 0.22, top: [ 62, 32,146], bot: [226, 69,124] },
    { p: 0.46, top: [ 48, 88,222], bot: [160,212, 72] },
    { p: 0.70, top: [ 96, 34,152], bot: [255,124, 26] },
    { p: 1.00, top: [ 58, 23,120], bot: [176, 50, 96] }
  ];

  // light mode: morning → blush → clear blue over fresh green → golden hour → dusk
  const SKY_LIGHT = [
    // four bands each, top to horizon (Andy's palettes: rose quartz, hydrangea on turquoise,
    // a jellyfish in clear water, a pink cloud in a deep blue sky, and a wild sunset)
    { p: 0.00, top: [ 52,  58, 168], mid: [150, 112, 222], mid2: [240, 140, 200], bot: [255, 196, 170] }, // violet dawn, rose quartz, peach
    { p: 0.22, top: [  0, 150, 196], mid: [ 90, 210, 228], mid2: [255, 120, 178], bot: [255, 196, 214] }, // the hydrangea: pink on turquoise
    { p: 0.46, top: [ 26,  70, 196], mid: [ 30, 150, 236], mid2: [110, 214, 236], bot: [255, 164, 206] }, // cobalt day, aqua, a pink horizon
    { p: 0.70, top: [ 80,  36, 170], mid: [222,  40, 170], mid2: [255,  92,  96], bot: [255, 196,  64] }, // the wild sunset: violet, magenta, coral, gold
    { p: 1.00, top: [ 22,  16,  72], mid: [ 70,  28, 126], mid2: [176,  36, 132], bot: [236,  96, 120] }  // deep indigo night, a magenta glow
  ];

  function sky(p) {
    const SK = LIGHT ? SKY_LIGHT : SKY;
    for (let i = 0; i < SK.length - 1; i++) {
      const a = SK[i], b = SK[i + 1];
      if (p <= b.p || i === SK.length - 2) {
        const t = smooth(clamp((p - a.p) / (b.p - a.p)));
        const o = { top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t) };
        if (a.mid) { o.mid = mix(a.mid, b.mid, t); o.mid2 = mix(a.mid2, b.mid2, t); }
        return o;
      }
    }
  }

  /* ---------- ridge silhouette ---------- */

  function ridgeH(x, k) {
    const f = x / cols;
    let v = Math.sin(f *  5.1 + k * 2.1) * 0.52
          + Math.sin(f * 10.3 + k * 5.3) * 0.28
          + Math.sin(f * 21.7 + k * 9.7) * 0.14
          + Math.sin(f * 43.1 + k * 3.1) * 0.06;
    v = v * 0.5 + 0.5;            // 0..1
    return Math.pow(v, 1.6);      // deepen the valleys so peaks read as peaks
  }

  const RIDGES = [
    { k: 1.0, a: 0.16, b: 0.38, base: 0.085, amp: 0.230, dark: 0.34 },
    { k: 3.7, a: 0.24, b: 0.48, base: 0.055, amp: 0.155, dark: 0.60 },
    { k: 8.2, a: 0.32, b: 0.58, base: 0.030, amp: 0.100, dark: 0.86 }
  ];

  const DISCO_LIGHTS = [PAL.green, PAL.magenta, PAL.orange, PAL.blue, [255, 255, 255]];
  const DISCO_LIGHTS_LIGHT = [LPAL.gold, LPAL.rose, LPAL.blue, LPAL.sage, LPAL.lavender];

  function drawMirrorBall(cx, cy, r, time, dz, speed) {
    speed = speed || 1;
    const rot = time * 0.0016 * speed;
    sx.save();
    sx.globalAlpha = dz;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / r;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz  = Math.sqrt(1 - r2);
        // which mirror tile this pixel lands on, spinning around the vertical axis
        const tu  = Math.floor((Math.atan2(nx, nz) + rot) / 0.42);
        const tv  = Math.floor(Math.asin(ny) / 0.36);
        const glint = hash(tu * 12.99 + tv * 78.23 + Math.floor(time * 0.006 * speed + hash(tu * 3.1 + tv) * 7));
        const shade = 0.30 + 0.70 * nz;
        let c = [186 * shade, 190 * shade, 208 * shade];                     // silver
        if (glint > 0.88)      c = [255, 255, 255];                            // a tile catching the light
        else if (glint > 0.70) c = mix(c, DISCO_LIGHTS[((tu * 7 + tv * 3) % 4 + 4) % 4], 0.8);
        sx.fillStyle = rgb(c);
        sx.fillRect(x, y, 1, 1);
      }
    }
    sx.restore();
  }

  function drawPixelHeart(x, y, big, col, a) {
    const shape = big ? HEART_L : HEART_S;
    const w = shape[0].length, x0 = x - (w >> 1);
    sx.fillStyle = rgba(col, a);
    for (let j = 0; j < shape.length; j++) {
      for (let k = 0; k < w; k++) {
        if (shape[j][k] === '#') sx.fillRect(x0 + k, y + j, 1, 1);
      }
    }
    sx.fillStyle = rgba([255, 255, 255], a * 0.9);   // a glint, like a bubble
    sx.fillRect(x0 + 1, y + 1, 1, 1);
  }

  // a soft heart for the one cloud that isn't like the others
  function heartCloud(cx, cy, s) {
    sx.beginPath();
    sx.arc(cx - s * 0.5, cy - s * 0.15, s * 0.55, 0, TAU);
    sx.arc(cx + s * 0.5, cy - s * 0.15, s * 0.55, 0, TAU);
    sx.fill();
    sx.beginPath();
    sx.moveTo(cx - s * 1.03, cy + s * 0.02);
    sx.lineTo(cx + s * 1.03, cy + s * 0.02);
    sx.lineTo(cx, cy + s * 1.15);
    sx.closePath();
    sx.fill();
  }

  /* ---------- the scene, drawn at dot resolution ---------- */

  function drawScene(p, time, dz, dzm) {
    const hz = Math.round(rows * 0.58);
    const s  = sky(p);
    horizonY = hz;

    // sky gradient
    const g = sx.createLinearGradient(0, 0, 0, hz + rows * 0.05);
    g.addColorStop(0, rgb(s.top));
    if (s.mid) { g.addColorStop(0.42, rgb(s.mid)); g.addColorStop(0.74, rgb(s.mid2)); }
    g.addColorStop(1, rgb(s.bot));
    sx.fillStyle = g;
    sx.fillRect(0, 0, cols, rows);

    // atmospheric haze sitting on the horizon — ties sky, ridges and water together
    const afterglow = seg(p, 0.76, 1.0);
    const hazeC = mix(mix(s.bot, [255, 236, 222], 0.26),
                      mix(PAL.orange, PAL.magenta, 0.5), afterglow * 0.45);
    const hg = sx.createLinearGradient(0, hz - rows * 0.26, 0, hz + rows * 0.04);
    hg.addColorStop(0, rgba(hazeC, 0));
    hg.addColorStop(1, rgba(hazeC, (LIGHT ? 0.22 : 0.55) + afterglow * 0.18));
    sx.fillStyle = hg;
    sx.fillRect(0, hz - rows * 0.26, cols, rows * 0.30);

    // stars, at both ends of the journey
    const night = Math.max(1 - seg(p, 0.02, 0.24), seg(p, 0.78, 0.98) * 0.55);
    if (LIGHT) {
      // by day the stars are drawn after the texture (starsOnTop), so the clouds don't cover them
    } else if (night > 0.02) {
      for (let i = 0; i < 70; i++) {
        const px = (hash(i * 3.3) * cols) | 0;
        const py = (hash(i * 7.7) * hz * 0.92) | 0;
        const tw = 0.5 + 0.5 * Math.sin(time * 0.0012 + i * 1.7);
        sx.fillStyle = rgba(hash(i * 2.9) > 0.6 ? PAL.green : [222, 212, 255], night * (0.20 + 0.50 * hash(i * 1.9)) * tw);
        sx.fillRect(px, py, 1, 1);
      }
    }

    // the moon, late — tap it and it turns into a mirror ball for a moment
    // (the arcade's menu hangs the ball itself, right above the two of them, at its true size: ballAt)
    const hung = EMBED && EMBED.ballAt;
    const mo = hung ? 1 : seg(p, 0.74, 0.94);
    moonBall.on = mo > 0.35;
    if (mo > 0.01) {
      const mx = hung ? cols * hung.x : cols * (EMBED && EMBED.moonX != null ? EMBED.moonX : 0.74);
      const my = hung ? rows * hung.y : hz * 0.24;
      const mr0 = hung ? rows * hung.r : rows * 0.052 * (EMBED && EMBED.ballScale || 1);
      const mr = mr0 * (1 + 0.40 * dzm);
      moonBall.x = mx; moonBall.y = my; moonBall.r = mr;
      if (EMBED) EMBED.moon = { x: (mx - 0.5) * CELL, y: (my - 0.5) * CELL, r: mr0 * CELL };   // where it is, on screen, for the arcade
      const mg = sx.createRadialGradient(mx, my, 0, mx, my, mr0 * 5);
      mg.addColorStop(0, rgba(LIGHT ? [236, 200, 255] : [188, 150, 255], (LIGHT ? 0.75 : 0.55) * mo * (1 - 0.5 * dzm)));
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = mg; sx.fillRect(0, 0, cols, rows);
      sx.fillStyle = rgba(LIGHT ? [250, 246, 255] : [226, 216, 255], mo);
      sx.beginPath(); sx.arc(mx, my, mr0, 0, TAU); sx.fill();
      if (dzm > 0.001) {
        sx.fillStyle = rgba([214, 212, 232], 0.85 * dzm);              // the string it hangs from
        sx.fillRect(Math.round(mx - 0.5), 0, 1, Math.max(0, Math.floor(my - mr)));
        drawMirrorBall(mx, my, mr, time, dzm);
      }
    }

    // sun: rises, crosses, sets
    const sunT = clamp(p / 0.88);
    const alt  = Math.sin(sunT * Math.PI);
    const sunX = cols * (0.16 + sunT * 0.60);
    const sunY = hz + rows * 0.10 - alt * (hz + rows * 0.10) * 0.90;
    const sunC = LIGHT ? mix(LPAL.gold, LPAL.champagne, smooth(clamp((alt - 0.22) / 0.48)))   // a champagne-gold sun
                       : mix(PAL.orange, [255, 246, 196], smooth(clamp((alt - 0.22) / 0.48)));

    SUNX = sunX;                                   // light mode: the golden ridge light follows the sun
    const sunR = rows * 0.068 * (1 + 0.40 * dz) * (EMBED && EMBED.ballScale || 1);   // the ball is a bit bigger than the sun
    ball.x = sunX; ball.y = sunY; ball.r = sunR;
    const hideSun = EMBED && (EMBED.noSun || EMBED.ballAt);   // Keep the Sun Up: you are the sun; the menu: the ball is hung
    ball.lit = alt > 0.06 && p > 0.12 && !hideSun;  // the sun is up and the landscape is there

    if (alt > 0.001 && !hideSun) {
      const glow = 1 - 0.65 * dz;                  // the room dims a little when the ball comes out
      const gr = sx.createRadialGradient(sunX, sunY, 0, sunX, sunY, rows * 0.42);
      gr.addColorStop(0,    rgba(sunC, (0.95 * alt + 0.30) * glow));
      const halo = LIGHT ? LPAL.peach : PAL.magenta;           // light mode: soft peach rings
      gr.addColorStop(0.22, rgba(mix(sunC, halo, 0.45), (LIGHT ? 0.55 : 0.40) * alt * glow));
      gr.addColorStop(0.58, rgba(mix(sunC, halo, 0.80), (LIGHT ? 0.30 : 0.14) * alt * glow));
      gr.addColorStop(1,    'rgba(0,0,0,0)');
      sx.globalCompositeOperation = dayLook() ? 'source-over' : 'lighter';
      sx.fillStyle = gr; sx.fillRect(0, 0, cols, rows);
      sx.globalCompositeOperation = 'source-over';
      sx.fillStyle = rgb(sunC);
      sx.beginPath(); sx.arc(sunX, sunY, rows * 0.068, 0, TAU); sx.fill();

      if (dz > 0.001) {
        // the string it hangs from
        sx.fillStyle = rgba([214, 212, 232], 0.85 * dz);
        sx.fillRect(Math.round(sunX - 0.5), 0, 1, Math.max(0, Math.floor(sunY - sunR)));
        drawMirrorBall(sunX, sunY, sunR, time, dz);
      }
    }

    // clouds, mid-journey
    const cl = seg(p, 0.38, 0.58) * (1 - seg(p, 0.76, 0.92));
    if (cl > 0.01) {
      sx.save();
      sx.globalAlpha = cl * (LIGHT ? 0.9 : 0.7);
      sx.fillStyle = rgb(mix(s.bot, [255, 255, 255], 0.45));
      for (let i = 0; i < (LIGHT ? 4 : 8); i++) {
        const cw = cols * (0.10 + hash(i * 2.2) * 0.16);
        const ch = rows * 0.016 * (0.6 + hash(i * 4.4));
        const cy = hz * (0.14 + hash(i * 5.1) * 0.52);
        const cx = ((hash(i * 9.4) * cols + p * cols * 0.7 + i * 37) % (cols + cw * 3)) - cw * 1.5;
        if (LIGHT) {
          // by day: a lavender shadow underneath, then a white top, so each cloud has shape
          sx.fillStyle = rgb(mix(s.mid || LPAL.lavender, s.top, 0.35));
          sx.beginPath(); sx.ellipse(cx + cw * 0.04, cy + ch * 0.55, cw, ch, 0, 0, TAU); sx.fill();
          sx.fillStyle = rgb(mix([255, 250, 246], s.mid2 || s.bot, 0.3));
        }
        sx.beginPath(); sx.ellipse(cx, cy, cw, ch, 0, 0, TAU); sx.fill();
        sx.beginPath(); sx.ellipse(cx + cw * 0.32, cy - ch * 0.75, cw * 0.48, ch * 0.9, 0, 0, TAU); sx.fill();
      }
      // and one that isn't like the others: it drifts up into the sun, meets it, and carries on
      const hcx = sunX + (p - HEART_MEET) * cols * 3.2;
      const hcy = sunY - (p - HEART_MEET) * rows * 0.5 + Math.sin(p * 14) * rows * 0.01;
      const hs  = Math.max(5, rows * 0.058);
      sx.globalAlpha = cl * 0.85;
      sx.fillStyle = rgb(mix(s.bot, [255, 150, 196], 0.7));      // blushing, so it reads against the glow
      heartCloud(hcx, hcy, hs);

      const dxh = hcx - sunX, dyh = hcy - sunY, reach = rows * 0.068 + hs * 0.8;
      heartC.touching = cl > 0.3 && alt > 0.06 && dxh * dxh + dyh * dyh < reach * reach;
      heartC.visible  = cl > 0.1 && hcx > -hs && hcx < cols + hs;
      sx.restore();
    } else {
      heartC.touching = false;
      heartC.visible  = false;
    }

    // birds, briefly
    const bd = seg(p, 0.52, 0.62) * (1 - seg(p, 0.70, 0.80));
    if (bd > 0.02) {
      sx.fillStyle = rgba([12, 12, 16], bd);
      for (let i = 0; i < 6; i++) {
        const bx = ((hash(i * 11.3) * cols + p * cols * 1.6) % (cols + 20)) - 10;
        const by = hz * (0.22 + hash(i * 6.6) * 0.3) + Math.sin(time * 0.001 + i) * rows * 0.01;
        sx.fillRect(bx | 0, by | 0, 1, 1);
        sx.fillRect((bx + 1) | 0, (by - 1) | 0, 1, 1);
        sx.fillRect((bx - 1) | 0, (by - 1) | 0, 1, 1);
      }
    }

    // mountain ridges, growing out of the horizon
    for (let i = 0; i < RIDGES.length; i++) {
      const R  = RIDGES[i];
      const rv = seg(p, R.a, R.b);
      if (rv <= 0) continue;
      const e = smooth(rv);
      const peak = hz - (R.base + R.amp) * rows * e;
      const haze = mix(s.bot, [255, 238, 224], 0.22);
      const rgGrad = sx.createLinearGradient(0, peak, 0, hz + rows * 0.05);
      if (LIGHT) {
        // far hills dusty blue, then sage, then deep eucalyptus up close: a garden at golden hour
        const RL = [[[150, 120, 226], [ 92,  76, 190]], [[ 20, 170, 180], [  8, 110, 140]], [[ 24,  96, 120], [ 30,  34, 104]]][Math.min(i, 2)];
        rgGrad.addColorStop(0, rgb(mix(haze, RL[0], 0.62 + R.dark * 0.3)));
        rgGrad.addColorStop(1, rgb(mix(haze, RL[1], Math.min(1, 0.74 + R.dark * 0.26))));
      } else {
        rgGrad.addColorStop(0, rgb(mix(haze, PAL.violet,  0.34 + R.dark * 0.52)));
        rgGrad.addColorStop(1, rgb(mix(haze, [30, 12, 58], Math.min(1, 0.52 + R.dark * 0.48))));
      }
      sx.fillStyle = rgGrad;
      sx.beginPath();
      sx.moveTo(0, rows);
      for (let x = 0; x <= cols; x++) {
        const h = hz - (R.base + R.amp * ridgeH(x, R.k)) * rows * e;
        sx.lineTo(x, h);
      }
      sx.lineTo(cols, rows);
      sx.closePath();
      sx.fill();
    }

    // water
    const wg = sx.createLinearGradient(0, hz, 0, rows);
    if (LIGHT) {
      // the water mirrors the sky's bands: the horizon colour first, then turquoise, cobalt, deep indigo
      wg.addColorStop(0, rgb(mix(s.mid2 || s.bot, [ 20, 170, 200], 0.45)));
      wg.addColorStop(0.35, rgb(mix(s.mid || s.bot, [ 20, 110, 210], 0.6)));
      wg.addColorStop(1, rgb(mix(s.top, [ 18,  30, 100], 0.75)));
    } else {
      wg.addColorStop(0, rgb(mix(s.bot, [46, 20, 96], 0.38)));
      wg.addColorStop(1, rgb(mix(s.top, [20,  8, 44], 0.46)));
    }
    sx.fillStyle = wg;
    sx.fillRect(0, hz, cols, rows - hz);

    // ripple bands, so the water has texture instead of sitting flat
    const rip = LIGHT ? mix(LPAL.champagne, [255, 255, 255], 0.4) : mix(mix(s.bot, PAL.green, 0.22), [255, 255, 255], 0.26);
    for (let y = hz + 1; y < rows; y++) {
      const dd = (y - hz) / (rows - hz);
      const w = Math.sin(y * 1.35 + time * 0.0011 + Math.sin(y * 0.31) * 2.0);
      const a = Math.max(0, w) * (LIGHT ? 0.42 : 0.16) * (1 - dd * 0.45);
      if (a < 0.006) continue;
      sx.fillStyle = rgba(rip, a);
      sx.fillRect(0, y, cols, 1);
    }

    // horizon seam
    sx.fillStyle = rgba(mix(s.bot, [255, 255, 255], 0.35), 0.5);
    sx.fillRect(0, hz, cols, 1);

    // sun / moon reflection on the water
    const refC = alt > 0.001 ? (LIGHT ? mix(sunC, [255, 255, 255], 0.35) : sunC) : (LIGHT ? [236, 240, 255] : [214, 226, 255]);
    const refA = alt > 0.001 ? alt : mo * (LIGHT ? 1.3 : 0.85);
    if (refA > 0.01) {
      const rx = alt > 0.001 ? sunX : cols * 0.74;
      sx.globalCompositeOperation = dayLook() ? 'source-over' : 'lighter';
      for (let y = hz; y < rows; y++) {
        const d   = (y - hz) / (rows - hz);
        const wob = Math.sin(y * 0.85 + time * 0.0016) * cols * 0.016 * (0.35 + d);
        const wdt = rows * (LIGHT ? 0.03 : 0.020) * (1 + d * 4.0) * (0.55 + 0.45 * Math.sin(y * 1.7 + time * 0.0019));
        const a   = (1 - d) * (LIGHT ? 0.7 : 0.34) * refA * (0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(y * 2.0 + time * 0.0024)), 1.4));
        if (a <= 0.004) continue;
        sx.fillStyle = rgba(refC, a);
        sx.fillRect(rx - wdt + wob, y, wdt * 2, 1);
      }
      sx.globalCompositeOperation = 'source-over';
    }

    return skyExtras(p, time, dz, dzm, s);
  }

  // hearts and disco lights, on top of either landscape (hills and water, or the clouds)
  function skyExtras(p, time, dz, dzm, s) {
    // hearts bubbling up out of the water
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      const age = time - h.born;
      if (age < 0) continue;
      if (age > h.life) { hearts.splice(i, 1); continue; }
      const t = age / h.life;
      const hy = h.y - t * rows * 0.62;
      const hx = h.x + Math.sin(age * 0.0021 + h.seed) * 2.2;
      const a  = smooth(clamp(t / 0.12)) * (1 - smooth(clamp((t - 0.7) / 0.3)));
      drawPixelHeart(hx | 0, hy | 0, h.big, h.col, a);
    }

    // disco lights, swept across sky, hills and water as the ball turns
    const party = Math.max(dz, dzm);
    if (party > 0.01) {
      const rot = time * 0.0016;
      sx.globalCompositeOperation = dayLook() ? 'source-over' : 'lighter';
      const nl = dayLook() ? 120 : 70;                    // on paper: more, bigger, bolder lights so the party shows
      for (let i = 0; i < nl; i++) {
        const speed = 0.6 + hash(i * 2.3) * 0.6;
        const lx = (((hash(i * 8.1) * cols + rot * cols * 0.17 * speed) % cols) + cols) % cols;
        const ly = hash(i * 4.7) * rows;
        const sz = dayLook() ? (hash(i * 6.1) > 0.5 ? 4 : 3) : (hash(i * 6.1) > 0.6 ? 3 : 2);
        const a  = party * (0.6 + 0.4 * hash(i * 3.9)) * (0.65 + 0.35 * Math.sin(time * 0.009 + i));
        sx.fillStyle = rgba((dayLook() ? DISCO_LIGHTS_LIGHT : DISCO_LIGHTS)[i % DISCO_LIGHTS.length], a);
        sx.fillRect(lx | 0, ly | 0, sz, sz);
      }
      sx.globalCompositeOperation = 'source-over';
    }

    return s;
  }

  /* ---------- light mode: texture like a photo ----------
     The opening photo looks alive because every patch of it has its own light and shade.
     The painted landscape is smooth, so in light mode it gets the same kind of texture:
     soft blotchy clouds in the sky, dappled light and shade on the hills with a sunlit
     rim along each ridge, and long streaks of light on the water with the odd sparkle. */
  // smooth random noise, from a table of random numbers worked out once (fast enough for every frame)
  const LAT = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) LAT[i] = hash(i * 0.731 + 11.3);
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = xi & 255, x1 = (xi + 1) & 255, y0 = (yi & 255) << 8, y1 = ((yi + 1) & 255) << 8;
    const a = LAT[x0 + y0], b = LAT[x1 + y0], c = LAT[x0 + y1], d = LAT[x1 + y1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // the parts of the texture that never move, worked out once per screen size
  let TEX = null;
  function buildTex() {
    const n = cols * rows;
    TEX = { hill: new Float32Array(n), hill2: new Float32Array(n), sky2: new Float32Array(n), trip: [new Uint8Array(n), new Uint8Array(n), new Uint8Array(n)] };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      TEX.hill[i] = vnoise(x * 0.35, y * 0.35) * 0.6 + vnoise(x * 0.9, y * 0.9) * 0.4;
      TEX.hill2[i] = vnoise(x * 0.12 + 3, y * 0.2);
      TEX.sky2[i] = vnoise(x * 0.22, y * 0.3) * 0.35;
      for (let k = 0; k < 3; k++) TEX.trip[k][i] = (Math.floor(vnoise(x * 0.04 + k * 5, y * 0.06) * 4) + k) % 4;
    }
  }
  // light mode's stars and sparkles: golden and white, some as little crosses, at both ends of the journey
  function starsOnTop(data, p, time) {
    const night = Math.max(1 - seg(p, 0.02, 0.24), seg(p, 0.76, 0.96));
    if (night < 0.02) return;
    const put = (x, y, c, a) => {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      const o = (y * cols + x) * 4;
      data[o] += (c[0] - data[o]) * a; data[o + 1] += (c[1] - data[o + 1]) * a; data[o + 2] += (c[2] - data[o + 2]) * a;
    };
    for (let i = 0; i < 70; i++) {
      const x = (hash(i * 3.3) * cols) | 0, y = (hash(i * 7.7) * horizonY * 0.8) | 0;
      const a = night * (0.6 + 0.4 * Math.sin(time * 0.0012 + i * 1.7));
      const c = hash(i * 2.9) > 0.5 ? [255, 222, 120] : [255, 252, 240];
      put(x, y, c, a);
      if (hash(i * 5.1) > 0.55) { put(x - 1, y, c, a * 0.7); put(x + 1, y, c, a * 0.7); put(x, y - 1, c, a * 0.7); put(x, y + 1, c, a * 0.7); }
    }
  }
  // a little colour play: patches drift between magenta, cyan and violet
  const TRIP = [[232, 70, 170], [40, 200, 220], [140, 90, 230], [255, 120, 140]], WHITE = [255, 255, 255];
  function trip(x, y, k) { return TRIP[TEX.trip[k][y * cols + x]]; }
  const ridgeTops = [];
  let SUNX = 0;
  function texturize(data, p, time) {
    const hz = horizonY;
    if (!TEX || TEX.hill.length !== cols * rows) buildTex();
    let n = 0;
    for (let i = 0; i < RIDGES.length; i++) {
      const R = RIDGES[i], rv = seg(p, R.a, R.b);
      if (rv <= 0) continue;
      const e = smooth(rv);
      const t = ridgeTops[n] && ridgeTops[n].length === cols ? ridgeTops[n] : (ridgeTops[n] = new Float32Array(cols));
      for (let x = 0; x < cols; x++) t[x] = hz - (R.base + R.amp * ridgeH(x, R.k)) * rows * e;
      n++;
    }
    const drift = time * 0.00003, spark = Math.floor(time * 0.004);
    const night = NIGHTK > 0.5;
    const rimW = night ? 1.5 : 1, rimA = night ? 0.8 : 1;      // by day one thin bright line, at night a thick glowing edge
    const rimC = night ? [255, 186, 40] : LPAL.champagne;       // Andy's pick: rich gold at night, soft champagne by day
    const play = time * 0.00004;                                // the sunlit patches drift slowly along the ridges
    const cloud = mix(LPAL.blush, [255, 255, 255], 0.45);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const o = (y * cols + x) * 4;
        let top = hz, rim = 99, rimK = 0;
        for (let k = 0; k < n; k++) {
          const t = ridgeTops[k][x];
          if (t < top) top = t;
          const dd = y - t;
          if (dd >= 0 && dd < rim) { rim = dd; rimK = k; }
        }
        let f, tint = null, ta = 0;
        if (y >= hz) {
          const w = vnoise(x * 0.05 + drift * 40, y * 0.85);
          f = 0.6 + 0.7 * w;
          const w2 = vnoise(x * 0.03 - drift * 30, y * 0.5 + 7);
          if (w2 > 0.6) { tint = trip(x, y, 1); ta = Math.min(0.7, (w2 - 0.6) * 2); }   // iridescent streaks
          if (LAT[(x * 13 + y * 71 + spark * 29) & 65535] > 0.976) { tint = WHITE; ta = 1; }
        } else if (y >= top) {
          const w = TEX.hill[o >> 2];
          f = 0.62 + 0.56 * w - 0.22 * clamp((y - top) / (hz - top + 1));
          const w2 = TEX.hill2[o >> 2];
          if (w2 > 0.62) { tint = trip(x, y, 2); ta = Math.min(0.6, (w2 - 0.62) * 1.8); }
          // the golden edge: at night all along the ridges; by day only where the sun catches them —
          // on the slopes that face the sun, more and stronger the closer they are to it
          if (rim < rimW) {
            if (night) { tint = rimC; ta = rimA; }
            else {
              const t = ridgeTops[rimK], sl = t[Math.min(cols - 1, x + 1)] - t[Math.max(0, x - 1)];
              const facing = (x < SUNX ? sl : -sl) > 0.1;
              const near = 1 - clamp(Math.abs(x - SUNX) / (cols * 0.75));
              if (facing && vnoise(x * 0.09 + rimK * 9.7 + play, rimK * 3.1) * 0.55 + near * 0.65 > 0.6) { tint = rimC; ta = 0.55 + 0.45 * near; }
            }
          }
        } else {
          const w = vnoise(x * 0.07 + drift * 60, y * 0.16) * 0.65 + TEX.sky2[o >> 2];
          f = 0.86 + 0.24 * w;
          if (w > 0.7) { tint = cloud; ta = Math.min(0.5, (w - 0.7) * 2.2); }          // a few soft clouds, not fog
          else if (w < 0.32) { tint = trip(x, y, 0); ta = (0.32 - w) * 1.4; }        // and a little colour play
        }
        let r = data[o] * f, g = data[o + 1] * f, b = data[o + 2] * f;
        if (tint) { r += (tint[0] - r) * ta; g += (tint[1] - g) * ta; b += (tint[2] - b) * ta; }
        data[o] = r; data[o + 1] = g; data[o + 2] = b;     // (the array clamps to 0–255 itself)
      }
    }
  }

  /* ---------- dot grid ---------- */

  function buildDots() {
    dots = new Array(cols * rows);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n  = hash(r * cols + c + 1);
        const n2 = hash((r * cols + c) * 1.77 + 5);
        const ny = r / rows, nx = c / cols;
        // reveal spreads out from the horizon line, with a noisy edge
        const dist = Math.abs(ny - 0.58) * 1.25 + Math.abs(nx - 0.5) * 0.40;
        dots[i++] = {
          c: c,
          r: r,
          x: c * CELL + (r % 2 ? CELL * 0.5 : 0),
          y: r * CELL,
          ox: (n  - 0.5) * CELL * 16,
          oy: (n2 - 0.5) * CELL * 16,
          thr: clamp(dist * 0.78 + n * 0.34),
          n: n,
          leave: 0.04 + hash((r * cols + c) * 2.31 + 0.7) * 0.36   // when this dot lets go of the photo
        };
      }
    }
  }

  // the spacing of the dot grid: a little finer in light mode, where smaller dots read sharper
  function cellFor(w, light) {
    return light ? (w < 700 ? 4.5 : w < 1300 ? 5 : 6) : (w < 700 ? 7 : w < 1300 ? 9 : 10);   // light: dense, like the opening photo
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    cv.width  = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    CELL = cellFor(W, LIGHT);
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    sc.width = cols;
    sc.height = rows;

    buildDots();
    samplePhoto();
  }

  /* ---------- draw ---------- */

  const MAXSCROLL = () => Math.max(1, document.body.scrollHeight - window.innerHeight);

  function render(time) {
    if (!started) started = time;
    // the screen got narrower without a resize event (on phones, something that briefly stuck out
    // while the page loaded can widen it for a moment): fit the art to the real width again
    if (window.innerWidth !== W) { resize(); dodgeSun(); }

    target = EMBED ? (((+EMBED.scene || 0) % 1) + 1) % 1 : clamp(window.scrollY / MAXSCROLL());
    // a photo opened big can ask for its own moment of the day (lightbox.js sets data-scene)
    // (and pushing the photo up or down moves the sun along with it: up = later in the day)
    if (lightbox && lightbox.open && lightbox.dataset.scene) target = clamp(parseFloat(lightbox.dataset.scene) - (parseFloat(lightbox.dataset.drag) || 0) * 0.4);
    // (the gallery too: scrolling through it carries the sky from morning into night)
    else if (gallery && gallery.open && gallery.dataset.scene) target = clamp(parseFloat(gallery.dataset.scene));
    if (EMBED) {
      // the arcade can carry the day on through the night (1 → 0): go the short way round
      let d = target - shown;
      if (d > 0.5) d -= 1; else if (d < -0.5) d += 1;
      shown = ((shown + d * (reduced ? 1 : 0.085)) % 1 + 1) % 1;
    } else shown += (target - shown) * (reduced ? 1 : 0.085);

    const p = shown;

    // the moment the heart cloud touches the sun, the sun becomes a disco ball
    if (!reduced && heartC.touching && !heartC.wasTouching && !discoHeld && time - discoStart > DISCO_LEN + 2000) {
      startDisco(time);
      eggsQuietUntil = time + DISCO_LEN + 12000;
    }
    heartC.wasTouching = heartC.touching;
    ball.tappable = ball.lit && heartC.visible;     // and while the heart is in the sky, you can tap the sun
    // a sun left switched on goes quiet by itself once the heart has drifted off
    if (discoHeld && discoWho === 'sun' && !heartC.visible && !EMBED) { discoHeld = false; discoEnd = time; }
    // the arcade keeps its ball on: the moon if it's up, otherwise the sun
    if (EMBED && EMBED.disco && !reduced) {
      const who = moonBall.on ? 'moon' : ball.lit ? 'sun' : null;
      if (who && (discoWho !== who || discoEnd !== Infinity)) { discoWho = who; discoStart = time - FADE_IN; discoEnd = Infinity; }
    } else if (EMBED && discoEnd === Infinity && !discoHeld) discoEnd = time;
    const lvl = discoLevel(time);
    const dz  = ball.lit && discoWho === 'sun' ? lvl : 0;

    // and once in a while, a few hearts out of the water — never on top of the disco
    artReady = p > 0.30;
    if (!reduced && artReady && lvl === 0 && time > nextHearts && time > eggsQuietUntil) {
      releaseHearts(cols * (0.15 + Math.random() * 0.7), horizonY + rows * (0.10 + Math.random() * 0.18), 3, time);
      nextHearts = time + 40000 + Math.random() * 20000;
      eggsQuietUntil = time + 8000 + 12000;
    }
    if (rsvpHover && moonBall.on && !celebrating) celebrate(true);
    if (arrivalParty && moonBall.on) { arrivalParty = false; moonParty(time, ARRIVAL_LEN); }
    if (yesParty && moonBall.on) { yesParty = false; moonParty(time, YES_LEN); }
    const dzm = moonBall.on && discoWho === 'moon' ? lvl : 0;
    const on = Math.max(dz, dzm) > 0.4;
    if (on !== discoOn) { discoOn = on; document.body.classList.toggle('disco', on); }

    if (EMBED) NIGHTK = LIGHT && EMBED.night ? 1 : 0;
    else if (LIGHT && lastSec) {
      const top = lastSec.getBoundingClientRect().top;
      NIGHTK = smooth(clamp((H * 0.9 - top) / (H * 0.55)));
    } else NIGHTK = 0;
    const nightOn = NIGHTK > 0.5;
    if (nightOn !== document.body.classList.contains('lightnight')) document.body.classList.toggle('lightnight', nightOn);
    const s = drawScene(p, reduced ? 0 : time, dz, dzm);
    const data = sx.getImageData(0, 0, cols, rows).data;
    if (LIGHT) { texturize(data, p, reduced ? 0 : time); starsOnTop(data, p, reduced ? 0 : time); }

    // backdrop: a very dark wash of the sky, so the page never reads as pure black
    const hv = EMBED ? 2 : p * MAXSCROLL() / H;       // how many screens down we are (the arcade: all settled)
    // light mode: white beside the opening photo, then a soft blush behind everything (so every card matches)
    const bd = LIGHT ? mix(mix([255, 255, 255], BLUSH_BG, smooth(seg(hv, 0.25, 0.85))), [8, 6, 18], NIGHTK) : null;
    ctx.fillStyle = LIGHT ? rgb(bd) : rgb(mix(s.top, [10, 4, 26], 0.74));
    ctx.fillRect(0, 0, W, H);

    // the fine-dot photo first; as you start scrolling it coarsens into the main grid
    const fineA = photoLayerReady ? 1 - smooth(seg(hv, 0.02, 0.16)) : 0;
    if (fineA > 0.002) {
      ctx.globalAlpha = fineA;
      ctx.drawImage(pl, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    const rp   = seg(hv, 0.22, 1.9) * 1.45;
    lbK += ((lightbox && lightbox.open) || (gallery && gallery.open) ? 1 - lbK : -lbK) * (reduced ? 1 : 0.07);
    measureRoom();
    const floor = roomFloor(), dim = roomDim();
    const FOLDS = foldInfo();
    const maxR = CELL * (LIGHT ? 0.6 : 0.54);   // in light mode the deepest dots nearly touch, so the colour is full
    const buckets = new Map();

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];

      // 0 = loose drifting dust, 1 = settled into the picture
      const t = (rp - d.thr) / 0.34;
      const e = t <= 0 ? 0 : t >= 1 ? 1 : smooth(t);
      const fl = 1 - e;

      const o = (d.r * cols + d.c) * 4;
      let R = data[o], G = data[o + 1], B = data[o + 2];
      const L = (0.299 * R + 0.587 * G + 0.114 * B) / 255;

      // settled radius comes from the scene
      const glowSize = 0.08 + 0.92 * Math.pow(L, 0.68);                 // on black: bright = big
      const settled = (LIGHT ? (0.5 + 0.5 * tone(R, G, B)) * (1 - NIGHTK) + glowSize * NIGHTK : glowSize) * maxR * (0.84 + 0.32 * d.n);
      const wl = settled * e;
      let rad = wl;

      // the opening photograph, giving way as the landscape arrives
      // the opening photograph, loosening dot by dot as you start to scroll
      const pa = photoA !== null ? photoA[i] : 0;
      const stay = pa > 0.01 ? 1 - smooth(clamp((hv - d.leave) / 0.28)) : 0;
      if (stay > 0.001 && fineA < 0.998) {
        const wp = (0.04 + 0.96 * photoL[i]) * maxR * (0.88 + 0.24 * d.n) * pa * stay * (1 - fineA);
        const sum = wp + wl;
        if (sum > 0) {
          R = (photoC[i * 3]     * wp + R * wl) / sum;
          G = (photoC[i * 3 + 1] * wp + G * wl) / sum;
          B = (photoC[i * 3 + 2] * wp + B * wl) / sum;
        }
        rad = sum;
      }
      // light mode's night page: the card behind the words is whitish like the other cards,
      // made of full pale dots on the black night (cardK: how much of this dot is card)
      // a card that can be turned over has its bottom-right corner folded up (FOLDS):
      // fz 1 = behind the fold (the landscape shows, full size), 2 = the flap, 3 = its shadow
      let fz = 0, ft = 0;
      for (let fi = 0; fi < FOLDS.length && !fz; fi++) {
        const FD = FOLDS[fi], u = FD.x - d.x, v = FD.y - d.y, F = FD.f, sh = CELL * 1.3;
        if (u >= 0 && v >= 0 && u <= F && v <= F) { if (u + v < F) fz = 1; else { fz = 2; ft = (u + v - F) / F; } }
        else if ((u >= 0 && u <= F && v > F && v < F + sh) || (v >= 0 && v <= F && u > F && u < F + sh)) fz = 3;
      }
      const cardK = !fz && LIGHT && NIGHTK > 0 ? clamp((1 - room[i]) / (1 - floor)) * NIGHTK : 0;
      if (fz !== 1) rad *= room[i];                     // make room for the words
      if (cardK > 0.002) rad += (maxR * 0.9 - rad) * cardK;
      if (fz === 2) rad = maxR * (0.98 - 0.28 * ft);    // the flap: paper, full dots
      if (rad < 0.22) continue;

      // in between, dots are cool drifting dust: photo dots drift apart and shrink as they
      // leave, landscape dots fly in and grow as they arrive
      const k = pa > 0.01 ? (1 - stay) * fl : fl;
      if (k > 0.002) {
        const gb = 0.45 + 0.95 * d.n;
        const dustC = LIGHT ? (d.n > 0.82 ? LPAL.rose : LPAL.dusty) : (d.n > 0.82 ? PAL.green : PAL.indigo);   // a few green specks in the drift
        R += (dustC[0] * gb - R) * k;
        G += (dustC[1] * gb - G) * k;
        B += (dustC[2] * gb - B) * k;
      }

      // behind the words the dots also dim a little towards the night, for a calmer card
      const calm = fz === 1 || fz === 2 ? 0 : (1 - room[i]) / (1 - floor);
      if (calm > 0.002) {
        const m = calm * dim;
        if (LIGHT) { R += (bd[0] - R) * m; G += (bd[1] - G) * m; B += (bd[2] - B) * m; }
        else { R += (12 - R) * m; G += (5 - G) * m; B += (30 - B) * m; }
      }
      if (cardK > 0.002) { const ck = cardK * 0.82; R += (CARD[0] - R) * ck; G += (CARD[1] - G) * ck; B += (CARD[2] - B) * ck; }
      if (fz === 2) {
        // the back of the paper: catching the light along the fold, a little shade toward the tip
        const c = ft < 0.1 ? (LIGHT ? [255, 255, 255] : [246, 240, 255])
                : mix(LIGHT ? [226, 206, 214] : [206, 192, 246], LIGHT ? [178, 154, 170] : [118, 100, 186], ft);
        R = c[0]; G = c[1]; B = c[2];
      } else if (fz === 3) { R *= 0.62; G *= 0.62; B *= 0.66; rad = Math.max(rad, maxR * 0.5); }   // the flap's soft shadow on the card

      let x = d.x, y = d.y;
      if (k > 0.001) {
        const dr = reduced ? 0 : k;
        x += d.ox * k + Math.sin(time * 0.0006 + d.n * 9.0) * dr * 11;
        y += d.oy * k + Math.cos(time * 0.0005 + d.n * 7.0) * dr * 11;
      }

      // dots on the mirror ball are drawn as square tiles
      const bx = d.c + 0.5 - ball.x, by = d.r + 0.5 - ball.y;
      const mx = d.c + 0.5 - moonBall.x, my = d.r + 0.5 - moonBall.y;
      const tile = (dz > 0.35 && bx * bx + by * by <= ball.r * ball.r) ||
                   (dzm > 0.35 && mx * mx + my * my <= moonBall.r * moonBall.r);

      const qr = R >> QS, qg = G >> QS, qb = B >> QS;
      const key = ((qr << 10) | (qg << 5) | qb) + (tile ? 32768 : 0);
      let b = buckets.get(key);
      if (b === undefined) {
        b = { p: new Path2D(), c: 'rgb(' + (qr * QK | 0) + ',' + (qg * QK | 0) + ',' + (qb * QK | 0) + ')' };
        buckets.set(key, b);
      }
      if (tile) {
        const h = rad * 0.82;
        b.p.rect(x - h, y - h, h * 2, h * 2);
      } else {
        b.p.moveTo(x + rad, y);
        b.p.arc(x, y, rad, 0, TAU);
      }
    }

    buckets.forEach(b => { ctx.fillStyle = b.c; ctx.fill(b.p); });

    updateText();
    requestAnimationFrame(render);
  }

  /* ---------- room for the words ----------
     Behind each section's block of text the dots shrink partway, fading back to
     full size over a wide soft edge: a calm card made of the same dots, rather
     than a dark screen, with the art carrying on everywhere else. */

  // how small the dots get behind the text, and how much they darken there so nothing glares.
  // Phones keep them a little bigger: there the card fills most of the screen, and the
  // outline of the landscape should still show through it.
  const roomFloor = () => (W <= 720 ? 0.25 : 0.2);
  const roomDim   = () => (LIGHT ? 0.45 : 0.32);   // light mode: towards the blush, so every card looks the same
  const ROOM_PAD = 30, ROOM_FEATHER = 96;   // a wide, gentle fade from the busy art into the calm card
  const TEXT_SEL = 'h1, h2, p, dt, dd, li';
  const CTRL_SEL = '.pill, .games-btn, .sec button:not(.turn), .acc > summary, .sec figure, .sec .peek';   // buttons, open/close rows and photos sit in the card too (not the folded corner)
  const roomSecs = Array.prototype.slice.call(document.querySelectorAll('.sec'));
  const roomRange = document.createRange();
  let room = null;                     // per dot: 1 = full size, smaller behind the words

  // the box around a section's actual words (not its full column), in viewport pixels
  function wordsBox(sec, dy) {
    let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    const els = sec.querySelectorAll(TEXT_SEL);
    for (let k = 0; k < els.length; k++) {
      roomRange.selectNodeContents(els[k]);
      const rects = roomRange.getClientRects();
      for (let q = 0; q < rects.length; q++) {
        const r = rects[q];
        if (r.width < 2) continue;
        if (r.left < L) L = r.left;
        if (r.right > R) R = r.right;
        if (r.top + dy < T) T = r.top + dy;
        if (r.bottom + dy > B) B = r.bottom + dy;
      }
    }
    const ctrls = sec.querySelectorAll(CTRL_SEL);
    for (let k = 0; k < ctrls.length; k++) {
      const r = ctrls[k].getBoundingClientRect();
      if (r.width < 2) continue;                       // hidden
      if (r.left < L) L = r.left;
      if (r.right > R) R = r.right;
      if (r.top + dy < T) T = r.top + dy;
      if (r.bottom + dy > B) B = r.bottom + dy;
    }
    return L === Infinity ? null : { L: L, T: T, R: R, B: B };
  }

  // the folded corner of a card that can be turned over (flip.js: a story version, or the
  // Rösås card): the card's bottom-right corner; the (invisible) button is kept on it
  const FOLD_HIT = 80;
  // a photo opened big (lightbox.js): the cards dissolve and the whole landscape shows behind it
  const lightbox = document.querySelector('.lightbox');
  const gallery = document.querySelector('.gallery');
  let lbK = 0;
  // the section's turn-over button on the card that's showing (a section can hold several,
  // one per story version; the hidden ones have no offsetParent)
  const turnOf = sec => {
    const bs = sec.querySelectorAll('.turn');
    for (let k = 0; k < bs.length; k++) if (bs[k].offsetParent !== null) return bs[k];
    return null;
  };
  function foldInfo() {
    const out = [];
    for (let k = 0; k < roomSecs.length; k++) {
      const sec = roomSecs[k], btn = turnOf(sec);
      if (!btn || parseFloat(sec.style.opacity || '1') < 0.04) continue;
      const b = wordsBox(sec, 0);
      if (!b || b.B < -120 || b.T > H + 120) continue;
      const cx = Math.min(b.R + ROOM_PAD, W - 4), cy = b.B + ROOM_PAD;
      const host = btn.offsetParent;
      if (host) {
        const hr = host.getBoundingClientRect();
        const l = Math.round(cx - FOLD_HIT - hr.left), t = Math.round(cy - FOLD_HIT - hr.top);
        if (btn._l !== l || btn._t !== t) { btn.style.left = l + 'px'; btn.style.top = t + 'px'; btn._l = l; btn._t = t; }
      }
      if (lbK < 0.97) out.push({ x: cx, y: cy, f: parseFloat(btn.dataset.fold || '42') * (1 - lbK) });
    }
    return out;
  }

  function measureRoom() {
    const n = cols * rows;
    const floor = roomFloor();
    if (!room || room.length !== n) room = new Float32Array(n);
    room.fill(1);
    for (let k = 0; k < roomSecs.length; k++) {
      const sec = roomSecs[k];
      const strength = parseFloat(sec.style.opacity || '1');   // the card fades with its words
      if (strength < 0.04) continue;
      const b = wordsBox(sec, 0);
      if (!b || b.B < -60 || b.T > H + 60) continue;
      const L = b.L - ROOM_PAD, Rt = b.R + ROOM_PAD, T = b.T - ROOM_PAD, B = b.B + ROOM_PAD;
      // a story card that can be turned over is a sheet of paper: crisp edges, so its folded corner reads
      const FE = turnOf(sec) ? CELL * 1.2 : ROOM_FEATHER;
      const c0 = Math.max(0, Math.floor((L - FE) / CELL) - 1), c1 = Math.min(cols - 1, Math.ceil((Rt + FE) / CELL));
      const r0 = Math.max(0, Math.floor((T - FE) / CELL)),     r1 = Math.min(rows - 1, Math.ceil((B + FE) / CELL));
      for (let rr = r0; rr <= r1; rr++) {
        for (let cc = c0; cc <= c1; cc++) {
          const x = cc * CELL + (rr % 2 ? CELL * 0.5 : 0), y = rr * CELL;
          const dx = Math.max(L - x, 0, x - Rt), dy = Math.max(T - y, 0, y - B);
          const near = 1 - smooth(clamp(Math.sqrt(dx * dx + dy * dy) / FE));
          const f = 1 - (1 - floor) * strength * near;
          const i = rr * cols + cc;
          if (f < room[i]) room[i] = f;
        }
      }
    }
    if (lbK > 0.001) for (let i = 0; i < n; i++) room[i] += (1 - room[i]) * lbK;
  }

  /* ---------- keep the words off the sun ----------
     On wider screens the sections strictly alternate sides. Where a section's
     words would sit on the sun at the moment that section is centred on screen,
     they slide down (or up) just far enough to clear it — never to the other
     side, so the left-right rhythm stays consistent. */

  function sunAt(p) {
    const hz = Math.round(rows * 0.58);
    const sunT = clamp(p / 0.88), alt = Math.sin(sunT * Math.PI);
    return {
      up: alt > 0.06,
      x: (cols * (0.16 + sunT * 0.60) - 0.5) * CELL,
      y: (hz + rows * 0.10 - alt * (hz + rows * 0.10) * 0.90 - 0.5) * CELL,
      r: rows * 0.068 * CELL * 1.45 + 14                    // the disc, its glow, and a little air
    };
  }

  function clearance(sun, b) {
    const nx = clamp(sun.x, b.L, b.R), ny = clamp(sun.y, b.T, b.B);
    return Math.hypot(sun.x - nx, sun.y - ny) - sun.r;
  }

  function dodgeSun() {
    const narrow = W <= 720;
    const max = MAXSCROLL();
    roomSecs.forEach((sec, k) => {
      const inner = sec.querySelector('.inner');
      inner.style.removeProperty('--dodge');
      if (k === 0 || narrow) return;                        // not the first screen, not on phones
      const p = clamp((sec.offsetTop + sec.offsetHeight / 2 - H / 2) / max);
      const sun = sunAt(p);
      if (!sun.up) return;
      // where the words would be with this section centred on screen
      const dy = (H / 2 - sec.offsetHeight / 2) - sec.getBoundingClientRect().top;
      const b = wordsBox(sec, dy);
      if (!b || clearance(sun, b) >= 0) return;
      // in the way: slide the words clear of it, vertically
      const above = sun.y < (b.T + b.B) / 2;
      const need = above ? (sun.y + sun.r) - b.T : b.B - (sun.y - sun.r);
      const shift = Math.min(Math.max(0, need), H * 0.22);
      inner.style.setProperty('--dodge', (above ? shift : -shift).toFixed(0) + 'px');
    });
  }

  /* ---------- copy fades with the scroll ---------- */

  const secs = Array.prototype.slice.call(document.querySelectorAll('.sec'));

  function updateText() {
    const vh = window.innerHeight;
    for (let i = 0; i < secs.length; i++) {
      const r = secs[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      // a long block of text (like the story) stays fully visible the whole time it's
      // being read, and only fades once it's leaving; short ones fade from their middle
      const inner = secs[i].querySelector('.inner');
      const ih = inner ? inner.offsetHeight : 0;
      const plateau = ih > vh * 0.6 ? ih / 2 - vh * 0.12 : 0;
      const off = mid - vh / 2;
      const dist = Math.max(0, Math.abs(off) - plateau) * Math.sign(off);
      const d = Math.abs(dist) / (vh * 0.68);
      const o = clamp(1 - d * d);
      secs[i].style.opacity = o.toFixed(3);
      secs[i].style.transform = 'translateY(' + (dist * 0.055).toFixed(1) + 'px)';
    }
  }

  /* ---------- tap the sun ---------- */

  const INTERACTIVE = 'a, button, input, select, textarea, label, dialog, summary, details';

  function near(b, cx, cy) {
    const dx = cx - (b.x - 0.5) * CELL, dy = cy - (b.y - 0.5) * CELL;
    const rr = b.r * CELL + 18;                   // a little forgiveness for fingers
    return dx * dx + dy * dy <= rr * rr;
  }

  // the sun while the heart cloud is out, or the moon-ball at night
  function overSun(cx, cy) {
    return (ball.tappable && near(ball, cx, cy)) || (moonBall.on && near(moonBall, cx, cy));
  }

  document.addEventListener('click', e => {
    if (e.target.closest(INTERACTIVE)) return;
    if (EMBED && !EMBED.taps) return;
    const now = performance.now();
    if (ball.tappable && near(ball, e.clientX, e.clientY))  { toggleDisco(now, 'sun');  return; }
    if (moonBall.on   && near(moonBall, e.clientX, e.clientY)) { toggleDisco(now, 'moon'); return; }
    // tap the water and hearts come up from where you touched it
    if (!reduced && artReady && e.clientY > horizonY * CELL) {
      releaseHearts(e.clientX / CELL, e.clientY / CELL, 3 + ((Math.random() * 2) | 0), now);
    }
  });

  document.addEventListener('mousemove', e => {
    const over = !e.target.closest(INTERACTIVE) && overSun(e.clientX, e.clientY);
    if (over !== hoverSun) { hoverSun = over; document.body.style.cursor = over ? 'pointer' : ''; }
  }, { passive: true });

  // for anyone who opens the console
  window.disco  = () => { startDisco(performance.now()); return '\u{1FAA9}'; };
  window.hearts = () => { releaseHearts(cols * 0.5, horizonY + rows * 0.15, 5, performance.now()); return '\u2764\uFE0F'; };

  document.querySelectorAll('.rsvp-open').forEach(b => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { rsvpHover = true; celebrate(true); } });
    b.addEventListener('pointerleave', () => { rsvpHover = false; celebrate(false); });
  });

  // Phones can't hover over RSVP, so there the party starts by itself when a guest
  // reaches "Are you in?" at the end: the moon turns into the disco ball (and the
  // two of us dance, dance.js) for a few seconds, then settles. Tapping the moon
  // still brings it back. At most once every 25 seconds.
  const lastWords = document.querySelector('.sec:last-child .inner');
  if (lastWords && window.matchMedia && window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    let lastArrival = -Infinity;
    new IntersectionObserver(es => {
      const now = performance.now();
      if (es[0].isIntersecting && now - lastArrival > 25000) { lastArrival = now; arrivalParty = true; }
    }, { threshold: 0.6 }).observe(lastWords);
  }

  window.addEventListener('resize', () => { resize(); dodgeSun(); }, { passive: true });
  document.addEventListener('layoutchange', dodgeSun);       // e.g. the story switching versions
  document.querySelectorAll('.acc').forEach(d => d.addEventListener('toggle', dodgeSun));   // a travel group opening or closing
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dodgeSun);
  window.addEventListener('load', dodgeSun, { once: true });
  requestAnimationFrame(render);
})();
