import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SystemAISummary({ feedbacks, interns, meetings }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const generateSystemSummary = async () => {
    setIsLoadingSummary(true);

    // סטטיסטיקות כלליות
    const totalFeedbacks = feedbacks.length;
    const pendingExpertReviews = feedbacks.filter(f => f.status === 'pending_expert_review').length;
    const completedReviews = feedbacks.filter(f => f.status === 'completed').length;

    // חישוב ממוצע דירוגי מומחים
    const expertRatings = [];
    feedbacks.forEach(f => {
      ['expert_knowledge_rating', 'expert_manual_skill_rating', 'expert_professionalism_rating', 'expert_independence_rating'].forEach(key => {
        if (f[key] && f[key] > 0) expertRatings.push(f[key]);
      });
    });
    const avgExpertRating = expertRatings.length > 0 
      ? (expertRatings.reduce((a, b) => a + b, 0) / expertRatings.length).toFixed(1)
      : 0;

    // פגישות קרובות
    const upcomingMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.meeting_date);
      return meetingDate > new Date() && m.status === 'מתוכנן';
    }).length;

    // טרנדים של מתמחים
    const internTrends = interns.map(intern => {
      const internFeedbacks = feedbacks
        .filter(f => f.intern_id === intern.id && f.status === 'completed')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 3);

      if (internFeedbacks.length < 2) return null;

      const avgRatings = internFeedbacks.map(f => {
        const ratings = [];
        if (f.expert_knowledge_rating) ratings.push(f.expert_knowledge_rating);
        if (f.expert_manual_skill_rating) ratings.push(f.expert_manual_skill_rating);
        if (f.expert_professionalism_rating) ratings.push(f.expert_professionalism_rating);
        if (f.expert_independence_rating) ratings.push(f.expert_independence_rating);
        return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      });

      if (avgRatings.length < 2) return null;

      const firstAvg = avgRatings[avgRatings.length - 1];
      const lastAvg = avgRatings[0];
      const trend = lastAvg - firstAvg;

      return {
        name: intern.name,
        trend: trend > 0.5 ? 'עולה' : trend < -0.5 ? 'יורד' : 'יציב',
        value: trend.toFixed(1)
      };
    }).filter(Boolean);

    const positiveInterns = internTrends.filter(t => t.trend === 'עולה');
    const negativeInterns = internTrends.filter(t => t.trend === 'יורד');

    // בניית הפרומפט
    const prompt = `אתה מנהל מחלקה רפואית. להלן נתוני המערכת:

סך הכל משובים: ${totalFeedbacks}
משובים שהושלמו: ${completedReviews}
משובים ממתינים למומחה: ${pendingExpertReviews}
ממוצע דירוגי מומחים: ${avgExpertRating}/5
פגישות משוב מתוכננות: ${upcomingMeetings}

מתמחים עם טרנד חיובי: ${positiveInterns.length > 0 ? positiveInterns.map(i => `${i.name} (שיפור של ${i.value})`).join(', ') : 'אין'}
מתמחים עם טרנד שלילי: ${negativeInterns.length > 0 ? negativeInterns.map(i => `${i.name} (ירידה של ${i.value})`).join(', ') : 'אין'}

כתוב 1-2 פסקאות מסכמות את מצב המערכת כרגע:
- מה מצב המשובים שמחכים למומחה
- אם יש מתמחים עם טרנד טוב או רע
- מה הפגישות שיש באופק
- כמה משובים מולאו סך הכל
- מה הממוצע הכללי של דירוגי המומחים

כתוב בעברית, בצורה מקצועית וממוקדת.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" }
        }
      }
    });

    setAiSummary(result.summary);
    setIsLoadingSummary(false);
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          סיכום AI - מצב המערכת
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aiSummary ? (
          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aiSummary}</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 mb-4">קבל סיכום מקיף של מצב המערכת כרגע</p>
            <Button
              onClick={generateSystemSummary}
              disabled={isLoadingSummary}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoadingSummary ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייצר סיכום...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור סיכום AI
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}