/* The arcade in English, Swedish or Spanish, the same language as the wedding site (it remembers the
   EN · SV · ES choice under 'la-lang'; otherwise the visitor's phone or computer decides).

   The English is the source: tr('Play again') gives it in the current language, from lang-sv.js or
   lang-es.js, where each English string maps to its translation. A key with {holes} is a pattern:
   'Welcome to {place}' turns 'Welcome to Stockholm' into the Swedish sentence, and whatever fills a
   hole is translated too (so 'Stockholm' can become 'Estocolmo'). tr(key, {place: …}) fills a key's
   holes directly. Anything without a translation stays in English.

   Elements in the page with data-tr (text) or data-tr-aria (aria-label) are translated on load. */

(() => {
  'use strict';
  const LANGS = ['en', 'sv', 'es'], KEY = 'la-lang';
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (LANGS.indexOf(lang) < 0) {
    lang = 'en';
    const prefs = navigator.languages || [navigator.language || 'en'];
    for (let i = 0; i < prefs.length; i++) {
      const p = String(prefs[i]).toLowerCase().slice(0, 2);
      if (LANGS.indexOf(p) >= 0) { lang = p; break; }
    }
  }
  document.documentElement.lang = lang;

  const dict = lang === 'sv' ? window.ARCADE_SV : lang === 'es' ? window.ARCADE_ES : null;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pats = [];
  if (dict) Object.keys(dict).forEach(k => {
    if (k.indexOf('{') < 0) return;
    const names = [];
    const re = esc(k).replace(/\\\{(\w+)\\\}/g, (_, n) => { names.push(n); return '(.+?)'; });
    pats.push({ re: new RegExp('^' + re + '$'), names, out: dict[k] });
  });
  // the longest patterns first, so 'Lonis said {answer} ✗ {quip}' wins over shorter ones
  pats.sort((a, b) => b.re.source.length - a.re.source.length);

  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, n) => (vars && vars[n] != null ? vars[n] : m));
  function tr(s, vars) {
    if (s == null) return s;
    s = String(s);
    if (vars) return fill(dict && dict[s] != null ? dict[s] : s, vars);
    if (!dict) return s;
    if (dict[s] != null) return dict[s];
    for (const p of pats) {
      const m = s.match(p.re);
      if (m) return p.out.replace(/\{(\w+)\}/g, (x, n) => { const i = p.names.indexOf(n); return i < 0 ? x : tr(m[i + 1]); });
    }
    return s;
  }
  window.tr = tr;
  window.arcadeLang = lang;

  // the page's own words
  document.querySelectorAll('[data-tr]').forEach(el => { el.textContent = tr(el.getAttribute('data-tr') || el.textContent.trim()); });
  document.querySelectorAll('[data-tr-aria]').forEach(el => { el.setAttribute('aria-label', tr(el.getAttribute('data-tr-aria'))); });
  document.title = tr('The Bebs Arcade') + ' · Lonis & Andrea';

  // the EN · SV · ES switch in the top bar: remembered for the whole site, then the arcade starts again in it
  document.querySelectorAll('.lang-mini button[data-lang]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    b.addEventListener('click', () => {
      if (b.dataset.lang === lang) return;
      try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) {}
      location.reload();
    });
  });
})();
