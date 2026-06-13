import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Users,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  Megaphone,
  Loader2,
  Leaf,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface CollectiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  participants_count: number;
  co2_impact_kg: number;
}

interface GroupChallenge {
  id: string;
  title: string;
  description: string | null;
  target_kg: number;
  current_kg: number;
  participants_count: number;
  end_date: string;
}

const advocacyItems = [
  {
    title: 'Renewable Energy Policy',
    desc: 'Support India\'s transition to 500 GW renewable capacity by 2030.',
    status: 'Active',
  },
  {
    title: 'Public Transit Investment',
    desc: 'Advocate for expanded metro and bus networks in tier-2 cities.',
    status: 'Active',
  },
  {
    title: 'Plastic Ban Enforcement',
    desc: 'Push for stricter enforcement of single-use plastic regulations.',
    status: 'Ongoing',
  },
  {
    title: 'Green Building Codes',
    desc: 'Promote energy-efficient building standards for new construction.',
    status: 'Planned',
  },
];

const MOCK_EVENTS: CollectiveEvent[] = [
  {
    id: '1',
    title: 'Tree Plantation Drive',
    description: 'Plant 100 native trees in urban parks across Delhi NCR.',
    event_date: '2026-07-15',
    location: 'Delhi, India',
    participants_count: 245,
    co2_impact_kg: 5000,
  },
  {
    id: '2',
    title: 'Zero-Waste Workshop',
    description: 'Learn practical tips to reduce household waste and packaging.',
    event_date: '2026-08-02',
    location: 'Mumbai, India',
    participants_count: 120,
    co2_impact_kg: 800,
  },
  {
    id: '3',
    title: 'Cycling Sunday',
    description: 'Community bike ride promoting low-carbon commuting.',
    event_date: '2026-06-22',
    location: 'Bangalore, India',
    participants_count: 89,
    co2_impact_kg: 1200,
  },
];

const MOCK_CHALLENGES: GroupChallenge[] = [
  {
    id: '1',
    title: '30-Day Meat-Free Challenge',
    description: 'Go vegetarian for 30 days and track your savings.',
    target_kg: 50000,
    current_kg: 32400,
    participants_count: 412,
    end_date: '2026-07-31',
  },
  {
    id: '2',
    title: 'No Plastic July',
    description: 'Eliminate single-use plastics for one month.',
    target_kg: 30000,
    current_kg: 18500,
    participants_count: 278,
    end_date: '2026-07-31',
  },
  {
    id: '3',
    title: 'Bike to Work Week',
    description: 'Swap car commutes for cycling this week.',
    target_kg: 15000,
    current_kg: 9800,
    participants_count: 156,
    end_date: '2026-06-20',
  },
];

