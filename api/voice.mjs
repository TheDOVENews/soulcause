// OWL Voice: narration for the SoulCause demos, spoken by OpenAI text-to-speech.
// Turns on when the Vercel setting OPENAI_API_KEY exists. Only people who unlocked OUTWARD
// with the access key (the ow_pass cookie) can use it, so nobody else can spend the key.
import { createHash } from 'node:crypto';

const MODEL = process.env.OWL_VOICE_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.OWL_VOICE || 'onyx';
const STYLE = 'You are the OWL Voice narrating a cinematic film trailer for SoulCause, an evangelism ministry. '
  + 'Speak as a soft, mature, confident, charismatic man: warm, sincere and hopeful, never salesy. '
  + 'Unhurried pacing. Treat every ellipsis (…) as a real dramatic pause and let emotion carry the words.';

const sha = (t) => createHash('sha256').update(t).digest('hex');
function unlocked(req) {
  const want = (process.env.OUTWARD_PASS_SHA256 || '').toLowerCase();
  if (!want) return false;
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)ow_pass=([^;]+)/);
  return !!m && m[1] === sha(want + ':outward-v1');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ ready: !!key && unlocked(req) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!unlocked(req)) return res.status(401).json({ error: 'Unlock OUTWARD first' });
  if (!key) return res.status(503).json({ error: 'OWL Voice is not turned on yet' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const text = String(body.text || '').slice(0, 600), tone = String(body.tone || '').slice(0, 300);
  if (!text) return res.status(400).json({ error: 'Nothing to say' });
  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, instructions: STYLE + (tone ? ' For this line: ' + tone : ''), response_format: 'mp3' })
    });
    if (!r.ok) { console.error('voice', r.status, (await r.text()).slice(0, 300)); return res.status(502).json({ error: 'Voice unavailable' }); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('voice', e);
    return res.status(502).json({ error: 'Voice unavailable' });
  }
}
