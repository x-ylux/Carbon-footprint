import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Loader as Loader2, CircleAlert as AlertCircle, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings?reset=true`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send reset email');
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-forest-50/20 dark:bg-forest-950/10 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-forest-300/10 dark:bg-forest-900/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-sky-primary/10 dark:bg-sky-dark/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-xl p-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="p-3 bg-forest-500 text-white rounded-2xl shadow-md shadow-forest-500/25">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white">
            Reset Your Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Check your email for a password reset link.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm font-semibold text-forest-600 dark:text-forest-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-start space-x-2.5 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-forest-500/20 focus:border-forest-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 flex items-center justify-center space-x-2 rounded-xl text-sm font-bold text-white bg-forest-600 hover:bg-forest-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all duration-200 cursor-pointer shadow-md shadow-forest-600/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/40 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-sm font-semibold text-forest-600 dark:text-forest-400 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
