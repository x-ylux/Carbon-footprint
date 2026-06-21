-- Simplify insert_cash_transaction to use proper INSERT RETURNING pattern
create or replace function public.insert_cash_transaction(
  category text,
  amount numeric,
  transaction_date date,
  receipt_url text default null,
  currency text default 'INR'
)
returns public.cash_transactions
language plpgsql
security definer
as $$
declare
  co2 numeric := 0;
  result public.cash_transactions;
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
  returning * into result;

  return result;
end;
$$;
