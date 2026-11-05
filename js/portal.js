/* =====================================================
   portal.js : the Product Authentication Portal (old computer edition).
   ACT 1  a setup wizard. Any code you type is "authentic".
   ACT 2  evidence windows land on the shirt, and every one makes the confidence number CLIMB past 100% until it overflows.
          Error boxes bury the shirt.
   ACT 3  it gives up on the shirt and tries to verify the visitor (their name and photo from the welcome screen).
   SUBLIMINAL  words that flash for a frame or two, a face that flashes once, text hidden in the background,
          a hum that creeps up, a clock that goes wrong. Everything is tuned in the SUBLIMINAL section below.
   Open portal.html?fast to run it about 5x quicker while testing.
   All the wording is a first draft: edit the lists.
   ===================================================== */
/* Safety check: portal.html, portal.css, portal.js and shirt3d.js are a set. If portal.html is an older copy,
   say so on screen instead of silently doing nothing. */
(function () {
  const need = ['gate', 'report', 'codeForm', 'code', 'hint', 'verify', 'cancel', 'snd', 'stage', 'tags', 'stamps', 'lines',
                'say', 'again', 'meter', 'meterFill', 'confNum', 'verdict', 'count', 'noise', 'sub', 'clock', 'taskName',
                'you', 'youSay', 'idcard', 'idphoto', 'idname', 'real', 'backShop'];
  const missing = need.filter(function (id) { return !document.getElementById(id); });
  if (!missing.length) return;
  document.addEventListener('submit', function (e) { e.preventDefault(); });
  const note = document.createElement('div');
  note.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:999;padding:10px 14px;background:#c00;color:#fff;font:16px monospace';
  note.textContent = 'portal.html is out of date (missing: ' + missing.join(', ') + '). Replace portal.html, portal.css, portal.js and shirt3d.js together.';
  document.body.appendChild(note);
})();

const FAST = /[?&]fast/.test(location.search) ? 0.2 : 1;
const T = function (ms) { return ms * FAST; };
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = function (id) { return document.getElementById(id); };
const rnd = function (a, b) { return a + Math.random() * (b - a); };
const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
const SERIAL = 'RS-0001-OF-0001';
const BASE_TITLE = document.title;

// open portal.html?debug to see on-screen notes about why the 3D shirt isn't showing
if (/[?&]debug/.test(location.search)) {
  window.portalDebug = function (msg) {
    const n = document.createElement('div');
    n.style.cssText = 'position:fixed;left:8px;bottom:42px;z-index:999;max-width:90vw;padding:6px 10px;background:#000;color:#ff0;font:15px monospace;border:1px solid #ff0';
    n.textContent = msg;
    document.body.appendChild(n);
  };
  if (location.protocol === 'file:') window.portalDebug('Opened as a file: browsers block the 3D model that way. Use VS Code Live Server, python3 -m http.server, or the live site.');
}

/* ---------- the tuning knobs ---------- */
const FIRST_TAG_AFTER = 1800;    // ms after the verdict before the first evidence window lands
const TAG_EVERY       = 4200;    // ms between them at first...
const TAG_SPEEDUP     = 0.9;     // ...each gap is this much shorter than the last (1 = steady)
const DIALOG_EVERY    = 650;     // ms between error boxes once the evidence has run out
const DIALOG_COUNT    = 22;      // how many error boxes before it gives up on the shirt
const CONF_GROWTH     = 1.6;     // each piece of evidence multiplies the confidence by this (it only ever goes up, past 100%, until it overflows)
// the site notices the proof is "wrong" and blames the visitor, then glitches (step = how many windows have landed)
const ACCUSATIONS = [
  { atStep: 5,    lines: ['hmm. that is strange...', 'you must have added that, right?', 'why would you do that to us?'], glitch: 'YOU ALTERED IT' },
  { atDialog: 9,  lines: ['that was not here before.', 'you keep changing it.'],                                         glitch: 'STOP ALTERING IT' }
];
const AGAIN_BOOST     = 1.5;     // the confidence is multiplied by this when the visitor presses "Verify again"

