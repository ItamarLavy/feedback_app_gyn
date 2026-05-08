import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal } from 'lucide-react';
import { startOfWeek, startOfMonth } from 'date-fns';

const PERIOD_TABS = [
  { key: 'all', label: 'כל הזמנים' },
  { key: 'month', label: 'החודש' },
  { key: 'week', label: 'השבוע' },
];

function getRankIcon(rank) {
  if (rank === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-amber-700" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm text-slate-500 font-bold">{rank + 1}</span>;
}

export default function PointsLeaderboard() {
  const [period, setPeriod] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: userPoints = [] } = useQuery({
    queryKey: ['userPoints'],
    queryFn: () => base44.entities.UserPoints.list(),
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list(),
  });

  // חשב נקודות לפי תקופה
  const getPointsForPeriod = (userName, userRole) => {
    if (period === 'all') {
      const record = userPoints.find(p => p.user_name === userName);
      return record?.total_points || 0;
    }

    const cutoff = period === 'week'
      ? startOfWeek(new Date(), { weekStartsOn: 0 })
      : startOfMonth(new Date());

    // כל משוב = 5 נקודות
    let points = 0;
    if (userRole === 'intern' || userRole === 'all') {
      const internFeedbacks = feedbacks.filter(f =>
        f.intern_name === userName &&
        f.intern_submitted_date &&
        new Date(f.intern_submitted_date) >= cutoff
      );
      points += internFeedbacks.length * 5;
    }
    if (userRole === 'expert' || userRole === 'all') {
      const expertFeedbacks = feedbacks.filter(f =>
        f.expert_name === userName &&
        f.expert_submitted_date &&
        new Date(f.expert_submitted_date) >= cutoff &&
        f.status === 'completed'
      );
      points += expertFeedbacks.length * 5;
    }
    return points;
  };

  const enriched = userPoints
    .filter(p => roleFilter === 'all' || p.user_role === roleFilter)
    .map(p => ({
      ...p,
      computed_points: getPointsForPeriod(p.user_name, p.user_role),
    }))
    .filter(p => p.computed_points > 0 || period === 'all')
    .sort((a, b) => b.computed_points - a.computed_points);

  return (
    <div>
      <div className="p-0">
        {/* Period Tabs */}
        <div className="flex gap-2 mb-4">
          {PERIOD_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                period === tab.key
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Role Filter */}
        <div className="flex gap-2 mb-5">
          {[{ key: 'all', label: 'הכל' }, { key: 'intern', label: 'מתמחים' }, { key: 'expert', label: 'מומחים' }].map(r => (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                roleFilter === r.key
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {enriched.length === 0 ? (
          <p className="text-center text-slate-400 py-6">אין נתונים לתקופה זו</p>
        ) : (
          <div className="space-y-2">
            {enriched.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 shadow-sm'
                    : idx === 1
                    ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
                    : idx === 2
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(idx)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{entry.user_name}</p>
                  <Badge
                    className={`text-xs mt-0.5 ${
                      entry.user_role === 'intern' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                    }`}
                    variant="secondary"
                  >
                    {entry.user_role === 'intern' ? 'מתמחה' : 'מומחה'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 font-bold text-amber-600 text-lg">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {entry.computed_points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}