/* Putting clothes on the two dolls (wardrobe.js): the base drawing (Andy's art, the paper keyed out),
   then each piece in its layer. Two touches keep it looking drawn rather than stuck on: Andrea's hair
   falls back over the shoulders of whatever top she wears (frontHair), and the arms hang in front of
   skirts and wide trousers (arms), both redrawn from the base drawing itself. A cropped top over
   low-rise bottoms shows her midriff (skin drawn over the bodysuit there).

   Closet.compose(who, outfit) → a canvas (Closet.PAD drawing pixels of room above their heads);
   outfit = { slot: itemId }. */

(() => {
  'use strict';
  const WR = window.WARDROBE;
  const base = {}, baseReady = {}, itemImg = {};
  const S = 2;                                    // composed at twice the drawing's size, for crisp dots
  const PAD = 18;                                 // room above their heads (his just-woke-up curls stand up)
  const hairOf = {};                              // his hair alone, lifted from the drawing (grown below)

  ['andrea', 'lonis'].forEach(who => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {        // the paper left between the arms and the body
        const mn = Math.min(p[i], p[i + 1], p[i + 2]), mx = Math.max(p[i], p[i + 1], p[i + 2]);
        if (mx - mn < 16 && mn > 222) p[i + 3] = Math.min(p[i + 3], Math.max(0, (246 - mn) * 11));
      }
      x.putImageData(d, 0, 0);
      if (who === 'lonis') hairOf.lonis = liftHair(c);
      base[who] = c; baseReady[who] = true;
    };
    im.src = who + '-base.png';
  });

  /* ---------- his hair, grown from his own curls ----------
     The drawn curls are the only hair that looks like his, so longer and messier hair is made of
     them: the brown above his ears, lifted out of the drawing, then copied down the sides of his
     face (long curls) or stretched up and out (just woke up). All in the drawing's own pixels. */
  function liftHair(c) {
    const W = c.width, Hh = 70;
    const d = c.getContext('2d').getImageData(0, 0, W, Hh), p = d.data;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, r = p[i], g = p[i + 1], b = p[i + 2];
      const L = 0.3 * r + 0.59 * g + 0.11 * b;
      const hair = p[i + 3] > 100 && L < 178 && r - b > 18 && (y < 58 || x < 140 || x > 212);   // not his brows
      if (!hair) p[i + 3] = 0;
    }
    const h = document.createElement('canvas'); h.width = W; h.height = Hh;
    h.getContext('2d').putImageData(d, 0, 0);
    const crop = (x0, y0, w, hh) => { const k = document.createElement('canvas'); k.width = w; k.height = hh; k.getContext('2d').drawImage(h, x0, y0, w, hh, 0, 0, w, hh); return k; };
    const sk = c.getContext('2d').getImageData(176, 76, 1, 1).data;                      // his skin, between the eyes
    return { all: h, left: crop(104, 26, 42, 44), right: crop(209, 26, 40, 44), skin: 'rgb(' + sk[0] + ',' + sk[1] + ',' + sk[2] + ')' };
  }
  function stamp(g, s, x, y, rot, flip) {
    g.save(); g.translate(x + s.width / 2, y + s.height / 2); g.rotate(rot || 0); g.scale(flip ? -1 : 1, 1);
    g.drawImage(s, -s.width / 2, -s.height / 2); g.restore();
  }
  // a curl from his left side at (x, y), and the same on his right, mirrored about his face (x 177.5)
  function bothSides(g, H, list) {
    list.forEach(([x, y, r, other]) => {
      const a = other ? H.right : H.left; stamp(g, a, x, y, r, !!other);
      const b = other ? H.left : H.right; stamp(g, b, 355 - x - b.width, y, -r, !!other);
    });
  }
  const bump = (v, list) => list.reduce((s, [c, w, h]) => s + h * Math.exp(-(((v - c) / w) ** 2)), 0);
  const GROW = {
    long: {
      // behind his neck, filling in under the jaw; then over his ears, framing his face, lowest first
      under: (g, H) => bothSides(g, H, [[134, 98, 0.05, 0], [122, 94, 0.08, 1], [118, 72, 0.04, 0]]),
      over: (g, H) => { bothSides(g, H, [[102, 84, 0.10, 1], [98, 62, 0.06, 0], [108, 66, 0.03, 1], [104, 42, 0.02, 0]]); g.drawImage(H.all, 0, 0); }
    },
    // bald: his curls lifted off the drawing (a hair's width beyond them too), then a smooth shiny head
    bald: {
      over(g, H) {
        g.save(); g.globalCompositeOperation = 'destination-out';
        for (const r of [1.5, 3]) for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; g.drawImage(H.all, Math.cos(an) * r, Math.sin(an) * r); }
        g.drawImage(H.all, 0, 0);
        g.restore();
        const sk = H.skin, line = 'rgb(140,94,78)';
        const dome = new Path2D('M139 70 C135 54 137 34 150 22 C160 14 170 11 177 11 C185 11 195 14 204 22 C217 34 219 54 214 70 C200 62 190 58 177 58 C164 58 152 62 139 70 Z');
        g.fillStyle = sk; g.fill(dome);
        g.save(); g.clip(dome);
        g.fillStyle = 'rgba(160,100,80,.10)'; g.beginPath(); g.ellipse(209, 48, 10, 28, 0, 0, Math.PI * 2); g.fill();   // the far side, a touch darker
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(160, 28, 9, 5, -0.5, 0, Math.PI * 2); g.fill();   // the shine
        g.restore();
        g.strokeStyle = line; g.lineWidth = 1.3; g.lineCap = 'round';
        g.stroke(new Path2D('M139 70 C135 54 137 34 150 22 C160 14 170 11 177 11 C185 11 195 14 204 22 C217 34 219 54 214 70'));
      }
    },
    bedhead: {
      over(g, H) {
        // each column of his curls stretched up where it's standing up, then the left side puffed out
        const W = H.all.width, t = document.createElement('canvas'); t.width = W; t.height = 70 + PAD;
        const tx = t.getContext('2d');
        for (let x = 100; x < 245; x++) { const b = bump(x, [[150, 14, 15], [186, 10, 11], [212, 9, 8]]); tx.drawImage(H.all, x, 0, 1, 56, x, PAD - b, 1.05, 56 + b); }
        for (let y = 0; y < 70 + PAD; y++) {
          const sh = bump(y, [[PAD + 30, 14, 10]]);
          g.drawImage(t, 100, y, 60, 1, 100 - sh, y - PAD, 60 + sh, 1.05);
          g.drawImage(t, 160, y, 85, 1, 160, y - PAD, 85, 1.05);
        }
      }
    }
  };
  function grow(x, who, it, part) {
    const G = GROW[it.proc], H = hairOf[who];
    if (!G || !G[part] || !H) return;
    x.save(); x.scale(S, S); G[part](x, H); x.restore();
  }

  const svgOf = (who, inner) => {
    const w = WR[who].w, h = WR[who].h;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * S + '" height="' + h * S + '">' + inner + '</svg>';
  };
  const underImg = {}, overImg = {};
  const svgImg = (who, inner) => { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(who, inner)); return im; };
  function img(who, it) {
    if (itemImg[it.id]) return itemImg[it.id];
    itemImg[it.id] = svgImg(who, it.svg);
    // some pieces have a part behind the doll (the veil), and dresses' sleeves go over her arms
    if (it.under) underImg[it.id] = svgImg(who, it.under);
    if (it.over) overImg[it.id] = svgImg(who, it.over);
    return itemImg[it.id];
  }
  const byId = {};
  ['andrea', 'lonis'].forEach(who => WR[who].items.forEach(it => { byId[it.id] = Object.assign({ who }, it); img(who, it); }));

  function runsPath(runs) {
    const p = new Path2D();
    runs.forEach(([y, x, n]) => p.rect(x * S, y * S, n * S, S + 0.5));
    return p;
  }
  const masks = {};
  ['andrea', 'lonis'].forEach(who => { masks[who] = { hair: runsPath(WR[who].frontHair), arms: runsPath(WR[who].arms), straps: runsPath(WR[who].straps || []) }; });

  const loaded = im => !im || (im.complete && im.naturalWidth);
  const ready = (who, outfit) => baseReady[who] && Object.values(outfit || {}).every(id => !id || !byId[id] || (loaded(itemImg[id]) && loaded(underImg[id]) && loaded(overImg[id])));

  function compose(who, outfit, out) {
    const w = WR[who].w * S, h = WR[who].h * S;
    out = out || document.createElement('canvas');
    out.width = w; out.height = h + PAD * S;
    const x = out.getContext('2d');
    x.clearRect(0, 0, out.width, out.height);
    x.translate(0, PAD * S);                      // the drawing's own coordinates from here on
    if (!baseReady[who]) return out;
    const items = Object.values(outfit || {}).map(id => byId[id]).filter(Boolean).sort((a, b) => a.layer - b.layer);
    items.forEach(it => { const u = underImg[it.id]; if (u && u.complete && u.naturalWidth) x.drawImage(u, 0, 0, w, h); if (it.proc) grow(x, who, it, 'under'); });
    x.drawImage(base[who], 0, 0, w, h);
    const has = c => items.some(it => it.cat === c);
    const top = items.find(it => it.cat === 'top'), bottom = items.find(it => it.cat === 'bottom');
    // her midriff: a cropped top (or no top) over low-rise bottoms shows skin, not the bodysuit
    if (who === 'andrea' && (top || bottom) && !has('dress')) drawSkin(x);
    // her bodysuit's straps go under skin when she's wearing a top or a dress of her own
    if (who === 'andrea' && (top || has('dress'))) { x.fillStyle = '#f8d9c3'; x.fill(masks[who].straps); }
    let armsDone = false, hairDone = false;
    // her arms redrawn over skirts and dresses, then any sleeves those dresses have
    const sleeves = () => items.forEach(it => { const o = overImg[it.id]; if (it.layer <= 5 && o && o.complete && o.naturalWidth) x.drawImage(o, 0, 0, w, h); });
    const arms = () => { if (armsDone) return; armsDone = true; x.save(); x.clip(masks[who].arms); x.drawImage(base[who], 0, 0, w, h); x.restore(); sleeves(); };
    const hair = () => { if (hairDone) return; hairDone = true; x.save(); x.clip(masks[who].hair); x.drawImage(base[who], 0, 0, w, h); x.restore(); };
    if (items.some(it => it.sleeves)) { armsDone = true; sleeves(); }   // a suit covers his arms itself
    items.forEach(it => {
      if (it.layer > 4 && (has('dress') || has('bottom'))) arms();
      if (it.layer > 7 && who === 'andrea' && (has('top') || has('dress') || has('outer'))) hair();
      const im = itemImg[it.id];
      if (it.proc) grow(x, who, it, 'over');
      else if (im.complete && im.naturalWidth) x.drawImage(im, 0, 0, w, h);
    });
    if (has('dress') || has('bottom')) arms();
    if (who === 'andrea' && (has('top') || has('dress'))) hair();
    return out;
  }

  // the bare midriff (wardrobe.py a_midriff, drawn as an item so it matches the art)
  function drawSkin(x) {
    const it = byId['a-skin'];
    if (it && itemImg['a-skin'].complete) x.drawImage(itemImg['a-skin'], 0, 0, x.canvas.width, x.canvas.height);
  }

  window.Closet = { compose, ready, items: who => WR[who].items, byId, svgOf, S, PAD };
})();
