/* SoulCause platform demo: "The Two Trees". From the tree of the knowledge of good and evil,
 * uprooted and replanted, grafted into Christ the taproot, to the tree of life bearing the fruit of the Spirit. */
(function () {
  var D = function (s) { return 'data-d="' + s + '"'; };

  function treeSVG(kind, o) {
    o = o || {};
    var t = CineArt.tree({ seed: 11, droop: kind === 'withered' ? 0.32 : 0, depth: 6 });
    var cls = kind === 'withered' ? 'withered' : 'living';
    var br = t.paths.map(function (p) { return '<path class="br" d="' + p.d + '" stroke-width="' + p.w + '"/>'; }).join('');
    var rt = t.roots.map(function (p) { return '<path class="br rt" d="' + p.d + '" stroke-width="' + (p.w * 0.8).toFixed(1) + '"/>'; }).join('');
    var extra = '';
    if (kind === 'withered') {
      var labels = ['attendance', 'return visits', 'volunteers', 'operations', 'social presence', 'influence'];
      var picks = [3, 14, 24, 38, 50, 60];
      extra += picks.map(function (ti, k) {
        var p = t.tips[ti], w = labels[k].length * 8.6 + 18, x = Math.max(4, Math.min(596 - w, p[0] - w / 2)), y = p[1] + 34;
        return '<g class="tag a fade" ' + D(1 + k * 0.9) + '><line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + p[0].toFixed(1) + '" y2="' + (y - 13) + '"/><rect x="' + x.toFixed(1) + '" y="' + (y - 13) + '" width="' + w.toFixed(1) + '" height="24" rx="5"/><text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + 4) + '" text-anchor="middle">' + labels[k] + '</text></g>';
      }).join('');
      extra += [8, 19, 31, 44, 55].map(function (ti, k) { var p = t.tips[ti]; return '<circle class="dead a pop" ' + D(5 + k * 0.25) + ' cx="' + p[0].toFixed(1) + '" cy="' + (p[1] + 10).toFixed(1) + '" r="7"/>'; }).join('');
    }
    if (o.leaves) extra += t.tips.map(function (p, k) { return '<ellipse class="leaf a pop" ' + D((o.leafAt || 0) + (k % 16) * 0.06 + Math.floor(k / 16) * 0.12) + ' cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" rx="9" ry="6" transform="rotate(' + ((k * 37) % 180) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"/>'; }).join('');
    if (o.fruit) {
      var F = ['Love', 'Joy', 'Peace', 'Longsuffering', 'Gentleness', 'Goodness', 'Faith', 'Meekness', 'Temperance'];
      var C = ['#F2711C', '#F5C518', '#B9A6F0', '#1F4FD8', '#B9A6F0', '#1E9E5A', '#F5C518', '#1E9E5A', '#F2711C'];
      var byX = t.tips.slice().sort(function (a, b) { return a[0] - b[0]; });
      extra += F.map(function (f, k) {
        var p = byX[Math.round(2 + k * (byX.length - 5) / 8)], y = p[1] + 16, ly = k % 2 ? y - 20 : y + 30;
        return '<g class="fruit a pop" ' + D(o.fruit[k]) + '><circle cx="' + p[0].toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" fill="' + C[k] + '"/><text x="' + p[0].toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + f + '</text></g>';
      }).join('');
    }
    var soil = kind === 'withered'
      ? '<path class="soil-old" d="M20 470H580"/><path class="soil-old" d="M60 486h90M200 492h60M330 486h120M480 494h70" stroke-dasharray="6 9"/>'
      : '<path class="soil-new" d="M20 470H580"/><path class="soil-new" d="M50 488h120M220 496h70M330 488h140M500 496h50" stroke-dasharray="10 8"/>';
    var tap = o.taproot ? '<path class="taproot" pathLength="1" d="M300 470 C302 515 297 555 300 590" style="animation:draw 2.2s ease ' + o.taproot + 's forwards"/><g class="cross a pop" ' + D(o.taproot + 2) + '><circle cx="300" cy="628" r="36"/><path d="M300 604v48M284 620h32"/></g>' : '';
    var light = o.light != null ? '<circle class="light" cx="300" cy="300" r="320" style="animation:fadeIn 2.5s ease ' + o.light + 's forwards"/>' : '';
    var haze = kind === 'withered' ? '<ellipse class="haze" cx="300" cy="300" rx="280" ry="230"/>' : '';
    return '<svg viewBox="0 0 600 700" aria-hidden="true"><defs><radialGradient id="sunglow"><stop offset="0" stop-color="#F5C518" stop-opacity=".55"/><stop offset=".6" stop-color="#F5C518" stop-opacity=".12"/><stop offset="1" stop-color="#F5C518" stop-opacity="0"/></radialGradient></defs>'
      + light + haze + soil + tap
      + '<g class="tree ' + cls + (o.motion ? ' ' + o.motion : '') + '">' + rt + br + extra + '</g>'
      + (o.specks ? specks() : '') + '</svg>';
  }
  function specks() {
    var s = ''; for (var k = 0; k < 22; k++) { var x = 220 + (k * 53) % 160, dx = ((k * 71) % 200) - 100; s += '<circle class="speck" cx="' + x + '" cy="472" r="' + (2 + k % 4) + '" style="opacity:0;animation:spk' + (k % 3) + ' 1.6s ease-out ' + (2.6 + (k % 7) * 0.05) + 's forwards;--dx:' + dx + 'px"/>'; }
    return s + '<style>@keyframes spk0{0%{opacity:1;transform:none}100%{opacity:0;transform:translate(var(--dx),-140px)}}@keyframes spk1{0%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-90px)}}@keyframes spk2{0%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-180px)}}</style>';
  }

  var scenes = [
    { mood: 'dark', theme: 'night', t: 7, tone: 'Hushed and slow, almost a whisper, like the first line of a film.',
      say: 'Every church is rooted… in something.',
      fx: [[0.2, 'heartbeat'], [1.4, 'heartbeat'], [4.6, 'chime', 74]],
      build: function (el) { el.innerHTML = '<div class="center"><svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="5" fill="#F5C518" class="a pop" ' + D(4.4) + '/><circle cx="60" cy="60" r="24" fill="none" stroke="#F5C518" stroke-width="1.5" class="a fade" ' + D(4.8) + '/></svg><div class="mono a fade" ' + D(1) + ' style="font-size:12px;color:#F5C518">SoulCause presents</div><h1 class="a up" ' + D(2) + ' style="font-size:clamp(40px,8vw,84px)">The Two Trees</h1></div>'; } },

    { mood: 'dark', theme: 'toxic', t: 12, tone: 'Somber, honest, gentle. A little weary. Slow down on the list.',
      verse: ['Genesis 2:17 (KJV)', 'But of the tree of the knowledge of good and evil, thou shalt not eat of it.'],
      say: 'Some churches labor hard… attendance, return visits, volunteers, operations, influence. Busy branches… yet the fruit does not feed the soul.',
      fx: [[0.3, 'rumble', 2], [1, 'tick'], [1.9, 'tick'], [2.8, 'tick'], [3.7, 'tick'], [4.6, 'tick'], [5.5, 'tick'], [7.2, 'crack']],
      build: function (el) { el.innerHTML = '<div class="tree-wrap">' + treeSVG('withered') + '</div>'; } },

    { mood: 'rise', theme: 'toxic', t: 8, tone: 'Firm and resolute, with rising conviction. A pause before the last word.',
      verse: ['Matthew 15:13 (KJV)', 'Every plant, which my heavenly Father hath not planted, shall be rooted up.'],
      say: 'But what is planted in the wrong ground… can be uprooted.',
      fx: [[0.6, 'rumble', 3.4], [1.6, 'crack'], [2.6, 'boom'], [3.2, 'whoosh']],
      build: function (el) { el.innerHTML = '<div class="tree-wrap">' + treeSVG('withered', { motion: 'uproot', specks: true }) + '</div>'; } },

    { mood: 'rise', theme: 'dawn', t: 11, tone: 'Awe and tenderness, building to quiet triumph on the name of Jesus.',
      verse: ['John 15:5 (KJV)', 'I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit.'],
      say: 'Replanted in fresh soil. Grafted into the Kingdom. Drawing life from one taproot… Jesus Christ.',
      fx: [[0.3, 'whoosh'], [1.7, 'boom'], [2.4, 'riser', 3.4], [5.9, 'hit'], [6.1, 'shimmer']],
      build: function (el) { el.innerHTML = '<div class="tree-wrap">' + treeSVG('living', { motion: 'drop', taproot: 2.6, light: 5.6 }) + '<div class="mono a fade" ' + D(6.2) + ' style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);font-size:11px;color:#F5C518;white-space:nowrap">Christ · the taproot</div></div>'; } },

    { mood: 'joy', theme: 'day', t: 13, tone: 'Joyful and warm, smiling. Let each fruit land with a small pause.',
      verse: ['Galatians 5:22–23 (KJV)', 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance.'],
      say: 'And now… the fruit is different. Love. Joy. Peace. Longsuffering. Gentleness. Goodness. Faith. Meekness. Temperance.',
      build: function (el, A) {
        var at = [3.3, 4.1, 4.9, 5.7, 6.7, 7.5, 8.3, 9.1, 9.9];
        el.innerHTML = '<div class="tree-wrap">' + treeSVG('living', { leaves: true, leafAt: 0.4, fruit: at, light: 0, taproot: 0.01 }) + '</div>';
        A.sfx('shimmer'); [74, 76, 78, 81, 83, 85, 86, 88, 90].forEach(function (n, k) { A.at(at[k], function () { A.sfx('chime', n); }); });
      } },

    { mood: 'joy', theme: 'day', t: 10, tone: 'Confident, purposeful, uplifting. Lift on hundredfold.',
      verse: ['Matthew 13:23 (KJV)', 'But he that received seed into the good ground is he that heareth the word, and understandeth it; which also beareth fruit, and bringeth forth, some an hundredfold.'],
      say: 'This church tills the ground. Sows the good seed… and reaps a hundredfold.',
      build: function (el, A) {
        var seeds = '', sprouts = '';
        for (var k = 0; k < 14; k++) {
          var x = 60 + k * 60;
          seeds += '<ellipse cx="' + x + '" cy="250" rx="5" ry="3.5" fill="#F2711C" class="a" style="animation:fall .7s ease-in ' + (1.6 + k * 0.12).toFixed(2) + 's forwards"/>';
          sprouts += '<g class="a fade" ' + D((3.4 + k * 0.1).toFixed(2)) + '><path d="M' + x + ' 250 C' + (x - 2) + ' 220 ' + (x + 3) + ' 200 ' + x + ' ' + (170 - (k % 3) * 22) + '" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse class="leaf" cx="' + (x + 10) + '" cy="' + (196 - (k % 3) * 14) + '" rx="10" ry="5" transform="rotate(-30 ' + (x + 10) + ' ' + (196 - (k % 3) * 14) + ')"/><ellipse class="leaf" cx="' + (x - 10) + '" cy="' + (210 - (k % 3) * 14) + '" rx="10" ry="5" transform="rotate(30 ' + (x - 10) + ' ' + (210 - (k % 3) * 14) + ')"/></g>';
        }
        el.innerHTML = '<div class="center" style="gap:4px"><div class="field"><svg viewBox="0 0 900 300" aria-hidden="true"><path d="M20 256H880" stroke="#F2711C" stroke-width="4"/><path d="M40 274h820M70 290h760" stroke="#F2711C" stroke-width="2.5" stroke-dasharray="14 10" class="a fade" ' + D(0.4) + '/>' + seeds + sprouts + '</svg></div><div class="count"><span id="hf">1</span>×<small>a hundredfold</small></div></div>';
        A.sfx('whoosh');
        for (var s = 0; s < 14; s++) (function (s) { A.at(1.6 + s * 0.12 + 0.6, function () { A.sfx('seed', 86 + (s % 5) * 2); }); })(s);
        var n = el.querySelector('#hf'), vals = [1, 5, 12, 30, 45, 60, 75, 90, 100];
        vals.forEach(function (v, k) { A.at(4 + k * 0.32, function () { n.textContent = v; if (v === 30 || v === 60) A.sfx('pluck', 78); if (v === 100) { A.sfx('hit'); } }); });
      } },

    { mood: 'joy', theme: 'night', t: 9, tone: 'Expansive and bold, like a sweeping aerial shot.',
      verse: ['Isaiah 11:12 (KJV)', 'And he shall set up an ensign for the nations… and gather together the dispersed of Judah from the four corners of the earth.'],
      say: 'From your street… to the four corners of the earth.',
      fx: [[0.2, 'whoosh'], [2.4, 'boom'], [2.6, 'shimmer']],
      build: function (el, A) {
        var s = Math.round(Math.min(A.size() * 0.62, 460));
        el.innerHTML = '<div class="globe-hold"><span class="ripple"></span><span class="ripple" style="animation-delay:1s"></span><span class="ripple" style="animation-delay:2s"></span><div data-globe="' + s + '" data-spin="40" data-ink="#FFFFFF" data-paper="#0B0B0C" data-grid="#2A2A33" data-accent="#1E9E5A"></div>'
          + '<span class="corner a fade" ' + D(2.4) + ' style="top:4%;left:4%">North</span><span class="corner a fade" ' + D(2.6) + ' style="top:4%;right:4%">East</span><span class="corner a fade" ' + D(2.8) + ' style="bottom:4%;right:4%">South</span><span class="corner a fade" ' + D(3) + ' style="bottom:4%;left:4%">West</span></div>';
        if (window.SC_GLOBE) SC_GLOBE.mountAll(el);
      } },

    { mood: 'drive', theme: 'day', t: 13, tone: 'Upbeat, energetic, inviting. Punch each name: SEND, OBEDIENCE, UNREACHED, LABOR.',
      say: 'SoulCause walks with you. SEND your first twelve. Walk in OBEDIENCE. Reach the UNREACHED. LABOR two by two.',
      build: function (el, A) {
        var T = [['SEND', '#1F4FD8', '#fff', 'S · Matthew 10', 'Send your first twelve.'], ['OBEDIENCE', '#B9A6F0', '#0B0B0C', 'O · Matthew 28:20', 'NET services and the FIELD app.'], ['UNREACHED', '#1E9E5A', '#0B0B0C', 'U · Romans 15:20', 'Networks reaching the nations.'], ['LABOR', '#F2711C', '#0B0B0C', 'L · Luke 10:2', 'Train the seventy, two by two.']];
        var at = [2.2, 3.9, 5.8, 7.6];
        el.innerHTML = '<div class="center" style="gap:16px"><h2 class="a up" ' + D(0.3) + ' style="font-size:clamp(26px,4vw,44px)">Soul<span style="font-weight:500">Cause</span> walks with you</h2><div class="tiles">' + T.map(function (t, k) { return '<div class="tile a slam" ' + D(at[k]) + ' style="background:' + t[1] + ';color:' + t[2] + '"><h3>' + t[0] + '</h3><span class="mono">' + t[3] + '</span><p>' + t[4] + '</p></div>'; }).join('') + '</div></div>';
        at.forEach(function (t) { A.at(t, function () { A.sfx('whoosh'); }); A.at(t + 0.2, function () { A.sfx('pop'); }); });
      } },

    { mood: 'joy', theme: 'night', t: 7, tone: 'Assured, steady, a knowing smile.',
      verse: ['1 Corinthians 14:40 (KJV)', 'Let all things be done decently and in order.'],
      say: 'And behind it all… OUTWARD keeps the house in order.',
      fx: [[2.2, 'hit']],
      build: function (el) {
        var w = 'OUTWARD'.split('').map(function (c, k) { return '<span ' + D((2 + k * 0.08).toFixed(2)) + '>' + c + '</span>'; }).join('');
        el.innerHTML = '<div class="center" style="gap:0"><div class="wm">' + w + '</div><div class="wm mirror" aria-hidden="true">' + w + '</div><div class="mono a fade" ' + D(3) + ' style="font-size:12px;color:#F5C518;margin-top:6px">Compliance · Operations · Reporting</div></div>';
      } },

    { mood: 'finale', theme: 'sun', t: 12, tone: 'Warm, triumphant, and resolved. Slow, with space between each line.',
      verse: ['John 15:16 (KJV)', 'I have chosen you, and ordained you, that ye should go and bring forth fruit, and that your fruit should remain.'],
      say: 'Till the ground. Sow the seed. Bear fruit that remains… SoulCause.',
      fx: [[0.2, 'hit'], [0.4, 'shimmer']],
      build: function (el, A) {
        var s = Math.round(Math.min(A.size() * 0.3, 200));
        el.innerHTML = '<div class="center"><div class="a pop" ' + D(0.3) + ' data-globe="' + s + '" data-spin="16" data-accent="#1E9E5A" data-paper="#FFFFFF"></div><div class="sc-wm a up" ' + D(0.8) + '>Soul<span>Cause</span></div>'
          + '<div class="a fade" ' + D(1.6) + ' style="font-family:Space Grotesk,sans-serif;font-weight:600;font-size:clamp(18px,2.6vw,26px)">Till the ground. Sow the seed. Bear fruit that remains.</div>'
          + '<div class="btns a fade" ' + D(4) + '><a class="btn solid" href="/" style="background:#0B0B0C;border-color:#0B0B0C;color:#fff">Enter SoulCause</a><a class="btn" href="/outward/demo/outward">Watch the OUTWARD demo</a></div></div>';
        if (window.SC_GLOBE) SC_GLOBE.mountAll(el);
      } }
  ];

  window.SC_SCENES_PLATFORM = scenes;
  if (!window.CINE_NO_AUTO) CineDemo({ scenes: scenes });
})();
