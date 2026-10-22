/* Layout helpers for phones.

   Headings with a button beside them (TL;DR, Open in maps, Add to calendar).
   A long heading folds onto two lines so its button can stay beside it. Only
   when even one word of the heading can't fit next to the button (very big
   text on a phone) does the button drop underneath, instead of covering it. */

(() => {
  'use strict';
  const rows = Array.prototype.slice.call(document.querySelectorAll('.head-row'));
  if (!rows.length) return;

  function fit() {
    rows.forEach(row => {
      row.classList.remove('is-stacked');
      const h = row.querySelector('h2');
      if (h && h.scrollWidth > h.clientWidth + 1) row.classList.add('is-stacked');
    });
  }

  /* Big text: when someone's phone shows the letters big (an accessibility
     setting, or a small screen), each block of words fills most of the screen
     and the art behind it barely gets a look in. So in that case each section
     gets extra space above and below, giving a pause of pure landscape between
     one block of words and the next. It's measured on a real paragraph: how
     many letters fit on a line (normal phones fit about 31 to 37, bigger text
     27 or fewer), so it works however the letters got big. */
  const BIG_BELOW = 29;
  function bigText() {
    const ps = document.querySelectorAll('.sec:not(.hero) p');
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k];
      if (!p.offsetParent || p.textContent.length < 120) continue;
      const range = document.createRange();
      range.selectNodeContents(p);
      const lines = new Set();
      const rects = range.getClientRects();
      for (let q = 0; q < rects.length; q++) if (rects[q].width > 2) lines.add(Math.round(rects[q].top));
      if (!lines.size) continue;
      const perLine = p.textContent.length / lines.size;
      const big = perLine < BIG_BELOW;
      const was = document.documentElement.classList.contains('big-text');
      document.documentElement.classList.toggle('big-text', big);
      if (big && !was) document.dispatchEvent(new Event('bigtext'));   // e.g. the story starts on its TL;DR
      showCheck(big, perLine);
      return;
    }
  }

  // add #check to the link to see whether big-text mode is on, and why
  let badge = null;
  function showCheck(big, perLine) {
    if (location.hash !== '#check') return;
    if (!badge) { badge = document.createElement('div'); badge.className = 'check-badge'; document.body.appendChild(badge); }
    badge.textContent = 'Big text: ' + (big ? 'ON' : 'off') + ' · ' + perLine.toFixed(1) +
                        ' letters per line (on below ' + BIG_BELOW + ') · screen ' + window.innerWidth + 'px wide';
  }

  /* The travel groups (International, Locals, Places to stay) glide open and
     closed instead of snapping: the group's height eases to its new size while
     what's inside fades and slides in (or out), so the rest of the page moves
     smoothly with it. People who prefer less motion keep the instant version. */
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN_MS = 460, CLOSE_MS = 340, EASE = 'cubic-bezier(.22, .61, .36, 1)';
  document.querySelectorAll('.acc').forEach(d => {
    const summary = d.querySelector('summary');
    if (!summary || still || !d.animate) return;
    let running = null;
    summary.addEventListener('click', e => {
      e.preventDefault();
      const inside = d.querySelector(':scope > :not(summary)');
      const from = d.getBoundingClientRect().height;
      if (running) { running.cancel(); running = null; }
      if (inside) inside.getAnimations().forEach(a => a.cancel());
      const opening = !d.open || d.classList.contains('is-closing');
      d.classList.remove('is-closing');
      if (opening) d.open = true; else d.classList.add('is-closing');
      const borders = d.offsetHeight - d.clientHeight;
      const to = opening ? d.getBoundingClientRect().height : summary.offsetHeight + borders;
      const ms = opening ? OPEN_MS : CLOSE_MS;
      d.style.overflow = 'hidden';
      running = d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: ms, easing: EASE });
      if (inside) {
        inside.animate(opening
          ? [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }]
          : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }],
          { duration: opening ? ms : ms * 0.75, easing: EASE, fill: opening ? 'none' : 'forwards' });
      }
      const done = running;
      running.onfinish = () => {
        if (done !== running) return;
        if (!opening) {
          d.open = false;
          d.classList.remove('is-closing');
          if (inside) inside.getAnimations().forEach(a => a.cancel());
        }
        d.style.overflow = '';
        running = null;
      };
    });
  });

  function update() { fit(); bigText(); }
  update();
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  document.addEventListener('layoutchange', fit);   // e.g. the story button changing its label
})();
