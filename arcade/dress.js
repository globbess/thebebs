/* Dress Up the Bebs. Andy's paper dolls of the two of us (closet.js, wardrobe.js), standing on the
   dance floor, and a wardrobe underneath (beside them on wide screens) like the old dress-up games:
   pick whose wardrobe, pick a drawer, then drag a piece onto them (or just tap it). Tap a piece
   they're wearing to take it off. One-tap looks for the wedding, a shuffle, and start over.
   What they're wearing is remembered on this phone. */

(() => {
  'use strict';
  const D = window.Dots;
  const WHO = ['andrea', 'lonis'];
  const NAME = { andrea: 'Andrea', lonis: 'Lonis' };
  // the drawers, in order, and what goes in each (by wardrobe slot)
  const DRAWERS = {
    andrea: [['Tops', ['top']], ['Bottoms', ['bottom']], ['Dresses', ['dress']], ['Jackets', ['outer']], ['Shoes', ['shoes']], ['Gold', ['ears', 'neck', 'wrist', 'belt']], ['Bags & hair', ['bag', 'hair', 'head', 'eyes']], ['Makeup', ['face']]],
    lonis: [['Tops', ['top']], ['Jackets', ['outer']], ['Bottoms', ['bottom']], ['Shoes', ['shoes']], ['Suit', ['dress']], ['Hair', ['hair']], ['Beard', ['beard']], ['Extras', ['eyes', 'wrist']]]
  };
  const START = {
    andrea: { dress: 'a-rust', shoes: 'a-boots', ears: 'a-hoops', belt: 'a-chainbelt' },   // Andy's own pick
    lonis: { top: 'l-tee', bottom: 'l-trousers', shoes: 'l-sneakers' }
  };
  const WEDDING = {
    andrea: { dress: 'a-wedding', head: 'a-veil', shoes: 'a-heels', face: 'a-glam', ears: 'a-hoops' },
    lonis: { dress: 'l-suit', shoes: 'l-oxfords' }
  };
  const SVG = d => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICON = {
    rings: SVG('<circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="M13 4l2 2.5L17 4"/>'),
    shuffle: SVG('<path d="M3 7h3c4 0 6 10 10 10h5"/><path d="M3 17h3c1.6 0 2.8-1.6 4-3.6M14 9.6C15.2 8 16.4 7 18 7h3"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
    reset: SVG('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>')
  };
  const KEY = 'bebs-arcade:dress-look', OLD = 'bebs-arcade:dress';   // (the old name was the arcade's best-score name for this game)
  let S = null;

  const load = () => {
    try {
      let v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v) { v = JSON.parse(localStorage.getItem(OLD) || 'null'); localStorage.removeItem(OLD); if (v) localStorage.setItem(KEY, JSON.stringify(v)); }
      if (v && v.andrea && v.lonis) return v;
    } catch (e) {}
    return null;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S.fit)); } catch (e) {} };

  // a dress takes the place of a top and bottoms, and the other way round. They're never down to
  // what's under it all (her bodysuit, his vest): a missing half is filled in with the basics, and
  // taking clothes off puts the basics back on
  const BASICS = { andrea: { top: 'a-turtle', bottom: 'a-baggy' }, lonis: { top: 'l-tee', bottom: 'l-trousers' } };
  function wear(who, id) {
    const it = Closet.byId[id];
    if (!it) return;
    const f = S.fit[who], B = BASICS[who], basics = () => { delete f.dress; f.top = f.top || B.top; f.bottom = f.bottom || B.bottom; };
    if (f[it.cat] === id) {
      if (it.cat === 'dress') { delete f.top; delete f.bottom; basics(); return 'off'; }
      if (it.cat === 'top' || it.cat === 'bottom') {
        if (id === B[it.cat]) return 'stay';
        f[it.cat] = B[it.cat]; return 'off';
      }
      delete f[it.cat]; return 'off';
    }
    f[it.cat] = id;
    if (it.cat === 'dress') { delete f.top; delete f.bottom; if (who === 'lonis') delete f.outer; }
    if (it.cat === 'top' || it.cat === 'bottom') basics();
    if (who === 'lonis' && it.cat === 'outer' && f.dress) { delete f.top; delete f.bottom; basics(); }
    return 'on';
  }

  /* ---------- the dolls, dressed ---------- */
  const look = { andrea: null, lonis: null };
  function redraw(who) {
    const f = S.fit[who];
    const go = () => {
      if (!Closet.ready(who, f)) return setTimeout(go, 60);
      look[who] = { cv: Closet.compose(who, f), key: who + ':' + JSON.stringify(f) };
    };
    go();
  }

  /* ---------- the wardrobe panel ---------- */
  const thumbs = {};
  // in the dolls' own pixels: their feet, her left wrist, his watch hand, her legs
  const CROP = {
    andrea: { shoes: [40, 600, 166, 733], wrist: [0, 320, 90, 430], bottom: [8, 290, 198, 733] },
    lonis: { shoes: [90, 600, 262, 733], wrist: [40, 320, 130, 420] }
  };
  function thumb(id) {
    if (thumbs[id]) return thumbs[id];
    // on them over the basics (never the bodysuit), cropped to where it's worn
    const it = Closet.byId[id], f = {}, B = BASICS[it.who];
    if (it.cat !== 'dress') { if (it.cat !== 'top') f.top = B.top; if (it.cat !== 'bottom' && it.cat !== 'shoes') f.bottom = B.bottom; }   // shoes: bare legs, so you see them
    f[it.cat] = id;
    const out = document.createElement('canvas');
    const draw = () => {
      if (!Closet.ready(it.who, f)) return setTimeout(draw, 60);
      const full = Closet.compose(it.who, f), Sc = Closet.S;
      let [x0, y0, x1, y1] = (CROP[it.who] || {})[it.cat] || it.box;
      if (['face', 'beard', 'eyes', 'hair', 'ears', 'head'].indexOf(it.cat) >= 0) {   // the head, so you can see it on them
        const lh = it.who === 'lonis' && it.cat === 'hair';             // his longer, wilder hair needs more room
        const cx = it.who === 'andrea' ? 103 : 176, cy = it.who === 'andrea' ? 120 : lh ? 68 : 80, r = it.id === 'a-veil' ? 120 : lh ? 80 : 62;
        x0 = cx - r; x1 = cx + r; y0 = cy - r; y1 = cy + r;
      }
      y0 += Closet.PAD; y1 += Closet.PAD;                        // the picture has room above their heads
      const w = (x1 - x0) * Sc, h = (y1 - y0) * Sc, size = 132;
      const k = Math.min(size / w, size / h);
      out.width = out.height = size;
      const g = out.getContext('2d');
      g.drawImage(full, x0 * Sc, y0 * Sc, w, h, (size - w * k) / 2, (size - h * k) / 2, w * k, h * k);
    };
    draw();
    thumbs[id] = out;
    return out;
  }

  function panel(api) {
    const who = S.who, drawers = DRAWERS[who], d = drawers[S.drawer[who]] || drawers[0];
    const items = Closet.items(who).filter(it => !it.hidden && d[1].indexOf(it.cat) >= 0);
    api.panel.innerHTML =
      '<div class="dz-top"><div class="dz-who" role="group" aria-label="Whose wardrobe">' + WHO.map(w => '<button type="button" class="chip" data-who="' + w + '" aria-pressed="' + (w === who) + '">' + NAME[w] + '</button>').join('') + '</div>' +
      '<div class="dz-acts">' +
        '<button type="button" class="chip round" data-act="wedding" aria-label="Wedding day" title="Wedding day">' + ICON.rings + '</button>' +
        '<button type="button" class="chip round" data-act="shuffle" aria-label="Shuffle" title="Shuffle">' + ICON.shuffle + '</button>' +
        '<button type="button" class="chip round" data-act="reset" aria-label="Start over" title="Start over">' + ICON.reset + '</button>' +
      '</div></div>' +
      '<div class="dz-drawers" role="tablist">' + drawers.map((dr, i) => '<button type="button" class="chip" role="tab" data-drawer="' + i + '" aria-selected="' + (dr === d) + '">' + dr[0] + '</button>').join('') + '</div>' +
      '<div class="dz-items" role="list" aria-label="Drag a piece onto ' + NAME[who] + ', or tap it"></div>';
    const list = api.panel.querySelector('.dz-items');
    items.forEach(it => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dz-item'; b.dataset.id = it.id; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-pressed', String(S.fit[who][it.cat] === it.id));
      b.appendChild(thumb(it.id));
      const n = document.createElement('span'); n.textContent = it.name; b.appendChild(n);
      list.appendChild(b);
    });
  }
  function mark(api) {
    api.panel.querySelectorAll('.dz-item').forEach(b => { const it = Closet.byId[b.dataset.id]; b.setAttribute('aria-pressed', String(S.fit[it.who][it.cat] === it.id)); });
  }

  function put(api, id, x, y) {
    const it = Closet.byId[id], r = wear(it.who, id);
    redraw(it.who); save(); mark(api);
    const st = api.st, P = place(st)[it.who];
    const msg = r === 'stay' ? (it.who === 'andrea' ? 'she’s keeping that on 😉' : 'he’s keeping that on 😉') : (r === 'on' ? '✓ ' : '') + it.name + (r === 'off' ? ' off' : '');
    api.toast(msg, x != null ? x : P.x, y != null ? y : P.top + (P.h * 0.4), r === 'on' ? '' : 'warm');
    if (r === 'on') { S.sparkle = { who: it.who, t: performance.now() }; api.buzz(10); }
  }

  /* ---------- dragging a piece out of the wardrobe ---------- */
  let drag = null;
  function startDrag(api, b, e) {
    drag = { b, id: b.dataset.id, x0: e.clientX, y0: e.clientY, on: false, ghost: null };
  }
  function moveDrag(api, e) {
    if (!drag) return;
    if (!drag.on && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
      drag.on = true;
      const g = document.createElement('div'); g.className = 'dz-ghost';
      const c = thumb(drag.id), cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0);
      g.appendChild(cv); document.body.appendChild(g); drag.ghost = g;
    }
    if (drag.on) { drag.ghost.style.transform = 'translate(' + (e.clientX - 44) + 'px,' + (e.clientY - 60) + 'px) rotate(-6deg)'; e.preventDefault(); }
  }
  function endDrag(api, e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (!d.on) { put(api, d.id); return; }                    // a tap
    // dropped on the stage (not back on the panel): on they go
    const overPanel = api.panel.contains(document.elementFromPoint(e.clientX, e.clientY));
    if (!overPanel) { const p = api.st.toScene(e.clientX, e.clientY); put(api, d.id, p.x, p.y); }
  }

  /* ---------- where they stand ---------- */
  // both on the dance floor, the same scale (they're drawn from one picture), feet on one line,
  // above the wardrobe (or to the left of it on wide screens)
  function place(st) {
    const wide = window.innerWidth >= 860;
    const cell = st.cell, m = window.ART_EMBED && window.ART_EMBED.moon;
    // the wardrobe: underneath on phones, on the right on wide screens; they stand in the rest
    const pan = document.querySelector('.play .panel'), R = pan && pan.offsetHeight ? pan.getBoundingClientRect() : null;
    // their heads stay under the mirror ball (on phones they're right below it)
    const topY = Math.max(70, !wide && m ? m.y + m.r + 4 : 0) / cell;
    const bottomY = wide ? st.h - 30 / cell : Math.min(st.h * 0.7, ((R ? R.top : window.innerHeight * 0.64) - 6) / cell);
    const usableW = wide ? (R ? R.left : window.innerWidth * 0.6) / cell : st.w;
    const h = Math.min(bottomY - topY, usableW / 0.9);            // Lonis (733 tall) and Andrea side by side
    const k = h / 733;
    const cx = usableW / 2;
    return {
      floorY: bottomY, k, usableW,
      // h, top: the drawing; ch: the whole picture, with the room above their heads
      andrea: { x: cx - 92 * k, h: 733 * k, top: bottomY - 733 * k, ch: (733 + Closet.PAD) * k },
      lonis: { x: cx + 100 * k, h: 733 * k, top: bottomY - 733 * k, ch: (733 + Closet.PAD) * k }
    };
  }

  const game = {
    id: 'dress', name: 'Dress Up the Bebs', thumbScene: () => (D.light ? 0.985 : 0.93), kicker: 'Game 3', panel: true, panelSide: true,
    blurb: 'A whole closet, from the wedding dress to his black Crocs.',
    get cell() { return 2.4; },                                  // fine dots: details like makeup show
    // the night, with the mirror ball up where the moon is; in dark mode the last of the dusk
    sceneAt: () => (D.light ? 0.985 : 0.93),
    // on wide screens the wardrobe is where the moon would be: the ball hangs over the dance floor instead
    moonX(api) {
      if (window.innerWidth < 860) return null;
      const st = api.st, P = place(st), r = st.h * 0.052;               // just clear of Lonis's curls
      return Math.min((P.usableW - r * 1.3) / st.w, (P.lonis.x + 150 * P.k + r * 1.3) / st.w);
    },
    renderOpts: { size: 1.05 },

    thumb(g, w, h, t) {
      D.danceFloor(g, w, h, h * 0.58 + 1, { t, feet: h * 0.95 });
      const u = (h * 0.85) / 28;
      Bebs.andrea(g, w * 0.36, h * 0.95, u * 0.94, { pose: 'stand' });
      Bebs.lonis(g, w * 0.62, h * 0.95, u, { pose: 'stand' });
      // a few pieces hanging in the air, waiting to be worn
      g.fillStyle = D.rgb([181, 85, 47]); g.fillRect(w * 0.08, h * 0.16, 4, 6);
      g.fillStyle = D.rgb([246, 180, 200]); g.fillRect(w * 0.84, h * 0.2, 5, 3);
    },

    setup(api) {
      S = { fit: load() || JSON.parse(JSON.stringify(START)), who: 'andrea', drawer: { andrea: 0, lonis: 0 }, sparkle: null };
      WHO.forEach(redraw);
      panel(api);
      api.hud('');
      setTimeout(() => { if (S) { const P = place(api.st); api.toast('drag a piece onto them ✨', P.usableW / 2, P.andrea.top + P.andrea.h * 0.35); } }, 500);
      api.panel.onclick = e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.classList.contains('dz-item')) { if (e.detail === 0) put(api, b.dataset.id); return; }   // the keyboard (pointers are handled below)
        if (b.dataset.who) { S.who = b.dataset.who; panel(api); }
        else if (b.dataset.drawer) { S.drawer[S.who] = +b.dataset.drawer; panel(api); }
        else if (b.dataset.act === 'wedding') { S.fit = JSON.parse(JSON.stringify(WEDDING)); WHO.forEach(redraw); save(); mark(api); api.toast('the wedding day ❤', api.st.w * 0.3, api.st.h * 0.2, 'big'); S.sparkle = { who: 'both', t: performance.now() }; }
        else if (b.dataset.act === 'reset') { S.fit = JSON.parse(JSON.stringify(START)); WHO.forEach(redraw); save(); mark(api); }
        else if (b.dataset.act === 'shuffle') { shuffle(); WHO.forEach(redraw); save(); mark(api); S.sparkle = { who: 'both', t: performance.now() }; }
      };
      // drag from the wardrobe (pointer events, so it works with a finger and a mouse)
      S.down = e => { const b = e.target.closest('.dz-item'); if (b) { startDrag(api, b, e); } };
      S.move = e => moveDrag(api, e);
      S.up = e => endDrag(api, e);
      S.cancel = () => { if (drag) { if (drag.ghost) drag.ghost.remove(); drag = null; } };   // e.g. the strip scrolled instead
      api.panel.addEventListener('pointerdown', S.down);
      window.addEventListener('pointermove', S.move, { passive: false });
      window.addEventListener('pointerup', S.up);
      window.addEventListener('pointercancel', S.cancel);
      // a tap on one of them: their wardrobe
      S.tapStage = true;
    },

    draw(api, now) {
      const st = api.st, g = st.g, P = place(st);
      // the floor seen by the same camera as the two of them: Lonis's 1.8 m is his height in the picture
      D.danceFloor(g, st.w, st.h, Math.round(st.h * 0.58) + 1, { t: now, feet: P.floorY, k: P.k * 731 / 1.8, shift: P.usableW / 2 - st.w / 2 });
      WHO.forEach(who => {
        const L = look[who];
        if (!L) return;
        const p = P[who];
        Bebs[who](g, p.x, P.floorY, 1, { img: L.cv, key: L.key, h: p.ch, fine: true });
      });
      // a little sparkle when something goes on
      if (S.sparkle) {
        const a = (now - S.sparkle.t) / 900;
        if (a > 1) S.sparkle = null;
        else WHO.forEach(who => {
          if (S.sparkle.who !== who && S.sparkle.who !== 'both') return;
          const p = P[who];
          for (let i = 0; i < 9; i++) {
            const an = i / 9 * D.TAU + a * 2, r = p.h * (0.18 + a * 0.22);
            g.fillStyle = D.rgba(i % 2 ? [255, 214, 120] : [255, 255, 255], 1 - a);
            g.fillRect(Math.round(p.x + Math.cos(an) * r * 0.6), Math.round(p.top + p.h * 0.45 + Math.sin(an) * r), 2, 2);
          }
        });
      }
    },

    // tap one of them to open their wardrobe
    down(p, api) {
      const P = place(api.st);
      const who = Math.abs(p.x - P.andrea.x) < Math.abs(p.x - P.lonis.x) ? 'andrea' : 'lonis';
      if (who !== S.who) { S.who = who; panel(api); }
    },

    close(api) {
      api.panel.onclick = null;
      api.panel.removeEventListener('pointerdown', S.down);
      window.removeEventListener('pointermove', S.move);
      window.removeEventListener('pointerup', S.up);
      window.removeEventListener('pointercancel', S.cancel);
    }
  };

  function shuffle() {
    const pick = arr => arr[(Math.random() * arr.length) | 0];
    WHO.forEach(who => {
      const all = Closet.items(who), by = c => all.filter(it => it.cat === c && !it.hidden && it.id !== 'a-wedding' && it.id !== 'a-veil' && it.id !== 'l-suit').map(it => it.id);
      const f = {};
      if (who === 'andrea' && Math.random() < 0.4) f.dress = pick(by('dress'));
      else { f.top = pick(by('top')); f.bottom = pick(by('bottom')); }
      f.shoes = pick(by('shoes'));
      ['ears', 'neck', 'wrist', 'eyes', 'face', 'hair', 'beard', 'outer', 'head'].forEach(c => { const o = by(c); if (o.length && Math.random() < 0.4) f[c] = pick(o); });
      S.fit[who] = f;
    });
  }

  Arcade.add(game);
})();
