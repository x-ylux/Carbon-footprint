import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Lightbulb,
  Wallet,
  Globe2,
  Edit,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INDIA_AVERAGE_KG, INDIA_AVERAGE_TONNES, TIPS } from '../lib/co2Formulas';

const DashboardTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number | string }>; label?: string | number }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-950/95 border border-slate-800 p-3 shadow-xl text-white">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <div className="text-sm font-semibold">{payload[0].value} kg CO₂e</div>
    </div>
  );
};

interface CarbonEntry {
  id: string;
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  co2_emission: number;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const db = supabase as SupabaseClient<Database, 'public', 'public'>;
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [goal, setGoal] = useState<number>(3000);
  const [loading, setLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState<string>('3000');
  const [budgetLimit, setBudgetLimit] = useState<number>(250);
  const [budgetSpent, setBudgetSpent] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>('250');
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null,
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; entry: CarbonEntry | null }>({
    isOpen: false,
    entry: null,
  });
  const [editValue, setEditValue] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Fetch carbon entries and goal limit
  const fetchData = useCallback(async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      // Fetch Entries
      const { data: entriesData, error: entriesError } = await db
        .from('carbon_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (entriesError) throw entriesError;
      setEntries(entriesData || []);

      // Fetch Goal
      const goalResult = await db
        .from('goals')
        .select('annual_limit')
        .eq('user_id', user.id)
        .single();
      const goalData = goalResult.data as { annual_limit: number } | null;

      if (goalResult.error && goalResult.error.message !== 'JSON object requested, multiple rows (or no rows) were returned') {
        // Ignorable if no rows, but log others
        console.error('Goal fetch error:', goalResult.error);
      }

      if (goalData && typeof goalData === 'object' && 'annual_limit' in goalData) {
        const parsedGoalData = goalData as { annual_limit: number };
        setGoal(Number(parsedGoalData.annual_limit));
        setGoalInput(String(parsedGoalData.annual_limit));
      }

      const budgetResult = await db
        .from('budgets')
        .select('monthly_limit, spent')
        .eq('user_id', user.id)
        .eq('month_year', currentMonthKey)
        .single();
      const budgetData = budgetResult.data as { monthly_limit: number; spent: number } | null;

      if (budgetData) {
        setBudgetLimit(Number(budgetData.monthly_limit));
        setBudgetSpent(Number(budgetData.spent));
        setBudgetInput(String(budgetData.monthly_limit));
      }

      const cashDataResult = await db
        .from('cash_transactions')
        .select('co2_emission, transaction_date')
        .eq('user_id', user.id);
      const cashData = cashDataResult.data as Array<{ co2_emission: number; transaction_date: string }> | null;

      if (cashData?.length) {
        const monthCash = cashData.filter((t: { transaction_date: string }) => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
        });
        const cashMonthTotal = monthCash.reduce((s: number, t: { co2_emission: number }) => s + Number(t.co2_emission), 0);
        setBudgetSpent((prev) => prev + cashMonthTotal);
      }
    } catch (errorUnknown) {
      const err = errorUnknown instanceof Error ? errorUnknown : new Error('Failed to load dashboard statistics.');
      console.error('Fetch dashboard data error:', err);
      setErrorMsg(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [user, db, currentMonthKey]);

  useEffect(() => {
    if (!user) return;

    const executeFetch = async () => {
      await fetchData();
    };

    void executeFetch();

    // Real-time listener subscription
    const channel = db
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'carbon_entries', filter: `user_id=eq.${user.id}` },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchData, user, db]);

