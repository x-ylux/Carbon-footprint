import React from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Target,
  BarChart3,
  Users,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Heart,
  Calculator,
  LineChart,
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Multi-Category Calculator',
    desc: 'Track transport, energy, food, shopping, digital habits, and cash spending with science-based formulas.',
    color: 'emerald',
  },
  {
    icon: LineChart,
    title: 'Real-Time Dashboard',
    desc: 'Interactive charts show monthly trends, category breakdowns, and progress toward your carbon goals.',
    color: 'sky',
  },
  {
    icon: Target,
    title: 'Goals & Budgets',
    desc: 'Set annual limits and monthly budgets. Get alerts when you approach your sustainable threshold.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Collective Action',
    desc: 'Join community events, group challenges, and policy advocacy to multiply your impact.',
    color: 'rose',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Your data is protected with Supabase auth and row-level security. Only you see your footprint.',
    color: 'forest',
  },
  {
    icon: Globe,
    title: 'India-Focused Benchmarks',
    desc: 'Compare against India\'s 1.6 tonne average and the 2.0 tonne climate-safe target.',
    color: 'sky',
  },
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-light dark:bg-sky-dark/20 text-sky-dark dark:text-sky-primary',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  forest: 'bg-forest-100 dark:bg-forest-900/40 text-forest-600 dark:text-forest-400',
};

export const About: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-forest-300/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-sky-primary/10 blur-3xl pointer-events-none" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-forest-100/60 dark:bg-forest-900/40 text-forest-700 dark:text-forest-400 text-sm font-semibold border border-forest-200/50 dark:border-forest-800/40">
            <Heart className="w-4 h-4" />
            <span>Our Mission</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
            Empowering Indians to{' '}
            <span className="bg-gradient-to-r from-forest-600 to-sky-primary bg-clip-text text-transparent">
              Live Sustainably
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            EcoTrace helps you understand, measure, and reduce your carbon footprint. We believe
            individual action combined with community effort can drive India toward a cleaner,
            greener future — without sacrificing quality of life.
          </p>
        </div>
      </section>

      {/* Mission cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-forest-100 dark:bg-forest-900/40 rounded-xl w-fit mb-4">
              <Leaf className="w-6 h-6 text-forest-600 dark:text-forest-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Measure</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Use our comprehensive calculator to quantify emissions across every aspect of daily life.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-sky-light dark:bg-sky-dark/20 rounded-xl w-fit mb-4">
              <BarChart3 className="w-6 h-6 text-sky-dark dark:text-sky-primary" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Analyze</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Visual dashboards reveal hotspots and trends so you know exactly where to focus efforts.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Act</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set goals, join challenges, and follow personalized tips to cut emissions meaningfully.
            </p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-slate-50/50 dark:bg-slate-900/30 py-16 border-y border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
              Platform Features
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              Everything you need to track and reduce your environmental impact, built with React,
              TypeScript, Tailwind CSS, and Supabase.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 hover:border-forest-300 dark:hover:border-forest-700 transition-all duration-300 group"
                >
                  <div
                    className={`p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 ${colorMap[f.color]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Ready to start your journey?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Join thousands of Indians taking action against climate change.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-forest-600 hover:bg-forest-700 shadow-lg shadow-forest-600/30 hover:scale-[1.03] transition-all duration-300"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/collective"
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-forest-700 dark:text-forest-400 border border-forest-300 dark:border-forest-700 hover:bg-forest-50 dark:hover:bg-forest-950/30 transition-all duration-300"
          >
            <Users className="w-5 h-5" />
            <span>Explore Collective Action</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
