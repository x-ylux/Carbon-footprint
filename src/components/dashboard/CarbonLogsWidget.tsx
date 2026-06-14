import React from 'react';
import { Trash2 } from 'lucide-react';

interface CarbonEntry {
  id: string;
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  co2_emission: number;
  created_at: string;
}

interface CarbonLogsWidgetProps {
  entries: CarbonEntry[];
  onDelete: (id: string) => void;
}

export const CarbonLogsWidget: React.FC<CarbonLogsWidgetProps> = ({ entries, onDelete }) => {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
        Recent Calculations
      </h3>

      <ul className="max-h-64 overflow-y-auto space-y-3 pr-1" role="list" aria-label="Recent carbon calculations">
        {entries.slice(-5).reverse().map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800/50 transition-all duration-200 group hover:border-slate-200 dark:hover:border-slate-750"
          >
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">
                  {entry.subcategory}
                </span>
                <span className="text-3xs font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full capitalize">
                  {entry.category}
                </span>
              </div>
              <div className="text-3xs text-slate-400 font-semibold mt-0.5">
                {new Date(entry.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-right">
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-white">
                  {Math.round(entry.co2_emission).toLocaleString()}
                </div>
                <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                  kg CO2/yr
                </div>
              </div>

              <button
                type="button"
                aria-label={`Delete ${entry.subcategory} log entry`}
                onClick={() => onDelete(entry.id)}
                className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition duration-150 cursor-pointer md:opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CarbonLogsWidget;
