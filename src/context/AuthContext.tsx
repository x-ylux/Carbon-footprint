import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './authContext';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from './authContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        const fallbackName = typeof currentUser.user_metadata?.name === 'string'
          ? currentUser.user_metadata.name
          : currentUser.email?.split('@')[0] || 'User';

        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          name: fallbackName,
          country: null,
          target_budget: null,
          created_at: currentUser.created_at || new Date().toISOString(),
        });
      } else {
        setProfile(data);
      }
    } catch (err: unknown) {
      console.error('Catch profile error:', err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately, handling the initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user);
          } else {
            setUser(null);
            setProfile(null);
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user);
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
      await fetchProfile(data.session.user);
    } else if (data?.user && data.session) {
      setUser(data.user);
      await fetchProfile(data.user);
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
