/* The story of us: the full story by default, and one button beside the heading
   that trims it down a step at a time — TL;DR, "Still too long?", the
   one-liner — and then comes back round to the full story. Big-text readers
   start on the TL;DR. */

(() => {
  'use strict';

  const story = document.getElementById('story');
  const next  = document.getElementById('story-next');
  if (!story || !next) return;

  const versions = Array.prototype.slice.call(story.querySelectorAll('.story-v'));
  const EN_LABEL = ['TL;DR', 'Still too long?', 'Okay, one liner', 'Full story'];   // what the button says under each version
  const label = n => (window.t ? window.t('story.next.' + n, EN_LABEL[n]) : EN_LABEL[n]);
  let stage = 0;

  function show(n) {
    const heading = story.parentElement.querySelector('h2');
    const before = heading ? heading.getBoundingClientRect().top : 0;

    story.classList.add('is-changing');
    setTimeout(() => {
      versions.forEach((v, i) => { v.hidden = i !== n; });
      stage = n;
      next.textContent = label(n);

      // keep the heading where it was on screen (or bring it into view near the top,
      // if it had scrolled away above), so nobody loses their place
      if (heading) {
        const target = Math.max(80, Math.min(before, window.innerHeight * 0.4));
        window.scrollBy({ top: heading.getBoundingClientRect().top - target, behavior: 'instant' });
      }
      story.classList.remove('is-changing');
      document.dispatchEvent(new Event('layoutchange'));   // the art re-checks where the words sit
    }, 180);
  }

  next.textContent = label(0);
  document.addEventListener('langchange', () => { next.textContent = label(stage); });

  // the hand-drawn "click me" arrow: drawn in when the story comes into view, gone after the first tap
  const nudge = document.querySelector('.nudge');
  if (nudge && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { nudge.classList.add('is-drawn'); io.disconnect(); }
    }, { threshold: 0.5, rootMargin: '0px 0px -15% 0px' });
    io.observe(next);
  } else if (nudge) nudge.classList.add('is-drawn');

  // keep the note on screen: if it would run off the right edge, put it on the left
  function placeNudge() {
    if (!nudge) return;
    nudge.classList.remove('is-flipped');
    const r = nudge.getBoundingClientRect();
    if (r.width && r.right > document.documentElement.clientWidth - 8) nudge.classList.add('is-flipped');
  }
  placeNudge();
  window.addEventListener('resize', placeNudge);
  document.addEventListener('langchange', placeNudge);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeNudge);

  let touched = false;
  next.addEventListener('click', () => {
    if (!touched && nudge) nudge.classList.add('is-done');
    touched = true;
    show((stage + 1) % versions.length);
  });

  // big text on a phone (layout.js): open on the TL;DR instead of the long story,
  // since the full one runs to several screens for them. Only before anyone has
  // tapped the button; the full story is still in the cycle.
  document.addEventListener('bigtext', () => {
    if (touched || stage !== 0 || versions.length < 2) return;
    versions.forEach((v, i) => { v.hidden = i !== 1; });
    stage = 1;
    next.textContent = label(1);
    document.dispatchEvent(new Event('layoutchange'));
  });
})();
