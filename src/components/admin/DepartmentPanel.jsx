import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Calendar, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, isWithinInterval } from 'date-fns';

const MEETING_TYPES = [
  { key: 'opening', label: 'פתיחה', doneKey: 'meeting_opening_done', dateKey: 'meeting_opening_date' },
  { key: 'middle',  label: 'אמצע',  doneKey: 'meeting_middle_done',  dateKey: 'meeting_middle_date' },
  { key: 'closing', label: 'סיכום', doneKey: 'meeting_closing_done', dateKey: 'meeting_closing_date' },
];

function getMeetingExpected(plan, type) {
  const start = parseISO(plan.start_date);
  const end = parseISO(plan.end_date);
  const total = differenceInDays(end, start);
  if (type === 'opening') return addDays(start, 7);
  if (type === 'middle') return addDays(start, Math.floor(total / 2));
  if (type === 'closing') return addDays(end, -7);
  return null;
}

function isMeetingOverdue(plan, type) {
  const today = new Date();
  const expected = getMeetingExpected(plan, type);
  const doneKey = MEETING_TYPES.find(m => m.key === type).doneKey;
  return expected && today > expected && !plan[doneKey];
}

function MeetingBadge({ plan, type, onToggle }) {
  const mt = MEETING_TYPES.find(m => m.key === type);
  const isDone = plan[mt.doneKey];
  const overdue = isMeetingOverdue(plan, type);
  const expected = getMeetingExpected(plan, type);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onToggle(plan, mt)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
          isDone
            ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
            : overdue
            ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 animate-pulse'
            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
        }`}
        title={expected ? `צפוי: ${format(expected, 'dd/MM/yyyy')}` : ''}
      >
        {isDone ? <CheckCircle2 className="w-3 h-3" /> : overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {mt.label}
      </button>
    </div>
  );
}

function InternRotationCard({ plan, interns, onToggleMeeting }) {
  const intern = interns.find(i => i.id === plan.intern_id);
  const today = new Date();
  const end = parseISO(plan.end_date);
  const daysLeft = differenceInDays(end, today);
  const overdueCount = MEETING_TYPES.filter(mt => isMeetingOverdue(plan, mt.key)).length;

  return (
    <div className={`rounded-xl border p-4 ${overdueCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link
            to={createPageUrl('InternDetails') + `?id=${plan.intern_id}`}
            className="font-semibold text-slate-800 hover:text-teal-700 transition-colors"
          >
            {plan.intern_name || intern?.name || '—'}
          </Link>
          {plan.stage_name && (
            <p className="text-xs text-slate-500 mt-0.5">{plan.stage_name}</p>
          )}
        </div>
        <div className="text-left flex-shrink-0">
          {daysLeft > 0 ? (
            <Badge className={`text-xs ${daysLeft <= 14 ? 'bg-amber-500' : 'bg-slate-400'} text-white`}>
              {daysLeft} ימים
            </Badge>
          ) : (
            <Badge className="text-xs bg-slate-300 text-slate-600">הסתיים</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
        <Calendar className="w-3 h-3" />
        <span>{format(parseISO(plan.start_date), 'dd/MM/yy')} – {format(parseISO(plan.end_date), 'dd/MM/yy')}</span>
      </div>

      {overdueCount > 0 && (
        <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {overdueCount} פגישות שחלפו מועדן!
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 ml-1">פגישות:</span>
        {MEETING_TYPES.map(mt => (
          <MeetingBadge key={mt.key} plan={plan} type={mt.key} onToggle={onToggleMeeting} />
        ))}
      </div>
    </div>
  );
}

export default function DepartmentPanel({ department, label, interns }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date();

  const { data: allPlans = [] } = useQuery({
    queryKey: ['rotation-plans-dept', department],
    queryFn: () => base44.entities.InternRotationPlan.filter({ department }, 'start_date'),
  });

  const activePlans = allPlans.filter(p => {
    const start = parseISO(p.start_date);
    const end = parseISO(p.end_date);
    return today >= start && today <= end;
  });

  const futurePlans = allPlans.filter(p => {
    const start = parseISO(p.start_date);
    return today < start;
  });

  const overdueCount = activePlans.reduce((sum, plan) =>
    sum + MEETING_TYPES.filter(mt => isMeetingOverdue(plan, mt.key)).length, 0
  );

  const handleToggleMeeting = async (plan, mt) => {
    const newVal = !plan[mt.doneKey];
    const update = { [mt.doneKey]: newVal };
    if (newVal) update[mt.dateKey] = format(today, 'yyyy-MM-dd');
    else update[mt.dateKey] = null;
    await base44.entities.InternRotationPlan.update(plan.id, update);
    queryClient.invalidateQueries({ queryKey: ['rotation-plans-dept', department] });
  };

  return (
    <Card className={`border-0 shadow-lg ${overdueCount > 0 ? 'ring-2 ring-red-300' : ''}`}>
      <CardHeader
        className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>{label}</span>
            <Badge className="bg-teal-600 text-white text-xs">{activePlans.length} פעילים</Badge>
            {futurePlans.length > 0 && (
              <Badge className="bg-blue-400 text-white text-xs">{futurePlans.length} קרובים</Badge>
            )}
            {overdueCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} פגישות
              </Badge>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5">
          {/* Active interns */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              מתמחים פעילים כעת
            </h4>
            {activePlans.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">אין מתמחים פעילים כרגע</p>
            ) : (
              <div className="space-y-3">
                {activePlans.map(plan => (
                  <InternRotationCard
                    key={plan.id}
                    plan={plan}
                    interns={interns}
                    onToggleMeeting={handleToggleMeeting}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming interns */}
          {futurePlans.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                מתמחים שיצטרפו בקרוב
              </h4>
              <div className="space-y-2">
                {futurePlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div>
                      <Link
                        to={createPageUrl('InternDetails') + `?id=${plan.intern_id}`}
                        className="font-medium text-slate-800 hover:text-teal-700 text-sm"
                      >
                        {plan.intern_name || '—'}
                      </Link>
                      {plan.stage_name && <span className="text-xs text-slate-500 mr-1">· {plan.stage_name}</span>}
                    </div>
                    <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(plan.start_date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}