export const CollectiveAction: React.FC = () => {
  const [events, setEvents] = useState<CollectiveEvent[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalImpact, setTotalImpact] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: eventsData } = await supabase
          .from('collective_events')
          .select('*')
          .order('event_date', { ascending: true });

        const { data: challengesData } = await supabase
          .from('group_challenges')
          .select('*')
          .order('end_date', { ascending: true });

        const evts: CollectiveEvent[] = Array.isArray(eventsData)
          ? (eventsData as CollectiveEvent[])
          : MOCK_EVENTS;
        const chls: GroupChallenge[] = Array.isArray(challengesData)
          ? (challengesData as GroupChallenge[])
          : MOCK_CHALLENGES;

        setEvents(evts);
        setChallenges(chls);

        const eventImpact = evts.reduce((s: number, e: CollectiveEvent) => s + Number(e.co2_impact_kg), 0);
        const challengeImpact = chls.reduce((s: number, c: GroupChallenge) => s + Number(c.current_kg), 0);
        setTotalImpact(eventImpact + challengeImpact);
      } catch {
        setEvents(MOCK_EVENTS);
        setChallenges(MOCK_CHALLENGES);
        setTotalImpact(71900);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-forest-500 animate-spin" />
      </div>
    );
  }

  const totalParticipants =
    events.reduce((s, e) => s + e.participants_count, 0) +
    challenges.reduce((s, c) => s + c.participants_count, 0);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-forest-300/10 blur-3xl pointer-events-none" />

      {/* Hero + Impact Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-forest-100/60 dark:bg-forest-900/40 text-forest-700 dark:text-forest-400 text-xs font-semibold border border-forest-200/50">
            <Users className="w-3.5 h-3.5" />
            <span>Together We Make a Difference</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-white">
            Collective Action
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Join community events, participate in group challenges, and advocate for policies that
            accelerate India's green transition.
          </p>
        </div>

        {/* Impact Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-forest-600 to-forest-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-forest-600/25 hover:scale-[1.02] transition-transform duration-300">
            <Leaf className="w-8 h-8 mx-auto mb-2 text-forest-200" />
            <div className="text-3xl font-black">{totalImpact.toLocaleString()}</div>
            <div className="text-sm font-semibold text-forest-200">kg CO₂ Saved Collectively</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300">
            <Users className="w-8 h-8 mx-auto mb-2 text-sky-primary" />
            <div className="text-3xl font-black text-slate-800 dark:text-white">
              {totalParticipants.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-slate-500">Active Participants</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300">
            <Award className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <div className="text-3xl font-black text-slate-800 dark:text-white">
              {events.length + challenges.length}
            </div>
            <div className="text-sm font-semibold text-slate-500">Active Initiatives</div>
          </div>
        </div>
      </section>

      {/* Community Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="w-6 h-6 text-forest-600 dark:text-forest-400" />
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Community Events
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-forest-100 dark:bg-forest-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 text-forest-600 dark:text-forest-400" />
                </div>
                <span className="text-xs font-bold text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/50 px-2.5 py-1 rounded-full">
                  {Number(event.co2_impact_kg).toLocaleString()} kg saved
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{event.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {event.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-forest-500" />
                  <span>
                    {new Date(event.event_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-sky-primary" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>{event.participants_count} participants</span>
                </div>
              </div>
              <button
                className="mt-5 w-full py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                Join Event
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Group Challenges */}
      <section className="bg-slate-50/50 dark:bg-slate-900/30 py-12 border-y border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-8">
            <Target className="w-6 h-6 text-sky-primary" />
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Group Challenges
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const progress = Math.min(
                Math.round((Number(challenge.current_kg) / Number(challenge.target_kg)) * 100),
                100
              );
              return (
                <div
                  key={challenge.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-white">{challenge.title}</h3>
                    <span className="text-xs font-bold text-sky-primary">{progress}%</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {challenge.description}
                  </p>
                  <div className="w-full rounded-full overflow-hidden">
                    <progress
                      className="w-full h-2.5 appearance-none rounded-full accent-sky-primary"
                      value={progress}
                      max={100}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mb-4">
                    <span>
                      {Number(challenge.current_kg).toLocaleString()} kg saved
                    </span>
                    <span>Target: {Number(challenge.target_kg).toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>{challenge.participants_count} joined</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Ends{' '}
                      {new Date(challenge.end_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <button
                    className="mt-4 w-full py-2.5 rounded-xl border-2 border-forest-500 text-forest-600 dark:text-forest-400 font-bold text-sm hover:bg-forest-50 dark:hover:bg-forest-950/30 transition-all duration-200 cursor-pointer"
                  >
                    Join Challenge
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Policy Advocacy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-3 mb-8">
          <Megaphone className="w-6 h-6 text-rose-500" />
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Policy Advocacy
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advocacyItems.map((item) => (
            <div
              key={item.title}
              className="flex items-start space-x-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-5 hover:border-forest-300 dark:hover:border-forest-700 transition-all duration-300 group"
            >
              <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-slate-800 dark:text-white">{item.title}</h3>
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : item.status === 'Ongoing'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-forest-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CollectiveAction;
