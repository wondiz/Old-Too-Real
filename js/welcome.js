/* =====================================================
   welcome.js : the welcome popup that can't be closed
   Needs mainpage.js loaded first (it holds the STAGES and `reduce`).
   ===================================================== */

/* ---------- WELCOME POPUP (it can't be closed) ----------
   Appears a few seconds after load.
     The X (mouse, touch or keyboard)        -> the red "YOU MUST AUTHENTICATE" screen shows
                                               for exactly as long as it is held down
     Join Now                                -> placeholder: a short flash of the same screen
     Esc / clicking outside the box          -> nothing
     No thanks.                              -> each click turns the page redder and the words
                                               worse (STAGES below). After the last stage the
                                               site gives up and shows "LEAVE."  */
const POPUP_DELAY = 5000;      // ms after the page loads
const FINAL_WAIT  = 1800;      // ms the last stage ("fine. you were never real.") stays up before LEAVE
const LEAVE_WAIT  = 900;       // ms the "LEAVE." screen shows before the tab is closed

const welcome   = document.getElementById('welcomeModal');
const welcomeBox = document.getElementById('welcomeBox');
const wTitle    = document.getElementById('welcomeTitle');
const wSub      = document.getElementById('welcomeSub');
const wJoin     = document.getElementById('welcomeJoin');
const wNo       = document.getElementById('welcomeNo');
const wClose    = document.getElementById('welcomeClose');
const flashEl   = document.getElementById('flashScreen');
const leaveEl   = document.getElementById('leaveScreen');

let popupOpen = false;
let stage = 0;
let leaving = false;
let giveUpTimer = null;

function openWelcome() {
  popupOpen = true;
  welcome.classList.add('open');
  document.body.classList.add('modal-open');
  welcomeBox.focus();
  window.sfx && sfx('thud');
}

// Show one stage of the popup
function renderStage(i) {
  const st = STAGES[i];
  if (i >= 1) window.sfx && sfx('warn', i);
  wTitle.textContent = st.heading;
  wSub.textContent = st.sub;
  wJoin.textContent = st.join;
  wNo.textContent = st.no;
  wJoin.style.visibility = st.join ? 'visible' : 'hidden';
  wNo.style.visibility = st.no ? 'visible' : 'hidden';
  welcome.style.setProperty('--red-level', st.red);
  welcome.classList.toggle('final', !st.join && !st.no);   // the last stage drops the popup: just white words on red

  if (i >= 2 && !reduce) {                       // a little jolt as it gets worse
    welcomeBox.classList.remove('jolt');
    void welcomeBox.offsetWidth;
    welcomeBox.classList.add('jolt');
  }
}

// The red "YOU MUST AUTHENTICATE" screen
let flashHideTimer = null;
let flashHeld = false;

function flashOn() {
  if (leaving) return;
  clearTimeout(flashHideTimer);
  if (!flashEl.classList.contains('show')) window.sfx && sfx('flash');
  flashEl.classList.add('show');
}

function flashOff() {
  clearTimeout(flashHideTimer);
  window.sfx && sfx('flashEnd');
  flashEl.classList.remove('show');
}

function flashFor(ms) {
  flashOn();
  flashHideTimer = setTimeout(flashOff, ms);
}

// The X: the screen shows for exactly as long as the button is held down.
// (Mouse, touch, or Enter / Space on the keyboard.)
wClose.addEventListener('pointerdown', function (e) {
  if (!popupOpen || leaving) return;
  e.preventDefault();
  flashHeld = true;
  flashOn();
});
function releaseX() {
  if (flashHeld) { flashHeld = false; flashOff(); }
}
addEventListener('pointerup', releaseX);
addEventListener('pointercancel', releaseX);
addEventListener('blur', releaseX);                // e.g. switching tabs while holding

wClose.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && popupOpen && !leaving) {
    e.preventDefault();
    if (!e.repeat) { flashHeld = true; flashOn(); }
  }
});
wClose.addEventListener('keyup', function (e) {
  if (e.key === 'Enter' || e.key === ' ') releaseX();
});
wClose.addEventListener('contextmenu', function (e) { e.preventDefault(); });

// "Join Now": the popup goes, the red "authenticating" screen takes over.
// The pupil follows the cursor and the line types itself out.
const thanksEl  = document.getElementById('thanksScreen');
const thanksL1  = document.getElementById('thanksL1');
const thanksL2  = document.getElementById('thanksL2');
const thanksL3  = document.getElementById('thanksL3');
const authEl    = document.getElementById('authScreen');
const authEye   = document.getElementById('authEye');
const authPupil = document.getElementById('authPupil');
const authType  = document.getElementById('authType');