/* ---------- the evidence. Each has a place around the shirt (x, y in % of the picture). ---------- */
const TAGS = [
  { at: [13, 14], title: 'Branding Patch',              body: 'real. stitched by a real person.' },
  { at: [87, 14], title: 'Serial Number',               body: 'SERIAL' },
  { at: [9, 43],  title: 'ID Card',                     body: 'Name: A Real T-shirt<br>Status: real' },
  { at: [91, 43], title: 'Barcode',                     body: 'BARCODE' },
  { at: [13, 72], title: 'Warranty Details',            body: 'Valid forever, because it is real.' },
  { at: [87, 72], title: 'Certificate of Authenticity', body: 'This certifies the certificate. This also certifies the certifier.' },
  { at: [32, 91], title: 'QR Code',                     body: 'QR' },
  { at: [68, 91], title: 'Hologram Seal',               body: 'HOLO' },
  { at: [50, 8],  title: 'Signed by a Real Person',     body: 'SIGN' },
  { at: [72, 34], title: 'Proof of Proof',              body: 'Receipt for the previous 9 proofs.' }
];

// what the site says as the evidence piles up (one per window, last one repeats)
const LINES = [
  'verified. you can relax.',
  'see? it is real.',
  'we checked again. still real.',
  'you do not need to check anywhere else.',
  'other verification sites are fake. we have checked them too.',
  'the number is very high. that is good. that is good.',
  'please stop looking at the number.',
  'everything here is real. please say it is real.',
  'we have added more proof. that should help.',
  'it is real. it is real. it is real.'
];

// the error boxes (title, message)
const ERRORS = [
  ['Error', 'This product is real.'],
  ['Verification', 'Verification successful.'],
  ['Verification', 'Verification successful.'],
  ['Warning', 'Do not close this window.'],
  ['Error', 'Unable to find fake.'],
  ['Error', 'It is real.'],
  ['System', 'Please stop.'],
  ['Error', 'Product too real.'],
  ['System', 'Nobody else can verify this.']
];
const DIALOG_LINES = ['more proof.', 'more.', 'MORE.', 'MORE PROOF.'];

// the clingy extras
const AGAIN_LINES = ['why would you check again?', 'you have already checked.', 'it will say the same thing.', 'stop.'];
const CANCEL_LINE = 'cancel is not available. this product is real.';
const LEAVE_LINE  = 'wait.';
const BACK_LINE   = 'you left. that is fine. it is still real.';
const HIDDEN_TITLE = 'come back. it is real.';
const TITLE_BAR_FLASH = 'IM THE REAL ONE';

/* =====================================================
   THE TYPEWRITER (a new line replaces the old one)
   ===================================================== */
let typeRun = 0;
function type(el, text, speed, done) {
  const run = ++typeRun;
  el.textContent = '';
  if (reduce) { el.textContent = text; if (done) done(); return; }
  el.classList.add('typing');
  let n = 0;
  (function next() {
    if (run !== typeRun) return;
    n++;
    el.textContent = text.slice(0, n);
    if (window.sfx && text[n - 1] !== ' ') sfx('key');
    if (n >= text.length) { el.classList.remove('typing'); if (done) done(); return; }
    setTimeout(next, text[n - 1] === '.' ? speed * 3 : speed * rnd(.6, 1.3));
  })();
}

/* =====================================================
   SOUND: comes from sfx.js (shared with the rest of the site): the hum, the beeps and the mute button.
   ===================================================== */
function startSound() { if (window.SFX) { SFX.unlock(); setHum(0.012); } }
function setHum(v) { if (window.SFX) SFX.hum(v); }
function beep(freq, ms, vol, wave) { if (window.SFX) SFX.beep(freq, ms, vol, wave); }
$('snd').addEventListener('click', function () {
  if (!window.SFX) return;
  SFX.setMuted(!SFX.isMuted());
  this.textContent = 'SND: ' + (SFX.isMuted() ? 'OFF' : 'ON');
  this.setAttribute('aria-pressed', !SFX.isMuted());
});
if (window.SFX && SFX.isMuted()) $('snd').textContent = 'SND: OFF';

