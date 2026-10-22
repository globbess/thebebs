/* Add to calendar: the button beside The Weekend (and the one in the RSVP card after a
   "yes") opens a short list of calendars.
   Each one adds all three days (Fri, Sat, Sun) from wedding.ics, as separate events.
   Apple Calendar and Outlook open the file; Google subscribes to it, so its link
   needs this site's own address (it works once the site is online). The list
   closes when you pick one, tap elsewhere, or press Escape. */

(() => {
  'use strict';
  const cals = document.querySelectorAll('.cal');
  if (!cals.length) return;
  const file = new URL('wedding.ics', location.href);

  cals.forEach(cal => {
    const google = cal.querySelector('.cal-google');
    if (google) {
      google.href = 'https://calendar.google.com/calendar/r?cid=' +
                    encodeURIComponent('webcal://' + file.host + file.pathname);
    }
    const close = () => { cal.open = false; };
    cal.querySelectorAll('.cal-menu a').forEach(a => a.addEventListener('click', () => setTimeout(close, 150)));
    document.addEventListener('click', e => { if (cal.open && !cal.contains(e.target)) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && cal.open) { e.stopPropagation(); close(); cal.querySelector('summary').focus(); }
    }, true);
  });
})();
