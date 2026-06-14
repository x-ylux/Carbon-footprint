import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Leaf, 
  Zap, 
  Car, 
  ShoppingBag, 
  Apple, 
  ArrowRight,
  Globe,
  Award,
  Sparkles
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-forest-50/30 dark:bg-forest-950/10">
      
      {/* Decorative Blob Elements */}
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-forest-300/10 dark:bg-forest-900/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 right-10 w-96 h-96 rounded-full bg-sky-primary/10 dark:bg-sky-dark/5 blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-forest-100/60 dark:bg-forest-900/40 text-forest-700 dark:text-forest-400 text-xs font-semibold border border-forest-200/50 dark:border-forest-800/40 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-forest-500 animate-spin duration-[6s]" />
              <span>Real-Time Carbon Tracking & Analytics</span>
            </div>
            
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-slate-900 dark:text-white">
              Understand and{' '}
              <span className="bg-gradient-to-r from-forest-600 to-forest-400 dark:from-forest-400 dark:to-forest-500 bg-clip-text text-transparent">
                Reduce
              </span>{' '}
              Your Environmental Impact
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-medium">
              Calculate your annual carbon footprint across transport, home energy, diet, and shopping. Set goals, analyze trends, and take actionable steps to live a greener, more sustainable life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-forest-600 hover:bg-forest-700 shadow-lg shadow-forest-600/35 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/calculator"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-sky-primary hover:bg-sky-dark shadow-lg shadow-sky-primary/30 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                  >
                    <span>Open Calculator</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-forest-600 hover:bg-forest-700 shadow-lg shadow-forest-600/35 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>

            {/* India stats summary */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/50 dark:border-slate-800/40 text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-xl font-extrabold text-forest-700 dark:text-forest-400">1.6 T</div>
                <div className="text-xs text-slate-500 font-medium">India Average / yr</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-800 dark:text-slate-200">4.7 T</div>
                <div className="text-xs text-slate-500 font-medium">Global Average / yr</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">2.0 T</div>
                <div className="text-xs text-slate-500 font-medium">Climate Safe Target</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column (Visual Showcase) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] flex items-center justify-center animate-float">
              
              {/* Spinning Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-forest-300/30 dark:border-forest-700/30 animate-spin duration-[40s]"></div>
              
              {/* Outer floating cards */}
              <div className="absolute top-8 left-0 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center space-x-3 w-48 transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500">Transport CO2</h4>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">-12% last month</p>
                </div>
              </div>

              <div className="absolute bottom-16 right-0 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center space-x-3 w-48 transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500">Electricity</h4>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">Clean Energy Plan</p>
                </div>
              </div>

              {/* Central Premium Graphic */}
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-forest-600 to-forest-400 dark:from-forest-800 dark:to-forest-600 flex flex-col items-center justify-center p-6 text-white text-center shadow-2xl shadow-forest-500/20 relative">
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-sky-primary flex items-center justify-center shadow-md animate-bounce">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <Globe className="w-14 h-14 mb-3 text-forest-100/80" />
                <span className="text-xs font-bold uppercase tracking-wider text-forest-200">Total Score</span>
                <span className="text-3xl sm:text-4xl font-black leading-none my-1">1,420</span>
                <span className="text-xs font-semibold text-forest-100">kg CO₂e / Year</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Split Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Track Emissions Across Four Pillars
          </h2>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            EcoTrace organizes your habits into actionable categories, enabling you to identify emissions hotspots and optimize your choices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Transportation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">Transportation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Track vehicle mileage, public transit days, bike commutes, and air travel. Optimize routes to minimize transit impacts.
            </p>
          </div>

          {/* Card 2: Home Energy */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">Home Energy</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Log electricity consumption, gas cylinders, and domestic water usage to track household carbon costs.
            </p>
          </div>

          {/* Card 3: Food & Diet */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
              <Apple className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">Diet & Meals</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Monitor meat consumption, organic choices, and food waste percentages. Switch to vegetarian meals to cut diet impact.
            </p>
          </div>

          {/* Card 4: Shopping & Waste */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="p-3 bg-sky-light dark:bg-sky-dark/20 text-sky-dark dark:text-sky-primary rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">Shopping habits</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Assess impacts from e-commerce shipments, clothing purchases, electronic devices, and consumer waste habits.
            </p>
          </div>
        </div>
      </div>

      {/* Sustainable Goals / India Average Callout */}
      <div className="bg-forest-600 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-forest-500/20 blur-2xl pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <Award className="w-12 h-12 mx-auto text-forest-200 animate-bounce" />
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl">
            Did you know? India's Carbon average is 1.6 tonnes.
          </h2>
          <p className="text-lg text-forest-100 max-w-3xl mx-auto font-medium">
            While India sits below the global average of 4.7 tonnes, the United Nations Climate Action plans suggest we must all limit emissions to under 2.0 tonnes (2,000 kg) per year to avoid catastrophic warming.
          </p>
          <div className="pt-4">
            <Link
              to={user ? "/calculator" : "/signup"}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white text-forest-700 hover:bg-forest-100 font-bold transition-all duration-200 shadow-md shadow-forest-800/10 cursor-pointer"
            >
              <span>Compare My Footprint Now</span>
              <ArrowRight className="w-4 h-4 text-forest-700" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-xs font-semibold">
          <p>© {new Date().getFullYear()} EcoTrace Inc. Built with React + TypeScript + Tailwind + Supabase.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
