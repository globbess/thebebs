/* Music: a play/pause button in the corner, and beside it a small button that
   opens the list of songs, so guests can pick the one they want (or none).
   Hover the play button to see what's on. A chosen song plays from the start
   and stops when it ends.

   Each song plays through an official embedded player, kept tucked out of
   sight. SoundCloud songs play in full for everyone; Spotify gives people who
   aren't logged in a 30-second clip. Nothing is loaded from either until
   someone reaches for the buttons. */

(() => {
  'use strict';

  // sc: an official SoundCloud page (full song for everyone) — or uri: a Spotify track
  const TRACKS = [
    { sc:  'https://soundcloud.com/kanyewest/bound-2', title: 'Bound 2',                        artist: 'Kanye West' },
    { uri: 'spotify:track:6rPO02ozF3bM7NnOV4h6s2',     title: 'Despacito (Remix)',              artist: 'Luis Fonsi, Daddy Yankee & Justin Bieber' },
    { uri: 'spotify:track:5f3fZaZnUSnyNj1ZEkze32',     title: 'I’m in the Market for You', artist: 'Archie Semple' },
    { uri: 'spotify:track:3DZ11M7LSpVQzYHnFx3i95',     title: 'You Make Me Feel Like Dancing', artist: 'Leo Sayer' }
  ];

  const root   = document.getElementById('music');
  const play   = document.getElementById('music-play');
  const pick   = document.getElementById('music-list');
  const menu   = document.getElementById('music-menu');
  const tip    = document.getElementById('music-tip');
  const card   = document.getElementById('music-card');
  const shut   = document.getElementById('music-card-close');
  const hint   = document.getElementById('music-card-hint');
  const spSlot = document.getElementById('spotify');
  const scSlot = document.getElementById('soundcloud');
  if (!root || !play || !pick || !menu || !tip || !card || !shut || !hint || !spSlot || !scSlot) return;

  const tr = (k, en) => (window.t ? window.t(k, en) : en);

  let idx = 0;
  let playing = false;
  let wantPlay = false;          // the visitor asked for music
  let fresh = true;              // the current song should start from the top
  let tipTimer = 0, fallbackTimer = 0;

  const now = () => TRACKS[idx];
  const onSC = () => !!now().sc;

  /* ---------- the buttons and the list ---------- */

  // each row: the song (tap to play it from the start) and a credit link to where it streams from
  const items = TRACKS.map((t, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'm-pick';
    b.dataset.i = i;
    b.innerHTML = '<span class="m-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
                  '<span class="m-text"><span class="m-title"></span><span class="m-artist"></span></span>';
    b.querySelector('.m-title').textContent = t.title;
    b.querySelector('.m-artist').textContent = t.artist;
    b.addEventListener('click', () => { closeMenu(); choose(i); });

    const a = document.createElement('a');
    a.className = 'm-src';
    a.href = t.sc || 'https://open.spotify.com/track/' + t.uri.split(':').pop();
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = t.sc ? 'SoundCloud' : 'Spotify';
    a.dataset.i = i;

    li.append(b, a);
    menu.appendChild(li);
    return b;
  });

  function label() {
    const t = now();
    tip.textContent = t.title + ' · ' + t.artist;
    play.setAttribute('aria-label', (playing ? tr('music.pause', 'Pause') : tr('music.play', 'Play')) + ' ' + t.title + ' ' + tr('music.by', 'by') + ' ' + t.artist);
    items.forEach((b, i) => b.setAttribute('aria-label', tr('music.play', 'Play') + ' ' + TRACKS[i].title + ' ' + tr('music.by', 'by') + ' ' + TRACKS[i].artist));
    menu.querySelectorAll('.m-src').forEach(a => { const s = TRACKS[a.dataset.i]; a.setAttribute('aria-label', s.title + ' ' + tr('music.on', 'on') + ' ' + a.textContent + ' ' + tr('music.newTab', '(opens in a new tab)')); });
    items.forEach((b, i) => {
      b.setAttribute('aria-current', i === idx ? 'true' : 'false');
      b.classList.toggle('is-current', i === idx);
      b.classList.toggle('is-playing', i === idx && playing);
    });
  }

  // phones can't hover, so the name shows for a moment whenever a song starts
  function flashTip() {
    root.classList.add('show-tip');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => root.classList.remove('show-tip'), 2800);
  }

  function setPlaying(on) {
    playing = on;
    root.classList.toggle('is-playing', on);
    play.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { card.classList.remove('is-open'); clearTimeout(fallbackTimer); }
    label();
  }

  function openMenu() {
    preload();
    menu.hidden = false;
    pick.setAttribute('aria-expanded', 'true');
    root.classList.add('menu-open');
    items[idx].focus({ preventScroll: true });
  }
  function closeMenu() {
    menu.hidden = true;
    pick.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
  }

  // show the real player, so the guest can press play on it
  function showPlayer(text) {
    hint.textContent = text;
    card.dataset.player = onSC() ? 'soundcloud' : 'spotify';
    card.classList.add('is-open');
  }

  // if a browser won't start the song from our button, show the real player so they can press play there
  function armFallback() {
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (!wantPlay || playing) return;
      showPlayer(tr('music.tapStart', 'Tap \u25b6 to start'));
    }, 2600);
  }

  /* ---------- SoundCloud ---------- */

  let sc = null, scReady = false, scLoading = false, scUrl = null, scThen = null;

  function withSC(then) {
    if (scReady) { then(); return; }
    scThen = then;
    if (scLoading) return;
    scLoading = true;
    const s = document.createElement('script');
    s.src = 'https://w.soundcloud.com/player/api.js';
    s.onload = () => {
      scUrl = (now().sc || TRACKS.find(t => t.sc).sc);
      const f = document.createElement('iframe');
      f.title = 'SoundCloud player';
      f.allow = 'autoplay; encrypted-media';       // label songs on SoundCloud are copy-protected
      // SoundCloud's slim 20px player, with its play button in the site's lime
      f.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(scUrl) +
              '&auto_play=false&visual=false&show_comments=false&hide_related=true&show_teaser=false' +
              '&show_artwork=false&color=%238fd62f&inverse=true';
      scSlot.appendChild(f);
      sc = SC.Widget(f);
      const E = SC.Widget.Events;
      sc.bind(E.READY,  () => { scReady = true; const t = scThen; scThen = null; if (t) t(); });
      sc.bind(E.PLAY,   () => { scTapped = true; if (onSC()) setPlaying(true); });
      sc.bind(E.PAUSE,  () => { if (onSC()) setPlaying(false); });
      sc.bind(E.FINISH, () => { if (onSC()) finished(); });
    };
    document.head.appendChild(s);
  }

  // SoundCloud won't start its copy-protected songs (like Bound 2) from anyone else's
  // button, so its own player comes straight up with a nudge to tap play. Once a
  // guest has tapped it, later plays and pauses work from our button as normal.
  let scTapped = false;

  function playSC() {
    if (!scTapped) showPlayer(tr('music.tapFull', 'Tap \u25b6 for the full song'));
    withSC(() => {
      if (scUrl !== now().sc) {                     // a different SoundCloud song
        scUrl = now().sc;
        sc.load(scUrl, { auto_play: true, visual: false, show_comments: false, hide_related: true, show_artwork: false, color: '8fd62f', inverse: true });
      } else {
        if (fresh) sc.seekTo(0);
        sc.play();                                  // works for ordinary songs, and after the first tap
      }
      fresh = false;
      if (scTapped) armFallback();
    });
  }

  /* ---------- Spotify ---------- */

  let sp = null, spLoading = false, spPending = false, lastPos = 0, ending = false;

  // asks Spotify to play; safe to call more than once, it stops asking once the song is going
  function spStart() {
    if (!sp || !spPending || playing) return;
    sp.play();
    armFallback();
  }

  function spUpdate(e) {
    if (onSC()) return;
    const d = e.data;
    setPlaying(!d.isPaused);
    if (!d.isPaused) { lastPos = d.position; spPending = false; }
    const ended = d.duration > 0 && (d.position >= d.duration - 400 || (d.isPaused && lastPos >= d.duration - 1500));
    if (ended && wantPlay && !ending) {
      ending = true;
      setTimeout(() => { ending = false; }, 3000);
      finished();
    }
  }

  function playSpotify() {
    spPending = true;
    if (!sp) {
      fresh = false;                                // the player is created on this song
      if (spLoading) return;
      spLoading = true;
      window.onSpotifyIframeApiReady = IFrameAPI => {
        IFrameAPI.createController(spSlot, { uri: now().uri, width: '100%', height: 80 }, c => {
          sp = c;
          c.addListener('ready', spStart);
          c.addListener('playback_update', spUpdate);
          // 'ready' can fire before we're listening, so ask again shortly after, just in case
          setTimeout(spStart, 700);
          setTimeout(spStart, 1800);
        });
      };
      const s = document.createElement('script');
      s.src = 'https://open.spotify.com/embed/iframe-api/v1';
      s.async = true;
      document.head.appendChild(s);
      return;
    }
    if (fresh) {
      fresh = false;
      lastPos = 0;
      sp.loadUri(now().uri);
      setTimeout(spStart, 900);                     // in case 'ready' doesn't fire for a swapped song
    } else {
      spStart();
    }
  }

  /* ---------- together ---------- */

  function pauseAll() {
    spPending = false;
    if (sc && scReady) sc.pause();
    if (sp) sp.pause();
  }

  function playCurrent() {
    wantPlay = true;
    if (onSC()) { if (sp) sp.pause(); playSC(); }
    else        { if (sc && scReady) sc.pause(); playSpotify(); }
  }

  // a song from the list: always from the beginning
  function choose(i) {
    pauseAll();
    setPlaying(false);                              // the old song's 'paused' signal may never reach us
    idx = i;
    fresh = true;
    label();
    flashTip();
    playCurrent();
  }

  // when the chosen song ends, the music simply stops
  function finished() {
    wantPlay = false;
    fresh = true;
    setPlaying(false);
  }

  // warm up the first song's player as soon as someone reaches for the buttons, so play is instant
  function preload() { if (onSC()) withSC(() => {}); }
  ['pointerenter', 'touchstart', 'focusin'].forEach(ev => root.addEventListener(ev, preload, { passive: true, once: true }));

  play.addEventListener('click', () => {
    closeMenu();
    if (playing) { wantPlay = false; pauseAll(); return; }
    flashTip();
    playCurrent();
  });

  pick.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  document.addEventListener('click', e => { if (!menu.hidden && !root.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); pick.focus(); } });
  shut.addEventListener('click', () => card.classList.remove('is-open'));

  label();
  document.addEventListener('langchange', label);
})();
