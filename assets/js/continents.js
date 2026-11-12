/* SoulCause — simplified continent outlines (lon, lat), drawn as line art.
   Also works out the visitor's continent: server geo (Vercel IP headers) first,
   then the browser's time zone as a fallback. */
(function () {
  var RAW = {
    na: [
      [[-168,66],[-162,70],[-156,71],[-140,70],[-128,70],[-115,68],[-95,72],[-85,70],[-80,63],[-90,58],[-82,52],[-78,58],[-70,61],[-62,58],[-56,52],[-60,47],[-66,44],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,27],[-84,30],[-90,29],[-97,27],[-97,22],[-92,18],[-87,21],[-88,16],[-84,11],[-79,8],[-83,8],[-86,12],[-92,14],[-96,16],[-105,20],[-112,29],[-117,32],[-121,35],[-124,40],[-124,46],[-128,51],[-134,57],[-140,60],[-150,61],[-158,57],[-165,61]],
      [[-73,78],[-60,82],[-30,83],[-20,80],[-20,70],[-30,68],[-43,60],[-50,64],[-55,70],[-60,76]]
    ],
    sa: [
      [[-80,9],[-75,11],[-72,12],[-63,11],[-60,8],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-15],[-41,-22],[-48,-26],[-53,-34],[-58,-38],[-62,-41],[-65,-45],[-68,-50],[-69,-55],[-72,-53],[-75,-48],[-74,-40],[-72,-30],[-71,-18],[-76,-14],[-81,-6],[-80,-1],[-78,2],[-77,7]]
    ],
    eu: [
      [[-9,43],[-9,39],[-6,36],[-2,37],[3,43],[7,44],[10,44],[12,42],[16,38],[18,40],[13,45],[19,42],[23,37],[26,40],[29,41],[28,44],[30,46],[38,47],[40,44],[46,42],[50,46],[55,50],[60,55],[60,68],[52,68],[44,68],[40,66],[32,70],[25,71],[18,70],[12,66],[5,62],[5,58],[8,58],[11,59],[12,56],[18,60],[22,65],[25,65],[22,60],[29,60],[22,57],[21,55],[14,54],[9,55],[8,54],[5,53],[2,51],[-2,49],[-5,48],[-1,46]],
      [[-5,50],[1,51],[2,53],[-1,55],[-2,57],[-3,59],[-6,58],[-5,55],[-3,54]]
    ],
    af: [
      [[-17,21],[-17,15],[-15,11],[-12,7],[-8,4],[-2,5],[5,6],[9,4],[9,-1],[12,-6],[13,-12],[12,-17],[15,-27],[18,-34],[20,-35],[26,-34],[32,-29],[35,-24],[35,-18],[40,-15],[40,-10],[39,-5],[42,0],[48,5],[51,11],[44,11],[43,13],[39,16],[37,21],[35,27],[33,30],[30,31],[25,32],[20,31],[15,32],[11,33],[10,37],[3,37],[-2,35],[-6,36],[-9,32],[-10,28],[-13,27]],
      [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]]
    ],
    as: [
      [[29,41],[36,36],[35,33],[35,28],[39,22],[43,13],[45,13],[52,16],[57,19],[59,22],[56,26],[50,30],[56,27],[61,25],[67,24],[73,21],[77,8],[80,15],[86,21],[92,22],[94,17],[98,16],[98,8],[101,3],[104,1],[103,6],[100,13],[105,9],[109,12],[108,21],[114,22],[120,27],[122,31],[119,36],[122,40],[126,38],[129,35],[130,42],[136,44],[141,50],[140,53],[143,59],[155,59],[162,62],[180,65],[180,69],[170,70],[160,70],[150,72],[140,73],[130,71],[115,74],[105,78],[95,76],[80,73],[68,73],[60,68],[60,55],[55,50],[50,46],[46,42],[42,41],[36,41]],
      [[130,31],[135,34],[140,35],[142,40],[141,45],[144,44],[140,41],[136,37],[132,35]],
      [[95,5],[98,4],[106,-6],[102,-4]],
      [[109,2],[117,7],[119,1],[116,-4],[110,-3]]
    ],
    oc: [
      [[114,-22],[114,-34],[118,-35],[124,-34],[131,-31],[138,-35],[141,-38],[147,-38],[150,-37],[153,-28],[153,-25],[146,-19],[145,-15],[142,-11],[141,-17],[136,-12],[132,-11],[129,-15],[123,-17]],
      [[172,-34],[178,-38],[175,-41],[171,-44],[167,-46],[172,-41]],
      [[131,-1],[141,-3],[150,-10],[143,-9],[138,-8]]
    ]
  };
  var NAMES = { na: 'North America', sa: 'South America', eu: 'Europe', af: 'Africa', as: 'Asia', oc: 'Oceania' };
  var CENTERS = { na: -98, sa: -60, eu: 15, af: 20, as: 95, oc: 135 };

  function densify(p) {
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length];
      var n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 3));
      for (var j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    }
    return out;
  }
  var LAND = {};
  Object.keys(RAW).forEach(function (k) { LAND[k] = RAW[k].map(densify); });

  function inPoly(lon, lat, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function fromPoint(lon, lat) {
    for (var k in RAW) for (var i = 0; i < RAW[k].length; i++) if (inPoly(lon, lat, RAW[k][i])) return k;
    var best = null, bd = 1e9; // nearest continent center by longitude as a last resort
    for (var c in CENTERS) { var d = Math.abs(((lon - CENTERS[c] + 540) % 360) - 180); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function fromTimeZone() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var p = tz.split('/')[0];
    if (p === 'Europe') return 'eu';
    if (p === 'Africa' || p === 'Indian') return 'af';
    if (p === 'Asia') return 'as';
    if (p === 'Australia' || p === 'Pacific') return 'oc';
    if (p === 'Atlantic') return /Canary|Madeira|Azores|Faroe|Reykjavik/.test(tz) ? 'eu' : 'na';
    if (p === 'America') return /Sao_Paulo|Argentina|Buenos_Aires|Santiago|Lima|Bogota|Caracas|La_Paz|Montevideo|Asuncion|Guayaquil|Cayenne|Paramaribo|Guyana|Belem|Fortaleza|Recife|Manaus|Bahia|Noronha/.test(tz) ? 'sa' : 'na';
    return null;
  }

  var visitor = { key: fromTimeZone() || 'na', lon: null, lat: null, source: 'timezone' };
  var listeners = [];
  window.SC_GEO = {
    LAND: LAND, NAMES: NAMES, CENTERS: CENTERS,
    get: function () { return visitor; },
    onChange: function (fn) { listeners.push(fn); },
    ready: fetch('/api/geo', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (g) {
      if (g && typeof g.lat === 'number' && typeof g.lon === 'number') {
        visitor = { key: fromPoint(g.lon, g.lat), lon: g.lon, lat: g.lat, source: 'ip' };
        listeners.forEach(function (fn) { fn(visitor); });
      }
    }).catch(function () {})
  };
})();