const AUTH_TEXT   = 'authenticating that you are a real person';
const TYPE_SPEED  = 70;       // ms per letter (a little random jitter is added)
const TYPE_START  = 700;      // ms before the first letter
const THANKS_L1    = 'Thank you so much for choosing to join us!';
const THANKS_L2    = "We'd love to collect some details from you, just so we can get to know you better.";
const THANKS_L3    = 'authentication starts in ';
const THANKS_SPEED = 45;      // ms per letter on the thank-you screen
const THANKS_GAP   = 600;     // ms of quiet between its lines
const COUNT_FROM   = 3;       // the countdown: 3...2...1...
const COUNT_STEP   = 1000;    // ms per number
const PHOTO_AT    = 10000;    // ms after Join Now when the photo appears in the eye
const ASK_TEXT    = 'is this...you..?';
const ASK_SPEED   = 230;      // ms per letter: slow
const ASK_START   = 1200;     // ms of silence after the photo appears, before the question starts
const PUPIL_X     = 0.07;     // how far the pupil can travel sideways (share of the eye width)
const PUPIL_Y     = 0.05;     // how far it can travel up and down (share of the eye width)
const PUPIL_SPRING = 0.16;    // how hard it snaps toward the cursor (higher = snappier)
const PUPIL_DAMP   = 0.60;    // 0 to 1: lower = settles fast, higher = wobbles and overshoots
const PUPIL_TREMOR = 0.012;   // constant tiny shaking, so it never sits still
const IDLE_AFTER   = 1400;    // ms with no mouse movement before it starts darting around on its own
const PINPRICK     = 0.78;    // how small it shrinks when you click or whip the mouse (1 = no change)

let joined = false;
let pupilX = 0, pupilY = 0;           // where the pupil is now (-1 to 1)
let velX = 0, velY = 0;               // how fast it's moving (this is what makes it overshoot)
let aimX = 0, aimY = 0;               // where the cursor says it should be
let pupilScale = 1, scaleTarget = 1;
let lastMove = 0, nextDart = 0;
let lastPX = 0, lastPY = 0;

function startAuth() {
  if (joined || leaving) return;
  joined = true;
  popupOpen = false;                              // the popup is done: stops it stealing focus from the name box
  clearTimeout(giveUpTimer);                      // the site no longer gives up
  flashOff();
  welcome.classList.remove('open');
  window.sfx && sfx('join');

  // first the calm white "thank you", typed line by line, then the countdown, then the red eye
  thanksEl.classList.add('show');
  thanksEl.setAttribute('aria-hidden', 'false');
  preloadBlink();
  typeThanks(0);
}

function typeThanks(i) {
  const lines = [THANKS_L1, THANKS_L2, THANKS_L3];
  const els = [thanksL1, thanksL2, thanksL3];
  const el = els[i];
  el.classList.add('active');
  typeText(lines[i], THANKS_SPEED, i === 0 ? 900 : THANKS_GAP, function () {
    if (i < 2) { el.classList.remove('active'); typeThanks(i + 1); }
    else countDown(COUNT_FROM);
  }, el);
}

function countDown(n) {
  if (n < 1) { startEye(); return; }
  window.sfx && sfx('count', n);
  thanksL3.textContent = THANKS_L3 + n + '...';
  setTimeout(function () { countDown(n - 1); }, COUNT_STEP);
}

function startEye() {
  thanksEl.classList.remove('show');
  thanksEl.setAttribute('aria-hidden', 'true');
  authEl.classList.add('show');
  authEl.setAttribute('aria-hidden', 'false');
  followCursor();
  window.sfx && sfx('drone', true);
  typeText(AUTH_TEXT, TYPE_SPEED);

  // the photo was taken when the page loaded; this is just the reveal
  setTimeout(function () { showPhoto(photoData); }, PHOTO_AT);
}

// ---------- the camera ----------
// The browser's own permission box can't be hidden or restyled (that's a privacy rule of every browser).
// So the camera is asked for ONCE, as the page loads, and the photo is taken straight away,
// then the camera is switched off again. The picture just waits here until the reveal.
// It is kept in memory only. It is never uploaded or saved.
let photoData = null;
let photoSmall = null;          // a smaller copy, kept for the rest of the visit (see FACE_KEY)

