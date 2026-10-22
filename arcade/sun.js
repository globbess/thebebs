/* Keep the Sun Up. In June the Swedish sun barely sets. Tap to keep it in the
   sky, through the birches and the clouds, from 22:00 to sunrise at 03:30 (and
   beyond). Every gap you pass is ten more minutes of light. Catch the mirror ball
   and the sun turns into one for a few seconds, like on the site. */

(() => {
  'use strict';
  const D = window.Dots, { rgb, rgba, PAL, hash, lerp, clamp, mix } = D;
  let S = null;

  const clock = m => { const t = (22 * 60 + Math.round(m)) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };

  // the night sky, minute by minute after 22:00: golden → dusk → the short night → dawn → day
  function skyAt(m) {
    const K = [[0, 0.72], [120, 0.98], [200, 0.02], [330, 0.22], [450, 0.46]];
    if (m >= 450) return D.sky(0.46);
    for (let i = 0; i < K.length - 1; i++) {
      if (m <= K[i + 1][0]) {
        const k = D.smooth((m - K[i][0]) / (K[i + 1][0] - K[i][0]));
        if (i === 1) {   // from dusk into the night: blend the two ends of the site's sky
          const a = D.sky(0.98), b = D.sky(0.02), o = { top: mix(a.top, b.top, k), bot: mix(a.bot, b.bot, k) };
          if (a.mid) { o.mid = mix(a.mid, b.mid, k); o.mid2 = mix(a.mid2, b.mid2, k); }
          return o;
        }
        return D.sky(lerp(K[i][1], K[i + 1][1], k));
      }
    }
    return D.sky(0.46);
  }

  // the landscape behind (art.js) carries the evening on through the short night into the dawn; this
  // only knows where the near lake is (keep the sun out of it)
  function backdrop(g, w, h, m, scroll, t) {
    return Math.round(h * 0.86);
  }
  // minutes after 22:00 → the landscape's moment of the day (past 1 = on into the next morning)
  function sceneAt(m) {
    const K = [[0, 0.72], [120, 0.98], [200, 1.02], [330, 1.22], [450, 1.46]];
    if (m >= 450) return 1.46;
    for (let i = 0; i < K.length - 1; i++) if (m <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], D.smooth((m - K[i][0]) / (K[i + 1][0] - K[i][0])));
    return 1.46;
  }

  function pine(g, x, base, top, w) {
    const dk = D.light ? [24, 96, 76] : [34, 120, 80], lt = D.light ? [60, 150, 100] : [70, 170, 90];
    // a little rock island in the lake for it to stand on
    g.fillStyle = rgb([70, 60, 78]);
    g.beginPath(); g.ellipse(x + w / 2, base + 1, w * 0.9, 2.2, 0, 0, D.TAU); g.fill();
    g.fillStyle = rgb([90, 60, 40]);
    g.fillRect(Math.round(x + w / 2) - 1, Math.round(base - 3), 2, 3);
    for (let y = Math.round(top); y < base - 2; y++) {
      const k = ((y - top) % 7) / 7, half = Math.max(1, Math.round((0.35 + 0.65 * k) * w / 2));
      g.fillStyle = rgb(k < 0.3 ? lt : dk);
      g.fillRect(Math.round(x + w / 2) - half, y, half * 2, 1);
    }
  }
  function cloudCol(g, x, bottom, w, m, t) {
    const s = skyAt(m), lit = mix(D.light ? [255, 240, 248] : [255, 196, 214], s.bot, 0.2), sh = mix(lit, s.top, 0.3);
    // a stack of puffs hanging from the top, brightest at the bottom where the sun lights them
    for (let y = bottom - 3, i = 0; y > -6; y -= 5, i++) {
      const k = Math.min(1, (bottom - y) / 30);
      g.fillStyle = rgb(mix(lit, sh, k));
      g.beginPath();
      g.ellipse(x + w * 0.5 + Math.sin(i * 1.7) * 1.5, y, w * 0.62, 3.2, 0, 0, D.TAU);
      g.ellipse(x + w * 0.5 + Math.cos(i * 2.3) * 2.2, y - 2.5, w * 0.45, 2.6, 0, 0, D.TAU);
      g.fill();
    }
    g.fillStyle = rgb(mix(lit, [255, 255, 255], 0.4));
    g.fillRect(Math.round(x + 1), Math.round(bottom - 2), Math.max(1, Math.round(w - 2)), 1);
  }
  function sunBall(g, x, y, r, t, m) {
    g.fillStyle = rgb([255, 196, 90]);
    g.beginPath(); g.arc(x, y, r + 1, 0, D.TAU); g.fill();
    g.fillStyle = rgb(D.light ? [255, 186, 60] : [255, 214, 100]);
    g.beginPath(); g.arc(x, y, r, 0, D.TAU); g.fill();
    g.fillStyle = rgb([255, 246, 210]);
    g.fillRect(Math.round(x - r * 0.4), Math.round(y - r * 0.4), 1, 1);
  }

  function hudAll(api) { api.hud('<span class="chip" style="font-size:15px;letter-spacing:.06em">' + clock(S.m) + '</span>'); }

  function fresh(h) { return { y: h * 0.4, vy: 0, m: 0, scroll: 0, cols: [], next: 30, hearts: [], ball: null, disco: 0, dead: false, sunrise: false, steam: [] }; }

  function flap(api) {
    if (!api.running || S.dead) return;
    S.vy = -api.st.h * 0.62;
    S.started = true;
  }

  const game = {
    id: 'sun', name: 'Keep the Sun Up', kicker: 'Game 5',
    blurb: 'The Swedish sun barely sets. Keep it up until sunrise.',
    how: 'Tap to lift the sun. Steer it through the birches and clouds and keep it out of the lake. Every gap is ten more minutes of light. Sunrise is at 03:30.',
    better: 'high', noSun: true, disco: false, thumbScene: 0.8,
    sceneAt: () => sceneAt(S ? S.m : 0),
    fmt: m => clock(m),

    thumb(g, w, h, t) {
      backdrop(g, w, h, 100, 0, t);
      pine(g, w * 0.62, h * 0.86, h * 0.55, 8);
      cloudCol(g, w * 0.62, h * 0.3, 8, 100, t);
      sunBall(g, w * 0.3, h * 0.45, 4, t, 100);
    },

    setup(api) { S = fresh(api.st.h); S.idle = true; hudAll(api); },
    start(api) { S = fresh(api.st.h); hudAll(api); flap(api); },

    update(dt, api) {
      const w = api.st.w, h = api.st.h, lake = Math.round(h * 0.86), r = Math.max(3, h * 0.035), x = w * 0.28;
      if (S.dead) {
        S.y = Math.min(S.y + 30 * dt, lake + r);
        S.steam.forEach(p => { p.y -= 12 * dt; p.a -= dt * 0.8; });
        return;
      }
      const speed = 27 + Math.min(14, S.m / 40);
      S.scroll += speed * dt;
      S.vy += h * 2.25 * dt;
      S.y += S.vy * dt;
      if (S.y < r) { S.y = r; S.vy = Math.max(0, S.vy); }
      S.disco = Math.max(0, S.disco - dt);

      // new gaps
      S.next -= speed * dt;
      if (S.next <= 0) {
        const gap = h * Math.max(0.27, 0.36 - S.m / 3000);
        const mid = clamp(h * 0.18 + gap / 2 + Math.random() * (lake - h * 0.18 - gap - 6), gap / 2 + 4, lake - gap / 2 - 6);
        S.cols.push({ x: w + 2, top: mid - gap / 2, bot: mid + gap / 2, w: 8, passed: false });
        if (Math.random() < 0.35) S.hearts.push({ x: w + 6, y: mid });
        else if (!S.ball && Math.random() < 0.08 && S.m > 40) S.ball = { x: w + 6, y: mid };
        S.next = 44 + Math.random() * 10;
      }
      const inv = S.disco > 0;
      for (const c of S.cols) {
        c.x -= speed * dt;
        if (!c.passed && c.x + c.w < x - r) { c.passed = true; S.m += 10; hudAll(api); if (S.m >= 330 && !S.sunrise) { S.sunrise = true; api.toast('sunrise! it never set', w * 0.5, h * 0.3, 'big'); api.buzz(30); } }
        if (!inv && x + r - 1 > c.x && x - r + 1 < c.x + c.w && (S.y - r + 1 < c.top || S.y + r - 1 > c.bot)) return die(api, S.y < c.top + 2 ? 'cloud' : 'tree');
      }
      for (const p of S.hearts) { p.x -= speed * dt; if (!p.got && Math.hypot(p.x - x, p.y - S.y) < r + 3) { p.got = true; S.m += 5; hudAll(api); api.toast('+5 min', p.x, p.y - 5); } }
      if (S.ball) { S.ball.x -= speed * dt; if (Math.hypot(S.ball.x - x, S.ball.y - S.y) < r + 4) { S.ball = null; S.disco = 5; api.toast('mirror ball!', x, S.y - 8, 'big'); api.buzz(30); } else if (S.ball.x < -6) S.ball = null; }
      S.cols = S.cols.filter(c => c.x > -12);
      S.hearts = S.hearts.filter(p => p.x > -6 && !p.got);
      if (S.y + r >= lake) return die(api, 'lake');
    },

    draw(api, now) {
      const g = api.st.g, w = api.st.w, h = api.st.h, r = Math.max(3, h * 0.035), x = w * 0.28;
      const lake = backdrop(g, w, h, S.m, S.scroll, now);
      // the sun's light on the lake below it
      g.fillStyle = rgb([255, 214, 140]);
      for (let y = lake + 1; y < h; y += 2) g.fillRect(Math.round(x - 1 + Math.sin(y + now * 0.004) * 1.5), y, 2, 1);
      for (const c of S.cols) { cloudCol(g, c.x, c.top, c.w, S.m, now); pine(g, c.x, lake + 1, c.bot, c.w); }
      for (const p of S.hearts) D.pixelHeart(g, p.x, p.y - 2 + Math.sin(now * 0.005 + p.x) * 0.8, false, D.HEART_COLS[0]);
      if (S.ball) D.mirrorBall(g, S.ball.x, S.ball.y, 3, now, false);
      if (S.disco > 0) D.mirrorBall(g, x, S.y, r + 1, now, false);
      else sunBall(g, x, S.y, r, now, S.m);
      if (S.dead) S.steam.forEach(p => { if (p.a > 0) { g.fillStyle = rgba([255, 255, 255], p.a); g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } });
    },

    down(p, api) { flap(api); },
    key(e, api) { if (e.type === 'keydown' && (e.key === ' ' || e.key === 'ArrowUp')) { e.preventDefault(); flap(api); } }
  };

  function die(api, how) {
    const w = api.st.w, h = api.st.h, x = w * 0.28;
    S.dead = true;
    if (how === 'lake') for (let i = 0; i < 14; i++) S.steam.push({ x: x - 4 + Math.random() * 8, y: h * 0.86 - Math.random() * 4, a: 1 });
    api.buzz(40);
    const at = clock(S.m);
    const where = { lake: 'It set into the lake', tree: 'It caught in the birches', cloud: 'It hid behind a cloud' }[how];
    if (S.m >= 330) api.end({ title: 'The sun never set', text: 'You kept it up from 22:00 to ' + at + '. Dancing until the light goes out, or doesn’t.', score: S.m, scoreText: 'light until ' + at });
    else api.end({ title: 'The sun set at ' + at, text: where + '. In June it should barely set at all. Keep it up until 03:30.', score: S.m, scoreText: 'light until ' + at });
  }

  Arcade.add(game);
})();
