-- Outward: churches apply to host an Outward week with Evangelist Danny DuVall.
-- Anyone may submit (insert only). Only OUTWARD owners/admins can read or update.
create table if not exists public.church_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  church_name text not null,
  pastor_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  attendance text,
  preferred_season text,
  heard_from text,
  message text,
  status text not null default 'new' check (status in ('new','contacted','scheduled','declined')),
  country text
);
alter table public.church_applications enable row level security;

drop policy if exists "anyone can apply" on public.church_applications;
create policy "anyone can apply" on public.church_applications
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "team reads applications" on public.church_applications;
create policy "team reads applications" on public.church_applications
  for select to authenticated using (public.outward_role() in ('owner','admin'));

drop policy if exists "team updates applications" on public.church_applications;
create policy "team updates applications" on public.church_applications
  for update to authenticated using (public.outward_role() in ('owner','admin'));

grant insert on public.church_applications to anon;
grant select, insert, update on public.church_applications to authenticated;
