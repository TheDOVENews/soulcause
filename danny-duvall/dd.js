/* Outward — Evangelist Danny DuVall.
 * 1) The flare in 3D: a very thin cross at the center with the Pentecost flame descending upon it; five rings of the
 *    five-fold ministry (Ephesians 4:11) tumble in 3D, align into a rainbow, and drip outward to every corner of the earth.
 * 2) Five-fold list highlights its ring.  3) Scroll reveal + timeline progress.  4) Church application form. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* ---------- 1. The flare, in 3D ----------
   * Five rings (Ephesians 4:11) tumble on their own axes around the center. Drag to turn the view.
   * When the rings come into perfect alignment they light up as a rainbow (Genesis 9:13).
   * Drops fall outward and downward from every ring to every corner of the earth.
   * At the center: a very thin cross, and the Pentecost flame descending to rest upon it (Acts 2:3). */
  var svg = document.querySelector('#flare svg'), rings = [];
  if (svg) {
    var GIFTS = ['Apostles', 'Prophets', 'Evangelists', 'Pastors', 'Teachers'];
    var RAIN = ['#E53935', '#F5A21C', '#1E9E5A', '#1F4FD8', '#8E5BD8'];
    var BASE = ['#0B0B0C', '#0B0B0C', '#F2711C', '#0B0B0C', '#0B0B0C'];
    var R0 = 78, GAP = 30, N = 120, FOV = 900;
    var defs = el('defs', {}, svg);
    var gg = el('radialGradient', { id: 'glow' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F5C518', 'stop-opacity': '.5' }, gg); el('stop', { offset: '1', 'stop-color': '#F5C518', 'stop-opacity': '0' }, gg);
    var gc = el('radialGradient', { id: 'christ' }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFFDF2' }, gc); el('stop', { offset: '.8', 'stop-color': '#FFF3C4' }, gc); el('stop', { offset: '1', 'stop-color': '#F5C518' }, gc);
    var blur = el('filter', { id: 'soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: '3' }, blur);

    var glow = el('circle', { r: 170, fill: 'url(#glow)' }, svg);
    var globeG = el('g', { opacity: '.22' }, svg);        // the earth: a faint wireframe sphere
    var backG = el('g', {}, svg), dropG = el('g', {}, svg), coreG = el('g', {}, svg), frontG = el('g', {}, svg), labelG = el('g', {}, svg);
    var bowG = el('g', { opacity: '0', filter: 'url(#soft)' }); svg.insertBefore(bowG, coreG);  // rainbow halo when aligned (behind the cross)

    // the earth: latitude and longitude lines on a sphere
    var globeLines = [];
    for (var la = -60; la <= 60; la += 30) globeLines.push({ lat: la });
    for (var lo = 0; lo < 180; lo += 30) globeLines.push({ lon: lo });
    globeLines.forEach(function (g) { g.p = el('path', { fill: 'none', stroke: '#0B0B0C', 'stroke-width': '.8' }, globeG); });

    GIFTS.forEach(function (name, k) {
      var r = R0 + GAP * (k + 1);
      rings.push({
        r: r, name: name, k: k,
        back: el('path', { fill: 'none', 'stroke-linecap': 'round' }, backG),
        front: el('path', { fill: 'none', 'stroke-linecap': 'round' }, frontG),
        bow: el('path', { fill: 'none', 'stroke-width': 9, stroke: RAIN[k], 'stroke-linecap': 'round' }, bowG),
        label: (function () { var t = el('text', { class: 'lbl3', 'text-anchor': 'middle' }, labelG); t.textContent = name; return t; })(),
        beads: [], spin: k * 0.7,
        tiltX: 0.9 - k * 0.13, tiltY: -0.6 + k * 0.28, phase: k * 0.9
      });
      for (var j = 0; j < 8; j++) rings[k].beads.push(el('circle', { r: 2.4 }, frontG));
    });

    // Center: a very thin cross; the Pentecost flame descends from above and rests upon it (Acts 2:3)
    var fg = el('linearGradient', { id: 'fire', x1: '0', y1: '1', x2: '0', y2: '0' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F2711C' }, fg); el('stop', { offset: '1', 'stop-color': '#F5C518' }, fg);
    coreG.innerHTML = '<circle r="' + (R0 - 10) + '" fill="url(#christ)" opacity=".55"/>' +
      '<path d="M0 -46V58M-24 -14H24" stroke="#0B0B0C" stroke-width="1.3" stroke-linecap="round" fill="none"/>';
    var cross = coreG.lastChild;
    var flameG = el('g', {}, coreG), tongues = [];
    [[0, 1, 0], [-9, .62, -1], [9, .62, 1]].forEach(function (t) {
      tongues.push({ dx: t[0], h: t[1], side: t[2], p: el('path', { fill: 'url(#fire)', 'fill-opacity': '.12', stroke: 'url(#fire)', 'stroke-width': '1.2', 'stroke-linejoin': 'round' }, flameG) });
    });
    function tongue(cx, base, h, w, sway) {
      return 'M' + cx + ' ' + base + 'C' + (cx - w) + ' ' + (base - h * .3) + ' ' + (cx - w * .35 + sway) + ' ' + (base - h * .72) + ' ' + (cx + sway * 1.5) + ' ' + (base - h) +
        'C' + (cx + w * .35 + sway) + ' ' + (base - h * .72) + ' ' + (cx + w) + ' ' + (base - h * .3) + ' ' + cx + ' ' + base + 'Z';
    }
    function drawFlame() {
      var cyc = 9, t = T % cyc, fall = Math.min(1, t / 1.8), ease = 1 - Math.pow(1 - fall, 3);
      var y = -230 + ease * 180;                                   // descends from above, rests on the top of the cross
      var o = Math.min(1, t / .6) * (t > cyc - .8 ? (cyc - t) / .8 : 1);
      tongues.forEach(function (g, i) {
        var sway = Math.sin(T * 5 + i * 2) * 2.2 + g.side * (1 - ease) * 6, h = 44 * g.h * (1 + .08 * Math.sin(T * 7 + i));
        g.p.setAttribute('d', tongue(+(g.dx * (.4 + .6 * ease)).toFixed(1), +y.toFixed(1), +h.toFixed(1), (g.side ? 6 : 9), +sway.toFixed(2)));
      });
      flameG.setAttribute('opacity', o.toFixed(2));
      var pressed = ease >= 1 ? 1 : 0;                              // when the flame rests, the cross is lit
      cross.setAttribute('stroke', pressed ? '#C77A00' : '#0B0B0C');
      cross.setAttribute('stroke-width', (1.3 + pressed * .5 * o).toFixed(2));
    }

    // view rotation (drag) and ring motion
    var yaw = 0.4, pitch = -0.35, vYaw = 0.12, dragging = false, lx = 0, ly = 0, T = 0, last = 0, hl = 2;
    function rot(p, ax, ay, az) {   // rotate point by X, then Y, then Z
      var x = p[0], y = p[1], z = p[2], c, s, t;
      c = Math.cos(ax); s = Math.sin(ax); t = y * c - z * s; z = y * s + z * c; y = t;
      c = Math.cos(ay); s = Math.sin(ay); t = x * c + z * s; z = -x * s + z * c; x = t;
      c = Math.cos(az); s = Math.sin(az); t = x * c - y * s; y = x * s + y * c; x = t;
      return [x, y, z];
    }
    function view(p) { var q = rot(p, pitch, yaw, 0); var k = FOV / (FOV + q[2]); return [q[0] * k, q[1] * k, q[2]]; }

    var drops = [];
    function spawnDrop(ring, pt) {
      var len = Math.hypot(pt[0], pt[1]) || 1;
      drops.push({ x: pt[0], y: pt[1], vx: pt[0] / len * (18 + Math.random() * 30), vy: pt[1] / len * 20 - 10, c: el('path', {}, dropG), k: ring.k, life: 0 });
    }

    function frame(ts) {
      var dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; T += dt;
      drawFlame();
      if (!dragging) { yaw += vYaw * dt; vYaw += (0.12 - vYaw) * Math.min(1, dt * 0.8); }
      // alignment cycle: rings drift apart and come together every ~14 s
      var cyc = (Math.cos(T * Math.PI * 2 / 14) + 1) / 2;          // 1 = apart, 0 = aligned
      var align = Math.pow(1 - cyc, 6);                              // sharp peak when aligned
      bowG.setAttribute('opacity', (align * 0.85).toFixed(3));
      glow.setAttribute('r', (170 + 20 * Math.sin(T * 1.3) + align * 60).toFixed(1));

      // the earth wireframe
      var RG = 270;
      globeLines.forEach(function (g) {
        var d = '', vis = '';
        for (var i = 0; i <= 48; i++) {
          var a = i / 48 * Math.PI * 2, p;
          if (g.lat !== undefined) { var la = g.lat * Math.PI / 180; p = [Math.cos(a) * Math.cos(la) * RG, Math.sin(la) * RG, Math.sin(a) * Math.cos(la) * RG]; }
          else { var lo = g.lon * Math.PI / 180; p = [Math.cos(a) * Math.cos(lo) * RG, Math.sin(a) * RG, Math.cos(a) * Math.sin(lo) * RG]; }
          var v = view(p); d += (i ? 'L' : 'M') + v[0].toFixed(1) + ' ' + v[1].toFixed(1);
        }
        g.p.setAttribute('d', d);
      });

      rings.forEach(function (R, k) {
        R.spin += (k % 2 ? -1 : 1) * (0.25 + k * 0.05) * dt;
        var ax = R.tiltX * cyc * Math.cos(T * .3 + R.phase), ay = R.tiltY * cyc * Math.sin(T * .27 + R.phase);
        var back = '', front = '', pb = null, pf = null, pts = [];
        for (var i = 0; i <= N; i++) {
          var a = i / N * Math.PI * 2 + R.spin;
          var w = rot([Math.cos(a) * R.r, Math.sin(a) * R.r, 0], ax, ay, 0), v = view(w); pts.push(v);
          var isBack = v[2] > 0, s = v[0].toFixed(1) + ' ' + v[1].toFixed(1);
          if (isBack) { back += (pb === i - 1 ? 'L' : 'M') + s; pb = i; } else { front += (pf === i - 1 ? 'L' : 'M') + s; pf = i; }
        }
        var col = align > .4 ? RAIN[k] : BASE[k], width = (k === 2 ? 2.8 : 1.6) + align * 2.4 + (hl === k ? 1.6 : 0);
        R.back.setAttribute('d', back); R.back.setAttribute('stroke', col); R.back.setAttribute('stroke-width', width * .8); R.back.setAttribute('opacity', '.45');
        R.front.setAttribute('d', front); R.front.setAttribute('stroke', col); R.front.setAttribute('stroke-width', width);
        if (align > .02) R.bow.setAttribute('d', back + front);
        R.beads.forEach(function (b, j) { var p = pts[Math.floor(j / 8 * N)]; b.setAttribute('cx', p[0].toFixed(1)); b.setAttribute('cy', p[1].toFixed(1)); b.setAttribute('fill', col); b.setAttribute('opacity', p[2] > 0 ? '.4' : '1'); });
        var lp = pts[Math.floor(N * 0.12)]; R.label.setAttribute('x', lp[0].toFixed(1)); R.label.setAttribute('y', (lp[1] - 7).toFixed(1));
        R.label.setAttribute('fill', col); R.label.setAttribute('opacity', lp[2] > 0 ? '.35' : '1');
        // drops: every ring drips outward and downward
        if (!reduce && Math.random() < dt * (k === 2 ? 5 : 2.2)) spawnDrop(R, pts[Math.floor(Math.random() * N)]);
      });

      drops = drops.filter(function (d) {
        d.life += dt; d.vy += 140 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        var o = Math.max(0, 1 - d.life / 2.6), sz = 2.2 + d.life * .6, col = align > .4 ? RAIN[d.k] : (d.k === 2 ? '#F2711C' : '#1F4FD8');
        // teardrop pointing along its fall
        var ang = Math.atan2(d.vy, d.vx), c = Math.cos(ang), s = Math.sin(ang);
        var tx = d.x - c * sz * 2.6, ty = d.y - s * sz * 2.6;
        d.c.setAttribute('d', 'M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'Q' + (d.x - s * sz).toFixed(1) + ' ' + (d.y + c * sz).toFixed(1) + ' ' + (d.x + c * sz).toFixed(1) + ' ' + (d.y + s * sz).toFixed(1) + 'Q' + (d.x + s * sz).toFixed(1) + ' ' + (d.y - c * sz).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1));
        d.c.setAttribute('fill', col); d.c.setAttribute('opacity', o.toFixed(2));
        if (o <= 0 || d.y > 320) { d.c.remove(); return false; } return true;
      });
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) { frame(16); } else requestAnimationFrame(frame);

    // drag to turn (mouse anywhere on it; on touch, sideways drags turn and vertical drags scroll the page)
    svg.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      yaw += dx * 0.01; vYaw = dx * 0.6; if (e.pointerType !== 'touch') pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.01));
      if (reduce) frame(performance.now());
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { svg.addEventListener(n, function () { dragging = false; }); });

    window.OutwardRing = function (k) { hl = k; if (reduce) frame(performance.now()); };
  }

  /* ---------- 2. Five-fold list ---------- */
  var five = document.getElementById('five'), note = document.getElementById('five-note');
  var NOTES = ['Apostles: sent ones who plant and establish.', 'Prophets: speak the word of the Lord.', 'Evangelists: carry the gospel outward and equip the saints to win souls.', 'Pastors: shepherd and care for the flock.', 'Teachers: ground the saints in the Word.'];
  if (five) {
    var pick = function (li) {
      five.querySelectorAll('li').forEach(function (x) { x.classList.toggle('pick', x === li); });
      var k = +li.getAttribute('data-ring'); if (window.OutwardRing) OutwardRing(k);
      if (note) note.textContent = NOTES[k] + ' All five edify the saints, the body of Christ.';
      var f = document.getElementById('flare'); if (f && f.getBoundingClientRect().bottom < 0) f.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    };
    five.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) pick(li); });
    five.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('li')) { e.preventDefault(); pick(e.target); } });
  }

  /* ---------- 3. Scroll reveal + timeline progress ---------- */
  var items = document.querySelectorAll('.card, .timeline li, .two > *, .mission, blockquote, .photo');
  if ('IntersectionObserver' in window && !reduce) {
    items.forEach(function (n) { n.classList.add('rv'); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n, i) { n.style.transitionDelay = ((i % 3) * 70) + 'ms'; io.observe(n); });
  }
  var tl = document.querySelector('.timeline');
  if (tl) {
    var bar = document.createElement('span'); bar.className = 'prog'; tl.appendChild(bar);
    var upd = function () { var r = tl.getBoundingClientRect(), vh = innerHeight; var p = Math.min(1, Math.max(0, (vh * .6 - r.top) / r.height)); bar.style.height = (p * 100).toFixed(1) + '%'; };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- 4. Application form ---------- */
  var f = document.getElementById('apply-form'), m = document.getElementById('apply-msg');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {}; new FormData(f).forEach(function (v, k) { d[k] = String(v); });
    if (!d.church_name || !d.pastor_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) {
      m.className = 'msg err'; m.textContent = 'Please add your church name, pastor’s name and a valid email.'; return;
    }
    var b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Sending…'; m.textContent = '';
    fetch('/api/church-apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok) { f.reset(); m.className = 'msg ok'; m.textContent = 'Thank you. Your application is in, and we will be in touch soon. We are praying for your church.'; }
        else { m.className = 'msg err'; m.textContent = x.j.error || 'Something went wrong. Please try again.'; }
      })
      .catch(function () { m.className = 'msg err'; m.textContent = 'Could not send. Please check your connection and try again.'; })
      .then(function () { b.disabled = false; b.textContent = 'Send application'; });
  });
})();
