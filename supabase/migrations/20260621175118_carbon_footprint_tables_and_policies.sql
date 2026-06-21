-- Tables and policies only (no functions/triggers)

create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  country text default 'India',
  region text default 'IN',
  target_budget numeric default 2000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Authenticated users read profiles" on public.users
  for select to authenticated using (true);

create policy "Allow users to update their own profile" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.carbon_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null,
  subcategory text not null,
  value numeric not null,
  unit text not null,
  co2_emission numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carbon_entries enable row level security;

create policy "Users select own carbon entries" on public.carbon_entries
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own carbon entries" on public.carbon_entries
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own carbon entries" on public.carbon_entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own carbon entries" on public.carbon_entries
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists idx_carbon_entries_user_created on public.carbon_entries (user_id, created_at desc);

create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  annual_limit numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;

create policy "Users select own goals" on public.goals
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own goals" on public.goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own goals" on public.goals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  monthly_limit numeric not null,
  month_year text not null,
  spent numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, month_year)
);

alter table public.budgets enable row level security;

create policy "Users select own budgets" on public.budgets
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own budgets" on public.budgets
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own budgets" on public.budgets
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.cash_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null,
  amount numeric not null,
  currency text default 'INR',
  parsed_co2 numeric default null,
  receipt_url text,
  transaction_date date not null,
  co2_emission numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cash_transactions enable row level security;

create policy "Users select own cash transactions" on public.cash_transactions
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own cash transactions" on public.cash_transactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own cash transactions" on public.cash_transactions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own cash transactions" on public.cash_transactions
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists idx_cash_transactions_user_date on public.cash_transactions (user_id, transaction_date desc);

create table if not exists public.collective_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date date not null,
  location text,
  participants_count integer default 0,
  co2_impact_kg numeric default 0,
  active_status boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.collective_events enable row level security;

create policy "Anyone can read collective events" on public.collective_events
  for select to authenticated, anon using (true);

create table if not exists public.group_challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  target_kg numeric not null,
  current_kg numeric default 0,
  participants_count integer default 0,
  active_status boolean default true,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.group_challenges enable row level security;

create policy "Anyone can read group challenges" on public.group_challenges
  for select to authenticated, anon using (true);

insert into public.collective_events (title, description, event_date, location, participants_count, co2_impact_kg)
select * from (values
  ('Tree Plantation Drive', 'Plant 100 native trees in urban parks across Delhi NCR.', '2026-07-15'::date, 'Delhi, India', 245, 5000),
  ('Zero-Waste Workshop', 'Learn practical tips to reduce household waste and packaging.', '2026-08-02'::date, 'Mumbai, India', 120, 800),
  ('Cycling Sunday', 'Community bike ride promoting low-carbon commuting.', '2026-06-22'::date, 'Bangalore, India', 89, 1200)
) as v(title, description, event_date, location, participants_count, co2_impact_kg)
where not exists (select 1 from public.collective_events limit 1);

insert into public.group_challenges (title, description, target_kg, current_kg, participants_count, end_date)
select * from (values
  ('30-Day Meat-Free Challenge', 'Go vegetarian for 30 days and track your savings.', 50000, 32400, 412, '2026-07-31'::date),
  ('No Plastic July', 'Eliminate single-use plastics for one month.', 30000, 18500, 278, '2026-07-31'::date),
  ('Bike to Work Week', 'Swap car commutes for cycling this week.', 15000, 9800, 156, '2026-06-20'::date)
) as v(title, description, target_kg, current_kg, participants_count, end_date)
where not exists (select 1 from public.group_challenges limit 1);
