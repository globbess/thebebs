/* Cards with two sides (every version of The story of us, the Rösås card and The weekend): the card's
   folded-up corner (drawn by art.js), or the little fan of its photos peeking out at the bottom of the
   front, turns the card around to show the photos and a line on the back; tapping the corner again
   turns it back. Completely optional: the story reads fine without it.
   Photos come from storyphotos.js. When the story switches version (story.js), every card
   is front side up again. */

(() => {
  'use strict';

  const cards = Array.prototype.slice.call(document.querySelectorAll('.story-v, .flip-card'))
    .filter(v => v.querySelector('.face-back'));
  if (!cards.length) return;
  const t = (k, en) => (window.t ? window.t(k, en) : en);
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the photos
  document.querySelectorAll('img[data-photo]').forEach(img => {
    const src = window.STORY_PHOTOS && window.STORY_PHOTOS[img.dataset.photo];
    if (src) img.src = src;
  });

  function label(card) {
    const back = !card.querySelector('.face-back').hidden;
    const btn = card.querySelector('.turn');
    btn.setAttribute('aria-pressed', String(back));
    btn.querySelector('.turn-label').textContent = back ? t('story.turnBack', 'Turn back') : t('story.turnOver', 'Turn over');
    btn.setAttribute('title', btn.querySelector('.turn-label').textContent);
  }

  function swap(card, toBack) {
    card.querySelector('.face-front').hidden = toBack;
    card.querySelector('.face-back').hidden = !toBack;
    // the little films on the back play while it's showing (muted, on a loop); not for people who prefer less motion
    card.querySelectorAll('.face-back video').forEach(film => {
      if (toBack && !still) { film.muted = true; const p = film.play(); if (p && p.catch) p.catch(() => {}); }
      else { film.pause(); if (toBack) film.controls = true; }
    });
    label(card);
    document.dispatchEvent(new Event('layoutchange'));   // the art re-checks where the words sit
  }

  function turn(card) {
    const toBack = card.querySelector('.face-back').hidden;
    if (toBack && window.track) window.track('Turned: ' + (CARD_NAMES[keyOf(card)] || keyOf(card)));
    if (toBack && window.foundPhotos) window.foundPhotos(mediaOf(card).map(m => m.key));   // the game (gallery.js)
    if (still) { swap(card, toBack); return; }
    card.classList.add('is-turning-out');
    setTimeout(() => {
      card.classList.remove('is-turning-out');
      card.classList.add('is-turning-in');
      swap(card, toBack);
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('go')));
      setTimeout(() => card.classList.remove('is-turning-in', 'go'), 380);
    }, 280);
  }

  // "psst, turn the page": drawn on a card as it comes into view, until the guest has turned
  // that card (remembered on this device, card by card: turning one doesn't hide the others)
  const TURNED = 'la-turned-cards';
  const keyOf = card => card.dataset.card || ('story-' + card.dataset.v);
  // what each card is called in the "Clicks" tab of the sheet (track.js)
  const CARD_NAMES = { 'story-0': 'Story card (full story)', 'story-1': 'Story card (TL;DR)', 'story-2': 'Story card (still too long?)',
    'story-3': 'Story card (emoji)', rosas: 'Rösås card', weekend: 'The weekend card' };
  let turned = [];
  try { turned = JSON.parse(localStorage.getItem(TURNED) || '[]'); } catch (e) {}
  if (!Array.isArray(turned)) turned = [];
  const hintOf = card => card.querySelector('.turn-hint');
  cards.forEach(card => {
    const h = hintOf(card);
    if (!h) return;
    if (turned.indexOf(keyOf(card)) >= 0) h.classList.add('is-done');
    else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { h.classList.add('is-drawn'); io.disconnect(); } }, { threshold: 1 });
      io.observe(h);
    } else h.classList.add('is-drawn');
  });
  function markTurned(card) {
    const h = hintOf(card);
    if (h) h.classList.add('is-done');
    const k = keyOf(card);
    if (turned.indexOf(k) >= 0) return;
    turned.push(k);
    try { localStorage.setItem(TURNED, JSON.stringify(turned)); } catch (e) {}
  }

  // the photos and films on a card's back: their keys (for the "found" game) and a picture of each
  function mediaOf(card) {
    return Array.prototype.slice.call(card.querySelectorAll('.face-back img[data-photo], .face-back video')).map(m => m.tagName === 'IMG'
      ? { key: m.dataset.photo, src: m.getAttribute('src') }
      : { key: 'film:' + (m.getAttribute('poster') || '').replace(/\.jpg$/, ''), src: m.getAttribute('poster') });
  }

  /* ---------- the peek ----------
     up to three of the card's own photos, fanned like a little stack of polaroids sticking out of the
     bottom of the front. Tapping them turns the card. The first time the stack comes into view it
     fans out a little and settles back, once. */
  function peek(card) {
    const box = card.querySelector('.face-front .peek');
    if (!box) return;
    const m = mediaOf(card).slice(0, 3);
    m.forEach((x, i) => {
      const p = document.createElement('span');
      p.className = 'peek-p';
      p.style.setProperty('--i', String(i - (m.length - 1) / 2));
      const img = document.createElement('img');
      img.src = x.src; img.alt = ''; img.decoding = 'async';
      p.appendChild(img);
      box.appendChild(p);
    });
    box.addEventListener('click', () => { markTurned(card); turn(card); });
    if (still || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => { box.classList.add('hello'); setTimeout(() => box.classList.remove('hello'), 900); }, 350);
    }, { threshold: 1 });
    io.observe(box);
  }

  cards.forEach(card => {
    const btn = card.querySelector('.turn');
    peek(card);
    btn.addEventListener('click', () => { markTurned(card); turn(card); });
    corner(btn);
    label(card);
    // front side up again whenever the version is switched away
    new MutationObserver(() => { if (card.hidden && card.querySelector('.face-front').hidden) swap(card, false); })
      .observe(card, { attributes: true, attributeFilter: ['hidden'] });
  });
  document.addEventListener('langchange', () => cards.forEach(label));

  /* ---------- the folded corner ----------
     art.js draws the card's corner folded up, `data-fold` pixels deep; here it lifts a
     little more on hover, and peels up a couple of times when it scrolls into view */
  function corner(btn) {
    const REST = 42, LIFT = 64;
    let fold = REST, target = REST, raf = 0;
    btn.dataset.fold = REST;
    function animate() {
      cancelAnimationFrame(raf);
      const step = () => {
        fold += (target - fold) * 0.2;
        if (Math.abs(target - fold) < 0.4) fold = target;
        btn.dataset.fold = fold.toFixed(1);
        if (fold !== target) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    const lift = up => { if (still) return; target = up ? LIFT : REST; animate(); };
    btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') lift(true); });
    btn.addEventListener('pointerleave', () => lift(false));
    btn.addEventListener('focus', () => lift(true));
    btn.addEventListener('blur', () => lift(false));
    if ('IntersectionObserver' in window && !still) {
      let peeled = false;
      new IntersectionObserver(es => {
        if (!es[0].isIntersecting || peeled) return;
        peeled = true;
        [0, 700, 1400, 2100].forEach((ms, i) => setTimeout(() => lift(i % 2 === 0), ms + 400));
        setTimeout(() => { peeled = false; }, 9000);
      }, { threshold: 0.6 }).observe(btn);
    }
  }
})();
