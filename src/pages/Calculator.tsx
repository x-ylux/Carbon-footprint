import React, { useState, useEffect, useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import { 
  Car, 
  Zap, 
  Apple, 
  ShoppingBag, 
  Save, 
  Info, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  transportCO2,
  energyCO2,
  foodCO2,
  shoppingCO2,
  digitalCO2,
  cashTransactionCO2,
  cashCategoryFactors,
} from '../lib/co2Formulas';
import { Monitor, Wallet } from 'lucide-react';

// Validation Schema
const calculatorSchema = z.object({
  // Transportation
  car_km: z.coerce.number().nonnegative('Must be at least 0').default(0),
  bus_days: z.coerce.number().nonnegative('Must be at least 0').max(31, 'Max 31 days').default(0),
  metro_km: z.coerce.number().nonnegative('Must be at least 0').default(0),
  bike_km: z.coerce.number().nonnegative('Must be at least 0').default(0),
  flight_count: z.coerce.number().nonnegative('Must be at least 0').default(0),

  // Home Energy
  elec_units: z.coerce.number().nonnegative('Must be at least 0').default(0),
  gas_liters: z.coerce.number().nonnegative('Must be at least 0').default(0),
  water_buckets: z.coerce.number().nonnegative('Must be at least 0').default(0),

  // Food
  food_type: z.enum(['vegetarian', 'non-vegetarian', 'mixed']).default('mixed'),
  meals_per_day: z.coerce.number().nonnegative('Must be at least 0').max(10, 'Max 10 meals').default(3),
  meat_kg: z.coerce.number().nonnegative('Must be at least 0').default(0),

  // Shopping
  online_orders: z.coerce.number().nonnegative('Must be at least 0').default(0),
  clothing_items: z.coerce.number().nonnegative('Must be at least 0').default(0),
  electronics_count: z.coerce.number().nonnegative('Must be at least 0').default(0),
  food_waste_pct: z.coerce.number().nonnegative('Must be at least 0').max(100, 'Max 100%').default(0),

  // Digital footprint
  streaming_hours: z.coerce.number().nonnegative().default(0),
  cloud_gb: z.coerce.number().nonnegative().default(0),
  email_count: z.coerce.number().nonnegative().default(0),
  call_hours: z.coerce.number().nonnegative().default(0),
  social_hours: z.coerce.number().nonnegative().default(0),
});

type CalculatorFormInput = z.infer<typeof calculatorSchema>;

const cashSchema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be positive'),
  transaction_date: z.string().min(1),
  receipt_url: z.string().optional(),
});

type CashFormInput = z.infer<typeof cashSchema>;

type TabId = 'transport' | 'energy' | 'food' | 'shopping' | 'digital' | 'cash';

