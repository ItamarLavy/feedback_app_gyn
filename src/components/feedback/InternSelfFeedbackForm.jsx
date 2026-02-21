import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Info, Calendar, AlertCircle, Hash } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import RatingCategory from './RatingCategory';

const PROCEDURE_CATEGORIES = {
  "OB": [
    "יולדות-ביקורים עם מתמחה",
    "יולדות-ביקור לבד- להציג את הביקור",
    "ביקור יולדות- הצגה לרופא בכיר",
    "יולדות-לעבור על10 מכתבי שחרור (5 פסיולוגי 5 קיסרי)",
    "יולדות - מכתב שחרור קרע מתקדם",
    "יולדות - מכתב שחרור מורכב",
    "קבלה לקיסרי - צפיה",
    "קבלה לקיסרי - יום קבלות",
    "קיסרי- הכרת המטופלת, השכבה, רחצה",
    "הכנסת קטטר",
    "כתיבת דו\"ח ניתוח",
    "טיפול ביולדת -טיפול בחום אחרי לידה וכו'",
    "PV - אחרי מיילדת או רופא",
    "הכנסת בלון",
    "תפירה בחדר לידה",
    "פענוח מוניטור",
    "BPP",
    "קבלה במיון יולדות- אנמנזה, אינטראקציה, כיתוב",
    "קבלה בחדר לידה/ ביקור בחדר לידה",
    "ליווי יולדת בחדר לידה, כולל קבלת לידה (לפחות 5 לידות ראשונות)",
    "ייעוץ לTOLAC כולל הבנה של התווית נגד",
    "אם ועובר-ניהול יום במחלקה",
    "אם ועובר-העברת מקל בישיבת העברה",
    "מכתבי שחרור",
    "ניהול מעקב הריון רגיל",
    "ניתוח קיסרי כעוזר",
    "ניתוח קיסרי כמנתח ראשון",
    "ניהול השראת לידה",
    "ניהול TOLAC",
    "אפיזיוטומיה - ביצוע",
    "טיפול ביולדת -טיפול במקרה חירום מורכב אחרי לידה",
    "ניהול מקרה במיון המיילדותי",
    "שליטה וניהול עמדת המיון המיילדותי",
    "ניהול מקרה של הריון בסיכון גבוה (אשפוז יום)",
    "ניהול מקרה חירום מיילדותי",
    "ניהול לידה מורכבת",
    "ניהול PPH בחדר לידה",
    "Revision",
    "Manual lysis",
    "ניהול לידת תאומים",
    "לידת VACUUM",
    "תפירה מורכבת כולל אבחנה של OASIS",
    "ביצוע קיסרי מורכב",
    "ניהול חדר לידה ותורנות"
  ],
  "GYN": [
    "קבלה במיון נשים",
    "קבלה בטרום ניתוח",
    "מעבר על תיק מטופלת - ובדיקת רשימת תיוג",
    "הכנסת מטופלת לחדר ניתוח, כולל השכבה, SIGN IN, הכנת ציוד ורחצה",
    "הבנה של שלבי הניתוח פשוט",
    "תפירה וקשירה",
    "כתיבת דו\"ח ניתוח",
    "ניהול יום במחלקה (כולל כל שלבי היום)",
    "ניהול ביקור בוקר (הכרת נשים, הצגה, תוכנית, רישום)",
    "מכתבי שחרור",
    "מענה ראשוני למצב חירום",
    "העברת מקל בישיבת העברה",
    "ניהול מקרה במיון הגינקולוגי (ניהול מלא כולל מעבר לחדר ניתוח במידת הצורך)",
    "טיפול במטופלת עם סיבוכי הריון צעיר (הפלה מאיימת, אקטופי מסוגים שונים)",
    "טיפול למטופלת במרפאת נשים",
    "בדיקת PAP/HPV",
    "פיפל",
    "הוצאת IUD",
    "הידרוסונוגרפיה",
    "הפסקת הריון",
    "ייעוץ על מניעת הריון",
    "טיפול בהפלה נדחית",
    "הכנסת IUD",
    "ניתוחים קטנים (גרידות, ברתולין)",
    "עזרה בלפרוסקופיה והיסטרוסקופיה",
    "ניהול מקרה גינקולוגי אמבולטורי מורכב",
    "מקרה ילדות ומתבגרות",
    "קוניזציה",
    "ייעוץ לנשים עם תלונות של רצפת האגן",
    "הערכה לנשים עם אנדומטרוזיס",
    "היסטרוסקופיה ניתוחית",
    "כריתת רחם",
    "ניתוחי של רצפת האגן כולל TVH",
    "ניתוח פתוח",
    "טיפול של סיבוכים של ניתוחים"
  ],
  "IVF": [
    "הערכה של מטופלת/זוג עם אי פוריות כולל תוכנית טיפול",
    "כתיבת הנחיות לפרופיל הורמונלי ופענוח תשובה",
    "הנחיות בדיקת זרע ופענוח בדיקת זרע",
    "הערכה של מדדי רזרבה שחלתית",
    "ביצוע בדיקת US למטופלת פריון: AFC, שחלות, הערכת רחם",
    "הערכה של מטופלת עם הפלות חוזרות/RPF",
    "הערכה של מטופלת לשימור פוריות",
    "הערכת מטופל/ת ל PGT",
    "ניהול מטופלת בתהליך של IVF",
    "בירור אי פוריות גבר",
    "IUI",
    "השראת ביוץ",
    "ניהול סיבוכים של ART"
  ],
  "ONCO": [
    "מקרה אמבולטורי של ממאירות גינקולוגית",
    "חדר ניתוח",
    "אשפוז יום",
    "מחלקה",
    "קולפוסקופיה"
  ],
  "כללי": [
    "אורך צוואר",
    "הערכת משקל",
    "דופלר של חבל הטבור",
    "הריון צעיר",
    "פתולוגיה בטפולות",
    "מסירת בשורות רעות -תקשורת מתקדמת על בשורות רעות",
    "מחקר, הבנת הספרות",
    "הוראה",
    "ניהול תורנות כתורן ראשון",
    "מחקר ופרסום"
  ]
};

