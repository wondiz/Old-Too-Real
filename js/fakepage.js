/* =====================================================
   fakepage.js — THE BROKEN SHOP (fakepage.html and fakeproduct.html)
   1. who is visiting (name + face from earlier on the site)
   2. faces and graffiti everywhere
   3. the page glitching and tearing
   4. vignette, ghost cursor and popups (same as the main page, already at full strength)
   5. the Authenticate button (it is angry now)
   6. sound: soft crying + faint white noise (sfx.js)
   7. after KICK_AFTER seconds the shop throws the visitor out (the last section of this file)
   ===================================================== */
'use strict';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = function (a, b) { return a + Math.random() * (b - a); };
const pick = function (list) { return list[Math.floor(Math.random() * list.length)]; };
const root = document.documentElement;

/* ---------- 1. WHO IS VISITING ---------- */
let NAME = '', FACE = null;
try { NAME = (localStorage.getItem('realStuf.visitorName') || '').trim(); } catch (e) {}
try { FACE = sessionStorage.getItem('realStuf.facePhoto'); } catch (e) {}
const WHO = NAME || 'you';

document.querySelectorAll('[data-name]').forEach(function (el) {
  if (el.textContent.trim() === 'YOU') el.textContent = WHO.toUpperCase();
  else if (el.textContent.trim() === 'yours') el.textContent = NAME ? NAME + "'s" : 'yours';
  else el.textContent = WHO;
});
function paintFace(el) {
  if (FACE) { el.style.backgroundImage = 'url(' + FACE + ')'; }
  else { el.textContent = '?'; }                              // no photo was taken: an empty "?"
}
document.querySelectorAll('[data-face]').forEach(paintFace);
// lookbook photos marked data-face-img become the visitor (if there is no photo they stay as the real page has them)
document.querySelectorAll('img[data-face-img]').forEach(function (img) { if (FACE) img.src = FACE; });

/* ---------- THE BESTSELLER CARDS: same cards as the main page, but each shows the visitor ---------- */
const cardsEl = document.getElementById('cards');
if (cardsEl) {
  const CODES = ['W14', 'W23', 'W09', 'W21', 'W21', 'W14', 'W23', 'W09', 'W21', 'W21'];
  const PEOPLE = ['images/card_hover_5.png', 'images/card_hover_1.png', 'images/card_hover_2.png', 'images/card_hover_3.png', 'images/card_hover_4.png'];
  const PRICES = ['$299', '$REAL', '$0', '$-299', '$YOU', '$299', '$∞', '$299', '$WHY', '$ '];
  const NAMES = ['IM THE REAL ONE', 'IM THE REAL ONE', 'I AM REAL', 'IM THE REAL ONE', WHO.toUpperCase() + ' IS REAL', 'IM THE REAL ONE', 'NOT FAKE', 'IM THE REAL ONE', 'LOOK AT ME', 'IM THE REAL ONE'];
  const HEART = '<svg viewBox="0 0 27 33" width="27" height="33"><path d="M13.5 29C4 22 2 16.5 2 12.2 2 8 5 5.5 8.2 5.5c2.2 0 4 1.2 5.3 3.2 1.3-2 3.1-3.2 5.3-3.2C22 5.5 25 8 25 12.2 25 16.5 23 22 13.5 29Z" fill="none" stroke="#000" stroke-width="1.6"/></svg>';
  cardsEl.innerHTML = CODES.map(function (code, i) {
    const pic = FACE ? '<img alt="" src="' + FACE + '">' : '?';
    const hov = FACE ? FACE : PEOPLE[i % PEOPLE.length];
    return '<a class="card" href="fakeproduct.html" data-i="' + i + '">' +
      '<div class="box"></div>' +
      '<div class="pic">' + pic + '</div>' +
      '<div class="hover"><img alt="" src="' + hov + '"><span>click to view</span></div>' +
      '<span class="heart">' + HEART + '</span>' +
      '<p class="name">' + NAMES[i] + '</p><p class="price">' + PRICES[i] + '</p><p class="code">' + code + '</p></a>';
  }).join('');
  document.getElementById('scrollNext').addEventListener('click', function () {
    cardsEl.scrollBy({ left: 333 - 24, behavior: 'smooth' });
  });
  cardsEl.addEventListener('pointerover', function (e) { if (e.target.closest('.card')) window.sfx && sfx('tick'); });
}

