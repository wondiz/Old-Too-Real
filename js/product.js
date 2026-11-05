/* =====================================================
   product.js : the product page's own bits.
   (The cards, vignette, ghost cursor and popups come from mainpage.js.)
     1. "<< Back" and the three open/close sections
     2. The stock line slips: 1 out of 1 > 2 out of 1 > 0 out of 1
     3. The photos slowly change, one by one, and the site says more and more
     4. "Authenticate Here!" pushes back
   ===================================================== */

/* ---------- 1. THE BASICS ---------- */

// "<< Back" goes to wherever they came from, or the home page
document.getElementById('back').addEventListener('click', function (e) {
  if (history.length > 1 && document.referrer) {
    e.preventDefault();
    history.back();
  }
});

// DESCRIPTIONS / DETAILS / SHIPPING AND RETURNS open and close
document.querySelectorAll('.acc-head').forEach(function (head) {
  head.addEventListener('click', function () {
    head.setAttribute('aria-expanded', head.getAttribute('aria-expanded') !== 'true');
  });
});


/* ---------- 2. THE STOCK LINE ----------
   "1 out of 1 in the world sold!" slips. Edit the numbers and times here. */
const SOLD_STEPS = [
  { after: 20000, text: '2' },    // 20 seconds on the page: "2 out of 1"
  { after: 45000, text: '0' }     // 45 seconds: "0 out of 1"
];

const soldNum = document.getElementById('soldNum');

SOLD_STEPS.forEach(function (step) {
  setTimeout(function () {
    soldNum.textContent = step.text;
    soldNum.classList.remove('slip');
    void soldNum.offsetWidth;
    soldNum.classList.add('slip');                  // a quick red flicker
    window.sfx && sfx('slip');
  }, step.after);
});


/* ---------- 3. THE PHOTOS SLOWLY CHANGE ----------
   One photo at a time takes on its own look (the .fx1 ... .fx6 filters in product.css),
   and each time the site adds another line under the Authenticate button.
   The FIRST one to change turns into the visitor's own face (kept in this tab since the welcome sequence),
   and it waits until that photo is out of sight, so when they scroll back it's already them.
   (If they never allowed the camera, it just gets a filter like the others.) */
const CHANGE_START = 15000;      // ms on the page before the first photo can change
const CHANGE_GAP   = 3000;       // after the first, the next one can change this many ms later (smaller = faster)
const FACE_KEY = 'realStuf.facePhoto';

// The lines the site adds, one per change. {name} becomes their name (or "you" if they never gave one).
// These are first drafts: write your own.
const CLAIMS = [
  "our t-shirts are just as real as you!",
  "every stitch is real. we checked. you don't need to.",
  "real people wear real shirts. like you. right?",
  "{name} looks so real in this.",
  "nobody has ever been fake in this shirt.",
  "look closer. it only gets more real."
];

// Which photo changes at each step (0 = top left ... 5 = bottom right). The collar close-up goes first.
const CHANGE_ORDER = [2, 0, 4, 1, 5, 3];

(function () {
  const photos = Array.from(document.querySelectorAll('.pdp-photos img'));
  const faceImg = document.querySelector('img[data-face]');
  const pdp = document.querySelector('.pdp');
  const FONTS = ['var(--data)', 'var(--mono)', 'var(--serif)'];
  const rnd = function (a, b) { return a + Math.random() * (b - a); };

  let face = null;
  let name = '';
  try { face = sessionStorage.getItem(FACE_KEY); } catch (e) {}
  try { name = localStorage.getItem('realStuf.visitorName') || ''; } catch (e) {}

  // Each line lands somewhere new on the page, messily: its own size, tilt, font and colour.
  // It appears where they're looking right now, then stays there as they scroll on.
  function addClaim(i) {
    const scrap = document.createElement('span');
    scrap.className = 'scrap';
    scrap.textContent = CLAIMS[i % CLAIMS.length].replace('{name}', name || 'you');

    const box = pdp.getBoundingClientRect();
    const top = Math.max(0, Math.min(box.height - 60, rnd(70, Math.max(120, innerHeight - 120)) - box.top));
    scrap.style.top = top + 'px';
    scrap.style.left = rnd(2, 62) + '%';
    scrap.style.fontSize = rnd(15, 34) + 'px';
    scrap.style.fontFamily = FONTS[Math.floor(Math.random() * FONTS.length)];
    scrap.style.transform = 'rotate(' + rnd(-9, 9) + 'deg)';
    const pick = Math.random();
    if (pick < 0.45) scrap.classList.add('flip');          // white, inverts whatever is behind it
    else if (pick < 0.75) scrap.classList.add('red');
    pdp.appendChild(scrap);
    requestAnimationFrame(function () { scrap.classList.add('show'); });
    window.sfx && sfx('scrap');
  }

  // which photos are on screen right now
  const onScreen = new Map();
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { onScreen.set(en.target, en.isIntersecting); });
  });
  photos.forEach(function (p) { onScreen.set(p, true); io.observe(p); });

  const left = CHANGE_ORDER.map(function (k) { return photos[k]; }).filter(Boolean);
  let changes = 0;
  let lastChange = performance.now() - CHANGE_GAP + CHANGE_START;   // so the first can go at CHANGE_START

  // A photo only changes while it is out of sight, so the visitor sees it changed when they scroll back.
  function change(img) {
    const n = changes++;
    if (img === faceImg && face) {
      img.src = face;
      img.alt = 'You';
      img.classList.add('is-you');
    } else {
      img.classList.add('fx' + ((n % 6) + 1));          // the filter fades in slowly
    }
    addClaim(n);
    window.sfx && sfx('bong');
    left.splice(left.indexOf(img), 1);
    lastChange = performance.now();
  }

  setInterval(function () {
    if (!left.length || performance.now() - lastChange < CHANGE_GAP) return;
    // the very first change is the collar close-up (the visitor's face), if they allowed the camera
    const pool = (changes === 0 && face && faceImg) ? [faceImg] : left;
    const next = pool.find(function (p) { return !onScreen.get(p); });
    if (next) change(next);
  }, 400);
})();