const RATING_CATEGORIES = [
  { key: 'intern_knowledge_rating', label: 'ידע', description: 'רמת הידע התיאורטי והקליני שלי' },
  { key: 'intern_manual_skill_rating', label: 'מיומנות מנואלית', description: 'יכולת הביצוע הטכני שלי' },
  { key: 'intern_professionalism_rating', label: 'מקצועיות', description: 'ההתנהלות המקצועית שלי' },
  { key: 'intern_independence_rating', label: 'עצמאות', description: 'רמת העצמאות שלי בפרוצדורה זו' }
];

function generateProcedureCode(count) {
  return `#${String(count + 1).padStart(3, '0')}`;
}

export default function InternSelfFeedbackForm({ interns, experts, onSuccess }) {
  const [formData, setFormData] = useState({
    intern_id: '',
    expert_id: '',
    procedure_category: '',
    procedure_type: '',
    procedure_date: '',
    intern_knowledge_rating: 0,
    intern_manual_skill_rating: 0,
    intern_professionalism_rating: 0,
    intern_independence_rating: 0,
    intern_verbal_feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [procedureCode, setProcedureCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedIntern = interns.find(i => i.id === formData.intern_id);
    const selectedExpert = experts.find(e => e.id === formData.expert_id);

    // Generate procedure code
    const existingFeedbacks = await base44.entities.Feedback.list();
    const code = generateProcedureCode(existingFeedbacks.length);

    const dataToSave = {
      procedure_id_code: code,
      intern_id: formData.intern_id,
      intern_name: selectedIntern?.name,
      expert_id: formData.expert_id,
      expert_name: selectedExpert?.name,
      procedure_category: formData.procedure_category,
      procedure_type: formData.procedure_type,
      procedure_date: formData.procedure_date,
      intern_verbal_feedback: formData.intern_verbal_feedback,
      intern_submitted_date: new Date().toISOString(),
      status: 'pending_expert_review'
    };

    if (formData.intern_knowledge_rating > 0) dataToSave.intern_knowledge_rating = formData.intern_knowledge_rating;
    if (formData.intern_manual_skill_rating > 0) dataToSave.intern_manual_skill_rating = formData.intern_manual_skill_rating;
    if (formData.intern_professionalism_rating > 0) dataToSave.intern_professionalism_rating = formData.intern_professionalism_rating;
    if (formData.intern_independence_rating > 0) dataToSave.intern_independence_rating = formData.intern_independence_rating;

    await base44.entities.Feedback.create(dataToSave);

    // שליחת מיילים
    try {
      // מייל למתמחה - סיכום פרוצדורות
      if (selectedIntern?.email) {
        const internFeedbacks = await base44.entities.Feedback.filter({ intern_id: formData.intern_id });
        
        // חישוב סיכום פרוצדורות
        const procedureSummary = {};
        internFeedbacks.forEach(f => {
          if (!procedureSummary[f.procedure_type]) {
            procedureSummary[f.procedure_type] = { count: 0, comments: [] };
          }
          procedureSummary[f.procedure_type].count += 1;
          if (f.intern_verbal_feedback) {
            procedureSummary[f.procedure_type].comments.push(f.intern_verbal_feedback);
          }
        });

        const summaryText = Object.entries(procedureSummary)
          .map(([proc, data]) => {
            let text = `${proc}: ${data.count} פעמים`;
            if (data.comments.length > 0) {
              text += `\n  משובים עצמיים:\n  ${data.comments.map((c, i) => `  ${i + 1}. ${c}`).join('\n  ')}`;
            }
            return text;
          })
          .join('\n\n');

        await base44.integrations.Core.SendEmail({
          to: selectedIntern.email,
          subject: `סיכום פרוצדורות - ${code}`,
          body: `שלום ${selectedIntern.name},

קוד פרוצדורה: ${code}

להלן סיכום הפרוצדורות שביצעת עד כה:

${summaryText}

בהצלחה!`
        });
      }

      // מייל למומחה - תזכורת למילוי משוב
      if (selectedExpert?.email) {
        await base44.integrations.Core.SendEmail({
          to: selectedExpert.email,
          subject: `תזכורת: משוב על פרוצדורה ${code}`,
          body: `שלום ${selectedExpert.name},

קוד פרוצדורה: ${code}

${selectedIntern?.name} ביצע/ה פרוצדורה "${formData.procedure_type}" ומחכה למשוב שלך.

אנא היכנס/י לפאנל המומחים ומלא/י את המשוב.

תודה!`
        });
      }
    } catch (error) {
      console.error('Error sending emails:', error);
    }

    setProcedureCode(code);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setProcedureCode('');
      setFormData({
        intern_id: '',
        expert_id: '',
        procedure_category: '',
        procedure_type: '',
        procedure_date: '',
        intern_knowledge_rating: 0,
        intern_manual_skill_rating: 0,
        intern_professionalism_rating: 0,
        intern_independence_rating: 0,
        intern_verbal_feedback: ''
      });
      onSuccess?.();
    }, 4000);
    
    setIsSubmitting(false);
  };

  const hasAtLeastOneRating = formData.intern_knowledge_rating > 0 || 
                               formData.intern_manual_skill_rating > 0 || 
                               formData.intern_professionalism_rating > 0 || 
                               formData.intern_independence_rating > 0;

  const isValid = formData.intern_id && formData.expert_id && formData.procedure_category && 
                  formData.procedure_type && hasAtLeastOneRating;

  const availableProcedures = formData.procedure_category 
    ? PROCEDURE_CATEGORIES[formData.procedure_category] || []
    : [];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800 text-center">
          משוב עצמי למתמחה
        </CardTitle>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-2 text-base">שים לב - זהו עמוד למשוב עצמי!</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>עמוד זה מיועד למתמחה למילוי משוב עצמי על הפרוצדורה שביצע</li>
                <li>בחר את המתמחה (עצמך) ואת המומחה שהדריך אותך</li>
                <li>לאחר השליחה, תקבל קוד ייחודי לפרוצדורה (לדוגמה: #001)</li>
                <li>העבר את הקוד למומחה כדי שימלא את המשוב שלו</li>
                <li>המומחה יוכל למצוא את הפרוצדורה שלך בעמוד המומחים</li>
              </ul>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-xl font-semibold text-slate-800 mb-3">המשוב העצמי נשמר בהצלחה!</p>
              <div className="bg-teal-50 border-2 border-teal-300 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Hash className="w-6 h-6 text-teal-600" />
                  <p className="text-sm text-slate-600">קוד הפרוצדורה שלך:</p>
                </div>
                <p className="text-3xl font-bold text-teal-700">{procedureCode}</p>
                <p className="text-sm text-slate-600 mt-3">
                  העבר קוד זה למומחה שהדריך אותך
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">מתמחה (את/ה)</Label>
                  <Select
                    value={formData.intern_id}
                    onValueChange={(value) => setFormData({ ...formData, intern_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="בחר את עצמך" />
                    </SelectTrigger>
                    <SelectContent>
                      {interns.map((intern) => (
                        <SelectItem key={intern.id} value={intern.id}>
                          {intern.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">מומחה מדריך</Label>
                  <Select
                    value={formData.expert_id}
                    onValueChange={(value) => setFormData({ ...formData, expert_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="בחר מומחה" />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map((expert) => (
                        <SelectItem key={expert.id} value={expert.id}>
                          {expert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">קטגוריית פרוצדורה</Label>
                  <Select
                    value={formData.procedure_category}
                    onValueChange={(value) => setFormData({ ...formData, procedure_category: value, procedure_type: '' })}
                  >
                    <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PROCEDURE_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">פרוצדורה</Label>
                  <Select
                    value={formData.procedure_type}
                    onValueChange={(value) => setFormData({ ...formData, procedure_type: value })}
                    disabled={!formData.procedure_category}
                  >
                    <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="בחר פרוצדורה" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProcedures.map((proc) => (
                        <SelectItem key={proc} value={proc}>
                          {proc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  תאריך ביצוע הפרוצדורה
                </Label>
                <Input
                  type="date"
                  value={formData.procedure_date}
                  onChange={(e) => setFormData({ ...formData, procedure_date: e.target.value })}
                  className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">הערכה עצמית:</p>
                  <p>דרג את עצמך בכל קטגוריה רלוונטית. אם קטגוריה מסוימת אינה רלוונטית, השאר אותה ריקה. יש לדרג לפחות קטגוריה אחת.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {RATING_CATEGORIES.map((category) => (
                  <RatingCategory
                    key={category.key}
                    label={category.label}
                    description={category.description}
                    value={formData[category.key]}
                    onChange={(value) => setFormData({ ...formData, [category.key]: value })}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">משוב מילולי עצמי (אופציונלי)</Label>
                <Textarea
                  value={formData.intern_verbal_feedback}
                  onChange={(e) => setFormData({ ...formData, intern_verbal_feedback: e.target.value })}
                  placeholder="כתוב על החוויה שלך, מה למדת, מה היה מאתגר..."
                  className="min-h-[120px] bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full h-14 bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-teal-500/25 transition-all"
              >
                <Send className="w-5 h-5 ml-2" />
                {isSubmitting ? 'שומר...' : 'שלח משוב עצמי'}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}