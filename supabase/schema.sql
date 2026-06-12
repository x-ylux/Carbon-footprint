-- Supabase Database Schema for Carbon Footprint Tracker
-- This script sets up the tables, auth triggers, and Row Level Security (RLS) policies.
-- You can run this script directly in your Supabase SQL Editor.

-- 1. Create Public Profiles (users) table linked to auth.users
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users table
alter table public.users enable row level security;

-- Create policies for users table
create policy "Allow public read of profiles" on public.users
  for select using (true);

create policy "Allow users to update their own profile" on public.users
  for update using (auth.uid() = id);

-- 2. Create Carbon Entries table
create table if not exists public.carbon_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null, -- e.g., 'transportation', 'energy', 'food', 'shopping'
  subcategory text not null, -- e.g., 'car', 'electricity', 'meat'
  value numeric not null, -- raw user input value
  unit text not null, -- e.g., 'km/month', 'units/month'
  co2_emission numeric not null, -- calculated CO2 emission in kg CO2/year
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on carbon_entries table
alter table public.carbon_entries enable row level security;

-- Create policies for carbon_entries table
create policy "Allow users to select their own carbon entries" on public.carbon_entries
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own carbon entries" on public.carbon_entries
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own carbon entries" on public.carbon_entries
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own carbon entries" on public.carbon_entries
  for delete using (auth.uid() = user_id);

-- 3. Create Goals table
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  annual_limit numeric not null, -- stored in kg CO2/year
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on goals table
alter table public.goals enable row level security;

-- Create policies for goals table
create policy "Allow users to select their own goals" on public.goals
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own goals" on public.goals
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own goals" on public.goals
  for update using (auth.uid() = user_id);

-- 4. Auth triggers: Auto-create a public.users row whenever a user signs up via auth.users
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

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
