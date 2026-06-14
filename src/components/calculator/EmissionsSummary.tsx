import React from 'react';
import { Info } from 'lucide-react';

interface EmissionsSummaryProps {
  total: number;
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  digital: number;
  cash: number;
}

const INDIA_AVERAGE_KG = 1600;

const getStatusInfo = (total: number) => {
  if (total < INDIA_AVERAGE_KG) {
    return {
      label: 'Low (Eco-Friendly)',
      desc: 'Awesome! Your footprint is lower than the average Indian citizen (1,600 kg). Keep it up!',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
      badge: 'bg-emerald-500 text-white',
      ringColor: 'border-emerald-500',
    };
  }
  if (total <= 3000) {
    return {
      label: 'Moderate',
      desc: 'Your footprint is around the average. Try adopting a vegetarian diet or taking transit to reach the sustainable limit (< 2,000 kg).',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
      badge: 'bg-amber-500 text-white',
      ringColor: 'border-amber-500',
    };
  }
  return {
    label: 'High Carbon Cost',
    desc: 'Warning: Your footprint is high. Setting clean energy plans and carpooling are great ways to reduce emissions.',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50',
    badge: 'bg-rose-500 text-white',
    ringColor: 'border-rose-500',
  };
};

export const EmissionsSummary: React.FC<EmissionsSummaryProps> = ({
  total,
  transport,
  energy,
  food,
  shopping,
  digital,
  cash,
}) => {
  const status = getStatusInfo(total);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm p-6 space-y-6 transition-all duration-300">
      <h3 className="font-display font-extrabold text-xl text-slate-800 dark:text-white">
        Emissions Summary
      </h3>

      {/* Total Indicator Ring */}
      <div className="flex flex-col items-center py-4 border-b border-slate-100 dark:border-slate-800">
        <div
          className="w-40 h-40 rounded-full border-8 border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center relative shadow-inner"
          role="img"
          aria-label={`Total emissions: ${total} kg CO2e per year`}
        >
          <div
            className={`absolute inset-0 rounded-full border-8 transition-all duration-500 ${status.ringColor}`}
            aria-hidden="true"
          />
          <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
            {total.toLocaleString()}
          </span>
          <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            kg CO2e / year
          </span>
        </div>
      </div>

      {/* Category breakdown details */}
      <ul className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300" aria-label="Emissions by category">
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-slate-500">Transportation</span>
          </div>
          <span>{transport.toLocaleString()} kg/yr</span>
        </li>
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-slate-500">Home Energy</span>
          </div>
          <span>{energy.toLocaleString()} kg/yr</span>
        </li>
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" aria-hidden="true" />
            <span className="text-slate-500">Diet & Food</span>
          </div>
          <span>{food.toLocaleString()} kg/yr</span>
        </li>
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-sky-primary" aria-hidden="true" />
            <span className="text-slate-500">Shopping & Waste</span>
          </div>
          <span>{shopping.toLocaleString()} kg/yr</span>
        </li>
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-violet-500" aria-hidden="true" />
            <span className="text-slate-500">Digital</span>
          </div>
          <span>{digital.toLocaleString()} kg/yr</span>
        </li>
        <li className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" aria-hidden="true" />
            <span className="text-slate-500">Cash Spending</span>
          </div>
          <span>{cash.toLocaleString()} kg/yr</span>
        </li>
      </ul>

      {/* India Average Comparison */}
      <div className={`p-4 rounded-xl border ${status.color} transition-colors duration-300 space-y-2`}>
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4" aria-hidden="true" />
          <span className="font-extrabold text-sm uppercase tracking-wider">
            India Average Comparison
          </span>
        </div>
        <p className="text-xs leading-relaxed font-medium">{status.desc}</p>
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="font-bold">Your Status:</span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-3xs uppercase ${status.badge}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmissionsSummary;
