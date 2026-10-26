/* The arcade itself: the lobby, and the full-screen frame every game plays in (stage, scores,
   cards, little notes). Games register with Arcade.add(). The site's landscape (art.js) runs live
   behind everything: dark mode at dusk, light mode at night, the disco ball on; a game can ask for
   its own moment of the day (def.scene, or def.sceneAt(api) as it goes). */

(() => {
  'use strict';
  const D = window.Dots, $ = s => document.querySelector(s);
  const root = document.documentElement;
  const games = [];
  const T = s => (window.tr ? window.tr(s) : s), TV = (s, v) => (window.tr ? window.tr(s, v) : s.replace(/\{(\w+)\}/g, (m, n) => v[n]));   // lang.js
  const Arcade = window.Arcade = { games, add: g => games.push(g), current: () => cur && cur.api };   // current: the game being played (for checking)
  const ART = window.ART_EMBED;

  /* ---------- light or dark, shared with the main site (la-theme) ---------- */
  const isLight = () => root.classList.contains('light');
  D.light = isLight();
  const baseScene = () => (isLight() ? 0.985 : 0.7);
  function setScene(p) {
    ART.scene = p;
    // light mode is the site's night page around the night; by day it prints on paper like the site
    ART.night = isLight() && (p > 0.9 || p < 0.06);
    D.day = isLight() && !ART.night;
    root.classList.toggle('day', D.day);
  }
  function setTheme(light) {
    root.classList.toggle('light', light);
    root.classList.toggle('dark', !light);
    try { localStorage.setItem('la-theme', light ? 'light' : 'dark'); } catch (e) {}
    D.light = light;
    setScene(cur ? sceneOf(cur) : baseScene());
    document.dispatchEvent(new CustomEvent('themechange', { detail: { light } }));   // art.js redraws
    fitHero(); drawThumbs();
    if (cur) { fitStage(); if (cur.def.themed) cur.def.themed(cur.api); }
  }
  const sceneOf = c => (c.def.sceneAt ? c.def.sceneAt(c.api) : c.def.scene != null ? c.def.scene : baseScene());

  /* ---------- best scores, remembered on this phone ---------- */
  const bestKey = id => 'bebs-arcade:' + id;
  function getBest(id) { try { const v = localStorage.getItem(bestKey(id)); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function putBest(id, v) { try { localStorage.setItem(bestKey(id), JSON.stringify(v)); } catch (e) {} }

  /* ---------- the lobby: a black-and-white dance floor on the shore, the two of us dancing ---------- */
  const heroCv = $('#hero-art');
  const hero = new D.Stage(heroCv);
  function fitHero() {
    hero.fit(window.innerWidth, window.innerHeight);
  }
  // a checkered floor in perspective, from the lake line to the bottom of the screen
  // (one camera: 50 cm tiles, the camera 1.2 m up, the two of us 3.6 m away)
  D.danceFloor = function (g, w, h, top, opts) {
    opts = opts || {};
    // opts.k: pixels per metre at the two of them, when they're drawn at a size of their own;
    // the camera's height then follows from where the horizon is
    const feet = opts.feet || h * 0.95, hz = opts.hz || h * 0.58;
    const k = opts.k || (feet - hz) / 1.2, cam = (feet - hz) / k, F = k * 3.6, vx = w / 2 + (opts.shift || 0);
    const sx = (X, Z) => vx + F * X / Z, sy = Z => hz + F * cam / Z;
    const zTop = F * cam / (top - hz);
    // opts.depth: how far the floor goes on behind the two of them (metres), opts.width: how wide it is;
    // without them it runs on to the horizon
    const zMax = opts.depth ? 3.6 + opts.depth : Infinity, half = opts.width ? opts.width / 2 : 20;
    const light = [242, 238, 250], dark = [16, 12, 26], far = [66, 58, 88];
    // far away the tiles get smaller than the dots: they melt into one dusky tone toward the horizon
    const tone = (c, z) => { const f = Math.min(1, Math.max(0, (z - 7) / 16)); return f ? c.map((v, i) => v + (far[i] - v) * f) : c; };
    let zEnd = 1.2;
    for (let zi = 0; zi < 60; zi++) {
      const z0 = 1.2 + zi * 0.5, z1 = z0 + 0.5;
      if (z0 > zTop || z0 >= zMax) break;
      zEnd = z1;
      const y0 = Math.max(top, sy(Math.min(z1, zTop))), y1 = Math.min(sy(z0), h + 2);
      if (y1 <= y0) continue;
      const cl = tone(light, z0), cd = tone(dark, z0);
      for (let xi = -Math.round(half * 2); xi < Math.round(half * 2); xi++) {
        const X0 = xi * 0.5, X1 = X0 + 0.5;
        const xa = sx(X0, z1), xb = sx(X1, z1), xc = sx(X1, z0), xd = sx(X0, z0);
        if (Math.max(xa, xb, xc, xd) < -2 || Math.min(xa, xb, xc, xd) > w + 2) continue;
        g.fillStyle = D.rgba((xi + zi) % 2 === 0 ? cl : cd, D.TILE_A);
        g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, y0); g.lineTo(xc, y1); g.lineTo(xd, y1); g.fill();
      }
    }
    // and beyond the last row, the rest of the floor out to the horizon (when it goes on for ever)
    if (zMax === Infinity && zEnd < zTop) { const yb = Math.ceil(sy(zEnd)); if (yb > top) { g.fillStyle = D.rgba(far, D.TILE_A); g.fillRect(0, top, w, yb - top); } }
    // a floor of its own: its far edge and its sides catch the light, with a little depth below them
    if (zMax !== Infinity) {
      const zb = Math.min(zMax, zEnd), lip = 0.14;
      const yb = sy(zb), xl = sx(-half, zb), xr = sx(half, zb);
      g.fillStyle = D.rgba([24, 16, 40], D.TILE_A);
      g.beginPath(); g.moveTo(xl, yb); g.lineTo(xr, yb); g.lineTo(xr, yb + F * lip / zb); g.lineTo(xl, yb + F * lip / zb); g.fill();
      for (const X of [-half, half]) {
        g.beginPath(); g.moveTo(sx(X, zb), yb); g.lineTo(sx(X, 1.2), sy(1.2)); g.lineTo(sx(X, 1.2), sy(1.2) + F * lip / 1.2); g.lineTo(sx(X, zb), yb + F * lip / zb); g.fill();
      }
      g.fillStyle = D.rgba([255, 214, 120], D.TILE_A);
      g.fillRect(Math.round(xl), Math.round(yb) - 1, Math.round(xr - xl), 1);
    }
    // coloured light from the disco ball on the floor
    if (opts.lights !== false) {
      const t = opts.t || 0, cols = [[255, 215, 240], [191, 243, 255], [217, 255, 156], [255, 241, 184], [216, 198, 255]];
      for (let i = 0; i < 22; i++) {
        const Z = 1.4 + D.hash(i * 3.1) * Math.min(9, zTop - 1.4, zMax - 1.6), X = Math.max(-half + .3, Math.min(half - .3, (D.hash(i * 7.7) - 0.5) * Z * 1.6 + Math.sin(t * 0.0006 + i) * 0.3));
        if (!(Z > 1.3)) continue;                                  // (a floor too thin to light)
        const y = sy(Z); if (y < top) continue;
        g.fillStyle = D.rgb(cols[i % cols.length]);
        g.beginPath(); g.ellipse(sx(X, Z), y, F * 0.09 / Z, F * 0.035 / Z, 0, 0, D.TAU); g.fill();
      }
    }
    return { feet, k };
  };

  function drawHero(t) {
    hero.clear();
    const g = hero.g, w = hero.w, h = hero.h, hz = Math.round(h * 0.58);
    // they stand a little way back on the floor (further from the camera, smaller), feet just inside the
    // bottom of the hero, so the games below never cover them
    const heroFrac = (heroCv.parentNode.offsetHeight || window.innerHeight) / window.innerHeight;
    const wide = around();
    const feet = wide ? hz + (h - hz) * 0.72 : Math.min(hz + (h - hz) * (w > h ? 0.72 : 0.6), h * (heroFrac - 0.03));
    // Lonis about a third of the screen tall (on a computer a little more): k, pixels per metre at them
    const k = Math.min(h * (wide ? 0.44 : 0.3), w * 0.62) / 1.8;
    const fl = D.danceFloor(g, w, h, hz + 1, { t, feet, k, depth: 2.6, width: 7 });
    // the two of us dancing, 1.8 m (Lonis) on the floor
    // to the left of the ball (the sun or the moon, up on the right), so it's never behind them
    const u = fl.k * 1.8 / 28, cx = wide ? w * 0.5 : w > h ? w * 0.38 : w * 0.4, beat = Math.floor(t / 1600) % 4;
    Bebs.andrea(hero.g, cx - 4.3 * u, fl.feet, u, { pose: beat === 2 ? 'twirl' : 'up', t: t / 1000 });
    Bebs.lonis(hero.g, cx + 4.6 * u, fl.feet, u, { pose: beat === 1 ? 'up' : 'stand', t: t / 1000 + 0.3 });
    // the mirror ball, 35 cm across, hanging a little above and behind them (art.js draws it, in the sky)
    ART.ballAt = { x: (cx + 0.35 * k) / w, y: (fl.feet - 2.75 * k) / h, r: 0.175 * k / h };
    hero.render();
  }

  // wide screens: the two of them in the middle of the dance floor, the games round them (arcade.css)
  const around = () => window.innerWidth >= 960 && window.innerWidth > window.innerHeight * 1.2;
  function menuArt() {
    ART.ballScale = 0.6;
    ART.moonX = around() ? 0.63 : window.innerWidth < 600 ? 0.83 : null;   // phones: clear of the title
  }

  /* ---------- the game cards ---------- */
  const list = $('#games');
  const thumbs = [];
  // on each card, a dare: beat whoever holds the record (or, while nobody does, be the first).
  // Games without a score (Dress Up) show nothing. Swedish names take an s, unless they end in one.
  const svPoss = n => (/[sxz]$/i.test(n) ? n : n + 's');
  function bestText(def) {
    if (!window.HiScores || !HiScores.has(def.id) || !HiScores.loaded()) return '';
    const top = HiScores.board(def.id)[0];
    if (!top) return T('★ Log your hi score');
    const score = T(def.fmt ? def.fmt(top[1]) : String(top[1]));
    if (String(top[0]).toLowerCase() === HiScores.lastName().toLowerCase()) return TV('★ The record’s yours · {score}', { score });
    return TV('★ Beat {name}’s {score}', { name: top[0], poss: svPoss(top[0]), score });
  }

  /* ---------- high scores: the top 10, and your name on it when you make it (hiscores.js) ---------- */
  let hsId = 0;
  function hiscoreBlock(def, score) {
    const box = document.createElement('div'); box.className = 'hs';
    const head = document.createElement('p'); head.className = 'hs-title'; head.textContent = T('High scores');
    const ol = document.createElement('ol'); ol.className = 'hs-list';
    box.append(head, ol);
    const fmt = v => T(def.fmt ? def.fmt(v) : String(v));
    const draw = mine => {
      ol.innerHTML = '';
      const b = HiScores.board(def.id);
      let marked = false;
      if (!b.length) { const li = document.createElement('li'); li.className = 'hs-empty'; li.textContent = T('No scores yet. Be the first!'); ol.appendChild(li); }
      b.forEach(([n, s]) => {
        const li = document.createElement('li');
        const nn = document.createElement('span'); nn.className = 'hs-n'; nn.textContent = n;
        const ss = document.createElement('span'); ss.className = 'hs-s'; ss.textContent = fmt(s);
        li.append(nn, ss);
        if (mine && !marked && n === mine[0] && s === mine[1]) { li.className = 'me'; marked = true; }
        ol.appendChild(li);
      });
    };
    draw();
    HiScores.load().then(() => {
      draw();
      if (score == null || !HiScores.qualifies(def.id, score)) return;
      const id = 'hs-name-' + (++hsId);
      const f = document.createElement('form'); f.className = 'hs-form';
      f.innerHTML = '<label class="hs-new" for="' + id + '"></label>' +
        '<div class="hs-row"><input id="' + id + '" type="text" maxlength="12" autocomplete="nickname" enterkeyhint="done" spellcheck="false"><button type="submit" class="btn"></button></div>' +
        '<p class="hs-msg" aria-live="polite"></p>';
      const inp = f.querySelector('input'), btn = f.querySelector('button'), msg = f.querySelector('.hs-msg');
      f.querySelector('label').textContent = T('New high score! Your name'); btn.textContent = T('Save');
      inp.value = HiScores.lastName();
      ['keydown', 'keyup'].forEach(t => inp.addEventListener(t, e => e.stopPropagation()));   // typing isn't playing
      f.addEventListener('submit', e => {
        e.preventDefault();
        const nm = HiScores.clean(inp.value);
        if (!nm) { msg.textContent = T(inp.value.trim() ? 'Try another name' : 'Type your name first'); return; }
        btn.disabled = true; msg.textContent = T('Saving…');
        HiScores.submit(def.id, nm, score).then(() => { f.remove(); draw([nm, score]); drawThumbs(); })
          .catch(() => { btn.disabled = false; msg.textContent = T('Couldn’t save it. Try again?'); });
      });
      box.insertBefore(f, head);
    });
    return box;
  }
  const ORDER = ['run', 'kick', 'dress', 'trivia', 'sun', 'chess', 'list', 'song'];
  function buildMenu() {
    list.innerHTML = '';
    games.slice().sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)).forEach(def => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'game-card';
      b.setAttribute('aria-label', T(def.name) + '. ' + T(def.blurb));
      const cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      const nm = document.createElement('span'); nm.className = 'name'; nm.textContent = T(def.name);
      const bl = document.createElement('span'); bl.className = 'blurb'; bl.textContent = T(def.blurb);
      const be = document.createElement('span'); be.className = 'best'; be.textContent = def.soon ? T('Coming soon') : bestText(def);
      b.append(cv, nm, bl, be);
      if (def.soon) {                                   // not playable yet: it just wiggles
        b.classList.add('soon'); b.setAttribute('aria-disabled', 'true');
        b.addEventListener('click', () => { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); });
      } else b.addEventListener('click', () => go(def.id));
      li.appendChild(b);
      list.appendChild(li);
      thumbs.push({ def, st: new D.Stage(cv), cv, be });
    });
    drawThumbs();
  }
  // behind each card's picture: the site's landscape at that game's time of day (in the game itself the
  // real one is behind, so the pictures need their own): sky, the mountains with their golden edge, the lake
  function thumbBackdrop(g, w, h, def) {
    const p = typeof def.thumbScene === 'function' ? def.thumbScene() : def.thumbScene != null ? def.thumbScene : def.scene != null ? def.scene : 0.7;
    const hz = Math.round(h * 0.58), s = D.paintSky(g, w, 0, hz, p);
    if (p > 0.86 || p < 0.1) D.stars(g, w, hz * 0.8, 1200, 0.9, 5);
    const far = D.mix(D.light ? [118, 84, 168] : [66, 40, 118], s.bot, 0.12), near = D.mix(D.light ? [52, 120, 128] : [22, 80, 96], s.bot, 0.08);
    const ridgeLine = (amp, k, off, col) => { g.fillStyle = D.rgb(col); for (let x = 0; x < w; x++) g.fillRect(x, Math.round(hz - amp * D.ridgeH(x + off, k)), 1, 1); };
    D.ridge(g, w, hz, h * 0.26, 1.3, 7, far, 1);
    ridgeLine(h * 0.26, 1.3, 7, [255, 196, 80]);
    D.ridge(g, w, hz, h * 0.12, 2.7, 31, near, 1);
    ridgeLine(h * 0.12, 2.7, 31, [140, 230, 120]);
    D.water(g, w, hz, h, D.mix(s.bot, [44, 30, 90], 0.35), D.mix(s.top, [12, 6, 32], 0.45), 1200, [255, 236, 214]);
  }
  function drawThumbs() {
    thumbs.forEach(th => {
      const w = th.cv.clientWidth || 160;
      th.st.fit(w, Math.round(w * 0.75), Math.max(2.4, w / 62));   // fine dots, so the little scene reads
      th.st.clear();
      if (th.def.thumbBackdrop !== false) thumbBackdrop(th.st.g, th.st.w, th.st.h, th.def);
      th.def.thumb(th.st.g, th.st.w, th.st.h, 1200);
      th.st.render();
      th.be.textContent = th.def.soon ? T('Coming soon') : bestText(th.def);
    });
  }

  /* ---------- playing a game ---------- */
  const play = $('#play'), stageEl = $('#stage'), cv = $('#stage-cv'), hudEl = $('#hud'), stripEl = $('#strip'), panelEl = $('#panel');
  const st = new D.Stage(cv);
  let cur = null, last = 0, raf = 0;

  function makeApi(def) {
    const api = {
      st, def, el: stageEl, panel: panelEl, strip: stripEl,
      running: false, paused: false, time: 0,
      get hz() { return Math.round(st.h * 0.58); },          // the lake line of the landscape behind
      hud(html) { hudEl.innerHTML = html; },
      // ms: how long it stays (1.6 s unless said otherwise)
      toast(text, x, y, cls, ms) {
        const n = document.createElement('div');
        n.className = 'toast' + (cls ? ' ' + cls : '');
        n.textContent = T(text);
        n.style.left = D.clamp(x / st.w, 0.12, 0.88) * 100 + '%';
        n.style.top = D.clamp(y / st.h, 0.12, 0.92) * 100 + '%';
        if (ms) n.style.animationDuration = ms / 1000 + 's';
        stageEl.appendChild(n);
        setTimeout(() => n.remove(), (ms || 1600) + 100);
      },
      buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} },
      best: () => getBest(def.id),
      // show a card over the stage; buttons: [{ label, quiet, on }]
      card(o) {
        api.uncard();
        const ov = document.createElement('div');
        ov.className = 'over';
        const c = document.createElement('div');
        c.className = 'over-card';
        c.setAttribute('role', 'dialog');
        c.innerHTML = (o.kicker ? '<p class="kicker"></p>' : '') + '<h2></h2>' + (o.text ? '<p class="txt"></p>' : '') + (o.score ? '<p class="score"></p>' : '') + '<div class="btns"></div>';
        if (o.kicker) c.querySelector('.kicker').textContent = T(o.kicker);
        c.querySelector('h2').textContent = T(o.title);
        if (o.text) c.querySelector('.txt').textContent = T(o.text);
        if (o.score) c.querySelector('.score').textContent = o.score;
        const bw = c.querySelector('.btns');
        if (o.extra) c.insertBefore(o.extra, bw);
        (o.buttons || []).forEach((bt, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'btn' + (bt.quiet ? ' quiet' : '');
          b.textContent = T(bt.label);
          b.addEventListener('click', e => { e.stopPropagation(); bt.on(); });
          bw.appendChild(b);
          if (i === 0) setTimeout(() => b.focus({ preventScroll: true }), 60);
        });
        ov.appendChild(c);
        ov.addEventListener('pointerdown', e => e.stopPropagation());
        stageEl.appendChild(ov);
        api.cardEl = ov;
      },
      uncard() { if (api.cardEl) { api.cardEl.remove(); api.cardEl = null; } },
      begin() { api.uncard(); api.ended = false; api.running = true; api.paused = false; def.start(api); },
      intro() {
        api.running = false;
        api.card({ kicker: def.kicker || def.name, title: def.title || def.name, text: def.how, extra: HiScores.has(def.id) ? hiscoreBlock(def, null) : null, buttons: [{ label: 'Play', on: () => api.begin() }] });
      },
      // a round is over: score is a number; better: 'high' or 'low'
      end(o) {
        if (api.ended) return;
        api.ended = true;          // the game keeps playing its little ending until the card appears
        let line = T(o.scoreText || '');
        if (o.score != null) {
          const prev = getBest(def.id);
          const better = def.better === 'low' ? prev == null || o.score < prev : prev == null || o.score > prev;
          if (better && o.counts !== false) { putBest(def.id, o.score); line += (line ? ' · ' : '') + T(prev == null ? 'first score' : 'new best'); }
          else if (prev != null) line += (line ? ' · ' : '') + TV('best {v}', { v: T(def.fmt ? def.fmt(prev) : prev) });
        }
        setTimeout(() => {
          if (!cur || cur.api !== api) return;
          api.running = false;
          // the high scores, with a place for your name if you made the top 10
          const score = o.score != null && o.counts !== false ? Math.round(o.score * 10) / 10 : null;
          const extra = HiScores.has(def.id) && o.score != null ? hiscoreBlock(def, score) : null;
          api.card({ kicker: o.kicker, title: o.title, text: o.text, score: line, extra, buttons: [{ label: o.again || 'Play again', on: () => api.begin() }, { label: 'Arcade', quiet: true, on: () => history.back() }] });
        }, o.delay == null ? 900 : o.delay);
      }
    };
    return api;
  }

  // the stage covers the whole screen, so the game lines up with the landscape behind it
  function fitStage() {
    if (!cur) return;
    st.fit(window.innerWidth, window.innerHeight, cur.def.cell);
    if (cur.def.resize) cur.def.resize(cur.api);
  }

  function open(id) {
    const def = games.find(g => g.id === id);
    if (!def) return;
    if (cur) close(true);
    play.hidden = false;
    root.classList.add('playing');
    $('#play-title').textContent = T(def.name);
    hudEl.innerHTML = ''; stripEl.innerHTML = ''; panelEl.innerHTML = '';
    play.classList.toggle('has-panel', !!def.panel);
    play.classList.toggle('panel-side', !!def.panelSide);
    stageEl.querySelectorAll('.over, .toast').forEach(n => n.remove());
    const api = makeApi(def);
    cur = { def, api };
    fitStage();
    def.setup(api);
    setScene(sceneOf(cur));
    ART.taps = false;
    ART.disco = def.disco !== false;
    ART.noSun = !!def.noSun;
    ART.ballScale = def.ballScale || 1; ART.ballAt = null;
    if (def.panel) { api.running = true; if (def.start) def.start(api); } else api.intro();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    $('#play-back').focus({ preventScroll: true });
    if (window.track) window.track('Opened: Arcade ' + def.name);
  }

  function close(quiet) {
    if (!cur) return;
    if (cur.def.close) cur.def.close(cur.api);
    cur = null;
    play.hidden = true;
    root.classList.remove('playing');
    setScene(baseScene());
    ART.taps = true; ART.disco = true; ART.noSun = false; menuArt();
    if (!quiet) drawThumbs();
  }

  function loop(now) {
    if (!cur) { raf = requestAnimationFrame(menuLoop); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const api = cur.api;
    if (api.running && !api.paused && cur.def.update) { api.time += dt; cur.def.update(dt, api); }
    if (!cur) { raf = requestAnimationFrame(menuLoop); return; }
    setScene(sceneOf(cur));
    ART.moonX = cur.def.moonX ? cur.def.moonX(api) : null;   // a game can hang the mirror ball elsewhere
    st.clear();
    const r = cur.def.draw(api, now);
    if (r !== false) st.render(cur.def.renderOpts);
    raf = requestAnimationFrame(loop);
  }

  let heroLast = 0, heroVisible = true;
  function menuLoop(now) {
    if (cur) { raf = requestAnimationFrame(loop); return; }
    if (heroVisible && now - heroLast > 33 && !document.hidden) { heroLast = now; drawHero(D.reduced ? 1200 : now); }
    raf = requestAnimationFrame(menuLoop);
  }

  /* pointer and keys go to the open game, in scene coordinates */
  function ptr(type) {
    return e => {
      if (!cur || !cur.def[type]) return;
      if (e.target !== cv) return;
      if (type === 'down') { try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
      const p = st.toScene(e.clientX, e.clientY);
      cur.def[type](p, cur.api, e);
      if (type !== 'move') e.preventDefault();
    };
  }
  cv.addEventListener('pointerdown', ptr('down'));
  cv.addEventListener('pointermove', ptr('move'));
  cv.addEventListener('pointerup', ptr('up'));
  cv.addEventListener('pointercancel', ptr('up'));
  window.addEventListener('keydown', e => {
    if (!cur) return;
    if (e.key === 'Escape') { history.back(); return; }
    if (cur.def.key && !(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) cur.def.key(e, cur.api);
  });
  window.addEventListener('keyup', e => { if (cur && cur.def.key) cur.def.key(e, cur.api); });

  /* step away from the phone and the game waits */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !cur || !cur.api.running || cur.api.ended || cur.def.panel) return;
    const api = cur.api;
    api.paused = true;
    api.card({ title: 'Paused', buttons: [{ label: 'Keep playing', on: () => { api.uncard(); api.paused = false; last = performance.now(); } }, { label: 'Arcade', quiet: true, on: () => history.back() }] });
  });

  /* ---------- the hi scores: every game's top 10 in one table, in a pop-up like the screen of an
     old arcade cabinet. A game nobody has scored on yet gets a row waiting for its first name.
     Phones show the games by a short name, so the four columns fit. ---------- */
  const pop = $('#hs-pop');
  const SHORT = { run: 'Island', kick: 'Football', trivia: 'Trivia', sun: 'Sun Up', chess: 'Chess', list: 'The List' };
  const popGames = () => ORDER.map(id => games.find(g => g.id === id)).filter(g => g && !g.soon && HiScores.has(g.id));
  function popDraw() {
    const body = pop.querySelector('.hs-rows'), me = HiScores.lastName().toLowerCase();
    const cell = (cls, text) => { const td = document.createElement('td'); td.className = cls; td.textContent = text; return td; };
    const row = (cls, cells) => { const tr = document.createElement('tr'); tr.className = cls; cells.forEach(c => tr.appendChild(c)); body.appendChild(tr); };
    body.innerHTML = '';
    let any = false;
    popGames().forEach(def => {
      const game = () => {
        const td = cell('g', '');
        const full = document.createElement('span'); full.className = 'full'; full.textContent = T(def.name);
        const short = document.createElement('span'); short.className = 'short'; short.textContent = T(SHORT[def.id] || def.name);
        td.append(full, short);
        return td;
      };
      const b = HiScores.board(def.id);
      if (!b.length) { row('empty first', [cell('r', '1.'), cell('n', T('You?')), game(), cell('s', '- - -')]); return; }
      any = true;
      b.forEach(([n, v], i) => {
        const cls = (i === 0 ? 'top first' : i === 1 ? 'p2' : i === 2 ? 'p3' : '') + (me && String(n).toLowerCase() === me ? ' me' : '');
        row(cls, [cell('r', (i + 1) + '.'), cell('n', n), game(), cell('s', T(def.fmt ? def.fmt(v) : String(v)))]);
      });
    });
    pop.querySelector('.hs-none').hidden = any;
  }
  function popOpen() {
    popDraw();
    pop.showModal();
    HiScores.load().then(() => { if (pop.open) popDraw(); if (!cur) drawThumbs(); });
    if (window.track) window.track('Opened: Arcade hi scores');
  }
  $('#hs-open').addEventListener('click', popOpen);
  pop.querySelector('.hs-x').addEventListener('click', () => pop.close());
  // press start: back to the games to pick one (on a phone, down to the cards)
  pop.querySelector('.hs-start').addEventListener('click', () => {
    pop.close();
    if (!around()) list.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  pop.addEventListener('click', e => { if (e.target === pop) pop.close(); });       // a tap outside the screen

  /* ---------- the address: thebebs.com/arcade/#list opens a game ---------- */
  function go(id) { history.pushState({ game: id }, '', '#' + id); open(id); }
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (games.some(g => g.id === id)) open(id); else close();
  });
  $('#play-back').addEventListener('click', () => { if (history.state && history.state.game) history.back(); else { history.replaceState(null, '', location.pathname + location.search); close(); } });
  $('#theme-btn').addEventListener('click', () => setTheme(!isLight()));

  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!cur) menuArt(); fitHero(); fitStage(); drawThumbs(); }, 120); });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(heroCv);

  Arcade.boot = function () {
    setScene(baseScene());
    ART.disco = true; ART.taps = true; menuArt();
    buildMenu();
    fitHero();
    drawHero(1200);
    const id = location.hash.slice(1);
    if (games.some(g => g.id === id)) {
      // a shared link straight to a game: put the arcade underneath, so "back" lands there
      history.replaceState(null, '', location.pathname + location.search);
      history.pushState({ game: id }, '', '#' + id);
      open(id);
    }
    raf = requestAnimationFrame(cur ? loop : menuLoop);
    HiScores.load().then(() => { if (!cur) drawThumbs(); });                   // everyone's high scores on the cards
    // the dolls arrive a moment after the page: redraw the cards once they're here
    const wait = setInterval(() => { if (Bebs.ready()) { clearInterval(wait); drawThumbs(); } }, 120);
  };
})();