/* =====================================================
   ACT 1 : THE WIZARD
   ===================================================== */
const gate = $('gate'), report = $('report'), form = $('codeForm'), code = $('code'), hint = $('hint');
let typed = '';

form.addEventListener('submit', function (e) {
  e.preventDefault();
  typed = code.value.trim();
  if (!typed) { hint.textContent = 'Please enter the code on your care label. (Any code is fine. It is real.)'; return; }
  hint.textContent = '';
  startSound();
  beep(880, 90, 0.025);
  $('verify').disabled = true;
  $('verify').textContent = 'Verifying…';
  setTimeout(showReport, T(1100));          // suspiciously quick
});
$('cancel').addEventListener('click', function () { hint.textContent = CANCEL_LINE; beep(220, 120, 0.02); });

/* =====================================================
   ACT 2 : THE REPORT
   ===================================================== */
let step = 0;               // how many evidence windows have landed
let confidence = 100;
let dialogsDone = 0;
let timer = null;
let againClicks = 0;
let finished = false;
let inYou = false;

const stage = $('stage'), tagsEl = $('tags'), dlgEl = $('stamps'), linesEl = $('lines');
const sayEl = $('say'), againBtn = $('again');

// 0 (calm) to 1 (worst). The subliminal layer reads this.
function dread() {
  if (inYou) return 1;
  if (report.hidden) return 0;
  return Math.min(1, (step + dialogsDone / 6) / 12);
}

window.portalDread = function () { return dread(); };

function showReport() {
  gate.classList.add('out');
  setTimeout(function () {
    gate.hidden = true;
    report.hidden = false;
    $('taskName').textContent = 'Authenticity Report';
    type(sayEl, LINES[0], 38);
    startCounter();
    startSubliminal();
    timer = setTimeout(nextTag, T(FIRST_TAG_AFTER + 1500));
  }, 450);
}

function setConfidence(v) {
  confidence = Math.min(1e9, Math.round(v));
  $('confNum').textContent = confidence >= 100000 ? '∞' : confidence.toLocaleString('en-US');   // it overflows
  $('meterFill').style.width = '100%';
  $('meter').classList.toggle('low', confidence >= 400);           // the bar starts to glitch
  if (confidence >= 250) document.body.classList.add('dark');     // the whole screen goes black as the number climbs
  setHum(0.012 + dread() * 0.05);
}

function setVerdict(n) {
  $('verdict').textContent = new Array(Math.min(n, 5) + 1).join('✓ AUTHENTIC  ').trim();
}

// the "Authentication Checked" counter gets faster and faster
let counter = 2, rate = 1;
function startCounter() {
  setInterval(function () {
    if (finished) return;
    counter += Math.max(1, Math.round(rate * rnd(.5, 1.5)));
    $('count').textContent = counter;
  }, 140);
}

function makeBarcode() {
  let x = 0, bars = '';
  while (x < 96) {
    const w = rnd(1, 4);
    bars += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="26" fill="#000"/>';
    x += w + rnd(1, 3.5);
  }
  return '<svg viewBox="0 0 100 26" preserveAspectRatio="none">' + bars + '</svg>';
}

