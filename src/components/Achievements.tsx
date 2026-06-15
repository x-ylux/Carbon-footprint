import React from 'react';
import { Award, Leaf, Target, TrendingDown, Users, Zap, CircleCheck as CheckCircle2 } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (stats: AchievementStats) => boolean;
  progress: (stats: AchievementStats) => number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface AchievementStats {
  totalEntries: number;
  totalCO2Saved: number;
  daysActive: number;
  belowIndiaAverage: boolean;
  goalSet: boolean;
  budgetSet: boolean;
  joinedEvent: boolean;
  joinedChallenge: boolean;
  streakDays: number;
}

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

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_entry',
    title: 'First Steps',
    description: 'Log your first carbon footprint calculation',
    icon: <Leaf className="w-6 h-6" />,
    condition: (stats) => stats.totalEntries >= 1,
    progress: (stats) => Math.min(stats.totalEntries, 1),
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'ten_entries',
    title: 'Data Enthusiast',
    description: 'Log 10 carbon footprint entries',
    icon: <Zap className="w-6 h-6" />,
    condition: (stats) => stats.totalEntries >= 10,
    progress: (stats) => Math.min(stats.totalEntries, 10),
    maxProgress: 10,
    tier: 'silver',
  },
  {
    id: 'below_india',
    title: 'Eco Warrior',
    description: 'Get your footprint below India average (1,600 kg/year)',
    icon: <TrendingDown className="w-6 h-6" />,
    condition: (stats) => stats.belowIndiaAverage,
    progress: (stats) => stats.belowIndiaAverage ? 1 : 0,
    maxProgress: 1,
    tier: 'gold',
  },
  {
    id: 'goal_setter',
    title: 'Goal Setter',
    description: 'Set your annual carbon reduction goal',
    icon: <Target className="w-6 h-6" />,
    condition: (stats) => stats.goalSet,
    progress: (stats) => stats.goalSet ? 1 : 0,
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'budget_planner',
    title: 'Budget Planner',
    description: 'Set your monthly carbon budget',
    icon: <Zap className="w-6 h-6" />,
    condition: (stats) => stats.budgetSet,
    progress: (stats) => stats.budgetSet ? 1 : 0,
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'community_member',
    title: 'Community Member',
    description: 'Join a community event or challenge',
    icon: <Users className="w-6 h-6" />,
    condition: (stats) => stats.joinedEvent || stats.joinedChallenge,
    progress: (stats) => (stats.joinedEvent || stats.joinedChallenge) ? 1 : 0,
    maxProgress: 1,
    tier: 'silver',
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Log entries for 7 consecutive days',
    icon: <Award className="w-6 h-6" />,
    condition: (stats) => stats.streakDays >= 7,
    progress: (stats) => Math.min(stats.streakDays, 7),
    maxProgress: 7,
    tier: 'silver',
  },
  {
    id: 'month_streak',
    title: 'Monthly Champion',
    description: 'Log entries for 30 consecutive days',
    icon: <Award className="w-6 h-6" />,
    condition: (stats) => stats.streakDays >= 30,
    progress: (stats) => Math.min(stats.streakDays, 30),
    maxProgress: 30,
    tier: 'gold',
  },
  {
    id: 'ton_saver',
    title: 'Tonne Saver',
    description: 'Reduce your footprint by 1,000 kg from baseline',
    icon: <Leaf className="w-6 h-6" />,
    condition: (stats) => stats.totalCO2Saved >= 1000,
    progress: (stats) => Math.min(Math.round(stats.totalCO2Saved), 1000),
    maxProgress: 1000,
    tier: 'platinum',
  },
];

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
          <CheckCircle2 className="w-4 h-4 text-white" />
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
          <Award className="w-5 h-5 text-amber-500" />
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
