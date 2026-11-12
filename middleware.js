/*
 * OUTWARD lock (Vercel Routing Middleware).
 * /outward is behind a password before anything loads. Only a SHA-256 fingerprint of the
 * password lives in the Vercel setting OUTWARD_PASS_SHA256, never in this repository.
 * Behind the lock, every person still signs in with their own email (Supabase Auth),
 * and the database decides what each role may see.
 */
export const config = { matcher: ['/outward', '/outward/:path*'] };

const COOKIE = 'ow_pass';
const enc = new TextEncoder();
async function sha256(text) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
function cookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}
const page = (bad) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>OUTWARD</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0B0C;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{width:min(380px,90vw);display:flex;flex-direction:column;gap:18px}h1{margin:0;font-size:44px;letter-spacing:.08em}.m{margin:-14px 0 0;font-size:44px;letter-spacing:.08em;font-weight:700;transform:scaleY(-1);opacity:.18;line-height:1}
p{margin:0;color:#CFCFCF;line-height:1.5}label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:14px}input{min-height:50px;border-radius:10px;border:2px solid #fff;background:#fff;color:#0B0B0C;font-size:17px;padding:0 14px}
button{min-height:52px;border-radius:10px;border:2px solid #F5C518;background:#F5C518;color:#0B0B0C;font-weight:700;font-size:16px}.bad{color:#FFB4A9;font-weight:600}</style></head>
<body><main><div><h1>OUTWARD</h1><div class="m" aria-hidden="true">OUTWARD</div></div><p>SoulCause back office. Enter the access password.</p>
${bad ? '<p class="bad" role="alert">That password is not right. Please try again.</p>' : ''}
<form method="post" action="/outward/unlock"><label>Access password<input type="password" name="password" autocomplete="current-password" required autofocus></label><button type="submit">Unlock</button></form></main></body></html>`;

export default async function middleware(req) {
  const url = new URL(req.url);
  const want = (process.env.OUTWARD_PASS_SHA256 || '').toLowerCase();
  if (!want) return new Response('OUTWARD is not set up yet.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const token = await sha256(want + ':outward-v1');

  if (url.pathname === '/outward/unlock' && req.method === 'POST') {
    const form = await req.formData().catch(() => null);
    const pass = form ? String(form.get('password') || '') : '';
    if (pass && (await sha256(pass)) === want) {
      return new Response(null, { status: 303, headers: { Location: '/outward/', 'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=1209600; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control': 'no-store' } });
    }
    return new Response(page(true), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  if (cookie(req, COOKIE) === token) return; // unlocked: serve the app
  return new Response(page(false), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
