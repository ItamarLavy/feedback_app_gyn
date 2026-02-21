import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Calendar, Hash, Star, CheckCircle, AlertCircle, Send, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import RatingCategory from '../components/feedback/RatingCategory';
import { Input } from "@/components/ui/input";

const RATING_CATEGORIES = [
  { key: 'expert_knowledge_rating', label: 'ידע', description: 'רמת הידע התיאורטי והקליני' },
  { key: 'expert_manual_skill_rating', label: 'מיומנות מנואלית', description: 'יכולת ביצוע טכני' },
  { key: 'expert_professionalism_rating', label: 'מקצועיות', description: 'התנהלות מקצועית' },
  { key: 'expert_independence_rating', label: 'עצמאות', description: 'רמת עצמאות בפרוצדורה' }
];

export default function ExpertFeedbackDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const expertId = urlParams.get('id');
  const queryClient = useQueryClient();

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

  const handleSubmitExpertFeedback = (feedback) => {
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
  };

  if (!expert) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  const upcomingMeetings = expertMeetings.filter(m => !isPast(parseISO(m.meeting_date)) && m.status === 'מתוכנן');
  const pastMeetings = expertMeetings.filter(m => isPast(parseISO(m.meeting_date)) || m.status === 'התקיים');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
              {expert.name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{expert.name}</h1>
              <p className="text-slate-500 text-sm">משובים ופגישות</p>
            </div>
          </div>
          <Link 
            to={createPageUrl('Experts')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            חזרה
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              פגישות משוב קרובות ({upcomingMeetings.length})
            </h2>
            <div className="space-y-3">
              {upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="border-2 border-purple-300 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-slate-600" />
                          <span className="font-semibold text-slate-800">{meeting.intern_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{format(parseISO(meeting.meeting_date), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>
                      <Badge className="bg-purple-600">מתוכנן</Badge>
                    </div>
                    {meeting.notes && (
                      <p className="text-sm text-slate-600 mt-2 border-t border-purple-200 pt-2">{meeting.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">פגישות שהתקיימו ({pastMeetings.length})</h2>
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

        {/* Pending Feedbacks */}
        {pendingFeedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              ממתינים למילוי משוב ({pendingFeedbacks.length})
            </h2>
            <div className="space-y-4">
              {pendingFeedbacks.map(feedback => (
                <Card key={feedback.id} className="border-2 border-amber-300 bg-amber-50">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-semibold text-blue-900 mb-3">משוב עצמי של המתמחה:</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {feedback.intern_knowledge_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-slate-600">ידע:</span>
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
                        <p className="text-sm text-slate-700 border-t border-blue-200 pt-2">{feedback.intern_verbal_feedback}</p>
                      )}
                    </div>

                    {/* Expert Feedback Form */}
                    {editingId === feedback.id ? (
                      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-4">
                        <p className="font-semibold text-purple-900">המשוב שלך:</p>
                        
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
                            className="bg-purple-600 hover:bg-purple-700"
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
                        className="w-full bg-purple-600 hover:bg-purple-700"
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

        {/* Completed Feedbacks */}
        {completedFeedbacks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              משובים שהושלמו ({completedFeedbacks.length})
            </h2>
            <div className="space-y-3">
              {completedFeedbacks.map(feedback => (
                <Card key={feedback.id} className="bg-white border-2 border-green-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-teal-700 font-semibold">{feedback.procedure_id_code}</span>
                        <Badge className="bg-green-600 text-xs">הושלם</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                      <User className="w-4 h-4 text-teal-600" />
                      <span className="font-medium">{feedback.intern_name}</span>
                    </div>
                    <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-3">
                      {feedback.procedure_type}
                    </div>

                    {/* Ratings Comparison */}
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      {(feedback.intern_knowledge_rating > 0 || feedback.expert_knowledge_rating > 0) && (
                        <div>
                          <div className="text-xs text-slate-600 font-medium mb-1">ידע</div>
                          <div className="flex items-center gap-3 text-sm">
                            {feedback.intern_knowledge_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">מתמחה:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.intern_knowledge_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {feedback.expert_knowledge_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">אני:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.expert_knowledge_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(feedback.intern_manual_skill_rating > 0 || feedback.expert_manual_skill_rating > 0) && (
                        <div>
                          <div className="text-xs text-slate-600 font-medium mb-1">מיומנות מנואלית</div>
                          <div className="flex items-center gap-3 text-sm">
                            {feedback.intern_manual_skill_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">מתמחה:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.intern_manual_skill_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {feedback.expert_manual_skill_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">אני:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.expert_manual_skill_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(feedback.intern_professionalism_rating > 0 || feedback.expert_professionalism_rating > 0) && (
                        <div>
                          <div className="text-xs text-slate-600 font-medium mb-1">מקצועיות</div>
                          <div className="flex items-center gap-3 text-sm">
                            {feedback.intern_professionalism_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">מתמחה:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.intern_professionalism_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {feedback.expert_professionalism_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">אני:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.expert_professionalism_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(feedback.intern_independence_rating > 0 || feedback.expert_independence_rating > 0) && (
                        <div>
                          <div className="text-xs text-slate-600 font-medium mb-1">עצמאות</div>
                          <div className="flex items-center gap-3 text-sm">
                            {feedback.intern_independence_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">מתמחה:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.intern_independence_rating ? 'fill-blue-400 text-blue-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {feedback.expert_independence_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">אני:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= feedback.expert_independence_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verbal Feedback */}
                    {(feedback.intern_verbal_feedback || feedback.expert_verbal_feedback) && (
                      <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                        {feedback.intern_verbal_feedback && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-700 font-semibold mb-1">משוב עצמי של המתמחה:</p>
                            <p className="text-sm text-slate-700">{feedback.intern_verbal_feedback}</p>
                          </div>
                        )}
                        {feedback.expert_verbal_feedback && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs text-purple-700 font-semibold mb-1">המשוב שלי:</p>
                            <p className="text-sm text-slate-700">{feedback.expert_verbal_feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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