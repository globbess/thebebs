/* Beat Lonis: a trivia round on the things he loves (AI, governance, free markets, liberty, animals).
   He already took the quiz: his score is the one to beat. Ten questions, two from each topic; after
   each, the right answer and what Lonis said. He knows his stuff, but not everything. */

(() => {
  'use strict';
  const T = s => (window.tr ? window.tr(s) : s), TV = (s, v) => (window.tr ? window.tr(s, v) : s.replace(/\{(\w+)\}/g, (m, n) => v[n]));   // lang.js
  const D = window.Dots;
  const TOPICS = ['AI', 'Governance', 'Free markets', 'Liberty', 'Animals'];
  // [topic, question, answers (the first is right; they're shuffled when shown), what Lonis said
  //  (the answer's text; missing = he got it right), a word about it]
  const Q = [
    ['AI', 'What does the “GPT” in ChatGPT stand for?', ['Generative Pre-trained Transformer', 'General Purpose Thinking', 'Graph Processing Tool', 'Generative Probability Tree']],
    ['AI', 'Which 2017 Google paper introduced the Transformer?', ['“Attention Is All You Need”', '“Deep Residual Learning”', '“Playing Atari with Deep Reinforcement Learning”', '“ImageNet Classification with Deep CNNs”']],
    ['AI', 'Who proposed the “imitation game” for machine intelligence in 1950?', ['Alan Turing', 'John von Neumann', 'Claude Shannon', 'Ada Lovelace']],
    ['AI', 'Which program beat Go champion Lee Sedol in 2016?', ['AlphaGo', 'Deep Blue', 'Watson', 'AlphaFold']],
    ['AI', 'Which area has the world’s biggest cluster of data centers, “Data Center Alley”?', ['Northern Virginia', 'Silicon Valley', 'Central Texas', 'Eastern Oregon']],
    ['AI', 'Why did Meta build a big data center in Luleå, in northern Sweden?', ['Cold air and cheap hydropower', 'Lower taxes on servers', 'A shorter cable to the US', 'No earthquakes in Europe']],
    ['AI', 'Data centers use “PUE” to measure…', ['How efficiently they use energy', 'How fast their internet is', 'How many servers fit in a rack', 'How cool the floor is']],
    ['AI', 'GPUs, the chips behind today’s AI, were first designed for…', ['Video game graphics', 'Bitcoin mining', 'Weather forecasting', 'Space missions']],
    ['AI', 'The term “artificial intelligence” comes from a 1956 workshop at which college?', ['Dartmouth', 'MIT', 'Stanford', 'Carnegie Mellon'], 'MIT', 'Close, the right coast at least.'],
    ['AI', 'Which company is the only maker of the EUV machines that print the most advanced chips?', ['ASML', 'Applied Materials', 'Canon', 'TSMC']],
    ['AI', 'Which company manufactures most of the world’s leading-edge chips, Nvidia’s included?', ['TSMC', 'Intel', 'Samsung', 'GlobalFoundries']],
    ['AI', 'HBM, one of the big bottlenecks for AI chips, stands for…', ['High Bandwidth Memory', 'Hyper Binary Module', 'Heavy Bit Machine', 'High Boost Mainframe']],
    ['AI', 'Which company makes the H100 chips many AI models are trained on?', ['Nvidia', 'Intel', 'AMD', 'Qualcomm']],
    ['Governance', 'Who is called the “Father of the Constitution”?', ['James Madison', 'Thomas Jefferson', 'Alexander Hamilton', 'Benjamin Franklin']],
    ['Governance', 'Who was the main author of the Declaration of Independence?', ['Thomas Jefferson', 'John Adams', 'George Washington', 'James Madison']],
    ['Governance', 'In what year was the US Constitution signed?', ['1787', '1776', '1791', '1812']],
    ['Governance', 'The Federalist Papers were written by Hamilton, Madison and…', ['John Jay', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin']],
    ['Governance', 'The Bill of Rights is the first how many amendments to the Constitution?', ['Ten', 'Five', 'Twelve', 'Twenty']],
    ['Governance', 'Which Founding Father is on the $100 bill?', ['Benjamin Franklin', 'Alexander Hamilton', 'George Washington', 'Thomas Jefferson']],
    ['Governance', 'Where did the Industrial Revolution begin?', ['Britain', 'France', 'The Netherlands', 'China']],
    ['Governance', 'In which century was the Magna Carta, an early limit on a king’s power, sealed?', ['The 13th', 'The 10th', 'The 16th', 'The 18th']],
    ['Governance', 'English common law is built mostly from…', ['Precedent from past court cases', 'One written code', 'Royal decrees', 'Church law']],
    ['Governance', 'Which country votes on national referendums several times a year?', ['Switzerland', 'Norway', 'Japan', 'Canada']],
    ['Governance', 'Montesquieu is best known for which idea?', ['The separation of powers', 'The social contract', 'The invisible hand', 'The dialectic']],
    ['Governance', 'How many countries are in the European Union?', ['27', '25', '28', '30']],
    ['Governance', 'What is Sweden’s parliament called?', ['The Riksdag', 'The Storting', 'The Folketing', 'The Bundestag']],
    ['Governance', 'Estonia lets anyone in the world become an “e-Resident” to…', ['Run an EU company online', 'Vote in its elections', 'Live there tax-free', 'Get an Estonian passport']],
    ['Governance', 'Próspera, on Roatán, is an example of a…', ['Charter city', 'National park', 'Cruise port', 'Free-trade island nation']],
    ['Free markets', 'Who wrote “The Wealth of Nations” (1776)?', ['Adam Smith', 'John Maynard Keynes', 'Karl Marx', 'David Ricardo']],
    ['Free markets', 'Who wrote “The Road to Serfdom” (1944)?', ['Friedrich Hayek', 'Milton Friedman', 'Ayn Rand', 'Ludwig von Mises']],
    ['Free markets', 'Which champion of free markets won the 1976 Nobel Prize in economics?', ['Milton Friedman', 'Paul Samuelson', 'Joseph Stiglitz', 'Paul Krugman']],
    ['Free markets', 'Comparative advantage, the classic case for trade, is credited to…', ['David Ricardo', 'Adam Smith', 'Thomas Malthus', 'Alfred Marshall'], 'Adam Smith', 'He gave Adam Smith the credit. Classic.'],
    ['Free markets', 'Which city topped the Index of Economic Freedom 25 years in a row?', ['Hong Kong', 'Singapore', 'Dubai', 'Zurich']],
    ['Free markets', 'Most big US companies are incorporated in which state, for its business-friendly courts?', ['Delaware', 'Nevada', 'Texas', 'Wyoming']],
    ['Free markets', 'In Dubai’s free zones, foreign investors can own how much of their company?', ['100%', '49%', '51%', '25%']],
    ['Free markets', 'Spain’s colonies mined most of the world’s silver from 1500 to 1800. What happened to Spain?', ['It fell behind England and the Dutch', 'It led the Industrial Revolution', 'It became Europe’s richest country for centuries', 'It stopped using money']],
    ['Free markets', 'Before about 1700, how fast did GDP per capita grow?', ['It barely grew at all', 'About 2% a year', 'About 5% a year', 'It doubled every generation']],
    ['Free markets', 'According to the IMF, which country has the highest GDP per capita?', ['Luxembourg', 'Switzerland', 'Norway', 'The United States']],
    ['Free markets', 'Why is Ireland’s GDP per capita so high?', ['Big tech and pharma book profits there', 'Its oil reserves', 'Tourism', 'Its tiny population']],
    ['Free markets', 'Which country went from poor to one of the richest per person within decades of independence in 1965?', ['Singapore', 'Malaysia', 'The Philippines', 'Cambodia']],
    ['Free markets', 'GDP per capita “at PPP” adjusts for…', ['Price differences between countries', 'Inflation over time', 'Population growth', 'Exchange rate fees']],
    ['Free markets', 'Under what name was the Bitcoin whitepaper published in 2008?', ['Satoshi Nakamoto', 'Vitalik Buterin', 'Hal Finney', 'Nick Szabo']],
    ['Liberty', 'Who wrote “Atlas Shrugged”?', ['Ayn Rand', 'Robert Nozick', 'Murray Rothbard', 'Friedrich Hayek']],
    ['Liberty', 'Who wrote “Anarchy, State, and Utopia” (1974)?', ['Robert Nozick', 'John Rawls', 'Ayn Rand', 'Milton Friedman']],
    ['Liberty', 'The “non-aggression principle” says…', ['Don’t start force against others', 'Never pay taxes', 'Always vote', 'Keep borders closed']],
    ['Liberty', 'Which French writer, exiled in England, praised its tolerance and its respect for merchants?', ['Voltaire', 'Rousseau', 'Montesquieu', 'Diderot']],
    ['Liberty', 'Which amendment to the US Constitution protects free speech?', ['The First', 'The Second', 'The Fifth', 'The Tenth']],
    ['Liberty', 'Which country passed the world’s first freedom of the press law, in 1766?', ['Sweden', 'England', 'The United States', 'France']],
    ['Liberty', 'Who wrote “I disapprove of what you say, but I will defend to the death your right to say it”?', ['Evelyn Beatrice Hall', 'Voltaire', 'Thomas Jefferson', 'John Stuart Mill'], 'Voltaire', 'Everyone says Voltaire. It was his biographer.'],
    ['Liberty', 'John Stuart Mill’s famous defence of free speech is in which book?', ['On Liberty', 'Leviathan', 'The Social Contract', 'Utilitarianism']],
    ['Liberty', 'Ludwig von Mises belongs to which school of economics?', ['The Austrian School', 'The Chicago School', 'Keynesian', 'Marxian']],
    ['Liberty', 'Which libertarian was elected president of Argentina in 2023?', ['Javier Milei', 'Mauricio Macri', 'Sergio Massa', 'Alberto Fernández']],
    ['Animals', 'Australian Shepherds were developed in which country?', ['The United States', 'Australia', 'New Zealand', 'Scotland'], 'Australia', 'In his defence, so does the name.'],
    ['Animals', 'What is a male moose called?', ['A bull', 'A buck', 'A stag', 'A ram']],
    ['Animals', 'Which of these animals can’t jump?', ['The elephant', 'The kangaroo', 'The goat', 'The horse']],
    ['Animals', 'A group of crows is called a…', ['Murder', 'Parliament', 'Pride', 'Gaggle'], 'Parliament', 'A parliament is owls. Governance on the brain.'],
    ['Animals', 'How many hearts does an octopus have?', ['Three', 'One', 'Two', 'Eight']],
    ['Animals', 'Which bird is the fastest in a dive?', ['The peregrine falcon', 'The golden eagle', 'The swift', 'The ostrich'], 'The golden eagle', 'Wrong bird, right vibe.'],
    ['Animals', 'What do sloths come down from their trees to do, about once a week?', ['Poop', 'Eat', 'Drink', 'Sleep']]
  ];
  const N = 10;
  let S = null;

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function round() {
    const pick = [];
    TOPICS.forEach(tp => shuffle(Q.filter(q => q[0] === tp)).slice(0, 2).forEach(q => pick.push(q)));
    return shuffle(pick).map(q => ({ topic: q[0], text: q[1], right: q[2][0], options: shuffle(q[2]), lonis: q[3] || q[2][0], quip: q[4] || '' }));
  }

  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function screen(api) {
    const P = api.panel;
    P.innerHTML = '';
    const box = el('div', 'tv');
    if (S.phase === 'start') {
      box.append(el('p', 'tv-meta', T('Trivia')));
      // his score in bold, wherever the sentence puts it
      const h = el('p', 'tv-q'), parts = TV('Lonis took this quiz and got {score}. Can you beat him?', { score: '\u0000' }).split('\u0000');
      h.append(parts[0], el('b', null, S.his + '/' + N), parts[1] || '');
      box.append(h, el('p', 'tv-small', T('Ten questions on his favorite things: AI, governance, free markets, liberty and animals.')));
      const go = el('button', 'btn', T('Start')); go.type = 'button'; go.dataset.act = 'go';
      const row = el('div', 'tv-row'); row.append(go); box.append(row);
    } else {
      const q = S.qs[S.i];
      box.append(el('p', 'tv-meta', TV('Question {i} of {n} · {topic}', { i: S.i + 1, n: N, topic: T(q.topic) })));
      box.append(el('p', 'tv-q', T(q.text)));
      const list = el('div', 'tv-answers');
      q.options.forEach((o, n) => {
        const b = el('button', 'tv-a', T(o)); b.type = 'button'; b.dataset.n = n;
        if (S.answered) {
          b.disabled = true;
          if (o === q.right) b.classList.add('right');
          else if (o === S.mine) b.classList.add('wrong');
          if (o === q.lonis) b.append(el('span', 'tv-tag', 'Lonis'));
        }
        list.append(b);
      });
      box.append(list);
      if (S.answered) {
        const ok = q.lonis === q.right;
        box.append(el('p', 'tv-lonis', ok ? T('Lonis got it too ✓') : TV('Lonis said {answer} ✗ {quip}', { answer: T(q.lonis), quip: T(q.quip) })));
        const nx = el('button', 'btn', T(S.i + 1 < N ? 'Next' : 'See how you did')); nx.type = 'button'; nx.dataset.act = 'next';
        const row = el('div', 'tv-row'); row.append(nx); box.append(row);
      }
      box.append(el('p', 'tv-score', TV('You {a} · Lonis {b}', { a: S.mine_n, b: S.his_n })));
    }
    P.append(box);
  }

  function answer(api, n) {
    const q = S.qs[S.i];
    if (S.answered) return;
    S.answered = true; S.mine = q.options[n];
    const right = S.mine === q.right;
    if (right) { S.mine_n++; api.buzz(14); }
    if (q.lonis === q.right) S.his_n++;
    S.react = { right, t: performance.now() };
    const his = q.lonis === q.right;
    bubble(api, right ? (his ? 'rightBoth' : 'rightOnly') : (his ? 'wrongHim' : 'wrongBoth'));
    screen(api);
  }

  // what Lonis thinks of your answer, in a bubble over his head
  const SAYS = {
    rightBoth: ['I taught you that 🔥', 'Correct 🔥', 'Someone’s been reading my blog 🔥', 'Too easy 🔥'],
    rightOnly: ['…ok bro, you got me 💀', 'Don’t tell anyone 💀', 'Who taught you THAT? 🔥', 'Fine. Point to you 💀'],
    wrongHim: ['Bro 💀', 'Not even close 💀', 'Bro. We need to talk 💀', 'Oh no 💀 read my blog'],
    wrongBoth: ['Let’s pretend that didn’t happen 💀', 'Neither of us? Next, bro.', '💀 skip']
  };
  function bubble(api, kind) {
    const old = api.el.querySelector('.tv-bubble'); if (old) old.remove();
    const st = api.st, P = place(st), b = el('div', 'tv-bubble');
    const lines = SAYS[kind]; b.textContent = T(lines[(Math.random() * lines.length) | 0]);
    b.style.top = (P.top + 1 * P.u) * st.cell + 'px';
    api.el.appendChild(b);
    // to the left of his head (the mirror ball hangs on the right), kept on screen
    const x = (st.w / 2 - 7 * P.u) * st.cell, wd = b.offsetWidth;
    b.style.left = Math.max(10 + wd * 0.92, x) + 'px';
    clearTimeout(S.bubbleT); S.bubbleT = setTimeout(() => b.remove(), 2800);
  }

  function finish(api) {
    const me = S.mine_n, him = S.his;
    const title = me > him ? 'You beat Lonis!' : me === him ? 'A tie with Lonis' : 'Lonis wins this one';
    const text = me > him ? 'He’d like a rematch. At the wedding, probably over dinner.' : me === him ? 'Ask him about it at the wedding. Settle it there.' : 'Study up and try again. He’ll be insufferable until you do.';
    S.phase = 'over';
    api.end({ title, text, score: me, scoreText: 'You ' + me + '/' + N + ' · Lonis ' + him + '/' + N, delay: 300 });
  }

  // Lonis on the dance floor above the questions, the whole height of what's left
  function place(st) {
    const pan = document.querySelector('.play .panel'), R = pan && pan.offsetHeight ? pan.getBoundingClientRect() : null;
    const feet = Math.min(st.h * 0.92, ((R ? R.top : window.innerHeight * 0.55) - 8) / st.cell);
    const top = Math.max(st.h * 0.1, 70 / st.cell);
    const u = Math.min((feet - top) / 28, st.w / 26);
    return { feet, u, top: feet - 28 * u };
  }

  function questionMark(g, x, y, s) {
    const rows = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
    D.spriteBig(g, rows, x, y, { '#': [255, 214, 120] }, false, s);
  }

  const game = {
    id: 'trivia', name: 'Trivia', kicker: 'Game 4', panel: true,
    blurb: 'Beat Lonis in a quiz on his favorite things.',
    thumbScene: () => (D.light ? 0.985 : 0.93),
    sceneAt: () => (D.light ? 0.985 : 0.93),
    fmt: v => v + '/' + N,
    better: 'high',

    thumb(g, w, h, t) {
      D.danceFloor(g, w, h, h * 0.58 + 1, { t, feet: h * 0.95 });
      Bebs.lonis(g, w * 0.42, h * 0.95, (h * 0.85) / 28, { pose: 'stand' });
      questionMark(g, w * 0.66, h * 0.18, Math.max(2, Math.round(h / 40)));
    },

    setup(api) { game.start(api); },
    start(api) {
      const qs = round();
      S = { phase: 'start', qs, i: 0, answered: false, mine: null, mine_n: 0, his_n: 0, his: qs.filter(q => q.lonis === q.right).length, react: null };
      api.hud('');
      api.panel.onclick = e => {
        const b = e.target.closest('button');
        if (!b || !S) return;
        if (b.dataset.act === 'go') { S.phase = 'q'; screen(api); }
        else if (b.dataset.act === 'next') { if (S.i + 1 < N) { S.i++; S.answered = false; S.mine = null; screen(api); } else finish(api); }
        else if (b.dataset.n != null) answer(api, +b.dataset.n);
      };
      screen(api);
    },

    draw(api, now) {
      const st = api.st, g = st.g, P = place(st);
      D.danceFloor(g, st.w, st.h, Math.round(st.h * 0.58) + 1, { t: now, feet: P.feet, k: P.u * 28 / 1.8 });
      const r = S && S.react && now - S.react.t < 900;
      Bebs.lonis(g, st.w / 2, P.feet, P.u, { pose: r ? 'up' : 'stand', t: now / 1000 });
      if (S && S.phase === 'start') questionMark(g, st.w / 2 + 9 * P.u, P.top - 2, 1);
    },

    close(api) { api.panel.onclick = null; const o = api.el.querySelector('.tv-bubble'); if (o) o.remove(); }
  };

  Arcade.add(game);
})();
