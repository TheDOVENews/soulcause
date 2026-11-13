/* SoulCause cinematic score: synthesized live in the browser (Web Audio), no audio files.
 * Moods: dark (heartbeat drone), rise (swelling strings), joy (bright arps), drive (upbeat), finale.
 * Sound effects are timed by each scene. */
(function () {
  var MOODS = {
    dark:   { bpm: 60,  bpc: 2, cut: 520,  pad: 0.17, heart: true, chords: [[38,45,50,53],[34,41,46,50],[31,38,43,46],[33,40,45,49]] },
    rise:   { bpm: 76,  bpc: 2, cut: 1500, pad: 0.17, arp: 1, swell: true, chords: [[38,45,50,53,57],[34,41,46,50,53],[41,48,53,57,60],[36,43,48,52,55]] },
    joy:    { bpm: 104, bpc: 1, cut: 3200, pad: 0.13, arp: 2, kick: 4, bells: true, chords: [[50,57,62,66,69],[45,52,57,61,64],[47,54,59,62,66],[43,50,55,59,62]] },
    drive:  { bpm: 118, bpc: 1, cut: 2600, pad: 0.10, arp: 2, kick: 2, hat: true, bass: true, stab: true, chords: [[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]] },
    finale: { bpm: 104, bpc: 1, cut: 3800, pad: 0.16, arp: 2, kick: 2, hat: true, bass: true, bells: true, chords: [[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62],[45,52,57,61,64]] }
  };
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function Score() { this.ctx = null; this.mood = null; this.on = true; }
  Score.prototype.init = function () {
    if (this.ctx) return;
    var C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    var comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(C.destination);
    this.master = C.createGain(); this.master.gain.value = 0.85; this.master.connect(comp);
    this.music = C.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.fx = C.createGain(); this.fx.gain.value = 0.75; this.fx.connect(this.master);
    var len = C.sampleRate * 3, ir = C.createBuffer(2, len, C.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.rev = C.createConvolver(); this.rev.buffer = ir;
    var rg = C.createGain(); rg.gain.value = 0.5; this.rev.connect(rg); rg.connect(this.master);
    var nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), nd = nb.getChannelData(0);
    for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    this.step = 0; this.next = C.currentTime + 0.1;
    var self = this; this.timer = setInterval(function () { self.sched(); }, 25);
  };
  Score.prototype.now = function () { return this.ctx ? this.ctx.currentTime : 0; };
  Score.prototype.pause = function () { if (this.ctx) this.ctx.suspend(); };
  Score.prototype.resume = function () { if (this.ctx) this.ctx.resume(); };
  Score.prototype.mute = function (m) { this.on = !m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.now(), 0.05); };
  Score.prototype.duck = function (d) { if (this.music) this.music.gain.setTargetAtTime(d ? 0.26 : 0.55, this.now(), 0.35); };
  Score.prototype.setMood = function (m) {
    if (!this.ctx || m === this.mood) return;
    this.mood = m; this.step = 0; this.next = this.now() + 0.06;
  };

  // building blocks
  Score.prototype.env = function (g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  };
  Score.prototype.tone = function (type, f, t, a, peak, hold, rel, dest, rev, cut) {
    var C = this.ctx, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f;
    var src = o;
    if (cut) { var lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; o.connect(lp); src = lp; }
    src.connect(g); g.connect(dest || this.music); if (rev) { var s = C.createGain(); s.gain.value = rev; g.connect(s); s.connect(this.rev); }
    this.env(g, t, a, peak, hold, rel); o.start(t); o.stop(t + a + hold + rel + 0.05); return o;
  };
  Score.prototype.noise = function (t, dur, type, f1, f2, peak, a, dest, rev) {
    var C = this.ctx, n = C.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
    var bf = C.createBiquadFilter(); bf.type = type; bf.frequency.setValueAtTime(f1, t); bf.frequency.exponentialRampToValueAtTime(f2, t + dur); bf.Q.value = 0.8;
    var g = C.createGain(); n.connect(bf); bf.connect(g); g.connect(dest || this.fx);
    if (rev) { var s = C.createGain(); s.gain.value = rev; g.connect(s); s.connect(this.rev); }
    this.env(g, t, a || 0.01, peak, Math.max(0, dur - (a || 0.01) - 0.08), 0.08); n.start(t); n.stop(t + dur + 0.1);
  };
  Score.prototype.pad = function (notes, t, dur, m) {
    var self = this, C = this.ctx;
    notes.forEach(function (n, i) {
      [-7, 7].forEach(function (dt) {
        var o = C.createOscillator(), lp = C.createBiquadFilter(), g = C.createGain();
        o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = dt;
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(m.cut * 0.6, t);
        lp.frequency.linearRampToValueAtTime(m.swell ? m.cut * 1.6 : m.cut, t + dur * 0.8);
        o.connect(lp); lp.connect(g); g.connect(self.music);
        var s = C.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(self.rev);
        var pk = m.pad / notes.length / 1.4;
        self.env(g, t, Math.min(1.4, dur * 0.3), pk, Math.max(0.1, dur - 1.4), 1.6);
        o.start(t); o.stop(t + dur + 1.8);
      });
    });
  };
  Score.prototype.kick = function (t, v) {
    var C = this.ctx, o = C.createOscillator(), g = C.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    o.connect(g); g.connect(this.music); this.env(g, t, 0.004, v, 0.02, 0.28); o.start(t); o.stop(t + 0.4);
  };

  Score.prototype.sched = function () {
    if (!this.ctx || this.ctx.state !== 'running') return;
    while (this.next < this.now() + 0.12) { this.play(this.step, this.next); var m = MOODS[this.mood]; this.next += m ? 30 / m.bpm : 0.25; this.step++; }
  };
  Score.prototype.play = function (s, t) {
    var m = MOODS[this.mood]; if (!m) return;
    var per = 8 * m.bpc, ci = Math.floor(s / per) % 4, chord = m.chords[ci], st = 30 / m.bpm;
    if (s % per === 0) this.pad(chord, t, per * st, m);
    if (m.heart && s % 2 === 0) { this.tone('sine', 52, t, 0.01, 0.5, 0.05, 0.22); this.tone('sine', 46, t + 0.2, 0.01, 0.32, 0.04, 0.25); }
    if (m.arp) {
      var every = m.arp === 1 ? 2 : 1;
      if (s % every === 0) { var n = chord[(s / every) % chord.length] + 12 + (m.arp === 2 && s % 8 >= 4 ? 12 : 0); this.tone('triangle', hz(n), t, 0.005, m.arp === 1 ? 0.05 : 0.04, 0.03, m.arp === 1 ? 0.9 : 0.35, null, 0.5); }
    }
    if (m.kick && s % m.kick === 0) this.kick(t, m.kick === 4 ? 0.45 : 0.62);
    if (m.hat && s % 2 === 1) this.noise(t, 0.05, 'highpass', 7000, 9000, 0.06, 0.002, this.music);
    if (m.bass && s % 2 === 0) this.tone('sawtooth', hz(chord[0] - 12), t, 0.01, 0.13, st * 0.6, 0.12, null, 0, 420);
    if (m.stab && (s % 8 === 3 || s % 8 === 6)) chord.forEach(function (n) { this.tone('square', hz(n + 12), t, 0.005, 0.018, 0.04, 0.12, null, 0.3, 2400); }, this);
    if (m.bells && s % per === 0) this.chime(chord[chord.length - 1] + 12, t, 0.05);
  };

  // sound effects (t = seconds from now)
  Score.prototype.sfx = function (name, arg) {
    if (!this.ctx || !this.on) return;
    var t = this.now() + 0.01, self = this;
    var F = {
      boom: function () { var o = self.ctx.createOscillator(), g = self.ctx.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.4); o.connect(g); g.connect(self.fx); var s = self.ctx.createGain(); s.gain.value = 0.4; g.connect(s); s.connect(self.rev); self.env(g, t, 0.005, 1, 0.05, 1.6); o.start(t); o.stop(t + 1.8); self.noise(t, 0.5, 'lowpass', 900, 80, 0.5, 0.004, self.fx, 0.4); },
      hit: function () { F.boom(); [62, 66, 69, 74].forEach(function (n) { self.tone('sawtooth', hz(n), t, 0.005, 0.05, 0.1, 1.4, self.fx, 0.8, 3000); }); },
      whoosh: function () { self.noise(t, 0.9, 'bandpass', 250, 5000, 0.35, 0.35, self.fx, 0.3); },
      riser: function () { var d = arg || 3; self.noise(t, d, 'highpass', 200, 9000, 0.22, d * 0.9, self.fx, 0.5); var o = self.tone('sawtooth', 110, t, d * 0.9, 0.04, 0.05, 0.2, self.fx, 0.5, 2500); o.frequency.exponentialRampToValueAtTime(880, t + d); },
      rumble: function () { var d = arg || 3; self.noise(t, d, 'lowpass', 140, 60, 0.6, 0.6, self.fx, 0.3); },
      crack: function () { self.noise(t, 0.25, 'highpass', 1500, 600, 0.5, 0.002, self.fx, 0.5); },
      chime: function () { self.chime(arg || 81, t, 0.12, self.fx); },
      shimmer: function () { [74, 78, 81, 86, 90, 93].forEach(function (n, i) { self.chime(n, t + i * 0.07, 0.06, self.fx); }); },
      pluck: function () { self.tone('triangle', hz(arg || 74), t, 0.003, 0.12, 0.02, 0.5, self.fx, 0.4); },
      seed: function () { self.tone('sine', hz(arg || 86), t, 0.003, 0.1, 0.01, 0.18, self.fx, 0.3); },
      tick: function () { self.noise(t, 0.03, 'highpass', 4000, 6000, 0.12, 0.001, self.fx); },
      check: function () { self.tone('sine', 880, t, 0.004, 0.12, 0.04, 0.12, self.fx, 0.2); self.tone('sine', 1320, t + 0.09, 0.004, 0.12, 0.05, 0.25, self.fx, 0.3); },
      pop: function () { var o = self.tone('sine', 300, t, 0.003, 0.2, 0.02, 0.12, self.fx, 0.2); o.frequency.exponentialRampToValueAtTime(900, t + 0.1); },
      heartbeat: function () { self.tone('sine', 55, t, 0.01, 0.8, 0.05, 0.25, self.fx); self.tone('sine', 48, t + 0.22, 0.01, 0.55, 0.04, 0.3, self.fx); }
    };
    if (F[name]) F[name]();
  };
  Score.prototype.chime = function (n, t, v, dest) {
    var f = hz(n), self = this;
    [[1, 1], [2.76, 0.4], [5.4, 0.18]].forEach(function (p) { self.tone('sine', f * p[0], t, 0.004, v * p[1], 0.02, 2.2, dest || self.music, 0.7); });
  };

  window.SCScore = Score;
})();
