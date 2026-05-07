import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FeedbackCardDetailed from '../components/feedback/FeedbackCardDetailed';
import InternStats from '../components/admin/InternStats';
import { User, ArrowLeft, ClipboardList, ListChecks, Shield } from 'lucide-react';
import AIProgressSummary from '../components/admin/AIProgressSummary';
import RotationPlanEditor from '../components/admin/RotationPlanEditor';
import InternFilesManager from '../components/admin/InternFilesManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

// מפתח כמויות הפרוצדורות הנדרשות
const PROCEDURE_REQUIREMENTS = {
  "OB": {
    "יולדות-ביקורים עם מתמחה": 5,
    "יולדות-ביקור לבד- להציג את הביקור": 2,
    "ביקור יולדות- הצגה לרופא בכיר": 1,
    "יולדות-לעבור על10 מכתבי שחרור (5 פסיולוגי 5 קיסרי)": 10,
    "יולדות - מכתב שחרור קרע מתקדם": 2,
    "יולדות - מכתב שחרור מורכב": 2,
    "קבלה לקיסרי - צפיה": 1,
    "קבלה לקיסרי - יום קבלות": 2,
    "קיסרי- הכרת המטופלת, השכבה, רחצה": 3,
    "הכנסת קטטר": 3,
    "כתיבת דו\"ח ניתוח": 3,
    "טיפול ביולדת -טיפול בחום אחרי לידה וכו'": 7,
    "PV - אחרי מיילדת או רופא": 10,
    "הכנסת בלון": 4,
    "תפירה בחדר לידה": 10,
    "פענוח מוניטור": 1,
    "BPP": 1,
    "קבלה במיון יולדות- אנמנזה, אינטראקציה, כיתוב": 20,
    "קבלה בחדר לידה/ ביקור בחדר לידה": 5,
    "ליווי יולדת בחדר לידה, כולל קבלת לידה (לפחות 5 לידות ראשונות)": 5,
    "ייעוץ לTOLAC כולל הבנה של התווית נגד": 5,
    "אם ועובר-ניהול יום במחלקה": 20,
    "אם ועובר-העברת מקל בישיבת העברה": 5,
    "מכתבי שחרור": 6,
    "ניהול מעקב הריון רגיל": 3,
    "ניתוח קיסרי כעוזר": 10,
    "ניתוח קיסרי כמנתח ראשון": 1,
    "ניהול השראת לידה": 15,
    "ניהול TOLAC": 10,
    "אפיזיוטומיה - ביצוע": 5,
    "טיפול ביולדת -טיפול במקרה חירום מורכב אחרי לידה": 5,
    "ניהול מקרה במיון המיילדותי": 3,
    "שליטה וניהול עמדת המיון המיילדותי": 3,
    "ניהול מקרה של הריון בסיכון גבוה (אשפוז יום)": 5,
    "ניהול מקרה חירום מיילדותי": 5,
    "ניהול לידה מורכבת": 10,
    "ניהול PPH בחדר לידה": 10,
    "Revision": 5,
    "Manual lysis": 5,
    "ניהול לידת תאומים": 5,
    "לידת VACUUM": 5,
    "תפירה מורכבת כולל אבחנה של OASIS": 10,
    "ביצוע קיסרי מורכב": 5,
    "ניהול חדר לידה ותורנות": 5
  },
  "GYN": {
    "קבלה במיון נשים": 10,
    "קבלה בטרום ניתוח": 5,
    "מעבר על תיק מטופלת - ובדיקת רשימת תיוג": 3,
    "הכנסת מטופלת לחדר ניתוח, כולל השכבה, SIGN IN, הכנת ציוד ורחצה": 5,
    "הבנה של שלבי הניתוח פשוט": 5,
    "תפירה וקשירה": 5,
    "כתיבת דו\"ח ניתוח": 10,
    "ניהול יום במחלקה (כולל כל שלבי היום)": 5,
    "ניהול ביקור בוקר (הכרת נשים, הצגה, תוכנית, רישום)": 5,
    "מכתבי שחרור": 6,
    "מענה ראשוני למצב חירום": 3,
    "העברת מקל בישיבת העברה": 3,
    "ניהול מקרה במיון הגינקולוגי (ניהול מלא כולל מעבר לחדר ניתוח במידת הצורך)": 5,
    "טיפול במטופלת עם סיבוכי הריון צעיר (הפלה מאיימת, אקטופי מסוגים שונים)": 5,
    "טיפול למטופלת במרפאת נשים": 5,
    "בדיקת PAP/HPV": 2,
    "פיפל": 2,
    "הוצאת IUD": 3,
    "הידרוסונוגרפיה": 3,
    "הפסקת הריון": 5,
    "ייעוץ על מניעת הריון": 5,
    "טיפול בהפלה נדחית": 5,
    "הכנסת IUD": 3,
    "ניתוחים קטנים (גרידות, ברתולין)": 15,
    "עזרה בלפרוסקופיה והיסטרוסקופיה": 7,
    "ניהול מקרה גינקולוגי אמבולטורי מורכב": 5,
    "מקרה ילדות ומתבגרות": 3,
    "קוניזציה": 3,
    "ייעוץ לנשים עם תלונות של רצפת האגן": 5,
    "הערכה לנשים עם אנדומטרוזיס": 5,
    "היסטרוסקופיה ניתוחית": 5,
    "כריתת רחם": 5,
    "ניתוחי של רצפת האגן כולל TVH": 3,
    "ניתוח פתוח": 5,
    "טיפול של סיבוכים של ניתוחים": 5
  },
  "IVF": {
    "הערכה של מטופלת/זוג עם אי פוריות כולל תוכנית טיפול": 3,
    "כתיבת הנחיות לפרופיל הורמונלי ופענוח תשובה": 3,
    "הנחיות בדיקת זרע ופענוח בדיקת זרע": 3,
    "הערכה של מדדי רזרבה שחלתית": 3,
    "ביצוע בדיקת US למטופלת פריון: AFC, שחלות, הערכת רחם": 3,
    "הערכה של מטופלת עם הפלות חוזרות/RPF": 3,
    "הערכה של מטופלת לשימור פוריות": 2,
    "הערכת מטופל/ת ל PGT": 1,
    "ניהול מטופלת בתהליך של IVF": 3,
    "בירור אי פוריות גבר": 3,
    "IUI": 2,
    "השראת ביוץ": 3,
    "ניהול סיבוכים של ART": 1
  },
  "ONCO": {
    "מקרה אמבולטורי של ממאירות גינקולוגית": 3,
    "חדר ניתוח": 3,
    "אשפוז יום": 3,
    "מחלקה": 3,
    "קולפוסקופיה": 3
  },
  "כללי": {
    "אורך צוואר": 5,
    "הערכת משקל": 10,
    "דופלר של חבל הטבור": 4,
    "הריון צעיר": 10,
    "פתולוגיה בטפולות": 10,
    "מסירת בשורות רעות -תקשורת מתקדמת על בשורות רעות": 3,
    "מחקר, הבנת הספרות": 3,
    "הוראה": 5,
    "ניהול תורנות כתורן ראשון": 5,
    "מחקר ופרסום": 1
  }
};

