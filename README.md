# SoulCause.com

Back to the roots. Back to the Great Commission.

A static site (HTML, CSS, vanilla JavaScript) with two small Vercel functions and a Supabase table.

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | Welcome flow, verse interstitial, home and product pages |
| `assets/js/globe.js` | The turning line-art globe mark |
| `assets/js/continents.js` | Continent outlines and visitor-continent detection |
| `assets/js/content.js` | Verses (KJV), product pages, prayer lines |
| `assets/js/app.js` | Welcome → prayer → platform, routing, interstitial |
| `api/geo.js` | Returns approximate visitor location from Vercel IP headers (nothing stored) |
| `api/visitor.js` | Saves welcome-form submissions to Supabase |
| `supabase/migrations/` | Database schema |

## Brand meaning

| Color | Meaning | Product |
| --- | --- | --- |
| Gospel Yellow `#F5C518` | Light, good news | FIELD (app), Scripture |
| Commission Blue `#1F4FD8` | Deep water of the fishers | SEND (the 12) |
| Harvest Orange `#F2711C` | The harvest is ready | LABOR (the 70) |
| Hundredfold Green `#1E9E5A` | Growth, multiplication | REACH (the world) |
| Prayer Lavender `#B9A6F0` | Prayer, counsel | NET (services) |
| Truth Black / Grace White | The Word plainly spoken | Text, line art |

## Environment variables (Vercel)

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

## Before launch

- Leadership section intentionally names no individuals; it keeps the focus on Jesus.
- Decide who reads prayer requests and follows up (`followed_up_at`).
- Point soulcause.com at Vercel in GoDaddy DNS.

Deploys automatically from `main` to soulcause.com.

## OUTWARD (back office) — soulcause.com/outward

OUTWARD runs COR (Compliance, Operations and Reporting): command center, alerts, tasks, schedule,
people with onboarding and termination checklists, finance, legal, marketing, risk (ERM), visitors
and prayer follow-up, team roles, and sOWL (systems Omnichannel Wisdom Language) through Vercel AI Gateway.

- Lock: `middleware.js`. Only the SHA-256 of the lock password is stored, in the Vercel setting `OUTWARD_PASS_SHA256`.
- Sign-in: Supabase Auth. Roles live in `outward_staff`; run `supabase/migrations/002_outward.sql` once.
- Give someone a role (SQL editor): `select public.outward_grant('name@example.com', 'staff', 'Full Name');`
- People, Finance and Legal are owner and admin only. Staff see Tasks, Schedule, Risk and Marketing.
- sOWL model: `OUTWARD_OWL_MODEL` (default `openai/gpt-4.1-mini`).
