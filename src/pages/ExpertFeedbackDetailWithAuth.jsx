import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Calendar, Hash, Star, CheckCircle, AlertCircle, Send, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import RatingCategory from '../components/feedback/RatingCategory';
import { onFeedbackCompleted, getOrCreateUserPoints, sendExpertWeeklySummary, checkExpertWeeklyReminder } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/AuthContext';

const RATING_CATEGORIES = [
  { key: 'expert_knowledge_rating', label: 'ידע', description: 'רמת הידע התיאורטי והקליני' },
  { key: 'expert_manual_skill_rating', label: 'מיומנות מנואלית', description: 'יכולת ביצוע טכני' },
  { key: 'expert_professionalism_rating', label: 'מקצועיות', description: 'התנהלות מקצועית' },
  { key: 'expert_independence_rating', label: 'עצמאות', description: 'רמת עצמאות בפרוצדורה' }
];

export default function ExpertFeedbackDetailWithAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const expertId = urlParams.get('id');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [expertFeedback, setExpertFeedback] = useState({
    expert_knowledge_rating: 0,
    expert_manual_skill_rating: 0,
    expert_professionalism_rating: 0,
    expert_independence_rating: 0,
    expert_verbal_feedback: ''
  });
  const [editingId, setEditingId] = useState(null);

  const { data: expert } = useQuery({
    queryKey: ['expert', expertId],
    queryFn: async () => {
      const experts = await base44.entities.Expert.list();
      return experts.find(e => e.id === expertId);
    },
    enabled: !!expertId
  });

  const { data: allFeedbacks = [] } = useQuery({
    queryKey: ['feedbacks-for-expert', expertId],
    queryFn: () => base44.entities.Feedback.filter({ expert_id: expertId }, '-created_date'),
    enabled: !!expertId
  });

  const { data: expertMeetings = [] } = useQuery({
    queryKey: ['expert-meetings', expertId],
    queryFn: async () => {
      const allMeetings = await base44.entities.FeedbackMeeting.list('-meeting_date');
      return allMeetings.filter(m => 
        m.invited_experts && m.invited_experts.some(e => e.id === expertId)
      );
    },
    enabled: !!expertId
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feedback.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks-for-expert', expertId] });
      setEditingId(null);
      setExpertFeedback({
        expert_knowledge_rating: 0,
        expert_manual_skill_rating: 0,
        expert_professionalism_rating: 0,
        expert_independence_rating: 0,
        expert_verbal_feedback: ''
      });
    }
  });

  useEffect(() => {
    if (!expert || !user?.id) return;
    getOrCreateUserPoints(user.id, expert.name, 'expert').catch(() => {});
    sendExpertWeeklySummary(user.id, expert.name, user.email).catch(() => {});
    checkExpertWeeklyReminder(user.id, expert.name, user.email).catch(() => {});
  }, [expert?.id, user?.id]);

  const pendingFeedbacks = allFeedbacks.filter(f => f.status === 'pending_expert_review');
  const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed');

  const handleStartEdit = (feedback) => {
    setEditingId(feedback.id);
    setExpertFeedback({
      expert_knowledge_rating: feedback.expert_knowledge_rating || 0,
      expert_manual_skill_rating: feedback.expert_manual_skill_rating || 0,
      expert_professionalism_rating: feedback.expert_professionalism_rating || 0,
      expert_independence_rating: feedback.expert_independence_rating || 0,
      expert_verbal_feedback: feedback.expert_verbal_feedback || ''
    });
  };

  const handleSubmitExpertFeedback = async (feedback) => {
    const hasAtLeastOneRating = expertFeedback.expert_knowledge_rating > 0 ||
                                 expertFeedback.expert_manual_skill_rating > 0 ||
                                 expertFeedback.expert_professionalism_rating > 0 ||
                                 expertFeedback.expert_independence_rating > 0;
    
    if (!hasAtLeastOneRating) {
      alert('יש למלא לפחות דירוג אחד');
      return;
    }

    updateFeedbackMutation.mutate({
      id: feedback.id,
      data: {
        ...feedback,
        expert_knowledge_rating: expertFeedback.expert_knowledge_rating > 0 ? expertFeedback.expert_knowledge_rating : null,
        expert_manual_skill_rating: expertFeedback.expert_manual_skill_rating > 0 ? expertFeedback.expert_manual_skill_rating : null,
        expert_professionalism_rating: expertFeedback.expert_professionalism_rating > 0 ? expertFeedback.expert_professionalism_rating : null,
        expert_independence_rating: expertFeedback.expert_independence_rating > 0 ? expertFeedback.expert_independence_rating : null,
        expert_verbal_feedback: expertFeedback.expert_verbal_feedback,
        expert_submitted_date: new Date().toISOString(),
        status: 'completed'
      }
    });

    // נקודות + ניקוי תזכורות
    try {
      // מצא את האימייל של המתמחה מה-Intern entity
      let internEmail = null;
      const allInterns = await base44.entities.Intern.list();
      const internRecord = allInterns.find(i => i.id === feedback.intern_id);
      if (internRecord) internEmail = internRecord.email;

      await onFeedbackCompleted({
        feedbackId: feedback.id,
        internId: feedback.intern_id,
        internName: feedback.intern_name,
        expertId,
        expertName: expert?.name,
        internEmail,
        expertEmail: user?.email,
        expertUserId: user?.id,
        requestedAt: feedback.intern_submitted_date
      });
    } catch(e) { console.warn('points/notification error', e); }
  };

  if (!expert) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  const upcomingMeetings = expertMeetings.filter(m => !isPast(parseISO(m.meeting_date)) && m.status === 'מתוכנן');
  const pastMeetings = expertMeetings.filter(m => isPast(parseISO(m.meeting_date)) || m.status === 'התקיים');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-white font-semibold">
              {expert.name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{expert.name}</h1>
              <p className="text-slate-500 text-sm">משובים ופגישות</p>
            </div>
          </div>
          <Link 
            to={createPageUrl('Home')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all"
          >
            חזרה
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Meetings - Collapsible */}
        {(upcomingMeetings.length > 0 || pastMeetings.length > 0) && (
          <div className="mb-8">
            <details className="bg-white rounded-lg border border-slate-200 shadow-lg">
              <summary className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 font-medium text-slate-700 flex items-center gap-2 transition-colors">
                <Calendar className="w-4 h-4" />
                פגישות מנטורינג ({upcomingMeetings.length + pastMeetings.length})
              </summary>
              <div className="px-4 pb-4 pt-2">
                {/* Upcoming Meetings */}
                {upcomingMeetings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      פגישות קרובות ({upcomingMeetings.length})
                    </h3>
                    <div className="space-y-3">
                      {upcomingMeetings.map(meeting => (
                        <Card key={meeting.id} className="border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="w-4 h-4 text-slate-600" />
                                  <span className="font-semibold text-slate-800">{meeting.intern_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                  <Clock className="w-4 h-4 text-teal-600" />
                                  <span>{format(parseISO(meeting.meeting_date), 'dd/MM/yyyy HH:mm')}</span>
                                </div>
                                {meeting.location && (
                                  <div className="flex items-center gap-2 text-sm text-slate-700 mt-1">
                                    <MapPin className="w-4 h-4 text-teal-600" />
                                    <span>{meeting.location}</span>
                                  </div>
                                )}
                                </div>
                                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">מתוכנן</Badge>
                            </div>
                            {meeting.notes && (
                              <p className="text-sm text-slate-700 mt-2 border-t border-teal-200 pt-2">{meeting.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Meetings */}
                {pastMeetings.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 mb-3">פגישות שהתקיימו ({pastMeetings.length})</h3>
                    <div className="space-y-2">
                      {pastMeetings.map(meeting => (
                        <Card key={meeting.id} className="bg-slate-50 border border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700">{meeting.intern_name}</span>
                                <span className="text-slate-400">•</span>
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">{format(parseISO(meeting.meeting_date), 'dd/MM/yyyy')}</span>
                              </div>
                              <Badge className="bg-slate-600 text-xs">התקיים</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Pending Feedbacks */}
        {pendingFeedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              ממתינים למילוי משוב ({pendingFeedbacks.length})
            </h2>
            <div className="space-y-4">
              {pendingFeedbacks.map(feedback => (
                <Card key={feedback.id} className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-600" />
                        <span className="font-mono text-teal-700">{feedback.procedure_id_code}</span>
                        <span className="text-slate-400">•</span>
                        <User className="w-4 h-4 text-slate-600" />
                        <span>{feedback.intern_name}</span>
                      </div>
                      <Badge className="bg-amber-600">ממתין למילוי</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Procedure Info */}
                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">תאריך:</span>
                        <span className="font-medium">{feedback.procedure_date ? format(new Date(feedback.procedure_date), 'dd/MM/yyyy') : 'לא צוין'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">פרוצדורה:</span>
                        <span className="font-medium mr-2">{feedback.procedure_type}</span>
                      </div>
                    </div>

                    {/* Intern Self-Feedback */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-4 shadow-sm">
                      <p className="font-semibold text-blue-800 mb-3">משוב עצמי של המתמחה:</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {feedback.intern_knowledge_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-slate-700 font-medium">ידע:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < feedback.intern_knowledge_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.intern_manual_skill_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-slate-600">מיומנות:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < feedback.intern_manual_skill_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.intern_professionalism_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-slate-600">מקצועיות:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < feedback.intern_professionalism_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.intern_independence_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-slate-600">עצמאות:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < feedback.intern_independence_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {feedback.intern_verbal_feedback && (
                        <p className="text-sm text-slate-700 border-t border-blue-300 pt-2 font-medium">{feedback.intern_verbal_feedback}</p>
                      )}
                    </div>

                    {/* Expert Feedback Form */}
                    {editingId === feedback.id ? (
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4 space-y-4 shadow-md">
                        <p className="font-semibold text-teal-900">המשוב שלך:</p>
                        
                        <div className="grid md:grid-cols-2 gap-3">
                          {RATING_CATEGORIES.map((category) => (
                            <RatingCategory
                              key={category.key}
                              label={category.label}
                              description={category.description}
                              value={expertFeedback[category.key]}
                              onChange={(value) => setExpertFeedback({ ...expertFeedback, [category.key]: value })}
                            />
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>משוב מילולי (אופציונלי)</Label>
                          <Textarea
                            value={expertFeedback.expert_verbal_feedback}
                            onChange={(e) => setExpertFeedback({ ...expertFeedback, expert_verbal_feedback: e.target.value })}
                            placeholder="הוסף משוב מילולי..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleSubmitExpertFeedback(feedback)}
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                          >
                            <Send className="w-4 h-4 ml-2" />
                            שלח משוב
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingId(null)}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleStartEdit(feedback)}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        מלא משוב
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Feedbacks - Collapsible */}
        {completedFeedbacks.length > 0 && (
          <div className="mb-8">
            <details className="bg-white rounded-lg border border-slate-200 shadow-lg">
              <summary className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 font-medium text-slate-700 flex items-center gap-2 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600" />
                משובים שהושלמו ({completedFeedbacks.length})
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-3">
                {completedFeedbacks.map(feedback => (
                  <div key={feedback.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-600" />
                        <span className="font-mono text-teal-700 font-semibold">{feedback.procedure_id_code}</span>
                        <span className="text-slate-400">•</span>
                        <User className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-800 font-medium">{feedback.intern_name}</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">הושלם</Badge>
                    </div>

                    <div className="text-sm text-slate-800 mb-2">
                      <span className="font-semibold">{feedback.procedure_category}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-700">{feedback.procedure_type}</span>
                    </div>

                    {feedback.procedure_date && (
                      <div className="flex items-center gap-1 text-sm text-slate-700 font-medium mb-2">
                        <Calendar className="w-3 h-3 text-green-600" />
                        <span>{format(new Date(feedback.procedure_date), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {allFeedbacks.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>אין משובים עבורך כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}