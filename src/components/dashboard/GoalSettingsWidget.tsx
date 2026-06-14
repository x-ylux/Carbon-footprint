import React from 'react';
import { Target, Loader as Loader2 } from 'lucide-react';

interface GoalSettingsWidgetProps {
  goalInput: string;
  updatingGoal: boolean;
  onGoalInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const GoalSettingsWidget: React.FC<GoalSettingsWidgetProps> = ({
  goalInput,
  updatingGoal,
  onGoalInputChange,
  onSubmit,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-2">
        <Target className="w-5 h-5 text-forest-500" aria-hidden="true" />
        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
          Set Annual Carbon Limit
        </h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="dashboard-goal-input" className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Limit Target (kg CO2e/yr)
          </label>
          <div className="relative">
            <input
              id="dashboard-goal-input"
              type="number"
              aria-label="Annual carbon limit target"
              placeholder="Enter annual carbon limit"
              value={goalInput}
              onChange={(e) => onGoalInputChange(e.target.value)}
              className="w-full pl-4 pr-16 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-bold"
            />
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400">
              kg/yr
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="dashboard-goal-slider" className="sr-only">
            Adjust annual carbon limit with slider
          </label>
          <input
            id="dashboard-goal-slider"
            type="range"
            min="500"
            max="10000"
            step="100"
            title="Adjust annual carbon limit"
            aria-label="Adjust annual carbon limit"
            value={goalInput}
            onChange={(e) => onGoalInputChange(e.target.value)}
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
          className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatingGoal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Limit</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default GoalSettingsWidget;
