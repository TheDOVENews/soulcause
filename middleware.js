/*
 * OUTWARD lock (Vercel Routing Middleware).
 * /outward is behind a password before anything loads. Only a SHA-256 fingerprint of the
 * password lives in the Vercel setting OUTWARD_PASS_SHA256, never in this repository.
 * Behind the lock, every person still signs in with their own email (Supabase Auth),
 * and the database decides what each role may see.
 */
export const config = { matcher: ['/outward', '/outward/:path*'] };

const COOKIE = 'ow_pass';
const STORAGE_KEY = 'sb-orhmsmxnfokupmtctueu-auth-token';
async function ownerSession(password) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, email = process.env.OUTWARD_ACCESS_EMAIL;
  if (!url || !key || !email) return null;
  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!r.ok) return null;
    const s = await r.json();
    if (!s.access_token) return null;
    if (!s.expires_at) s.expires_at = Math.floor(Date.now() / 1000) + (s.expires_in || 3600);
    return s;
  } catch { return null; }
}
const enc = new TextEncoder();
async function sha256(text) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
function cookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}
const page = (bad, next) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>OUTWARD</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0B0C;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{width:min(380px,90vw);display:flex;flex-direction:column;gap:18px}h1{margin:0;font-size:44px;letter-spacing:.08em}.m{margin:-14px 0 0;font-size:44px;letter-spacing:.08em;font-weight:700;transform:scaleY(-1);opacity:.18;line-height:1}
p{margin:0;color:#CFCFCF;line-height:1.5}label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:14px}input{min-height:50px;border-radius:10px;border:2px solid #fff;background:#fff;color:#0B0B0C;font-size:17px;padding:0 14px}
button{min-height:52px;border-radius:10px;border:2px solid #F5C518;background:#F5C518;color:#0B0B0C;font-weight:700;font-size:16px}.bad{color:#FFB4A9;font-weight:600}</style></head>
<body><main><div><h1>OUTWARD</h1><div class="m" aria-hidden="true">OUTWARD</div></div><p>SoulCause back office. Enter the access key.</p>
${bad ? '<p class="bad" role="alert">That password is not right. Please try again.</p>' : ''}
<form method="post" action="/outward/unlock"><input type="hidden" name="next" value="${next || '/outward/'}"><label>Access key<input type="password" name="password" autocomplete="current-password" required autofocus></label><button type="submit">Unlock</button></form></main></body></html>`;

// Link previews (iMessage, WhatsApp, Facebook, LinkedIn, X, Slack...) get a small share card,
// never the content behind the lock.
const BOTS = /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|LinkedInBot|Discordbot|TelegramBot|Applebot|SkypeUriPreview|Pinterest|redditbot|Embedly/i;
function shareCard(path) {
  const demo = path.startsWith('/outward/demo');
  const isOw = path.startsWith('/outward/demo/outward') || !demo;
  const title = demo ? (isOw ? 'OUTWARD · Cinematic demo' : 'The Two Trees · SoulCause cinematic demo') : 'OUTWARD · SoulCause back office';
  const desc = demo ? (isOw ? 'Compliance, Operations and Reporting for SoulCause, with OWL built in.' : 'From withered branches to the tree of life. The story behind SoulCause.') : 'Private back office for SoulCause staff.';
  const img = 'https://soulcause.com/assets/img/og-soulcause-v2.png';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:site_name" content="SoulCause"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://soulcause.com${path}"><meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${img}"></head><body></body></html>`;
}

export default async function middleware(req) {
  const url = new URL(req.url);
  if (req.method === 'GET' && BOTS.test(req.headers.get('user-agent') || '')) {
    return new Response(shareCard(url.pathname), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' } });
  }
  const want = (process.env.OUTWARD_PASS_SHA256 || '').toLowerCase();
  if (!want) return new Response('OUTWARD is not set up yet.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const token = await sha256(want + ':outward-v1');

  if (url.pathname === '/outward/unlock' && req.method === 'POST') {
    const form = await req.formData().catch(() => null);
    const pass = form ? String(form.get('password') || '') : '';
    const nx = form ? String(form.get('next') || '') : '';
    const next = /^\/outward(\/[A-Za-z0-9/_-]*)?$/.test(nx) && nx !== '/outward/unlock' ? nx : '/outward/';
    if (pass && (await sha256(pass)) === want) {
      const setCookie = `${COOKIE}=${token}; Path=/; Max-Age=1209600; HttpOnly; Secure; SameSite=Lax`;
      // The access key alone signs in the owner account (email kept in the Vercel setting
      // OUTWARD_ACCESS_EMAIL). Supabase checks the key as that account's password, so the
      // database rules still apply. If it doesn't match, the normal sign-in screen shows.
      const session = await ownerSession(pass);
      if (session) {
        const js = JSON.stringify(session).replace(/</g, '\\u003c');
        const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>OUTWARD</title><body style="background:#0B0B0C"><script>try{localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(js)})}catch(e){}location.replace(${JSON.stringify(next)})</script></body>`;
        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': setCookie, 'Cache-Control': 'no-store' } });
      }
      return new Response(null, { status: 303, headers: { Location: next, 'Set-Cookie': setCookie, 'Cache-Control': 'no-store' } });
    }
    return new Response(page(true, next), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  if (cookie(req, COOKIE) === token) return; // unlocked: serve the app
  return new Response(page(false, url.pathname), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
