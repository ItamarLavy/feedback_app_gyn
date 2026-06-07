import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import { STAGE_TRANSITION_REQUIREMENTS, EPA_CODE_TO_PROCEDURE_NAMES } from '@/lib/procedureConstants';

const NEXT_STAGE_LABEL = {
  'תורן 4': 'תורן 3',
  'תורן 3': 'תורן 2',
  'תורן 2': 'תורן 1 צעיר',
  'תורן 1 צעיר': 'תורן 1 מתקדם',
};

const CATEGORY_COLORS = {
  'OB': 'bg-blue-100 text-blue-700',
  'GYN': 'bg-purple-100 text-purple-700',
  'IVF': 'bg-pink-100 text-pink-700',
  'ONCO': 'bg-orange-100 text-orange-700',
  'כללי': 'bg-teal-100 text-teal-700',
};

function countForCode(code, feedbacks, manualCounts) {
  const procedureNames = EPA_CODE_TO_PROCEDURE_NAMES[code] || [];
  
  // ספירת פידבקים
  let feedbackCount = 0;
  feedbacks.forEach(f => {
    if (procedureNames.includes(f.procedure_type)) {
      feedbackCount++;
    }
  });

  // ספירה ידנית - קטגוריה לפי הקוד
  let manualCount = 0;
  procedureNames.forEach(name => {
    const manual = manualCounts.find(m => m.procedure_name === name);
    if (manual) manualCount += manual.manual_count || 0;
  });

  return { feedbackCount, manualCount, total: feedbackCount + manualCount };
}

export default function NextStageRequirements({ internStage, stageStartDate, feedbacks = [], manualCounts = [] }) {
  const nextStage = NEXT_STAGE_LABEL[internStage];
  const requirements = STAGE_TRANSITION_REQUIREMENTS[internStage];

  const items = useMemo(() => {
    if (!requirements) return [];
    return requirements.map(req => {
      const { feedbackCount, manualCount, total } = countForCode(req.code, feedbacks, manualCounts);
      // מעבר שלב נספר רק על פי משובים (feedbackCount), לא ספירה ידנית
      const done = Math.min(feedbackCount, req.required);
      const completed = done >= req.required;
      return { ...req, feedbackCount, manualCount, total, done, completed };
    });
  }, [requirements, feedbacks, manualCounts]);

  if (!requirements || !nextStage) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center text-slate-500">
          {internStage === 'תורן 1 מתקדם' ? '🎓 שלב סיום — אין שלב הבא' : 'שלב לא מוגדר'}
        </CardContent>
      </Card>
    );
  }

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const overallPct = Math.round((completedCount / totalCount) * 100);

  const daysInStage = stageStartDate
    ? Math.floor((new Date() - new Date(stageStartDate)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>מה נדרש למעבר ל{nextStage}?</span>
          </div>
          <div className="flex items-center gap-2">
            {daysInStage !== null && (
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{daysInStage} ימים בשלב</span>
              </div>
            )}
            <Badge className={`${overallPct === 100 ? 'bg-green-600' : 'bg-teal-600'}`}>
              {completedCount} / {totalCount} הושלמו
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${overallPct === 100 ? 'bg-green-500' : 'bg-teal-500'}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.code}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                item.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${item.completed ? 'text-green-700 line-through' : 'text-slate-700'}`}>
                    {item.label}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-600'}`}>
                      {item.code}
                    </span>
                    {item.manualCount > 0 && (
                      <span className="text-xs text-slate-400">({item.manualCount} ידני)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                <span className={`text-sm font-bold ${item.completed ? 'text-green-600' : item.done > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {item.done} / {item.required}
                </span>
                {/* mini bar */}
                <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${item.completed ? 'bg-green-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min((item.done / item.required) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}