# Lonis & Andrea — June 2027

The wedding site. A single scrolling page that opens on a photo of the two of
you, redrawn in fine halftone dots. As you scroll it coarsens into bigger
dots, loosens into drifting dust, and becomes a landscape — violet night into
dawn, midday, golden hour and a long Swedish summer dusk.

Three files of content, no build step, no frameworks.

| File | What it is |
|---|---|
| `index.html` | All the words on the page |
| `style.css` | Colours, type, spacing |
| `art.js` | The dot landscape |
| `form.js` | Sends the RSVP without reloading the page |
| `story.js` | The TL;DR buttons on the story |
| `countdown.js` | The countdown under the date |
| `music.js` | The music button and Spotify player |
| `photo.jpg` | The opening photograph |
| `photo.js` | The same photo, embedded — see below |

> This replaces the earlier sage/ivory version at
> `~/Documents/lonis-andrea-wedding`. That folder is still there, untouched,
> if you ever want to look back at it.

## Looking at it

Double-click `index.html`. That's it — it opens in your browser.

## The opening photo

The first screen is `photo.jpg`, redrawn in dots and recoloured into the site's
palette. On a wide screen it sits on the right with the names beside it; on a
phone it fills the screen and the names sit low, under your faces.

`photo.js` holds the same image embedded as text. That's what lets the dots
read it when you open `index.html` straight from the folder — browsers won't
let a page read pixels from a loose image file on your disk. **If you change
the photo, ask Claude to regenerate `photo.js`**, or the old one will keep
showing.

If the photo is ever missing, the page simply opens on the bare violet field.

## Music

Two small buttons sit in the top-right corner: **play/pause**, and a **song
list** beside it. Guests open the list and pick the song they want (or none).
A chosen song plays from the beginning and stops when it ends. Hovering the
play button shows what's on; on phones the name pops up for a moment when a
song starts.

| Song | Plays from | For guests |
|---|---|---|
| **Bound 2** — Kanye West | Kanye West's official SoundCloud | The whole song, from the start |
| **Despacito (Remix)** — Luis Fonsi, Daddy Yankee & Justin Bieber | Spotify | A 30-second clip, unless logged in to Spotify |
| **I'm in the Market for You** — Archie Semple | Spotify | A 30-second clip, unless logged in to Spotify |
| **You Make Me Feel Like Dancing** — Leo Sayer | Spotify | A 30-second clip, unless logged in to Spotify |

The players themselves stay tucked out of sight. Each song in the list
credits where it streams from with a link, as SoundCloud asks. Nothing is
loaded from SoundCloud or Spotify until someone reaches for the buttons. If a
browser won't start a song from the button, the real player appears so they
can press play there.

Things to know:

- **Bound 2 takes two taps.** SoundCloud sends it as copy-protected audio and
  won't start protected songs from anyone else's button. So pressing play (or
  picking Bound 2) brings up SoundCloud's own slim player straight away —
  "Tap ▶ for the full song" — and one tap on its lime ▶ starts the whole song
  from the beginning. The player then tucks away, and later pauses and plays
  work from the site's own button.
- **Bound 2 won't play in the little preview window inside the Claude app**,
  which can't decode protected audio. Normal Chrome, Safari, Firefox and Edge
  all can.
- **SoundCloud may play a short audio ad** before a song for some guests.
- **Spotify's 30-second clips are chosen by Spotify**, not the site.
- **Browsers never let music start on its own**, so someone has to press play.
- The songs aren't stored on the site — putting the audio files on a public
  page would be copyright infringement. The list lives in `music.js`
  (`TRACKS`): `sc:` for a SoundCloud page, `uri:` for a Spotify track.

## The story of us

The full story shows by default. One button beside the heading trims it down a
step at a time — **TL;DR**, then **Still too long?**, then **Okay, one liner**
(the emoji version) — and then says **Full story** and brings the long one back. On phones with big
text the story opens on the TL;DR instead (layout.js spots big text). All four
versions are in `index.html` under `<div class="story">`; the button labels
are in `story.js`.

The flag emoji (🇸🇪 🇭🇳) show as flags on phones and Macs. Windows doesn't
draw flag emoji, so Windows visitors see the letters SE and HN instead.

## Easter eggs

- **The heart and the sun.** Around the schedule, a blush-pink heart-shaped
  cloud drifts up into the sun. The moment they touch, the sun turns into a
  spinning mirror ball on a string and throws coloured light over everything
  for about four seconds. While the heart is in the sky, tapping the sun
  switches it on — and it stays on until you tap it again. (`HEART_MEET` near the top of `art.js` sets where they
  meet — a number between 0 and 1 for how far down the page.)
- **Hover over RSVP.** On a computer, resting the mouse on the RSVP button at
  the end turns the moon into the disco ball to celebrate, for exactly as long
  as the mouse stays there.
- **Tap the moon.** At night the moon is just the moon, with its light on the
  water. Tap it and it swells into the same mirror ball as the sun and throws
  coloured light everywhere. It's a switch: it keeps going until you tap the
  moon again.
- **Heart bubbles.** Once the landscape has fully formed, every 40–60 seconds —
  or wherever someone taps the water — three little pixel hearts bubble up out
  of the water and float off.

The two never overlap: after either one, everything stays quiet for at least
12 seconds.

The timing lives near the top of `art.js` (`DISCO_LEN`, `HEART_MEET`,
`nextHearts`). Anyone who opens the browser console can also type `disco()` or
`hearts()`.

## The sections

