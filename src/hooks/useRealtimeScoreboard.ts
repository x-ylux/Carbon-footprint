import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type CollectiveEventRow = Database['public']['Tables']['collective_events']['Row'];
export type GroupChallengeRow = Database['public']['Tables']['group_challenges']['Row'];

export const useRealtimeScoreboard = () => {
  const [events, setEvents] = useState<CollectiveEventRow[]>([]);
  const [challenges, setChallenges] = useState<GroupChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: eventData }, { data: challengeData }] = await Promise.all([
          supabase.from('collective_events').select('*').order('event_date', { ascending: true }),
          supabase.from('group_challenges').select('*').order('end_date', { ascending: true }),
        ]);

        if (eventData) setEvents(eventData);
        if (challengeData) setChallenges(challengeData);
      } catch (error) {
        console.error('Scoreboard load error', error);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel('scoreboard-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collective_events' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_challenges' }, () => {
        load();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const totalImpact = useMemo(() => {
    const eventImpact = events.reduce((sum, event) => sum + Number(event.co2_impact_kg), 0);
    const challengeImpact = challenges.reduce((sum, challenge) => sum + Number(challenge.current_kg), 0);
    return eventImpact + challengeImpact;
  }, [events, challenges]);

  const totalParticipants = useMemo(
    () =>
      events.reduce((sum, event) => sum + Number(event.participants_count), 0) +
      challenges.reduce((sum, challenge) => sum + Number(challenge.participants_count), 0),
    [events, challenges],
  );

  return {
    events,
    challenges,
    loading,
    totalImpact,
    totalParticipants,
  };
};
