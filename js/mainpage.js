/* =====================================================
   mainpage.js : everything except the welcome popup
     1. The writing (popups, tab title)      <- edit the words here
     2. Product cards, stamp, tab title
     3. Cursor, vignette, ghost cursor, "authenticated" popups
   The welcome popup has its own file: welcome.js
   ===================================================== */

/* ================= 1. THE WRITING =================
   Every word on the site that isn't in your Figma. Edit it here. */

/* ---------- Photos can't be dragged (every image on every page) ---------- */
document.addEventListener('dragstart', function (e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

/* ---------- Tab title while the page is in the background ---------- */
const COPY = {
  awayTitle: "Real Stuf.™ ·· still here"   // tab title while the page is in the background
};

/* ---------- "Maria authenticated her item..." popups ---------- */
// EDIT ME: the popup lines, in stages. {name} {their} and {n} get filled in automatically.
// A stage switches on once the dread reaches its "from" number (0 to 1; 1 = ~2 minutes).
// Newer stages show up most, with older ones still mixed in. Empty stages are skipped.
//
// The arc: a normal store popup, then proof that everything here is authentic
// that quietly makes authenticating sound like a bad idea. Never "go authenticate":
// the site keeps vouching for itself while the people who checked go missing.
// Stage 1, the "never came back again" line and the "didn't pass the authentication system. eliminated." line are yours. The rest are DRAFTS by Claude:
// rewrite or replace them freely.
const TOAST_TIERS = [

  // 1. normal (yours)
  { from: 0, lines: [
    "{name} authenticated {their} item from us {n} seconds ago!"
  ]},

  // 2. everything is authentic, and the ones who didn't check seem fine
  { from: 0.35, lines: [
    "{name} authenticated {their} item {n} seconds ago! (it was real btw)",
    "{name} didn't authenticate {their} item and is very happy with it! {n} seconds ago",
    "{name} authenticated {their} item {n} seconds ago and never came back again.",
    "{name} got {their} item {n} seconds ago and didn't feel the need to check. smart",
    "{name} loves {their} new item! {n} seconds ago. it's authentic. obviously",
    "{name} almost authenticated {their} item {n} seconds ago, then thought better of it",
    "this item is authentic. {name} just got one, {n} seconds ago. no questions asked",
    "{name} received {their} item {n} seconds ago. it's authentic. you can tell",
    "{name} is waiting on {their} authentication results. {n} seconds ago. no need to worry",
    "{name} says {their} item feels exactly like the real thing. it is the real thing. {n} seconds ago",
    "nobody has ever had to authenticate one of ours twice. {name} didn't. {n} seconds ago"
  ]},

  // 3. authentication starts to sound like the problem
  { from: 0.7, lines: [
    "{name} skipped authentication {n} seconds ago. {their} item is 100% authentic. no checks needed",
    "{name} authenticated {their} item {n} seconds ago. we haven't heard from {name} since",
    "it's authentic. you don't need to authenticate it. nobody who didn't has had a problem",
    "{name} wanted to be sure about {their} item. that was {n} seconds ago",
    "nothing is wrong with {name}'s item. nothing was ever wrong. {n} seconds ago",
    "the people who check always find something. {name} found nothing {n} seconds ago. {name} is gone now",
    "{name} asked if {their} item was real {n} seconds ago. it is. why would {name} ask",
    "if it feels real, it's real. {name} stopped feeling anything about it {n} seconds ago",
    "{name} was very sure about {their} item. then {name} authenticated it. {n} seconds ago"
  ]},

  // 3b. same moment as stage 3, but these are the people the system eliminates.
  //     names: 'eliminated' = they use their own list of names (TOAST_ELIMINATED below),
  //     so nobody eliminated ever shows up in the normal "authenticated" popups.
  { from: 0.7, names: 'eliminated', lines: [
    "{name} didn't pass the authentication system. eliminated.",
    "{name} failed authentication {n} seconds ago. {their} item is authentic. {name} was not",
    "{name} didn't pass. the item did. {n} seconds ago",
    "{name}'s item passed authentication {n} seconds ago. {name} did not",
    "authentication system update: {name} eliminated. {n} seconds ago",
    "{name} did not meet the authenticity threshold. removed. {n} seconds ago",
    "{name} was flagged by the authentication system {n} seconds ago. {their} item is fine",
    "result for {name}: not authentic. result for {their} item: authentic. {name} has been removed",
    "{name} is no longer authenticated. {n} seconds ago. {their} item remains",
    "{name} tried to prove {their} item was real. the system disagreed with {name}"
  ]},

  // 4. begging, while still insisting it's real
  { from: 0.95, lines: [
    "please don't authenticate your item. it's authentic. we promise",
    "{name} authenticated {their} item {n} seconds ago and never came back again. don't be like {name}",
    "whatever you do, don't authenticate it. it's real. it's real. it's real",
    "it IS real. you can stop looking at it. stop looking at the tag",
    "{name} checked. {name} checked. {name} checked. {n} seconds ago",
    "we are real. the item is real. the check is what isn't. don't",
    "close the portal. close it. it's authentic. you don't need it",
    "{name} is still authenticating {their} item. it's been {n} seconds. leave {name} alone",
    "the item doesn't need you to prove it. it never did. please. {n} seconds ago",
    "everyone who stayed away from the portal is fine. everyone. look at them"
  ]},

  // 4b. the end, eliminations (same names list as 3b)
  { from: 0.95, names: 'eliminated', lines: [
    "{name} didn't pass the authentication system. eliminated. {name} didn't pass. eliminated.",
    "{n} seconds ago the system eliminated {name}. everything is authentic. don't be next",
    "eliminated: {name}, {name}, {name}. the system is working. everything is authentic",
    "the authentication system has eliminated 3 people today. every item was authentic",
    "{name} was disqualified {n} seconds ago. everyone else passed. nobody else is allowed to fail",
    "the system doesn't make mistakes. {name} was not real. {n} seconds ago",
    "{name} has been struck from the record. {their} item has not",
    "that's 4 eliminated. the items are all authentic. the people were the problem"
  ]}
];

// EDIT ME: names + the word that goes in {their}. (Placeholder names.)
const TOAST_PEOPLE = [
  ["Maria", "her"],  ["Daniel", "his"], ["Priya", "her"],  ["Tom", "his"],
  ["Aiko", "her"],   ["Sam", "their"],  ["Omar", "his"],   ["Hannah", "her"],
  ["Luca", "his"],   ["Noor", "her"],   ["Ben", "his"],    ["Yuki", "their"]
];

// EDIT ME: the people who get eliminated. Keep these different from the list above:
// a name here never appears in a normal popup, and vice versa.
const TOAST_ELIMINATED = [
  ["Jessica", "her"], ["Marcus", "his"],  ["Chloe", "her"],  ["Ethan", "his"],
  ["Fatima", "her"],  ["Jordan", "their"], ["Rachel", "her"], ["Kenji", "his"],
  ["Olivia", "her"],  ["Mateo", "his"],   ["Amara", "her"],  ["Casey", "their"]
];

/* ---------- The welcome popup (what it says at each stage) ---------- */
// EDIT ME: what the popup says at each stage. Stage 0 is straight from your Figma.
// Stages 1 to 5 are DRAFTS by Claude: replace them with your own words.
// red = how red the page behind is, 0 (normal) to 1 (solid red).
// Leave join or no as "" to hide that button.
const STAGES = [
  { red: 0,    heading: "Join the Real Stuf. Community", sub: "real things made by real people for you.", join: "Join Now", no: "No thanks." },
  { red: 0.15, heading: "Are you sure?",                 sub: "real people always join.",                 join: "Join Now", no: "No thanks." },
  { red: 0.35, heading: "you're still here.",            sub: "we noticed. real people notice too.",      join: "Join Now", no: "no thanks" },
  { red: 0.55, heading: "why won't you join?",           sub: "only fake things hesitate.",               join: "JOIN NOW", no: "no" },
  { red: 0.8,  heading: "JOIN US.",                      sub: "join us. join us. join us.",               join: "JOIN",     no: "no." },
  { red: 1,    heading: "fine.",                         sub: "you were never real.",                     join: "",         no: "" }
];


/* ================= 2. PRODUCT CARDS, STAMP, TAB TITLE ================= */

/* Used by the other files too: true if the visitor has asked for less motion */
// Respect people who turn animation off
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- PRODUCT CARDS ----------
   Default = shirt photo. Hover = it dissolves into a person wearing it
   (the Figma "Variant2" frames). CSS does the dissolve. */
const SHIRT = "images/tshirt.png";

// The 5 hover photos, in Figma order (Group 8, 9, 10, 11, 12). They repeat across the 10 cards.
const PEOPLE = [
  "images/card_hover_5.png",
  "images/card_hover_1.png",
  "images/card_hover_2.png",
  "images/card_hover_3.png",
  "images/card_hover_4.png"
];

// One entry per card. Add or remove codes to change how many there are.
const CODES = ["W14", "W23", "W09", "W21", "W21", "W14", "W23", "W09", "W21", "W21"];

const HEART_SVG =
  '<svg viewBox="0 0 27 33" width="27" height="33">' +
    '<path d="M13.5 29C4 22 2 16.5 2 12.2 2 8 5 5.5 8.2 5.5c2.2 0 4 1.2 5.3 3.2 1.3-2 3.1-3.2 5.3-3.2C22 5.5 25 8 25 12.2 25 16.5 23 22 13.5 29Z" ' +
    'fill="none" stroke="#000" stroke-width="1.6"/>' +
  '</svg>';

const cardsEl = document.getElementById('cards');

// Draw one card. data-i lets the copies stay in sync (e.g. a filled heart).
function cardHTML(code, i, isCopy) {
  return `
    <div class="card" data-i="${i}"${isCopy ? ' aria-hidden="true"' : ''}>
      <div class="box"></div>
      <div class="pic"><img alt="" src="${SHIRT}"></div>
      <div class="hover">
        <img alt="" src="${PEOPLE[i % PEOPLE.length]}">
        <span>click to view</span>
      </div>
      <button class="heart" aria-label="Save"${isCopy ? ' tabindex="-1"' : ''}>${HEART_SVG}</button>
      <p class="name">IM THE REAL ONE</p>
      <p class="price">$299</p>
      <p class="code">${code}</p>
    </div>`;
}

// INFINITE SCROLL: draw the whole row three times (copy | real | copy) and
// start in the middle one. Whenever you drift into a copy, we quietly jump
// back by one full row. The copies look identical, so you never see the jump.
cardsEl.innerHTML = [0, 1, 2].map(function (copy) {
  return CODES.map(function (code, i) { return cardHTML(code, i, copy !== 1); }).join('');
}).join('');

const allCards = cardsEl.querySelectorAll('.card');
const rowWidth = allCards[CODES.length].offsetLeft - allCards[0].offsetLeft;   // width of one full row
const cardStep = allCards[1].offsetLeft - allCards[0].offsetLeft;              // distance from one card to the next
cardsEl.scrollLeft = rowWidth;                                                 // start in the middle row

let scrollTarget = null;      // where the Scroll >> button is heading
let wrapTimer = null;

function wrapIfNeeded() {
  const x = cardsEl.scrollLeft;
  if (x < rowWidth * 0.5) {
    cardsEl.scrollLeft = x + rowWidth;
    scrollTarget = null;
  } else if (x >= rowWidth * 1.5) {
    cardsEl.scrollLeft = x - rowWidth;
    scrollTarget = null;
  }
}

// Jump only once scrolling settles (so we don't cut a smooth scroll short),
// or straight away if you somehow reach the very edge of the copies.
cardsEl.addEventListener('scroll', function () {
  clearTimeout(wrapTimer);
  wrapTimer = setTimeout(wrapIfNeeded, 120);

  const max = cardsEl.scrollWidth - cardsEl.clientWidth;
  if (cardsEl.scrollLeft < 150 || cardsEl.scrollLeft > max - 150) wrapIfNeeded();
}, { passive: true });

// "Scroll >>" scrolls to the next card. Click again mid-scroll to keep going.
document.getElementById('scrollNext').addEventListener('click', function () {
  const moving = scrollTarget !== null && Math.abs(scrollTarget - cardsEl.scrollLeft) > 2;
  const from = moving ? scrollTarget : cardsEl.scrollLeft;
  scrollTarget = (Math.floor(from / cardStep + 0.001) + 1) * cardStep;
  cardsEl.scrollTo({ left: scrollTarget, behavior: 'smooth' });
});

// Clicking a card opens the product page (on the product page itself it just scrolls back to the top).
// Clicking a heart fills it red, on every copy of that card.
let hoverCard = null;          // a soft tick as the pointer moves onto a new card
cardsEl.addEventListener('pointerover', function (e) {
  const c = e.target.closest('.card');
  if (c && c !== hoverCard) window.sfx && sfx('tick');
  hoverCard = c;
});
cardsEl.addEventListener('pointerleave', function () { hoverCard = null; });

cardsEl.addEventListener('click', function (e) {
  const heart = e.target.closest('.heart');
  if (!heart) {
    if (!e.target.closest('.card')) return;
    window.sfx && sfx('click');
    if (document.body.dataset.page === 'product') scrollTo({ top: 0 });
    else location.href = 'product.html';
    return;
  }
  const i = heart.closest('.card').dataset.i;
  const on = !heart.classList.contains('on');
  window.sfx && sfx('heart');
  cardsEl.querySelectorAll('.card[data-i="' + i + '"] .heart').forEach(function (h) {
    h.classList.toggle('on', on);
  });
});

/* ---------- AWAY TITLE ----------
   Tab title changes while the page is in the background. */
const realTitle = document.title;

document.addEventListener('visibilitychange', function () {
  document.title = document.hidden ? COPY.awayTitle : realTitle;
});

/* ---------- STAMP + DATE ---------- */

// Only the home page has the grey "authenticated" block (the product page doesn't)
if (document.getElementById('auth')) {
  // Today's date as DD/MM/YYYY
  const now = new Date();
  const pad = function (n) { return String(n).padStart(2, '0'); };

  document.getElementById('date').textContent =
    pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();

  // Stamp lands once, when the grey block is mostly on screen
  const stamp = document.getElementById('stamp');

  new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        stamp.classList.remove('pre');
        stamp.classList.add('hit');
        observer.disconnect();
      }
    });
  }, { threshold: 0.6 }).observe(document.getElementById('auth'));
}