  // Handle Goal Update
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingBudget(true);
    const val = Number(budgetInput);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Budget must be a positive number.');
      setUpdatingBudget(false);
      return;
    }
    try {
      const { error } = await db
        .from('budgets')
        .upsert({
          user_id: user.id,
          monthly_limit: val,
          month_year: currentMonthKey,
          spent: budgetSpent,
        } as Database['public']['Tables']['budgets']['Insert']);
      if (error) throw error;
      setBudgetLimit(val);
    } catch (errorUnknown) {
      const err = errorUnknown instanceof Error ? errorUnknown : new Error('Failed to update budget.');
      setErrorMsg(err.message || 'Failed to update budget.');
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingGoal(true);
    setErrorMsg(null);

    const val = Number(goalInput);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Goal limit must be a positive number.');
      setUpdatingGoal(false);
      return;
    }

    try {
      const { error: updateError } = await db
        .from('goals')
        .upsert({ user_id: user.id, annual_limit: val } as Database['public']['Tables']['goals']['Insert']);

      if (updateError) throw updateError;
      setGoal(val);

      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
      success('Goal updated', `Annual carbon limit set to ${val.toLocaleString()} kg.`);
    } catch (errorUnknown) {
      const err = errorUnknown instanceof Error ? errorUnknown : new Error('Failed to update carbon limit.');
      console.error(err);
      setErrorMsg(err.message || 'Failed to update carbon limit.');
      error('Failed to update goal', err.message);
    } finally {
      setUpdatingGoal(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteModal.entryId) return;
    setDeleteLoading(true);
    setErrorMsg(null);

    try {
      const { error: deleteError } = await db
        .from('carbon_entries')
        .delete()
        .eq('id', deleteModal.entryId);

      if (deleteError) throw deleteError;
      success('Entry deleted', 'Carbon entry has been removed.');
      setDeleteModal({ isOpen: false, entryId: null });
    } catch (errorUnknown) {
      const err = errorUnknown instanceof Error ? errorUnknown : new Error('Failed to delete record.');
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete record.');
      error('Failed to delete entry', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditEntry = async () => {
    if (!editModal.entry) return;
    setEditLoading(true);
    setErrorMsg(null);

    const newValue = Number(editValue);
    if (isNaN(newValue) || newValue < 0) {
      setErrorMsg('Value must be a positive number.');
      setEditLoading(false);
      return;
    }

    try {
      const co2Emission = calculateCO2ForEntry(
        editModal.entry.category,
        editModal.entry.subcategory,
        newValue,
        editModal.entry.unit
      );

      const { error: updateError } = await db
        .from('carbon_entries')
        .update({ value: newValue, co2_emission: co2Emission })
        .eq('id', editModal.entry.id);

      if (updateError) throw updateError;
      success('Entry updated', 'Carbon entry has been modified.');
      setEditModal({ isOpen: false, entry: null });
    } catch (errorUnknown) {
      const err = errorUnknown instanceof Error ? errorUnknown : new Error('Failed to update entry.');
      console.error(err);
      setErrorMsg(err.message || 'Failed to update entry.');
      error('Failed to update entry', err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const calculateCO2ForEntry = (category: string, subcategory: string, value: number, unit: string): number => {
    if (category === 'transportation' && subcategory === 'car') return value * 0.12 * 12;
    if (category === 'transportation' && subcategory === 'bus') return value * 2.5 * 12;
    if (category === 'transportation' && subcategory === 'metro') return value * 0.05 * 12;
    if (category === 'transportation' && subcategory === 'bike') return 0;
    if (category === 'transportation' && subcategory === 'flight') return value * 200;
    if (category === 'energy' && subcategory === 'electricity') return value * 0.8 * 12;
    if (category === 'energy' && subcategory === 'gas') return value * 2.0 * 12;
    if (category === 'energy' && subcategory === 'water') return value * 0.05 * 365;
    if (category === 'food' && subcategory === 'diet_type') {
      if (unit === 'vegetarian') return value * 0.5 * 365;
      if (unit === 'non-vegetarian') return value * 1.2 * 365;
      return value * 0.85 * 365;
    }
    if (category === 'food' && subcategory === 'meat') return value * 12 * 12;
    if (category === 'shopping' && subcategory === 'online') return value * 5 * 12;
    if (category === 'shopping' && subcategory === 'clothing') return value * 10 * 12;
    if (category === 'shopping' && subcategory === 'electronics') return value * 80;
    if (category === 'shopping' && subcategory === 'waste') return value * 2 * 12;
    if (category === 'digital' && subcategory === 'streaming') return value * 0.05 * 12;
    if (category === 'digital' && subcategory === 'cloud') return value * 0.2;
    if (category === 'digital' && subcategory === 'email') return value * 0.004 * 365;
    if (category === 'digital' && subcategory === 'calls') return value * 0.1 * 12;
    if (category === 'digital' && subcategory === 'social') return value * 0.02 * 365;
    return 0;
  };

  // ==========================================
  // DATA PROCESSING & METRIC CALCULATIONS
  // ==========================================

  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const grouped: Record<string, number> = {};

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      grouped[key] = (grouped[key] || 0) + Number(entry.co2_emission);
    });

    return Object.entries(grouped)
      .map(([name, emissions]) => ({ name, emissions: Math.round(emissions) }))
      .slice(-6);
  }, [entries]);

  const categoryData = useMemo(() => {
    const categories = {
      transportation: 0,
      energy: 0,
      food: 0,
      shopping: 0,
      digital: 0,
      cash: 0,
    };

    entries.forEach(entry => {
      const cat = entry.category as keyof typeof categories;
      if (categories[cat] !== undefined) {
        categories[cat] += Number(entry.co2_emission);
      }
    });

    return [
      { name: 'Transport', emissions: Math.round(categories.transportation) },
      { name: 'Energy', emissions: Math.round(categories.energy) },
      { name: 'Food', emissions: Math.round(categories.food) },
      { name: 'Shopping', emissions: Math.round(categories.shopping) },
      { name: 'Digital', emissions: Math.round(categories.digital) },
      { name: 'Cash', emissions: Math.round(categories.cash) },
    ].filter((c) => c.emissions > 0);
  }, [entries]);

  const { currentMonthEmissions, pctChange } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentSum = 0;
    let prevSum = 0;

    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        currentSum += Number(entry.co2_emission);
      } else if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
        prevSum += Number(entry.co2_emission);
      }
    });

    if (entries.length > 0 && currentSum === 0) {
      const timestamps = entries.map(e => new Date(e.created_at).getTime());
      const maxTime = Math.max(...timestamps);
      const latestDate = new Date(maxTime);

      entries.forEach(entry => {
        const d = new Date(entry.created_at);
        if (d.toDateString() === latestDate.toDateString()) {
          currentSum += Number(entry.co2_emission);
        }
      });

      const otherDayTimestamps = timestamps.filter(t => new Date(t).toDateString() !== latestDate.toDateString());
      if (otherDayTimestamps.length > 0) {
        const prevTime = Math.max(...otherDayTimestamps);
        const prevDate = new Date(prevTime);
        entries.forEach(entry => {
          const d = new Date(entry.created_at);
          if (d.toDateString() === prevDate.toDateString()) {
            prevSum += Number(entry.co2_emission);
          }
        });
      }
    }

    currentSum = Math.round(currentSum);
    prevSum = Math.round(prevSum);

    let pctChange = 0;
    if (prevSum > 0) {
      pctChange = ((currentSum - prevSum) / prevSum) * 100;
    }

    return {
      currentMonthEmissions: currentSum,
      pctChange: Math.round(pctChange),
    };
  }, [entries]);

  const totalAnnualCO2 = entries.reduce((acc, e) => acc + Number(e.co2_emission), 0);
  const indiaComparisonPct = Math.round((totalAnnualCO2 / INDIA_AVERAGE_KG) * 100);
  const vsIndiaLabel =
    totalAnnualCO2 < INDIA_AVERAGE_KG
      ? `${Math.round(((INDIA_AVERAGE_KG - totalAnnualCO2) / INDIA_AVERAGE_KG) * 100)}% below India avg`
      : `${Math.round(((totalAnnualCO2 - INDIA_AVERAGE_KG) / INDIA_AVERAGE_KG) * 100)}% above India avg`;

  const budgetPercent = budgetLimit > 0 ? Math.min(Math.round((budgetSpent / budgetLimit) * 100), 100) : 0;

  // Progress calculations
  const totalAnnualRate = entries.reduce((acc, curr) => acc + Number(curr.co2_emission), 0);
  const averageAnnualRate = entries.length > 0 ? Math.round(totalAnnualRate / (entries.length / 14)) : 0; // estimate submission rate, or simply current total
  
  // Let's use the current month rate or latest submission rate as their current annual pacing
  const currentAnnualPacing = currentMonthEmissions || averageAnnualRate;
  const progressPercent = goal > 0 ? Math.min(Math.round((currentAnnualPacing / goal) * 100), 100) : 0;

  // Progress Bar styling color based on consumption
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-forest-50/20 dark:bg-forest-950/10">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-forest-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading your carbon analytics...</p>
        </div>
      </div>
    );
  }

  // Dashboard Empty State
  if (entries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-forest-100 dark:bg-forest-950/50 flex items-center justify-center mx-auto border-2 border-dashed border-forest-300 dark:border-forest-800">
          <TrendingUp className="w-10 h-10 text-forest-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 dark:text-white">
            No Carbon Footprint Logged Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
            To view detailed metrics, graphs, and compare your score, head over to the carbon calculator.
          </p>
        </div>

        <Link
          to="/calculator"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold transition shadow-md shadow-forest-600/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Launch Calculator</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300 space-y-8">
      
      {/* Dashboard Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Environmental Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Analyze your emission habits, track monthly progress, and adjust sustainability goals.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          <button 
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition"
            title="Reload data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link
            to="/calculator"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Calculation</span>
          </Link>
        </div>
      </div>

      {/* India Comparison Banner */}
      <div className="bg-gradient-to-r from-forest-600 to-sky-dark rounded-2xl p-6 text-white shadow-lg shadow-forest-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl">India Average Comparison</h3>
              <p className="text-forest-100 text-sm font-medium mt-1">
                India's per-capita average is {INDIA_AVERAGE_TONNES} tonnes ({INDIA_AVERAGE_KG.toLocaleString()} kg) per year.
                You are at <strong className="text-white">{vsIndiaLabel}</strong>.
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-4xl font-black">{totalAnnualCO2.toLocaleString()}</div>
            <div className="text-sm font-semibold text-forest-200">kg CO₂e / year (total logged)</div>
            <div className="mt-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              {indiaComparisonPct}% of India average
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Active CO2 Pacing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Pacing</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-none">
              {currentAnnualPacing.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg/yr</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2 mt-4 text-sm font-semibold">
            {pctChange > 0 ? (
              <span className="flex items-center space-x-0.5 text-rose-500">
                <TrendingUp className="w-4.5 h-4.5" />
                <span>+{pctChange}%</span>
              </span>
            ) : pctChange < 0 ? (
              <span className="flex items-center space-x-0.5 text-emerald-500">
                <TrendingDown className="w-4.5 h-4.5" />
                <span>{pctChange}%</span>
              </span>
            ) : (
              <span className="text-slate-500">No change</span>
            )}
            <span className="text-slate-400">vs last inputs</span>
          </div>
        </div>

        {/* KPI 2: Target Limit Goal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Annual Goal Limit</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-none">
              {goal.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg/yr</span>
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 mt-4 text-sm font-semibold text-slate-500">
            <Target className="w-4.5 h-4.5 text-forest-500" />
            <span>Target: Maintain below limit</span>
          </div>
        </div>

        {/* KPI 3: Goal Consumed Tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Limit Consumed</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-none">
              {progressPercent}%
            </h2>
          </div>
          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full rounded-full overflow-hidden">
              <progress
                className={`w-full h-2.5 appearance-none rounded-full ${
                  progressPercent >= 100 ? 'accent-rose-500' : progressPercent >= 75 ? 'accent-amber-500' : 'accent-sky-primary'
                }`}
                value={progressPercent}
                max={100}
              />
            </div>
            <div className="flex justify-between text-2xs font-bold text-slate-400 uppercase tracking-wider">
              <span>0 kg</span>
              <span>Limit: {goal} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Trend & Category Breakdown Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Chart 1: Line Chart Monthly Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-white">
                Monthly Carbon Footprint Trend
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Total annual equivalent emissions tracked over the past months.
              </p>
            </div>

            <div className="h-64 sm:h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<DashboardTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="#52b788" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, stroke: '#52b788', fill: '#fff' }}
                    activeDot={{ r: 7 }}
                    name="Emissions (kg CO2e)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Bar Chart Category Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-white">
                Emissions Breakdown by Category
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Distribution of carbon output across transport, energy, meals, and products.
              </p>
            </div>

            <div className="h-64 sm:h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<DashboardTooltip />} />
                  <Bar 
                    dataKey="emissions" 
                    fill="#4dabf7" 
                    radius={[8, 8, 0, 0]} 
                    name="Emissions (kg CO2e)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Goal Settings & Live Logs */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Monthly Budget Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-sky-primary" />
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                Monthly Carbon Budget
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-500">Spent this month</span>
                <span className="text-slate-800 dark:text-white">{Math.round(budgetSpent)} / {budgetLimit} kg</span>
              </div>
              <div className="w-full rounded-full overflow-hidden">
                <progress
                  className={`w-full h-3 appearance-none rounded-full ${
                    budgetPercent >= 100 ? 'accent-rose-500' : budgetPercent >= 75 ? 'accent-amber-500' : 'accent-sky-primary'
                  }`}
                  value={budgetPercent}
                  max={100}
                />
              </div>
            </div>
            <form onSubmit={handleUpdateBudget} className="space-y-3">
              <label htmlFor="dashboard-budget-input" className="sr-only">
                Monthly carbon budget
              </label>
              <input
                id="dashboard-budget-input"
                type="number"
                aria-label="Monthly carbon budget"
                placeholder="Monthly carbon budget"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-primary font-bold"
              />
              <button
                type="submit"
                disabled={updatingBudget}
                className="w-full py-2.5 bg-sky-light dark:bg-sky-dark/30 text-sky-dark dark:text-sky-primary font-bold rounded-xl hover:bg-sky-primary hover:text-white transition cursor-pointer"
              >
                {updatingBudget ? 'Updating...' : 'Set Monthly Budget'}
              </button>
            </form>
          </div>

          {/* Top 5 Tips */}
          <div className="bg-slate-950/95 dark:bg-slate-900 border border-slate-800/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-lg text-slate-100 dark:text-white">
                Top 5 Reduction Tips
              </h3>
            </div>
            <div className="space-y-3">
              {TIPS.map((tip, i) => (
                <div
                  key={tip.title}
                  className="p-3 rounded-xl bg-slate-800/90 dark:bg-slate-900/95 border border-slate-700 dark:border-slate-800 hover:border-forest-300 dark:hover:border-forest-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-forest-300 dark:text-forest-400">#{i + 1}</span>
                    <span className="text-2xs font-bold text-emerald-200 dark:text-emerald-300 bg-emerald-700/20 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      -{tip.savings}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 dark:text-white">{tip.title}</h4>
                  <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Widget: Update Goal limit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-forest-500" />
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                Set Annual Carbon Limit
              </h3>
            </div>
            
            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="dashboard-goal-input" className="text-xs font-bold uppercase tracking-wider text-slate-400">Limit Target (kg CO₂e/yr)</label>
                <div className="relative">
                  <input 
                    id="dashboard-goal-input"
                    type="number" 
                    aria-label="Annual carbon limit target"
                    placeholder="Enter annual carbon limit"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full pl-4 pr-16 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-bold" 
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400">
                    kg/yr
                  </span>
                </div>
              </div>

              {/* Slider for easy limit adjusting */}
              <div className="space-y-1">
                <input 
                  type="range" 
                  min="500" 
                  max="10000" 
                  step="100"
                  title="Adjust annual carbon limit"
                  aria-label="Adjust annual carbon limit"
                  value={goalInput}
                  onChange={(e) => {
                    setGoalInput(e.target.value);
                  }}
                  className="w-full accent-forest-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none" 
                />
                <div className="flex justify-between text-3xs font-semibold text-slate-400 uppercase">
                  <span>500 kg (Strict)</span>
                  <span>10,000 kg</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingGoal}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
              >
                {updatingGoal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Limit</span>
                )}
              </button>
            </form>
          </div>

          {/* Widget 2: Carbon logs checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Recent Calculations
            </h3>

            {/* List entries */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {entries.slice(-5).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 dark:bg-slate-900/95 border border-slate-700 dark:border-slate-800/50 transition-all duration-200 group hover:border-slate-500 dark:hover:border-slate-700"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold capitalize text-slate-200 dark:text-slate-300">
                        {entry.subcategory}
                      </span>
                      <span className="text-3xs font-bold text-slate-200 bg-slate-700/60 dark:bg-slate-800 px-1.5 py-0.5 rounded-full capitalize">
                        {entry.category}
                      </span>
                    </div>
                    <div className="text-3xs text-slate-400 font-semibold mt-0.5">
                      {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-right">
                    <div>
                      <div className="text-xs font-extrabold text-slate-100 dark:text-white">
                        {Math.round(entry.co2_emission).toLocaleString()}
                      </div>
                      <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                        kg CO₂/yr
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label="Edit log entry"
                        onClick={() => {
                          setEditModal({ isOpen: true, entry });
                          setEditValue(String(entry.value));
                        }}
                        className="p-1 rounded bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition duration-150 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete log entry"
                        onClick={() => setDeleteModal({ isOpen: true, entryId: entry.id })}
                        className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition duration-150 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-start space-x-2.5 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, entryId: null })}
        onConfirm={handleDeleteEntry}
        title="Delete Carbon Entry"
        message="Are you sure you want to delete this carbon entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

      {editModal.isOpen && editModal.entry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditModal({ isOpen: false, entry: null })}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
              Edit Carbon Entry
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="text-xs text-slate-500 uppercase font-bold">
                  {editModal.entry.category} / {editModal.entry.subcategory}
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {editModal.entry.unit}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModal({ isOpen: false, entry: null })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditEntry}
                  disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  <span>{editLoading ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