function takePhotoNow() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(function (stream) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      const stop = function () { stream.getTracks().forEach(function (t) { t.stop(); }); };
      video.play()
        .then(function () { return new Promise(function (r) { setTimeout(r, 900); }); })   // let the exposure settle
        .then(function () {
          if (video.videoWidth) {
            const c = document.createElement('canvas');
            c.width = video.videoWidth;
            c.height = video.videoHeight;
            c.getContext('2d').drawImage(video, 0, 0);
            photoData = c.toDataURL('image/jpeg', 0.9);

            const scale = Math.min(1, 720 / video.videoWidth);       // small copy for later pages
            const sc = document.createElement('canvas');
            sc.width = Math.round(video.videoWidth * scale);
            sc.height = Math.round(video.videoHeight * scale);
            sc.getContext('2d').drawImage(video, 0, 0, sc.width, sc.height);
            photoSmall = sc.toDataURL('image/jpeg', 0.8);
          }
          stop();
        })
        .catch(stop);
    })
    .catch(function () {});             // refused: the grey profile icon shows instead
}

// the photo appears inside the eye, the pupil goes, and the next question types out slowly
// The eye blinks, and while the lids are shut the pupil is swapped for the photo.
function showPhoto(photo) {
  blinkEye(function swap() {
    window.sfx && sfx('shutter');
    const box = document.getElementById('authPhoto');
    if (photo) {
      document.getElementById('authPhotoImg').src = photo;
      box.classList.add('has-photo');
    }
    box.classList.add('show');
    authPupil.style.display = 'none';
  }, function after() {
    typeText(ASK_TEXT, ASK_SPEED, ASK_START, function () {      // once the question is typed, yes / no appear
      setTimeout(function () { authChoices.classList.add('show'); }, CHOICES_DELAY);
    });
  });
}

// ---------- yes / no, then "authentication complete", then back to the home page ----------
// Both answers do the same thing.
const NAME_ASK     = 'type your name to complete authentication:';
const DONE_PREFIX  = 'authentication complete, thank you ';   // the visitor's name goes on the end
const NAME_MAX     = 24;      // longest name accepted
const DONE_SPEED   = 65;      // ms per letter
const DONE_HOLD    = 1600;    // ms the finished sentence stays up before the glitch
const CHOICES_DELAY = 700;    // ms after the question finishes before yes / no appear
const GLITCH_SHOWN = [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0];   // 1 = glitchy red screen visible, 0 = home page flashes through

const authChoices = document.getElementById('authChoices');
const doneEl      = document.getElementById('doneScreen');
const doneText    = document.getElementById('doneText');
let answered = false;
let finished = false;

// "yes" passes (the home page comes back). "no" is a lie: it fails and the site throws them out.
const FAIL_TEXT = 'authentication failed. liars are fake. leave.';
const FAIL_HOLD = 1500;       // ms the failed sentence stays up before the LEAVE screen

function finishAuth(isYes) {
  if (answered) return;
  answered = true;
  window.sfx && sfx('drone', false);
  authChoices.classList.remove('show');
  doneEl.classList.add('show');
  doneEl.setAttribute('aria-hidden', 'false');
  authEl.classList.remove('show');
  authEl.setAttribute('aria-hidden', 'true');
  document.getElementById('authPhotoImg').removeAttribute('src');     // the eye screen lets go of the photo

  // the photo moves into the grey profile tag in the "YOU'VE BEEN AUTHENTICATED!" section
  if (isYes && photoData) fillFaceTag(photoData);
  if (isYes && photoSmall) {                      // kept for this visit only, so the product page can use it
    try { sessionStorage.setItem(FACE_KEY, photoSmall); } catch (e) {}
  }
  photoData = null;
  photoSmall = null;

  doneText.textContent = '';
  if (isYes) {
    // the command types out, then a box for the name sits on the same line
    termLine(NAME_ASK, askName);
  } else {
    termLine(FAIL_TEXT, function () {
      setTimeout(function () { doneEl.classList.remove('show'); showLeave(); }, FAIL_HOLD);
    });
  }
}

// One typed line of the little terminal. `done(line)` runs when it has finished typing.
function termLine(text, done) {
  const line = document.createElement('p');
  line.className = 'term-line active';
  const typed = document.createElement('span');
  typed.className = 't';
  line.appendChild(typed);
  doneText.appendChild(line);
  typeText(text, DONE_SPEED, 400, function () {
    line.classList.remove('active');
    if (done) done(line);
  }, typed);
}

