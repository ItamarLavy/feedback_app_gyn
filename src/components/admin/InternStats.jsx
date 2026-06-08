import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, BookOpen, Stethoscope, Users, GraduationCap, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

// שדות דירוג זמינים לפי סוג טופס (מהמומחה)
const FORM_TYPE_CONFIG = {
  procedural: {
    label: 'פרוצדורלי',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    fields: [
      { key: 'expert_overall_rating', label: 'כללי' },
      { key: 'expert_knowledge_rating', label: 'ידע' },
      { key: 'expert_clinical_skill_rating', label: 'מיומנות קלינית' },
      { key: 'expert_communication_rating', label: 'תקשורת' },
    ],
    hasIndependence: true
  },
  clinical_management: {
    label: 'ניהול קליני',
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'bg-teal-100 text-teal-800',
    fields: [
      { key: 'expert_overall_rating', label: 'כללי' },
      { key: 'expert_knowledge_rating', label: 'ידע' },
      { key: 'expert_clinical_skill_rating', label: 'ניהול עבודת צוות' },
      { key: 'expert_communication_rating', label: 'תקשורת' },
    ],
    hasIndependence: true
  },
  ward_management: {
    label: 'ניהול מחלקה',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100 text-purple-800',
    fields: [
      { key: 'expert_knowledge_rating', label: 'ידע' },
      { key: 'expert_clinical_skill_rating', label: 'ניהול צוות' },
      { key: 'expert_communication_rating', label: 'תקשורת' },
    ],
    hasIndependence: false
  },
  teaching_research: {
    label: 'הוראה ומחקר',
    color: 'bg-amber-50 border-amber-200',
    headerColor: 'bg-amber-100 text-amber-800',
    fields: [
      { key: 'expert_knowledge_rating', label: 'ידע' },
      { key: 'expert_communication_rating', label: 'תקשורת' },
    ],
    hasIndependence: false
  },
  communication: {
    label: 'תקשורת',
    color: 'bg-rose-50 border-rose-200',
    headerColor: 'bg-rose-100 text-rose-800',
    fields: [
      { key: 'expert_overall_rating', label: 'כללי' },
      { key: 'expert_communication_rating', label: 'תקשורת' },
    ],
    hasIndependence: false
  }
};

function avg(arr) {
  if (!arr.length) return null;
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function RatingPill({ value }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  const color = value >= 4 ? 'text-green-700 bg-green-100' : value >= 3 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {value} <Star className="w-3 h-3 fill-current" />
    </span>
  );
}

function FormTypeBlock({ formType, config, feedbacks }) {
  const [expanded, setExpanded] = useState(false);
  const typeFeedbacks = feedbacks.filter(f => f.form_type === formType && f.status === 'completed');
  if (typeFeedbacks.length === 0) return null;

  const fieldAverages = config.fields.map(({ key, label }) => {
    const vals = typeFeedbacks.map(f => f[key]).filter(v => v > 0);
    return { label, average: avg(vals), count: vals.length };
  });

  const independenceCount = config.hasIndependence
    ? typeFeedbacks.filter(f => f.expert_independence === true).length
    : null;
  const independenceTotal = config.hasIndependence
    ? typeFeedbacks.filter(f => f.expert_independence !== null && f.expert_independence !== undefined).length
    : null;

  // ממוצע כללי לבלוק הזה
  const allVals = config.fields.flatMap(({ key }) => typeFeedbacks.map(f => f[key]).filter(v => v > 0));
  const blockAvg = avg(allVals);

  // קבץ לפי פרוצדורה לטבלה
  const byProcedure = {};
  typeFeedbacks.forEach(f => {
    if (!byProcedure[f.procedure_type]) byProcedure[f.procedure_type] = [];
    byProcedure[f.procedure_type].push(f);
  });

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.headerColor}`}>
              {config.label}
            </span>
            <span className="text-slate-500 text-sm">{typeFeedbacks.length} משובים</span>
          </div>
          {blockAvg && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-800">{blockAvg}</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* שדות דירוג */}
        <div className="grid grid-cols-2 gap-2">
          {fieldAverages.map(({ label, average, count }) => (
            <div key={label} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
              <span className="text-slate-600 text-xs">{label}</span>
              <RatingPill value={average} />
            </div>
          ))}
          {config.hasIndependence && independenceTotal > 0 && (
            <div className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
              <span className="text-slate-600 text-xs">עצמאות</span>
              <span className="text-xs font-bold text-slate-700">
                {independenceCount}/{independenceTotal}
              </span>
            </div>
          )}
        </div>

        {/* פירוט לפי פרוצדורה */}
        {Object.keys(byProcedure).length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors mt-1"
          >
            פירוט לפי פרוצדורה
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {expanded && (
          <div className="space-y-1 mt-1">
            {Object.entries(byProcedure).sort((a, b) => b[1].length - a[1].length).map(([proc, fbs]) => {
              const procAllVals = config.fields.flatMap(({ key }) => fbs.map(f => f[key]).filter(v => v > 0));
              const procAvg = avg(procAllVals);
              return (
                <div key={proc} className="flex items-center justify-between bg-white/80 rounded px-3 py-1.5 text-xs">
                  <span className="text-slate-700 truncate max-w-[60%]">{proc}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">({fbs.length}×)</span>
                    <RatingPill value={procAvg} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InternStats({ feedbacks }) {
  const completedFeedbacks = feedbacks.filter(f => f.status === 'completed');

  // ממוצע כולל מכל המשובים שהושלמו
  const allRatings = completedFeedbacks.flatMap(f => [
    f.expert_overall_rating, f.expert_knowledge_rating,
    f.expert_clinical_skill_rating, f.expert_communication_rating
  ].filter(v => v > 0));
  const overallAvg = avg(allRatings);

  return (
    <div className="space-y-4">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800">סטטיסטיקות משובים</h3>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-3 py-1">
          <span className="text-sm font-bold text-teal-800">{overallAvg ?? '—'}</span>
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-xs text-teal-600">ממוצע כולל ({completedFeedbacks.length} מושלמים)</span>
        </div>
      </div>

      {/* בלוקים לפי סוג טופס */}
      {Object.entries(FORM_TYPE_CONFIG).map(([formType, config]) => (
        <FormTypeBlock
          key={formType}
          formType={formType}
          config={config}
          feedbacks={feedbacks}
        />
      ))}

      {completedFeedbacks.length === 0 && (
        <p className="text-slate-500 text-center py-6 text-sm">אין משובים מושלמים עדיין</p>
      )}
    </div>
  );
}