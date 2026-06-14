import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  Leaf, 
  LayoutDashboard, 
  Calculator, 
  Home, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Database,
  User as UserIcon,
  Users,
  Info
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300 font-semibold' 
      : 'text-slate-600 hover:text-forest-600 dark:text-slate-300 dark:hover:text-forest-400 hover:bg-slate-100 dark:hover:bg-slate-800/55'}
  `;

  const mobileLinkClass = (path: string) => `
    flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200
    ${isActive(path) 
      ? 'bg-forest-100 text-forest-700 dark:bg-forest-950/60 dark:text-forest-300' 
      : 'text-slate-600 hover:text-forest-600 dark:text-slate-300 dark:hover:text-forest-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'}
  `;

  return (
    <nav className="sticky top-0 z-50 w-full glass shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-forest-500 text-white p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md shadow-forest-500/20">
              <Leaf className="w-5 h-5 animate-pulse-slow" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-forest-700 to-forest-500 dark:from-forest-300 dark:to-forest-500 bg-clip-text text-transparent">
              EcoTrace
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={linkClass('/')}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link to="/about" className={linkClass('/about')}>
              <Info className="w-4 h-4" />
              <span>About</span>
            </Link>
            <Link to="/collective" className={linkClass('/collective')}>
              <Users className="w-4 h-4" />
              <span>Collective</span>
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/calculator" className={linkClass('/calculator')}>
                  <Calculator className="w-4 h-4" />
                  <span>Calculator</span>
                </Link>
              </>
            )}
          </div>

          {/* Action buttons & Toggle Theme */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Database indicator */}
            <div className="flex items-center">
              {isSupabaseConfigured ? (
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Supabase</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  <span>Local Mock</span>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              title="Toggle color theme"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                  <UserIcon className="w-4 h-4 text-forest-500" />
                  <span className="text-sm font-semibold max-w-[120px] truncate">
                    {profile?.name || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 shadow-md shadow-forest-600/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu and theme toggle buttons */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Theme Toggle (Mobile) */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-slate-200/50 dark:border-slate-800/50 px-4 pt-2 pb-6 space-y-3 shadow-inner">
          <div className="space-y-1">
            <Link 
              to="/" 
              className={mobileLinkClass('/')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link 
              to="/about" 
              className={mobileLinkClass('/about')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Info className="w-5 h-5" />
              <span>About</span>
            </Link>
            <Link 
              to="/collective" 
              className={mobileLinkClass('/collective')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="w-5 h-5" />
              <span>Collective Action</span>
            </Link>

            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={mobileLinkClass('/dashboard')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/calculator" 
                  className={mobileLinkClass('/calculator')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calculator className="w-5 h-5" />
                  <span>Calculator</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Auth actions */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Backend</span>
              {isSupabaseConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Supabase Live
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Local Mock
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-4 py-2 bg-slate-100/60 dark:bg-slate-900/30 rounded-xl">
                  <UserIcon className="w-5 h-5 text-forest-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {profile?.name || 'User'}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-base font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 transition-colors shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
