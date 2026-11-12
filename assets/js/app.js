/* SoulCause app: welcome flow → prayer → platform, hash routing, verse interstitial. */
(function () {
  var C = window.SC_CONTENT;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var HOLD_MS = 3000, TYPE_MS = 40;
  var state = { stage: 'welcome', role: '', page: 'home', verse: null };

  /* ---------- welcome flow ---------- */
  var welcome = $('#welcome');
  var DAY = 864e5, QUIET_DAYS = 15, seen = false;
  try {
    var last = parseInt(localStorage.getItem('sc-last-visit') || '0', 10);
    var quiet = localStorage.getItem('sc-quiet') === '1';
    seen = quiet && last && (Date.now() - last) < QUIET_DAYS * DAY;
    localStorage.setItem('sc-last-visit', String(Date.now()));
  } catch (e) {}
  function setStage(s) {
    state.stage = s;
    $$('.w-stage', welcome).forEach(function (el) { el.hidden = el.getAttribute('data-stage') !== s; });
    var first = $('.w-stage[data-stage="' + s + '"] input, .w-stage[data-stage="' + s + '"] button', welcome);
    if (first && s !== 'welcome') setTimeout(function () { first.focus(); }, 300);
  }
  function closeWelcome() {
    welcome.hidden = true; document.body.classList.remove('locked');
    try { localStorage.setItem('sc-quiet', '1'); localStorage.setItem('sc-last-visit', String(Date.now())); } catch (e) {}
  }
  if (seen) closeWelcome(); else document.body.classList.add('locked');

  function placeName() {
    var v = SC_GEO.get();
    $$('[data-visitor-place]').forEach(function (el) { el.textContent = (SC_GEO.NAMES[v.key] || 'around the world').toUpperCase(); });
  }
  placeName(); SC_GEO.onChange(placeName);

  $$('.pill').forEach(function (p) {
    p.addEventListener('click', function () {
      var r = p.getAttribute('data-role');
      state.role = state.role === r ? '' : r;
      $$('.pill').forEach(function (q) { q.setAttribute('aria-pressed', q.getAttribute('data-role') === state.role ? 'true' : 'false'); });
      if (state.role) setTimeout(function () { showQ(qi + 1); }, 250);
    });
  });

  function buildPrayer(first, hasNeed, role) {
    var who = first || 'this friend';
    var lines = ['Father, thank You for ' + who + '. You knew them before they arrived here today, and You have a purpose for their life.'];
    if (hasNeed) lines.push('You heard what ' + who + ' shared just now. Meet them right there, with Your peace and Your provision.');
    if (role && C.roleLines[role]) lines.push(C.roleLines[role]);
    lines.push('Fill them with Your Spirit, give them courage to share the good news, and let every good seed they sow return a hundredfold. In Jesus’ name.');
    $('#prayer-title').textContent = first ? first + ', we are praying for you.' : 'We are praying for you.';
    var body = $('#prayer-body'); body.innerHTML = '';
    lines.forEach(function (t) { var p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    var a = document.createElement('p'); a.className = 'amen'; a.textContent = 'Amen.'; body.appendChild(a);
  }

  var form = $('#visitor-form');
  var QS = $$('.q', form), qi = 0;
  $('#q-dots').innerHTML = QS.map(function () { return '<i></i>'; }).join('');
  function showQ(i) {
    if (i >= QS.length) return finishForm();
    qi = Math.max(0, i);
    QS.forEach(function (q, k) { q.hidden = k !== qi; });
    $$('#q-dots i').forEach(function (d, k) { d.classList.toggle('on', k <= qi); });
    $('#q-count').textContent = (qi + 1) + ' OF ' + QS.length;
    $('[data-action="back"]', form).style.visibility = qi ? 'visible' : 'hidden';
    $('#q-next').textContent = qi === QS.length - 1 ? 'Pray for me \u2192' : 'Next \u2192';
    $('.form-error', form).hidden = true;
    var f = $('input,textarea', QS[qi]); if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function finishForm() {
    var fd = new FormData(form);
    var data = {
      first_name: (fd.get('first_name') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      church: (fd.get('church') || '').toString().trim(),
      role: state.role || null,
      prayer_request: (fd.get('prayer_request') || '').toString().trim(),
      wants_updates: !!fd.get('wants_updates'),
      continent: SC_GEO.get().key
    };
    buildPrayer(data.first_name.split(/\s+/)[0], !!data.prayer_request, data.role);
    setStage('prayer');
    if (data.first_name || data.email || data.prayer_request) {
      fetch('/api/visitor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function () {});
    }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = form.elements.email.value.trim();
    if (QS[qi].getAttribute('data-q') === 'email' && em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      var err = $('.form-error', form); err.textContent = 'That email doesn\u2019t look right. Check it, or skip this question.'; err.hidden = false; return;
    }
    showQ(qi + 1);
  });
  form.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]'); if (!a) return;
    if (a.getAttribute('data-action') === 'back') showQ(qi - 1);
    if (a.getAttribute('data-action') === 'next-skip') { var f = $('input[type=text],input[type=email],textarea', QS[qi]); if (f) f.value = ''; showQ(qi + 1); }
  });

  welcome.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action],[data-go]'); if (!t) return;
    var a = t.getAttribute('data-action');
    if (a === 'to-form') { setStage('form'); showQ(0); }
    if (a === 'skip-all' || a === 'been-here') { closeWelcome(); render('home'); return; }
    var g = t.getAttribute('data-go');
    if (g) { closeWelcome(); go(g); }
  });

  /* ---------- nav + routing ---------- */
  var nav = $('#nav');
  C.nav.forEach(function (n) {
    var a = document.createElement('a'); a.href = '#' + n[0]; a.setAttribute('data-go', n[0]);
    a.innerHTML = '<span>' + n[1] + '</span><i style="background:' + n[2] + '"></i>';
    nav.appendChild(a);
  });
  $('#fruit-chips').innerHTML = C.fruit.map(function (f) { return '<span class="chip"><i style="background:' + f[1] + '"></i>' + f[0] + '</span>'; }).join('');

  function render(page) {
    state.page = page;
    $$('#nav a').forEach(function (a) { if (a.getAttribute('data-go') === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var home = page === 'home';
    $('#page-home').hidden = !home; $('#page-sub').hidden = home;
    if (!home) {
      var p = C.pages[page];
      var hero = $('#sub-hero'); hero.style.background = p.color; hero.style.color = p.ink;
      $('#sub-tier').textContent = p.tier; $('#sub-name').textContent = p.name; $('#sub-lead').textContent = p.lead;
      $('#sub-letters').innerHTML = p.letters.map(function (l) { return '<span class="chip"><b>' + l[0] + '</b>' + l[1] + '</span>'; }).join('');
      $('#sub-cards').innerHTML = p.cards.map(function (c) { return '<div class="card"><span class="bar" style="background:' + p.color + '"></span><h3>' + c[0] + '</h3><p>' + c[1] + '</p></div>'; }).join('');
      $('#sub-price').textContent = p.price;
      var nx = $('#sub-next'); nx.textContent = p.cta; nx.setAttribute('data-go', p.next);
      document.title = p.name + ' — SoulCause';
    } else document.title = 'SoulCause — Back to the roots. Back to the Great Commission.';
    window.scrollTo(0, 0);
  }

  /* ---------- verse interstitial: verse shown at once, reference types, 3s hold ---------- */
  var vs = $('#verse'), timer = null;
  function go(page) {
    if (!C.verses[page]) page = 'home';
    if (location.hash !== '#' + page) history.pushState(null, '', '#' + page);
    showVerse(page);
  }
  function showVerse(page) {
    var v = C.verses[page];
    state.verse = { page: page, typed: 0, paused: false, remain: HOLD_MS, ref: '— ' + v.ref };
    $('.v-dest', vs).textContent = 'ENTERING ' + v.dest; $('.v-dest', vs).style.color = v.color;
    $('.v-text', vs).textContent = v.text;
    $('.v-ref', vs).style.color = v.color; $('.v-ref-text', vs).textContent = '';
    $('.v-bar div', vs).style.background = v.color; $('.v-bar div', vs).style.width = '100%';
    $('[data-action="pause"]', vs).textContent = 'Pause';
    $('.v-status', vs).textContent = 'Reading…';
    vs.hidden = false; document.body.classList.add('locked');
    $('[data-action="proceed"]', vs).focus({ preventScroll: true });
    clearInterval(timer); timer = setInterval(step, TYPE_MS);
  }
  function step() {
    var s = state.verse; if (!s || s.paused) return;
    if (s.typed < s.ref.length) { s.typed++; $('.v-ref-text', vs).textContent = s.ref.slice(0, s.typed); return; }
    s.remain -= TYPE_MS;
    $('.v-status', vs).textContent = 'Continuing in ' + Math.max(1, Math.ceil(s.remain / 1000)) + 's';
    $('.v-bar div', vs).style.width = Math.max(0, s.remain / HOLD_MS * 100) + '%';
    if (s.remain <= 0) finish();
  }
  function finish() {
    clearInterval(timer); var s = state.verse; state.verse = null;
    vs.hidden = true; if (welcome.hidden) document.body.classList.remove('locked');
    render(s ? s.page : 'home');
  }
  vs.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]'); if (!a) return;
    if (a.getAttribute('data-action') === 'proceed') finish();
    if (a.getAttribute('data-action') === 'pause' && state.verse) {
      state.verse.paused = !state.verse.paused;
      a.textContent = state.verse.paused ? 'Resume' : 'Pause';
      $('.v-status', vs).textContent = state.verse.paused ? 'Paused. Take your time, then proceed.' : 'Continuing…';
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !vs.hidden) finish(); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]'); if (!t || welcome.contains(t)) return;
    e.preventDefault(); go(t.getAttribute('data-go'));
  });
  window.addEventListener('popstate', function () { var h = (location.hash || '#home').slice(1); render(C.verses[h] ? h : 'home'); });

  /* ---------- region explorer ---------- */
  var R = C.regions, regionKey = null, focusKey = 'pray';
  var fmt = function (n) { return n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n.toLocaleString(); };
  function countTo(el, to, render) {
    var from = parseFloat(el.getAttribute('data-v') || '0'), t0 = performance.now(), dur = 900;
    el.setAttribute('data-v', to);
    (function frame(t) { var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3); el.textContent = render(from + (to - from) * k); if (k < 1) requestAnimationFrame(frame); })(t0);
  }
  function showFocus() {
    var f = C.focus[focusKey];
    $$('#focus-pills .pill').forEach(function (b) { var on = b.getAttribute('data-focus') === focusKey; b.setAttribute('aria-pressed', on); b.style.background = on ? C.focus[b.getAttribute('data-focus')].color : '#fff'; });
    $('#focus-line').textContent = f.line.replace('{region}', SC_GEO.NAMES[regionKey]);
    var cta = $('#focus-cta'); cta.textContent = f.cta; cta.setAttribute('data-go', f.go);
  }
  function showRegion(k) {
    regionKey = k; var d = R.data[k];
    $$('#region-pills button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-region') === k); });
    $('#region-name').textContent = SC_GEO.NAMES[k] + (d.note ? ' (' + d.note + ')' : '');
    ['pop', 'groups', 'upg', 'workers'].forEach(function (s) { countTo($('[data-stat="' + s + '"]'), d[s], function (v) { return fmt(Math.round(v)); }); });
    countTo($('[data-stat="upgPct"]'), d.upgPct, function (v) { return v.toFixed(1) + '%'; });
    countTo($('[data-stat="evang"]'), d.evang, function (v) { return v.toFixed(1) + '%'; });
    $('#meter-fill').style.width = d.upgPct + '%'; $('#meter-evang').style.width = d.evang + '%';
    $('#region-verse').textContent = '\u201C' + d.verse + '\u201D \u2014 ' + d.ref + ' (KJV)';
    SC_GLOBE.focus($('#explore-globe'), k);
    showFocus();
  }
  $('#region-pills').innerHTML = Object.keys(R.data).map(function (k) { return '<button type="button" role="tab" data-region="' + k + '" aria-selected="false">' + SC_GEO.NAMES[k] + '</button>'; }).join('');
  $('#focus-pills').innerHTML = Object.keys(C.focus).map(function (k) { return '<button type="button" class="pill focus" data-focus="' + k + '" aria-pressed="false">' + C.focus[k].label + '</button>'; }).join('');
  $('#region-source').innerHTML = 'Source: <a href="' + R.source + '" target="_blank" rel="noopener">' + R.asOf + '</a>. Unreached = under 2% evangelical and under 5% Christian. Workers needed = one per 50,000 people in unreached groups.';
  $('#region-pills').addEventListener('click', function (e) { var b = e.target.closest('[data-region]'); if (b) showRegion(b.getAttribute('data-region')); });
  $('#focus-pills').addEventListener('click', function (e) { var b = e.target.closest('[data-focus]'); if (b) { focusKey = b.getAttribute('data-focus'); showFocus(); } });

  var start = (location.hash || '#home').slice(1);
  render(C.verses[start] ? start : 'home');
  SC_GLOBE.mountAll();
  showRegion(SC_GEO.get().key);
  SC_GEO.onChange(function (v) { if (!regionTouched) showRegion(v.key); });
  var regionTouched = false;
  $('#region-pills').addEventListener('click', function () { regionTouched = true; });
})();
