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
import { onFeedbackCompleted, getOrCreateUserPoints, sendExpertWeeklySummary, checkExpertWeeklyReminder } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/AuthContext';

// Returns the list of rating fields shown to both intern and expert based on form_type
function getRatingFields(formType) {
  const fields = [];
  if (['procedural', 'clinical_management', 'communication'].includes(formType)) {
    fields.push({
      key: 'overall_rating',
      label: formType === 'communication' ? 'הערכה כללית' : 'הערכה כללית',
      internKey: 'intern_overall_rating',
      expertKey: 'expert_overall_rating'
    });
  }
  if (['procedural', 'clinical_management', 'ward_management', 'teaching_research'].includes(formType)) {
    fields.push({ key: 'knowledge', label: 'ידע בסיסי וקליני', internKey: 'intern_knowledge_rating', expertKey: 'expert_knowledge_rating' });
  }
  if (['procedural', 'clinical_management', 'ward_management'].includes(formType)) {
    fields.push({
      key: 'clinical_skill',
      label: formType === 'ward_management' ? 'ניהול עבודת צוות' : 'מיומנות קלינית',
      internKey: 'intern_clinical_skill_rating',
      expertKey: 'expert_clinical_skill_rating'
    });
  }
  if (['procedural', 'clinical_management', 'teaching_research', 'communication'].includes(formType)) {
    fields.push({
      key: 'communication',
      label: formType === 'teaching_research' ? 'כישורי הוראה ומחקר' : 'תקשורת בין אישית',
      internKey: 'intern_communication_rating',
      expertKey: 'expert_communication_rating'
    });
  }
  // independence as a binary (shown separately)
  return fields;
}