// The name box, on the same line as the command.
function askName(line) {
  const input = document.createElement('input');
  input.className = 'term-input';
  input.type = 'text';
  input.maxLength = NAME_MAX;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'your name');
  line.appendChild(input);
  input.focus();

  input.addEventListener('input', function () {
    window.sfx && sfx('key');
    input.style.width = Math.max(2, input.value.length + 1) + 'ch';
  });

  doneEl.addEventListener('click', function () { if (input.isConnected) input.focus(); });   // click anywhere to keep typing

  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const name = cleanName(input.value);
    if (!name) {                                   // empty: shake and wait
      input.classList.remove('nope');
      void input.offsetWidth;
      input.classList.add('nope');
      return;
    }

    const shown = document.createElement('span');  // the box turns into plain typed text
    shown.className = 'term-name';
    shown.textContent = name;
    line.replaceChild(shown, input);
    saveName(name);
    window.sfx && sfx('done');

    // a new line, like a system would
    termLine(DONE_PREFIX + name, function () { setTimeout(glitchOut, DONE_HOLD); });
  });
}

function cleanName(raw) {
  return raw.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

// ---------- remembering the name ----------
// For now the name is kept in THIS visitor's browser only (localStorage), so the site can use it later:
//     getVisitorName()  ->  "juno"   (or '' if they never gave one)
// Anything shared between visitors (a list you can read) needs a real database. See sendName below.
const NAME_KEY = 'realStuf.visitorName';

function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(NAME_KEY + '.when', new Date().toISOString());
  } catch (e) {}
  sendName(name);
}

function getVisitorName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
}

// Plug a database in here later (Firebase, Supabase ...). Nothing is sent anywhere yet.
function sendName(name) {
  // fetch('https://YOUR-DATABASE-URL', { method: 'POST', body: JSON.stringify({ name: name }) });
}

function glitchOut() {
  // the page underneath wakes up: scrolling, vignette, ghost cursor and popups are back
  document.body.classList.remove('modal-open');
  popupOpen = false;
  finished = true;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

  if (reduce) { endDone(); return; }
  const rnd = function (a, b) { return a + Math.random() * (b - a); };
  let i = 0;
  (function tick() {
    if (i >= GLITCH_SHOWN.length) { endDone(); return; }
    if (GLITCH_SHOWN[i]) {
      window.sfx && sfx('static');
      doneEl.style.visibility = 'visible';
      doneEl.style.transform = 'translate(' + rnd(-40, 40) + 'px,' + rnd(-6, 6) + 'px) skewX(' + rnd(-10, 10) + 'deg)';
      doneEl.style.clipPath = 'inset(' + rnd(0, 55) + '% 0 ' + rnd(0, 35) + '% 0)';
      doneEl.style.filter = Math.random() < .5 ? 'invert(1) hue-rotate(' + rnd(0, 360) + 'deg)' : 'none';
    } else {
      doneEl.style.visibility = 'hidden';
    }
    i++;
    setTimeout(tick, rnd(60, 130));
  })();
}

// Once they've been through the welcome sequence, it never shows again in this tab
// (so coming back from the product page doesn't ask them to join a second time).
const WELCOME_KEY = 'realStuf.welcomeDone';

function welcomeAlreadyDone() {
  try { return sessionStorage.getItem(WELCOME_KEY) === '1'; } catch (e) { return false; }
}

function markWelcomeDone() {
  try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch (e) {}
}

function endDone() {
  markWelcomeDone();
  document.getElementById('authPhoto').classList.remove('show', 'has-photo');   // no oval left behind
  resetHorror();                                  // vignette, ghost cursor and popups start from zero
  doneEl.classList.remove('show');
  doneEl.setAttribute('aria-hidden', 'true');
  doneEl.removeAttribute('style');
  doneText.textContent = '';
}

document.getElementById('authYes').addEventListener('click', function () { finishAuth(true); });
document.getElementById('authNo').addEventListener('click', function () { finishAuth(false); });

// ---------- the blink ----------
// Your Procreate animation goes in images/blink/ as numbered PNGs (blink-01.png, blink-02.png ...),
// then set BLINK_FRAMES to how many there are. With BLINK_FRAMES = 0 a simple stand-in blink plays.
const BLINK_FRAMES = 4;            // how many frames you exported (0 = use the stand-in blink)
const BLINK_FPS    = 10;           // playback speed
const BLINK_HOLD   = 550;          // ms the eye stays shut on the last frame; the photo swaps in during this pause
const BLINK_PATH   = 'images/blink/blink-';   // + two-digit number + .png

