/* The rules of chess, and Lonis's thinking, for Bebchess (chess.js).

   A position is { board, turn, castle, ep, half, full, keys }: board is 64 squares from a8 (0) to
   h1 (63), 'PNBRQK' for White (Team Andrea), 'pnbrqk' for Black (Team Lonis), '' for empty.
   play() never changes a position, it returns the next one.

   window.BebChess = { create, moves(st, sq), all(st), play(st, m), status(st), kingSquare(st, color),
                       bestMove(st, { depth, randomness, timeMs }) } */

(() => {
  'use strict';

  const START = 'rnbqkbnrpppppppp' + ''.padEnd(32, '.') + 'PPPPPPPPRNBQKBNR';
  const VAL = { p: 100, n: 310, b: 330, r: 500, q: 900, k: 0 };
  const isW = ch => ch && ch === ch.toUpperCase();
  const colorOf = ch => (!ch ? null : isW(ch) ? 'w' : 'b');
  const R = sq => sq >> 3, C = sq => sq & 7;
  const on = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function create() {
    const board = START.split('').map(ch => (ch === '.' ? '' : ch));
    const st = { board, turn: 'w', castle: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0, full: 1, keys: [] };
    st.keys = [key(st)];
    return st;
  }
  function key(st) {
    return st.board.map(x => x || '.').join('') + st.turn + (st.castle.K ? 'K' : '') + (st.castle.Q ? 'Q' : '') + (st.castle.k ? 'k' : '') + (st.castle.q ? 'q' : '') + st.ep;
  }

  // is square sq attacked by the side `by`?
  function attacked(board, sq, by) {
    const r = R(sq), c = C(sq), W = by === 'w';
    // pawns
    const pr = r + (W ? 1 : -1);
    for (const dc of [-1, 1]) if (on(pr, c + dc) && board[pr * 8 + c + dc] === (W ? 'P' : 'p')) return true;
    for (const [dr, dc] of KN) if (on(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === (W ? 'N' : 'n')) return true;
    for (const [dr, dc] of KG) if (on(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === (W ? 'K' : 'k')) return true;
    const slide = (dirs, pieces) => {
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (on(rr, cc)) {
          const ch = board[rr * 8 + cc];
          if (ch) { if (pieces.indexOf(ch) >= 0) return true; break; }
          rr += dr; cc += dc;
        }
      }
      return false;
    };
    return slide(DIAG, W ? 'BQ' : 'bq') || slide(ORTH, W ? 'RQ' : 'rq');
  }

  function kingSquare(st, color) {
    const k = color === 'w' ? 'K' : 'k';
    return st.board.indexOf(k);
  }
  const inCheck = (st, color) => attacked(st.board, kingSquare(st, color), color === 'w' ? 'b' : 'w');

  // every move the side to move could make, before checking it doesn't leave its king in check
  function pseudo(st, only) {
    const out = [], b = st.board, me = st.turn, W = me === 'w';
    const add = (from, to, extra) => out.push(Object.assign({ from, to, piece: b[from], captured: b[to] || null }, extra || {}));
    for (let sq = 0; sq < 64; sq++) {
      if (only != null && sq !== only) continue;
      const ch = b[sq];
      if (!ch || colorOf(ch) !== me) continue;
      const p = ch.toLowerCase(), r = R(sq), c = C(sq);
      if (p === 'p') {
        const dir = W ? -1 : 1, start = W ? 6 : 1, last = W ? 0 : 7;
        const push = (from, to, extra) => {
          if (R(to) === last) ['q', 'r', 'b', 'n'].forEach(pr => add(from, to, Object.assign({ promo: W ? pr.toUpperCase() : pr }, extra)));
          else add(from, to, extra);
        };
        if (on(r + dir, c) && !b[(r + dir) * 8 + c]) {
          push(sq, (r + dir) * 8 + c);
          if (r === start && !b[(r + 2 * dir) * 8 + c]) add(sq, (r + 2 * dir) * 8 + c, { double: true });
        }
        for (const dc of [-1, 1]) {
          if (!on(r + dir, c + dc)) continue;
          const to = (r + dir) * 8 + c + dc;
          if (b[to] && colorOf(b[to]) !== me) push(sq, to);
          else if (to === st.ep) add(sq, to, { ep: true, captured: W ? 'p' : 'P' });
        }
      } else if (p === 'n' || p === 'k') {
        for (const [dr, dc] of (p === 'n' ? KN : KG)) {
          if (!on(r + dr, c + dc)) continue;
          const to = (r + dr) * 8 + c + dc;
          if (!b[to] || colorOf(b[to]) !== me) add(sq, to);
        }
        if (p === 'k') {
          const opp = W ? 'b' : 'w', home = W ? 60 : 4;
          if (sq === home && !attacked(b, sq, opp)) {
            if ((W ? st.castle.K : st.castle.k) && !b[sq + 1] && !b[sq + 2] && b[sq + 3] === (W ? 'R' : 'r') && !attacked(b, sq + 1, opp) && !attacked(b, sq + 2, opp)) add(sq, sq + 2, { castle: 'k' });
            if ((W ? st.castle.Q : st.castle.q) && !b[sq - 1] && !b[sq - 2] && !b[sq - 3] && b[sq - 4] === (W ? 'R' : 'r') && !attacked(b, sq - 1, opp) && !attacked(b, sq - 2, opp)) add(sq, sq - 2, { castle: 'q' });
          }
        }
      } else {
        const dirs = p === 'b' ? DIAG : p === 'r' ? ORTH : DIAG.concat(ORTH);
        for (const [dr, dc] of dirs) {
          let rr = r + dr, cc = c + dc;
          while (on(rr, cc)) {
            const to = rr * 8 + cc;
            if (b[to]) { if (colorOf(b[to]) !== me) add(sq, to); break; }
            add(sq, to);
            rr += dr; cc += dc;
          }
        }
      }
    }
    return out;
  }

  function play(st, m) {
    const b = st.board.slice(), W = st.turn === 'w';
    const castle = Object.assign({}, st.castle);
    b[m.to] = m.promo || b[m.from];
    b[m.from] = '';
    if (m.ep) b[m.to + (W ? 8 : -8)] = '';
    if (m.castle === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = ''; }
    if (m.castle === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = ''; }
    const p = m.piece.toLowerCase();
    if (p === 'k') { if (W) castle.K = castle.Q = false; else castle.k = castle.q = false; }
    [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([sq, k]) => { if (m.from === sq || m.to === sq) castle[k] = false; });
    const next = {
      board: b, turn: W ? 'b' : 'w', castle,
      ep: m.double ? (m.from + m.to) / 2 : -1,
      half: p === 'p' || m.captured ? 0 : st.half + 1,
      full: st.full + (W ? 0 : 1),
      keys: null
    };
    next.keys = (p === 'p' || m.captured ? [] : st.keys).concat([key(next)]);
    return next;
  }

  // the legal moves: the ones that don't leave your own king in check
  function legal(st, only) {
    return pseudo(st, only).filter(m => !inCheck(play(st, m), st.turn));
  }
  const moves = (st, sq) => legal(st, sq);
  const all = st => legal(st);

  function insufficient(b) {
    const pcs = b.filter(x => x && x.toLowerCase() !== 'k');
    if (!pcs.length) return true;
    if (pcs.length === 1 && 'bnBN'.indexOf(pcs[0]) >= 0) return true;
    return false;
  }

  function status(st) {
    const check = inCheck(st, st.turn);
    const any = legal(st).length > 0;
    if (!any) return check ? { over: true, inCheck: true, result: 'checkmate', winner: st.turn === 'w' ? 'b' : 'w' } : { over: true, inCheck: false, result: 'stalemate' };
    if (st.half >= 100) return { over: true, inCheck: check, result: 'fifty' };
    if (insufficient(st.board)) return { over: true, inCheck: check, result: 'material' };
    const k = st.keys[st.keys.length - 1];
    if (st.keys.filter(x => x === k).length >= 3) return { over: true, inCheck: check, result: 'repetition' };
    return { over: false, inCheck: check };
  }

  /* ---------- Lonis thinking ---------- */
  // a little bonus for good squares: pawns forward, pieces to the middle, the king tucked away
  const CENTER = new Array(64).fill(0).map((_, sq) => { const r = R(sq), c = C(sq); return 6 - (Math.abs(3.5 - r) + Math.abs(3.5 - c)) * 2; });
  function evaluate(st) {
    let s = 0;
    const b = st.board;
    for (let sq = 0; sq < 64; sq++) {
      const ch = b[sq];
      if (!ch) continue;
      const p = ch.toLowerCase(), w = isW(ch);
      let v = VAL[p];
      if (p === 'p') v += (w ? 6 - R(sq) : R(sq) - 1) * 8 + (C(sq) >= 2 && C(sq) <= 5 ? 4 : 0);
      else if (p === 'n' || p === 'b') v += CENTER[sq] * 3;
      else if (p === 'q') v += CENTER[sq];
      else if (p === 'k') v += (w ? R(sq) === 7 : R(sq) === 0) ? 12 : -10;
      s += w ? v : -v;
    }
    return st.turn === 'w' ? s : -s;
  }

  function bestMove(st, opts) {
    opts = opts || {};
    const depth = opts.depth || 2, noise = opts.randomness || 0, t0 = Date.now(), limit = opts.timeMs || 800;
    let out = false;
    const order = ms => ms.sort((a, b) => (b.captured ? VAL[b.captured.toLowerCase()] * 10 - VAL[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0)
                                      - ((a.captured ? VAL[a.captured.toLowerCase()] * 10 - VAL[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0)));
    function search(s, d, alpha, beta) {
      if (Date.now() - t0 > limit) { out = true; return evaluate(s); }
      const ms = legal(s);
      if (!ms.length) return inCheck(s, s.turn) ? -100000 - d : 0;
      if (d === 0) return quiet(s, alpha, beta, 3);
      order(ms);
      for (const m of ms) {
        const v = -search(play(s, m), d - 1, -beta, -alpha);
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    // at the end of the search, keep following the captures so it doesn't stop mid-trade
    function quiet(s, alpha, beta, d) {
      const stand = evaluate(s);
      if (stand >= beta || d === 0) return stand;
      if (stand > alpha) alpha = stand;
      const caps = order(pseudo(s).filter(m => m.captured || m.promo));
      for (const m of caps) {
        const n = play(s, m);
        if (inCheck(n, s.turn)) continue;
        const v = -quiet(n, -beta, -alpha, d - 1);
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    const root = order(legal(st));
    if (!root.length) return null;
    let best = null, bestV = -Infinity;
    for (const m of root) {
      const v = -search(play(st, m), depth - 1, -Infinity, Infinity) + (noise ? (Math.random() - 0.5) * noise : 0);
      if (v > bestV) { bestV = v; best = m; }
      if (out) break;
    }
    return best;
  }

  window.BebChess = { create, moves, all, play, status, kingSquare, bestMove };
})();