1. **Hero** — the names, the date, the place
2. **Our story** — how you met
3. **The day** — venue intro, when/where/dress, the Honduras note, and an "Open in maps" button beside the heading
4. **The weekend** — Friday welcome dinner, Saturday wedding, Sunday brunch, swim & football, with an
   "Add to calendar" button beside the heading. Every option adds the three days as three separate events
   from `wedding.ics`: Apple Calendar and Outlook open the file; Google Calendar subscribes to it (shown
   as a small "Lonis & Andrea" calendar), which only works once the site is online, since Google fetches
   the file from the site's address. Subscribers get changes to `wedding.ics` automatically.
5. **Getting there** — three groups that open and close: International and Locals (each with
   by air / by train / by car), and Places to stay
6. **RSVP** — a button that opens the form as a card on top of the page

## What still needs filling in

Every block that needs you is marked `<!-- EDIT ME -->` in `index.html`, and
anything with a dashed underline on the page itself is a placeholder:

- **The wedding-day time.** The day section says "Time to be announced", and the
  calendar entry's notes say the same. Once the time is set, update the notes in
  `wedding.ics` (and raise `SEQUENCE`) and in the Google Calendar link in `index.html`.
- **Travel.** Times are checked on Google Maps (driving from Bäckaby) and train
  planners in Oct 2026. Still open: parking at Rösås. Note that Google Maps
  doesn't know "Rösås", so "Open in maps" lands on Bäckaby village. Swap in a
  dropped-pin link or the exact address when you have it.

## Languages

English, Swedish and Spanish, with a small EN · SV · ES switch in the top-left
corner. The site opens in the visitor's own language if their phone or computer
is set to Swedish or Spanish (otherwise English) and remembers what they pick.

- The English is what's written in `index.html`. Every piece of text has a key
  (`data-i18n="…"`); the Swedish and Spanish for each key live in `i18n.js`.
- To change a sentence: change it in `index.html` **and** in both dictionaries
  in `i18n.js`. A key missing from a dictionary simply shows the English.
- Spanish is Latin American with Honduran touches (catracha, colocho, carro,
  grama, carnita asada); Swedish uses OSA for RSVP. Worth a read-through by Lonis
  (Swedish) and Andrea (Spanish), especially the jokes in the story.
- Not translated: the calendar entries in `wedding.ics` (English).

## Light and dark

- The round sun/moon button beside EN · SV · ES switches between dark mode (the
  night-time look, "more us") and light mode (slightly more traditional). Guests
  start in whatever their phone is set to, and the site remembers their choice.
- Only the colours change; the layout is exactly the same (theme.js, plus the
  `html.light` colours at the end of style.css).
- Light mode's art (art.js, look for `LIGHT`): the same landscape in brighter,
  wilder colours with a photo-like texture, the sea photo of the two of us on the
  first screen (photo-light.js), white beside the photo, a soft blush below, and
  a real black night on the last page with a lilac card behind the words.

## Where it lives

- **thebebs.com**, served by GitHub Pages from the public repository
  github.com/globbess/thebebs. The domain is registered at Cloudflare, whose DNS
  points thebebs.com (and www) at GitHub (`globbess.github.io`, "DNS only").
- The site is **unlisted**: a `noindex` tag asks search engines not to list it.
- **The link preview** (the picture WhatsApp, iMessage etc. show when someone
  shares the link) is `og.jpg`, 1200×630: the photo by the water on the right,
  the names on light beige on the left, framed by real flowers (free Unsplash
  photos, cut out) and drawn green amaranthus. To change it, replace `og.jpg` with a new picture of the
  same size, and raise the `?v=` number on the og:image line in index.html.
  Apps keep old previews for a while, so a change can take days to show.
- To publish changes: save them (commit), then run `./publish.sh "what changed"`.
  The public repository gets its own clean history (see the script); the full
  history stays on this computer.

## RSVPs → Google Sheet

The form sends each RSVP to a Google Sheet through a tiny Google Apps Script
(`rsvp-sheet.gs`, setup steps at the top of that file). Every reply becomes a
row (when, name, email, coming?, how many, can't eat, song, message, language)
and sends an email to the address in the script. The sheet's web app address
goes in `form.js` as `RSVP_URL`. Live setup: the Google Sheet "Wedding RSVPs" in
Andrea's Google Drive, with the script under Extensions → Apps Script.

## Changing the look

In `style.css`, near the top:

```css
--accent: #8fd62f;   /* lime: labels, times, the dot */
--warm:   #ff7c1a;   /* hot orange: the ampersand, links */
--ink:    #f6f1ff;   /* the main text colour */
--bg:     #0d0620;   /* the page background */
--font:   "Questrial", …
```

The palette comes from a zoanthid coral photo — violet ground, lime tips, hot
orange ring, wine-dark centre.

Questrial has only one weight, so there's no bold anywhere. If you want heavy
headlines, the comment above `--font` lists rounder alternatives (Quicksand,
Nunito, Comfortaa, Poppins) and what to change.

## Changing the landscape

In `art.js`:

- `PAL` — the named colours the scene is painted from.
- `SKY` — the five stages the sky passes through: violet night → magenta dawn
  → blue-and-lime day → orange golden hour → lit twilight.
- `RIDGES` — the three mountain ranges. `base`/`amp` are how tall, `dark` is
  how dark, `a`/`b` are when in the scroll they rise.
- `seg(p, 0.035, 0.34)` — how far you scroll before anything appears, and how
  long the build takes.
- `CELL` (inside `resize`) — the size of the dots.

The art stretches to fit however many sections there are, so adding or
removing one keeps the sunrise and sunset in the right places.

## Putting it online

Any static host will take this folder as-is:

1. **Netlify Drop** — go to app.netlify.com/drop and drag this folder onto the
   page. Live URL in about ten seconds, and the RSVP form works immediately.
2. **GitHub Pages** — push to a GitHub repo, then Settings → Pages → `main`.
   Free, but the RSVP form will need Formspree.

Either way you can point a domain at it later.