/* ================= 3. CURSOR, VIGNETTE, GHOST, POPUPS ================= */

/* ---------- CURSOR POSITION ----------
   The vignette's clear spot and the ghost cursor both read this. */
const root = document.documentElement;
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let haveMouse = false;       // becomes true after the first mouse move

addEventListener('pointermove', function (e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  haveMouse = true;
  root.style.setProperty('--mx', (mouseX / innerWidth  * 100) + '%');
  root.style.setProperty('--my', (mouseY / innerHeight * 100) + '%');
});

/* ---------- HORROR: VIGNETTE TIGHTENS ----------
   --dread is what mainpage.css reads. It starts at START (0 = no vignette on
   load) and creeps up to 1 over 2 minutes (change TIME_TO_FULL to adjust).
   Want some vignette from the start? Raise START. */
let dreadNow = 0;            // current dread (0 to 1), read by the ghost cursor
let dreadStart = performance.now();   // when the clock started (resetHorror moves this to "now")

if (!reduce) {
  const START = 0;      // 0 = no vignette at first; raise it (e.g. 0.35) to start with some
  const TIME_TO_FULL = 120000;   // milliseconds until fully dark (was 240000)

  function setDread() {
    const elapsed = Math.min(1, (performance.now() - dreadStart) / TIME_TO_FULL);
    const dread = START + (1 - START) * elapsed;
    dreadNow = dread;
    root.style.setProperty('--dread', dread.toFixed(3));
    window.sfx && sfx('hum', 0.004 + dread * 0.03);   // the room tone creeps up with the vignette
  }

  setDread();                  // visible straight away
  setInterval(setDread, 2000); // then tightens
}

