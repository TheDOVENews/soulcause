-- OUTWARD Accounting: chart of accounts, bank and card accounts, transactions, statements.
-- Owner and admin only. Run after 002_outward.sql. Safe to run more than once.

create table if not exists public.acct_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) <= 12),
  name text not null check (char_length(name) <= 120),
  type text not null check (type in ('asset','liability','equity','income','expense')),
  description text check (char_length(description) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.acct_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 120),
  kind text not null check (kind in ('bank','credit_card')),
  institution text check (char_length(institution) <= 120),
  last4 text check (last4 ~ '^[0-9]{4}$'),
  gl_account_id uuid references public.acct_accounts(id),
  opening_balance numeric(14,2) not null default 0,
  opening_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.acct_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 200),
  storage_path text not null,
  kind text not null default 'statement' check (kind in ('statement','receipt','other')),
  source_id uuid references public.acct_sources(id) on delete set null,
  period_start date,
  period_end date,
  uploaded_by text default lower(auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);

create table if not exists public.acct_transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null check (char_length(description) <= 300),
  amount numeric(14,2) not null, -- money in is positive, money out is negative
  source_id uuid references public.acct_sources(id) on delete set null,
  account_id uuid references public.acct_accounts(id),
  status text not null default 'unreviewed' check (status in ('unreviewed','approved')),
  memo text check (char_length(memo) <= 500),
  document_id uuid references public.acct_documents(id) on delete set null,
  import_batch text,
  approved_by text,
  approved_at timestamptz,
  created_by text default lower(auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index if not exists acct_tx_date on public.acct_transactions (date);
create index if not exists acct_tx_source on public.acct_transactions (source_id, date);

alter table public.acct_accounts enable row level security;
alter table public.acct_sources enable row level security;
alter table public.acct_documents enable row level security;
alter table public.acct_transactions enable row level security;

do $$ declare t text; begin
  foreach t in array array['acct_accounts','acct_sources','acct_documents','acct_transactions'] loop
    execute format('drop policy if exists "finance team" on public.%I', t);
    execute format('create policy "finance team" on public.%I for all to authenticated using (public.outward_role() in (''owner'',''admin'')) with check (public.outward_role() in (''owner'',''admin''))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Private storage for statements and receipts
insert into storage.buckets (id, name, public) values ('outward-docs', 'outward-docs', false) on conflict (id) do nothing;
drop policy if exists "outward docs finance team" on storage.objects;
create policy "outward docs finance team" on storage.objects for all to authenticated
  using (bucket_id = 'outward-docs' and public.outward_role() in ('owner','admin'))
  with check (bucket_id = 'outward-docs' and public.outward_role() in ('owner','admin'));

-- Starter chart of accounts for a ministry (edit freely in OUTWARD)
insert into public.acct_accounts (code, name, type, description) values
 ('1000','Operating checking','asset','Main bank account'),
 ('1010','Savings','asset',null),
 ('1200','Accounts receivable','asset','Money owed to SoulCause'),
 ('1500','Equipment','asset',null),
 ('2000','Accounts payable','liability','Bills owed'),
 ('2100','Credit card payable','liability','Balances owed on cards'),
 ('2200','Payroll liabilities','liability',null),
 ('3000','Net assets without donor restrictions','equity',null),
 ('3100','Net assets with donor restrictions','equity',null),
 ('4000','Donations and contributions','income',null),
 ('4100','Consulting revenue','income','SEND, LABOR, REACH and NET engagements'),
 ('4200','Subscription revenue','income','FIELD and plan subscriptions'),
 ('4300','Event revenue','income',null),
 ('4900','Other income','income',null),
 ('5000','Salaries and wages','expense',null),
 ('5100','Payroll taxes and benefits','expense',null),
 ('5200','Contract services','expense',null),
 ('5300','Rent and facilities','expense',null),
 ('5400','Travel and meetings','expense',null),
 ('5500','Printing and materials','expense',null),
 ('5600','Software and technology','expense',null),
 ('5700','Marketing and advertising','expense',null),
 ('5800','Insurance','expense',null),
 ('5900','Bank and card fees','expense',null),
 ('6000','Professional fees','expense','Legal and accounting'),
 ('6100','Ministry outreach and missions','expense',null),
 ('6900','Other expenses','expense',null)
on conflict (code) do nothing;

-- Access requests: anyone may ask to join; only the owner can approve (sets active = true).
drop policy if exists "anyone can request access" on public.outward_staff;
create policy "anyone can request access" on public.outward_staff for insert to anon, authenticated
  with check (active = false and role = 'staff');
grant insert on public.outward_staff to anon;
