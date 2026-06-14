import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { AuthError, User, Session } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { supabase } from '../lib/supabaseClient';

type Profile = Database['public']['Tables']['users']['Row'];

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null; needsVerification: boolean | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch public profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        if (user) {
          const fallbackName = typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : user.email?.split('@')[0] || 'User';

          setProfile({
            id: userId,
            email: user.email || '',
            name: fallbackName,
            country: null,
            target_budget: null,
            created_at: user.created_at || new Date().toISOString(),
          });
        }
      } else {
        setProfile(data);
      }
    } catch (err: unknown) {
      console.error('Catch profile error:', err instanceof Error ? err.message : String(err));
    }
  }, [user]);

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setLoading(true);
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );


    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    const needsVerification = data?.user && !data?.session;

    if (data?.session?.user) {
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    } else if (data?.user && data.session) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }

    return { error, needsVerification };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