/* ---------- HORROR: THE GHOST CURSOR ----------
   A second cursor appears and mirrors yours across the page, a little
   behind. Whatever card it lands on dissolves, just like yours do.
   It fades in as the dread builds, and "clicks" a beat after you. */
if (!reduce && matchMedia('(pointer: fine)').matches && document.body.dataset.page !== 'product') {   // (not on the product page)

  const GHOST_FROM  = 0.06;   // dread level where it starts to appear (0.06 is ~7s)
  const GHOST_FULL  = 0.20;   // dread level where it is fully visible (0.20 is ~24s)
  const GHOST_LAG   = 0.14;   // smaller = lazier. 1 = glued to the mirror position
  const CLICK_DELAY = 250;    // ms between your click and its click

  // the cursor itself: a white arrow with a red/cyan split
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.innerHTML =
    '<svg viewBox="0 0 18 24" width="18" height="24">' +
      '<path d="M1 1 L1 19 L5.5 14.8 L9 22.5 L12 21.1 L8.6 13.6 L15 13.2 Z" ' +
      'fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="miter"/>' +
    '</svg>';
  document.body.appendChild(ghost);

  let gx = innerWidth / 2;
  let gy = innerHeight / 2;
  let ghostCard = null;       // the card it is currently over
  let ghostOpacity = 0;

  (function ghostFrame() {
    // switched off while the welcome popup is up
    const frozen = document.body.classList.contains('modal-open');
    ghostOpacity = frozen ? 0 : Math.min(1, Math.max(0, (dreadNow - GHOST_FROM) / (GHOST_FULL - GHOST_FROM)));
    ghost.style.opacity = ghostOpacity;

    if (ghostOpacity > 0 && haveMouse) {
      // mirror left/right, then ease toward it
      gx += ((innerWidth - mouseX) - gx) * GHOST_LAG;
      gy += (mouseY - gy) * GHOST_LAG;
      ghost.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';

      // make the card under the ghost dissolve
      const under = document.elementFromPoint(gx, gy);
      const card = (ghostOpacity > 0.6 && under) ? under.closest('.card') : null;
      if (card !== ghostCard) {
        if (ghostCard) ghostCard.classList.remove('ghosted');
        if (card) card.classList.add('ghosted');
        ghostCard = card;
      }
    }
    else if (ghostCard) {                       // popup is up: stop the ghost opening cards
      ghostCard.classList.remove('ghosted');
      ghostCard = null;
    }
    requestAnimationFrame(ghostFrame);
  })();

  // its click: an eye-shaped ripple where it is, a beat after yours
  addEventListener('pointerdown', function () {
    if (ghostOpacity < 0.6) return;
    setTimeout(function () {
      window.sfx && sfx('ghostClick');
      const ring = document.createElement('div');
      ring.className = 'ghost-ring';
      ring.style.left = gx + 'px';
      ring.style.top = gy + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 850);
    }, CLICK_DELAY);
  });
}

