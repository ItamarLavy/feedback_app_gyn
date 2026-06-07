import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MyMentoringMeetings from '@/components/intern/MyMentoringMeetings';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCircle2, Calendar, Hash, Star, Plus, BarChart3, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { getOrCreateUserPoints, sendInternWeeklySummary, sendFridayChampionMessage } from '@/hooks/useNotifications';

import AvatarSetup from '@/components/intern/AvatarSetup';
import InternPersona from '@/components/intern/InternPersona';
import InternSelfFeedbackFormSimple from '../components/feedback/InternSelfFeedbackFormSimple';
import NextStageRequirements from '@/components/intern/NextStageRequirements';

import { PROCEDURE_REQUIREMENTS } from '@/lib/procedureConstants';

export default function InternProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const internId = urlParams.get('id');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const pullToRefreshRef = usePullToRefresh(['intern-feedbacks', internId]);

  const { data: intern } = useQuery({
    queryKey: ['intern', internId],
    queryFn: async () => {
      const interns = await base44.entities.Intern.list();
      return interns.find(i => i.id === internId);
    },
    enabled: !!internId
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['intern-feedbacks', internId],
    queryFn: () => base44.entities.Feedback.filter({ intern_id: internId }, '-created_date'),
    enabled: !!internId
  });

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: !!internId
  });

  // טעינת מתמחים בדרגת "תורן 1 מתקדם" שיכולים גם למשב
  const { data: seniorInterns = [] } = useQuery({
    queryKey: ['senior-interns'],
    queryFn: () => base44.entities.Intern.filter({ stage: 'תורן 1 מתקדם' }),
    enabled: !!internId
  });

  const { data: manualCounts = [] } = useQuery({
    queryKey: ['manual-procedure-counts', internId],
    queryFn: () => base44.entities.ManualProcedureCount.filter({ intern_id: internId }),
    enabled: !!internId
  });

  useEffect(() => {
    if (!intern || !user?.id) return;
    if (!intern.nickname || !intern.avatar) setShowAvatarSetup(true);
    getOrCreateUserPoints(user.id, intern.name, 'intern').catch(() => {});
    sendInternWeeklySummary(user.id, intern.name, user.email).catch(() => {});
    sendFridayChampionMessage(user.id, user.email).catch(() => {});
  }, [intern?.id, user?.id]);

  if (!intern) {
    return <div className="p-8 text-center">טוען...</div>;
  }

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
      totalCompleted += Math.min(completedWithFeedback, required); // רק משובים נספרים באחוזים
      
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

  return (
    <div ref={pullToRefreshRef} className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
      {showAvatarSetup && (
        <AvatarSetup
          intern={intern}
          onDone={(nick, av) => setShowAvatarSetup(false)}
        />
      )}
      <InternPersona nickname={intern.nickname} avatar={intern.avatar} />
      <div className="max-w-6xl mx-auto px-5 py-8 pb-40 md:pb-8">
        {/* Header */}
         <div className="flex items-start justify-between mb-6 gap-2">
           <div className="flex items-center gap-3 min-w-0">
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-blue-800 font-semibold text-lg md:text-xl shadow-md flex-shrink-0">
               {intern.name?.[0]}
             </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">{intern.name}</h1>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {intern.stage && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    🎓 {intern.stage}
                  </span>
                )}
                {intern.rotation && (
                  <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    🏥 {intern.rotation}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link 
            to={createPageUrl('Home')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all flex-shrink-0"
          >
            חזרה
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>



        {/* Mentoring Meetings */}
        <MyMentoringMeetings internId={internId} />

        {/* Next Stage Requirements */}
        <div className="mb-8">
          <NextStageRequirements
            internStage={intern.stage}
            feedbacks={feedbacks}
            manualCounts={manualCounts}
          />
        </div>

        {/* Add Feedback Form */}
        <div className="mb-8">
          {showFeedbackForm ? (
            <div>
              <InternSelfFeedbackFormSimple
                internId={internId}
                internName={intern.name}
                experts={experts}
                seniorInterns={seniorInterns.filter(s => s.id !== internId)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['intern-feedbacks', internId] });
                  setShowFeedbackForm(false);
                }}
              />
              <Button
                variant="outline"
                onClick={() => setShowFeedbackForm(false)}
                className="mt-4 w-full"
              >
                ביטול
              </Button>
            </div>
          ) : (
            <Button
               onClick={() => setShowFeedbackForm(true)}
               className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-lg shadow-lg"
             >
              <Plus className="w-5 h-5 ml-2" />
              הוסף משוב עצמי חדש
            </Button>
          )}
        </div>

        {/* Progress Tracking - Collapsible */}
        <div className="mb-8">
          <details className="bg-white rounded-lg border border-slate-200 shadow-lg">
            <summary className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 font-medium text-slate-800 flex items-center gap-2 transition-colors">
              <BarChart3 className="w-4 h-4" />
              מעקב התקדמות ({feedbacks.length} פרוצדורות)
            </summary>
            <div className="px-4 pb-4 pt-2">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <Card key={category} className="border-0 shadow-sm">
                   <CardContent className="p-3 md:p-4">
                     <div className="text-center">
                       <h3 className="font-semibold text-slate-700 mb-1 text-sm">{category}</h3>
                       <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-0.5">
                         {Math.round(stats.totalPercentage)}%
                       </div>
                       <p className="text-xs text-slate-500">
                         {stats.totalCompleted} / {stats.totalRequired}
                       </p>
                     </div>
                   </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Progress by Category */}
              <div className="space-y-6">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <Card key={category} className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{category}</span>
                        <Badge className="bg-blue-600">
                          {Math.round(stats.totalPercentage)}% הושלם
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.procedures.map((proc, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{proc.name}</span>
                              <div className="flex items-center gap-2">
                                {proc.manualCount > 0 && (
                                  <span className="text-slate-400 text-xs">
                                    ({proc.manualCount} ידני)
                                  </span>
                                )}
                                <span className="text-slate-500 font-medium">
                                  {proc.totalCount} / {proc.required}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                              {/* ביצועים ידניים - רקע אפור */}
                              {proc.manualCount > 0 && (
                                <div
                                  className="absolute h-2 bg-slate-300 rounded-full"
                                  style={{ width: `${Math.min(proc.manualPercentage, 100)}%` }}
                                />
                              )}
                              {/* ביצועים עם משוב - כחול/ירוק */}
                              <div
                                className={`absolute h-2 rounded-full transition-all ${
                                  proc.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${proc.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* My Feedbacks - Collapsible */}
        <div className="mb-8">
          <details className="bg-white rounded-lg border border-slate-200 shadow-lg">
            <summary className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 font-medium text-slate-800 flex items-center gap-2 transition-colors">
              <ClipboardList className="w-4 h-4" />
              המשובים שלי ({feedbacks.length})
            </summary>
            <div className="px-4 pb-4 pt-2">
              <div className="space-y-3">
                {feedbacks.map(feedback => (
                  <div key={feedback.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-teal-700 font-semibold">{feedback.procedure_id_code}</span>
                        <Badge className={feedback.status === 'completed' ? 'bg-green-600' : 'bg-amber-600'}>
                          {feedback.status === 'completed' ? 'הושלם' : 'ממתין למומחה'}
                        </Badge>
                      </div>
                      {feedback.procedure_date && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(feedback.procedure_date), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-700 mb-3">
                      <span className="font-medium">{feedback.procedure_category}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span>{feedback.procedure_type}</span>
                    </div>

                    {/* Self Ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {feedback.intern_knowledge_rating > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">ידע</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < feedback.intern_knowledge_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                      {feedback.intern_manual_skill_rating > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">מיומנות</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < feedback.intern_manual_skill_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                      {feedback.intern_professionalism_rating > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">מקצועיות</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < feedback.intern_professionalism_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                      {feedback.intern_independence_rating > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">עצמאות</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < feedback.intern_independence_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verbal Feedback */}
                    {feedback.intern_verbal_feedback && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-blue-700 font-semibold mb-1">המשוב שלי:</p>
                        <p className="text-sm text-slate-700">{feedback.intern_verbal_feedback}</p>
                      </div>
                    )}
                  </div>
                ))}

                {feedbacks.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    עדיין לא מילאת משובים
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}