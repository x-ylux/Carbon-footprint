-- Functions and triggers for Carbon Footprint Tracker

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, country, region, target_budget)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'country', 'India'),
    coalesce(new.raw_user_meta_data->>'region', 'IN'),
    2000
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_carbon_entries_updated on public.carbon_entries;
create trigger trg_carbon_entries_updated
  before update on public.carbon_entries
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_cash_transactions_updated on public.cash_transactions;
create trigger trg_cash_transactions_updated
  before update on public.cash_transactions
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated
  before update on public.users
  for each row execute procedure public.touch_updated_at();

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

  insert into public.cash_transactions (user_id, category, amount, currency, parsed_co2, receipt_url, transaction_date, co2_emission)
  values (auth.uid(), category, amount, currency, NULL, receipt_url, transaction_date, round(co2::numeric, 4))
  returning * into co2;

  return (select * from public.cash_transactions where id = (select lastval()));
end;
$$ language plpgsql security definer;

alter publication supabase_realtime add table public.cash_transactions;