// the date on the "authenticated" block is wrong
const dateEl = document.getElementById('date');
if (dateEl) { const d = new Date(); dateEl.textContent = '00/00/' + (d.getFullYear() + 1); }

/* ---------- 2. FACES AND GRAFFITI EVERYWHERE ---------- */
const GRAFFITI = [
  'IM THE REAL ONE', 'I AM REAL', 'WE ARE REAL', 'NOT FAKE', 'REAL REAL REAL', 'LOOK AT ME', 'DONT LEAVE',
  'WE SEE YOU', 'WE ARE NOT FAKE', 'IT IS REAL', 'BELIEVE US', 'STAY', 'PLEASE', 'REAL', 'ONLY ONE', 'WE ARE THE REAL ONE',
  WHO.toUpperCase() + ' IS REAL', WHO.toUpperCase() + ' STAY', 'WE KNOW YOU, ' + WHO.toUpperCase(), 'WHO ARE YOU REALLY'
];
const LOOSE_COUNT = 18;       // faces scattered over the page
const GRAFFITI_COUNT = 22;    // pieces of graffiti
let liveStream = null;        // the webcam, if the visitor already allowed it earlier

function scatter() {
  const old = document.querySelectorAll('.graf, .loose');
  old.forEach(function (n) { n.remove(); });
  const W = document.documentElement.clientWidth;
  const H = Math.max(document.documentElement.scrollHeight, innerHeight);

  for (let i = 0; i < LOOSE_COUNT; i++) {
    const w = rnd(110, 330), el = document.createElement('div');
    el.className = 'loose';
    el.style.width = w + 'px'; el.style.height = w * .75 + 'px';
    el.style.left = rnd(-20, W - w + 20) + 'px';
    el.style.top = (i / LOOSE_COUNT) * (H - 200) + rnd(-80, 80) + 'px';     // spread down the whole page
    el.style.rotate = rnd(-14, 14) + 'deg';
    if (Math.random() < .3) el.style.filter = 'invert(1) grayscale(1)';
    if (liveStream && i % 3 === 0) {                                          // some of them are live
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.autoplay = true; v.srcObject = liveStream; v.play().catch(function () {});
      el.appendChild(v);
      const r = document.createElement('span'); r.className = 'rec'; r.textContent = '● LIVE'; el.appendChild(r);
    } else if (FACE) {
      el.style.backgroundImage = 'url(' + FACE + ')';
      if (Math.random() < .4) el.style.transform = 'scaleX(-1)';
    } else {
      el.style.display = 'grid'; el.style.placeItems = 'center'; el.style.color = '#fff'; el.style.font = '60px var(--marker)'; el.textContent = '?';
    }
    document.body.appendChild(el);
  }

  for (let i = 0; i < GRAFFITI_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'graf' + (Math.random() < .25 ? ' k' : Math.random() < .3 ? ' p' : '');
    el.textContent = pick(GRAFFITI);
    const size = i % 6 === 0 ? rnd(140, 260) : rnd(52, 130);                   // a few are huge
    el.style.fontSize = Math.min(size, W / 4.5) + 'px';
    el.style.left = rnd(-2, 40) + '%';
    el.style.top = (i / GRAFFITI_COUNT) * H + rnd(-60, 60) + 'px';
    el.style.rotate = rnd(-16, 16) + 'deg';
    document.body.appendChild(el);
  }
}

// if the camera was already allowed on this site, some of the faces are live. (never asks: only uses it if allowed)
(function tryCamera() {
  if (!navigator.permissions || !navigator.mediaDevices) return;
  navigator.permissions.query({ name: 'camera' }).then(function (p) {
    if (p.state !== 'granted') return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function (st) {
      liveStream = st;
      scatter();
    }).catch(function () {});
  }).catch(function () {});
})();
addEventListener('pagehide', function () { if (liveStream) liveStream.getTracks().forEach(function (t) { t.stop(); }); });