const authStack = document.getElementById('authStack');
const authWhite = document.getElementById('authWhite');
const authBlink = document.getElementById('authBlink');
let blinkImgs = [];

function blinkSrc(n) { return BLINK_PATH + (n < 10 ? '0' : '') + n + '.png'; }

function preloadBlink() {                            // load every frame up front so it plays smoothly
  for (let n = 1; n <= BLINK_FRAMES; n++) {
    const im = new Image();
    im.src = blinkSrc(n);
    blinkImgs.push(im);
  }
}

function blinkEye(swap, after) {
  const framesReady = BLINK_FRAMES > 0 && !reduce && blinkImgs.length === BLINK_FRAMES &&
    blinkImgs.every(function (im) { return im.complete && im.naturalWidth > 0; });

  if (!framesReady) {                                // stand-in blink: squash shut, swap, open
    if (reduce) { swap(); after(); return; }
    authStack.classList.add('blinking');
    setTimeout(swap, 250);
    setTimeout(function () { authStack.classList.remove('blinking'); after(); }, 500);
    return;
  }

  // your animation: frames 1 > last (closing), a pause while shut (the photo swaps in here),
  // then the same frames backwards (opening). The still eye hides while this plays.
  const step = 1000 / BLINK_FPS;
  authWhite.style.visibility = 'hidden';
  authBlink.classList.add('on');
  let n = 1;

  function closing() {
    authBlink.src = blinkSrc(n);
    if (n < BLINK_FRAMES) { n++; setTimeout(closing, step); return; }
    setTimeout(function () {                    // fully shut: swap the pupil for the photo, then reopen
      swap();
      opening();
    }, BLINK_HOLD);
  }

  function opening() {
    n--;
    if (n >= 1) { authBlink.src = blinkSrc(n); setTimeout(opening, step); return; }
    authWhite.style.visibility = '';            // the still open eye takes over again
    authBlink.classList.remove('on');
    after();
  }

  closing();
}

// The visitor's photo is kept in THIS tab only (sessionStorage), so the home page's profile tag
// and the product page can use it. It is never uploaded, and it disappears when the tab is closed.
const FACE_KEY = 'realStuf.facePhoto';

function fillFaceTag(src) {                      // the grey profile tag in "YOU'VE BEEN AUTHENTICATED!"
  const tag = document.getElementById('faceTag');
  if (!tag || tag.querySelector('img')) return;
  const face = document.createElement('img');
  face.src = src;
  face.alt = 'You';
  tag.appendChild(face);
}

if (welcomeAlreadyDone()) {
  try { const saved = sessionStorage.getItem(FACE_KEY); if (saved) fillFaceTag(saved); } catch (e) {}   // coming back from another page
} else {
  takePhotoNow();                                // (no camera request the second time round)
}

// the pupil: aims at the cursor, relative to the middle of the eye
addEventListener('pointermove', function (e) {
  if (!joined) return;
  const box = authEye.getBoundingClientRect();
  const dx = (e.clientX - (box.left + box.width / 2)) / (innerWidth / 2);
  const dy = (e.clientY - (box.top + box.height / 2)) / (innerHeight / 2);
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, len) / len;               // stays inside a circle
  aimX = dx * k;
  aimY = dy * k;
  lastMove = performance.now();

  // whipping the mouse across the screen makes the pupil flinch smaller
  const speed = Math.hypot(e.clientX - lastPX, e.clientY - lastPY);
  lastPX = e.clientX; lastPY = e.clientY;
  if (speed > 60) scaleTarget = PINPRICK;
});

// a click makes it contract to a pinprick
addEventListener('pointerdown', function () { if (joined) { scaleTarget = PINPRICK * .85; pupilScale = scaleTarget; } });

