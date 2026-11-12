-- OUTWARD: SoulCause back office (COR: Compliance, Operations and Reporting).
-- Safe to run more than once.

-- Staff and roles --------------------------------------------------------
create table if not exists public.outward_staff (
  email text primary key check (email = lower(email)),
  name text check (char_length(name) <= 120),
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.outward_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.outward_staff
  where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active
$$;

-- Records for every area -------------------------------------------------
create table if not exists public.outward_records (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('task','event','person','finance','legal','marketing','risk')),
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'open' check (char_length(status) <= 40),
  owner_email text check (char_length(owner_email) <= 200),
  due_date date,
  amount numeric(14,2),
  details jsonb not null default '{}'::jsonb,
  created_by text default lower(auth.jwt() ->> 'email'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outward_records_module_due on public.outward_records (module, due_date);

create table if not exists public.outward_activity (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text default lower(auth.jwt() ->> 'email'),
  record_id uuid,
  module text,
  action text,
  title text
);

create or replace function public.outward_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  insert into public.outward_activity (record_id, module, action, title)
  values (coalesce(new.id, old.id), coalesce(new.module, old.module), lower(tg_op), coalesce(new.title, old.title));
  return coalesce(new, old);
end $$;

drop trigger if exists outward_records_touch on public.outward_records;
create trigger outward_records_touch before insert or update or delete on public.outward_records
for each row execute function public.outward_touch();

-- Who can see what -------------------------------------------------------
-- People (HR), Finance and Legal: owner and admin only. Everything else: all active staff.
alter table public.outward_staff enable row level security;
alter table public.outward_records enable row level security;
alter table public.outward_activity enable row level security;

drop policy if exists "staff read team" on public.outward_staff;
create policy "staff read team" on public.outward_staff for select to authenticated
  using (public.outward_role() is not null);
drop policy if exists "owner manages team" on public.outward_staff;
create policy "owner manages team" on public.outward_staff for all to authenticated
  using (public.outward_role() = 'owner') with check (public.outward_role() = 'owner');

drop policy if exists "staff read records" on public.outward_records;
create policy "staff read records" on public.outward_records for select to authenticated
  using (public.outward_role() in ('owner','admin')
      or (public.outward_role() = 'staff' and module not in ('person','finance','legal')));
drop policy if exists "staff add records" on public.outward_records;
create policy "staff add records" on public.outward_records for insert to authenticated
  with check (public.outward_role() in ('owner','admin')
      or (public.outward_role() = 'staff' and module not in ('person','finance','legal')));
drop policy if exists "staff edit records" on public.outward_records;
create policy "staff edit records" on public.outward_records for update to authenticated
  using (public.outward_role() in ('owner','admin')
      or (public.outward_role() = 'staff' and module not in ('person','finance','legal')))
  with check (public.outward_role() in ('owner','admin')
      or (public.outward_role() = 'staff' and module not in ('person','finance','legal')));
drop policy if exists "admins delete records" on public.outward_records;
create policy "admins delete records" on public.outward_records for delete to authenticated
  using (public.outward_role() in ('owner','admin'));

drop policy if exists "staff read activity" on public.outward_activity;
create policy "staff read activity" on public.outward_activity for select to authenticated
  using (public.outward_role() in ('owner','admin')
      or (public.outward_role() = 'staff' and module not in ('person','finance','legal')));

revoke all on public.outward_staff, public.outward_records, public.outward_activity from anon;
grant select, insert, update, delete on public.outward_staff, public.outward_records to authenticated;
grant select on public.outward_activity to authenticated;

-- Owner can read the prayer requests from the welcome screen ---------------
drop policy if exists "outward staff read visitors" on public.visitors;
create policy "outward staff read visitors" on public.visitors for select to authenticated
  using (public.outward_role() in ('owner','admin'));
drop policy if exists "outward staff follow up visitors" on public.visitors;
create policy "outward staff follow up visitors" on public.visitors for update to authenticated
  using (public.outward_role() in ('owner','admin')) with check (public.outward_role() in ('owner','admin'));
grant select, update on public.visitors to authenticated;

-- Add or change a team member from the SQL editor:
--   select public.outward_grant('name@example.com', 'owner', 'Full Name');
create or replace function public.outward_grant(p_email text, p_role text, p_name text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.outward_staff (email, role, name, active)
  values (lower(trim(p_email)), p_role, p_name, true)
  on conflict (email) do update set role = excluded.role, name = coalesce(excluded.name, outward_staff.name), active = true
$$;
revoke all on function public.outward_grant(text, text, text) from public, anon, authenticated;
