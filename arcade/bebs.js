/* The two bebs: Andy's own paper dolls of the two of us (andrea.png, lonis.png, dressed in
   wear.py's clothes), printed crisp in fine dots with a dark line round them so they stand out.

   Games call Bebs.andrea(g, x, y, u, o) and Bebs.lonis(g, x, y, u, o) with their feet at (x, y)
   in scene pixels; u is the size (Andrea stands 24u tall, Lonis 28u). Nothing is drawn into the
   scene: each call is noted, and the stage paints the dolls on top after its dots (Bebs.paint).
   o = { pose, phase, t, rot, pivot, flip, alpha }
     pose: 'run' bobs along, 'jump' leans into it, 'up' hops, 'twirl' spins, 'serve' leans back;
     anything else stands. rot turns them (radians) around a point pivot·u above the feet. */

(() => {
  'use strict';
  const SRC = { andrea: 'andrea.png?v=3', lonis: 'lonis.png?v=3' };   // her default: rust dress, suede boots, hoops, chain belt
  const TALL = { andrea: 24, lonis: 28 };
  const img = {}, ready = {};
  Object.keys(SRC).forEach(k => {
    img[k] = new Image();
    img[k].onload = () => { ready[k] = true; };
    img[k].src = SRC[k];
  });

  const OUTLINE = 'rgb(28,14,30)';
  const cache = new Map(), palettes = new Map();

  // the drawing's own few colours (up to 28), so every dot is one of them: crisp, like printed beads
  function paletteOf(key, im) {
    if (palettes.has(key)) return palettes.get(key);
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const c = document.createElement('canvas'); c.width = iw; c.height = ih;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, iw, ih).data, count = new Map();
    for (let i = 0; i < d.length; i += 8) {
      if (d[i + 3] < 200) continue;
      const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
      count.set(k, (count.get(k) || 0) + 1);
    }
    const P = [], byCount = [...count.entries()].sort((a, b) => b[1] - a[1]);
    const toCol = k => [((k >> 8) & 15) * 16 + 8, ((k >> 4) & 15) * 16 + 8, (k & 15) * 16 + 8];
    const far = (col, d) => P.every(q => Math.hypot(q[0] - col[0], q[1] - col[1], q[2] - col[2]) > d);
    byCount.forEach(([k]) => { const col = toCol(k); if (P.length < 28 && far(col, 34)) P.push(col); });
    // and the little things that are a colour of their own (gold hoops, a red slogan): rare, but kept
    byCount.forEach(([k, n]) => { const col = toCol(k); if (n >= 4 && P.length < 36 && far(col, 60)) P.push(col); });
    palettes.set(key, P);
    if (palettes.size > 40) palettes.delete(palettes.keys().next().value);
    return P;
  }
  function snap(P, r, g, b) {
    let best = P[0], bd = Infinity;
    for (const q of P) { const d = (q[0] - r) ** 2 * 3 + (q[1] - g) ** 2 * 4 + (q[2] - b) ** 2 * 2; if (d < bd) { bd = d; best = q; } }
    return best;
  }

  // the doll at a height of hp device pixels, printed in dots on a clean dark line: the dots touch,
  // each snapped to the drawing's own colours, and the hairline gaps between them are the doll's own
  // colour (a shade darker), not black, so skin and clothes stay bright
  // (src: a picture of the doll other than the usual one, e.g. dressed up (dress.js), with its own key)
  function dotted(who, hp, src, srcKey, fine) {
    const key = (srcKey || who) + ':' + hp + (fine ? ':f' : '');
    if (cache.has(key)) return cache.get(key);
    const im = src || img[who], dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const wp = Math.round(hp * iw / ih);
    const cell = fine ? Math.max(2.2, 2.2 * dpr) : Math.max(3, Math.min(hp / 70, 3.2 * dpr));   // fine: about 70 dots from head to toe at most
    const pad = Math.ceil(cell * 2);
    const P = paletteOf(srcKey || who, im);
    // the doll, plain, at this size
    const a = document.createElement('canvas'); a.width = wp; a.height = hp;
    const ax = a.getContext('2d', { willReadFrequently: true });
    ax.imageSmoothingQuality = 'high';
    ax.drawImage(im, 0, 0, wp, hp);
    const d = ax.getImageData(0, 0, wp, hp).data;
    const out = document.createElement('canvas'); out.width = wp + pad * 2; out.height = hp + pad * 2;
    const o = out.getContext('2d');
    // the line round them: the doll's shape grown by a little under a dot
    const ring = cell * 0.9;
    for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; o.drawImage(a, pad + Math.cos(an) * ring, pad + Math.sin(an) * ring); }
    o.globalCompositeOperation = 'source-in'; o.fillStyle = OUTLINE; o.fillRect(0, 0, out.width, out.height);
    o.globalCompositeOperation = 'source-over';
    // under the dots, the doll itself a shade darker
    const sh = document.createElement('canvas'); sh.width = wp; sh.height = hp;
    const shx = sh.getContext('2d'); shx.drawImage(a, 0, 0);
    shx.globalCompositeOperation = 'source-atop'; shx.fillStyle = 'rgba(0,0,0,0.28)'; shx.fillRect(0, 0, wp, hp);
    o.drawImage(sh, pad, pad);
    // the dots, on a staggered grid like the landscape's
    const buckets = new Map(), rad = cell * 0.5;
    for (let r = 0, y = cell / 2; y < hp; r++, y += cell * 0.87) {
      for (let x = (r % 2 ? cell : cell / 2); x < wp; x += cell) {
        const i = ((y | 0) * wp + (x | 0)) * 4;
        if (d[i + 3] < 110) continue;
        const c = snap(P, d[i], d[i + 1], d[i + 2]), k = c.join();
        let b = buckets.get(k);
        if (!b) { b = { p: new Path2D(), c: 'rgb(' + k + ')' }; buckets.set(k, b); }
        b.p.moveTo(pad + x + rad, pad + y); b.p.arc(pad + x, pad + y, rad, 0, Math.PI * 2);
      }
    }
    buckets.forEach(b => { o.fillStyle = b.c; o.fill(b.p); });
    const s = { cv: out, w: wp, h: hp, pad };
    cache.set(key, s);
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    return s;
  }

  function note(who) {
    return (g, x, y, u, o) => {
      const st = g.__stage;
      if (st) st.people.push({ who, x, y, u, o: o || {} });
    };
  }

  // the stage calls this after its dots: every doll noted this frame, in order
  function paint(st) {
    const ctx = st.ctx, sx = st.cv.width / st.w, sy = st.cv.height / st.h;
    st.people.forEach(p => {
      const o = p.o, u = p.u, t = o.t || 0;
      if (!o.img && !ready[p.who]) return;
      // o.img: draw this picture instead, o.h scene pixels tall (feet at the bottom of the picture)
      const hp = Math.max(12, Math.round((o.img ? o.h : TALL[p.who] * u) * sy / 2) * 2);
      const s = dotted(p.who, hp, o.img, o.key, o.fine);
      let lift = 0, tilt = 0, flipX = o.flip ? -1 : 1;
      const ph = o.phase || 0;
      if (o.pose === 'run') { lift = Math.abs(Math.sin(ph)) * 1.1 * u; tilt = 0.05 + Math.sin(ph) * 0.03; }
      else if (o.pose === 'jump') tilt = 0.12;
      else if (o.pose === 'up') lift = Math.abs(Math.sin(t * 6)) * 0.45 * u;
      else if (o.pose === 'serve') tilt = -0.08;
      else if (o.pose === 'twirl') flipX *= Math.cos(t * 5) || 0.01;
      ctx.save();
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.translate(p.x * sx, (p.y - lift) * sy);
      if (o.rot) { const pv = (o.pivot || 0) * u * sy; ctx.translate(0, pv); ctx.rotate(o.rot); ctx.translate(0, -pv); }
      if (tilt) ctx.rotate(tilt * (o.flip ? -1 : 1));
      ctx.scale(flipX, 1);
      ctx.drawImage(s.cv, -s.w / 2 - s.pad, -s.h - s.pad);
      ctx.restore();
    });
  }

  window.Bebs = { andrea: note('andrea'), lonis: note('lonis'), paint, ready: () => ready.andrea && ready.lonis };
})();
