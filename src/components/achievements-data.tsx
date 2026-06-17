import React from 'react';
import { Award, Leaf, Target, TrendingDown, Users, Zap } from 'lucide-react';

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

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_entry',
    title: 'First Steps',
    description: 'Log your first carbon footprint calculation',
    icon: <Leaf className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.totalEntries >= 1,
    progress: (stats) => Math.min(stats.totalEntries, 1),
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'ten_entries',
    title: 'Data Enthusiast',
    description: 'Log 10 carbon footprint entries',
    icon: <Zap className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.totalEntries >= 10,
    progress: (stats) => Math.min(stats.totalEntries, 10),
    maxProgress: 10,
    tier: 'silver',
  },
  {
    id: 'below_india',
    title: 'Eco Warrior',
    description: 'Get your footprint below India average (1,600 kg/year)',
    icon: <TrendingDown className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.belowIndiaAverage,
    progress: (stats) => stats.belowIndiaAverage ? 1 : 0,
    maxProgress: 1,
    tier: 'gold',
  },
  {
    id: 'goal_setter',
    title: 'Goal Setter',
    description: 'Set your annual carbon reduction goal',
    icon: <Target className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.goalSet,
    progress: (stats) => stats.goalSet ? 1 : 0,
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'budget_planner',
    title: 'Budget Planner',
    description: 'Set your monthly carbon budget',
    icon: <Zap className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.budgetSet,
    progress: (stats) => stats.budgetSet ? 1 : 0,
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'community_member',
    title: 'Community Member',
    description: 'Join a community event or challenge',
    icon: <Users className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.joinedEvent || stats.joinedChallenge,
    progress: (stats) => (stats.joinedEvent || stats.joinedChallenge) ? 1 : 0,
    maxProgress: 1,
    tier: 'silver',
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Log entries for 7 consecutive days',
    icon: <Award className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.streakDays >= 7,
    progress: (stats) => Math.min(stats.streakDays, 7),
    maxProgress: 7,
    tier: 'silver',
  },
  {
    id: 'month_streak',
    title: 'Monthly Champion',
    description: 'Log entries for 30 consecutive days',
    icon: <Award className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.streakDays >= 30,
    progress: (stats) => Math.min(stats.streakDays, 30),
    maxProgress: 30,
    tier: 'gold',
  },
  {
    id: 'ton_saver',
    title: 'Tonne Saver',
    description: 'Reduce your footprint by 1,000 kg from baseline',
    icon: <Leaf className="w-6 h-6" aria-hidden="true" />,
    condition: (stats) => stats.totalCO2Saved >= 1000,
    progress: (stats) => Math.min(Math.round(stats.totalCO2Saved), 1000),
    maxProgress: 1000,
    tier: 'platinum',
  },
];
