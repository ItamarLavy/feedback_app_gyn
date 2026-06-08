import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FeedbackCardDetailed from '../components/feedback/FeedbackCardDetailed';
import InternStats from '../components/admin/InternStats';
import { User, ArrowLeft, ClipboardList, ListChecks, Shield, GraduationCap, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { STAGE_OPTIONS, PROCEDURE_REQUIREMENTS } from '@/lib/procedureConstants';
import NextStageRequirements from '../components/intern/NextStageRequirements';
import AIProgressSummary from '../components/admin/AIProgressSummary';
import RotationPlanEditor from '../components/admin/RotationPlanEditor';
import InternFilesManager from '../components/admin/InternFilesManager';
import MyMentoringMeetings from '../components/intern/MyMentoringMeetings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];



export default function InternDetails() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const internId = urlParams.get('id');

  const { data: intern } = useQuery({
    queryKey: ['intern', internId],
    queryFn: async () => {
      const interns = await base44.entities.Intern.filter({ id: internId });
      return interns[0];
    },
    enabled: !!internId
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks', internId],
    queryFn: async () => {
      return base44.entities.Feedback.filter({ intern_id: internId }, '-created_date');
    },
    enabled: !!internId
  });

  const { data: manualCounts = [] } = useQuery({
    queryKey: ['manual-procedure-counts', internId],
    queryFn: () => base44.entities.ManualProcedureCount.filter({ intern_id: internId }),
    enabled: !!internId
  });

  const { data: internFiles = [] } = useQuery({
    queryKey: ['intern-files', internId],
    queryFn: () => base44.entities.MeetingSummary.filter({ intern_id: internId }, '-meeting_date'),
    enabled: !!internId
  });

  const handleDeleteFeedback = async (feedbackId) => {
    await base44.entities.Feedback.delete(feedbackId);
    queryClient.invalidateQueries({ queryKey: ['feedbacks', internId] });
  };

  // חישוב סטטיסטיקות לפי קטגוריה
  const categoryStats = {};
  Object.keys(PROCEDURE_REQUIREMENTS).forEach(category => {
    const categoryFeedbacks = feedbacks.filter(f => f.procedure_category === category);
    const procedureCount = {};
    const manualProcedureCount = {};
    
    categoryFeedbacks.forEach(f => {
      if (!procedureCount[f.procedure_type]) {
        procedureCount[f.procedure_type] = 0;
      }
      procedureCount[f.procedure_type]++;
    });

    // הוספת ספירה ידנית
    manualCounts
      .filter(m => m.procedure_category === category)
      .forEach(m => {
        manualProcedureCount[m.procedure_name] = m.manual_count || 0;
      });

    const requirements = PROCEDURE_REQUIREMENTS[category];
    const procedureProgress = [];
    let totalRequired = 0;
    let totalCompleted = 0;

    Object.entries(requirements).forEach(([procName, required]) => {
      const completedWithFeedback = procedureCount[procName] || 0;
      const manualCount = manualProcedureCount[procName] || 0;
      const totalCount = completedWithFeedback + manualCount;
      
      totalRequired += required;
      totalCompleted += Math.min(completedWithFeedback, required);
      
      procedureProgress.push({
        name: procName,
        completed: completedWithFeedback,
        manualCount: manualCount,
        totalCount: totalCount,
        required,
        percentage: Math.min((completedWithFeedback / required) * 100, 100),
        manualPercentage: Math.min((manualCount / required) * 100, 100)
      });
    });

    categoryStats[category] = {
      procedures: procedureProgress,
      totalPercentage: totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0,
      totalCompleted,
      totalRequired
    };
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">אין לך הרשאה לצפות בדף זה</p>
          <p className="text-slate-400 text-sm mt-2">דף זה מיועד למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg text-white text-xl md:text-2xl font-bold flex-shrink-0">
              {intern?.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">{intern?.name || 'טוען...'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                <Select value={intern?.stage || ''} onValueChange={async (val) => {
                  await base44.entities.Intern.update(internId, { stage: val });
                  queryClient.invalidateQueries({ queryKey: ['intern', internId] });
                }}>
                  <SelectTrigger className="h-7 text-xs border-purple-200 text-purple-700 w-44">
                    <SelectValue placeholder="בחר שלב..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <Input
                  type="date"
                  value={intern?.stage_start_date || ''}
                  onChange={async (e) => {
                    await base44.entities.Intern.update(internId, { stage_start_date: e.target.value });
                    queryClient.invalidateQueries({ queryKey: ['intern', internId] });
                  }}
                  className="h-7 text-xs border-slate-200 text-slate-600 w-44 px-2"
                /></div>
            </div>
          </div>
          <Link 
             to={createPageUrl('Admin')}
             className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md text-sm"
           >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" open>
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">📈</span> סטטיסטיקות ודירוגים
          </summary>
          <div className="px-4 pb-4 pt-2">
            <InternStats feedbacks={feedbacks} internName={intern?.name} />
          </div>
        </details>

        {/* Next Stage Requirements */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" open>
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">🎯</span> דרישות מעבר שלב
          </summary>
          <div className="px-4 pb-4 pt-2">
            <NextStageRequirements
              internStage={intern?.stage}
              stageStartDate={intern?.stage_start_date}
              feedbacks={feedbacks}
              manualCounts={manualCounts}
            />
          </div>
        </details>

        {/* Detailed Progress by Category */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <ListChecks className="w-4 h-4 text-teal-600" /> התקדמות מפורטת לפי פרוצדורות
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <Card key={category} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{category}</span>
                    <Badge className="bg-teal-600">{Math.round(stats.totalPercentage)}% הושלם</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.procedures.map((proc, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{proc.name}</span>
                          <div className="flex items-center gap-2">
                            {proc.manualCount > 0 && <span className="text-slate-400 text-xs">({proc.manualCount} ידני)</span>}
                            <span className="text-slate-500 font-medium">{proc.totalCount} / {proc.required}</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                          {proc.manualCount > 0 && (
                            <div className="absolute h-2 bg-slate-300 rounded-full" style={{ width: `${Math.min(proc.manualPercentage, 100)}%` }} />
                          )}
                          <div className={`absolute h-2 rounded-full transition-all ${proc.percentage >= 100 ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${proc.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>

        {/* Mentoring Meetings */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">🤝</span> פגישות מנטורינג
          </summary>
          <div className="px-4 pb-4 pt-2">
            <MyMentoringMeetings internId={internId} />
          </div>
        </details>

        {/* Rotation Plan */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">🗓️</span> תוכנית רוטציות
          </summary>
          <div className="px-4 pb-4 pt-2">
            <RotationPlanEditor intern={intern} />
          </div>
        </details>

        {/* Intern Files */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">📁</span> קבצים ומסמכים
          </summary>
          <div className="px-4 pb-4 pt-2">
            <InternFilesManager intern={intern} />
          </div>
        </details>

        {/* AI Summary */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <span className="text-base">🤖</span> סיכום AI
          </summary>
          <div className="px-4 pb-4 pt-2">
            <AIProgressSummary intern={intern} feedbacks={feedbacks} manualCounts={manualCounts} internFiles={internFiles} />
          </div>
        </details>

        {/* Feedbacks */}
        <details className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <ClipboardList className="w-4 h-4 text-teal-600" /> משובים ({feedbacks.length})
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-4">
            {feedbacks.map(feedback => (
              <FeedbackCardDetailed
                key={feedback.id}
                feedback={feedback}
                showDelete={true}
                onDelete={handleDeleteFeedback}
              />
            ))}
            {feedbacks.length === 0 && (
              <div className="text-center py-12 text-slate-500">אין משובים עדיין למתמחה זה</div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}