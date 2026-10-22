/* Opens the RSVP card, and sends the answers in the background (the page never
   navigates away) to a Google Sheet, through the small script in rsvp-sheet.gs.

   The answer is remembered on this device, so coming back to the RSVP shows it with a
   way to change it: cancel a yes, or turn a no into a yes. A change is simply sent again
   with the same email; the sheet treats the latest answer per email as the real one. */

(() => {
  'use strict';

  /* ---------- the RSVP card opens on top of the page ---------- */

  const card    = document.getElementById('rsvp');
  const openers = document.querySelectorAll('.rsvp-open');      // one on the first screen, one at the end
  let lastOpener = null;

  // the answer this device sent last time (name, email, yes/no and the rest)
  const KEY = 'la-rsvp';
  const mine = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const remember = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };

  if (card && openers.length) {
    openers.forEach(b => b.addEventListener('click', () => {
      lastOpener = b;
      card.showModal();
      if (mine()) { showMine(); return; }
      const first = card.querySelector('input:not([type=hidden]):not([name=bot-field])');
      if (first) first.focus();
    }));
    card.querySelector('.rsvp-close').addEventListener('click', () => card.close());
    // a click outside the card (on the dimmed page) closes it too
    card.addEventListener('click', e => { if (e.target === card) card.close(); });
    card.addEventListener('close', () => { if (lastOpener) lastOpener.focus(); });
  }

  /* ---------- sending ---------- */

  // the Google Sheet's web app address (rsvp-sheet.gs → Deploy → Web app URL)
  const RSVP_URL = window.SHEET_URL || 'https://script.google.com/macros/s/AKfycbyjSOxS0cf_i81DfnbgtngDXsGvXllDQYPfuItirsosw607bYNGawUGGngX9ExBWKHT7Q/exec';   // set in track.js

  /* ---------- the live head count above the RSVP button ----------
     Asks the sheet how many people have said yes (it adds up "How many" on every
     yes; no names ever leave the sheet), when the last section comes into view
     and again right after someone RSVPs. Hidden if the sheet can't be reached. */
  const tt = (k, en) => (window.t ? window.t(k, en) : en);
  const hc = document.querySelector('.headcount');
  let coming = null;
  function showCount() {
    if (!hc || coming === null) return;
    const n = '<span class="hc-n">' + coming + '</span>';
    const line = coming === 0 ? tt('rsvp.countZero', 'Be the first to join the fun!')
               : coming === 1 ? tt('rsvp.countOne', '{n} is joining the fun!')
               : tt('rsvp.countMany', '{n} are joining the fun!');
    hc.querySelector('.hc-text').innerHTML = line.replace('{n}', n);
    hc.hidden = false;
  }
  function loadCount() {
    if (!hc || !RSVP_URL) return;
    fetch(RSVP_URL, { method: 'GET' })
      .then(r => r.json())
      .then(d => { if (d && typeof d.coming === 'number') { coming = d.coming; showCount(); } })
      .catch(() => {});
  }
  if (hc) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { loadCount(); io.disconnect(); } }, { rootMargin: '0px 0px 300px 0px' });
      io.observe(hc.parentNode);
    } else loadCount();
    document.addEventListener('langchange', showCount);
  }

  const form = document.querySelector('form.contact');   // the RSVP form
  if (!form) return;
  const status = form.querySelector('.form-status');

  const t = (k, en) => (window.t ? window.t(k, en) : en);

  // after sending: the card swaps the form for a little party (yes) or a soft landing (no);
  // the next time it's opened, it's the form again
  function showDone(yes) {
    if (!card) return;
    card.classList.add('is-done');
    card.querySelector('.rsvp-yes').hidden = !yes;
    card.querySelector('.rsvp-no').hidden = yes;
    card.scrollTop = 0;
  }
  if (card) card.addEventListener('close', () => {
    if (card.open) return;   // already opened again before this arrived
    card.classList.remove('is-done', 'is-mine');
    card.querySelectorAll('.rsvp-done').forEach(el => { el.hidden = true; });
    if (mineBox) mineBox.hidden = true;
  });

  /* ---------- coming back: your answer, and changing it ---------- */
  const mineBox = card && card.querySelector('.rsvp-mine');
  const FIELDS = ['name', 'email', 'attending', 'guests', 'dietary', 'song', 'message'];

  function showMine() {
    const m = mine();
    if (!mineBox || !m) return;
    card.classList.remove('is-done');
    card.classList.add('is-mine');
    mineBox.hidden = false;
    mineBox.classList.toggle('is-yes', m.attending === 'yes');
    mineBox.classList.toggle('is-no', m.attending !== 'yes');
    mineBox.classList.remove('is-sure');
    mineBox.querySelector('.mine-sure').hidden = true;
    mineBox.querySelector('.mine-status').textContent = '';
    const who = mineBox.querySelector('.mine-who');
    who.textContent = t('mine.as', 'Answered as {name}').replace('{name}', m.name || m.email || '');
    card.scrollTop = 0;
  }

  // back to the form, filled in with what was sent before (and yes, if they're coming after all)
  function editMine(attending) {
    const m = mine() || {};
    FIELDS.forEach(f => { if (form.elements[f] && m[f] !== undefined) form.elements[f].value = m[f]; });
    if (attending) form.elements.attending.value = attending;
    if (!(+form.elements.guests.value > 0)) form.elements.guests.value = 1;
    card.classList.remove('is-mine');
    mineBox.hidden = true;
    card.scrollTop = 0;
    const first = form.querySelector('select[name=attending]');
    if (first) first.focus();
  }

  if (mineBox) {
    mineBox.querySelector('.mine-change').addEventListener('click', () => editMine(''));
    mineBox.querySelector('.mine-come').addEventListener('click', () => editMine('yes'));
    // cancelling asks once more, right here in the card
    mineBox.querySelector('.mine-cancel').addEventListener('click', () => {
      mineBox.classList.add('is-sure');
      mineBox.querySelector('.mine-sure').hidden = false;
      mineBox.querySelector('.mine-cancel-no').focus();
    });
    mineBox.querySelector('.mine-cancel-no').addEventListener('click', () => {
      mineBox.classList.remove('is-sure');
      mineBox.querySelector('.mine-sure').hidden = true;
    });
    mineBox.querySelector('.mine-cancel-yes').addEventListener('click', async e => {
      const btn = e.currentTarget, st = mineBox.querySelector('.mine-status');
      const m = Object.assign({}, mine(), { attending: 'no' });
      btn.disabled = true;
      st.className = 'form-status mine-status'; st.textContent = t('form.sending', 'Sending…');
      try {
        await send(m);
        remember(m);
        st.textContent = '';
        mineBox.hidden = true;
        card.classList.remove('is-mine');
        showDone(false);
        setTimeout(loadCount, 1500);                 // the head count goes down
      } catch (err) {
        st.className = 'form-status mine-status is-bad';
        st.textContent = t('form.failed', 'That didn’t go through. Try again, or just message us.');
      }
      btn.disabled = false;
    });
  }

  // one answer to the sheet; resolves when it's in
  async function send(answer) {
    const data = new URLSearchParams();
    FIELDS.forEach(f => data.set(f, answer[f] === undefined ? '' : String(answer[f])));
    data.set('language', window.siteLang ? window.siteLang() : 'en');
    const res = await fetch(RSVP_URL, { method: 'POST', body: data });
    if (!res.ok) throw new Error(res.status);
    const out = await res.json().catch(() => ({ ok: true }));
    if (out && out.ok === false) throw new Error('rejected');
  }

  function say(msg, kind) {
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    if (!RSVP_URL) { say(t('form.soon', 'RSVPs open very soon. Please try again in a little while.'), 'bad'); return; }
    const data = new FormData(form);
    data.set('language', window.siteLang ? window.siteLang() : 'en');
    const body = new URLSearchParams(data);

    button.disabled = true;
    say(t('form.sending', 'Sending…'));

    try {
      // a plain form post (no custom headers), which Google's web apps accept from any site
      const res = await fetch(RSVP_URL, { method: 'POST', body: body });
      if (!res.ok) throw new Error(res.status);
      const out = await res.json().catch(() => ({ ok: true }));
      if (out && out.ok === false) throw new Error('rejected');
      const yes = data.get('attending') === 'yes';
      const answer = {};
      FIELDS.forEach(f => { answer[f] = data.get(f) || ''; });
      remember(answer);                              // so coming back shows it, with a way to change it
      form.reset();
      say('');
      button.disabled = false;
      showDone(yes);
      if (yes && window.rsvpYesParty) window.rsvpYesParty();   // the moon becomes the disco ball
      setTimeout(loadCount, 1500);                   // the head count goes up
    } catch (err) {
      // the network failed, or the sheet didn't answer
      say(t('form.failed', 'That didn’t go through. Try again, or just message us.'), 'bad');
      button.disabled = false;
    }
  });
})();