function makeQR() {
  const N = 19, c = 4;
  let r = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const finder = (x < 6 && y < 6) || (x > N - 7 && y < 6) || (x < 6 && y > N - 7);
    if (finder) continue;
    if (Math.random() < .5) r += '<rect x="' + x * c + '" y="' + y * c + '" width="' + c + '" height="' + c + '" fill="#000"/>';
  }
  [[0, 0], [N - 6, 0], [0, N - 6]].forEach(function (p) {
    r += '<rect x="' + p[0] * c + '" y="' + p[1] * c + '" width="' + 6 * c + '" height="' + 6 * c + '" fill="#000"/>' +
         '<rect x="' + (p[0] + 1) * c + '" y="' + (p[1] + 1) * c + '" width="' + 4 * c + '" height="' + 4 * c + '" fill="#fff"/>' +
         '<rect x="' + (p[0] + 2) * c + '" y="' + (p[1] + 2) * c + '" width="' + 2 * c + '" height="' + 2 * c + '" fill="#000"/>';
  });
  return '<svg viewBox="0 0 ' + N * c + ' ' + N * c + '" style="width:62%;margin:4px auto 0">' + r + '</svg>';
}

function bodyFor(t) {
  switch (t.body) {
    case 'SERIAL': {
      const wrong = typed && typed.toUpperCase() !== SERIAL;
      return '<p>' + (wrong ? '<s>' + typed.replace(/</g, '&lt;') + '</s><br>' : '') + SERIAL + '</p>' +
             (wrong ? '<p>(that code was wrong. we fixed it for you.)</p>' : '');
    }
    case 'BARCODE': return makeBarcode();
    case 'QR':      return makeQR();
    case 'HOLO':    return '<div class="holo"></div>';
    case 'SIGN':    return '<svg viewBox="0 0 100 30"><path d="M4 22 C12 2 18 2 20 14 S28 28 34 12 S44 4 48 18 S60 26 66 10 L96 18" fill="none" stroke="#000" stroke-width="1.6"/></svg>';
    default:        return '<p>' + t.body + '</p>';
  }
}

function spawnDialog() {
  if (dlgEl.children.length > 40) return;
  const e = ERRORS[Math.floor(Math.random() * ERRORS.length)];
  const d = document.createElement('div');
  d.className = 'dlg win';
  d.style.left = rnd(26, 74) + '%';
  d.style.top = rnd(24, 84) + '%';
  d.innerHTML = '<div class="title"><span>' + e[0] + '</span><span class="ctl"><b>×</b></span></div>' +
    '<div class="dlg-body"><span class="dlg-ico">×</span><span>' + e[1] + '</span></div>' +
    '<button class="btn" type="button">OK</button>';
  // pressing OK doesn't help
  d.querySelector('button').addEventListener('click', function () {
    d.remove(); beep(330, 80, 0.02);
    if (!finished) { spawnDialog(); spawnDialog(); }
  });
  dlgEl.appendChild(d);
  beep(rnd(300, 520), 90, 0.02);
}

const anchored = [];
(function followShirt() {
  requestAnimationFrame(followShirt);
  if (!window.Shirt3D || !window.Shirt3D.ready) return;
  anchored.forEach(function (a) {
    const p = window.Shirt3D.project(a.i);
    a.ln.setAttribute('x2', p.x.toFixed(2));
    a.ln.setAttribute('y2', p.y.toFixed(2));
  });
})();

