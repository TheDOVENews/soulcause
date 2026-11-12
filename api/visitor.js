// Saves a welcome-form submission (name, email, prayer request) to Supabase.
// Requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project settings.
// The database only allows inserts from this key; nobody can read the table with it.
const ROLES = new Set(['pastor', 'member', 'ministry', 'exploring']);
const CONTINENTS = new Set(['na', 'sa', 'eu', 'af', 'as', 'oc']);
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '') || null;

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const email = clip(body.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  const row = {
    first_name: clip(body.first_name, 80),
    email,
    church: clip(body.church, 200),
    role: ROLES.has(body.role) ? body.role : null,
    prayer_request: clip(body.prayer_request, 2000),
    wants_updates: body.wants_updates === true,
    continent: CONTINENTS.has(body.continent) ? body.continent : null,
    country: clip(req.headers['x-vercel-ip-country'], 2)
  };
  if (!row.first_name && !row.email && !row.prayer_request) return res.status(204).end();

  const r = await fetch(`${url}/rest/v1/visitors`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!r.ok) return res.status(502).json({ error: 'Could not save' });
  return res.status(201).json({ ok: true });
}