export default function InternDetails() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
              {intern?.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{intern?.name || 'טוען...'}</h1>
              <p className="text-slate-500">פרופיל מתמחה</p>
            </div>
          </div>
          <Link 
             to={createPageUrl('Admin')}
             className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
           >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <InternStats 
            feedbacks={feedbacks} 
            internName={intern?.name}
          />
        </div>

        {/* Rotation Plan */}
        <div className="mb-8">
          <RotationPlanEditor intern={intern} />
        </div>

        {/* Intern Files */}
        <div className="mb-8">
          <InternFilesManager intern={intern} />
        </div>

        {/* AI Summary */}
        <div className="mb-8">
          <AIProgressSummary intern={intern} feedbacks={feedbacks} manualCounts={manualCounts} internFiles={internFiles} />
        </div>

        {/* Detailed Progress Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowDetailedProgress(!showDetailedProgress)}
            className="w-full bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 h-12"
          >
            <ListChecks className="w-5 h-5 ml-2" />
            {showDetailedProgress ? 'הסתר' : 'הצג'} התקדמות מפורטת לפי פרוצדורות
          </Button>
        </div>

        {/* Detailed Progress by Category */}
        {showDetailedProgress && (
          <div className="space-y-6 mb-8">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <Card key={category} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category}</span>
                    <Badge className="bg-teal-600">
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
                              proc.percentage >= 100 ? 'bg-green-500' : 'bg-teal-500'
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
        )}

        {/* Feedbacks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              משובים ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map(feedback => (
                <FeedbackCardDetailed 
                  key={feedback.id} 
                  feedback={feedback} 
                  showDelete={true}
                  onDelete={handleDeleteFeedback}
                />
              ))}
              {feedbacks.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  אין משובים עדיין למתמחה זה
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}