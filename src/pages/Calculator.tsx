import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
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
  food_waste_pct: z.coerce.number().nonnegative('Must be at least 0').max(100, 'Max 100%').default(0)
});

type CalculatorFormInput = z.infer<typeof calculatorSchema>;

type TabId = 'transport' | 'energy' | 'food' | 'shopping';

export const Calculator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('transport');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CalculatorFormInput>({
    resolver: zodResolver(calculatorSchema) as any,
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
      food_waste_pct: 0
    }
  });

  // Watch values for real-time calculation
  const watchedValues = watch();

  // Calculation state
  const [emissions, setEmissions] = useState({
    transport: 0,
    energy: 0,
    food: 0,
    shopping: 0,
    total: 0
  });

  // Re-calculate emissions whenever watched values change
  useEffect(() => {
    // 1. Transport emissions (kg/year)
    const carCO2 = (watchedValues.car_km || 0) * 0.12 * 12;
    const busCO2 = (watchedValues.bus_days || 0) * 2.5 * 12;
    const metroCO2 = (watchedValues.metro_km || 0) * 0.05 * 12;
    const bikeCO2 = 0;
    const flightCO2 = (watchedValues.flight_count || 0) * 200;
    const transportTotal = carCO2 + busCO2 + metroCO2 + bikeCO2 + flightCO2;

    // 2. Home Energy emissions (kg/year)
    const elecCO2 = (watchedValues.elec_units || 0) * 0.8 * 12;
    const gasCO2 = (watchedValues.gas_liters || 0) * 2.0 * 12;
    const waterCO2 = (watchedValues.water_buckets || 0) * 0.05 * 365;
    const energyTotal = elecCO2 + gasCO2 + waterCO2;

    // 3. Food emissions (kg/year)
    let dietFactor = 0.85; // mixed default
    if (watchedValues.food_type === 'vegetarian') dietFactor = 0.5;
    if (watchedValues.food_type === 'non-vegetarian') dietFactor = 1.2;
    const dietCO2 = (watchedValues.meals_per_day || 0) * dietFactor * 365;
    const meatCO2 = (watchedValues.meat_kg || 0) * 12 * 12;
    const foodTotal = dietCO2 + meatCO2;

    // 4. Shopping emissions (kg/year)
    const onlineCO2 = (watchedValues.online_orders || 0) * 5 * 12;
    const clothingCO2 = (watchedValues.clothing_items || 0) * 10 * 12;
    const electronicsCO2 = (watchedValues.electronics_count || 0) * 80;
    const wasteCO2 = (watchedValues.food_waste_pct || 0) * 2 * 12;
    const shoppingTotal = onlineCO2 + clothingCO2 + electronicsCO2 + wasteCO2;

    const total = transportTotal + energyTotal + foodTotal + shoppingTotal;

    setEmissions({
      transport: Math.round(transportTotal),
      energy: Math.round(energyTotal),
      food: Math.round(foodTotal),
      shopping: Math.round(shoppingTotal),
      total: Math.round(total)
    });
  }, [watchedValues]);

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
  const onSave = async (data: CalculatorFormInput) => {
    if (!user) return;
    setSaveLoading(true);
    setErrorMsg(null);

    try {
      const nowStr = new Date().toISOString();
      const insertRows = [
        // Transportation
        { category: 'transportation', subcategory: 'car', value: data.car_km, unit: 'km/month', co2_emission: data.car_km * 0.12 * 12, created_at: nowStr },
        { category: 'transportation', subcategory: 'bus', value: data.bus_days, unit: 'days/month', co2_emission: data.bus_days * 2.5 * 12, created_at: nowStr },
        { category: 'transportation', subcategory: 'metro', value: data.metro_km, unit: 'km/month', co2_emission: data.metro_km * 0.05 * 12, created_at: nowStr },
        { category: 'transportation', subcategory: 'bike', value: data.bike_km, unit: 'km/month', co2_emission: 0, created_at: nowStr },
        { category: 'transportation', subcategory: 'flight', value: data.flight_count, unit: 'flights/year', co2_emission: data.flight_count * 200, created_at: nowStr },
        
        // Energy
        { category: 'energy', subcategory: 'electricity', value: data.elec_units, unit: 'units/month', co2_emission: data.elec_units * 0.8 * 12, created_at: nowStr },
        { category: 'energy', subcategory: 'gas', value: data.gas_liters, unit: 'liters/month', co2_emission: data.gas_liters * 2.0 * 12, created_at: nowStr },
        { category: 'energy', subcategory: 'water', value: data.water_buckets, unit: 'buckets/day', co2_emission: data.water_buckets * 0.05 * 365, created_at: nowStr },
        
        // Food
        { category: 'food', subcategory: 'diet_type', value: data.food_type === 'vegetarian' ? 1 : data.food_type === 'non-vegetarian' ? 3 : 2, unit: 'diet_index', co2_emission: data.meals_per_day * (data.food_type === 'vegetarian' ? 0.5 : data.food_type === 'non-vegetarian' ? 1.2 : 0.85) * 365, created_at: nowStr },
        { category: 'food', subcategory: 'meat', value: data.meat_kg, unit: 'kg/month', co2_emission: data.meat_kg * 12 * 12, created_at: nowStr },
        
        // Shopping
        { category: 'shopping', subcategory: 'online', value: data.online_orders, unit: 'orders/month', co2_emission: data.online_orders * 5 * 12, created_at: nowStr },
        { category: 'shopping', subcategory: 'clothing', value: data.clothing_items, unit: 'items/month', co2_emission: data.clothing_items * 10 * 12, created_at: nowStr },
        { category: 'shopping', subcategory: 'electronics', value: data.electronics_count, unit: 'devices/year', co2_emission: data.electronics_count * 80, created_at: nowStr },
        { category: 'shopping', subcategory: 'waste', value: data.food_waste_pct, unit: 'waste_pct', co2_emission: data.food_waste_pct * 2 * 12, created_at: nowStr }
      ];

      // Remove zero-emission mock entries to keep DB clean, keeping only non-zeroes or key inputs
      const nonZeroRows = insertRows.filter(r => r.co2_emission > 0 || r.subcategory === 'diet_type');
      
      const { error } = await supabase.from('carbon_entries').insert(
        nonZeroRows.map(row => ({
          ...row,
          user_id: user.id
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

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sync data with the database.');
    } finally {
      setSaveLoading(false);
    }
  };

  const tabs = [
    { id: 'transport' as TabId, label: 'Transportation', icon: Car },
    { id: 'energy' as TabId, label: 'Home Energy', icon: Zap },
    { id: 'food' as TabId, label: 'Food & Diet', icon: Apple },
    { id: 'shopping' as TabId, label: 'Shopping', icon: ShoppingBag }
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
          <form onSubmit={handleSubmit(onSave as any)} className="space-y-8">
            
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
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save to Database</span>
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
                  className={`absolute inset-0 rounded-full border-8 border-transparent transition-all duration-500`}
                  style={{
                    borderColor: emissions.total < 1600 ? '#52b788' : emissions.total <= 3000 ? '#f59e0b' : '#f43f5e',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
                    transform: 'rotate(0deg)'
                  }}
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