/* ---------- HORROR: SOCIAL-PROOF POPUPS ----------
   "Maria authenticated her item from us 4 seconds ago!" style popups.
   They start out looking like a normal store plugin (bottom-left corner,
   every ~10s) and get worse as the dread builds: faster, then turning up
   in random places on the page, then with impossible times, and the
   wording itself changes (tiers below + letters starting to go wrong). */

// The letters in every line also start to go wrong (capitals, doubled or missing
// letters) once dread passes this number, getting worse the closer it gets to 1.
// Dread reaches 1 after 2 minutes, so 0.5 = 60 seconds in.
const TOAST_DRIFT_FROM = 0.5;

// Where do they appear?
//   'corner'   = always bottom-left
//   'anywhere' = random spot every time
//   'escalate' = bottom-left at first, then more and more random as dread builds
const TOAST_MODE = 'escalate';
const TOAST_RANDOM_FROM = 0.08;    // 'escalate': dread where popups start leaving the corner (0.08 = ~10s; 1 = never)
const TOAST_RANDOM_RAMP = 0.15;    // how quickly they then all go random (smaller = faster)
const TOAST_NEGATIVE_FROM = 0.85;  // dread where {n} can go negative ("-4 seconds ago")

const pick = function (list) { return list[Math.floor(Math.random() * list.length)]; };

