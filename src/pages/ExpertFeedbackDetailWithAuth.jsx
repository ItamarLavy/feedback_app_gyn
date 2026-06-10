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
import { ArrowLeft, User, Calendar, Hash, Star, CheckCircle, AlertCircle, Send, Clock, MapPin, ChevronDown } from 'lucide-react';
import SendFeedbackTask from '@/components/feedback/SendFeedbackTask';
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
          className={`w-9 h-9 rounded text-sm font-semibold border transition-colors ${
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
  // intern_id used when a senior intern (תורן 1 מתקדם) acts as mentor
  const seniorInternId = urlParams.get('intern_id');
  const effectiveId = expertId || seniorInternId;
  const isSeniorInternMode = !!seniorInternId && !expertId;

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [expandedId, setExpandedId] = useState(null);
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
    queryKey: ['expert', effectiveId, isSeniorInternMode],
    queryFn: async () => {
      if (isSeniorInternMode) {
        // תורן 1 מתקדם - משתמש כמנטור
        const interns = await base44.entities.Intern.list();
        const intern = interns.find(i => i.id === seniorInternId);
        return intern ? { ...intern, _isSeniorIntern: true } : null;
      }
      const experts = await base44.entities.Expert.list();
      return experts.find(e => e.id === expertId);
    },
    enabled: !!effectiveId
  });

  const { data: allFeedbacks = [] } = useQuery({
    queryKey: ['feedbacks-for-expert', effectiveId],
    queryFn: () => base44.entities.Feedback.filter({ expert_id: effectiveId }, '-created_date'),
    enabled: !!effectiveId
  });

  const { data: expertMeetings = [] } = useQuery({
    queryKey: ['expert-meetings', effectiveId],
    queryFn: async () => {
      const allMeetings = await base44.entities.FeedbackMeeting.list('-meeting_date');
      return allMeetings.filter(m => 
        m.invited_experts && m.invited_experts.some(e => e.id === effectiveId)
      );
    },
    enabled: !!effectiveId
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
    if (!expert || isSeniorInternMode) return;
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
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-40 md:pb-12">
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

        {/* Send Feedback Task */}
        {!isSeniorInternMode && (
          <div className="mb-8">
            <SendFeedbackTask expertId={expertId} expertName={expert.name} />
          </div>
        )}

        {/* Meetings - Collapsible */}
        {(upcomingMeetings.length > 0 || pastMeetings.length > 0) && (
          <div className="mb-8">
            <details className="bg-white rounded-lg border border-slate-200 shadow-lg">
              <summary className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 font-medium text-slate-700 flex items-center gap-2 transition-colors">
                <Calendar className="w-4 h-4" />
                שיחות משוב ({upcomingMeetings.length + pastMeetings.length})
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
            <div className="space-y-2">
              {pendingFeedbacks.map(feedback => {
                const isExpanded = expandedId === feedback.id;
                const isEditing = editingId === feedback.id;
                return (
                  <div key={feedback.id} className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-sm overflow-hidden">
                    {/* Row - always visible */}
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-amber-100/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="font-mono text-teal-700 text-sm font-semibold">{feedback.procedure_id_code}</span>
                        <span className="text-slate-400 hidden sm:inline">•</span>
                        <span className="text-slate-800 font-medium truncate hidden sm:inline">{feedback.intern_name}</span>
                        <span className="text-slate-600 text-sm truncate">{feedback.procedure_type}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-amber-600 text-xs hidden sm:inline-flex">ממתין</Badge>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-amber-200">
                        {/* Procedure Info */}
                        <div className="bg-white rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700 font-medium">{feedback.intern_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{feedback.procedure_date ? format(new Date(feedback.procedure_date), 'dd/MM/yyyy') : 'לא צוין'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500">פרוצדורה: </span>
                            <span className="font-medium text-slate-700">{feedback.procedure_type}</span>
                          </div>
                        </div>

                        {/* Intern self-ratings - always visible */}
                        {(() => {
                          const fields = getRatingFields(feedback.form_type || 'procedural');
                          const hasInternRatings = fields.some(f => (feedback[f.internKey] || 0) > 0) || feedback.intern_verbal_feedback;
                          return hasInternRatings ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                              <p className="text-xs font-semibold text-blue-700 mb-1">הערכה עצמית של המתמחה:</p>
                              {fields.filter(f => (feedback[f.internKey] || 0) > 0).map(f => (
                                <div key={f.key} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">{f.label}</span>
                                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < (feedback[f.internKey] || 0) ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />)}</div>
                                </div>
                              ))}
                              {feedback.intern_independence !== undefined && feedback.intern_independence !== null && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">עצמאות</span>
                                  <span className={`font-medium ${feedback.intern_independence ? 'text-green-600' : 'text-red-500'}`}>{feedback.intern_independence ? 'כן' : 'לא'}</span>
                                </div>
                              )}
                              {feedback.intern_verbal_feedback && (
                                <p className="text-xs text-blue-800 border-t border-blue-200 pt-2 mt-1">{feedback.intern_verbal_feedback}</p>
                              )}
                            </div>
                          ) : null;
                        })()}

                        {/* Form or fill button */}
                        {isEditing ? (
                          <div className="border-2 border-teal-300 rounded-xl overflow-hidden shadow-md">
                            <div className="divide-y divide-slate-100 bg-white">
                              {getRatingFields(feedback.form_type || 'procedural').map(field => (
                                <div key={field.key} className="px-3 py-3 space-y-2">
                                  <span className="text-sm text-slate-700 font-semibold block">{field.label}</span>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-xs text-teal-600 font-medium">הערכתך</span>
                                      <StarRating
                                        value={expertFeedback[field.expertKey] || 0}
                                        onChange={v => setExpertFeedback(prev => ({ ...prev, [field.expertKey]: v }))}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {['procedural', 'clinical_management', 'ward_management'].includes(feedback.form_type) && (
                                <div className="px-3 py-3 space-y-2">
                                  <span className="text-sm text-slate-700 font-semibold block">עצמאות</span>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-xs text-teal-600 font-medium">הערכתך</span>
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
                            <div className="bg-slate-50 p-4 space-y-3 border-t border-slate-200">
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
                          <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              מלא את המשוב שלך תחילה — הערכת המתמחה תוצג לאחר השליחה
                            </div>
                            <Button onClick={() => handleStartEdit(feedback)}
                              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                              מלא משוב
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

                    {/* השוואת שני הצדדים - גלויה רק אחרי הגשה */}
                    <details className="mt-2">
                      <summary className="text-xs text-green-700 cursor-pointer font-medium hover:text-green-900">הצג השוואת הערכות</summary>
                      <div className="mt-2 divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 overflow-hidden">
                        {getRatingFields(feedback.form_type || 'procedural').map(field => (
                          ((feedback[field.internKey] || 0) > 0 || (feedback[field.expertKey] || 0) > 0) && (
                            <div key={field.key} className="px-3 py-2">
                              <span className="text-xs font-semibold text-slate-600 block mb-1">{field.label}</span>
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-[10px] text-blue-500">מתמחה</span>
                                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < (feedback[field.internKey] || 0) ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />)}</div>
                                </div>
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-[10px] text-teal-500">מומחה</span>
                                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < (feedback[field.expertKey] || 0) ? 'fill-teal-400 text-teal-400' : 'text-slate-200'}`} />)}</div>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                        {(feedback.intern_verbal_feedback || feedback.expert_verbal_feedback) && (
                          <div className="px-3 py-2 space-y-1">
                            {feedback.intern_verbal_feedback && <p className="text-xs text-blue-700"><span className="font-semibold">מתמחה: </span>{feedback.intern_verbal_feedback}</p>}
                            {feedback.expert_verbal_feedback && <p className="text-xs text-teal-700"><span className="font-semibold">מומחה: </span>{feedback.expert_verbal_feedback}</p>}
                          </div>
                        )}
                      </div>
                    </details>
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