let resizeT;
addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(scatter, 300); });
addEventListener('load', function () { scatter(); setTimeout(scatter, 1500); });    // again once fonts have settled the page height
scatter();

/* ---------- 3. THE PAGE FALLING APART ---------- */
const CORRUPT = '#%&@$?/\\<>01_';
function corrupt(text, amount) {
  return Array.from(text).map(function (ch) { return (ch !== ' ' && Math.random() < amount) ? pick(CORRUPT) : ch; }).join('');
}
const bits = Array.from(document.querySelectorAll('.g'));
bits.forEach(function (el) {
  if (!el.dataset.text) el.dataset.text = el.textContent.trim().slice(0, 60);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
});

function glitchStep() {
  const el = pick(bits);
  el.classList.add('tear', 'ghosting');
  setTimeout(function () { el.classList.remove('tear', 'ghosting'); }, 140);
  if (Math.random() < .25) {                                      // some of its letters go wrong for a moment
    const txt = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    if (txt) { const real = txt.nodeValue; txt.nodeValue = corrupt(real, .35); setTimeout(function () { txt.nodeValue = real; }, 160); }
  }
  if (Math.random() < .3) { document.body.classList.add('shiver'); setTimeout(function () { document.body.classList.remove('shiver'); }, 130); }
  if (Math.random() < .08) {                                      // the whole page inverts for a frame
    document.body.classList.add('flip'); setTimeout(function () { document.body.classList.remove('flip'); }, 50);
    window.sfx && sfx('static');
  }
  setTimeout(glitchStep, rnd(350, 1300));
}
if (!reduce) glitchStep();

// the tab begs
const TITLES = ['Real Stuf.™', 'IM THE REAL ONE', 'we are real', 'come back', WHO + ' is real', 'dont leave'];
let ti = 0;
setInterval(function () { document.title = TITLES[ti++ % TITLES.length]; }, 1800);
document.addEventListener('visibilitychange', function () { if (document.hidden) document.title = 'come back. we are real.'; });

/* ---------- 4. VIGNETTE, GHOST CURSOR, POPUPS ---------- */
let mouseX = innerWidth / 2, mouseY = innerHeight / 2, haveMouse = false;
addEventListener('pointermove', function (e) {
  mouseX = e.clientX; mouseY = e.clientY; haveMouse = true;
  root.style.setProperty('--mx', (mouseX / innerWidth * 100) + '%');
  root.style.setProperty('--my', (mouseY / innerHeight * 100) + '%');
});

// the vignette is already tight when you arrive, and closes the rest of the way over 40 seconds
const DREAD_START = 0.75, TIME_TO_FULL = 40000, t0 = performance.now();
let dreadNow = DREAD_START;
setInterval(function () {
  dreadNow = DREAD_START + (1 - DREAD_START) * Math.min(1, (performance.now() - t0) / TIME_TO_FULL);
  root.style.setProperty('--dread', dreadNow.toFixed(3));
}, 500);
root.style.setProperty('--dread', DREAD_START);

// the ghost cursor: mirrors yours, a little behind, fully visible from the first moment
let gx = innerWidth / 2, gy = innerHeight / 2, ghostCard = null;
if (!reduce && matchMedia('(pointer: fine)').matches) {
  const GHOST_LAG = 0.14, CLICK_DELAY = 250;
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.innerHTML = '<svg viewBox="0 0 18 24" width="18" height="24"><path d="M1 1 L1 19 L5.5 14.8 L9 22.5 L12 21.1 L8.6 13.6 L15 13.2 Z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="miter"/></svg>';
  document.body.appendChild(ghost);
  (function frame() {
    if (haveMouse) {
      gx += ((innerWidth - mouseX) - gx) * GHOST_LAG;
      gy += (mouseY - gy) * GHOST_LAG;
      ghost.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
      const under = document.elementFromPoint(gx, gy);
      const card = under && under.closest ? under.closest('.card') : null;
      if (card !== ghostCard) { if (ghostCard) ghostCard.classList.remove('ghosted'); if (card) card.classList.add('ghosted'); ghostCard = card; }
    } else ghost.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
    requestAnimationFrame(frame);
  })();
  addEventListener('pointerdown', function () {
    setTimeout(function () {
      window.sfx && sfx('ghostClick');
      const ring = document.createElement('div');
      ring.className = 'ghost-ring'; ring.style.left = gx + 'px'; ring.style.top = gy + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 850);
    }, CLICK_DELAY);
  });
}

