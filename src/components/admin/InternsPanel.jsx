import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, Building2, Star, MessageSquare,
  ChevronDown, ChevronUp, Calendar, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import AlertsBadge from '@/components/notifications/AlertsBadge';
import InternProgressBadges from '@/components/intern/InternProgressBadges';

// ─── Config ───────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'תורן 4',       color: 'bg-sky-100 text-sky-700 border-sky-200',         dot: 'bg-sky-400' },
  { key: 'תורן 3',       color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  { key: 'תורן 2',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  { key: 'תורן 1 צעיר',  color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  { key: 'תורן 1 מתקדם', color: 'bg-rose-100 text-rose-700 border-rose-200',      dot: 'bg-rose-500' },
];

const DEPARTMENTS = ['גניקולוגיה', 'מיילדות', 'פוריות', 'אונקולוגיה', 'כללי', 'מיון', 'רוטציה חיצונית'];

const MEETING_TYPES = [
  { key: 'opening', label: 'פתיחה', doneKey: 'meeting_opening_done', dateKey: 'meeting_opening_date' },
  { key: 'middle',  label: 'אמצע',  doneKey: 'meeting_middle_done',  dateKey: 'meeting_middle_date' },
  { key: 'closing', label: 'סיכום', doneKey: 'meeting_closing_done', dateKey: 'meeting_closing_date' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInternStats(intern, feedbacks) {
  const internFeedbacks = feedbacks.filter(f => f.intern_id === intern.id);
  const ratings = internFeedbacks.filter(f => f.expert_overall_rating > 0).map(f => f.expert_overall_rating);
  const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
  const needsReminder = internFeedbacks.length > 0 &&
    (Date.now() - new Date(internFeedbacks[0]?.created_date).getTime()) > 7 * 24 * 60 * 60 * 1000;
  return { count: internFeedbacks.length, avg, feedbacks: internFeedbacks, needsReminder };
}

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function InternRow({ intern, feedbacks, currentPlan }) {
  const { count, avg, feedbacks: internFeedbacks, needsReminder } = getInternStats(intern, feedbacks);
  return (
    <Link
      to={createPageUrl('InternDetails') + `?id=${intern.id}`}
      className={`flex flex-col gap-2 p-3 rounded-xl transition-all border ${
        needsReminder
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-200'
          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300'
      } shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
          {intern.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-slate-800 text-sm">{intern.name}</p>
            {needsReminder && <span className="text-xs text-amber-600">⚠</span>}
            <AlertsBadge personId={intern.id} role="intern" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {intern.stage && (
              <span className="flex items-center gap-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                <GraduationCap className="w-2.5 h-2.5" />{intern.stage}
              </span>
            )}
            {currentPlan && (
              <span className="flex items-center gap-0.5 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                <Building2 className="w-2.5 h-2.5" />{currentPlan.department}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
              {avg ?? '-'}
              <span className="text-slate-300">•</span>
              {count} משובים
            </span>
          </div>
        </div>
      </div>
      <InternProgressBadges feedbacks={internFeedbacks} />
    </Link>
  );
}

function InternChip({ intern, feedbacks }) {
  const { count, avg } = getInternStats(intern, feedbacks);
  return (
    <Link
      to={createPageUrl('InternDetails') + `?id=${intern.id}`}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
        {intern.name?.[0]}
      </div>
      <p className="text-sm font-medium text-slate-800 truncate flex-1 min-w-0">{intern.name}</p>
      <div className="flex items-center gap-1.5 flex-shrink-0">
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

function MeetingBadge({ plan, type, onToggle }) {
  const mt = MEETING_TYPES.find(m => m.key === type);
  const isDone = plan[mt.doneKey];
  const overdue = isMeetingOverdue(plan, type);
  const expected = getMeetingExpected(plan, type);
  return (
    <button
      onClick={e => { e.preventDefault(); onToggle(plan, mt); }}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
        isDone ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
        : overdue ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 animate-pulse'
        : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
      }`}
      title={expected ? `צפוי: ${format(expected, 'dd/MM/yyyy')}` : ''}
    >
      {isDone ? <CheckCircle2 className="w-3 h-3" /> : overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {mt.label}
    </button>
  );
}

function DeptInternCard({ plan, interns, onToggleMeeting }) {
  const intern = interns.find(i => i.id === plan.intern_id);
  const today = new Date();
  const end = parseISO(plan.end_date);
  const daysLeft = differenceInDays(end, today);
  const overdueCount = MEETING_TYPES.filter(mt => isMeetingOverdue(plan, mt.key)).length;

  return (
    <div className={`rounded-xl border p-4 ${overdueCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link to={createPageUrl('InternDetails') + `?id=${plan.intern_id}`} className="font-semibold text-slate-800 hover:text-teal-700 transition-colors text-sm">
            {plan.intern_name || intern?.name || '—'}
          </Link>
          {plan.external_location && <p className="text-xs text-orange-600 font-medium mt-0.5">📍 {plan.external_location}</p>}
        </div>
        <div className="flex-shrink-0">
          {daysLeft > 0
            ? <Badge className={`text-xs ${daysLeft <= 14 ? 'bg-amber-500' : 'bg-slate-400'} text-white`}>{daysLeft} ימים</Badge>
            : <Badge className="text-xs bg-slate-300 text-slate-600">הסתיים</Badge>
          }
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
        <Calendar className="w-3 h-3" />
        {format(parseISO(plan.start_date), 'dd/MM/yy')} – {format(parseISO(plan.end_date), 'dd/MM/yy')}
      </div>
      {overdueCount > 0 && (
        <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />{overdueCount} פגישות שחלפו מועדן!
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">פגישות:</span>
        {MEETING_TYPES.map(mt => (
          <MeetingBadge key={mt.key} plan={plan} type={mt.key} onToggle={onToggleMeeting} />
        ))}
      </div>
    </div>
  );
}

// ─── Views ─────────────────────────────────────────────────────────────────────

function AlphaView({ interns, feedbacks, rotationPlans }) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...interns].sort((a, b) => {
    const aLast = a.name?.split(' ').pop() ?? '';
    const bLast = b.name?.split(' ').pop() ?? '';
    return aLast.localeCompare(bLast, 'he');
  });
  return (
    <div className="flex flex-col gap-3">
      {sorted.map(intern => {
        const plan = rotationPlans.find(r =>
          r.intern_id === intern.id && r.start_date <= today && r.end_date >= today
        );
        return <InternRow key={intern.id} intern={intern} feedbacks={feedbacks} currentPlan={plan} />;
      })}
      {sorted.length === 0 && <p className="text-center text-slate-500 py-8">אין מתמחים במערכת</p>}
    </div>
  );
}

function StageView({ interns, feedbacks }) {
  const noStage = interns.filter(i => !i.stage);
  return (
    <div className="space-y-5">
      {STAGES.map(({ key, color, dot }) => {
        const group = interns.filter(i => i.stage === key);
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${dot} inline-block`}></span>
              <h4 className="text-sm font-semibold text-slate-700">{key}</h4>
              <Badge className={`text-xs border ${color}`}>{group.length}</Badge>
            </div>
            {group.length === 0
              ? <p className="text-xs text-slate-400 pr-4">אין מתמחים בשלב זה</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {group.map(intern => <InternChip key={intern.id} intern={intern} feedbacks={feedbacks} />)}
                </div>
            }
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
            {noStage.map(intern => <InternChip key={intern.id} intern={intern} feedbacks={feedbacks} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function DeptView({ interns, rotationPlans }) {
  const queryClient = useQueryClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const handleToggleMeeting = async (plan, mt) => {
    const newVal = !plan[mt.doneKey];
    const update = { [mt.doneKey]: newVal, [mt.dateKey]: newVal ? format(today, 'yyyy-MM-dd') : null };
    await base44.entities.InternRotationPlan.update(plan.id, update);
    queryClient.invalidateQueries({ queryKey: ['rotationPlans'] });
  };

  const activePlans = rotationPlans.filter(p =>
    p.start_date && p.end_date && p.start_date <= todayStr && p.end_date >= todayStr
  );
  const futurePlans = rotationPlans.filter(p => p.start_date && p.start_date > todayStr);

  // interns with no active plan today
  const activeInternIds = new Set(activePlans.map(p => p.intern_id));
  const unassigned = interns.filter(i => !activeInternIds.has(i.id));

  return (
    <div className="space-y-6">
      {DEPARTMENTS.map(dept => {
        const deptActive = activePlans.filter(p => p.department === dept);
        const deptFuture = futurePlans.filter(p => p.department === dept);
        if (deptActive.length === 0 && deptFuture.length === 0) return null;
        const overdueCount = deptActive.reduce((sum, plan) =>
          sum + MEETING_TYPES.filter(mt => isMeetingOverdue(plan, mt.key)).length, 0
        );
        return (
          <div key={dept} className={`rounded-xl border p-4 ${overdueCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Users className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="font-semibold text-slate-800">{dept}</span>
              <Badge className="bg-teal-600 text-white text-xs">{deptActive.length} פעילים</Badge>
              {deptFuture.length > 0 && <Badge className="bg-blue-400 text-white text-xs">{deptFuture.length} קרובים</Badge>}
              {overdueCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{overdueCount} פגישות באיחור
                </Badge>
              )}
            </div>
            {deptActive.length === 0
              ? <p className="text-xs text-slate-400 py-2 text-center">אין מתמחים פעילים כרגע</p>
              : <div className="space-y-3">
                  {deptActive.map(plan => (
                    <DeptInternCard key={plan.id} plan={plan} interns={interns} onToggleMeeting={handleToggleMeeting} />
                  ))}
                </div>
            }
            {deptFuture.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                  יצטרפו בקרוב
                </h4>
                <div className="space-y-1.5">
                  {deptFuture.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                      <Link to={createPageUrl('InternDetails') + `?id=${plan.intern_id}`} className="font-medium text-slate-800 hover:text-teal-700 text-sm">
                        {plan.intern_name || '—'}
                      </Link>
                      <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(plan.start_date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-500 text-sm">לא משובצים למחלקה</span>
            <Badge className="bg-slate-300 text-slate-700 text-xs">{unassigned.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {unassigned.map(intern => (
              <Link key={intern.id} to={createPageUrl('InternDetails') + `?id=${intern.id}`}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all text-sm text-slate-700 font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {intern.name?.[0]}
                </div>
                {intern.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const VIEWS = [
  { key: 'alpha', label: 'א״ב' },
  { key: 'stage', label: 'שלב' },
  { key: 'dept',  label: 'מחלקה' },
];

export default function InternsPanel({ interns, feedbacks }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('alpha');

  const { data: rotationPlans = [] } = useQuery({
    queryKey: ['rotationPlans'],
    queryFn: () => base44.entities.InternRotationPlan.list('start_date'),
  });

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader
        className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            מתמחים ({interns.length})
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="pt-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit" onClick={e => e.stopPropagation()}>
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === v.key
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {view === 'alpha' && <AlphaView interns={interns} feedbacks={feedbacks} rotationPlans={rotationPlans} />}
          {view === 'stage' && <StageView interns={interns} feedbacks={feedbacks} />}
          {view === 'dept'  && <DeptView  interns={interns} rotationPlans={rotationPlans} />}
        </CardContent>
      )}
    </Card>
  );
}