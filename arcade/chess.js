/* Bebchess. Team Andrea against Team Lonis on a dance-floor checkerboard.
   Lonis's pieces are black, obviously. Play against Lonis (easy, or serious),
   or pass the phone for two players. Tap a piece, then tap where it goes.
   The rules and Lonis's thinking live in chess-engine.js (window.BebChess). */

(() => {
  'use strict';
  const D = window.Dots, { rgb, rgba, PAL, mix } = D;
  const SQ = 12;
  const SPR = {
    p: ['........', '...##...', '..####..', '..####..', '...##...', '..####..', '...##...', '.######.', '########'],
    n: ['....##..', '..#####.', '.##e###.', '#######.', '##..###.', '...####.', '..####..', '.######.', '########'],
    b: ['...##...', '..####..', '.##.###.', '.###.##.', '..####..', '...##...', '..####..', '.######.', '########'],
    r: ['##.##.##', '########', '.######.', '..####..', '..####..', '..####..', '.######.', '.######.', '########'],
    q: ['#..##..#', '#.####.#', '.######.', '.######.', '..####..', '..####..', '.######.', '.######.', '########'],
    k: ['...aa...', '..aaaa..', '...aa...', '.######.', '########', '.######.', '..####..', '.######.', '########']
  };
  // the one-dot outline around each piece
  const OUT = {};
  Object.keys(SPR).forEach(k => {
    const rows = SPR[k], on = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < 8 && rows[y][x] !== '.' && rows[y][x] !== 'e';
    const pts = [];
    for (let y = -1; y <= rows.length; y++) for (let x = -1; x <= 8; x++) {
      if (on(x, y)) continue;
      if (rows[y] && rows[y][x] === 'e') { pts.push([x, y]); continue; }
      let n = false;
      for (let a = -1; a <= 1 && !n; a++) for (let b = -1; b <= 1; b++) if ((a || b) && on(x + a, y + b)) { n = true; break; }
      if (n) pts.push([x, y]);
    }
    OUT[k] = pts;
  });
  const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  const LINES = {
    think: ['hmm', 'thinking…', 'running the numbers', 'consulting the model', 'one sec, beb', 'interesting…', 'calculating'],
    lTakes: ['sorry beb', 'mine now', 'thank you', 'yoink', 'I’ll take that'],
    lLoses: ['rude', 'I meant to do that', 'ouch', 'okay, okay', 'noted'],
    aTakes: ['obviously', 'mine', 'easy', 'thank you very much', 'serving'],
    aLoses: ['excuse me?', 'rude', 'hmm', 'that was a test'],
    check: ['check!', 'check, beb', 'check :)']
  };
  const pickLine = k => LINES[k][(Math.random() * LINES[k].length) | 0];

  let S = null;
  const E = () => window.BebChess;
  const team = c => (c === 'w' ? 'a' : 'l');          // White is Team Andrea, Black is Team Lonis

  // the board is the black-and-white dance floor; Team Andrea in rust and gold, Team Lonis in black
  function colors() {
    return { lt: [238, 234, 246], dk: [24, 18, 34], last: [255, 170, 90], sel: PAL.lime, dot: PAL.lime, chk: [255, 60, 100],
             aF: [226, 120, 70], aS: [178, 83, 46], aO: [255, 238, 214], lF: [26, 22, 30], lS: [52, 46, 60], lO: [214, 200, 255], aK: [255, 214, 100], lK: [255, 255, 255] };
  }

  // where the board is on the stage (in scene pixels): 8 squares of SQ, centred, below the bar and Team Lonis
  let OX = 0, OY = 0;
  function place(api) {
    const st = api.st;
    OX = Math.round((st.w - SQ * 8) / 2);
    OY = Math.round(124 / st.cell);
  }
  const toDisp = sq => { let r = sq >> 3, c = sq & 7; if (S.flip) { r = 7 - r; c = 7 - c; } return [r, c]; };
  const fromDisp = (r, c) => (S.flip ? (7 - r) * 8 + (7 - c) : r * 8 + c);

  function drawPiece(g, ch, x0, y0, C) {
    const k = ch.toLowerCase(), white = ch === ch.toUpperCase();
    const rows = SPR[k], F = white ? C.aF : C.lF, Sh = white ? C.aS : C.lS, O = white ? C.aO : C.lO, A = white ? C.aK : C.lK;
    g.fillStyle = rgb(O);
    OUT[k].forEach(([x, y]) => g.fillRect(x0 + x, y0 + y, 1, 1));
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < 8; x++) {
      const c = rows[y][x];
      if (c === '.' || c === 'e') continue;
      g.fillStyle = rgb(c === 'a' ? A : (x >= 5 || y >= 7) ? Sh : F);
      g.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }

  function board(g, C, now) {
    const st = S.st, last = S.last;
    const chk = E().status(st).inCheck ? E().kingSquare(st, st.turn) : -1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const sq = fromDisp(r, c);
      let col = (r + c) % 2 === 0 ? C.lt : C.dk;
      if (last && (sq === last.from || sq === last.to)) col = mix(col, C.last, 0.42);
      if (sq === S.sel) col = mix(col, C.sel, 0.55);
      if (sq === chk) col = mix(col, C.chk, 0.5 + 0.2 * Math.sin(now * 0.008));
      g.fillStyle = rgba(col, D.TILE_A);
      g.fillRect(OX + c * SQ, OY + r * SQ, SQ, SQ);
    }
    // the pieces (one may be sliding)
    for (let sq = 0; sq < 64; sq++) {
      const ch = st.board[sq];
      if (!ch || (S.anim && sq === S.anim.to)) continue;
      const [r, c] = toDisp(sq);
      drawPiece(g, ch, OX + c * SQ + 2, OY + r * SQ + 2, C);
    }
    if (S.anim) {
      const a = S.anim, k = D.smooth(Math.min(1, (now - a.t0) / 260));
      const [r0, c0] = toDisp(a.from), [r1, c1] = toDisp(a.to);
      const ch = st.board[a.to];
      if (ch) drawPiece(g, ch, OX + Math.round((c0 + (c1 - c0) * k) * SQ + 2), OY + Math.round((r0 + (r1 - r0) * k) * SQ + 2), C);
      if (k >= 1) S.anim = null;
    }
    // where the selected piece can go
    S.targets.forEach(m => {
      const [r, c] = toDisp(m.to), cx = OX + c * SQ + 6, cy = OY + r * SQ + 6;
      g.fillStyle = rgb(C.dot);
      if (m.captured) { const x0 = OX + c * SQ, y0 = OY + r * SQ; for (let i = 0; i < 12; i++) { g.fillRect(x0 + i, y0, 1, 1); g.fillRect(x0 + i, y0 + 11, 1, 1); g.fillRect(x0, y0 + i, 1, 1); g.fillRect(x0 + 11, y0 + i, 1, 1); } }
      else g.fillRect(cx - 1, cy - 1, 2, 2);
    });
  }

  /* ---------- the two sides: a little portrait, what they say, what they've taken ---------- */
  function sideHtml(who) {
    return '<div class="side" data-side="' + who + '"><canvas width="44" height="44" aria-hidden="true"></canvas><div class="who"><div class="nm">' + (who === 'a' ? 'Team Andrea' : 'Team Lonis') + '</div><div class="say" aria-live="polite"></div></div><div class="caps" aria-label="Captured pieces"></div></div>';
  }
  // a little round portrait: the face from each doll (bebs.js's pictures)
  const FACE = { a: { src: 'andrea.png?v=3', x: 53, y: 22, s: 96 }, l: { src: 'lonis.png?v=3', x: 128, y: 30, s: 96 } };
  const faceImg = {};
  function avatar(el, who) {
    const cv = el.querySelector('canvas'), f = FACE[who];
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5), size = 36;
    cv.width = cv.height = Math.round(size * dpr); cv.style.width = cv.style.height = size + 'px';
    const draw = () => { const x = cv.getContext('2d'); x.fillStyle = who === 'a' ? '#e8c3a8' : '#2a2238'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(faceImg[who], f.x, f.y, f.s, f.s, 0, 0, cv.width, cv.height); };
    if (!faceImg[who]) { faceImg[who] = new Image(); faceImg[who].onload = draw; faceImg[who].src = f.src; }
    else if (faceImg[who].complete) draw(); else faceImg[who].addEventListener('load', draw, { once: true });
  }
  function sides(api) {
    const top = S.flip ? 'a' : 'l', bot = S.flip ? 'l' : 'a';
    api.strip.innerHTML = sideHtml(top);
    S.sideEl = { [top]: api.strip.querySelector('.side'), [bot]: null };
    return bot;
  }
  function refreshSides() {
    ['a', 'l'].forEach(who => {
      const el = S.sideEl[who];
      if (!el) return;
      el.classList.toggle('turn', team(S.st.turn) === who && !S.over);
      el.querySelector('.say').textContent = S.say[who] || '';
      // what this side has captured
      const taken = S.taken[who].slice().sort((x, y) => VAL[y] - VAL[x]);
      el.querySelector('.caps').textContent = taken.map(p => GLYPH[p]).join('');
      const face = S.face[who] || 'smile';
      if (!el._drawn) { avatar(el, who); el._drawn = true; }
    });
  }
  function say(who, line, face) {
    S.say[who] = line;
    if (face) S.face[who] = face;
    clearTimeout(S.sayT && S.sayT[who]);
    S.sayT = S.sayT || {};
    S.sayT[who] = setTimeout(() => { if (S) { S.face[who] = 'smile'; if (who === 'l') S.face.l = 'grin'; refreshSides(); } }, 2400);
    refreshSides();
  }

  /* ---------- the controls under the board ---------- */
  function buildPanel(api) {
    const bot = sides(api);
    const ai = S.mode === 'ai';
    api.panel.innerHTML = '<div class="chess-wrap">' + sideHtml(bot) +
      '<div class="chess-opts" role="group" aria-label="Who plays">' +
        '<button type="button" class="chip" data-mode="ai" aria-pressed="' + ai + '">vs Lonis</button>' +
        '<button type="button" class="chip" data-mode="two" aria-pressed="' + !ai + '">Two players</button></div>' +
      (ai ? '<div class="chess-opts" role="group" aria-label="Your team">' +
        '<button type="button" class="chip" data-me="w" aria-pressed="' + (S.me === 'w') + '">I’m Team Andrea</button>' +
        '<button type="button" class="chip" data-me="b" aria-pressed="' + (S.me === 'b') + '">I’m Team Lonis</button></div>' +
        '<div class="chess-opts" role="group" aria-label="How hard">' +
        '<button type="button" class="chip" data-lvl="easy" aria-pressed="' + (S.lvl === 'easy') + '">Easy</button>' +
        '<button type="button" class="chip" data-lvl="serious" aria-pressed="' + (S.lvl === 'serious') + '">Serious</button></div>' : '') +
      '<div class="row-btns"><button type="button" class="btn" data-act="new">New game</button><button type="button" class="btn quiet" data-act="undo">Undo</button></div></div>';
    S.sideEl[bot] = api.panel.querySelector('.side');
    S.sideEl.a && (S.sideEl.a._face = null); S.sideEl.l && (S.sideEl.l._face = null);
    refreshSides();
  }

  function newGame(api) {
    const me = S ? S.me : 'w', mode = S ? S.mode : 'ai', lvl = S ? S.lvl : 'easy';
    S = { st: E().create(), me, mode, lvl, sel: -1, targets: [], last: null, anim: null, hist: [], over: null, say: { a: '', l: '' }, face: { a: 'smile', l: 'grin' }, taken: { a: [], l: [] }, thinking: false, token: (S ? S.token : 0) + 1 };
    S.flip = mode === 'ai' && me === 'b';
    api.uncard();
    buildPanel(api);
    say(mode === 'ai' ? (me === 'w' ? 'l' : 'a') : 'l', mode === 'ai' ? (me === 'w' ? 'good luck, beb' : 'your move… wait, mine') : 'Team Andrea starts');
    maybeAI(api);
  }

  function apply(api, m) {
    const st = S.st, mover = team(st.turn), other = mover === 'a' ? 'l' : 'a';
    S.hist.push({ st, last: S.last, taken: { a: S.taken.a.slice(), l: S.taken.l.slice() } });
    if (m.captured) S.taken[mover].push(m.captured.toLowerCase());
    S.st = E().play(st, m);
    S.last = m; S.sel = -1; S.targets = [];
    S.anim = { from: m.from, to: m.to, t0: performance.now() };
    const status = E().status(S.st);
    if (status.over) return finish(api, status);
    if (status.inCheck) say(mover, pickLine('check'), 'grin');
    else if (m.captured) { say(mover, pickLine(mover === 'l' ? 'lTakes' : 'aTakes'), 'grin'); S.face[other] = 'sad'; say(other, pickLine(other === 'l' ? 'lLoses' : 'aLoses'), 'sad'); }
    else refreshSides();
    api.buzz(8);
    maybeAI(api);
  }

  function finish(api, status) {
    S.over = status;
    refreshSides();
    let title, text;
    if (status.result === 'checkmate') {
      const win = team(status.winner);
      title = 'Checkmate';
      text = win === 'a' ? 'Team Andrea wins. She wasn’t delusional.' : 'Team Lonis wins. Rematch at the wedding?';
      say(win, win === 'a' ? 'obviously' : 'gg, beb', 'grin');
      say(win === 'a' ? 'l' : 'a', win === 'a' ? 'I let you win' : 'rematch. now.', 'sad');
    } else {
      title = 'A draw';
      text = { stalemate: 'Stalemate. Very diplomatic.', fifty: 'Fifty moves of nothing. Time to dance instead.', material: 'Not enough pieces left to win. Hug it out.', repetition: 'The same moves three times. Like an old married couple.' }[status.result] || 'Nobody wins. Everybody dances.';
    }
    setTimeout(() => { if (S && S.over) api.card({ kicker: 'Bebchess', title, text, buttons: [{ label: 'New game', on: () => newGame(api) }, { label: 'See the board', quiet: true, on: () => api.uncard() }] }); }, 900);
  }

  function maybeAI(api) {
    if (S.mode !== 'ai' || S.over || S.st.turn === S.me) return;
    S.thinking = true;
    const ai = team(S.st.turn);
    say(ai, pickLine('think'), ai === 'l' ? 'grin' : 'smile');
    const tok = S.token, st = S.st;
    setTimeout(() => {
      if (!S || S.token !== tok || S.st !== st) return;
      const m = E().bestMove(st, S.lvl === 'serious' ? { depth: 3, randomness: 8, timeMs: 900 } : { depth: 2, randomness: 90, timeMs: 400 });
      S.thinking = false;
      if (m) apply(api, m);
    }, 450 + Math.random() * 350);
  }

  const game = {
    id: 'chess', name: 'Bebchess', thumbBackdrop: false,          // the board fills its picture kicker: 'Game 7', panel: true, scene: 0.985, disco: true,
    blurb: 'Team Andrea against Team Lonis. His pieces are black, obviously.',
    // the board fills the width (or the height left between Team Lonis and the panel): 8 squares of SQ dots
    get cell() { return Math.max(2.4, Math.min(window.innerWidth - 24, window.innerHeight - 380) / (SQ * 8)); },
    renderOpts: { size: 1.08 },
    resize(api) { place(api); },

    thumb(g, w, h, t) {
      const C = colors(), s = 11, cols = Math.ceil(w / s), rows = Math.ceil(h / s);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.fillStyle = rgba((r + c) % 2 ? C.dk : C.lt, D.TILE_A); g.fillRect(c * s, r * s, s, s); }
      const at = (ch, c, r) => drawPiece(g, ch, c * s + 1, r * s + 1, C);
      at('k', 1, 0); at('q', 2, 0); at('n', 0, 1); at('p', 3, 1);
      at('P', 1, 1); at('B', 2, 2); at('K', 1, 2); at('Q', 3, 2);
    },

    setup(api) {
      S = null;
      if (!E()) { api.panel.innerHTML = '<p class="foot">The chess rules didn’t load. Reload the page to try again.</p>'; return; }
      S = { me: 'w', mode: 'ai', lvl: 'easy', token: 0 };
      newGame(api);
      api.panel.onclick = e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.mode) { S.mode = b.dataset.mode; newGame(api); }
        else if (b.dataset.me) { S.me = b.dataset.me; newGame(api); }
        else if (b.dataset.lvl) { S.lvl = b.dataset.lvl; buildPanel(api); }
        else if (b.dataset.act === 'new') newGame(api);
        else if (b.dataset.act === 'undo') undo(api);
      };
      api.hud('');
    },

    themed() { if (S && S.sideEl) refreshSides(); },

    draw(api, now) {
      if (!S || !S.st) return false;
      place(api);
      board(api.st.g, colors(), now);
    },

    down(p, api) {
      if (!S || !S.st || S.over || S.thinking || S.anim) return;
      if (S.mode === 'ai' && S.st.turn !== S.me) return;
      const c = Math.floor((p.x - OX) / SQ), r = Math.floor((p.y - OY) / SQ);
      if (c < 0 || c > 7 || r < 0 || r > 7) return;
      const sq = fromDisp(r, c), ch = S.st.board[sq];
      const tgt = S.targets.find(m => m.to === sq);
      if (tgt) { apply(api, tgt); return; }
      const mine = ch && ((ch === ch.toUpperCase()) === (S.st.turn === 'w'));
      if (mine && sq !== S.sel) { S.sel = sq; S.targets = E().moves(S.st, sq); }
      else { S.sel = -1; S.targets = []; }
    },

    close(api) { if (S) S.token++; api.panel.onclick = null; }
  };

  function undo(api) {
    if (!S.hist.length || S.thinking) return;
    // against Lonis, take back his reply and your move together
    let n = S.mode === 'ai' ? (S.st.turn === S.me ? 2 : 1) : 1;
    let h = null;
    while (n-- > 0 && S.hist.length) h = S.hist.pop();
    if (!h) return;
    S.st = h.st; S.last = h.last; S.taken = h.taken; S.over = null; S.sel = -1; S.targets = []; S.anim = null; S.token++;
    api.uncard();
    say(S.mode === 'ai' ? team(S.me === 'w' ? 'b' : 'w') : 'l', 'fine, take it back');
    maybeAI(api);
  }

  Arcade.add(game);
})();
