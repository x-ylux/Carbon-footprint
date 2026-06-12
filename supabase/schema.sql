-- Supabase Database Schema for Carbon Footprint Tracker
-- Run this script in your Supabase SQL Editor.

-- 1. Public Profiles (users) linked to auth.users
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
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
  transaction_date date not null,
  receipt_url text,
  co2_emission numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cash_transactions enable row level security;

create policy "Users select own cash transactions" on public.cash_transactions
  for select using (auth.uid() = user_id);
create policy "Users insert own cash transactions" on public.cash_transactions
  for insert with check (auth.uid() = user_id);
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
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for dashboard tables
alter publication supabase_realtime add table public.carbon_entries;
alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.cash_transactions;
