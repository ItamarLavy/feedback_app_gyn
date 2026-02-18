import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp } from 'lucide-react';

export default function InternStats({ feedbacks }) {
  // חישוב ממוצע כללי
  const overallAverage = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  // חישוב ממוצע לכל פרוצדורה
  const procedureStats = {};
  feedbacks.forEach(f => {
    if (!procedureStats[f.procedure_type]) {
      procedureStats[f.procedure_type] = { total: 0, count: 0 };
    }
    procedureStats[f.procedure_type].total += f.rating;
    procedureStats[f.procedure_type].count += 1;
  });

  const procedureAverages = Object.entries(procedureStats).map(([type, stats]) => ({
    type,
    average: (stats.total / stats.count).toFixed(1),
    count: stats.count
  })).sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ממוצע כללי */}
      <Card className="bg-gradient-to-bl from-teal-500 to-teal-600 text-white border-0">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-lg font-medium">דירוג ממוצע כללי</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-bold">{overallAverage}</span>
            <Star className="w-8 h-8 fill-amber-300 text-amber-300" />
          </div>
          <p className="text-teal-100 mt-2">מתוך {feedbacks.length} משובים</p>
        </CardContent>
      </Card>

      {/* ממוצע לפי פרוצדורה */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-800">דירוג לפי פרוצדורה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {procedureAverages.length === 0 ? (
            <p className="text-slate-500 text-center py-4">אין נתונים עדיין</p>
          ) : (
            procedureAverages.map((proc) => (
              <div key={proc.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-slate-700">{proc.type}</span>
                  <span className="text-slate-400 text-sm">({proc.count})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-800">{proc.average}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}