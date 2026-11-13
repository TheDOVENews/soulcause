/* SoulCause cinematic demo engine.
 * Plays a list of scenes with a live score, timed sound effects, a KJV verse (reference typed out),
 * captions, and OWL Voice narration (OpenAI text-to-speech through /api/voice) when it is turned on.
 * Pause, previous, next, mute and replay. Keyboard: space, arrow keys, M. */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.CineDemo = function (cfg) {
    var scenes = cfg.scenes, score = new SCScore();
    var root = $('#cine'), stage = $('#stage'), cap = $('#cap'), verse = $('#verse'), bar = $('#bar i'), gate = $('#gate');
    var i = -1, elapsed = 0, dur = 0, playing = false, events = [], last = 0, audio = null, voiceOn = false, voices = [], muted = false, finished = false;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- OWL Voice ---
    var status = $('#voice-status');
    fetch('/api/voice', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : { ready: false }; }).catch(function () { return { ready: false }; }).then(function (s) {
      voiceOn = !!s.ready;
      if (status) status.textContent = voiceOn ? 'Narration: OWL Voice, powered by OpenAI' : 'Narration: on-screen captions. The OWL Voice turns on once an OpenAI key is added in Vercel.';
      if (voiceOn) scenes.forEach(function (sc, k) { voices[k] = sc.say ? fetchVoice(sc) : Promise.resolve(null); });
    });
    function fetchVoice(sc) {
      return fetch('/api/voice', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: sc.say, tone: sc.tone || '' }) })
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { return new Promise(function (res) { var a = new Audio(URL.createObjectURL(b)); a.preload = 'auto'; a.onloadedmetadata = function () { res(a); }; a.onerror = function () { res(null); }; }); })
        .catch(function () { return null; });
    }
    function timeout(ms) { return new Promise(function (r) { setTimeout(function () { r(null); }, ms); }); }

    // --- scene api ---
    var A = {
      score: score,
      sfx: function (n, a) { score.sfx(n, a); },
      at: function (t, fn) { events.push({ t: t, fn: fn }); },
      size: function () { return Math.min(window.innerWidth, window.innerHeight); },
      esc: esc
    };

    function show(k) {
      if (k < 0 || k >= scenes.length) return;
      if (audio) { audio.pause(); audio = null; }
      i = k; elapsed = 0; events = []; finished = false;
      var sc = scenes[k];
      root.className = 'theme-' + (sc.theme || 'night') + (playing ? '' : ' paused');
      score.setMood(sc.mood || 'joy');
      stage.innerHTML = '';
      var holder = document.createElement('div'); holder.className = 'scene'; stage.appendChild(holder);
      if (sc.build) sc.build(holder, A);
      holder.querySelectorAll('[data-d]').forEach(function (n) { n.style.animationDelay = n.getAttribute('data-d') + 's'; });
      (sc.fx || []).forEach(function (f) { A.at(f[0], function () { score.sfx(f[1], f[2]); }); });
      // verse: text loaded, reference typed
      verse.innerHTML = sc.verse ? '<p class="vt">' + esc(sc.verse[1]) + '</p><p class="vr"><span></span><b class="caret"></b></p>' : '';
      if (sc.verse) { var ref = sc.verse[0], span = $('.vr span', verse); for (var c = 0; c <= ref.length; c++) (function (c) { A.at(0.5 + c * 0.05, function () { span.textContent = ref.slice(0, c); }); })(c); }
      dur = sc.t;
      var go = function (a) {
        if (k !== i) return;
        audio = a || null;
        var spoken = audio ? audio.duration : 0;
        dur = Math.max(sc.t, spoken ? spoken + 1.2 : 0);
        caption(sc.say || '', audio ? spoken : Math.min(sc.t * 0.8, Math.max(2.5, (sc.say || '').split(' ').length * 0.32)));
        if (audio) { audio.muted = muted; A.at(0.4, function () { score.duck(true); audio.currentTime = 0; if (playing) audio.play().catch(function () {}); }); audio.onended = function () { score.duck(false); }; }
        else score.duck(false);
      };
      if (voiceOn && voices[k]) Promise.race([voices[k], timeout(4000)]).then(go); else go(null);
      document.querySelectorAll('#dots i').forEach(function (d, j) { d.className = j === k ? 'on' : j < k ? 'done' : ''; });
    }
    function caption(text, spread) {
      var words = text.split(/\s+/).filter(Boolean), per = words.length ? spread / words.length : 0;
      cap.innerHTML = words.map(function (w, j) { return '<span style="animation-delay:' + (0.4 + j * per).toFixed(2) + 's">' + esc(w) + '</span>'; }).join(' ');
    }

    function loop(ts) {
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      if (playing && i >= 0 && !finished) {
        elapsed += dt;
        events = events.filter(function (e) { if (e.t <= elapsed) { try { e.fn(); } catch (x) { console.error(x); } return false; } return true; });
        bar.style.width = (100 * ((i + Math.min(1, elapsed / dur)) / scenes.length)).toFixed(2) + '%';
        if (elapsed >= dur) { if (i < scenes.length - 1) show(i + 1); else { finished = true; score.setMood('finale'); } }
      }
      requestAnimationFrame(loop);
    }

    function play() { playing = true; root.classList.remove('paused'); score.resume(); if (audio && audio.currentTime > 0 && !audio.ended) audio.play().catch(function () {}); $('#c-play').setAttribute('aria-label', 'Pause'); $('#c-play').innerHTML = ICON.pause; }
    function pause() { playing = false; root.classList.add('paused'); score.pause(); if (audio) audio.pause(); $('#c-play').setAttribute('aria-label', 'Play'); $('#c-play').innerHTML = ICON.play; }
    var ICON = {
      play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
      pause: '<svg viewBox="0 0 24 24"><path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor"/></svg>',
      prev: '<svg viewBox="0 0 24 24"><path d="M6 4h2v16H6zM20 4L9 12l11 8z" fill="currentColor"/></svg>',
      next: '<svg viewBox="0 0 24 24"><path d="M16 4h2v16h-2zM4 4l11 8-11 8z" fill="currentColor"/></svg>',
      sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 010 8M18.5 5.5a8.5 8.5 0 010 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
      mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      replay: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 108-8H8" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M9 1L5 4l4 3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    $('#c-play').innerHTML = ICON.pause; $('#c-prev').innerHTML = ICON.prev; $('#c-next').innerHTML = ICON.next; $('#c-mute').innerHTML = ICON.sound; $('#c-replay').innerHTML = ICON.replay;
    $('#dots').innerHTML = scenes.map(function () { return '<i></i>'; }).join('');

    $('#c-play').onclick = function () { playing ? pause() : play(); };
    $('#c-prev').onclick = function () { show(Math.max(0, i - 1)); };
    $('#c-next').onclick = function () { show(Math.min(scenes.length - 1, i + 1)); };
    $('#c-replay').onclick = function () { show(0); if (!playing) play(); };
    $('#c-mute').onclick = function () { muted = !muted; score.mute(muted); if (audio) audio.muted = muted; this.innerHTML = muted ? ICON.mute : ICON.sound; this.setAttribute('aria-label', muted ? 'Sound on' : 'Mute'); };
    document.addEventListener('keydown', function (e) {
      if (gate && !gate.hidden) return;
      if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
      else if (e.key === 'ArrowRight') show(Math.min(scenes.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') show(Math.max(0, i - 1));
      else if (e.key === 'm' || e.key === 'M') $('#c-mute').click();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && playing) pause(); });

    $('#begin').onclick = function () {
      score.init(); score.resume(); gate.hidden = true; root.hidden = false; playing = true;
      if (reduce) root.classList.add('reduce');
      show(0); requestAnimationFrame(loop);
    };
  };

  // Shared drawing helpers for scenes
  window.CineArt = {
    // deterministic line-art tree. opts: {seed, droop, depth}
    tree: function (o) {
      o = o || {}; var seed = o.seed || 7, droop = o.droop || 0, depth = o.depth || 6, paths = [], tips = [], roots = [];
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      function br(x, y, a, l, d, out, tipOut, dir) {
        var x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l, mx = (x + x2) / 2 + (rnd() - 0.5) * l * 0.25, my = (y + y2) / 2 + (rnd() - 0.5) * l * 0.25;
        out.push({ d: 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1), w: (d * 1.7 + 1.2).toFixed(1), lvl: depth - d });
        if (d <= 0) { if (tipOut) tipOut.push([x2, y2]); return; }
        var sp = 0.42 + rnd() * 0.22, k = 0.7 + rnd() * 0.08;
        [a - sp, a + sp].forEach(function (c) { c += droop * dir * (Math.cos(c) >= 0 ? 1 : -1); br(x2, y2, c, l * k, d - 1, out, tipOut, dir); });
      }
      br(300, 470, -Math.PI / 2, 120, depth, paths, tips, 1);
      // roots spread downward
      [0.55, 1.15, 1.95, 2.55].forEach(function (a) { br(300, 470, a, 40 + rnd() * 16, 3, roots, null, 0); });
      return { paths: paths, tips: tips, roots: roots };
    }
  };
})();
