import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Star } from 'lucide-react';

const RATING_KEYS = ['knowledge_rating', 'manual_skill_rating', 'professionalism_rating', 'independence_rating'];

function getAvgRating(feedback) {
  const ratings = RATING_KEYS.map(key => feedback[key]).filter(r => r && r > 0);
  return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}

export default function AnomalousReports({ feedbacks, interns }) {
  // מציאת משובים חריגים (גבוהים מאוד או נמוכים מאוד)
  const anomalousHighFeedbacks = feedbacks.filter(f => {
    const avg = getAvgRating(f);
    return avg >= 4.5;
  });

  const anomalousLowFeedbacks = feedbacks.filter(f => {
    const avg = getAvgRating(f);
    return avg > 0 && avg <= 2;
  });

  // מציאת טרנדים חריגים (3 משובים ברצף טובים או רעים)
  const internTrends = [];
  
  interns.forEach(intern => {
    const internFeedbacks = feedbacks
      .filter(f => f.intern_id === intern.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    if (internFeedbacks.length >= 3) {
      const recent3 = internFeedbacks.slice(0, 3);
      const avgRatings = recent3.map(f => getAvgRating(f));
      const avgOfRecent3 = avgRatings.reduce((a, b) => a + b, 0) / 3;

      if (avgOfRecent3 >= 4.5) {
        internTrends.push({
          intern,
          type: 'positive',
          avgRating: avgOfRecent3.toFixed(1),
          feedbacks: recent3
        });
      } else if (avgOfRecent3 <= 2) {
        internTrends.push({
          intern,
          type: 'negative',
          avgRating: avgOfRecent3.toFixed(1),
          feedbacks: recent3
        });
      }
    }
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          משובים וטרנדים חריגים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Positive Trends */}
        {internTrends.filter(t => t.type === 'positive').length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-slate-800">טרנד חיובי (3 משובים גבוהים ברצף)</h3>
            </div>
            <div className="space-y-2">
              {internTrends.filter(t => t.type === 'positive').map((trend, idx) => (
                <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{trend.intern.name}</span>
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <Star className="w-3 h-3 ml-1" />
                      {trend.avgRating}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    3 המשובים האחרונים עם דירוג ממוצע {trend.avgRating}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Trends */}
        {internTrends.filter(t => t.type === 'negative').length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-slate-800">טרנד שלילי (3 משובים נמוכים ברצף)</h3>
            </div>
            <div className="space-y-2">
              {internTrends.filter(t => t.type === 'negative').map((trend, idx) => (
                <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{trend.intern.name}</span>
                    <Badge className="bg-red-600 hover:bg-red-700">
                      <Star className="w-3 h-3 ml-1" />
                      {trend.avgRating}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    3 המשובים האחרונים עם דירוג ממוצע {trend.avgRating} - דורש התייחסות
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Individual Feedbacks */}
        {anomalousHighFeedbacks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              משובים מצוינים (דירוג 4.5+)
            </h3>
            <div className="space-y-2">
              {anomalousHighFeedbacks.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{feedback.intern_name}</span>
                      <span className="text-slate-500 text-sm mx-2">•</span>
                      <span className="text-slate-600 text-sm">{feedback.procedure_type}</span>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700">
                      {getAvgRating(feedback).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Individual Feedbacks */}
        {anomalousLowFeedbacks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              משובים דורשי תשומת לב (דירוג 2 ומטה)
            </h3>
            <div className="space-y-2">
              {anomalousLowFeedbacks.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{feedback.intern_name}</span>
                      <span className="text-slate-500 text-sm mx-2">•</span>
                      <span className="text-slate-600 text-sm">{feedback.procedure_type}</span>
                    </div>
                    <Badge className="bg-red-600 hover:bg-red-700">
                      {getAvgRating(feedback).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No anomalies */}
        {internTrends.length === 0 && anomalousHighFeedbacks.length === 0 && anomalousLowFeedbacks.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>אין משובים או טרנדים חריגים כרגע</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}