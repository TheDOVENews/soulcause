// Outward church application (soulcause.com/danny-duvall/home#apply) -> Supabase church_applications.
// Uses the publishable key; the table only allows inserts from it.
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '') || null;
const SIZES = new Set(['under-100', '100-300', '300-1000', '1000-plus']);

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Not configured' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.website) return res.status(201).json({ ok: true }); // honeypot: bots fill hidden fields
  const row = {
    church_name: clip(b.church_name, 200), pastor_name: clip(b.pastor_name, 120), email: clip(b.email, 200),
    phone: clip(b.phone, 40), city: clip(b.city, 120), state: clip(b.state, 60),
    attendance: SIZES.has(b.attendance) ? b.attendance : null, preferred_season: clip(b.preferred_season, 120),
    heard_from: clip(b.heard_from, 200), message: clip(b.message, 3000), country: clip(req.headers['x-vercel-ip-country'], 2)
  };
  if (!row.church_name || !row.pastor_name || !row.email) return res.status(400).json({ error: 'Church, pastor and email are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return res.status(400).json({ error: 'Please enter a valid email' });
  const r = await fetch(`${url}/rest/v1/church_applications`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!r.ok) return res.status(502).json({ error: 'Could not save your application. Please try again.' });
  return res.status(201).json({ ok: true });
}