// types the lines one after another, then glitches the last words, then carries on with the report
let accusing = false;
function accuse(a) {
  accusing = true;
  clearTimeout(timer);
  if (window.sfx) sfx('suspect');
  let i = 0;
  (function next() {
    if (finished) { accusing = false; return; }
    if (i >= a.lines.length) return setTimeout(function () { glitchOut(a.glitch); }, T(700));
    type(sayEl, a.lines[i++], 42, function () { setTimeout(next, T(1300)); });
  })();
}
function glitchOut(word) {
  // the word floods the screen: lots of copies, all readable, getting bigger, then it clears
  typeRun++;
  sayEl.textContent = word;
  sayEl.classList.add('glitch');
  if (window.sfx) sfx('accuse');
  const layer = document.createElement('div');
  layer.className = 'crowd';
  document.body.appendChild(layer);
  const COUNT = 46;
  let n = 0;
  const iv = setInterval(function () {
    for (let k = 0; k < 3 && n < COUNT; k++, n++) {
      const w = document.createElement('span');
      w.textContent = word;
      const big = n > COUNT - 8;                              // the last few are huge
      w.style.fontSize = (big ? rnd(54, 96) : rnd(18, 48)) + 'px';
      layer.appendChild(w);
      // spread across the WHOLE screen (measured after it is added so wide words don't all bunch on the left)
      const ww = w.offsetWidth, hh = w.offsetHeight, VW = window.innerWidth, VH = window.innerHeight;
      w.style.left = rnd(-0.15 * ww, VW - 0.85 * ww) + 'px';
      w.style.top = (((n * 7) % COUNT) / COUNT) * (VH - hh) + rnd(-12, 12) + 'px';
      w.style.rotate = (Math.random() < .3 ? rnd(-8, 8) : 0) + 'deg';
      if (Math.random() < .25) w.classList.add('w');          // some in white so it reads against the red
    }
    if (window.sfx) sfx('static');
    if (Math.random() < .3) {
      document.body.classList.add('invert');
      setTimeout(function () { document.body.classList.remove('invert'); }, 40);
    }
    if (n >= COUNT) {
      clearInterval(iv);
      setTimeout(function () {                                // hold it long enough to read, then wipe it
        layer.remove();
        sayEl.classList.remove('glitch');
        accusing = false;
        timer = setTimeout(nextTag, T(700));
      }, T(1600));
    }
  }, T(55));
}

function nextTag() {
  clearTimeout(timer);
  if (finished || accusing) return;

  if (step < TAGS.length) {
    const t = TAGS[step];
    const tag = document.createElement('div');
    tag.className = 'tag win';
    tag.style.left = t.at[0] + '%';
    tag.style.top = t.at[1] + '%';
    tag.style.setProperty('--r', '0deg');          // windows sit dead straight, like a real desktop
    tag.innerHTML = '<div class="title"><span>' + t.title + '.exe</span><span class="ctl"><b>×</b></span></div><div class="tb">' + bodyFor(t) + '</div>';
    tag.addEventListener('click', function () { type(sayEl, 'stop touching the evidence.', 30); beep(200, 100, 0.02); });
    tagsEl.appendChild(tag);
    beep(180, 60, 0.03);

    // a thin line from the window to somewhere on the shirt
    const side = t.at[0] < 50 ? -1 : 1;
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', t.at[0]); ln.setAttribute('y1', t.at[1]);
    ln.setAttribute('x2', 50 + side * rnd(3, 11)); ln.setAttribute('y2', rnd(36, 66));   // (flat picture) a random spot on the shirt
    ln.setAttribute('pathLength', 1);
    linesEl.appendChild(ln);
    anchored.push({ ln: ln, i: step });          // (3D shirt) shirt3d.js has a point for each window: follow it

    step++;
    const acc = ACCUSATIONS.find(function (a) { return a.atStep === step; });
    if (acc) { setConfidence(100 * Math.pow(CONF_GROWTH, step)); setVerdict(step + 1); rate = 1 + step * step * 1.6; return accuse(acc); }
    setConfidence(100 * Math.pow(CONF_GROWTH, step));
    setVerdict(step + 1);
    rate = 1 + step * step * 1.6;
    type(sayEl, LINES[Math.min(step, LINES.length - 1)], 34);
    if (step === 3) againBtn.hidden = false;
    timer = setTimeout(nextTag, T(TAG_EVERY * Math.pow(TAG_SPEEDUP, step)));
    return;
  }

  // the evidence is used up: error boxes pile onto the shirt until you can't see it
  if (dialogsDone < DIALOG_COUNT) {
    spawnDialog();
    dialogsDone++;
    const acc2 = ACCUSATIONS.find(function (a) { return a.atDialog === dialogsDone; });
    if (acc2) { accuse(acc2); return; }
    rate += 14;
    setConfidence(confidence * 1.15);
    if (dialogsDone % 6 === 1) type(sayEl, DIALOG_LINES[Math.floor(dialogsDone / 6) % DIALOG_LINES.length], 24);
    timer = setTimeout(nextTag, T(DIALOG_EVERY * Math.pow(.95, dialogsDone)));
    return;
  }

  conclude();
}