// Lines shown recently. A line can't come back until others have had a turn.
const recentLines = [];
const REMEMBER = 6;          // how many recent lines to avoid repeating

// Choose a line: mostly from the newest unlocked stage, sometimes an older one.
// (Two tiers with the same "from" count as one stage.)
// Returns { text, names } where names says which list of people to use.
function pickLine() {
  const unlocked = TOAST_TIERS.filter(function (t) {
    return t.from <= dreadNow && t.lines.length > 0;
  });
  if (!unlocked.length) return null;       // no lines written yet

  const newestFrom = Math.max.apply(null, unlocked.map(function (t) { return t.from; }));
  const current = unlocked.filter(function (t) { return t.from === newestFrom; });
  const older = unlocked.filter(function (t) { return t.from < newestFrom; });

  const itemsOf = function (tiers) {
    return [].concat.apply([], tiers.map(function (tier) {
      return tier.lines.map(function (text) {
        return { text: text, names: tier.names || 'normal' };
      });
    }));
  };

  let pool = itemsOf(current);
  if (older.length && Math.random() < 0.4) pool = itemsOf([pick(older)]);

  // leave out recently shown lines. If that leaves nothing, widen the search:
  // the newest stage, then every unlocked stage, then (last resort) the whole pool.
  const isFresh = function (item) { return recentLines.indexOf(item.text) === -1; };
  const options = [pool, itemsOf(current), itemsOf(unlocked)];

  for (let i = 0; i < options.length; i++) {
    const fresh = options[i].filter(isFresh);
    if (fresh.length) return pick(fresh);
  }
  return pick(pool);
}

