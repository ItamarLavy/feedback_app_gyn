import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Star, Zap, Calendar, CalendarDays, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

export default function PointsTracker() {
  const { user } = useAuth();

  const { data: userPointsArr = [] } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: () => base44.entities.UserPoints.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['my-feedbacks-points', user?.id],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: !!user?.id
  });

  const pointsRecord = userPointsArr[0] || {};
  const totalPoints = pointsRecord.total_points || 0;

  // חישוב נקודות לפי טווח זמן מהמשובים
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const monthStart = startOfMonth(now);

  // ניקוד: כל משוב שנוצר = 10 נקודות (הערכה), מושלם = 20
  const calcPoints = (since) =>
    feedbacks
      .filter(f => {
        const isOwn = f.intern_id === user?.id || f.expert_id === user?.id ||
          f.intern_name === user?.full_name || f.expert_name === user?.full_name;
        return isOwn && isAfter(new Date(f.created_date), since);
      })
      .reduce((acc, f) => acc + (f.status === 'completed' ? 20 : 10), 0);

  const todayPoints = calcPoints(todayStart);
  const weekPoints = calcPoints(weekStart);
  const monthPoints = calcPoints(monthStart);

  const stats = [
    { label: 'היום', value: todayPoints, icon: Zap, color: 'from-sky-400 to-blue-500', bg: 'from-sky-50 to-blue-50', border: 'border-sky-200' },
    { label: 'השבוע', value: weekPoints, icon: CalendarDays, color: 'from-teal-400 to-emerald-500', bg: 'from-teal-50 to-emerald-50', border: 'border-teal-200' },
    { label: 'החודש', value: monthPoints, icon: Calendar, color: 'from-purple-400 to-violet-500', bg: 'from-purple-50 to-violet-50', border: 'border-purple-200' },
    { label: 'סה"כ', value: totalPoints, icon: Trophy, color: 'from-amber-400 to-yellow-500', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-300' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
      <div className="max-w-xl mx-auto px-5 py-8 pb-40">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-4">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">מעקב נקודות</h1>
          <p className="text-slate-500 text-sm mt-1">נקודות נצברות על כל משוב שמוגש ומאושר</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-2 ${border} shadow-lg bg-gradient-to-br ${bg}`}>
              <CardContent className="p-5">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{label}</p>
                  <p className="text-3xl font-bold text-slate-800">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <Card className="border-0 shadow-md bg-white/80">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-slate-700 text-sm">איך צוברים נקודות?</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>מילוי טופס מתמחה</span>
                <span className="font-bold text-amber-600">+5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span>מילוי טופס בכיר (גם למתמחה וגם לבכיר)</span>
                <span className="font-bold text-amber-600">+5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span>קיום שיחת משוב — לכל המשתתפים</span>
                <span className="font-bold text-amber-600">+5 ⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}