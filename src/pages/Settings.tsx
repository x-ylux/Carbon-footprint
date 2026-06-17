import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { User, Lock, Download, Trash2, Save, Loader as Loader2, CircleAlert as AlertCircle, Shield, FileText, Eye, EyeOff } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, profile, fetchProfile } = useAuth();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const isPasswordReset = searchParams.get('reset') === 'true';

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'data'>(
    isPasswordReset ? 'security' : 'profile'
  );

  const [profileLoading, setProfileLoading] = useState(false);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [countryDraft, setCountryDraft] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const name = nameDraft ?? profile?.name ?? '';
  const country = countryDraft ?? profile?.country ?? 'India';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name, country })
        .eq('id', user.id);

      if (updateError) throw updateError;
      await fetchProfile(user.id);
      setNameDraft(null);
      setCountryDraft(null);
      success('Profile updated', 'Your profile has been saved successfully.');
    } catch (err) {
      error('Failed to update profile', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      error('Passwords do not match', 'Please ensure your new passwords match.');
      return;
    }

    if (newPassword.length < 6) {
      error('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        error('Current password is incorrect');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      success('Password updated', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error('Failed to update password', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);

    try {
      const [carbonRes, cashRes, goalsRes, budgetsRes] = await Promise.all([
        supabase.from('carbon_entries').select('*').eq('user_id', user.id),
        supabase.from('cash_transactions').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name,
          country: profile?.country,
          exportedAt: new Date().toISOString(),
        },
        carbon_entries: carbonRes.data || [],
        cash_transactions: cashRes.data || [],
        goals: goalsRes.data || [],
        budgets: budgetsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrace-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      success('Data exported', 'Your data has been downloaded as a JSON file.');
    } catch (err) {
      error('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    setExportLoading(true);

    try {
      const { data: entries } = await supabase
        .from('carbon_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!entries || entries.length === 0) {
        error('No data to export', 'You have no carbon entries to export.');
        return;
      }

      const headers = ['Date', 'Category', 'Subcategory', 'Value', 'Unit', 'CO2 Emission (kg)'];
      const rows = entries.map((e) => [
        new Date(e.created_at).toLocaleDateString(),
        e.category,
        e.subcategory,
        e.value,
        e.unit,
        e.co2_emission,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrace-carbon-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      success('CSV exported', 'Your carbon entries have been downloaded as a CSV file.');
    } catch (err) {
      error('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const token = data.session?.access_token;
        if (!token) {
          throw new Error('Please sign in again before deleting your account.');
        }

        const response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(result?.error || 'Account deletion failed.');
        }
      } else {
        localStorage.removeItem('mock_session');
        localStorage.removeItem('mock_users');
        localStorage.removeItem('mock_carbon_entries');
        localStorage.removeItem('mock_cash_transactions');
        localStorage.removeItem('mock_goals');
        localStorage.removeItem('mock_budgets');
      }

      await supabase.auth.signOut();
      success('Account deleted', 'Your account and all data have been permanently deleted.');
      window.location.href = '/';
    } catch (err) {
      error('Failed to delete account', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'data' as const, label: 'Data', icon: FileText },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Manage your account, security, and data preferences.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`settings-${tab.id}-panel`}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-forest-500 text-forest-700 dark:text-forest-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TabIcon className="w-4 h-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div id="settings-profile-panel" role="tabpanel" className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-forest-100 dark:bg-forest-900/40 rounded-xl">
              <User className="w-5 h-5 text-forest-600 dark:text-forest-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Profile Information</h2>
              <p className="text-sm text-slate-500">Update your personal details.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="settings-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <input
                id="settings-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">Email cannot be changed.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-country" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Country
              </label>
              <select
                id="settings-country"
                value={country}
                onChange={(e) => setCountryDraft(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Japan">Japan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{profileLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div id="settings-security-panel" role="tabpanel" className="space-y-6">
          {isPasswordReset && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                You can now set a new password below.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-950/30 rounded-xl">
                <Lock className="w-5 h-5 text-sky-dark dark:text-sky-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">Change Password</h2>
                <p className="text-sm text-slate-500">Update your account password.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="settings-current-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="settings-current-password"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  New Password
                </label>
                <input
                  id="settings-new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Confirm New Password
                </label>
                <input
                  id="settings-confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-primary hover:bg-sky-dark text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Shield className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div id="settings-data-panel" role="tabpanel" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl">
                <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">Export Your Data</h2>
                <p className="text-sm text-slate-500">Download a copy of all your data.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="w-4 h-4" aria-hidden="true" />
                )}
                <span>Export as CSV</span>
              </button>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-4 h-4" aria-hidden="true" />
                )}
                <span>Export as JSON</span>
              </button>
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/30 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-rose-800 dark:text-rose-300">Danger Zone</h2>
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  Permanently delete your account and all data.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Delete My Account</span>
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-rose-100/50 dark:bg-rose-950/30 rounded-xl">
                <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm font-medium">
                    This action cannot be undone. All your carbon entries, transactions, goals, and
                    personal data will be permanently deleted.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