againBtn.addEventListener('click', function () {
  if (finished) return;
  againClicks++;
  setConfidence(confidence * AGAIN_BOOST);
  type(sayEl, AGAIN_LINES[Math.min(againClicks - 1, AGAIN_LINES.length - 1)], 28);
  nextTag();                                   // checking again only brings the next piece of "proof" sooner
});

/* =====================================================
   ACT 3 : IT TURNS ON YOU
   ===================================================== */
function conclude() {
  finished = true;
  againBtn.hidden = true;
  $('verdict').textContent = '✓ AUTHENTIC  ✓ AUTHENTIC  ✓ AUTHENTIC';     // it never doubts the shirt
  $('verdict').classList.add('bad');
  setConfidence(1e9);
  if (window.Shirt3D && window.Shirt3D.ready) window.Shirt3D.freezeBack();     // it turns its back on you
  type(sayEl, 'this product is real. it was always real.', 50, function () {
    setTimeout(toYou, T(2200));
  });
}

function toYou() {
  inYou = true;
  report.hidden = true;
  $('you').hidden = false;
  $('taskName').textContent = 'VERIFY.EXE';
  document.body.classList.add('dark');
  setHum(0.07);

  let name = '', face = null;
  try { name = localStorage.getItem('realStuf.visitorName') || ''; } catch (e) {}
  try { face = sessionStorage.getItem('realStuf.facePhoto'); } catch (e) {}

  // how long they have been on the site (the first page they opened this visit, or this page if that is missing)
  let since = Date.now() - performance.now();
  try { const f = parseInt(sessionStorage.getItem('realStuf.firstVisit'), 10); if (f && f < since) since = f; } catch (e) {}
  const secs = Math.max(1, Math.round((Date.now() - since) / 1000));
  const mins = Math.floor(secs / 60), rest = secs % 60;
  const spent = (mins ? mins + (mins === 1 ? ' minute' : ' minutes') + ' and ' : '') + rest + (rest === 1 ? ' second' : ' seconds');

  // three screens of text; each one clears before the next
  const groups = [
    ['the product is real.', 'we KNOW the product is real.', 'but its inconsistent with our system...', 'only YOU could have done this.'],
    ['we verified you before...', name ? 'you said your name was ' + name + '.' : 'you never told us your name.', 'we trust each other.'],
    ['but you snooped around for... too long...', spent + '...', 'what are you even doing here...']
  ];
  const yourSay = $('youSay');
  let g = 0, i = 0;
  (function nextLine() {
    if (g >= groups.length) return showCard();
    const lines = groups[g];
    if (i >= lines.length) { g++; i = 0; return setTimeout(function () { yourSay.textContent = ''; nextLine(); }, T(1800)); }
    const shown = i ? lines.slice(0, i).join('\n') + '\n' : '';
    typeAppend(yourSay, shown, lines[i], function () { i++; setTimeout(nextLine, T(900)); });
  })();

  openCams();                                  // ask for the camera now, so the live feeds are ready when the record appears

  function showCard() {
    $('idname').textContent = name || 'you';
    const ph = $('idphoto');
    if (face) { ph.style.backgroundImage = 'url(' + face + ')'; ph.style.transform = 'scaleX(-1)'; }
    else { ph.classList.add('nophoto'); ph.textContent = '?'; }
    $('idcard').hidden = false;
    beep(150, 300, 0.03, 'sawtooth');
    floodCams();
    // the empty space above the record: it asks, then offers the button
    type(yourSay, 'are you even real..?', 70, function () {
      setTimeout(function () { $('real').hidden = false; }, T(900));
    });
  }
}

/* =====================================================
   THE WATCHERS: the screen fills with the visitor's own live webcam
   If the camera is blocked it uses the photo taken earlier, and if there is none, the empty "person" boxes.
   ===================================================== */
