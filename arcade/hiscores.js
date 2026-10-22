/* High scores, shared by everyone who plays: the top 10 of each scored game, with names. They live
   in the same Google Sheet as the RSVPs ("High scores" tab, rsvp-sheet.gs); delete a row there and
   it's gone. Only the real site sends scores. Anywhere else (this computer, a preview) there's a
   pretend board kept on the device, so nothing test-y ever reaches the sheet.

   HiScores.load() → Promise of { game: [[name, score], …] }   HiScores.board(game) → the last loaded
   HiScores.qualifies(game, score, low)   HiScores.submit(game, name, score) → Promise of the boards
   HiScores.clean(name) → the name as it will be shown ('' if it isn't allowed)                    */

(() => {
  'use strict';
  const GAMES = ['kick', 'list', 'run', 'sun'];
  const ONLINE = /(^|\.)thebebs\.com$/.test(location.hostname) && !!window.SHEET_URL;
  const LOCAL = 'bebs-arcade:hiscores-pretend', NAME = 'bebs-arcade:name';
  const RUDE = /fuck|shit|cunt|bitch|pussy|nigg|faggot|whore|slut|nazi|puta|puto|mierda|verga|pendej|hijueput|joder|fitta|knull|horunge/;
  let boards = null, ready = !ONLINE;   // ready: the sheet answers with scores (its script knows about them)

  const empty = () => { const o = {}; GAMES.forEach(g => { o[g] = []; }); return o; };
  const lowFirst = { list: true };
  function sortAll(o) {
    GAMES.forEach(g => { (o[g] = o[g] || []).sort((a, b) => lowFirst[g] ? a[1] - b[1] : b[1] - a[1]); o[g] = o[g].slice(0, 10); });
    return o;
  }
  function clean(n) {
    n = String(n || '').replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12).trim();
    const plain = n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    return RUDE.test(plain) ? '' : n;
  }
  function pretend() { try { return sortAll(JSON.parse(localStorage.getItem(LOCAL) || 'null') || empty()); } catch (e) { return empty(); } }

  function load() {
    if (!ONLINE) { boards = pretend(); return Promise.resolve(boards); }
    return fetch(window.SHEET_URL + '?scores=1', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (j && j.scores) ready = true; boards = sortAll(j && j.scores ? j.scores : empty()); return boards; })
      .catch(() => { boards = boards || empty(); return boards; });
  }
  function qualifies(game, score) {
    // (until the sheet's script has high scores in it, a score would land in the RSVPs: so, not yet)
    if (!ready || GAMES.indexOf(game) < 0 || score == null || !isFinite(score)) return false;
    const b = (boards && boards[game]) || [];
    if (b.length < 10) return true;
    const worst = b[b.length - 1][1];
    return lowFirst[game] ? score < worst : score > worst;
  }
  function submit(game, name, score) {
    name = clean(name);
    if (!name) return Promise.reject(new Error('name'));
    try { localStorage.setItem(NAME, name); } catch (e) {}
    if (!ONLINE) {
      const o = pretend(); o[game].push([name, score]); sortAll(o);
      try { localStorage.setItem(LOCAL, JSON.stringify(o)); } catch (e) {}
      boards = o; return Promise.resolve(o);
    }
    return fetch(window.SHEET_URL, { method: 'POST', body: new URLSearchParams({ game, name, score: String(score) }) })
      .then(r => r.json())
      .then(j => { if (j && j.scores) boards = sortAll(j.scores); return boards || load(); })
      .catch(() => load());
  }
  const lastName = () => { try { return localStorage.getItem(NAME) || ''; } catch (e) { return ''; } };

  window.HiScores = { load, board: g => (boards && boards[g]) || [], qualifies, submit, clean, lastName, has: g => GAMES.indexOf(g) >= 0, online: ONLINE };
})();
