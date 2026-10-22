/* Sunday football: penalties past Lonis, until he saves one (or you miss). He gets
   quicker with every goal. Swipe up from the ball to shoot (sideways for the corners,
   longer for higher), or tap the spot in the goal you want. The score: goals in a row. */

(() => {
  'use strict';
  const D = window.Dots, { rgb, rgba, PAL, hash, lerp, clamp } = D;
  const FLIGHT = 0.55;
  let S = null;

  // the pitch runs from the lake's edge (the landscape's lake line) to the bottom of the screen
  function geo(w, h) {
    const gw = Math.round(Math.min(w * 0.8, h * 0.62)), gl = Math.round(h * 0.7), gh = Math.round(gw * 0.3);
    // u: Lonis (28u × 1.25) stands about three quarters of the crossbar's height, like a real keeper in a real goal
    return { gl, gw, gh, gx0: Math.round((w - gw) / 2), gx1: Math.round((w + gw) / 2), bx: w / 2, by: Math.round(h * 0.9), u: gh / 45 };
  }

  // in front of the landscape (art.js): birches along the far edge, and the lawn, mown in stripes
  function field(g, w, h, t, G) {
    const hz = Math.round(h * 0.58);
    for (let i = 0; i < 16; i++) {           // birches along the edge of the field
      const x = 2 + hash(i * 3.7) * (w - 4), hh = h * (0.05 + hash(i) * 0.04);
      for (let k = 0; k < hh; k++) { g.fillStyle = rgb(k % 4 === 1 ? [50, 40, 46] : PAL.birch); g.fillRect(x | 0, (hz + 1 - k) | 0, 1, 1); }
      g.fillStyle = rgb(D.day ? [90, 170, 90] : [90, 190, 80]);
      for (let k = 0; k < 8; k++) g.fillRect((x - 2 + hash(i + k * 9) * 5) | 0, (hz - hh - 1 + hash(i * 5 + k) * hh * 0.5) | 0, 1, 1);
    }
    for (let y = hz + 1; y < h; y++) {
      const k = (y - hz) / (h - hz);
      const stripe = Math.floor(Math.pow(k, 0.7) * 9) % 2;
      const base = D.day ? (stripe ? [110, 196, 110] : [92, 176, 96]) : (stripe ? [84, 180, 70] : [62, 150, 60]);
      g.fillStyle = rgb(D.mix(base, D.day ? [60, 130, 80] : [30, 90, 50], k * 0.4));
      g.fillRect(0, y, w, 1);
    }
    // the six-yard line and the spot, softly
    g.fillStyle = rgba([255, 255, 255], 0.55);
    g.fillRect(G.gx0 - 3, G.gl + Math.round(h * 0.05), G.gw + 7, 1);
    g.fillStyle = rgba([255, 255, 255], 0.9);
    g.fillRect(Math.round(G.bx) - 1, G.by + 3, 2, 1);
  }

  function goalNet(g, G, t, bulge) {
    const net = D.light ? [120, 110, 140] : [200, 196, 230];
    for (let y = G.gl - G.gh + 1; y < G.gl; y++) {
      for (let x = G.gx0 + 1; x < G.gx1; x++) {
        let dx = 0, dy = 0;
        if (bulge) { const d = Math.hypot(x - bulge.x, y - bulge.y); if (d < 6) { const k = (1 - d / 6) * bulge.k; dx = (x - bulge.x) * k * 0.3; dy = (y - bulge.y) * k * 0.3; } }
        if (((x + dx) | 0) % 3 === 0 || ((y + dy) | 0) % 3 === 0) { g.fillStyle = rgba(net, 0.55); g.fillRect(x, y, 1, 1); }
      }
    }
  }
  function goalFrame(g, G) {
    g.fillStyle = rgb([255, 255, 255]);
    g.fillRect(G.gx0, G.gl - G.gh, 1, G.gh + 1);
    g.fillRect(G.gx1, G.gl - G.gh, 1, G.gh + 1);
    g.fillRect(G.gx0, G.gl - G.gh, G.gw + 1, 1);
  }
  function ball(g, x, y, r, spin) {
    g.fillStyle = rgb([252, 252, 255]);
    g.beginPath(); g.arc(x, y, r, 0, D.TAU); g.fill();
    g.fillStyle = rgb([30, 24, 40]);
    if (r > 2.2) { g.fillRect(Math.round(x + Math.cos(spin) * r * 0.4), Math.round(y + Math.sin(spin) * r * 0.4), 1, 1); g.fillRect(Math.round(x - Math.cos(spin) * r * 0.5), Math.round(y - Math.sin(spin) * r * 0.5), 1, 1); }
    else g.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  const goalsText = v => v + (v === 1 ? ' goal' : ' goals');
  function kicksHud(api) {
    api.hud('<span class="chip" aria-live="polite">⚽ ' + goalsText(S.goals) + '</span>');
  }

  function fresh() { return { n: 0, res: [], goals: 0, phase: 'aim', shot: null, keeper: { x: 0, rot: 0, tx: 0, pose: 'out', face: 'grin' }, swipe: null, trail: [], msgT: 0, bulge: null, react: null }; }

  function shoot(api, tx, ty) {
    const G = geo(api.st.w, api.st.h);
    S.phase = 'fly';
    S.shot = { tx, ty: Math.max(0, ty), k: 0, spin: 0 };
    // Lonis reads it sometimes (more often with every goal you score); otherwise he guesses a side,
    // or stays big in the middle
    const u = G.u * 1.25, read = Math.random() < Math.min(0.72, 0.3 + S.goals * 0.045);
    let hx = read ? tx + (Math.random() - 0.5) * 7 : [G.gx0 + G.gw * 0.27, G.bx, G.gx1 - G.gw * 0.27][(Math.random() * 3) | 0];
    hx = clamp(hx, G.gx0 + 2, G.gx1 - 2);
    const dir = Math.abs(hx - G.bx) < 4 ? 0 : Math.sign(hx - G.bx);
    S.keeper.hx = hx; S.keeper.dir = dir;
    S.keeper.tx = (dir ? hx - dir * 10 * u : G.bx) - G.bx;
    S.keeper.high = read ? ty > G.gh * 0.5 : Math.random() < 0.5;
    api.buzz(10);
  }

  function settle(api) {
    const G = geo(api.st.w, api.st.h), w = api.st.w;
    const s = S.shot, K = S.keeper;
    const bx = s.tx, bz = s.ty, kx = G.bx + K.x;
    const wide = bx < G.gx0 - 0.5 || bx > G.gx1 + 0.5, over = bz > G.gh + 0.5;
    const post = !over && (Math.abs(bx - G.gx0) < 1.2 || Math.abs(bx - G.gx1) < 1.2) || (!wide && Math.abs(bz - G.gh) < 1.0);
    // where his hands can reach after the dive (a little further, the warmer he gets)
    const u2 = G.u * 1.25 * Math.min(1.35, 1 + S.goals * 0.03), dir = K.dir;
    const saved = !wide && !over && (dir
      ? Math.abs(bx - K.hx) < 5.5 * u2 + 1 && (K.high ? bz > 6 * u2 && bz < 24 * u2 : bz < 14 * u2)
      : Math.abs(bx - kx) < 8 * u2 && bz < 20 * u2);
    let res, msg, cls;
    if (post) { res = 'miss'; msg = 'off the post!'; cls = 'warm'; s.bounce = { vx: (Math.random() - 0.5) * 30, vz: 20 }; }
    else if (wide) { res = 'miss'; msg = 'wide'; cls = 'warm'; }
    else if (over) { res = 'miss'; msg = 'over the bar'; cls = 'warm'; }
    else if (saved) { res = 'save'; msg = ['saved. he’s serving.', 'not today', 'Lonis says no', 'serving since birth'][S.n % 4]; cls = 'flag'; s.bounce = { vx: (bx < kx ? -1 : 1) * 26, vz: 16 }; }
    else { res = 'goal'; msg = ['GOAL!', 'top bins!', 'what a strike', 'into the net', 'unstoppable'][(Math.random() * 5) | 0]; cls = 'big'; S.goals++; S.bulge = { x: bx, y: G.gl - bz, k: 1 }; }
    S.res[S.n] = res;
    S.react = res;
    K.face = res === 'goal' ? 'sad' : 'grin';
    K.pose = res === 'save' ? 'serve' : res === 'goal' ? 'stand' : 'wave';
    api.toast(msg, clamp(bx, 10, w - 10), G.gl - G.gh - 4, cls);
    if (res === 'goal') api.buzz(30);
    S.n++;
    kicksHud(api);
    S.phase = 'done'; S.msgT = 1.3;
  }

  const game = {
    id: 'kick', name: 'Sunday Football', kicker: 'Game 2',
    blurb: 'How many can you get past Lonis?',
    how: 'Swipe up from the ball to shoot: sideways for the corners, a longer swipe goes higher. Or tap the spot in the goal you want. Keep scoring until Lonis saves one. He gets quicker with every goal.',
    better: 'high', scene: 0.68, disco: false,           // golden hour over Rösås, the sun up
    fmt: goalsText,

    thumb(g, w, h, t) {
      const G = geo(w, h);
      field(g, w, h, t, G); goalNet(g, G, t); goalFrame(g, G);
      Bebs.lonis(g, G.bx + G.gw * 0.12, G.gl, G.u * 1.3, { pose: 'out', t: 1, face: 'grin' });            // in goal, waiting
      Bebs.andrea(g, G.bx - G.gw * 0.32, h - 1, G.u * 2.4, { pose: 'stand', t: 1 });                       // about to shoot
      ball(g, G.bx - G.gw * 0.22, G.gl - G.gh * 0.55, 3, 0);
    },

    setup(api) { S = fresh(); kicksHud(api); },
    start(api) { S = fresh(); kicksHud(api); },

    update(dt, api) {
      const G = geo(api.st.w, api.st.h), K = S.keeper;
      if (S.phase === 'fly') {
        const s = S.shot;
        s.k = Math.min(1, s.k + dt / FLIGHT); s.spin += dt * 14;
        // he moves once the ball is struck
        const dk = clamp(s.k / 0.6);
        K.x = lerp(0, K.tx, D.smooth(dk));
        const dir = K.dir;
        K.rot = dir * (K.high ? 0.7 : 1.15) * D.smooth(clamp((s.k - 0.1) / 0.5));
        K.pose = dir ? 'up' : 'out';
        if (s.k >= 1) settle(api);
      } else if (S.phase === 'done') {
        S.msgT -= dt;
        const s = S.shot;
        if (s.bounce) { s.tx += s.bounce.vx * dt; s.ty = Math.max(0, s.ty + s.bounce.vz * dt); s.bounce.vz -= 60 * dt; }
        if (S.bulge) S.bulge.k = Math.max(0, S.bulge.k - dt * 1.5);
        if (S.msgT <= 0) {
          if (S.react !== 'goal') {                         // one he saved (or you missed): that's the end
            const g = S.goals;
            const title = g >= 10 ? 'Legend of Rösås' : g >= 6 ? 'On fire' : g >= 3 ? 'Lovely finishing' : g >= 1 ? 'Lonis is very good' : 'The wall of Rösås';
            const text = g >= 10 ? 'Lonis would like a word. And a rematch on Sunday.' : g >= 3 ? 'Bring that to Sunday football at the wedding.' : 'He has been serving since the day he was born. See you on Sunday.';
            S.phase = 'over';
            api.end({ title, text, score: g, scoreText: goalsText(g) + ' in a row', delay: 200 });
          } else { S.phase = 'aim'; S.shot = null; K.x = 0; K.rot = 0; K.pose = 'out'; K.face = 'grin'; S.react = null; S.bulge = null; }
        }
      } else if (S.phase === 'aim') {
        K.x = Math.sin(api.time * 2.2) * 3;   // shuffling on his line
      }
    },

    draw(api, now) {
      const g = api.st.g, w = api.st.w, h = api.st.h, G = geo(w, h), K = S.keeper, t = now / 1000;
      field(g, w, h, now, G);
      goalNet(g, G, now, S.bulge);
      const s = S.shot;
      let bxp = G.bx, byp = G.by, br = 3;
      if (s) {
        const k = s.k, gy = lerp(G.by, G.gl, D.smooth(k)), z = (s.ty * k) + 5 * k * (1 - k);
        bxp = lerp(G.bx, s.tx, k); byp = gy - z; br = lerp(3, 1.5, k);
        if (S.phase === 'done') { bxp = s.tx; byp = G.gl - s.ty; br = 1.5; }
      }
      const behind = s && s.k > 0.98 && S.react === 'goal';
      if (behind) ball(g, bxp, byp, br, s ? s.spin : 0);
      Bebs.lonis(g, G.bx + K.x, G.gl - (K.rot ? Math.abs(K.rot) * 2 : 0), G.u * 1.25, { pose: K.pose, rot: K.rot, pivot: -14, t, face: K.face });
      goalFrame(g, G);
      if (!behind) ball(g, bxp, byp, br, s ? s.spin : 0);
      // Andrea on the touchline
      const ap = S.react === 'goal' ? 'up' : S.react === 'save' ? 'stand' : 'hug';
      Bebs.andrea(g, w * 0.14, h - 2, G.u * 2.1, { pose: ap, t, face: S.react === 'goal' ? 'grin' : S.react === 'save' ? 'sad' : 'smile', fit: { top: 'babytee', bottom: 'lowrise', shoes: 'sneakers' } });
      // the swipe, as a trail of little dots
      if (S.swipe) S.trail.forEach((p, i) => { g.fillStyle = rgba(D.light ? [158, 20, 40] : PAL.lime, 0.4 + 0.6 * i / S.trail.length); g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); });
    },

    down(p, api) {
      if (!api.running || S.phase !== 'aim') return;
      S.swipe = { x: p.x, y: p.y, t: performance.now() };
      S.trail = [p];
    },
    move(p) { if (S.swipe) { S.trail.push(p); if (S.trail.length > 24) S.trail.shift(); } },
    up(p, api) {
      if (!S.swipe || S.phase !== 'aim') { S.swipe = null; return; }
      const G = geo(api.st.w, api.st.h), s0 = S.swipe;
      S.swipe = null;
      const dx = p.x - s0.x, dy = p.y - s0.y, L = Math.hypot(dx, dy);
      if (L < 4) {
        // a tap: aim at that spot, if it's around the goal
        if (p.y < G.gl + 6) shoot(api, p.x + (Math.random() - 0.5) * 3, G.gl - p.y + (Math.random() - 0.5) * 2);
        return;
      }
      if (dy > -4) return;                     // swiping down doesn't kick
      const tx = G.bx + dx / -dy * (G.by - G.gl) * 0.95 + (Math.random() - 0.5) * 2;
      const ty = clamp((L - 8) / 46) * G.gh * 1.35 + (Math.random() - 0.5) * 1.5;
      shoot(api, tx, ty);
    }
  };

  Arcade.add(game);
})();
