/* Tap a photo or film on the back of a card to see it big, floating over the dot landscape,
   which glides to that photo's own moment of the day (data-scene: 0 morning … 1 night).
   The small embedded photo shows at once, and a sharper copy (photos/<name>.jpg, only loaded
   when asked for) takes its place as soon as it arrives. Tap anywhere, the ✕, or Escape to close,
   or push it away: drag (or scroll) it up or down and it follows, the sun and sky drifting along
   behind it (data-drag, art.js); let go far enough and it flies off, otherwise it settles back. */

(() => {
  'use strict';

  const box = document.querySelector('.lightbox');
  const figs = Array.prototype.slice.call(document.querySelectorAll('.face-back .polaroid'));
  if (!box || !figs.length) return;
  const frame = box.querySelector('.lb-photo');
  frame.tabIndex = -1;
  const t = (k, en) => (window.t ? window.t(k, en) : en);
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let from = null;
  // what each photo or film is called in the "Clicks" tab of the sheet (track.js)
  const NAMES = { prague: 'Prague', atitlan: 'Lake Atitlán', telaviv: 'Tel Aviv', tallinn: 'Tallinn', lonisKid: 'Lonis as a kid',
    andreaKid: 'Andrea as a kid', bloodline: 'Upside-down dot room', gondola: 'Gondola', roatan: 'Roatán', rosasBridge: 'Rösås bridge',
    rosasDog: 'Dog selfie', ramkvilla: 'Ramkvilla jetty', 'film:rosas': 'Rösås summer film', 'film:rosas-winter': 'Rösås winter film',
    'film:football': 'Sunday football film' };
  // a photo's key (its data-photo), or a film's ("film:" + its poster's name); the gallery's polaroids carry data-key
  const keyOf = fig => {
    if (fig.dataset.key) return fig.dataset.key;
    const img = fig.querySelector('img[data-photo]'), film = fig.querySelector('video');
    return img ? img.dataset.photo : film ? 'film:' + (film.getAttribute('poster') || '').replace(/\.jpg$/, '') : '';
  };
  const nameOf = fig => NAMES[keyOf(fig)] || keyOf(fig) || 'photo';

  function label() {
    figs.forEach(f => f.setAttribute('aria-label', t('lb.open', 'See it bigger')));
  }

  function open(fig) {
    from = fig;
    if (window.track) window.track('Opened: ' + nameOf(fig));
    if (window.foundPhotos) window.foundPhotos([keyOf(fig)]);       // the game (gallery.js)
    frame.textContent = '';
    const img = fig.querySelector('img'), film = fig.querySelector('video');
    if (fig.dataset.film) {
      // a film from the gallery: its polaroid shows the poster; here it plays
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.poster = fig.dataset.poster || '';
      v.style.setProperty('--ar', fig.dataset.ar || 16 / 9);
      v.setAttribute('aria-label', fig.dataset.cap || '');
      v.src = fig.dataset.film;
      if (still) v.controls = true; else v.autoplay = true;
      frame.appendChild(v);
      if (!still) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (img) {
      const big = document.createElement('img');
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      frame.appendChild(big);
      const name = img.dataset.photo;
      if (name) {
        const sharp = new Image();
        sharp.onload = () => { if (big.isConnected) big.src = sharp.src; };
        sharp.src = 'photos/' + name + '.jpg';
      }
    } else if (film) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.poster = film.poster;
      // its own shape from the start (a film has none until it has loaded)
      v.style.setProperty('--ar', film.videoWidth ? film.videoWidth / film.videoHeight : fig.classList.contains('polaroid-tall') ? 9 / 16 : 16 / 9);
      v.setAttribute('aria-label', film.getAttribute('aria-label') || '');
      const src = film.querySelector('source');
      v.src = src ? src.src : film.currentSrc;
      if (still) v.controls = true; else v.autoplay = true;
      frame.appendChild(v);
      if (!still) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    }
    const cap = fig.dataset.cap || (fig.querySelector('figcaption') || {}).textContent;
    if (cap) {
      const c = document.createElement('figcaption');
      c.textContent = cap;
      frame.appendChild(c);
    }
    // the dot landscape behind it glides to this photo's own moment of the day (art.js)
    if (fig.dataset.scene) box.dataset.scene = fig.dataset.scene; else delete box.dataset.scene;
    box.showModal();
    frame.focus({ preventScroll: true });   // not the ✕: it would light up with a focus ring
  }

  window.lightboxOpen = open;     // the gallery's polaroids open here too (gallery.js)

  figs.forEach(fig => {
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.addEventListener('click', () => open(fig));
    fig.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(fig); }
    });
  });

  /* ---------- push it away ---------- */
  const FAR = 110;                        // px: let go beyond this (or flick it) and it flies off
  let dy = 0, startY = 0, dragging = false, moved = false, lastY = 0, lastT = 0, speed = 0, wheelEnd = 0, leaving = false;

  function follow(y) {
    dy = y;
    frame.style.transition = 'none';
    frame.style.transform = 'translateY(' + dy + 'px) rotate(' + (-1 + dy * 0.012) + 'deg)';
    frame.style.opacity = String(1 - Math.min(Math.max(Math.abs(dy) - FAR, 0) / 900, 0.15));   // solid until it's nearly gone
    box.dataset.drag = (dy / window.innerHeight).toFixed(3);   // the sun and sky drift along (art.js)
  }
  function settle() {
    frame.style.transition = 'transform .45s cubic-bezier(.2,1.4,.4,1), opacity .3s ease';
    frame.style.transform = '';
    frame.style.opacity = '';
    dy = 0;
    delete box.dataset.drag;
  }
  function flyOff(dir) {
    leaving = true;
    frame.style.transition = 'transform .32s ease-in, opacity .32s ease-in';
    frame.style.transform = 'translateY(' + dir * window.innerHeight + 'px) rotate(' + dir * 8 + 'deg)';
    frame.style.opacity = '0';
    setTimeout(() => box.close(), 300);
  }
  function release() {
    if (leaving) return;
    if (Math.abs(dy) > FAR || Math.abs(speed) > 0.7) flyOff(dy < 0 || (dy === 0 && speed < 0) ? -1 : 1);
    else settle();
  }

  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.lb-close') || leaving) return;
    dragging = true; moved = false; startY = lastY = e.clientY; lastT = e.timeStamp; speed = 0;
  });
  box.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (Math.abs(e.clientY - startY) > 6) moved = true;
    if (!moved) return;
    const dt = Math.max(1, e.timeStamp - lastT);
    speed = (e.clientY - lastY) / dt; lastY = e.clientY; lastT = e.timeStamp;
    follow(e.clientY - startY);
  });
  const up = () => { if (!dragging) return; dragging = false; if (moved) release(); };
  box.addEventListener('pointerup', up);
  box.addEventListener('pointercancel', up);
  // a mouse wheel or trackpad: scrolling pushes it the same way
  box.addEventListener('wheel', e => {
    e.preventDefault();
    if (leaving) return;
    moved = true; speed = 0;
    follow(Math.max(-400, Math.min(400, dy - e.deltaY * 0.6)));
    clearTimeout(wheelEnd);
    wheelEnd = setTimeout(release, 160);
  }, { passive: false });

  // a tap anywhere closes it (the photo too: there's nothing else to do in here), but not the end of a drag
  box.addEventListener('click', () => {
    if (moved) { moved = false; return; }
    box.close();
  });
  box.addEventListener('close', () => {
    const v = frame.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    frame.textContent = '';
    frame.style.transition = frame.style.transform = frame.style.opacity = '';
    dy = 0; dragging = moved = leaving = false;
    delete box.dataset.drag;
    if (from) from.focus();
  });

  document.addEventListener('langchange', label);
  label();
})();
