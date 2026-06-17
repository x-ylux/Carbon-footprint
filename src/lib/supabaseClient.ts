import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Read from env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we should use the actual Supabase or fallback mock
const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidHttpUrl(supabaseUrl) &&
  supabaseAnonKey.length > 20;

if (!isSupabaseConfigured) {
  console.warn('Supabase env vars not found. Using local Storage Mock Backend.');
}

// Create the standard Supabase client (only if configured)
let realSupabase: SupabaseClient<Database, 'public', 'public'> | null = null;
if (isSupabaseConfigured) {
  try {
    realSupabase = createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
  }
}

// ==========================================
// MOCK CLIENT IMPLEMENTATION
// ==========================================

// Helpers for localStorage persistence
const getLocal = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) as T : defaultValue;
};

const setLocal = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Seed mock data if empty
interface CarbonEntry {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  co2_emission: number;
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  annual_limit: number;
  created_at: string;
}

interface Budget {
  id: string;
  user_id: string;
  monthly_limit: number;
  month_year: string;
  spent: number;
  created_at: string;
}

interface CashTransaction {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  transaction_date: string;
  receipt_url?: string | null;
  co2_emission: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

type MockSession = { user: User; access_token: string } | null;

type MockError = { message: string } | null;

type MockResult<T> = { data: T; error: MockError };

type MockCallback<T> = (result: MockResult<T>) => void;

type UnknownArray = unknown[];

type CashTransactionInsert = {
  category: string;
  amount: number;
  transaction_date: string;
  receipt_url?: string | null;
  co2_emission: number;
};

type CarbonEntryInsert = {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  co2_emission: number;
  created_at?: string;
};

type GoalUpsert = {
  annual_limit: number;
};

type BudgetUpsert = {
  monthly_limit: number;
  month_year: string;
  spent?: number;
};

// Initial carbon entries seed for mockup
const seedEntries = (userId: string): CarbonEntry[] => {
  const now = new Date();
  const getPastDateStr = (monthsAgo: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15);
    return d.toISOString();
  };

  return [
    // 3 Months Ago
    { id: '1', user_id: userId, category: 'transportation', subcategory: 'car', value: 800, unit: 'km/month', co2_emission: 800 * 0.12 * 12, created_at: getPastDateStr(3) },
    { id: '2', user_id: userId, category: 'energy', subcategory: 'electricity', value: 250, unit: 'units/month', co2_emission: 250 * 0.8 * 12, created_at: getPastDateStr(3) },
    { id: '3', user_id: userId, category: 'food', subcategory: 'diet', value: 3, unit: 'meals/day', co2_emission: 3 * 0.85 * 365, created_at: getPastDateStr(3) },
    { id: '4', user_id: userId, category: 'shopping', subcategory: 'online', value: 6, unit: 'orders/month', co2_emission: 6 * 5.0 * 12, created_at: getPastDateStr(3) },
    
    // 2 Months Ago
    { id: '5', user_id: userId, category: 'transportation', subcategory: 'car', value: 750, unit: 'km/month', co2_emission: 750 * 0.12 * 12, created_at: getPastDateStr(2) },
    { id: '6', user_id: userId, category: 'energy', subcategory: 'electricity', value: 220, unit: 'units/month', co2_emission: 220 * 0.8 * 12, created_at: getPastDateStr(2) },
    { id: '7', user_id: userId, category: 'food', subcategory: 'diet', value: 3, unit: 'meals/day', co2_emission: 3 * 0.85 * 365, created_at: getPastDateStr(2) },
    { id: '8', user_id: userId, category: 'shopping', subcategory: 'online', value: 4, unit: 'orders/month', co2_emission: 4 * 5.0 * 12, created_at: getPastDateStr(2) },
    
    // 1 Month Ago
    { id: '9', user_id: userId, category: 'transportation', subcategory: 'car', value: 600, unit: 'km/month', co2_emission: 600 * 0.12 * 12, created_at: getPastDateStr(1) },
    { id: '10', user_id: userId, category: 'energy', subcategory: 'electricity', value: 180, unit: 'units/month', co2_emission: 180 * 0.8 * 12, created_at: getPastDateStr(1) },
    { id: '11', user_id: userId, category: 'food', subcategory: 'diet', value: 3, unit: 'meals/day', co2_emission: 3 * 0.5 * 365, created_at: getPastDateStr(1) }, // vegetarian change!
    { id: '12', user_id: userId, category: 'shopping', subcategory: 'online', value: 2, unit: 'orders/month', co2_emission: 2 * 5.0 * 12, created_at: getPastDateStr(1) },
  ];
};

