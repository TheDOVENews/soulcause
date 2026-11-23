(function () {
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
