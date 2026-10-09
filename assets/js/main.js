// SLEMuX'27 — the only script on the site. Everything works without it;
// it keeps the important dates current, animates the "To be announced" swarm,
// and types out the perspective arrows on the call for papers.

(function () {
  'use strict';

  // ── Important dates ────────────────────────────────────────────────────
  // The build marks past and next dates as of build time; redo it with the
  // visitor's clock so the page does not go stale between deploys.
  function refreshDates() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    document.querySelectorAll('[data-dates]').forEach(function (list) {
      var foundNext = false;
      list.querySelectorAll('[data-iso]').forEach(function (row) {
        var iso = row.getAttribute('data-iso');
        var next = !foundNext && iso >= today;
        if (next) foundNext = true;
        row.classList.toggle('is-past', iso < today);
        row.classList.toggle('is-next', next);
      });
    });
  }

  // ── "To be announced" swarm ────────────────────────────────────────────
  // Dots start as a loose flock on the left, flow right, and settle into the
  // letters — a nod to micro behaviour producing a macro shape. Coloured on a
  // cyan → magenta ramp from left to right.
  function hexToRgb(v) {
    v = (v || '').trim().replace('#', '');
    if (v.length === 3) v = v.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(v, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  function swarm(host) {
    var text = host.getAttribute('data-tba');
    var root = getComputedStyle(document.documentElement);
    var family = getComputedStyle(host).fontFamily || 'serif';
    var cA = hexToRgb(root.getPropertyValue('--color-accent-700') || '#006786');
    var cB = hexToRgb(root.getPropertyValue('--color-accent-2-700') || '#aa0b56');
    var SHADES = 24;
    var shades = [];
    for (var k = 0; k < SHADES; k++) {
      shades.push('rgb(' + cA.map(function (v, i) { return Math.round(v + (cB[i] - v) * k / (SHADES - 1)); }).join(',') + ')');
    }
    var size = 100, step = 6, R = 2.2, pad = 50;
    var font = '600 ' + size + 'px ' + family;
    var ready = document.fonts ? document.fonts.load(font).catch(function () {}) : Promise.resolve();

    ready.then(function () {
      // Rasterise the text off-screen and sample a dot grid inside the glyphs.
      var m = document.createElement('canvas').getContext('2d');
      m.font = font;
      var w = Math.ceil(m.measureText(text).width) + 20;
      var h = Math.ceil(size * 1.25) + pad * 2;
      var off = document.createElement('canvas');
      off.width = w; off.height = h;
      var o = off.getContext('2d');
      o.font = font;
      o.fillText(text, 10, pad + Math.round(size * 0.95));
      var px = o.getImageData(0, 0, w, h).data;
      var targets = [];
      for (var y = step / 2; y < h; y += step) {
        for (var x = step / 2; x < w; x += step) {
          if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 128) targets.push([x, y]);
        }
      }

      var seed = 7;
      var rnd = function () { return (seed = (seed * 16807) % 2147483647) / 2147483647; };
      var g = function () { return (rnd() + rnd() + rnd()) / 1.5 - 1; };
      var N = targets.length;
      var D = targets.map(function (p) {
        return { tx: p[0], ty: p[1], x: w * 0.14 + g() * w * 0.12, y: h * 0.5 + g() * h * 0.4, vx: 4 + g() * 0.8, vy: g() * 0.6, j: rnd() };
      });

      var cv = document.createElement('canvas');
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.aspectRatio = w + ' / ' + h;
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', text);
      var ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      host.replaceChildren(cv);

      var draw = function () {
        ctx.clearRect(0, 0, w, h);
        var buckets = shades.map(function () { return []; });
        D.forEach(function (d) {
          buckets[Math.max(0, Math.min(SHADES - 1, Math.round(d.tx / w * (SHADES - 1))))].push(d);
        });
        buckets.forEach(function (list, k) {
          if (!list.length) return;
          ctx.fillStyle = shades[k];
          ctx.beginPath();
          list.forEach(function (d) { ctx.moveTo(d.x + R, d.y); ctx.arc(d.x, d.y, R, 0, Math.PI * 2); });
          ctx.fill();
        });
      };
      var snap = function () { D.forEach(function (d) { d.x = d.tx; d.y = d.ty; }); draw(); };

      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { snap(); return; }

      var smooth = function (e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
      var t0 = null, last = 0;
      var tick = function (now) {
        if (t0 === null) { t0 = now; last = now; }
        var t = (now - t0) / 1000, dt = Math.min(2, (now - last) / 16.67);
        last = now;
        // Flocking: align with the mean velocity, drift to the centre, follow a flow field…
        var mvx = 0, mvy = 0, cx = 0, cy = 0;
        D.forEach(function (d) { mvx += d.vx; mvy += d.vy; cx += d.x; cy += d.y; });
        mvx /= N; mvy /= N; cx /= N; cy /= N;
        var settled = true;
        D.forEach(function (d) {
          var ang = Math.sin(d.x * 0.008 + t * 1.1) * 1.2 + Math.cos(d.y * 0.02 - t * 0.8) * 0.8;
          var fx = Math.cos(ang * 0.6) * 4.2 * 0.55 + mvx * 0.45 + (cx - d.x) * 0.004;
          var fy = Math.sin(ang) * 2.4 * 0.55 + mvy * 0.45 + (cy - d.y) * 0.004;
          // …then, staggered per dot, steer home to its place in the glyph.
          var s = smooth(0.15 + d.j * 0.35, 0.9 + d.j * 0.35, t);
          var dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy) || 1;
          var sp = Math.min(10, dist * 0.13);
          var ex = fx + (dx / dist * sp - fx) * s, ey = fy + (dy / dist * sp - fy) * s;
          var kk = (0.1 + 0.16 * s) * dt;
          d.vx += (ex - d.vx) * kk; d.vy += (ey - d.vy) * kk;
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (s < 1 || dist > 0.4 || Math.abs(d.vx) + Math.abs(d.vy) > 0.08) settled = false;
        });
        if (settled || t > 3) { snap(); return; }
        draw();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // ── Perspective arrows typed out ───────────────────────────────────────
  // The first time the perspectives scroll into view, they come in one after
  // the other (top-down, bottom-up, across scales): the title rises in, the
  // arrow line is typed letter by letter with each arrow drawn as a stroke,
  // then the text follows.
  function arrowTyper(host) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    host.classList.add('is-waiting');
    var cards = Array.prototype.slice.call(host.querySelectorAll('.perspective')).map(function (card) {
      var el = card.querySelector('.perspective-arrow');
      var parts = Array.prototype.slice.call(el.children);
      el.replaceChildren();
      return { title: card.querySelector('.perspective-title'), text: card.querySelector('p'), el: el, parts: parts };
    });
    var caret = document.createElement('span');
    caret.className = 'type-caret';

    var type = async function (line) {
      line.el.appendChild(caret);
      line.el.classList.add('is-typing');
      for (var part of line.parts) {
        if (part.tagName.toLowerCase() === 'svg') {
          part.classList.add('is-drawing');
          line.el.insertBefore(part, caret);
          part.getBoundingClientRect();
          part.classList.remove('is-drawing');
          await sleep(140);
          continue;
        }
        var text = part.textContent;
        part.textContent = '';
        line.el.insertBefore(part, caret);
        for (var ch of text) { part.textContent += ch; await sleep(22 + Math.random() * 18); }
        await sleep(50);
      }
      line.el.classList.remove('is-typing');
    };

    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      (async function () {
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          c.title.classList.add('is-shown');
          await sleep(180);
          await type(c);
          if (c.text) c.text.classList.add('is-shown');
          await sleep(i < cards.length - 1 ? 220 : 1200);
        }
        caret.remove();
      })();
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(host);
  }

  refreshDates();
  document.querySelectorAll('[data-tba]').forEach(swarm);
  document.querySelectorAll('[data-type-arrows]').forEach(arrowTyper);
})();
