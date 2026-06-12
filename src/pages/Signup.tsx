import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// Validation Schema
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupFormInput = z.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormInput>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error, needsVerification } = await signUp(data.email, data.password, data.name);
      if (error) {
        setErrorMsg(error.message || 'Failed to create an account. Please try again.');
      } else if (needsVerification) {
        setVerificationPending(true);
        setPendingEmail(data.email);
      } else {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-forest-50/20 dark:bg-forest-950/10 px-4 py-12 relative overflow-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-forest-300/10 dark:bg-forest-900/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-sky-primary/10 dark:bg-sky-dark/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-xl p-8 relative z-10 transition-colors duration-300">
        
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="p-3 bg-forest-500 text-white rounded-2xl shadow-md shadow-forest-500/25">
            <Leaf className="w-6 h-6 animate-pulse-slow" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Start tracking, reducing, and offsetting your footprint.
          </p>
        </div>

        {verificationPending && (
          <div className="mb-6 p-5 rounded-xl bg-sky-light dark:bg-sky-dark/20 border border-sky-primary/30 text-sky-dark dark:text-sky-primary space-y-3 animate-fade-in">
            <h3 className="font-bold text-lg">Verify Your Email</h3>
            <p className="text-sm font-medium">
              We sent a verification link to <strong>{pendingEmail}</strong>. Click the link in your
              email to activate your account, then sign in.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-primary text-white font-bold text-sm hover:bg-sky-dark transition"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-start space-x-2.5 text-sm font-semibold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${verificationPending ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.name ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-forest-500/20 focus:border-forest-500 transition-all`}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-xs font-semibold text-rose-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email input */}
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
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.email ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-forest-500/20 focus:border-forest-500 transition-all`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-rose-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.password ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-forest-500/20 focus:border-forest-500 transition-all`}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-rose-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.confirmPassword ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-forest-500/20 focus:border-forest-500 transition-all`}
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-semibold text-rose-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 rounded-xl text-sm font-bold text-white bg-forest-600 hover:bg-forest-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all duration-200 cursor-pointer shadow-md shadow-forest-600/10 hover:scale-[1.01] active:scale-[0.99] pt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/40 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-forest-600 dark:text-forest-400 hover:underline font-bold"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Signup;
