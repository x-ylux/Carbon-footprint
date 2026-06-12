import { createClient } from '@supabase/supabase-js';

// Read from env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we should use the actual Supabase or fallback mock
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

console.log(
  isSupabaseConfigured 
    ? '🔌 Connecting to Supabase backend...' 
    : '📦 Supabase env vars not found. Using local Storage Mock Backend.'
);

// Create the standard Supabase client (only if configured)
const realSupabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// MOCK CLIENT IMPLEMENTATION
// ==========================================

// Helpers for localStorage persistence
const getLocal = (key: string, defaultValue: any): any => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
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

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

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
    signUp: async ({ email, options }: any) => {
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

    signInWithPassword: async ({ email }: any) => {
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

    onAuthStateChange: (callback: any) => {
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
    return {
      select: (_fields: string = '*') => {
        return {
          eq: (_field: string, val: any) => {
            return {
              single: async () => {
                const session = getLocal('mock_session', null);
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
              order: (_orderField: string, { ascending }: any = {}) => {
                return {
                  then: (callback: any) => {
                    const session = getLocal('mock_session', null);
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
              const session = getLocal('mock_session', null);
              if (!session) return { data: null, error: { message: 'Unauthorized' } };
              return { data: session.user, error: null };
            }
            return { data: null, error: { message: 'Not implemented' } };
          }
        };
      },

      insert: async (data: any[]) => {
        const session = getLocal('mock_session', null);
        if (!session) return { data: null, error: { message: 'Unauthorized' } };

        if (table === 'carbon_entries') {
          const entries: CarbonEntry[] = getLocal('mock_carbon_entries', []);
          const newEntries: CarbonEntry[] = data.map(item => ({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            category: item.category,
            subcategory: item.subcategory,
            value: item.value,
            unit: item.unit,
            co2_emission: item.co2_emission,
            created_at: item.created_at || new Date().toISOString()
          }));

          const updated = [...entries, ...newEntries];
          setLocal('mock_carbon_entries', updated);
          notifySubscribers();
          return { data: newEntries, error: null };
        }

        return { data: null, error: { message: 'Not implemented' } };
      },

      upsert: async (data: any) => {
        const session = getLocal('mock_session', null);
        if (!session) return { data: null, error: { message: 'Unauthorized' } };

        if (table === 'goals') {
          const goals: Goal[] = getLocal('mock_goals', []);
          const existingIndex = goals.findIndex(g => g.user_id === session.user.id);
          
          const newGoal: Goal = {
            id: existingIndex >= 0 ? goals[existingIndex].id : crypto.randomUUID(),
            user_id: session.user.id,
            annual_limit: data.annual_limit,
            created_at: new Date().toISOString()
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

        return { data: null, error: { message: 'Not implemented' } };
      },

      delete: () => {
        return {
          eq: (field: string, val: any) => {
            return {
              then: async (callback: any) => {
                const session = getLocal('mock_session', null);
                if (!session) return callback({ data: null, error: { message: 'Unauthorized' } });

                if (table === 'carbon_entries') {
                  const entries: CarbonEntry[] = getLocal('mock_carbon_entries', []);
                  const updated = entries.filter(e => !(e[field as keyof CarbonEntry] === val && e.user_id === session.user.id));
                  setLocal('mock_carbon_entries', updated);
                  notifySubscribers();
                  return callback({ data: null, error: null });
                }
                return callback({ data: null, error: { message: 'Not implemented' } });
              }
            };
          }
        };
      }
    };
  },

  channel: (_channelName: string) => {
    return {
      on: (_type: string, _filter: any, callback: any) => {
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
export const supabase = isSupabaseConfigured ? realSupabase! : (mockSupabase as any);
export default supabase;