// Subscribers map for simulating real-time subscriptions
const dbSubscribers: Set<() => void> = new Set();
const notifySubscribers = () => {
  dbSubscribers.forEach(callback => callback());
};

export const mockSupabase = {
  auth: {
    signUp: async ({ email, options }: { email: string; options?: { data?: { name?: string } } }) => {
      const users: User[] = getLocal('mock_users', []);
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: { user: null }, error: { message: 'User already exists.' } };
      }
      
      const newUser: User = {
        id: crypto.randomUUID(),
        email: email,
        name: options?.data?.name || email.split('@')[0],
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      setLocal('mock_users', users);
      
      // Auto seed some entries for rich dashboard visuals
      const entries = seedEntries(newUser.id);
      const allEntries = getLocal('mock_carbon_entries', []);
      setLocal('mock_carbon_entries', [...allEntries, ...entries]);

      // Seed initial goal
      const allGoals = getLocal('mock_goals', []);
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        user_id: newUser.id,
        annual_limit: 3000, // default limit 3000 kg CO2/year
        created_at: new Date().toISOString()
      };
      setLocal('mock_goals', [...allGoals, newGoal]);

      const session = { user: newUser, access_token: 'mock-token' };
      setLocal('mock_session', session);
      notifySubscribers();
      
      return { data: { user: newUser, session }, error: null };
    },

    signInWithPassword: async ({ email }: { email: string }) => {
      const users: User[] = getLocal('mock_users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Invalid credentials.' } };
      }

      const session = { user, access_token: 'mock-token' };
      setLocal('mock_session', session);
      notifySubscribers();
      
      return { data: { user, session }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('mock_session');
      notifySubscribers();
      return { error: null };
    },

    getSession: async () => {
      const session = getLocal('mock_session', null);
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: MockSession) => void) => {
      const handler = () => {
        const session = getLocal('mock_session', null);
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      };
      dbSubscribers.add(handler);
      
      // Initial call
      const session = getLocal('mock_session', null);
      callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              dbSubscribers.delete(handler);
            }
          }
        }
      };
    }
  },

  from: (table: string) => {
    const MOCK_EVENTS = [
      { id: '1', title: 'Tree Plantation Drive', description: 'Plant 100 native trees in urban parks across Delhi NCR.', event_date: '2026-07-15', location: 'Delhi, India', participants_count: 245, co2_impact_kg: 5000 },
      { id: '2', title: 'Zero-Waste Workshop', description: 'Learn practical tips to reduce household waste.', event_date: '2026-08-02', location: 'Mumbai, India', participants_count: 120, co2_impact_kg: 800 },
      { id: '3', title: 'Cycling Sunday', description: 'Community bike ride promoting low-carbon commuting.', event_date: '2026-06-22', location: 'Bangalore, India', participants_count: 89, co2_impact_kg: 1200 },
    ];
    const MOCK_CHALLENGES = [
      { id: '1', title: '30-Day Meat-Free Challenge', description: 'Go vegetarian for 30 days.', target_kg: 50000, current_kg: 32400, participants_count: 412, end_date: '2026-07-31' },
      { id: '2', title: 'No Plastic July', description: 'Eliminate single-use plastics.', target_kg: 30000, current_kg: 18500, participants_count: 278, end_date: '2026-07-31' },
      { id: '3', title: 'Bike to Work Week', description: 'Swap car commutes for cycling.', target_kg: 15000, current_kg: 9800, participants_count: 156, end_date: '2026-06-20' },
    ];

    return {
      select: () => {
        if (table === 'collective_events') {
          return {
              order: () => ({
                then: (cb: MockCallback<typeof MOCK_EVENTS>) => cb({ data: MOCK_EVENTS, error: null }),
              }),
            };
          }
          if (table === 'group_challenges') {
            return {
              order: () => ({
                then: (cb: MockCallback<typeof MOCK_CHALLENGES>) => cb({ data: MOCK_CHALLENGES, error: null }),
              }),
            };
          }

          return {
            eq: (field: string, val: unknown) => {
            const eqBuilder = {
              eq: (_field2: string, val2: unknown) => ({
                single: async () => {
                  const session = getLocal('mock_session', null);
                  if (!session) return { data: null, error: { message: 'Unauthorized' } };
                  if (table === 'budgets') {
                    const budgets: Budget[] = getLocal('mock_budgets', []);
                    const budget = budgets.find(
                      (b) => b.user_id === val && b.month_year === val2
                    );
                    return { data: budget || null, error: null };
                  }
                  return { data: null, error: { message: 'Not implemented' } };
                },
              }),
              order: (_orderField: string, { ascending }: { ascending?: boolean } = {}) => ({
                then: (callback: MockCallback<UnknownArray>) => {
                  const session = getLocal('mock_session', null);
                  if (!session) return callback({ data: [], error: { message: 'Unauthorized' } });
                  if (table === 'cash_transactions') {
                    let txs: CashTransaction[] = getLocal('mock_cash_transactions', []);
                    txs = txs.filter((t) => t.user_id === val);
                    txs.sort((a, b) => {
                      const ta = new Date(a.transaction_date).getTime();
                      const tb = new Date(b.transaction_date).getTime();
                      return ascending ? ta - tb : tb - ta;
                    });
                    return callback({ data: txs, error: null });
                  }
                  return callback({ data: [], error: null });
                },
              }),
              then: (callback: MockCallback<UnknownArray>) => {
                const session = getLocal('mock_session', null);
                if (!session) return callback({ data: [], error: { message: 'Unauthorized' } });
                if (table === 'cash_transactions' && field === 'user_id') {
                  const txs: CashTransaction[] = getLocal('mock_cash_transactions', []);
                  return callback({ data: txs.filter((t) => t.user_id === val), error: null });
                }
                return callback({ data: [], error: null });
              },
            };

            return {
              ...eqBuilder,
              single: async () => {
                const session = getLocal<MockSession>('mock_session', null);
                if (!session) return { data: null, error: { message: 'Unauthorized' } };

                if (table === 'users') {
                  const users: User[] = getLocal('mock_users', []);
                  const user = users.find(u => u.id === val);
                  return { data: user || null, error: user ? null : { message: 'Not found' } };
                }

                if (table === 'goals') {
                  const goals: Goal[] = getLocal('mock_goals', []);
                  const goal = goals.find(g => g.user_id === val);
                  return { data: goal || null, error: null }; // return no error if no goal is set, just return null data
                }

                return { data: null, error: { message: 'Not implemented' } };
              },
              order: (_orderField: string, { ascending }: { ascending?: boolean } = {}) => {
                return {
                  then: (callback: MockCallback<UnknownArray>) => {
                    const session = getLocal<MockSession>('mock_session', null);
                    if (!session) return callback({ data: [], error: { message: 'Unauthorized' } });

                    if (table === 'carbon_entries') {
                      let entries: CarbonEntry[] = getLocal('mock_carbon_entries', []);
                      entries = entries.filter(e => e.user_id === val);

                      entries.sort((a, b) => {
                        const timeA = new Date(a.created_at).getTime();
                        const timeB = new Date(b.created_at).getTime();
                        return ascending ? timeA - timeB : timeB - timeA;
                      });

                      return callback({ data: entries, error: null });
                    }

                    return callback({ data: [], error: null });
                  }
                };
              }
            };
          },
          single: async () => {
            if (table === 'users') {
              const session = getLocal<MockSession>('mock_session', null);
              if (!session) return { data: null, error: { message: 'Unauthorized' } };
              return { data: session.user, error: null };
            }
            return { data: null, error: { message: 'Not implemented' } };
          }
        };
      },

      insert: async (data: readonly CashTransactionInsert[] | readonly CarbonEntryInsert[]) => {
        const session = getLocal<MockSession>('mock_session', null);
        if (!session) return { data: null, error: { message: 'Unauthorized' } };

        if (table === 'cash_transactions') {
          const txs: CashTransaction[] = getLocal('mock_cash_transactions', []);
          const newTxs: CashTransaction[] = (data as readonly CashTransactionInsert[]).map((item) => ({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            category: item.category,
            amount: item.amount,
            transaction_date: item.transaction_date,
            receipt_url: item.receipt_url ?? null,
            co2_emission: item.co2_emission,
            created_at: new Date().toISOString(),
          }));
          setLocal('mock_cash_transactions', [...txs, ...newTxs]);
          notifySubscribers();
          return { data: newTxs, error: null };
        }

        if (table === 'carbon_entries') {
          const entries: CarbonEntry[] = getLocal('mock_carbon_entries', []);
          const newEntries: CarbonEntry[] = (data as readonly CarbonEntryInsert[]).map((item) => ({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            category: item.category,
            subcategory: item.subcategory,
            value: item.value,
            unit: item.unit,
            co2_emission: item.co2_emission,
            created_at: item.created_at || new Date().toISOString(),
          }));

          const updated = [...entries, ...newEntries];
          setLocal('mock_carbon_entries', updated);
          notifySubscribers();
          return { data: newEntries, error: null };
        }

        return { data: null, error: { message: 'Not implemented' } };
      },

      upsert: async (data: GoalUpsert | BudgetUpsert) => {
        const session = getLocal<MockSession>('mock_session', null);
        if (!session) return { data: null, error: { message: 'Unauthorized' } };

        if (table === 'goals') {
          const goals: Goal[] = getLocal('mock_goals', []);
          const existingIndex = goals.findIndex((g) => g.user_id === session.user.id);
          const goalData = data as GoalUpsert;

          const newGoal: Goal = {
            id: existingIndex >= 0 ? goals[existingIndex].id : crypto.randomUUID(),
            user_id: session.user.id,
            annual_limit: goalData.annual_limit,
            created_at: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            goals[existingIndex] = newGoal;
          } else {
            goals.push(newGoal);
          }

          setLocal('mock_goals', goals);
          notifySubscribers();
          return { data: newGoal, error: null };
        }

        if (table === 'budgets') {
          const budgets: Budget[] = getLocal('mock_budgets', []);
          const budgetData = data as BudgetUpsert;
          const idx = budgets.findIndex(
            (b) => b.user_id === session.user.id && b.month_year === budgetData.month_year
          );
          const newBudget: Budget = {
            id: idx >= 0 ? budgets[idx].id : crypto.randomUUID(),
            user_id: session.user.id,
            monthly_limit: budgetData.monthly_limit,
            month_year: budgetData.month_year,
            spent: budgetData.spent ?? 0,
            created_at: new Date().toISOString(),
          };
          if (idx >= 0) budgets[idx] = newBudget;
          else budgets.push(newBudget);
          setLocal('mock_budgets', budgets);
          notifySubscribers();
          return { data: newBudget, error: null };
        }

        return { data: null, error: { message: 'Not implemented' } };
      },

      delete: () => {
        return {
          eq: (field: string, val: unknown) => {
            return {
              then: async (callback: MockCallback<UnknownArray>) => {
                const session = getLocal<MockSession>('mock_session', null);
                if (!session) return callback({ data: [], error: { message: 'Unauthorized' } });

                if (table === 'carbon_entries') {
                  const entries: CarbonEntry[] = getLocal('mock_carbon_entries', []);
                  const updated = entries.filter(e => !(e[field as keyof CarbonEntry] === val && e.user_id === session.user.id));
                  setLocal('mock_carbon_entries', updated);
                  notifySubscribers();
                  return callback({ data: [], error: null });
                }
                return callback({ data: [], error: { message: 'Not implemented' } });
              }
            };
          }
        };
      }
    };
  },

  channel: () => {
    return {
      on: (_type: string, _filter: unknown, callback: (payload: { new: Record<string, unknown>; eventType: string }) => void) => {
        const handler = () => {
          callback({
            new: {},
            eventType: 'INSERT'
          });
        };
        return {
          subscribe: () => {
            dbSubscribers.add(handler);
            return {
              unsubscribe: () => {
                dbSubscribers.delete(handler);
              }
            };
          }
        };
      }
    };
  }
};

// Export the active client
export const supabase: SupabaseClient<Database, 'public', 'public'> =
  (isSupabaseConfigured ? realSupabase : (mockSupabase as unknown)) as SupabaseClient<Database, 'public', 'public'>;
export default supabase;
