/* =====================================================
   retro.js : the old-computer layer for the broken shop (fakepage.html and fakeproduct.html) (works with retro.css).
   CRT overlay, taskbar with a clock that goes wrong, a visitor counter that goes wrong,
   and things you almost don't see, all of which get worse as the dread builds (mainpage.js).
   ===================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = function (a, b) { return a + Math.random() * (b - a); };
  const root = document.documentElement;
  const dread = function () { try { return typeof dreadNow === 'number' ? dreadNow : 0; } catch (e) { return 0; } };

  // pixel fonts (the same two the portal uses)
  const f = document.createElement('link');
  f.rel = 'stylesheet';
  f.href = 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&display=swap';
  document.head.appendChild(f);

  /* ---------- the CRT ---------- */
  function layer(cls, tag) { const d = document.createElement(tag || 'div'); d.className = 'crt ' + cls; document.body.appendChild(d); return d; }
  layer('crt-glow');
  layer('crt-scan');
  layer('crt-roll');
  const flashEl = layer('crt-flash');
  const flipEl = layer('crt-flip');
  if (!reduce) {
    const boot = layer('crt-boot');
    setTimeout(function () { boot.remove(); }, 1000);
    const nc = layer('crt-noise', 'canvas');
    nc.width = 160; nc.height = 90;
    const g = nc.getContext('2d'), img = g.createImageData(160, 90);
    (function draw() {
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      setTimeout(function () { requestAnimationFrame(draw); }, 110);
    })();
  }

  // the CRT gets stronger as the dread builds
  setInterval(function () { root.style.setProperty('--retro', (0.35 + dread() * 0.65).toFixed(3)); }, 700);

  /* ---------- the taskbar ---------- */
  const bar = document.createElement('div');
  bar.className = 'taskbar';
  bar.innerHTML = '<div class="start"><i></i>Start</div><div class="win-btn"></div><div class="tray" id="retroClock">12:00</div>';
  document.body.appendChild(bar);
  bar.querySelector('.win-btn').textContent = 'Real Stuf.™ - ' + (document.body.dataset.retroTitle || (document.body.dataset.page === 'product' ? 'A Real T-shirt' : 'Home'));

  // the clock is a little wrong, then a lot wrong, and sometimes runs backwards
  const clock = document.getElementById('retroClock');
  const t0 = Date.now();
  function tick() {
    const d = dread();
    let t = Date.now();
    if (d > 0.15) t += Math.sin((t - t0) / 4000) * d * 3600000 * 3;     // drifts by up to hours
    if (d > 0.7 && Math.random() < 0.25) t -= Math.floor(rnd(1, 60)) * 60000 * 7;
    const dt = new Date(t);
    clock.textContent = String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
    if (d > 0.9 && Math.random() < 0.12) clock.textContent = '--:--';
  }
  tick(); setInterval(tick, 1000);

  /* ---------- the visitor counter (footer) ---------- */
  const foot = document.querySelector('footer');
  if (foot) {
    const c = document.createElement('div');
    c.className = 'counter';
    c.textContent = 'VISITORS: 000001';
    foot.appendChild(c);
    setInterval(function () {
      const d = dread();
      if (d < 0.3) return;
      const r = Math.random();
      c.classList.toggle('bad', d > 0.6);
      if (r < 0.25) c.textContent = 'VISITORS: 000001';          // it is always just you
      else if (r < 0.5) c.textContent = 'VISITORS: 000000';
      else if (r < 0.7) c.textContent = 'VISITORS: ' + String(Math.floor(rnd(100000, 999999)));
      else if (d > 0.7) c.textContent = ['YOU ARE VISITOR 1 OF 1', 'VISITORS: ONLY YOU', 'VISITORS: ????'][Math.floor(rnd(0, 3))];
    }, 2600);
  }

  /* ---------- things you almost don't see ---------- */
  if (reduce) return;
  const WORDS = ['REAL', 'IM THE REAL ONE', 'LOOK', 'YOU', 'STAY', 'NOT FAKE', 'WE SEE YOU', 'WHO ARE YOU'];
  function flash() {
    const d = dread(), ms = rnd(34, 70);
    if (Math.random() < 0.3) {                                   // the whole screen inverts for a frame
      flipEl.classList.add('on');
      setTimeout(function () { flipEl.classList.remove('on'); }, ms);
    } else {
      flashEl.textContent = WORDS[Math.floor(rnd(0, WORDS.length))];
      flashEl.classList.toggle('red', Math.random() < 0.4);
      flashEl.classList.add('on');
      setTimeout(function () { flashEl.classList.remove('on'); }, ms);
    }
    if (window.sfx && d > 0.3 && Math.random() < 0.5) sfx('static');
  }
  (function schedule() {
    const d = dread();
    setTimeout(function () { flash(); schedule(); }, Math.max(2500, rnd(9000, 22000) * (1 - d * 0.7)));
  })();

  // the page shudders sideways for a moment
  (function shudder() {
    setTimeout(function () {
      document.body.classList.add('jolt');
      setTimeout(function () { document.body.classList.remove('jolt'); }, 90);
      shudder();
    }, Math.max(2500, rnd(6000, 16000) * (1 - dread() * 0.6)));
  })();
})();