function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(n)}
          className={`w-7 h-7 rounded text-sm font-semibold border transition-colors ${
            value === n
              ? 'bg-teal-600 text-white border-teal-600'
              : readOnly
              ? (n <= value ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-slate-100 text-slate-400 border-slate-200')
              : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ExpertFeedbackDetailWithAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const expertId = urlParams.get('id');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [expertFeedback, setExpertFeedback] = useState({
    expert_overall_rating: 0,
    expert_knowledge_rating: 0,
    expert_clinical_skill_rating: 0,
    expert_communication_rating: 0,
    expert_independence: null,
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
        expert_overall_rating: 0,
        expert_knowledge_rating: 0,
        expert_clinical_skill_rating: 0,
        expert_communication_rating: 0,
        expert_independence: null,
        expert_verbal_feedback: ''
      });
    }
  });

  useEffect(() => {
    if (!expert) return;
    // השתמש ב-Expert entity id (לא user id) כי מומחים לאו דווקא הם users
    getOrCreateUserPoints(expertId, expert.name, 'expert').catch(() => {});
    sendExpertWeeklySummary(expertId, expert.name, expert.email).catch(() => {});
    checkExpertWeeklyReminder(expertId, expert.name, expert.email).catch(() => {});
  }, [expert?.id]);

  const pendingFeedbacks = allFeedbacks.filter(f => f.status === 'pending_expert_review');
  const completedFeedbacks = allFeedbacks.filter(f => f.status === 'completed');

  const handleStartEdit = (feedback) => {
    setEditingId(feedback.id);
    setExpertFeedback({
      expert_overall_rating: feedback.expert_overall_rating || 0,
      expert_knowledge_rating: feedback.expert_knowledge_rating || 0,
      expert_clinical_skill_rating: feedback.expert_clinical_skill_rating || 0,
      expert_communication_rating: feedback.expert_communication_rating || 0,
      expert_independence: feedback.expert_independence ?? null,
      expert_verbal_feedback: feedback.expert_verbal_feedback || ''
    });
  };

  const handleSubmitExpertFeedback = async (feedback) => {
    const ratingFields = getRatingFields(feedback.form_type || 'procedural');
    const hasAtLeastOneRating = ratingFields.some(f => (expertFeedback[f.expertKey] || 0) > 0) ||
                                 expertFeedback.expert_independence !== null;
    
    if (!hasAtLeastOneRating) {
      alert('יש למלא לפחות דירוג אחד');
      return;
    }

    updateFeedbackMutation.mutate({
      id: feedback.id,
      data: {
        ...feedback,
        expert_overall_rating: expertFeedback.expert_overall_rating > 0 ? expertFeedback.expert_overall_rating : null,
        expert_knowledge_rating: expertFeedback.expert_knowledge_rating > 0 ? expertFeedback.expert_knowledge_rating : null,
        expert_clinical_skill_rating: expertFeedback.expert_clinical_skill_rating > 0 ? expertFeedback.expert_clinical_skill_rating : null,
        expert_communication_rating: expertFeedback.expert_communication_rating > 0 ? expertFeedback.expert_communication_rating : null,
        expert_independence: expertFeedback.expert_independence,
        expert_verbal_feedback: expertFeedback.expert_verbal_feedback,
        expert_submitted_date: new Date().toISOString(),
        status: 'completed'
      }
    });

    // נקודות + ניקוי תזכורות
    try {
      const allUsers = await base44.entities.User.list();
      const allInterns = await base44.entities.Intern.list();

      // מצא user של המתמחה לפי intern_id -> email
      const internRecord = allInterns.find(i => i.id === feedback.intern_id);
      const internEmail = internRecord?.email || null;
      const internUser = internEmail ? allUsers.find(u => u.email === internEmail) : null;
      console.log('[ExpertFeedback] internRecord:', internRecord, '| internUser:', internUser);

      // מצא user של המומחה לפי expert entity email
      const expertEmail = expert?.email || null;
      const expertUser = expertEmail ? allUsers.find(u => u.email === expertEmail) : null;
      console.log('[ExpertFeedback] expert:', expert, '| expertUser:', expertUser);

      await onFeedbackCompleted({
        feedbackId: feedback.id,
        internId: feedback.intern_id,
        internName: feedback.intern_name,
        expertId,
        expertName: expert?.name,
        internEmail,
        expertEmail,
        internUserId: internUser?.id,
        expertUserId: expertUser?.id,
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

                    {/* Side-by-side comparison form */}
                    {editingId === feedback.id ? (
                      <div className="border-2 border-teal-300 rounded-xl overflow-hidden shadow-md">
                        <div className="divide-y divide-slate-100 bg-white">
                          {getRatingFields(feedback.form_type || 'procedural').map(field => (
                            <div key={field.key} className="px-3 py-3 space-y-2">
                              <span className="text-sm text-slate-700 font-semibold block">{field.label}</span>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-blue-600 font-medium">המתמחה</span>
                                  {(feedback[field.internKey] || 0) > 0
                                    ? <StarRating value={feedback[field.internKey]} readOnly />
                                    : <span className="text-xs text-slate-400">לא מילא</span>
                                  }
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-teal-600 font-medium">המומחה (אתה)</span>
                                  <StarRating
                                    value={expertFeedback[field.expertKey] || 0}
                                    onChange={v => setExpertFeedback(prev => ({ ...prev, [field.expertKey]: v }))}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Independence */}
                          {['procedural', 'clinical_management', 'ward_management'].includes(feedback.form_type) && (
                            <div className="px-3 py-3 space-y-2">
                              <span className="text-sm text-slate-700 font-semibold block">עצמאות</span>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-blue-600 font-medium">המתמחה</span>
                                  {feedback.intern_independence !== null && feedback.intern_independence !== undefined
                                    ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${feedback.intern_independence ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {feedback.intern_independence ? 'כן' : 'לא'}
                                      </span>
                                    : <span className="text-xs text-slate-400">—</span>
                                  }
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-teal-600 font-medium">המומחה (אתה)</span>
                                  <div className="flex gap-2">
                                    {[{ val: true, label: 'כן' }, { val: false, label: 'לא' }].map(opt => (
                                      <button key={String(opt.val)} type="button"
                                        onClick={() => setExpertFeedback(prev => ({ ...prev, expert_independence: opt.val }))}
                                        className={`px-3 py-1 text-xs rounded border font-medium transition-colors ${
                                          expertFeedback.expert_independence === opt.val
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                                        }`}
                                      >{opt.label}</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Verbal feedbacks */}
                        <div className="bg-slate-50 p-4 space-y-3 border-t border-slate-200">
                          {feedback.intern_verbal_feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-1">הערות המתמחה:</p>
                              <p className="text-sm text-slate-700">{feedback.intern_verbal_feedback}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs text-teal-700 font-semibold">המשוב המילולי שלך (אופציונלי)</Label>
                            <Textarea
                              value={expertFeedback.expert_verbal_feedback}
                              onChange={(e) => setExpertFeedback({ ...expertFeedback, expert_verbal_feedback: e.target.value })}
                              placeholder="הוסף משוב מילולי..."
                              className="min-h-[80px] text-sm"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button onClick={() => handleSubmitExpertFeedback(feedback)}
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                              <Send className="w-4 h-4 ml-2" />שלח משוב
                            </Button>
                            <Button variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Preview mode - show intern answers + fill button */
                      <div className="space-y-3">
                        {/* Intern summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-2">הערכה עצמית של המתמחה:</p>
                          <div className="space-y-1.5">
                            {getRatingFields(feedback.form_type || 'procedural').map(field => (
                              (feedback[field.internKey] || 0) > 0 && (
                                <div key={field.key} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">{field.label}</span>
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < feedback[field.internKey] ? 'fill-blue-400 text-blue-400' : 'text-slate-300'}`} />
                                    ))}
                                  </div>
                                </div>
                              )
                            ))}
                            {feedback.intern_independence !== null && feedback.intern_independence !== undefined && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">עצמאות</span>
                                <span className="text-xs font-medium text-blue-700">{feedback.intern_independence ? 'כן' : 'לא'}</span>
                              </div>
                            )}
                            {feedback.intern_verbal_feedback && (
                              <p className="text-xs text-slate-600 border-t border-blue-200 pt-1 mt-1">{feedback.intern_verbal_feedback}</p>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => handleStartEdit(feedback)}
                          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                          מלא משוב
                        </Button>
                      </div>
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