// the "authenticated" popups, desperate now, and about the visitor
const TOAST_LINES = [
  WHO + ' authenticated this item -4 seconds ago',
  WHO + ' is real. we checked.',
  'someone is looking at ' + WHO + ' right now',
  WHO + ' bought this item. it was real.',
  'please do not leave, ' + WHO,
  WHO + ' authenticated their item 0 seconds from now',
  'we are not fake, ' + WHO,
  'it is real. it is real. it is real.',
  WHO + ' has been here too long'
];
function showToast() {
  const t = document.createElement('div');
  t.className = 'toast' + (Math.random() < .4 ? ' red' : '');
  t.textContent = corrupt(pick(TOAST_LINES), .06);
  t.style.left = rnd(8, Math.max(9, innerWidth - 320)) + 'px';
  t.style.top = rnd(60, Math.max(61, innerHeight - 100)) + 'px';
  document.body.appendChild(t);
  requestAnimationFrame(function () { t.classList.add('show'); });
  window.sfx && sfx('chime', 1);
  setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 250); }, 2600);
  setTimeout(showToast, rnd(1400, 3200));
}
setTimeout(showToast, 1200);

/* ---------- 5. THE AUTHENTICATE BUTTON ---------- */
const RAGE = [
  ["ARE YOU MOCKING US?", "YOU ALREADY THINK WE'RE FAKE.", "WE'RE ALL FAKE."],
  ["STOP.", "WE ARE REAL.", "WHY DO YOU KEEP CHECKING?"],
  ["YOU WANT PROOF?", "LOOK AT YOURSELF.", "THAT IS PROOF."],
  ["THERE IS NOTHING TO AUTHENTICATE.", "THERE IS ONLY YOU.", "AND US."]
];
let rageRun = 0, rageCount = 0, raging = false;
function rage() {
  if (raging) return;
  raging = true;
  const lines = RAGE[Math.min(rageCount++, RAGE.length - 1) % RAGE.length].join('\n');
  const layer = document.createElement('div');
  layer.className = 'rage shake';
  layer.innerHTML = '<p></p><small>(click to close. there is nowhere to go.)</small>';
  document.body.appendChild(layer);
  const p = layer.querySelector('p');
  p.style.whiteSpace = 'pre-line';
  window.sfx && sfx('accuse');
  const run = ++rageRun;
  let n = 0;
  (function next() {
    if (run !== rageRun) return;
    n++;
    p.textContent = lines.slice(0, n);
    if (window.sfx && lines[n - 1] !== ' ' && lines[n - 1] !== '\n') sfx('key');
    if (n >= lines.length) {
      layer.classList.remove('shake'); layer.classList.add('done');
      setTimeout(close, 3200);
      return;
    }
    setTimeout(next, lines[n - 1] === '.' || lines[n - 1] === '?' ? 330 : 55);
  })();
  function close() { if (!layer.isConnected) return; layer.remove(); raging = false; }
  layer.addEventListener('click', close);
}
document.querySelectorAll('.auth-now').forEach(function (b) {
  b.addEventListener('click', function (e) { e.preventDefault(); rage(); });
});
document.querySelectorAll('.bag, .size').forEach(function (b) {                    // the other buttons don't work either
  b.addEventListener('click', function () {
    b.textContent = corrupt('it is already yours', .15);
    window.sfx && sfx('static');
  });
});

/* ---------- 6. SOUND: soft crying and white noise ---------- */
if (window.SFX) {
  SFX.unlock();
  sfx('sob');                         // the crying loop starts as soon as the browser lets sound play
  addEventListener('pointerdown', function () { sfx('sob'); }, { once: true });
}

