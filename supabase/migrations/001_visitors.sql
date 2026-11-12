-- Visitors who share their name and prayer requests on the welcome screen.
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text check (char_length(first_name) <= 80),
  email text check (char_length(email) <= 200),
  church text check (char_length(church) <= 200),
  role text check (role in ('pastor','member','ministry','exploring')),
  prayer_request text check (char_length(prayer_request) <= 2000),
  wants_updates boolean not null default false,
  continent text check (continent in ('na','sa','eu','af','as','oc')),
  country text check (char_length(country) <= 2),
  followed_up_at timestamptz
);

alter table public.visitors enable row level security;

-- The public website may add a row, never read, change or delete one.
create policy "website can insert visitors"
  on public.visitors for insert
  to anon
  with check (followed_up_at is null);

revoke select, update, delete on public.visitors from anon, authenticated;
