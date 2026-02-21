import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, BookOpen, Hand, Award, UserCog, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EXPERT_RATING_KEYS = [
  { key: 'expert_knowledge_rating', label: 'ידע', icon: BookOpen },
  { key: 'expert_manual_skill_rating', label: 'מיומנות מנואלית', icon: Hand },
  { key: 'expert_professionalism_rating', label: 'מקצועיות', icon: Award },
  { key: 'expert_independence_rating', label: 'עצמאות', icon: UserCog }
];

export default function InternStats({ feedbacks, internName }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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

  // חישוב ממוצע לכל פרוצדורה (רק מדירוגי מומחים)
  const procedureStats = {};
  feedbacks.forEach(f => {
    if (!procedureStats[f.procedure_type]) {
      procedureStats[f.procedure_type] = { ratings: [], count: 0 };
    }
    EXPERT_RATING_KEYS.forEach(({ key }) => {
      if (f[key] && f[key] > 0) {
        procedureStats[f.procedure_type].ratings.push(f[key]);
      }
    });
    procedureStats[f.procedure_type].count += 1;
  });

  const procedureAverages = Object.entries(procedureStats).map(([type, stats]) => ({
    type,
    average: stats.ratings.length > 0 
      ? (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(1) 
      : null,
    count: stats.count
  })).sort((a, b) => parseFloat(b.average || 0) - parseFloat(a.average || 0));

  const generateAiSummary = async () => {
    setIsLoadingSummary(true);
    
    const feedbacksText = feedbacks.map(f => {
      const expertRatings = [];
      if (f.expert_knowledge_rating) expertRatings.push(`ידע: ${f.expert_knowledge_rating}/5`);
      if (f.expert_manual_skill_rating) expertRatings.push(`מיומנות מנואלית: ${f.expert_manual_skill_rating}/5`);
      if (f.expert_professionalism_rating) expertRatings.push(`מקצועיות: ${f.expert_professionalism_rating}/5`);
      if (f.expert_independence_rating) expertRatings.push(`עצמאות: ${f.expert_independence_rating}/5`);
      
      return `פרוצדורה: ${f.procedure_type}, ${expertRatings.join(', ')}${f.expert_verbal_feedback ? `, משוב מומחה: ${f.expert_verbal_feedback}` : ''}`;
    }).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה מנהל מחלקה רפואית. להלן משובים על מתמחה בשם ${internName}:

${feedbacksText}

כתוב פסקה אחת מסכמת (3-5 משפטים) שמתארת את החוזקות והאתגרים של המתמחה, ומה הצעדים הבאים שלו צריכים להיות. כתוב בעברית, בצורה מקצועית ובונה.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" }
        }
      }
    });

    setAiSummary(result.summary);
    setIsLoadingSummary(false);
  };

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
                  <span className="text-slate-400 text-sm">({proc.count} משובים)</span>
                </div>
                {proc.average ? (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-800">{proc.average}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">אין דירוג</span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            סיכום AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <p className="text-slate-700 leading-relaxed">{aiSummary}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 mb-4">קבל סיכום אוטומטי של כל המשובים על המתמחה</p>
              <Button
                onClick={generateAiSummary}
                disabled={isLoadingSummary || feedbacks.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoadingSummary ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מייצר סיכום...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    צור סיכום AI
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}