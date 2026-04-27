import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, BookOpen, Hand, Award, UserCog } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EXPERT_RATING_KEYS = [
  { key: 'expert_knowledge_rating', label: 'ידע', icon: BookOpen },
  { key: 'expert_manual_skill_rating', label: 'מיומנות מנואלית', icon: Hand },
  { key: 'expert_professionalism_rating', label: 'מקצועיות', icon: Award },
  { key: 'expert_independence_rating', label: 'עצמאות', icon: UserCog }
];

export default function InternStats({ feedbacks, internName, rotations, meetings, managerNotes }) {


  // חישוב ממוצע כללי (רק מדירוגי מומחים)
  const expertRatings = [];
  feedbacks.forEach(f => {
    EXPERT_RATING_KEYS.forEach(({ key }) => {
      if (f[key] && f[key] > 0) expertRatings.push(f[key]);
    });
  });
  const overallAverage = expertRatings.length > 0
    ? (expertRatings.reduce((a, b) => a + b, 0) / expertRatings.length).toFixed(1)
    : 0;

  // חישוב ממוצע לכל קטגוריית דירוג (רק מדירוגי מומחים)
  const categoryAverages = EXPERT_RATING_KEYS.map(({ key, label, icon }) => {
    const ratings = feedbacks.map(f => f[key]).filter(r => r && r > 0);
    return {
      key,
      label,
      icon,
      average: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
      count: ratings.length
    };
  });

  // חישוב מעקב פרוצדורות מפורט (רק מדירוגי מומחים)
  const procedureTracking = {};
  feedbacks.forEach(f => {
    if (!procedureTracking[f.procedure_type]) {
      procedureTracking[f.procedure_type] = {
        count: 0,
        knowledge: [],
        manual_skill: [],
        professionalism: [],
        independence: []
      };
    }
    procedureTracking[f.procedure_type].count += 1;
    if (f.expert_knowledge_rating > 0) procedureTracking[f.procedure_type].knowledge.push(f.expert_knowledge_rating);
    if (f.expert_manual_skill_rating > 0) procedureTracking[f.procedure_type].manual_skill.push(f.expert_manual_skill_rating);
    if (f.expert_professionalism_rating > 0) procedureTracking[f.procedure_type].professionalism.push(f.expert_professionalism_rating);
    if (f.expert_independence_rating > 0) procedureTracking[f.procedure_type].independence.push(f.expert_independence_rating);
  });

  const procedureTableData = Object.entries(procedureTracking).map(([type, stats]) => ({
    type,
    count: stats.count,
    avgKnowledge: stats.knowledge.length > 0 ? (stats.knowledge.reduce((a, b) => a + b, 0) / stats.knowledge.length).toFixed(1) : '-',
    avgManualSkill: stats.manual_skill.length > 0 ? (stats.manual_skill.reduce((a, b) => a + b, 0) / stats.manual_skill.length).toFixed(1) : '-',
    avgProfessionalism: stats.professionalism.length > 0 ? (stats.professionalism.reduce((a, b) => a + b, 0) / stats.professionalism.length).toFixed(1) : '-',
    avgIndependence: stats.independence.length > 0 ? (stats.independence.reduce((a, b) => a + b, 0) / stats.independence.length).toFixed(1) : '-'
  })).sort((a, b) => b.count - a.count);



  return (
    <div className="space-y-6">
      {/* Overall Stats */}
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

        {/* ממוצע לפי קטגוריה */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800">דירוג לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryAverages.map(({ key, label, icon: Icon, average, count }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-teal-600" />
                  <span className="text-slate-700">{label}</span>
                  <span className="text-slate-400 text-sm">({count})</span>
                </div>
                {average ? (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-800">{average}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">אין נתונים</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* מעקב פרוצדורות */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-800">מעקב פרוצדורות</CardTitle>
        </CardHeader>
        <CardContent>
          {procedureTableData.length === 0 ? (
            <p className="text-slate-500 text-center py-4">אין נתונים עדיין</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-2 font-semibold text-slate-700">פרוצדורה</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700">ידע</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700">מיומנות</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700">מקצועיות</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700">עצמאות</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700">פעמים</th>
                  </tr>
                </thead>
                <tbody>
                  {procedureTableData.map((proc, idx) => (
                    <tr key={proc.type} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                      <td className="py-3 px-2 text-slate-700">{proc.type}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-semibold ${proc.avgKnowledge !== '-' ? 'text-teal-700' : 'text-slate-400'}`}>
                          {proc.avgKnowledge}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-semibold ${proc.avgManualSkill !== '-' ? 'text-teal-700' : 'text-slate-400'}`}>
                          {proc.avgManualSkill}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-semibold ${proc.avgProfessionalism !== '-' ? 'text-teal-700' : 'text-slate-400'}`}>
                          {proc.avgProfessionalism}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-semibold ${proc.avgIndependence !== '-' ? 'text-teal-700' : 'text-slate-400'}`}>
                          {proc.avgIndependence}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold">
                          {proc.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}