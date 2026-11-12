/* SoulCause globe mark — an orthographic line-art globe that turns,
   fills the visitor's continent, and is held by the four corners of the earth. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var RAD = Math.PI / 180;
  var GRAT = [];
  for (var lon = -180; lon < 180; lon += 30) { var l = []; for (var lat = -84; lat <= 84; lat += 6) l.push([lon, lat]); GRAT.push(l); }
  [-60, -30, 0, 30, 60].forEach(function (lat) { var l = []; for (var lo = -180; lo <= 180; lo += 6) l.push([lo, lat]); GRAT.push(l); });
  var globes = [];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function Globe(host) {
    var S = parseInt(host.getAttribute('data-globe'), 10) || 200;
    this.S = S; this.spin = parseFloat(host.getAttribute('data-spin') || '12');
    this.c = S / 2; this.R = S * 0.355; this.R2 = S * 0.43;
    this.tilt = 18 * RAD;
    var v = SC_GEO.get();
    this.lon = v.lon != null ? v.lon : SC_GEO.CENTERS[v.key];
    this.home = v.key;
    var ink = host.getAttribute('data-ink') || '#0B0B0C', paper = host.getAttribute('data-paper') || '#FFFFFF';
    var grid = host.getAttribute('data-grid') || '#D5D3DD', accent = host.getAttribute('data-accent') || '#1F4FD8';
    var f = function (n) { return n.toFixed(1); };
    var svg = el('svg', { width: S, height: S, viewBox: '0 0 ' + S + ' ' + S, fill: 'none', 'class': 'globe-svg', role: 'img' });
    this.svg = svg;
    svg.appendChild(el('circle', { cx: f(this.c), cy: f(this.c), r: f(this.R), fill: paper }));
    this.grat = el('path', { stroke: grid, 'stroke-width': f(Math.max(0.6, S * 0.0025)), 'stroke-linecap': 'round' });
    this.other = el('path', { fill: paper, stroke: ink, 'stroke-width': f(Math.max(0.7, S * 0.005)), 'stroke-linejoin': 'round' });
    this.homeP = el('path', { fill: accent, stroke: ink, 'stroke-width': f(Math.max(0.7, S * 0.005)), 'stroke-linejoin': 'round' });
    svg.appendChild(this.grat); svg.appendChild(this.other); svg.appendChild(this.homeP);
    svg.appendChild(el('circle', { cx: f(this.c), cy: f(this.c), r: f(this.R), stroke: ink, 'stroke-width': f(Math.max(1.6, S * 0.012)) }));
    var arcs = '';
    var c = this.c, R2 = this.R2;
    [45, 135, 225, 315].forEach(function (a) {
      var a1 = (a - 22) * RAD, a2 = (a + 22) * RAD;
      arcs += 'M' + f(c + R2 * Math.cos(a1)) + ' ' + f(c + R2 * Math.sin(a1)) + 'A' + f(R2) + ' ' + f(R2) + ' 0 0 1 ' + f(c + R2 * Math.cos(a2)) + ' ' + f(c + R2 * Math.sin(a2));
    });
    svg.appendChild(el('path', { d: arcs, 'class': 'arc', pathLength: 1, stroke: ink, 'stroke-width': f(Math.max(2.2, S * 0.032)), 'stroke-linecap': 'round' }));
    host.appendChild(svg);
    this.label();
    this.draw();
  }
  Globe.prototype.label = function () {
    this.svg.setAttribute('aria-label', 'SoulCause globe, turning, with ' + SC_GEO.NAMES[this.home] + ' highlighted, held by the four corners of the earth');
  };
  Globe.prototype.draw = function () {
    var c = this.c, R = this.R, l0 = this.lon * RAD, st = Math.sin(this.tilt), ct = Math.cos(this.tilt);
    function proj(pt) {
      var lam = pt[0] * RAD - l0, phi = pt[1] * RAD, cp = Math.cos(phi);
      var x = R * cp * Math.sin(lam), y = R * (ct * Math.sin(phi) - st * cp * Math.cos(lam));
      var vis = st * Math.sin(phi) + ct * cp * Math.cos(lam) >= 0;
      if (!vis) { var m = Math.hypot(x, y) || 1; x = x / m * R; y = y / m * R; }
      return [c + x, c - y, vis];
    }
    function polys(list) {
      var d = '';
      list.forEach(function (poly) {
        var pts = poly.map(proj), any = false;
        for (var i = 0; i < pts.length; i++) if (pts[i][2]) { any = true; break; }
        if (!any) return;
        d += 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z';
      });
      return d;
    }
    var other = '', home = '', self = this;
    Object.keys(SC_GEO.LAND).forEach(function (k) { if (k === self.home) home += polys(SC_GEO.LAND[k]); else other += polys(SC_GEO.LAND[k]); });
    this.other.setAttribute('d', other); this.homeP.setAttribute('d', home);
    if (this.S >= 80) {
      var g = '';
      GRAT.forEach(function (line) { var pen = false; line.forEach(function (pt) { var q = proj(pt); if (q[2]) { g += (pen ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); pen = true; } else pen = false; }); });
      this.grat.setAttribute('d', g);
    }
  };

  var last = 0;
  function tick(t) {
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    globes.forEach(function (g) {
      if (!g.visible) return;
      if (g.target != null) {
        var d = ((g.target - g.lon + 540) % 360) - 180;
        if (reduce || Math.abs(d) < 0.3) { g.lon = g.target; g.target = null; } else g.lon += d * Math.min(1, dt * 3.5);
        g.draw(); return;
      }
      if (!g.spin || reduce) return;
      g.lon = ((g.lon - g.spin * dt + 540) % 360) - 180;
      g.draw();
    });
    requestAnimationFrame(tick);
  }

  window.SC_GLOBE = {
    focus: function (host, key) {
      var g = host && host.__globe; if (!g) return;
      g.home = key; g.target = SC_GEO.CENTERS[key]; g.pinned = true; g.label(); g.draw();
    },
    mountAll: function (root) {
      (root || document).querySelectorAll('[data-globe]').forEach(function (host) {
        if (host.__globe) return;
        var g = new Globe(host); host.__globe = g; g.visible = true; globes.push(g);
      });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.target.__globe) e.target.__globe.visible = e.isIntersecting; }); });
        globes.forEach(function (g) { io.observe(g.svg.parentNode); });
      }
    }
  };
  SC_GEO.onChange(function (v) {
    globes.forEach(function (g) { if (g.pinned) return; g.home = v.key; g.lon = v.lon; g.label(); g.draw(); });
  });
  requestAnimationFrame(tick);
})();