const CAM_COUNT = 16;            // how many feeds end up on screen
const CAM_EVERY = 420;           // ms between each new feed appearing
let camStream = null, camAsked = false;
function openCams() {
  if (camAsked) return;
  camAsked = true;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(function (st) { camStream = st; }).catch(function () {});
}
window.addEventListener('pagehide', function () { if (camStream) camStream.getTracks().forEach(function (t) { t.stop(); }); });

function floodCams() {
  if (reduce) return;
  let layer = $('cams');
  if (!layer) { layer = document.createElement('div'); layer.id = 'cams'; const d = $('desk') || document.body; d.insertBefore(layer, d.firstChild); }
  let face = null;
  try { face = sessionStorage.getItem('realStuf.facePhoto'); } catch (e) {}
  const W = window.innerWidth, H = window.innerHeight;
  let n = 0;
  (function add() {
    if (n >= CAM_COUNT) return;
    const w = rnd(130, Math.min(340, W * 0.4)), h = w * 0.72;
    const tile = document.createElement('div');
    tile.className = 'cam';
    tile.style.width = w + 'px'; tile.style.height = h + 'px';
    // scatter them across the whole screen; the report window sits on top of the middle ones
    tile.style.left = rnd(-20, W - w + 20) + 'px';
    tile.style.top = rnd(-20, H - h + 20) + 'px';
    if (camStream) {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.autoplay = true; v.srcObject = camStream;
      v.play().catch(function () {});
      tile.appendChild(v);
    } else if (face) {
      tile.style.backgroundImage = 'url(' + face + ')';
      tile.classList.add('still');
    } else {
      tile.classList.add('empty');
      tile.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5c0-3.2 2.8-5 6.5-5s6.5 1.8 6.5 5z"/></svg>';
    }
    const rec = document.createElement('span'); rec.className = 'rec'; rec.textContent = 'LIVE';
    tile.appendChild(rec);
    layer.appendChild(tile);
    beep(rnd(120, 260), 50, 0.02, 'square');
    if (window.sfx) sfx('static');
    n++;
    setTimeout(add, T(CAM_EVERY * rnd(.6, 1.4)));
  })();
}

// types one new line after the lines already shown
function typeAppend(el, shown, line, done) {
  const run = ++typeRun;
  el.classList.add('typing');
  let n = 0;
  (function next() {
    if (run !== typeRun) return;
    n++;
    el.textContent = shown + line.slice(0, n);
    if (n >= line.length) { el.classList.remove('typing'); if (done) done(); return; }
    setTimeout(next, reduce ? 0 : 38 * rnd(.6, 1.3));
  })();
}

$('real').addEventListener('click', function () {
  $('real').hidden = true;
  const s = $('youSay');
  $('idcard').hidden = true;
  type(s, '...fine...we\'ll believe you...', 60, function () {
    setTimeout(function () {
      type(s, 'we just do not think you believe us.', 60, function () {
        setTimeout(function () { $('backShop').hidden = false; }, T(1500));
      });
    }, T(1400));
  });
});

/* =====================================================
   SUBLIMINAL
   Things you almost don't see. None of it is on during the wizard; it starts when the report opens
   and gets more frequent as dread() climbs from 0 to 1.
   ===================================================== */
const FLASH_WORDS = ['REAL', 'LEAVE', 'YOU', 'NOT YOU', 'FAKE', 'LOOK', 'IT IS ME', 'IM THE REAL ONE', 'STAY'];
const FLASH_GAP   = [5000, 12000];   // ms between flashes at the start (it speeds up as dread climbs)
const FLASH_MS    = [34, 70];        // how long one stays: 2 to 4 frames
const FACE_FLASH_AT = 0.5;           // dread level at which the visitor's own face starts flashing (once or twice)
const INVERT_CHANCE = 0.25;          // chance a flash is the whole screen inverting instead of a word

let subStarted = false, faceFlashes = 0;
function startSubliminal() {
  if (subStarted || reduce) return;
  subStarted = true;
  noiseLoop();
  scheduleFlash();
  scheduleClock();
  scheduleTitle();
  scheduleJolt();
}

