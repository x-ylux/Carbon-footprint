import { createContext } from 'react';
import type { AuthError, User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

export type Profile = Database['public']['Tables']['users']['Row'];

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: AuthError | null; needsVerification: boolean | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  fetchProfile: (userId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
