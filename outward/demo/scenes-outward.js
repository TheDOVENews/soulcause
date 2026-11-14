/* OUTWARD demo: the SoulCause back office for Compliance, Operations and Reporting (COR). Upbeat. */
(function () {
  var D = function (s) { return 'data-d="' + s + '"'; };
  function typeInto(A, node, text, start, cps) { for (var k = 0; k <= text.length; k++) (function (k) { A.at(start + k / cps, function () { node.textContent = text.slice(0, k); if (k % 3 === 0 && k < text.length) A.sfx('tick'); }); })(k); return start + text.length / cps; }

  var scenes = [
    { mood: 'rise', theme: 'night', t: 7, tone: 'Calm, confident, a little intrigue. Pause after ministry.',
      verse: ['Luke 16:10 (KJV)', 'He that is faithful in that which is least is faithful also in much.'],
      say: 'Faithful ministry… deserves a faithful back office.',
      fx: [[0.3, 'riser', 2.6], [3, 'hit']],
      build: function (el) {
        var w = 'OUTWARD'.split('').map(function (c, k) { return '<span ' + D((3 + k * 0.07).toFixed(2)) + '>' + c + '</span>'; }).join('');
        el.innerHTML = '<div class="center" style="gap:0"><div class="wm">' + w + '</div><div class="wm mirror" aria-hidden="true">' + w + '</div></div>';
      } },

    { mood: 'drive', theme: 'night', t: 12, tone: 'Upbeat and crisp, with rhythm. Mirror the two lists.',
      say: 'OUTWARD. Obedience, unity, truth, wisdom, abiding, readiness, discernment… mirrored in operations, updates, tasks, workforce, accountability, reporting and direction.',
      build: function (el, A) {
        var V = ['Obedience', 'Unity', 'Truth', 'Wisdom', 'Abiding', 'Readiness', 'Discernment'], F = ['Operations', 'Updates', 'Tasks', 'Workforce', 'Accountability', 'Reporting', 'Direction'];
        el.innerHTML = '<div class="mirror-cols"><div class="col l"><div class="mono head">What we value</div>' + V.map(function (v, k) { return '<div class="w a up" ' + D((0.9 + k * 0.55).toFixed(2)) + '>' + v + '</div>'; }).join('') + '</div>'
          + '<div class="letters"><div class="mono head" style="color:inherit;visibility:hidden">·</div>' + 'OUTWARD'.split('').map(function (c, k) { return '<span class="a pop" ' + D((0.2 + k * 0.08).toFixed(2)) + '>' + c + '</span>'; }).join('') + '</div>'
          + '<div class="col r"><div class="mono head">How we work</div>' + F.map(function (v, k) { return '<div class="w a up" ' + D((5.2 + k * 0.6).toFixed(2)) + '>' + v + '</div>'; }).join('') + '</div></div>';
        for (var k = 0; k < 7; k++) { A.at(0.9 + k * 0.55, function () { A.sfx('pluck', 74); }); A.at(5.2 + k * 0.6, function () { A.sfx('pluck', 81); }); }
      } },

    { mood: 'drive', theme: 'night', t: 7, tone: 'Punchy and bold, one beat per word.',
      say: 'Compliance. Operations. Reporting. One command center.',
      build: function (el, A) {
        var T = [['C', 'Compliance', '#B9A6F0'], ['O', 'Operations', '#1F4FD8'], ['R', 'Reporting', '#F5C518']], at = [0.7, 1.7, 2.7];
        el.innerHTML = '<div class="center" style="gap:16px"><div class="cor">' + T.map(function (t, k) { return '<div class="a slam" ' + D(at[k]) + ' style="background:' + t[2] + ';' + (k === 1 ? 'color:#fff' : '') + '"><b>' + t[0] + '</b><span>' + t[1] + '</span></div>'; }).join('') + '</div><div class="mono a fade" ' + D(4) + ' style="font-size:12px;color:#F5C518">One command center</div></div>';
        at.forEach(function (t) { A.at(t, function () { A.sfx('boom'); }); });
      } },

    { mood: 'drive', theme: 'day', t: 12, tone: 'Bright, reassuring, practical.',
      say: 'Upload a bank or card statement. sOWL reads every line, sorts every dollar… and waits for your approval.',
      build: function (el, A) {
        var R = [['Online giving deposit', '+$3,200', 'Donations'], ['Field subscriptions', '+$480', 'Subscriptions'], ['Printshop workbooks', '−$850', 'Printing'], ['Zoom video', '−$149.90', 'Software'], ['Delta Air', '−$420', 'Travel']];
        el.innerHTML = '<div class="acct"><div class="panel pdf a slam" ' + D(0.3) + '><b style="font-size:13px">Statement.pdf</b><i style="width:80%"></i><i></i><i style="width:60%"></i><i></i><i style="width:70%"></i><i></i><i style="width:50%"></i><i></i><span class="scan"></span></div>'
          + '<div class="panel rows">' + R.map(function (r, k) { var t = 2.2 + k * 0.45; return '<div class="rowx a up" ' + D(t.toFixed(2)) + '><span>' + r[0] + '</span><b>' + r[1] + '</b><span class="chip a fade" ' + D((t + 2.4).toFixed(2)) + '>' + r[2] + '</span><span class="ok a pop" ' + D((5.8 + k * 0.3).toFixed(2)) + '>✓</span></div>'; }).join('') + '</div>'
          + '<div class="panel pl a up" ' + D(7.6) + '><div class="mono" style="font-size:11px">Profit &amp; loss · this month</div><div class="b"><span>In</span><i style="background:#1E9E5A;animation-delay:8s"></i><span>$4,180</span></div><div class="b"><span>Out</span><i style="background:#F2711C;width:35%;animation-delay:8.3s"></i><span>$1,482</span></div><div class="b"><span>Net</span><i style="background:#1F4FD8;width:65%;animation-delay:8.6s"></i><span>$2,698</span></div></div></div>';
        A.sfx('whoosh');
        for (var k = 0; k < 5; k++) { (function (k) { A.at(2.2 + k * 0.45, function () { A.sfx('tick'); }); A.at(5.8 + k * 0.3, function () { A.sfx('check'); }); })(k); }
        A.at(8, function () { A.sfx('riser', 1.2); });
      } },

    { mood: 'drive', theme: 'day', t: 9, tone: 'Warm and caring, like welcoming someone new.',
      say: 'Invite your team. Approve who gets in. Onboard and offboard… with a checklist that never forgets.',
      build: function (el, A) {
        var I = ['Access request approved', 'Welcome and role assigned', 'Policies signed', 'Training scheduled', 'First-week check-in'];
        el.innerHTML = '<div class="panel check a up" ' + D(0.3) + '><div class="mono" style="font-size:11px;margin-bottom:6px">People · onboarding</div><h3>New volunteer</h3>' + I.map(function (t, k) { return '<div class="ci"><span class="box"><b class="a pop" ' + D((1.6 + k * 0.9).toFixed(2)) + ' style="opacity:0">✓</b></span>' + t + '</div>'; }).join('') + '</div>';
        for (var k = 0; k < 5; k++) A.at(1.6 + k * 0.9, function () { A.sfx('check'); });
      } },

    { mood: 'joy', theme: 'day', t: 11, tone: 'Curious, then delighted. Read the question like you are asking it.',
      say: 'And when you need wisdom… ask sOWL.',
      build: function (el, A) {
        el.innerHTML = '<div class="panel chat a up" ' + D(0.2) + '><div class="hd"><i>🦉</i>sOWL <span class="mono" style="font-size:10px;font-weight:400;opacity:.6;margin-left:auto">Sample answer</span></div><div class="bub me" id="q"></div><div class="bub owl a fade" ' + D(3.6) + ' id="r"></div></div>';
        var end = typeInto(A, el.querySelector('#q'), 'What needs my attention this week?', 0.8, 16);
        A.at(end + 0.3, function () { A.sfx('pop'); });
        typeInto(A, el.querySelector('#r'), '3 transactions are waiting for approval, one onboarding step is due Friday, and your quarterly compliance filing is due in 9 days. Want me to draft the checklist?', end + 0.6, 34);
      } },

    { mood: 'drive', theme: 'night', t: 8, tone: 'Energetic, rolling momentum.',
      say: 'HR. Finance. Legal. Marketing. Risk. Every task, every date, every alert… in one place.',
      build: function (el, A) {
        var M = [['HR', '#B9A6F0'], ['Finance', '#1E9E5A'], ['Legal', '#FFFFFF'], ['Marketing', '#F2711C'], ['Risk', '#F5C518'], ['Tasks', '#6E8CFF'], ['Schedule', '#B9A6F0'], ['Alerts', '#F2711C']];
        el.innerHTML = '<div class="orbit"><div class="ring"></div><div class="core">OUTWARD</div>' + M.map(function (m, k) { var a = -Math.PI / 2 + k * Math.PI / 4, x = 50 + 36 * Math.cos(a), y = 50 + 38 * Math.sin(a); return '<span class="m a pop" ' + D((0.6 + k * 0.5).toFixed(2)) + ' style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;color:' + m[1] + '">' + m[0] + '</span>'; }).join('') + '</div>';
        for (var k = 0; k < 8; k++) A.at(0.6 + k * 0.5, function () { A.sfx('pop'); });
      } },

    { mood: 'finale', theme: 'sun', t: 11, tone: 'Uplifting, resolved, a confident smile.',
      verse: ['1 Corinthians 14:40 (KJV)', 'Let all things be done decently and in order.'],
      say: 'OUTWARD… so the mission keeps moving outward.',
      fx: [[0.2, 'hit'], [0.4, 'shimmer']],
      build: function (el) {
        var w = 'OUTWARD'.split('').map(function (c, k) { return '<span ' + D((0.4 + k * 0.06).toFixed(2)) + '>' + c + '</span>'; }).join('');
        el.innerHTML = '<div class="center" style="gap:12px"><div><div class="wm">' + w + '</div><div class="wm mirror" aria-hidden="true">' + w + '</div></div>'
          + '<div class="a fade" ' + D(1.5) + ' style="font-family:Space Grotesk,sans-serif;font-weight:600;font-size:clamp(18px,2.6vw,26px)">So the mission keeps moving outward.</div>'
          + '<div class="btns a fade" ' + D(3) + '><a class="btn" href="/outward/" style="background:#0B0B0C;border-color:#0B0B0C;color:#fff">Enter OUTWARD</a><a class="btn" href="/outward/demo/">Watch the SoulCause demo</a></div>'
          + '<p class="disc a fade" ' + D(3.4) + '>Figures shown are samples. OUTWARD and sOWL help organize records; they are not legal, tax, accounting or HR advice.</p></div>';
      } }
  ];

  window.SC_SCENES_OUTWARD = scenes;
  if (!window.CINE_NO_AUTO) CineDemo({ scenes: scenes });
})();
