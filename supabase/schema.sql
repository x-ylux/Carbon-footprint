-- Supabase Database Schema for Carbon Footprint Tracker
-- Run this script in your Supabase SQL Editor.

-- 1. Public Profiles (users) linked to auth.users
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  country text default 'India',
  target_budget numeric default 2000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Allow public read of profiles" on public.users
  for select using (true);

create policy "Allow users to update their own profile" on public.users
  for update using (auth.uid() = id);

-- 2. Carbon Entries
create table if not exists public.carbon_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null,
  subcategory text not null,
  value numeric not null,
  unit text not null,
  co2_emission numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carbon_entries enable row level security;

create policy "Users select own carbon entries" on public.carbon_entries
  for select using (auth.uid() = user_id);
create policy "Users insert own carbon entries" on public.carbon_entries
  for insert with check (auth.uid() = user_id);
create policy "Users update own carbon entries" on public.carbon_entries
  for update using (auth.uid() = user_id);
create policy "Users delete own carbon entries" on public.carbon_entries
  for delete using (auth.uid() = user_id);

-- 3. Goals
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  annual_limit numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;

create policy "Users select own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users insert own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users update own goals" on public.goals
  for update using (auth.uid() = user_id);

-- 4. Budgets (monthly carbon budget)
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
  for select using (auth.uid() = user_id);
create policy "Users insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "Users update own budgets" on public.budgets
  for update using (auth.uid() = user_id);

-- 5. Cash Transactions
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cash_transactions enable row level security;

create policy "Users select own cash transactions" on public.cash_transactions
  for select using (auth.uid() = user_id);
create policy "Users insert own cash transactions" on public.cash_transactions
  for insert with check (auth.uid() = user_id);
create policy "Users update own cash transactions" on public.cash_transactions
  for update using (auth.uid() = user_id);
create policy "Users delete own cash transactions" on public.cash_transactions
  for delete using (auth.uid() = user_id);

-- 6. Collective Events (community)
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
  for select using (true);

-- 7. Group Challenges
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
  for select using (true);

-- Seed community data
insert into public.collective_events (title, description, event_date, location, participants_count, co2_impact_kg)
select * from (values
  ('Tree Plantation Drive', 'Plant 100 native trees in urban parks across Delhi NCR.', '2026-07-15', 'Delhi, India', 245, 5000),
  ('Zero-Waste Workshop', 'Learn practical tips to reduce household waste and packaging.', '2026-08-02', 'Mumbai, India', 120, 800),
  ('Cycling Sunday', 'Community bike ride promoting low-carbon commuting.', '2026-06-22', 'Bangalore, India', 89, 1200)
) as v(title, description, event_date, location, participants_count, co2_impact_kg)
where not exists (select 1 from public.collective_events limit 1);

insert into public.group_challenges (title, description, target_kg, current_kg, participants_count, end_date)
select * from (values
  ('30-Day Meat-Free Challenge', 'Go vegetarian for 30 days and track your savings.', 50000, 32400, 412, '2026-07-31'),
  ('No Plastic July', 'Eliminate single-use plastics for one month.', 30000, 18500, 278, '2026-07-31'),
  ('Bike to Work Week', 'Swap car commutes for cycling this week.', 15000, 9800, 156, '2026-06-20')
) as v(title, description, target_kg, current_kg, participants_count, end_date)
where not exists (select 1 from public.group_challenges limit 1);

-- Auth trigger: auto-create public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, country, target_budget)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'country', 'India'),
    2000
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Server-side emission calculation and insertion helpers
create or replace function public.calculate_carbon_emission(
  category text,
  subcategory text,
  value numeric,
  unit text
)
returns numeric as $$
declare
  computed numeric := 0;
begin
  if category = 'transportation' and subcategory = 'car' then
    computed := value * 0.12 * 12;
  elsif category = 'transportation' and subcategory = 'flight' then
    computed := value * 200;
  elsif category = 'transportation' and subcategory = 'bus' then
    computed := value * 2.5 * 12;
  elsif category = 'transportation' and subcategory = 'metro' then
    computed := value * 0.05 * 12;
  elsif category = 'transportation' and subcategory = 'bike' then
    computed := 0;
  elsif category = 'energy' and subcategory = 'electricity' then
    computed := value * 0.8 * 12;
  elsif category = 'energy' and subcategory = 'gas' then
    computed := value * 2.0 * 12;
  elsif category = 'energy' and subcategory = 'water' then
    computed := value * 0.05 * 365;
  elsif category = 'food' and subcategory = 'diet_type' then
    if unit = 'vegetarian' then
      computed := value * 0.5 * 365;
    elsif unit = 'non-vegetarian' then
      computed := value * 1.2 * 365;
    else
      computed := value * 0.85 * 365;
    end if;
  elsif category = 'food' and subcategory = 'meat' then
    computed := value * 12 * 12;
  elsif category = 'shopping' and subcategory = 'online' then
    computed := value * 5 * 12;
  elsif category = 'shopping' and subcategory = 'clothing' then
    computed := value * 10 * 12;
  elsif category = 'shopping' and subcategory = 'electronics' then
    computed := value * 80;
  elsif category = 'shopping' and subcategory = 'waste' then
    computed := value * 2 * 12;
  elsif category = 'digital' and subcategory = 'streaming' then
    computed := value * 0.05 * 12;
  elsif category = 'digital' and subcategory = 'cloud' then
    computed := value * 0.2;
  elsif category = 'digital' and subcategory = 'email' then
    computed := value * 0.004 * 365;
  elsif category = 'digital' and subcategory = 'calls' then
    computed := value * 0.1 * 12;
  elsif category = 'digital' and subcategory = 'social' then
    computed := value * 0.02 * 365;
  else
    computed := 0;
  end if;
  return round(computed::numeric, 4);
end;
$$ language plpgsql security definer stable;

create or replace function public.insert_carbon_entries(entries jsonb)
returns setof public.carbon_entries as $$
begin
  return query
    insert into public.carbon_entries (user_id, category, subcategory, value, unit, co2_emission, created_at)
    select
      auth.uid(),
      entry.value->>'category',
      entry.value->>'subcategory',
      (entry.value->>'value')::numeric,
      entry.value->>'unit',
      public.calculate_carbon_emission(
        entry.value->>'category',
        entry.value->>'subcategory',
        (entry.value->>'value')::numeric,
        entry.value->>'unit'
      ),
      coalesce((entry.value->>'created_at')::timestamptz, timezone('utc'::text, now()))
    from jsonb_array_elements(entries) as entry(value);
end;
$$ language plpgsql security definer;

create or replace function public.insert_cash_transaction(
  category text,
  amount numeric,
  transaction_date date,
  receipt_url text default null,
  currency text default 'INR'
)
returns public.cash_transactions as $$
declare
  co2 numeric := 0;
begin
  if category = 'food' then
    co2 := amount * 0.005;
  elsif category = 'transport' then
    co2 := amount * 0.008;
  elsif category = 'shopping' then
    co2 := amount * 0.006;
  elsif category = 'utilities' then
    co2 := amount * 0.01;
  elsif category = 'entertainment' then
    co2 := amount * 0.004;
  elsif category = 'healthcare' then
    co2 := amount * 0.003;
  else
    co2 := amount * 0.005;
  end if;

  return (
    insert into public.cash_transactions (user_id, category, amount, currency, parsed_co2, receipt_url, transaction_date, co2_emission)
    values (auth.uid(), category, amount, currency, NULL, receipt_url, transaction_date, round(co2::numeric, 4))
    returning *
  );
end;
$$ language plpgsql security definer;
alter publication supabase_realtime add table public.cash_transactions;