// the grain: random grey pixels, redrawn ten times a second
function noiseLoop() {
  const c = $('noise'), g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  (function draw() {
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    setTimeout(function () { requestAnimationFrame(draw); }, 100);
  })();
}

function scheduleFlash() {
  const d = dread();
  const gap = rnd(FLASH_GAP[0], FLASH_GAP[1]) * (1 - d * 0.7);
  setTimeout(function () { flash(); scheduleFlash(); }, T(Math.max(1500, gap)));
}

function flash() {
  const sub = $('sub'), d = dread();
  const ms = rnd(FLASH_MS[0], FLASH_MS[1]);
  if (Math.random() < INVERT_CHANCE) {
    document.body.classList.add('invert');
    setTimeout(function () { document.body.classList.remove('invert'); }, ms);
    return;
  }
  if (window.Shirt3D && window.Shirt3D.ready && Math.random() < 0.4) window.Shirt3D.wire(ms * 2);   // the shirt flashes to wireframe
  let face = null;
  if (d >= FACE_FLASH_AT && faceFlashes < 2 && Math.random() < 0.5) {
    try { face = sessionStorage.getItem('realStuf.facePhoto'); } catch (e) {}
  }
  const el = document.createElement(face ? 'img' : 'span');
  if (face) {
    el.src = face;
    faceFlashes++;
    el.style.left = rnd(8, 70) + '%';
    el.style.top = rnd(8, 55) + '%';
  } else {
    el.textContent = pick(FLASH_WORDS);
    el.style.setProperty('--s', rnd(48, 150) + 'px');
    el.style.setProperty('--r', rnd(-8, 8) + 'deg');
    el.style.setProperty('--c', Math.random() < .5 ? '#fff' : '#ef1111');
    el.style.left = rnd(0, 40) + '%';
    el.style.top = rnd(5, 75) + '%';
  }
  sub.appendChild(el);
  setTimeout(function () { el.remove(); }, ms);
}

// the clock in the corner goes wrong
function scheduleClock() {
  const clock = $('clock');
  const wrong = ['12:00', '3:33', '--:--', '12:00', '4:44', 'YOU', '12:00'];
  setInterval(function () {
    const d = dread();
    clock.textContent = Math.random() < d ? pick(wrong) : '12:00';
  }, T(2500));
}

// one frame where a title bar says something else
function scheduleTitle() {
  setInterval(function () {
    if (Math.random() > 0.35) return;
    const bars = Array.prototype.slice.call(document.querySelectorAll('.win:not([hidden]) .tt'));
    if (!bars.length) return;
    const el = pick(bars), old = el.textContent;
    el.textContent = TITLE_BAR_FLASH;
    setTimeout(function () { el.textContent = old; }, 60);
  }, T(6000));
}

// the whole window jolts sideways for a moment
function scheduleJolt() {
  setTimeout(function () {
    const w = document.querySelector('.win.main:not([hidden]), .win.term:not([hidden])');
    if (w && Math.random() < dread() + 0.2) {
      w.classList.add('glitch');
      beep(90, 80, 0.03, 'sawtooth');
      setTimeout(function () { w.classList.remove('glitch'); }, 120);
    }
    scheduleJolt();
  }, T(rnd(3500, 9000)));
}

/* =====================================================
   THE CLINGY EXTRAS (they work at any point on this page)
   ===================================================== */
// the cursor leaves through the top of the window
let leaveSaid = false;
document.addEventListener('mouseleave', function (e) {
  if (e.clientY > 0 || leaveSaid || report.hidden || finished) return;
  leaveSaid = true;
  type(sayEl, LEAVE_LINE, 120);
});

// they switch tabs
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { document.title = HIDDEN_TITLE; }
  else {
    document.title = BASE_TITLE;
    if (!report.hidden && !finished) type(sayEl, BACK_LINE, 30);
  }
});
