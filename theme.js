/* Light or dark. The page starts in the guest's own choice if they've made one,
   otherwise in their phone's setting (a tiny script in index.html's <head> does that
   before anything draws). The round button at the top right switches, and the choice
   is remembered. Light mode is the same landscape printed as coloured dots on cream
   paper, with black letters and deep-red accents. art.js and dance.js listen for
   'themechange' to redraw. */

(() => {
  'use strict';

  const root = document.documentElement;
  const btn = document.getElementById('theme-btn');
  const t = (k, en) => (window.t ? window.t(k, en) : en);
  const isLight = () => root.classList.contains('light');

  function label() {
    if (!btn) return;
    btn.setAttribute('aria-label', isLight() ? t('theme.toDark', 'Switch to dark mode') : t('theme.toLight', 'Switch to light mode'));
  }

  function set(light, remember) {
    root.classList.toggle('light', light);
    if (remember) { try { localStorage.setItem('la-theme', light ? 'light' : 'dark'); } catch (e) {} }
    label();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { light: light } }));
  }

  if (btn) btn.addEventListener('click', () => set(!isLight(), true));

  // until the guest picks, follow the phone if it switches (e.g. at sunset)
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const follow = e => {
      let chosen = null;
      try { chosen = localStorage.getItem('la-theme'); } catch (err) {}
      if (!chosen) set(e.matches, false);
    };
    if (mq.addEventListener) mq.addEventListener('change', follow);
  }

  document.addEventListener('langchange', label);
  label();
})();