export const Calculator: React.FC = () => {
  const { user } = useAuth();
  const db = supabase as SupabaseClient<Database, 'public', 'public'>;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('transport');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState('');
  const [receiptParseMessage, setReceiptParseMessage] = useState<string | null>(null);
  const [cashTransactions, setCashTransactions] = useState<
    Array<{ id: string; category: string; amount: number; transaction_date: string; co2_emission: number }>
  >([]);
  const [cashSaving, setCashSaving] = useState(false);

  const cashForm = useForm<CashFormInput>({
    resolver: zodResolver(cashSchema) as Resolver<CashFormInput>,
    defaultValues: {
      category: 'food',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      receipt_url: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<CalculatorFormInput>({
    resolver: zodResolver(calculatorSchema) as Resolver<CalculatorFormInput>,
    defaultValues: {
      car_km: 0,
      bus_days: 0,
      metro_km: 0,
      bike_km: 0,
      flight_count: 0,
      elec_units: 0,
      gas_liters: 0,
      water_buckets: 0,
      food_type: 'mixed',
      meals_per_day: 3,
      meat_kg: 0,
      online_orders: 0,
      clothing_items: 0,
      electronics_count: 0,
      food_waste_pct: 0,
      streaming_hours: 0,
      cloud_gb: 0,
      email_count: 0,
      call_hours: 0,
      social_hours: 0,
    },
  });

  const watchedValues = useWatch({ control }) as CalculatorFormInput;

  useEffect(() => {
    if (!user) return;
    db
      .from('cash_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .then(({ data }: { data: typeof cashTransactions | null }) => {
        if (data) setCashTransactions(data.slice(0, 10));
      });
  }, [db, user]);

  const cashTotal = cashTransactions.reduce((s, t) => s + Number(t.co2_emission), 0);

  const emissions = useMemo(() => {
    const transportTotal =
      transportCO2.car(watchedValues.car_km || 0) +
      transportCO2.bus(watchedValues.bus_days || 0) +
      transportCO2.metro(watchedValues.metro_km || 0) +
      transportCO2.bike() +
      transportCO2.flight(watchedValues.flight_count || 0);

    const energyTotal =
      energyCO2.electricity(watchedValues.elec_units || 0) +
      energyCO2.gas(watchedValues.gas_liters || 0) +
      energyCO2.water(watchedValues.water_buckets || 0);

    const foodType = watchedValues.food_type as 'vegetarian' | 'non-vegetarian' | 'mixed';
    const foodTotal =
      foodCO2.mealsPerYear(watchedValues.meals_per_day || 0, foodType) +
      foodCO2.meat(watchedValues.meat_kg || 0);

    const shoppingTotal =
      shoppingCO2.online(watchedValues.online_orders || 0) +
      shoppingCO2.clothing(watchedValues.clothing_items || 0) +
      shoppingCO2.electronics(watchedValues.electronics_count || 0) +
      shoppingCO2.waste(watchedValues.food_waste_pct || 0);

    const digitalTotal =
      digitalCO2.streaming(watchedValues.streaming_hours || 0) +
      digitalCO2.cloud(watchedValues.cloud_gb || 0) +
      digitalCO2.email(watchedValues.email_count || 0) +
      digitalCO2.calls(watchedValues.call_hours || 0) +
      digitalCO2.social(watchedValues.social_hours || 0);

    const total = transportTotal + energyTotal + foodTotal + shoppingTotal + digitalTotal + cashTotal;

    return {
      transport: Math.round(transportTotal),
      energy: Math.round(energyTotal),
      food: Math.round(foodTotal),
      shopping: Math.round(shoppingTotal),
      digital: Math.round(digitalTotal),
      cash: Math.round(cashTotal),
      total: Math.round(total),
    };
  }, [watchedValues, cashTotal]);

  const parseReceiptText = () => {
    setReceiptParseMessage(null);
    const text = receiptText.trim();
    if (!text) {
      setReceiptParseMessage('Paste receipt text to auto-fill the transaction fields.');
      return;
    }

    const amountMatch = text.match(/₹?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/);
    const categoryMatch = text.match(/\b(food|transport|shopping|utilities|entertainment|healthcare|other)\b/i);

    const parsedAmount = amountMatch ? Number(amountMatch[1]) : 0;
    const parsedDate = dateMatch
      ? dateMatch[0].includes('/')
        ? new Date(dateMatch[0].split('/').reverse().join('-')).toISOString().split('T')[0]
        : dateMatch[0]
      : new Date().toISOString().split('T')[0];
    const parsedCategory = categoryMatch ? categoryMatch[1].toLowerCase() : 'other';

    cashForm.reset({
      category: parsedCategory,
      amount: parsedAmount,
      transaction_date: parsedDate,
      receipt_url: cashForm.getValues('receipt_url'),
    });

    setReceiptParseMessage(
      `Parsed receipt: ${parsedCategory} for ₹${parsedAmount.toFixed(2)} on ${parsedDate}. Review before saving.`,
    );
  };

  // Determine indicator color
  const getIndicator = () => {
    const total = emissions.total;
    if (total < 1600) {
      return {
        label: 'Low (Eco-Friendly)',
        desc: 'Awesome! Your footprint is lower than the average Indian citizen (1,600 kg). Keep it up!',
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
        badge: 'bg-emerald-500 text-white'
      };
    } else if (total >= 1600 && total <= 3000) {
      return {
        label: 'Moderate',
        desc: 'Your footprint is around the average. Try adopting a vegetarian diet or taking transit to reach the sustainable limit (< 2,000 kg).',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
        badge: 'bg-amber-500 text-white'
      };
    } else {
      return {
        label: 'High Carbon Cost',
        desc: 'Warning: Your footprint is high. Setting clean energy plans and carpooling are great ways to reduce emissions.',
        color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50',
        badge: 'bg-rose-500 text-white'
      };
    }
  };

  const indicator = getIndicator();

  // Save to database
  const onSave: SubmitHandler<CalculatorFormInput> = async (data) => {
    if (!user) return;
    setSaveLoading(true);
    setErrorMsg(null);

    try {
      const nowStr = new Date().toISOString();
      const insertRows = [
        // Transportation
        { category: 'transportation', subcategory: 'car', value: data.car_km, unit: 'km/month', created_at: nowStr },
        { category: 'transportation', subcategory: 'bus', value: data.bus_days, unit: 'days/month', created_at: nowStr },
        { category: 'transportation', subcategory: 'metro', value: data.metro_km, unit: 'km/month', created_at: nowStr },
        { category: 'transportation', subcategory: 'bike', value: data.bike_km, unit: 'km/month', created_at: nowStr },
        { category: 'transportation', subcategory: 'flight', value: data.flight_count, unit: 'flights/year', created_at: nowStr },

        // Energy
        { category: 'energy', subcategory: 'electricity', value: data.elec_units, unit: 'units/month', created_at: nowStr },
        { category: 'energy', subcategory: 'gas', value: data.gas_liters, unit: 'liters/month', created_at: nowStr },
        { category: 'energy', subcategory: 'water', value: data.water_buckets, unit: 'buckets/day', created_at: nowStr },

        // Food
        { category: 'food', subcategory: 'diet_type', value: data.meals_per_day, unit: data.food_type, created_at: nowStr },
        { category: 'food', subcategory: 'meat', value: data.meat_kg, unit: 'kg/month', created_at: nowStr },

        // Shopping
        { category: 'shopping', subcategory: 'online', value: data.online_orders, unit: 'orders/month', created_at: nowStr },
        { category: 'shopping', subcategory: 'clothing', value: data.clothing_items, unit: 'items/month', created_at: nowStr },
        { category: 'shopping', subcategory: 'electronics', value: data.electronics_count, unit: 'devices/year', created_at: nowStr },
        { category: 'shopping', subcategory: 'waste', value: data.food_waste_pct, unit: 'waste_pct', created_at: nowStr },

        // Digital
        { category: 'digital', subcategory: 'streaming', value: data.streaming_hours, unit: 'hours/month', created_at: nowStr },
        { category: 'digital', subcategory: 'cloud', value: data.cloud_gb, unit: 'GB', created_at: nowStr },
        { category: 'digital', subcategory: 'email', value: data.email_count, unit: 'emails/day', created_at: nowStr },
        { category: 'digital', subcategory: 'calls', value: data.call_hours, unit: 'hours/month', created_at: nowStr },
        { category: 'digital', subcategory: 'social', value: data.social_hours, unit: 'hours/day', created_at: nowStr },
      ];

      const nonZeroRows = insertRows.filter(r => r.value > 0 || r.subcategory === 'diet_type');
      const { error } = await db
        .from('carbon_entries')
        .insert(
          nonZeroRows.map((row) => ({
            ...row,
            user_id: user.id,
            co2_emission:
              row.category === 'transportation' && row.subcategory === 'car'
                ? transportCO2.car(row.value)
                : row.category === 'transportation' && row.subcategory === 'bus'
                ? transportCO2.bus(row.value)
                : row.category === 'transportation' && row.subcategory === 'metro'
                ? transportCO2.metro(row.value)
                : row.category === 'transportation' && row.subcategory === 'bike'
                ? transportCO2.bike()
                : row.category === 'transportation' && row.subcategory === 'flight'
                ? transportCO2.flight(row.value)
                : row.category === 'energy' && row.subcategory === 'electricity'
                ? energyCO2.electricity(row.value)
                : row.category === 'energy' && row.subcategory === 'gas'
                ? energyCO2.gas(row.value)
                : row.category === 'energy' && row.subcategory === 'water'
                ? energyCO2.water(row.value)
                : row.category === 'food' && row.subcategory === 'diet_type'
                ? foodCO2.mealsPerYear(row.value, row.unit as 'vegetarian' | 'non-vegetarian' | 'mixed')
                : row.category === 'food' && row.subcategory === 'meat'
                ? foodCO2.meat(row.value)
                : row.category === 'shopping' && row.subcategory === 'online'
                ? shoppingCO2.online(row.value)
                : row.category === 'shopping' && row.subcategory === 'clothing'
                ? shoppingCO2.clothing(row.value)
                : row.category === 'shopping' && row.subcategory === 'electronics'
                ? shoppingCO2.electronics(row.value)
                : row.category === 'shopping' && row.subcategory === 'waste'
                ? shoppingCO2.waste(row.value)
                : row.category === 'digital' && row.subcategory === 'streaming'
                ? digitalCO2.streaming(row.value)
                : row.category === 'digital' && row.subcategory === 'cloud'
                ? digitalCO2.cloud(row.value)
                : row.category === 'digital' && row.subcategory === 'email'
                ? digitalCO2.email(row.value)
                : row.category === 'digital' && row.subcategory === 'calls'
                ? digitalCO2.calls(row.value)
                : row.category === 'digital' && row.subcategory === 'social'
                ? digitalCO2.social(row.value)
                : 0,
          }))
        );

      if (error) {
        throw new Error(error.message);
      }

      setSaveSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sync data with the database.');
      console.error(error);
      setErrorMsg(error.message || 'Failed to sync data with the database.');
    } finally {
      setSaveLoading(false);
    }
  };

  const onAddCashTransaction: SubmitHandler<CashFormInput> = async (data) => {
    if (!user) return;
    setCashSaving(true);
    setErrorMsg(null);
    try {
      const { data: inserted, error } = await db
        .from('cash_transactions')
        .insert({
          user_id: user.id,
          category: data.category,
          amount: data.amount,
          currency: 'INR',
          parsed_co2: null,
          receipt_url: data.receipt_url || null,
          transaction_date: data.transaction_date,
          co2_emission: cashTransactionCO2(data.category, data.amount),
        });

      if (error) throw error;
      const newTx = inserted ?? {
        id: crypto.randomUUID(),
        category: data.category,
        amount: data.amount,
        transaction_date: data.transaction_date,
        co2_emission: cashTransactionCO2(data.category, data.amount),
      };
      setCashTransactions((prev) => [newTx, ...prev].slice(0, 10));
      cashForm.reset({
        category: 'food',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        receipt_url: '',
      });
      setReceiptParseMessage(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save transaction.');
      setErrorMsg(error.message || 'Failed to save transaction.');
    } finally {
      setCashSaving(false);
    }
  };

  const tabs = [
    { id: 'transport' as TabId, label: 'Transport', icon: Car },
    { id: 'energy' as TabId, label: 'Energy', icon: Zap },
    { id: 'food' as TabId, label: 'Food', icon: Apple },
    { id: 'shopping' as TabId, label: 'Shopping', icon: ShoppingBag },
    { id: 'digital' as TabId, label: 'Digital', icon: Monitor },
    { id: 'cash' as TabId, label: 'Cash', icon: Wallet },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* Title Header */}
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
          Carbon Footprint Calculator
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Fill in your daily and monthly habits to calculate your environmental footprint in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm p-6 sm:p-8">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px mb-8 scrollbar-none">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 pb-4 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id 
                      ? 'border-forest-500 text-forest-700 dark:text-forest-400 font-extrabold' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <TabIcon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSave)} className="space-y-8">
            
            {/* Tab 1: Transportation */}
            {activeTab === 'transport' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Transportation Habits
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Car travel (km/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('car_km')} />
                    {errors.car_km && <p className="text-xs font-semibold text-rose-500">{errors.car_km.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bus travel (days/month)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('bus_days')} />
                    {errors.bus_days && <p className="text-xs font-semibold text-rose-500">{errors.bus_days.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Metro travel (km/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('metro_km')} />
                    {errors.metro_km && <p className="text-xs font-semibold text-rose-500">{errors.metro_km.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bicycle travel (km/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('bike_km')} />
                    {errors.bike_km && <p className="text-xs font-semibold text-rose-500">{errors.bike_km.message}</p>}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Flights taken (count/year)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('flight_count')} />
                    {errors.flight_count && <p className="text-xs font-semibold text-rose-500">{errors.flight_count.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('energy')} className="flex items-center space-x-2 px-5 py-2.5 bg-forest-600 text-white font-bold rounded-xl hover:bg-forest-700 transition cursor-pointer">
                    <span>Next: Energy</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Home Energy */}
            {activeTab === 'energy' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Home Energy Footprint
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Electricity (units/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('elec_units')} />
                    {errors.elec_units && <p className="text-xs font-semibold text-rose-500">{errors.elec_units.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">LPG/CNG Gas (liters/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('gas_liters')} />
                    {errors.gas_liters && <p className="text-xs font-semibold text-rose-500">{errors.gas_liters.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Domestic Water (buckets/day)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('water_buckets')} />
                    {errors.water_buckets && <p className="text-xs font-semibold text-rose-500">{errors.water_buckets.message}</p>}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('transport')} className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('food')} className="flex items-center space-x-2 px-5 py-2.5 bg-forest-600 text-white font-bold rounded-xl hover:bg-forest-700 transition cursor-pointer">
                    <span>Next: Diet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Food & Diet */}
            {activeTab === 'food' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Diet & Nutrition
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Dietary Style</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-semibold" {...register('food_type')}>
                      <option value="vegetarian">Vegetarian (0.5 kg CO2/meal)</option>
                      <option value="mixed">Mixed Diet (0.85 kg CO2/meal)</option>
                      <option value="non-vegetarian">Non-Vegetarian (1.2 kg CO2/meal)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Meals per day</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('meals_per_day')} />
                    {errors.meals_per_day && <p className="text-xs font-semibold text-rose-500">{errors.meals_per_day.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Meat consumption (kg/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('meat_kg')} />
                    {errors.meat_kg && <p className="text-xs font-semibold text-rose-500">{errors.meat_kg.message}</p>}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('energy')} className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('shopping')} className="flex items-center space-x-2 px-5 py-2.5 bg-forest-600 text-white font-bold rounded-xl hover:bg-forest-700 transition cursor-pointer">
                    <span>Next: Shopping</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Shopping & Waste */}
            {activeTab === 'shopping' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Shopping & Consumer Footprint
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Online orders (count/month)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('online_orders')} />
                    {errors.online_orders && <p className="text-xs font-semibold text-rose-500">{errors.online_orders.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">New clothing items (month)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('clothing_items')} />
                    {errors.clothing_items && <p className="text-xs font-semibold text-rose-500">{errors.clothing_items.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Electronic devices (year)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('electronics_count')} />
                    {errors.electronics_count && <p className="text-xs font-semibold text-rose-500">{errors.electronics_count.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estimated Food Waste (%)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('food_waste_pct')} />
                    {errors.food_waste_pct && <p className="text-xs font-semibold text-rose-500">{errors.food_waste_pct.message}</p>}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('food')} className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('digital')} className="flex items-center space-x-2 px-5 py-2.5 bg-forest-600 text-white font-bold rounded-xl hover:bg-forest-700 transition cursor-pointer">
                    <span>Next: Digital</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 5: Digital Footprint */}
            {activeTab === 'digital' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Digital Footprint
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Streaming (hours/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('streaming_hours')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cloud storage (GB)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('cloud_gb')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Emails sent (per day)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('email_count')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Video calls (hours/month)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('call_hours')} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Social media (hours/day)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...register('social_hours')} />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('shopping')} className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('cash')} className="flex items-center space-x-2 px-5 py-2.5 bg-forest-600 text-white font-bold rounded-xl hover:bg-forest-700 transition cursor-pointer">
                    <span>Next: Cash</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 6: Cash Transactions */}
            {activeTab === 'cash' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-l-4 border-forest-500 pl-3">
                  Cash Transactions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Category</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-semibold" {...cashForm.register('category')}>
                      {Object.keys(cashCategoryFactors).map((cat) => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Amount (₹)</label>
                    <input type="number" step="any" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...cashForm.register('amount')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...cashForm.register('transaction_date')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Receipt URL (optional)</label>
                    <input type="text" placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500" {...cashForm.register('receipt_url')} />
                  </div>
                  <div className="sm:col-span-2 space-y-3">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Receipt OCR (paste receipt text)</label>
                    <textarea
                      rows={4}
                      value={receiptText}
                      onChange={(event) => setReceiptText(event.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500"
                      placeholder="Example: Food 1500 2026-06-12"
                      aria-label="Receipt text for OCR parsing"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={parseReceiptText}
                        className="flex-1 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl transition"
                      >
                        Parse Receipt
                      </button>
                      {receiptParseMessage ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">{receiptParseMessage}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={cashForm.handleSubmit(onAddCashTransaction)}
                      disabled={cashSaving}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-sky-primary hover:bg-sky-dark text-white font-bold rounded-xl transition cursor-pointer"
                    >
                      {cashSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                      <span>Add Transaction</span>
                    </button>
                  </div>
                </div>
                {cashTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">Recent Transactions</h4>
                    {cashTransactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-sm font-bold capitalize text-slate-700 dark:text-slate-300">{tx.category}</span>
                          <span className="text-xs text-slate-400 ml-2">₹{Number(tx.amount).toLocaleString()}</span>
                        </div>
                        <span className="text-sm font-bold text-forest-600">{Math.round(tx.co2_emission)} kg CO₂</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('digital')} className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading || saveSuccess}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-forest-600 hover:bg-forest-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save All & View Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-start space-x-2.5 text-sm font-semibold">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Sticky Summary Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm p-6 space-y-6 transition-all duration-300">
            <h3 className="font-display font-extrabold text-xl text-slate-800 dark:text-white">
              Emissions Summary
            </h3>

            {/* Total Indicator Ring */}
            <div className="flex flex-col items-center py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-40 h-40 rounded-full border-8 border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center relative shadow-inner">
                {/* Active Colored Ring Segment */}
                <div
                  className={`absolute inset-0 rounded-full border-8 transition-all duration-500 ${
                    emissions.total < 1600
                      ? 'border-emerald-500'
                      : emissions.total <= 3000
                      ? 'border-amber-500'
                      : 'border-rose-500'
                  }`}
                ></div>
                <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                  {emissions.total.toLocaleString()}
                </span>
                <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                  kg CO₂e / year
                </span>
              </div>
            </div>

            {/* Category breakdown details */}
            <div className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500">Transportation</span>
                </div>
                <span>{emissions.transport.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-500">Home Energy</span>
                </div>
                <span>{emissions.energy.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="text-slate-500">Diet & Food</span>
                </div>
                <span>{emissions.food.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-sky-primary"></span>
                  <span className="text-slate-500">Shopping & Waste</span>
                </div>
                <span>{emissions.shopping.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                  <span className="text-slate-500">Digital</span>
                </div>
                <span>{emissions.digital.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-500">Cash Spending</span>
                </div>
                <span>{emissions.cash.toLocaleString()} kg/yr</span>
              </div>
            </div>

            {/* India Average Comparison */}
            <div className={`p-4 rounded-xl border ${indicator.color} transition-colors duration-300 space-y-2`}>
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span className="font-extrabold text-sm uppercase tracking-wider">
                  India Average Comparison
                </span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {indicator.desc}
              </p>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-bold">Your Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-3xs uppercase ${indicator.badge}`}>
                  {indicator.label}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Calculator;
