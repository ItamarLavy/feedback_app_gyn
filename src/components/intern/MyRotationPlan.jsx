import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, CheckSquare, Square } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const getStatus = (plan) => {
  const today = new Date();
  const start = parseISO(plan.start_date);
  const end = parseISO(plan.end_date);
  if (today < start) return { label: 'עתידי', color: 'bg-blue-100 text-blue-700' };
  if (today > end) return { label: 'הסתיים', color: 'bg-slate-100 text-slate-600' };
  return { label: 'פעיל', color: 'bg-green-100 text-green-700' };
};

const getDuration = (start, end) => {
  const days = differenceInDays(parseISO(end), parseISO(start));
  if (days < 30) return `${days} ימים`;
  return `${Math.round(days / 7)} שבועות`;
};

export default function MyRotationPlan({ internId }) {
  const { data: plans = [] } = useQuery({
    queryKey: ['rotation-plans', internId],
    queryFn: () => base44.entities.InternRotationPlan.filter({ intern_id: internId }, 'start_date'),
    enabled: !!internId
  });

  if (plans.length === 0) return null;

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-5 h-5 text-teal-600" />
          תוכנית התמחות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map(plan => {
          const status = getStatus(plan);
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-4 ${status.label === 'פעיל' ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-semibold text-slate-800">{plan.department}</span>
                <Badge className={status.color + ' border-0 text-xs'}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(parseISO(plan.start_date), 'dd/MM/yyyy')} – {format(parseISO(plan.end_date), 'dd/MM/yyyy')}</span>
                <span className="text-slate-400">({getDuration(plan.start_date, plan.end_date)})</span>
              </div>
              {plan.external_location && (
                <p className="text-xs text-orange-600 font-medium mb-2">📍 {plan.external_location}</p>
              )}
              {plan.notes && (
                <p className="text-xs text-slate-400 mb-2">{plan.notes}</p>
              )}
              {/* פגישות - תצוגה בלבד */}
              <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                {[
                  { field: 'meeting_opening_done', dateField: 'meeting_opening_date', label: 'פגישת פתיחה' },
                  { field: 'meeting_middle_done',  dateField: 'meeting_middle_date',  label: 'פגישת אמצע' },
                  { field: 'meeting_closing_done', dateField: 'meeting_closing_date', label: 'פגישת סיום' },
                ].map(({ field, dateField, label }) => (
                  <div
                    key={field}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs ${
                      plan[field]
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {plan[field]
                      ? <CheckSquare className="w-4 h-4 text-teal-600" />
                      : <Square className="w-4 h-4 text-slate-300" />
                    }
                    <span className="font-medium text-center">{label}</span>
                    {plan[field] && plan[dateField] && (
                      <span className="text-teal-500 text-[10px]">{format(parseISO(plan[dateField]), 'dd/MM/yy')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}