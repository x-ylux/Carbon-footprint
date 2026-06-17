import React from 'react';
import { Award, CircleCheck as CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS, type Achievement, type AchievementStats } from './achievements-data';

const tierColors = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-400',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-950/30',
    border: 'border-yellow-400 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-500',
  },
  platinum: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/30',
    border: 'border-emerald-400 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500',
  },
};

interface AchievementCardProps {
  achievement: Achievement;
  stats: AchievementStats;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, stats }) => {
  const unlocked = achievement.condition(stats);
  const progress = achievement.progress(stats);
  const progressPercent = Math.round((progress / achievement.maxProgress) * 100);
  const colors = tierColors[achievement.tier];

  return (
    <div
      className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 ${
        unlocked ? 'shadow-md' : 'opacity-60'
      }`}
    >
      {unlocked && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 ${colors.badge} rounded-full flex items-center justify-center`}>
          <CheckCircle2 className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${colors.text}`}>{achievement.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{achievement.description}</p>
          <div className="mt-2 space-y-1">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.badge} transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{progress} / {achievement.maxProgress}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AchievementsWidgetProps {
  stats: AchievementStats;
}

export const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ stats }) => {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.condition(stats)).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Achievements</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {unlockedCount} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.slice(0, 4).map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} stats={stats} />
        ))}
      </div>
    </div>
  );
};

export default AchievementsWidget;
