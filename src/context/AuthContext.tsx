import React, { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './auth-context';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, fallbackUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        const currentUser = fallbackUser ?? null;
        const fallbackName = typeof currentUser?.user_metadata?.name === 'string'
          ? currentUser.user_metadata.name
          : currentUser?.email?.split('@')[0] || 'User';

        setProfile({
          id: userId,
          email: currentUser?.email || '',
          name: fallbackName,
          country: null,
          target_budget: null,
          created_at: currentUser?.created_at || new Date().toISOString(),
        });
      } else {
        setProfile(data);
      }
    } catch (err: unknown) {
      console.error('Catch profile error:', err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applySession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        void applySession(data.session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applySession(session);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user);
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
      await fetchProfile(data.session.user.id, data.session.user);
    } else if (data?.user && data.session) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user);
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
