/* The countdown under the date: days, hours and minutes until the wedding day
   begins in Sweden. */

(() => {
  'use strict';

  const el = document.getElementById('countdown');
  if (!el) return;

  // the start of June 12, 2027 in Sweden (summer time, two hours ahead of UTC)
  const WEDDING = Date.UTC(2027, 5, 11, 22, 0, 0);
  const DAY = 86400000;

  const t = (k, en) => (window.t ? window.t(k, en) : en);
  const unit = (n, one, many) =>
    '<span class="cd-unit"><span class="cd-n">' + n + '</span> ' + (n === 1 ? one : many) + '</span>';

  function render() {
    const left = WEDDING - Date.now();
    if (left <= 0) {
      el.textContent = left > -DAY ? t('cd.today', 'It’s today!') : t('cd.married', 'Just married');
      return false;
    }
    const m = Math.ceil(left / 60000);                // whole minutes, rounded up so it never shows 0 too early
    el.innerHTML =
      unit(Math.floor(m / 1440), t('cd.day', 'day'), t('cd.days', 'days')) +
      unit(Math.floor(m / 60) % 24, t('cd.hour', 'hour'), t('cd.hours', 'hours')) +
      unit(m % 60, t('cd.minute', 'minute'), t('cd.minutes', 'minutes'));
    return true;
  }
  function tick() {
    if (render()) setTimeout(tick, 60000 - (Date.now() % 60000) + 50);   // tick on the minute
  }

  // screen readers get the gist once, rather than every second
  const label = () => el.setAttribute('aria-label', t('cd.label', 'Counting down to June 12, 2027'));
  label();
  tick();
  document.addEventListener('langchange', () => { label(); render(); });
})();