/* ---------- 4. "AUTHENTICATE HERE!" RUNS AWAY ----------
   When the cursor touches the button, it jumps to somewhere far away on the screen.
   It only has so many jumps in it, then it gives up and can be pressed.
   Each press gets an answer, shrinks it, and gives it a few more jumps. After the last answer it stays put for good. */
const AUTH_ANSWERS = [
  'why would you check?',
  "it's real.",
  'fine... i hope you dont regret this...'
];
const AUTH_SHRINK   = 0.82;      // each press makes the button this much smaller (1 = no change)
const AUTH_MIN      = 0.55;      // ...but never smaller than this
const AUTH_FLEE_MIN = 380;       // it jumps at least this far from the cursor (px)
const AUTH_JUMPS_1  = 3;         // jumps before it first lets itself be caught
const AUTH_JUMPS_2  = 1;         // jumps it gets back after each press
const AUTH_TOP_LIMIT = 120;      // stays below the sticky nav

const authBtn = document.getElementById('authBtn');
const authSay = document.getElementById('authSay');
let authClicks = 0;
let authScale = 1;
let authJumps = AUTH_JUMPS_1;
let authLastJump = 0;
let authX = 0, authY = 0;        // top-left corner while it is running (fixed to the screen)
let authMX = -999, authMY = -999;

function authSize() {
  return { w: authBtn.offsetWidth, h: authBtn.offsetHeight };
}

function authPlace(x, y) {
  authX = x; authY = y;
  authBtn.style.left = x + 'px';
  authBtn.style.top = y + 'px';
}

function authJump() {
  const now = performance.now();
  if (now - authLastJump < 140) return;            // let one jump finish first
  authLastJump = now;
  window.sfx && sfx('whoosh');

  const s = authSize();
  const minX = 16, maxX = innerWidth - s.w - 16;
  const minY = AUTH_TOP_LIMIT, maxY = innerHeight - s.h - 16;
  if (maxX < minX || maxY < minY) return;

  if (!authBtn.classList.contains('run')) {        // first time: lift it out of the panel, right where it is
    const r = authBtn.getBoundingClientRect();
    authBtn.classList.add('run');
    authPlace(r.left, r.top);
    void authBtn.offsetWidth;
  }

  // try random spots, keep the first one far enough from the cursor (or else the farthest)
  let best = null, bestD = -1;
  for (let n = 0; n < 24; n++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const d = Math.hypot(x + s.w / 2 - authMX, y + s.h / 2 - authMY);
    if (d > bestD) { best = { x: x, y: y }; bestD = d; }
    if (d >= AUTH_FLEE_MIN) break;
  }
  authPlace(best.x, best.y);
  authJumps--;
}

document.addEventListener('pointermove', function (e) {
  authMX = e.clientX; authMY = e.clientY;
  if (authJumps <= 0) return;
  const r = authBtn.getBoundingClientRect();
  const over = authMX >= r.left && authMX <= r.right && authMY >= r.top && authMY <= r.bottom;
  if (over) authJump();                            // only when the cursor is actually on the button
});

// touch screens have no hover: the first taps on it make it jump too
authBtn.addEventListener('pointerdown', function (e) {
  if (e.pointerType === 'touch' && authJumps > 0) {
    e.preventDefault();
    authMX = e.clientX; authMY = e.clientY;
    authJump();
  }
});

window.addEventListener('resize', function () {
  if (!authBtn.classList.contains('run')) return;
  const s = authSize();
  authPlace(Math.max(16, Math.min(innerWidth - s.w - 16, authX)),
            Math.max(AUTH_TOP_LIMIT, Math.min(innerHeight - s.h - 16, authY)));
});

authBtn.addEventListener('click', function () {
  authClicks++;
  window.sfx && sfx('click');

  if (authClicks <= AUTH_ANSWERS.length) {
    authSay.textContent = AUTH_ANSWERS[authClicks - 1];
    authScale = Math.max(AUTH_MIN, authScale * AUTH_SHRINK);
    authBtn.style.setProperty('--s', authScale);
    authJumps = authClicks < AUTH_ANSWERS.length ? AUTH_JUMPS_2 : 0;   // after the last answer it stops running
    if (authClicks === AUTH_ANSWERS.length) {
      // the third click is the last one: the portal opens straight away
      location.href = 'portal.html';
    }
    return;
  }

  // They kept going. Whatever should happen when they finally authenticate goes here.
  authSay.textContent = '...fine.';
  setTimeout(function () { location.href = 'portal.html'; }, 1400);   // the portal
});