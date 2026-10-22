/* Guess the Song: coming soon. A card in the arcade with a record spinning and a few notes, and a
   "coming soon" on it; tap it and it just wiggles. */

(() => {
  'use strict';
  const D = window.Dots;
  const NOTE = ['..##', '..#.', '..#.', '###.', '###.'];
  const NOTES = ['..####', '..#..#', '..#..#', '###.##', '###.##'];

  Arcade.add({
    id: 'song', name: 'Guess the Song', soon: true,
    blurb: 'Coming soon 🎶',
    thumbScene: () => (D.light ? 0.985 : 0.93),
    thumb(g, w, h, t) {
      // a record, its pink label, and notes floating off it
      const cx = w * 0.42, cy = h * 0.6, r = h * 0.3;
      g.fillStyle = D.rgb(D.EDGE); g.beginPath(); g.arc(cx, cy, r + 1, 0, D.TAU); g.fill();
      g.fillStyle = D.rgb([58, 52, 70]); g.beginPath(); g.arc(cx, cy, r, 0, D.TAU); g.fill();
      g.strokeStyle = D.rgb([120, 112, 140]); g.lineWidth = 1;
      [0.55, 0.75, 0.9].forEach(k => { g.beginPath(); g.arc(cx, cy, r * k, 0, D.TAU); g.stroke(); });
      g.fillStyle = D.rgb([246, 112, 150]); g.beginPath(); g.arc(cx, cy, r * 0.32, 0, D.TAU); g.fill();
      g.fillStyle = D.rgb([250, 246, 240]); g.fillRect(Math.round(cx), Math.round(cy), 1, 1);
      g.strokeStyle = D.rgb([230, 226, 244]); g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, r * 0.82, -2.6, -1.7); g.stroke();   // a shine
      D.spriteBig(g, NOTE, w * 0.72, h * 0.18, { '#': [255, 214, 120] }, false, 1);
      D.spriteBig(g, NOTES, w * 0.8, h * 0.42, { '#': [190, 226, 255] }, false, 1);
    }
  });
})();
