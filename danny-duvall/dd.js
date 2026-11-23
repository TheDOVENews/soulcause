/* Outward — Evangelist Danny DuVall.
 * 1) The flare: Christ at the center; five rotating rings of the five-fold ministry (Ephesians 4:11);
 *    solar-flare rays and waves expand outward; saints (the body of Christ) are carried outward, edified.
 * 2) Five-fold list highlights its ring.  3) Scroll reveal + timeline progress.  4) Church application form. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* ---------- 1. The flare ---------- */
  var svg = document.querySelector('#flare svg'), rings = [];
  if (svg) {
    var GIFTS = ['Apostles', 'Prophets', 'Evangelists', 'Pastors', 'Teachers'];
    var R0 = 54, GAP = 34;
    var defs = el('defs', {}, svg);
    var g1 = el('radialGradient', { id: 'christ' }, defs);
    el('stop', { offset: '0', 'stop-color': '#FFF4B8' }, g1); el('stop', { offset: '.7', 'stop-color': '#F5C518' }, g1); el('stop', { offset: '1', 'stop-color': '#F2A81C' }, g1);
    var g2 = el('radialGradient', { id: 'glow' }, defs);
    el('stop', { offset: '0', 'stop-color': '#F5C518', 'stop-opacity': '.55' }, g2); el('stop', { offset: '1', 'stop-color': '#F5C518', 'stop-opacity': '0' }, g2);

    var glow = el('circle', { r: 150, fill: 'url(#glow)' }, svg);
    var rayG = el('g', {}, svg), waveG = el('g', {}, svg), saintG = el('g', {}, svg), ringG = el('g', {}, svg);

    // solar-flare rays
    var rays = [];
    for (var i = 0; i < 36; i++) {
      var a = i / 36 * Math.PI * 2;
      rays.push({ a: a, p: Math.random() * Math.PI * 2, s: .6 + Math.random() * 1.2, line: el('line', { class: 'ray' }, rayG) });
    }
    // five rings with labels on a circular path, beads (people) on each ring
    GIFTS.forEach(function (name, k) {
      var r = R0 + GAP * (k + 1), ev = k === 2;
      var g = el('g', {}, ringG);
      var circ = el('circle', { r: r, class: 'ring' + (ev ? ' ev' : '') }, g);
      var id = 'rp' + k;
      el('path', { id: id, d: 'M' + (-r) + ' 0a' + r + ' ' + r + ' 0 1 1 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 1 ' + (-2 * r) + ' 0', fill: 'none' }, defs);
      var t = el('text', { class: 'lbl' + (ev ? ' ev' : ''), dy: '-5' }, g);
      var tp = el('textPath', { href: '#' + id, startOffset: '0' }, t); tp.textContent = name + '  ·  ';
      var tp2 = el('textPath', { href: '#' + id, startOffset: '50%' }, t); tp2.textContent = name;
      var n = 6 + k * 3;
      for (var j = 0; j < n; j++) { var b = j / n * Math.PI * 2; el('circle', { r: ev ? 3.6 : 2.6, cx: Math.cos(b) * r, cy: Math.sin(b) * r, class: 'bead' + (ev ? ' ev' : '') }, g); }
      rings.push({ g: g, circ: circ, r: r, speed: (k % 2 ? -1 : 1) * (5 + k * 1.6) * (ev ? 1.4 : 1), angle: k * 37 });
    });
    // Christ at the center
    var core = el('g', {}, svg);
    el('circle', { r: R0 - 6, fill: 'url(#christ)', stroke: '#0B0B0C', 'stroke-width': 3 }, core);
    el('path', { d: 'M0 -26V26M-17 -9H17', stroke: '#0B0B0C', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, core);
    var ct = el('text', { y: R0 + 18, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:10px' }, svg); ct.textContent = '';

    // saints: carried outward from Christ through the rings, edified as they pass the evangelist ring
    var saints = [];
    function spawn() {
      var a = Math.random() * Math.PI * 2;
      saints.push({ a: a, d: R0, v: 18 + Math.random() * 22, c: el('circle', { r: 2.2, class: 'saint' }, saintG) });
    }
    var waves = [];
    function wave() { waves.push({ r: R0, c: el('circle', { r: R0, class: 'wave' }, waveG) }); }

    var hl = 2, last = 0, tSpawn = 0, tWave = 0, T = 0;
    function frame(ts) {
      var dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; T += dt;
      // rings rotate, alternating direction
      rings.forEach(function (r, k) { r.angle += r.speed * dt; r.g.setAttribute('transform', 'rotate(' + r.angle.toFixed(2) + ')'); });
      // flare rays flicker outward
      rays.forEach(function (y) {
        var len = 24 + 26 * (0.5 + 0.5 * Math.sin(T * y.s * 2 + y.p)) + (Math.sin(T * 0.7 + y.a * 3) > .85 ? 40 : 0);
        var r1 = R0 + 4, r2 = r1 + len, c = Math.cos(y.a + T * .05), s = Math.sin(y.a + T * .05);
        y.line.setAttribute('x1', (c * r1).toFixed(1)); y.line.setAttribute('y1', (s * r1).toFixed(1));
        y.line.setAttribute('x2', (c * r2).toFixed(1)); y.line.setAttribute('y2', (s * r2).toFixed(1));
        y.line.setAttribute('stroke-width', (1.2 + len / 30).toFixed(2)); y.line.setAttribute('opacity', (0.35 + len / 140).toFixed(2));
      });
      glow.setAttribute('r', (150 + 18 * Math.sin(T * 1.3)).toFixed(1));
      // expanding waves
      tWave += dt; if (tWave > 1.8) { tWave = 0; wave(); }
      waves = waves.filter(function (w) {
        w.r += 70 * dt; var o = Math.max(0, 1 - (w.r - R0) / 240);
        w.c.setAttribute('r', w.r.toFixed(1)); w.c.setAttribute('opacity', o.toFixed(2));
        if (o <= 0) { w.c.remove(); return false; } return true;
      });
      // saints
      tSpawn += dt; if (tSpawn > .12) { tSpawn = 0; spawn(); }
      var evR = rings[2].r;
      saints = saints.filter(function (p) {
        p.d += p.v * dt * (p.d > evR ? 1.6 : 1);
        var edified = p.d > evR;
        p.c.setAttribute('cx', (Math.cos(p.a) * p.d).toFixed(1)); p.c.setAttribute('cy', (Math.sin(p.a) * p.d).toFixed(1));
        p.c.setAttribute('r', edified ? 3.2 : 2.2); p.c.setAttribute('fill', edified ? '#1E9E5A' : '#1F4FD8');
        var o = p.d > 250 ? Math.max(0, 1 - (p.d - 250) / 50) : 1; p.c.setAttribute('opacity', o.toFixed(2));
        if (p.d > 300) { p.c.remove(); return false; } return true;
      });
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) { frame(16); frame(32); } else requestAnimationFrame(frame);

    // highlight a ring from the five-fold list
    window.OutwardRing = function (k) {
      hl = k;
      rings.forEach(function (r, j) { r.circ.setAttribute('class', 'ring' + (j === 2 ? ' ev' : '') + (j === k ? ' hl' : '')); });
    };
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
