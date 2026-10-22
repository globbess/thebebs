/* Little clips turned into the same dots and colours as the opening photo.

   The dance: the two of us at a party, Andrea twirling a napkin. It loops beside
   "Are you in?" as an easter egg that only shows while the moon is a disco ball
   (style.css fades it in with body.disco). Only Lonis and Andrea are in it — they
   were cut out of the video beforehand.

   The party: in the RSVP card after a "yes", everyone dancing on the terrace at night,
   Andrea in the blue dress and Lonis next to her in black (partyphoto.js).

   The single dramatic tear: shown in the RSVP card after a "no". A look into the
   camera, a thumb wiping the tear away, then the head drops. It plays from the
   start every time the card shows it, rests on the sad bit, and goes again.

   Each clip's frames live in a small sprite (dancephoto.js, partyphoto.js, sadphoto.js): a grid of
   tiles, each with the colour on top and who to keep (white) underneath. */

(() => {
  'use strict';

  const CLIPS = [
    { sel: '.dance', sprite: window.DANCE_SPRITE, frames: 4, cols: 4, gw: 72, gh: 112,
      step: 140,                 // ms per frame: the napkin goes round and round
      lift: [0.44, 0.56] },      // brighten dark tones a lot: Lonis's black shirt shows against the night
    { sel: '.party', sprite: window.PARTY_SPRITE, frames: 79, cols: 10, gw: 78, gh: 179,
      sharpen: 0.8,              // a gentle sharpen, so faces and edges hold up in dots
      step: 140,                 // the whole video (cut at 6 frames a second), a touch faster than real life
      rich: [1.45, 1.18, 0.3, 0.5],   // light mode: brighter, more saturated colour on the cream card
      night: [104, 84, 176],     // light mode: black clothes at night lift to a brighter violet, so they keep their texture
      sides: [0.16, 0],          // soft fade at the left edge of the crop only: Andrea dances right at the video's right edge
      fill: true,                // black clothes sometimes drop out of a frame: fill from the frames around it
      lift: [0.52, 0.48] },      // dark mode: lift the black clothes so everyone shows brightly on the dark card
    { sel: '.sad', sprite: window.SAD_SPRITE, frames: 38, cols: 8, gw: 60, gh: 107,
      step: 167,                 // real speed (the video was cut at 6 frames a second)
      hold: 1400,                // rest on the head-down frame before it starts again
      still: 37,                 // the frame shown to people who prefer less motion
      rich: [1.5, 0.82, 0.42, 0.58],  // light mode: printed like the opening photo (rich colour, strong colours big)
      oval: 0.3,                 // the face fills the video, so fade the dots out in a soft rounded shape instead of a hard box
      lift: [0.30, 0.70] }
  ].filter(c => c.sprite && document.querySelector(c.sel));
  if (!CLIPS.length) return;
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let LIGHT = document.documentElement.classList.contains("light");   // light mode (theme.js): printed on the cream cards

  // the same dark → light ramp as the opening photo: violet, magenta, orange, gold, cream
  const RAMP = [
    [0.00, [ 20,   8,  44]],
    [0.25, [ 74,  28, 124]],
    [0.50, [214,  66, 122]],
    [0.72, [255, 128,  34]],
    [0.88, [255, 196,  92]],
    [1.00, [255, 244, 216]]
  ];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  // light mode: Andy's light palette (deep blue, purple, mauve, melon, pink) on cream paper,
  // and each dot as big as its colour is strong
  const RAMP_LIGHT = [
    [0.00, [ 26,  61, 115]],
    [0.28, [111,  85, 150]],
    [0.50, [177,  96, 122]],
    [0.70, [227, 138, 138]],
    [0.88, [252, 177, 220]],
    [1.00, [250, 245, 238]]
  ];
  const PAPER = [250, 245, 238];
  const ink = c => Math.pow(clamp(Math.hypot(PAPER[0] - c[0], PAPER[1] - c[1], PAPER[2] - c[2]) / 250), 0.8);
  function ramp(L) {
    const R = LIGHT ? RAMP_LIGHT : RAMP;
    for (let i = 1; i < R.length; i++) {
      if (L <= R[i][0]) { const a = R[i - 1], b = R[i]; return mix(a[1], b[1], (L - a[0]) / (b[0] - a[0])); }
    }
    return R[R.length - 1][1];
  }

  // per frame and per dot: how sure we are it's one of us (A), how bright (L), what colour (C)
  function read(clip, img) {
    const { gw, gh, cols, frames } = clip;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, c.width, c.height).data;
    clip.cells = [];
    for (let f = 0; f < frames; f++) {
      const ox = (f % cols) * gw, oy = Math.floor(f / cols) * gh * 2;
      const n = gw * gh, A = new Float32Array(n), L = new Float32Array(n), C = new Float32Array(n * 3);
      for (let r = 0; r < gh; r++) {
        for (let q = 0; q < gw; q++) {
          const i = r * gw + q;
          const o = ((oy + r) * c.width + ox + q) * 4;            // colour
          const m = ((oy + gh + r) * c.width + ox + q) * 4;       // who to keep
          // keep only what the person detector was sure about, so there's no haze around us
          const sure = clamp((px[m] / 255 - 0.34) / 0.28);
          A[i] = sure * sure * (3 - 2 * sure);
          if (clip.oval) {
            const nx = (q + 0.5) / gw * 2 - 1, ny = (r + 0.5) / gh * 2 - 1;
            // squarer than an oval, so the peek in from the side still shows
            const e = clamp((1 - Math.cbrt(Math.abs(nx * nx * nx) + Math.abs(ny * ny * ny))) / clip.oval);
            A[i] *= e * e * (3 - 2 * e);
          }
          if (clip.sides) {
            const sd = Array.isArray(clip.sides) ? clip.sides : [clip.sides, clip.sides], sx = (q + 0.5) / gw;
            const e = Math.min(sd[0] ? clamp(sx / sd[0]) : 1, sd[1] ? clamp((1 - sx) / sd[1]) : 1);
            A[i] *= e * e * (3 - 2 * e);
          }
          if (A[i] < 0.04 && !clip.fill) continue;
          const R = px[o], G = px[o + 1], B = px[o + 2];
          const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
          const lift = clip.lift[0] + clip.lift[1] * Math.pow(clamp((lum - 0.03) / 0.8), 0.6);
          if (LIGHT && clip.rich) {
            // on the cream card: richer colours, and each dot as big as its colour is strong,
            // so the dark hair and eyes print bold instead of fading
            const [sat, bri, l0, l1] = clip.rich;
            const g = (R + G + B) / 3;
            let rc = [R, G, B].map(v => Math.max(0, Math.min(255, (g + (v - g) * sat) * bri)));
            if (clip.night) { const dk = Math.pow(1 - clamp(lum / 0.45), 2); rc = mix(rc, clip.night, dk * 0.7); }
            L[i] = l0 + l1 * ink(rc);
            C[i * 3] = rc[0]; C[i * 3 + 1] = rc[1]; C[i * 3 + 2] = rc[2];
            continue;
          }
          // light mode keeps the clip's own colours (Andrea's dress stays white); dark mode paints it in the palette
          const col = LIGHT ? [R, G, B].map(v => Math.min(255, v * 1.04))
                            : mix(ramp(lift), [R, G, B], 0.38);  // mostly palette, some of the real light
          L[i] = lift;
          C[i * 3] = col[0]; C[i * 3 + 1] = col[1]; C[i * 3 + 2] = col[2];
        }
      }
      clip.cells.push({ A: A, L: L, C: C });
    }
    if (clip.sharpen) {
      // a gentle sharpen of the dot sizes, so faces, hair and edges hold up in dots
      for (const c of clip.cells) {
        const L0 = c.L.slice();
        for (let r = 1; r < gh - 1; r++) for (let q = 1; q < gw - 1; q++) {
          const i = r * gw + q;
          c.L[i] = clamp(L0[i] + clip.sharpen * (L0[i] - (L0[i - 1] + L0[i + 1] + L0[i - gw] + L0[i + gw]) * 0.25));
        }
      }
    }
    if (clip.fill) {
      // a dot missing in one frame but there in the frames on both sides was a hole in the
      // cut-out (dark clothes at night): fill it, so nobody flickers
      const orig = clip.cells.map(c => c.A.slice());
      for (let f = 0; f < frames; f++) {
        const a = orig[(f + frames - 1) % frames], b = orig[(f + 1) % frames], A = clip.cells[f].A;
        for (let i = 0; i < A.length; i++) { const m = Math.min(a[i], b[i]); if (m > A[i]) A[i] = m; }
      }
    }
  }

  // draw one frame as dots onto a 2d context w × h (css pixels)
  function paint(x, clip, f, w) {
    const { gw, gh } = clip;
    const cell = w / gw, maxR = cell * 0.58;
    const d = clip.cells[f], buckets = new Map();
    for (let r = 0; r < gh; r++) {
      for (let q = 0; q < gw; q++) {
        const i = r * gw + q, a = d.A[i];
        if (a < 0.04) continue;
        const rad = (0.1 + 0.9 * d.L[i]) * maxR * a;
        if (rad < 0.25) continue;
        const px = (q + 0.5) * cell + (r % 2 ? cell * 0.5 : 0), py = (r + 0.5) * cell;
        const qr = d.C[i * 3] >> 5, qg = d.C[i * 3 + 1] >> 5, qb = d.C[i * 3 + 2] >> 5;
        const key = (qr << 10) | (qg << 5) | qb;
        let b = buckets.get(key);
        if (b === undefined) { b = { p: new Path2D(), c: 'rgb(' + qr * 36 + ',' + qg * 36 + ',' + qb * 36 + ')' }; buckets.set(key, b); }
        b.p.moveTo(px + rad, py);
        b.p.arc(px, py, rad, 0, Math.PI * 2);
      }
    }
    buckets.forEach(b => { x.fillStyle = b.c; x.fill(b.p); });
  }

  // a short clip is drawn once per frame and then just shown in turn; a long one is
  // drawn as it plays (keeping 32 ready-made frames would take a lot of a phone's memory)
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  function layout(clip) {
    if (!clip.cells) return;
    const s = dpr();
    clip.spots.forEach(sp => {
      const r = sp.cv.getBoundingClientRect();
      if (r.width < 2) return;                      // hidden for now
      const key = r.width + 'x' + r.height + '@' + s;
      if (key === sp.size) return;
      sp.size = key; sp.w = r.width;
      sp.cv.width = Math.round(r.width * s); sp.cv.height = Math.round(r.height * s);
      sp.frames = [];
      if (clip.frames <= 6) {
        for (let f = 0; f < clip.frames; f++) {
          const c = document.createElement('canvas');
          c.width = sp.cv.width; c.height = sp.cv.height;
          const x = c.getContext('2d');
          x.setTransform(s, 0, 0, s, 0, 0);
          paint(x, clip, f, r.width);
          sp.frames.push(c);
        }
      }
      sp.ready = true;
      show(clip, sp);
    });
  }
  function show(clip, sp) {
    if (!sp.ready) return;
    const f = still && clip.still !== undefined ? clip.still : clip.k;
    sp.ctx.setTransform(1, 0, 0, 1, 0, 0);
    sp.ctx.clearRect(0, 0, sp.cv.width, sp.cv.height);
    if (sp.frames.length) { sp.ctx.drawImage(sp.frames[f], 0, 0); return; }
    const s = dpr();
    sp.ctx.setTransform(s, 0, 0, s, 0, 0);
    paint(sp.ctx, clip, f, sp.w);
  }

  // only animate what's on screen (the easter egg: only while the moon is a disco
  // ball; the cards: while they're showing), and not at all for people who prefer less motion
  CLIPS.forEach(clip => {
    clip.k = 0; clip.last = 0;
    clip.spots = Array.prototype.slice.call(document.querySelectorAll(clip.sel)).map(cv => ({
      cv: cv, ctx: cv.getContext('2d'), frames: [], size: '', onScreen: true, shown: false,
      card: !cv.classList.contains('dance')         // in the RSVP card, rather than the moon easter egg
    }));
    clip.spots.forEach(sp => {
      if ('IntersectionObserver' in window) new IntersectionObserver(es => { sp.onScreen = es[0].isIntersecting; }).observe(sp.cv);
      if ('ResizeObserver' in window) new ResizeObserver(() => layout(clip)).observe(sp.cv);   // e.g. the card appearing
    });
  });

  function tick(t) {
    const party = document.body.classList.contains('disco');
    CLIPS.forEach(clip => {
      if (!clip.cells) return;
      const live = clip.spots.filter(sp => {
        const on = sp.ready && sp.onScreen && (sp.card ? sp.cv.offsetParent !== null : party);
        if (on && !sp.shown && clip.hold) { clip.k = 0; clip.last = t; show(clip, sp); }   // the tear starts from the beginning
        sp.shown = on;
        return on;
      });
      if (still || !live.length) return;
      const wait = clip.step + (clip.hold && clip.k === clip.frames - 1 ? clip.hold : 0);
      if (t - clip.last < wait) return;
      clip.last = t; clip.k = (clip.k + 1) % clip.frames;
      live.forEach(sp => show(clip, sp));
    });
    requestAnimationFrame(tick);
  }

  let loaded = 0;
  CLIPS.forEach(clip => {
    const img = new Image();
    clip.img = img;
    img.onload = () => {
      read(clip, img); layout(clip);
      if (++loaded === 1) requestAnimationFrame(tick);
    };
    img.src = clip.sprite;
  });
  document.addEventListener('themechange', () => {
    LIGHT = document.documentElement.classList.contains('light');
    CLIPS.forEach(clip => { if (clip.img && clip.img.complete) read(clip, clip.img); clip.spots.forEach(sp => { sp.size = ''; }); layout(clip); });
  });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => CLIPS.forEach(layout), 150); });
})();
