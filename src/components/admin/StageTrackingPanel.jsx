import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronDown, ChevronUp, Star, MessageSquare } from 'lucide-react';

const STAGES = [
  { key: 'תורן 4',          color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-400' },
  { key: 'תורן 3',          color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  { key: 'תורן 2',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  { key: 'תורן 1 צעיר',     color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  { key: 'תורן 1 מתקדם',    color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
];

function InternChip({ intern, feedbacks }) {
  const count = feedbacks.filter(f => f.intern_id === intern.id).length;
  const ratings = feedbacks
    .filter(f => f.intern_id === intern.id && f.expert_overall_rating > 0)
    .map(f => f.expert_overall_rating);
  const avg = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <Link
      to={createPageUrl('InternDetails') + `?id=${intern.id}`}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
        {intern.name?.[0]}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{intern.name}</p>
        {intern.rotation && (
          <p className="text-xs text-slate-500 truncate">{intern.rotation}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 mr-auto flex-shrink-0">
        {avg && (
          <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{avg}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-xs text-slate-400">
          <MessageSquare className="w-3 h-3" />{count}
        </span>
      </div>
    </Link>
  );
}

export default function StageTrackingPanel({ interns, feedbacks }) {
  const [open, setOpen] = useState(false);

  const noStage = interns.filter(i => !i.stage);

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader
        className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            מעקב לפי שלב
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5 pt-0">
          {STAGES.map(({ key, color, dot }) => {
            const stageInterns = interns.filter(i => i.stage === key);
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${dot} inline-block`}></span>
                  <h4 className="text-sm font-semibold text-slate-700">{key}</h4>
                  <Badge className={`text-xs border ${color}`}>{stageInterns.length}</Badge>
                </div>
                {stageInterns.length === 0 ? (
                  <p className="text-xs text-slate-400 pr-4">אין מתמחים בשלב זה</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {stageInterns.map(intern => (
                      <InternChip key={intern.id} intern={intern} feedbacks={feedbacks} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {noStage.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                <h4 className="text-sm font-semibold text-slate-400">ללא שלב מוגדר</h4>
                <Badge className="text-xs border bg-slate-100 text-slate-500 border-slate-200">{noStage.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {noStage.map(intern => (
                  <InternChip key={intern.id} intern={intern} feedbacks={feedbacks} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}