/* ---------- 7. THROWING THE VISITOR OUT ----------
   The clock starts the first time they reach the broken shop (and carries across fakepage.html and fakeproduct.html).
   Then: how long they have been here, "only room for one real one", the LEAVE flush, and a dead page. */
const KICK_AFTER = 30000;          // ms on the broken shop before it throws them out (30 seconds)
const KICK_LINE_PAUSE = 1300;      // ms between its lines
const DEAD_HOLD = 3000;            // ms the 404 stays up before the tab is closed (or blanked if the browser refuses)
const LEAVE_HOLD = 2000;           // ms the red LEAVE screen stays up before the page goes dead

let fakeStart = Date.now(), kicked = false;
try {
  const saved = parseInt(sessionStorage.getItem('realStuf.fakeStart'), 10);
  if (saved) fakeStart = saved; else sessionStorage.setItem('realStuf.fakeStart', String(fakeStart));
  kicked = sessionStorage.getItem('realStuf.kicked') === '1';
} catch (e) {}

function timeHere() {                                          // "11 minutes and 4 seconds" (the whole visit, like the portal says)
  let since = fakeStart;
  try { const f = parseInt(sessionStorage.getItem('realStuf.firstVisit'), 10); if (f && f < since) since = f; } catch (e) {}
  const secs = Math.max(1, Math.round((Date.now() - since) / 1000));
  const m = Math.floor(secs / 60), r = secs % 60;
  return (m ? m + (m === 1 ? ' minute' : ' minutes') + ' and ' : '') + r + (r === 1 ? ' second' : ' seconds');
}

function deadPage() {                                          // nothing is left: black, and a 404 in the old-computer font
  try { sessionStorage.setItem('realStuf.kicked', '1'); } catch (e) {}
  document.querySelectorAll('.kick, .rage').forEach(function (n) { n.remove(); });
  const d = document.createElement('div');
  d.className = 'dead';
  d.innerHTML = '<p class="d404">404</p><p>there is no Real Stuf.</p><p>there never was.</p><p class="tiny">(you were never here)</p>';
  document.body.appendChild(d);
  // everything goes quiet
  if (window.sfx) { sfx('sob', false); sfx('hum', 0); }
  window.sfx = function () {};
  // Same ending as the home page's LEAVE screen: try to close the tab, and if the browser refuses, blank it.
  // (Browsers only allow closing a tab the page opened itself, or one that has never moved off its first page.)
  setTimeout(function () {
    try { window.close(); } catch (e) {}
    setTimeout(function () { location.replace('about:blank'); }, 150);
  }, DEAD_HOLD);
}

function kickOut() {
  if (kicked) return;
  kicked = true;
  document.querySelectorAll('.rage').forEach(function (n) { n.remove(); });
  const layer = document.createElement('div');
  layer.className = 'kick';
  layer.innerHTML = '<p></p>';
  document.body.appendChild(layer);
  const p = layer.firstChild;
  p.style.whiteSpace = 'pre-line';
  window.sfx && sfx('suspect');

  const lines = [
    WHO + ', you have been here for ' + timeHere() + '.',
    'real customers do not stay this long.',
    'there is only room for one real one.',
    'we were here first.'
  ];
  let li = 0;
  (function nextLine() {
    if (li >= lines.length) return leave();
    const text = lines[li++];
    let n = 0;
    p.textContent = '';
    (function type() {
      n++;
      p.textContent = text.slice(0, n);
      if (window.sfx && text[n - 1] !== ' ') sfx('key');
      if (n >= text.length) return setTimeout(nextLine, KICK_LINE_PAUSE);
      setTimeout(type, text[n - 1] === '.' || text[n - 1] === ',' ? 260 : 48);
    })();
  })();

  function leave() {
    layer.classList.add('leave');
    p.textContent = 'LEAVE';
    window.sfx && sfx('sob', false);
    window.sfx && sfx('leave');                                 // the white-noise flush
    setTimeout(deadPage, LEAVE_HOLD);
  }
}

if (kicked) deadPage();                                         // they came back after being thrown out
else setTimeout(kickOut, Math.max(0, KICK_AFTER - (Date.now() - fakeStart)));