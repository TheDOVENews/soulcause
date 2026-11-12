// Returns the visitor's approximate location from Vercel's IP geolocation headers.
// Nothing is stored. Used only to turn the globe toward the visitor's continent.
export default function handler(req, res) {
  const h = req.headers;
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({
    country: h['x-vercel-ip-country'] || null,
    lat: num(h['x-vercel-ip-latitude']),
    lon: num(h['x-vercel-ip-longitude'])
  });
}
