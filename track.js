/* Counting taps, with no names: the site opened, a card turned over, a photo opened big. Each one
   is a tiny message to the same Google Sheet web app as the RSVPs (rsvp-sheet.gs), which keeps a
   count per thing in its "Clicks" tab: how many times, and how many different people (the first
   time on each phone or computer, remembered here). Only the real site counts, not a copy opened
   from the folder or a preview. Opening thebebs.com/?andy skips counting for that visit (that tab,
   reloads included); the next time the site is opened normally, it counts again. */

(() => {
  'use strict';

  // the Google Sheet's web app address (rsvp-sheet.gs → Deploy → Web app URL); form.js uses it too
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyjSOxS0cf_i81DfnbgtngDXsGvXllDQYPfuItirsosw607bYNGawUGGngX9ExBWKHT7Q/exec';
  window.SHEET_URL = SHEET_URL;

  // ?andy: don't count this visit (Andy's own look around); remembered only while this tab is open
  const NO = 'la-nocount';
  const q = new URLSearchParams(location.search);
  if (q.has('andy')) {
    try { sessionStorage.setItem(NO, '1'); } catch (e) {}
    q.delete('andy');
    const rest = q.toString();
    try { history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch (e) {}
  }
  let mine = false;
  try { mine = sessionStorage.getItem(NO) === '1'; } catch (e) {}
  const live = /(^|\.)thebebs\.com$/.test(location.hostname) && !mine;
  const SENT = 'la-counted';
  let sent = [];
  try { sent = JSON.parse(localStorage.getItem(SENT) || '[]'); } catch (e) {}
  if (!Array.isArray(sent)) sent = [];

  window.track = what => {
    if (!live || !what) return;
    const first = sent.indexOf(what) < 0;
    if (first) {
      sent.push(what);
      try { localStorage.setItem(SENT, JSON.stringify(sent)); } catch (e) {}
    }
    try {
      fetch(SHEET_URL, { method: 'POST', keepalive: true, body: new URLSearchParams({ event: what, first: first ? '1' : '0' }) })
        .catch(() => {});
    } catch (e) {}
  };

  window.track(window.TRACK_OPEN || 'Site opened');          // the arcade counts as "Opened: Arcade"
})();
