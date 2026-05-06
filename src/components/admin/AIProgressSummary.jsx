import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';

// מפתח כמויות הפרוצדורות הנדרשות (מאוחד)
const PROCEDURE_REQUIREMENTS = {
  "OB": { total: 187 },
  "GYN": { total: 148 },
  "IVF": { total: 30 },
  "ONCO": { total: 15 },
  "כללי": { total: 37 },
};

export default function AIProgressSummary({ intern, feedbacks = [], manualCounts = [] }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiSummary('');

    // סטטיסטיקות התקדמות לפי קטגוריה
    const categoryProgress = Object.entries(PROCEDURE_REQUIREMENTS).map(([cat, { total }]) => {
      const done = feedbacks.filter(f => f.procedure_category === cat).length;
      const manual = manualCounts.filter(m => m.procedure_category === cat).reduce((sum, m) => sum + (m.manual_count || 0), 0);
      return `${cat}: ${done} משובים + ${manual} ידני מתוך ~${total} נדרש`;
    }).join('\n');

    const feedbackText = feedbacks.map(f =>
      `[${f.procedure_date || '?'}] ${f.procedure_category} - ${f.procedure_type} | ידע: ${f.expert_knowledge_rating || '-'} מיומנות: ${f.expert_manual_skill_rating || '-'} מקצועיות: ${f.expert_professionalism_rating || '-'} עצמאות: ${f.expert_independence_rating || '-'} | "${f.expert_verbal_feedback || ''}"`
    ).join('\n');

    const prompt = `אתה מנחה רפואי בכיר. סכם בעברית את התקדמות המתמחה ${intern?.name} בצורה קצרה ומועילה.

=== התקדמות לפי קטגוריה ===
${categoryProgress}

=== משובי מומחים (${feedbacks.length} סה"כ) ===
${feedbackText || 'אין משובים עדיין'}

אנא כתוב סיכום קצר (3-5 פסקאות) שיכלול:
1. מצב כולל - כמה ביצע מתוך הנדרש (באחוזים גסים)
2. נקודות חוזק שעולות מהמשובים
3. תחומים לשיפור
4. המלצה לפעולה הבאה`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6'
    });

    setAiSummary(typeof result === 'string' ? result : JSON.stringify(result));
    setAiLoading(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          סיכום AI - התקדמות ומשובים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateAISummary}
          disabled={aiLoading}
          className="w-full bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          {aiLoading
            ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />מכין סיכום...</>
            : <><Sparkles className="w-4 h-4 ml-2" />הפק סיכום AI</>
          }
        </Button>
        <p className="text-xs text-slate-400 text-center">משקלל משובי מומחים וקצב ההתקדמות</p>

        {aiSummary && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}