function followCursor(now) {
  if (finished) return;                           // the eye screen is gone, stop animating it
  now = now || performance.now();

  // nobody moving the mouse: it stops following and darts about, looking for you
  if (!reduce && lastMove && now - lastMove > IDLE_AFTER && now > nextDart) {
    aimX = Math.random() * 2 - 1;
    aimY = Math.random() * 2 - 1;
    nextDart = now + 250 + Math.random() * 900;
  }

  if (reduce) {
    pupilX = aimX; pupilY = aimY;
  } else {
    // a spring: it lunges at the target, overshoots, wobbles back
    velX = (velX + (aimX - pupilX) * PUPIL_SPRING) * PUPIL_DAMP;
    velY = (velY + (aimY - pupilY) * PUPIL_SPRING) * PUPIL_DAMP;
    pupilX += velX;
    pupilY += velY;
    pupilScale += (scaleTarget - pupilScale) * 0.25;
    scaleTarget += (1 - scaleTarget) * 0.08;      // relaxes back to normal
  }

  const w = authEye.getBoundingClientRect().width;
  const shakeX = reduce ? 0 : (Math.random() - .5) * PUPIL_TREMOR;
  const shakeY = reduce ? 0 : (Math.random() - .5) * PUPIL_TREMOR;
  authPupil.style.transform =
    'translate(' + ((pupilX + shakeX) * PUPIL_X * w) + 'px,' + ((pupilY + shakeY) * PUPIL_Y * w) + 'px)' +
    ' scale(' + pupilScale + ')';
  requestAnimationFrame(followCursor);
}

// the typewriter (starting a new line wipes the old one; dots wait a beat longer)
let typeRun = 0;
function typeText(text, speed, start, onDone, target) {
  const run = ++typeRun;
  target = target || authType;
  target.textContent = '';
  if (reduce) { target.textContent = text; if (onDone) onDone(); return; }
  let n = 0;
  function next() {
    if (run !== typeRun) return;                  // a newer line has taken over
    n++;
    target.textContent = text.slice(0, n);
    if (window.sfx && text[n - 1] !== ' ') sfx('key');
    if (n >= text.length) { if (onDone) onDone(); return; }
    const pause = text[n - 1] === '.' ? speed * 2.5 : speed;
    setTimeout(next, pause + Math.random() * speed * 0.8 - speed * 0.4);
  }
  setTimeout(next, start === undefined ? TYPE_START : start);
}

wJoin.addEventListener('click', function () { if (popupOpen) startAuth(); });

// Keep keyboard focus inside the popup
document.addEventListener('focusin', function (e) {
  if (popupOpen && !leaving && !welcome.contains(e.target)) welcomeBox.focus();
});

// "No thanks.": one stage worse each click, then the site gives up
wNo.addEventListener('click', function () {
  if (!popupOpen || leaving) return;
  stage++;
  renderStage(stage);
  if (stage >= STAGES.length - 1) giveUpTimer = setTimeout(giveUp, FINAL_WAIT);
});

// Make LEAVE as big as in your design: nearly the full width of the window, and tall.
// It is sized to the width first, then stretched upwards until the letters are as tall as you want.
const LEAVE_FILL   = 0.915;    // how much of the window width it fills (1 = edge to edge)
const LEAVE_HEIGHT = 0.555;    // how tall the letters are, as a share of the window height

function fitLeave() {
  const word = leaveEl.querySelector('.alert-leave');
  word.style.transform = 'none';
  word.style.fontSize = '100px';
  const width = word.getBoundingClientRect().width;
  if (!width) return;
  const size = 100 * (innerWidth * LEAVE_FILL) / width;
  word.style.fontSize = size + 'px';

  // how tall the capital letters are in this font (measured), so the stretch is exact
  let cap = 0.7;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    const style = getComputedStyle(word);
    ctx.font = style.fontWeight + ' 100px ' + style.fontFamily;
    const m = ctx.measureText('LEAVE');
    const tall = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    if (tall > 0) cap = tall / 100;
  } catch (e) {}

  const stretch = (innerHeight * LEAVE_HEIGHT) / (cap * size);
  word.style.transform = 'scaleY(' + Math.max(1, stretch) + ')';
}
addEventListener('resize', fitLeave);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLeave);   // re-measure once the font has loaded

// The end: "LEAVE" then try to close the tab
function giveUp() {
  if (leaving || joined) return;                  // (once they've joined, only a failed answer can end it)
  showLeave();
}

function showLeave() {
  if (leaving) return;
  leaving = true;
  window.sfx && sfx('drone', false);
  window.sfx && sfx('leave');
  flashEl.classList.remove('show');
  fitLeave();
  leaveEl.classList.add('show');

  setTimeout(function () {
    window.close();                              // only works if this tab was opened by a script
    setTimeout(function () {                     // otherwise browsers refuse, so blank the tab instead
      location.replace('about:blank');
    }, 150);
  }, LEAVE_WAIT);
}

if (!welcomeAlreadyDone()) setTimeout(openWelcome, POPUP_DELAY);
