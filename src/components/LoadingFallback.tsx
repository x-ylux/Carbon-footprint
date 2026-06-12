import React from 'react';

export const LoadingFallback: React.FC = () => (
  <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-forest-50/30 dark:bg-slate-950/10 transition-colors duration-300">
    <div className="flex flex-col items-center space-y-3 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-forest-300 dark:border-forest-700 border-t-forest-600 animate-spin" />
      <div>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Loading...</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Preparing your secure dashboard.</p>
      </div>
    </div>
  </div>
);
