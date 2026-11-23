/* Outward — Evangelist Danny DuVall.
 * 1) The rings and the abyss: a thin cross at the center; wherever the five rings touch the darkness it turns to light; five rings of the
 *    five-fold ministry (Ephesians 4:11) tumble in 3D, align into a rainbow, and drip outward to every corner of the earth.
 * 2) Five-fold list highlights its ring.  3) Scroll reveal + timeline progress.  4) Church application form. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* ---------- 1. The rings and the abyss ----------
   * A thin cross at the center. Five rings of the five-fold ministry (Ephesians 4:11) turn in 3D.
   * Wherever a ring touches the darkness, the abyss turns to light, and it stays light (John 1:5).
   * Each ring lights its own band; turn the rings any direction to paint more of the dark. All five are needed:
   * take one away and its band stays a void, because the saints cannot be fully edified without every gift.
   * When the rings align they shine as a rainbow (Genesis 9:13). */
  var fig = document.getElementById('flare'), svg = fig && fig.querySelector('svg'), rings = [];
  if (svg) {
    var GIFTS = ['Apostles', 'Prophets', 'Evangelists', 'Pastors', 'Teachers'];
    var RAIN = ['#E53935', '#F5A21C', '#1E9E5A', '#1F4FD8', '#8E5BD8'];
    var R0 = 78, GAP = 30, N = 120, FOV = 900, VB = { x: -310, y: -300, w: 620, h: 640 };
    var on = [true, true, true, true, true];

    // the abyss: a canvas of darkness behind the rings; the rings erase it to reveal white light
    var stage = document.createElement('div'); stage.className = 'abyss';
    svg.parentNode.insertBefore(stage, svg); stage.appendChild(svg);
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); stage.insertBefore(cv, svg);
    var ctx = cv.getContext('2d'), scale = 1, sized = false;
    function size() {
      var r = svg.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
      if (cv.width === w && cv.height === h) return;
      var old = sized ? (function () { var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; })() : null;
      cv.width = w; cv.height = h; scale = w / VB.w;
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#070709'; ctx.fillRect(0, 0, w, h);
      if (old) { ctx.clearRect(0, 0, w, h); ctx.drawImage(old, 0, 0, w, h); }
      sized = true;
    }
    size(); addEventListener('resize', size);

    var defs = el('defs', {}, svg);
    var gc = el('radialGradient', { id: 'christ' }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFFFFF' }, gc); el('stop', { offset: '.8', 'stop-color': '#FFF8E1' }, gc); el('stop', { offset: '1', 'stop-color': '#F5C518', 'stop-opacity': '.6' }, gc);
    var blur = el('filter', { id: 'soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: '3' }, blur);
    var globeG = el('g', { opacity: '.22', stroke: '#8A8578' }, svg);
    var backG = el('g', {}, svg), bowG = el('g', { opacity: '0', filter: 'url(#soft)' }, svg), coreG = el('g', {}, svg), frontG = el('g', {}, svg), labelG = el('g', {}, svg);

    var globeLines = [];
    for (var la = -60; la <= 60; la += 30) globeLines.push({ lat: la });
    for (var lo = 0; lo < 180; lo += 30) globeLines.push({ lon: lo });
    globeLines.forEach(function (g) { g.p = el('path', { fill: 'none', 'stroke-width': '.8' }, globeG); });

    GIFTS.forEach(function (name, k) {
      var r = R0 + GAP * (k + 1), mk = function (g) { return [el('path', { fill: 'none', stroke: '#0B0B0C', 'stroke-linecap': 'round' }, g), el('path', { fill: 'none', 'stroke-linecap': 'round' }, g)]; };
      var lg = el('g', { class: 'tag3' }, labelG), w = name.length * 8.4 + 22;
      var rect = el('rect', { x: -w / 2, y: -12, width: w, height: 24, rx: 12 }, lg);
      var t = el('text', { 'text-anchor': 'middle', y: 5 }, lg); t.textContent = name;
      rings.push({ r: r, k: k, back: mk(backG), front: mk(frontG), bow: el('path', { fill: 'none', 'stroke-width': 9, stroke: RAIN[k], 'stroke-linecap': 'round' }, bowG),
        label: lg, rect: rect, text: t, spin: k * 0.7, tiltX: 0.9 - k * 0.13, tiltY: -0.6 + k * 0.28, phase: k * 0.9, fade: 1 });
    });
    coreG.innerHTML = '<circle r="' + (R0 - 12) + '" fill="url(#christ)"/>' +
      '<path d="M0 -46V58M-24 -14H24" stroke="#0B0B0C" stroke-width="1.3" stroke-linecap="round" fill="none"/>';

    var discLit = 0, spread = 0, yaw = 0.4, pitch = -0.35, vYaw = 0.12, vPitch = 0, dragging = false, lx = 0, ly = 0, T = 0, last = 0, hl = -1, onScreen = true, lit = 0, tSample = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(svg);
    function rot(p, ax, ay) {
      var x = p[0], y = p[1], z = p[2], c, s, t;
      c = Math.cos(ax); s = Math.sin(ax); t = y * c - z * s; z = y * s + z * c; y = t;
      c = Math.cos(ay); s = Math.sin(ay); t = x * c + z * s; z = -x * s + z * c; x = t;
      return [x, y, z];
    }
    function view(p) { var q = rot(p, pitch, yaw); var k = FOV / (FOV + q[2]); return [q[0] * k, q[1] * k, q[2]]; }
    var status = document.getElementById('abyss-status'), meter = document.getElementById('abyss-meter');
    function sample() {                                        // how much of the abyss is light
      var s = document.createElement('canvas'); s.width = 48; s.height = 50; var c = s.getContext('2d'); c.drawImage(cv, 0, 0, 48, 50);
      var d = c.getImageData(0, 0, 48, 50).data, n = 0, dn = 0, dt2 = 0;
      for (var i = 3, p = 0; i < d.length; i += 4, p++) {
        var x = p % 48, y = (p / 48) | 0, inDisc = Math.hypot(x + .5 - 24, y + .5 - 23.4) < 17.5;
        if (d[i] < 128) { n++; if (inDisc) dn++; } if (inDisc) dt2++;
      }
      lit = n / (48 * 50); discLit = dn / dt2;
    }
    function report() {
      if (!status) return;
      var missing = GIFTS.filter(function (g, k) { return !on[k]; });
      if (meter) meter.style.width = (lit * 100).toFixed(0) + '%';
      status.textContent = missing.length
        ? 'Without ' + missing.join(' and ') + ', a void remains. The saints cannot be fully edified. All five gifts are needed.'
        : lit > .985 ? 'All is light. Every ring at work, and the saints are reached.'
        : spread > 0 ? 'The light is reaching every corner…' : 'All five rings at work: ' + Math.round(lit * 100) + '% of the darkness is light. Turn the rings to reach more.';
    }

    function frame(ts) {
      var dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; T += dt;
      if (!dragging) { yaw += vYaw * dt; vYaw += (0.12 - vYaw) * Math.min(1, dt * 0.8); pitch += vPitch * dt; vPitch *= Math.max(0, 1 - dt * 1.2); }
      var cyc = (Math.cos(T * Math.PI * 2 / 14) + 1) / 2, align = Math.pow(1 - cyc, 6);
      bowG.setAttribute('opacity', (align * 0.85).toFixed(3));

      var RG = 270;
      globeLines.forEach(function (g) {
        var d = '';
        for (var i = 0; i <= 48; i++) {
          var a = i / 48 * Math.PI * 2, p;
          if (g.lat !== undefined) { var la = g.lat * Math.PI / 180; p = [Math.cos(a) * Math.cos(la) * RG, Math.sin(la) * RG, Math.sin(a) * Math.cos(la) * RG]; }
          else { var lo = g.lon * Math.PI / 180; p = [Math.cos(a) * Math.cos(lo) * RG, Math.sin(a) * RG, Math.cos(a) * Math.sin(lo) * RG]; }
          var v = view(p); d += (i ? 'L' : 'M') + v[0].toFixed(1) + ' ' + v[1].toFixed(1);
        }
        g.p.setAttribute('d', d);
      });

      var allOn = on.every(Boolean);
      ctx.save(); ctx.setTransform(scale, 0, 0, scale, -VB.x * scale, -VB.y * scale);
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // once the rings have reached all they can touch, the light spreads to every corner
      if (on[4] && discLit > .96) spread = Math.min(480, Math.max(spread, 230) + 70 * dt); else if (!on[4]) spread = 0;
      if (spread > 0) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 2000, 0, Math.PI * 2); ctx.arc(0, 0, R0 + GAP * 4 + 2, 0, Math.PI * 2, true); ctx.clip('evenodd'); var gr = ctx.createRadialGradient(0, 0, spread * .7, 0, 0, spread); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(VB.x, VB.y, VB.w, VB.h); ctx.restore(); }

      rings.forEach(function (R, k) {
        R.fade += ((on[k] ? 1 : 0) - R.fade) * Math.min(1, dt * 4);
        R.spin += (k % 2 ? -1 : 1) * (0.25 + k * 0.05) * dt;
        var ax = R.tiltX * cyc * Math.cos(T * .3 + R.phase), ay = R.tiltY * cyc * Math.sin(T * .27 + R.phase);
        var back = '', front = '', all = '', pb = null, pf = null, pts = [];
        for (var i = 0; i <= N; i++) {
          var a = i / N * Math.PI * 2 + R.spin, v = view(rot([Math.cos(a) * R.r, Math.sin(a) * R.r, 0], ax, ay)); pts.push(v);
          var s = v[0].toFixed(1) + ' ' + v[1].toFixed(1); all += (i ? 'L' : 'M') + s;
          if (v[2] > 0) { back += (pb === i - 1 ? 'L' : 'M') + s; pb = i; } else { front += (pf === i - 1 ? 'L' : 'M') + s; pf = i; }
        }
        // the ring touches the abyss and turns its own band to light, permanently.
        // A missing ring leaves its band as a void: the saints cannot be fully edified.
        var zin = k === 0 ? 0 : R0 + GAP * k + 2, zout = k === 4 ? 2000 : R0 + GAP * (k + 1) + 2;
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, zout, 0, Math.PI * 2); if (zin) ctx.arc(0, 0, zin, 0, Math.PI * 2, true); ctx.clip('evenodd');
        if (on[k] && onScreen) { ctx.lineWidth = k === 2 ? 22 : 16; ctx.stroke(new Path2D(all)); }
        else if (!on[k]) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(7,7,9,' + Math.min(1, 3 * dt).toFixed(3) + ')'; ctx.fillRect(VB.x, VB.y, VB.w, VB.h); ctx.globalCompositeOperation = 'destination-out'; }
        ctx.restore();
        var col = align > .4 ? RAIN[k] : (k === 2 ? '#F2711C' : '#F3EAD0'), w = (k === 2 ? 2.8 : 1.8) + align * 2.4 + (hl === k ? 1.6 : 0);
        [[R.back, back, .45], [R.front, front, 1]].forEach(function (x) {
          x[0][0].setAttribute('d', x[1]); x[0][0].setAttribute('stroke-width', (w + 2.4).toFixed(2)); x[0][0].setAttribute('opacity', (x[2] * .55 * R.fade).toFixed(2));
          x[0][1].setAttribute('d', x[1]); x[0][1].setAttribute('stroke', col); x[0][1].setAttribute('stroke-width', w.toFixed(2)); x[0][1].setAttribute('opacity', (x[2] * R.fade).toFixed(2));
        });
        if (align > .02) R.bow.setAttribute('d', back + front);
        R.bow.setAttribute('opacity', R.fade.toFixed(2));
        var lp = pts[Math.floor(N * 0.12)], lc = align > .4 ? RAIN[k] : (k === 2 ? '#F2711C' : '#0B0B0C');
        var ls = Math.max(1, VB.w / (svg.clientWidth || VB.w) * .95);
        R.label.setAttribute('transform', 'translate(' + lp[0].toFixed(1) + ' ' + (lp[1] - 16 * ls).toFixed(1) + ') scale(' + ls.toFixed(2) + ')');
        R.rect.setAttribute('stroke', lc); R.text.setAttribute('fill', k === 2 && align <= .4 ? '#B4470A' : '#0B0B0C');
        R.label.setAttribute('opacity', ((lp[2] > 0 ? .55 : 1) * R.fade).toFixed(2));
      });
      ctx.restore();

      tSample += dt; if (tSample > .5) { tSample = 0; sample(); report(); }
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) { frame(16); } else requestAnimationFrame(frame);

    // drag to turn it any direction: up, down, left, right and every angle in between
    svg.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      yaw += dx * 0.01; vYaw = dx * 0.6; pitch += dy * 0.01; vPitch = dy * 0.6;
      if (reduce) frame(performance.now());
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { svg.addEventListener(n, function () { dragging = false; }); });

    // ring switches: all five are needed
    var sw = document.getElementById('ring-switches');
    if (sw) {
      sw.innerHTML = GIFTS.map(function (g, k) { return '<button type="button" aria-pressed="true" data-k="' + k + '"' + (k === 2 ? ' class="ev"' : '') + '>' + g + '</button>'; }).join('');
      sw.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; var k = +b.getAttribute('data-k');
        on[k] = !on[k]; b.setAttribute('aria-pressed', String(on[k])); report();
        if (reduce) frame(performance.now());
      });
    }
    var reset = document.getElementById('abyss-reset');
    if (reset) reset.addEventListener('click', function () { spread = 0; discLit = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#070709'; ctx.fillRect(0, 0, cv.width, cv.height); lit = 0; report(); });
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