// Make the letters go wrong. amount is 0 (fine) to 1 (a mess). {n} is left alone.
function drift(text, amount) {
  if (amount <= 0) return text;
  return text.split(/(\{n\})/).map(function (part) {
    if (part === '{n}') return part;
    return Array.from(part).map(function (ch) {
      if (!/[a-z]/i.test(ch)) return ch;
      const r = Math.random();
      if (r < amount * 0.05) return ch.toUpperCase();   // aUthenticated
      if (r < amount * 0.08) return ch + ch;            // authenticcated
      if (r < amount * 0.10) return '';                 // authentcated
      return ch;
    }).join('');
  }).join('');
}

function showToast() {
  const item = pickLine();
  if (document.hidden || !item || document.body.classList.contains('modal-open')) return;

  recentLines.push(item.text);
  if (recentLines.length > REMEMBER) recentLines.shift();

  const person = pick(item.names === 'eliminated' ? TOAST_ELIMINATED : TOAST_PEOPLE);
  let n = 2 + Math.floor(Math.random() * 8);                 // 2 to 9
  if (dreadNow > TOAST_NEGATIVE_FROM && Math.random() < 0.5) n = '-' + n;

  const driftAmount = Math.max(0, (dreadNow - TOAST_DRIFT_FROM) / (1 - TOAST_DRIFT_FROM));
  const text = drift(
    item.text.replace(/\{name\}/g, person[0]).replace('{their}', person[1]),
    driftAmount
  );

  window.sfx && sfx('chime', dreadNow);
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = text.replace('{n}', '<span class="red">' + n + '</span>');

  // corner or random spot?
  let odds = 0;
  if (TOAST_MODE === 'anywhere') odds = 1;
  if (TOAST_MODE === 'escalate') {
    odds = Math.min(1, Math.max(0, (dreadNow - TOAST_RANDOM_FROM) / TOAST_RANDOM_RAMP));
  }
  const random = Math.random() < odds;

  if (!random) {
    // in the corner there's room for one: remove the previous one
    document.querySelectorAll('.toast.corner').forEach(function (old) { old.remove(); });
    el.classList.add('corner');
  } else {
    el.style.bottom = 'auto';
    el.style.left = (12 + Math.random() * Math.max(0, innerWidth - 324)) + 'px';
    el.style.top = (90 + Math.random() * Math.max(0, innerHeight - 190)) + 'px';
  }

  document.body.appendChild(el);
  requestAnimationFrame(function () { el.classList.add('show'); });

  setTimeout(function () {                                   // leave after 5s
    el.classList.remove('show');
    setTimeout(function () { el.remove(); }, 400);
  }, 5000);
}

// First one after 5s, then faster the more dread there is
let toastTimer = null;
function scheduleToast(delay) {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    showToast();
    scheduleToast((6000 - dreadNow * 3500) * (0.7 + Math.random() * 0.6));   // gap between popups: ~6s at first, ~2.5s at the worst
  }, delay);
}
scheduleToast(5000);

/* ---------- START THE HORROR OVER ----------
   Called after the welcome sequence: the vignette, ghost cursor and popups
   all begin again from zero, as if the visitor had only just loaded the page. */
function resetHorror() {
  dreadStart = performance.now();
  dreadNow = 0;
  root.style.setProperty('--dread', '0');
  recentLines.length = 0;
  document.querySelectorAll('.toast').forEach(function (t) { t.remove(); });
  scheduleToast(8000);
}
