/* The gallery: every photo and film on the site as polaroids floating over the landscape, in a few
   little groups with a line each (the films as wide tiles). The camera button under the play button opens it (so does thebebs.com/gallery,
   which lands on /#gallery); scrolling through it carries the sky from morning into night. Tapping a
   polaroid opens it big (lightbox.js).

   And a little game, kept a bit of a secret: every photo someone actually looks at (opened big, or seen
   on the back of a turned card) counts. After the first one, a little "📸 1/15" floats in the bottom
   corner with a whisper (tapping it opens the gallery); finding all 15 sets off the disco. Remembered on
   this device. */

(() => {
  'use strict';

  const dlg = document.querySelector('.gallery');
  const btn = document.getElementById('photos-btn');
  if (!dlg) return;
  const inner = dlg.querySelector('.g-inner');
  const t = (k, en) => (window.t ? window.t(k, en) : en);
  const PH = window.STORY_PHOTOS || {};

  // every photo and film: where the sky should be behind it (0 morning … 1 night), and its words
  const FILMS = {
    'film:rosas': { src: 'rosas.mp4', poster: 'rosas.jpg', ar: 16 / 9 },
    'film:rosas-winter': { src: 'rosas-winter.mp4', poster: 'rosas-winter.jpg', ar: 16 / 9 },
    'film:football': { src: 'football.mp4', poster: 'football.jpg', cover: 'football-cover.jpg', ar: 9 / 16, tall: true }   // stays portrait; its tile shows the title frame
  };
  const ITEMS = {
    roatan: { scene: .78, cap: 'Roatán, Honduras', note: 'Where it all began.' },
    prague: { scene: .3, cap: 'Prague', note: 'By the river, one of many adventures.' },
    atitlan: { scene: .5, cap: 'Lake Atitlán, Guatemala', note: 'A hug high above the lake.' },
    telaviv: { scene: .7, cap: 'Tel Aviv', note: 'Golden hour in a city very dear to Andrea.' },
    tallinn: { scene: .86, cap: 'Tallinn, Estonia', note: 'Another place very dear to Andrea.' },
    gondola: { scene: .45, cap: 'Up in a gondola', note: 'High above the forest and the sea.' },
    lonisKid: { scene: .4, cap: 'Little Lonis', note: 'Serving since the day he was born.' },
    andreaKid: { scene: .62, cap: 'Little Andrea', note: 'Crop tops and low-rise before she could walk.' },
    bloodline: { scene: .96, cap: 'Head over heels', note: 'Upside down in a room of glowing dots.' },
    'film:rosas': { scene: .66, cap: 'Rösås in summer', note: 'The red house above the clover, where we’ll celebrate.' },
    'film:rosas-winter': { scene: .92, cap: 'Rösås in the snow', note: 'The same house, in winter.' },
    rosasBridge: { scene: .5, cap: 'The little bridge', note: 'Over the pond at Rösås.' },
    rosasDog: { scene: .36, cap: 'A borrowed dog', note: 'Not ours, sadly.' },
    'film:football': { scene: .72, cap: 'Sunday football', note: 'A Lonis and Andrea tradition.' },
    ramkvilla: { scene: .4, cap: 'The lake at Ramkvilla', note: 'Where we’ll swim on Sunday.' }
  };
  const GROUPS = [
    { key: 'adventures', en: 'Adventures', items: ['roatan', 'prague', 'atitlan', 'telaviv', 'tallinn', 'gondola'] },
    { key: 'little', en: 'Little us', items: ['lonisKid', 'andreaKid'] },
    { key: 'upside', en: 'Head over heels', items: ['bloodline'] },
    { key: 'rosas', en: 'Rösås', items: ['film:rosas', 'rosasBridge', 'film:rosas-winter', 'rosasDog'] },
    { key: 'weekend', en: 'The weekend', items: ['film:football', 'ramkvilla'] }
  ];
  const ALL = Object.keys(ITEMS), TOTAL = ALL.length;
  const capOf = k => t('g.cap.' + k, ITEMS[k].cap), noteOf = k => t('g.note.' + k, ITEMS[k].note);

  /* ---------- the game ---------- */
  const FOUND = 'la-found', DONE = 'la-found-done';
  let found = [];
  try { found = JSON.parse(localStorage.getItem(FOUND) || '[]'); } catch (e) {}
  if (!Array.isArray(found)) found = [];
  found = found.filter(k => ITEMS[k]);

  // the count, floating in the bottom corner once there's something to count
  const chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'found-chip'; chip.hidden = true;
  document.body.appendChild(chip);
  function badge() {
    chip.hidden = !found.length;
    chip.innerHTML = '<span aria-hidden="true">📸</span> <b>' + found.length + '</b>/' + TOTAL;
    chip.setAttribute('aria-label', t('gallery.found', '{n} of 15 found').replace('{n}', found.length));
    chip.classList.toggle('is-complete', found.length >= TOTAL);
    const f = inner.querySelector('.g-found');
    if (f) f.textContent = found.length ? t('gallery.found', '{n} of 15 found').replace('{n}', found.length) : '';
    inner.querySelectorAll('.g-item').forEach(el => el.classList.toggle('is-found', found.indexOf(el.dataset.key) >= 0));
  }

  // a whisper just above the count, for a moment
  let whisperT = 0;
  function whisper(text, long) {
    let w = document.querySelector('.whisper');
    if (!w) {
      w = document.createElement('div');
      w.className = 'whisper'; w.setAttribute('role', 'status');
      document.body.appendChild(w);
    }
    w.textContent = text;
    w.classList.remove('is-on'); void w.offsetWidth; w.classList.add('is-on');
    clearTimeout(whisperT);
    whisperT = setTimeout(() => w.classList.remove('is-on'), long ? 6500 : 3800);
  }

  // the arcade button under the music: it glows for anyone who has found them all
  function lightArcade() { const a = document.getElementById('arcade-btn'); if (a) a.classList.add('is-lit'); }
  try { if (localStorage.getItem(DONE) === '1') lightArcade(); } catch (e) {}

  window.foundPhotos = keys => {
    let added = 0;
    (keys || []).forEach(k => { if (ITEMS[k] && found.indexOf(k) < 0) { found.push(k); added++; } });
    if (!added) return;
    try { localStorage.setItem(FOUND, JSON.stringify(found)); } catch (e) {}
    badge();
    chip.classList.remove('is-pop'); void chip.offsetWidth; chip.classList.add('is-pop');
    const left = TOTAL - found.length;
    let done = false;
    try { done = localStorage.getItem(DONE) === '1'; } catch (e) {}
    if (left <= 0 && !done) {
      try { localStorage.setItem(DONE, '1'); } catch (e) {}
      setTimeout(() => {
        whisper(t('gallery.done', '🪩 You found all 15. Disco time.'), true);
        if (window.disco) window.disco();
        if (window.track) window.track('Opened: All 15 found');
        lightArcade();
        setTimeout(() => whisper(t('arcade.open', 'psst… the arcade just lit up ↗'), true), 7000);
      }, 600);
    } else if (found.length === added) {
      // the very first find: the counter appears, with a wink
      whisper(t('gallery.first', 'psst… {n} more hiding somewhere').replace('{n}', left));
    } else if (left === 1) {
      whisper(t('gallery.last', 'just one more…'));
    }
  };

  /* ---------- the gallery ---------- */
  const tilt = i => [-2.2, 1.6, -1, 2.4, -1.8, 1.1][i % 6] + 'deg';

  function polaroid(k, i) {
    const f = document.createElement('figure');
    f.className = 'polaroid g-item';
    f.dataset.key = k;
    f.dataset.scene = ITEMS[k].scene;
    f.dataset.cap = capOf(k);
    f.style.setProperty('--r', tilt(i));
    f.tabIndex = 0;
    f.setAttribute('role', 'button');
    const img = document.createElement('img');
    img.decoding = 'async'; img.loading = 'lazy';
    if (FILMS[k]) {
      f.dataset.film = FILMS[k].src; f.dataset.poster = FILMS[k].poster; f.dataset.ar = FILMS[k].ar;
      img.src = FILMS[k].cover || FILMS[k].poster;
      f.classList.add('is-film');
      if (FILMS[k].tall) f.classList.add('is-tall');
    } else {
      img.dataset.photo = k;                       // the sharp copy loads when it's opened big
      img.src = PH[k] || '';
    }
    img.alt = capOf(k);
    f.appendChild(img);
    const c = document.createElement('figcaption');
    const b = document.createElement('b'); b.textContent = capOf(k);
    const n = document.createElement('span'); n.textContent = noteOf(k);
    c.appendChild(b); c.appendChild(n); f.appendChild(c);
    const go = () => { if (window.lightboxOpen) window.lightboxOpen(f); };
    f.addEventListener('click', go);
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return f;
  }

  function render() {
    inner.textContent = '';
    const top = document.createElement('div'); top.className = 'g-top';
    const h = document.createElement('h2'); h.id = 'gallery-title'; h.textContent = t('gallery.title', 'Gallery');
    const x = document.createElement('button'); x.type = 'button'; x.className = 'g-close'; x.innerHTML = '&times;';
    x.setAttribute('aria-label', t('form.close', 'Close'));
    x.addEventListener('click', () => dlg.close());
    top.appendChild(h); top.appendChild(x); inner.appendChild(top);
    const lede = document.createElement('p'); lede.className = 'g-lede';
    lede.textContent = t('gallery.lede', 'In case you didn’t find them on the main site…');
    inner.appendChild(lede);
    const fc = document.createElement('p'); fc.className = 'g-found'; fc.setAttribute('aria-live', 'polite'); inner.appendChild(fc);
    let i = 0;
    GROUPS.forEach(gr => {
      const sec = document.createElement('section'); sec.className = 'g-group';
      const h3 = document.createElement('h3'); h3.textContent = t('g.grp.' + gr.key, gr.en); sec.appendChild(h3);
      const grid = document.createElement('div'); grid.className = 'g-grid';
      gr.items.forEach(k => grid.appendChild(polaroid(k, i++)));
      sec.appendChild(grid); inner.appendChild(sec);
    });
    const end = document.createElement('p'); end.className = 'g-end';
    const back = document.createElement('button'); back.type = 'button'; back.className = 'pill'; back.textContent = t('gallery.back', 'Back to the site');
    back.addEventListener('click', () => dlg.close());
    end.appendChild(back); inner.appendChild(end);
    badge();
  }

  // scrolling through the photos carries the sky from morning into night (art.js reads data-scene)
  function scene() {
    const max = Math.max(1, dlg.scrollHeight - dlg.clientHeight);
    dlg.dataset.scene = (0.22 + 0.72 * Math.min(1, dlg.scrollTop / max)).toFixed(3);
  }
  dlg.addEventListener('scroll', scene, { passive: true });

  const here = () => location.pathname + location.search;
  function open() {
    const rsvp = document.querySelector('.rsvp-card');
    if (rsvp && rsvp.open) rsvp.close();
    if (dlg.open) return;
    render();
    dlg.showModal();
    dlg.scrollTop = 0;
    scene();
    try { history.replaceState(null, '', here() + '#gallery'); } catch (e) {}
    if (window.track) window.track('Opened: Gallery');
    const h = inner.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  dlg.addEventListener('close', () => {
    try { if (location.hash === '#gallery') history.replaceState(null, '', here()); } catch (e) {}
    if (btn && !btn.hidden) btn.focus({ preventScroll: true });
  });

  if (btn) btn.addEventListener('click', open);
  chip.addEventListener('click', open);
  window.openGallery = open;
  if (location.hash === '#gallery') setTimeout(open, 400);
  window.addEventListener('hashchange', () => { if (location.hash === '#gallery') open(); });
  document.addEventListener('langchange', () => { if (dlg.open) render(); });
  render();
})();
