import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Calendar, Hash } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const PROCEDURE_CATEGORIES = {
  "OB": [
    "יולדות-ביקורים עם מתמחה","יולדות-ביקור לבד- להציג את הביקור","ביקור יולדות- הצגה לרופא בכיר",
    "יולדות-לעבור על10 מכתבי שחרור (5 פסיולוגי 5 קיסרי)","יולדות - מכתב שחרור קרע מתקדם",
    "יולדות - מכתב שחרור מורכב","קבלה לקיסרי - צפיה","קבלה לקיסרי - יום קבלות",
    "קיסרי- הכרת המטופלת, השכבה, רחצה","הכנסת קטטר","כתיבת דו\"ח ניתוח",
    "טיפול ביולדת -טיפול בחום אחרי לידה וכו'","PV - אחרי מיילדת או רופא","הכנסת בלון",
    "תפירה בחדר לידה","פענוח מוניטור","BPP","קבלה במיון יולדות- אנמנזה, אינטראקציה, כיתוב",
    "קבלה בחדר לידה/ ביקור בחדר לידה","ליווי יולדת בחדר לידה, כולל קבלת לידה (לפחות 5 לידות ראשונות)",
    "ייעוץ לTOLAC כולל הבנה של התווית נגד","אם ועובר-ניהול יום במחלקה","אם ועובר-העברת מקל בישיבת העברה",
    "מכתבי שחרור","ניהול מעקב הריון רגיל","ניתוח קיסרי כעוזר","ניתוח קיסרי כמנתח ראשון",
    "ניהול השראת לידה","ניהול TOLAC","אפיזיוטומיה - ביצוע",
    "טיפול ביולדת -טיפול במקרה חירום מורכב אחרי לידה","ניהול מקרה במיון המיילדותי",
    "שליטה וניהול עמדת המיון המיילדותי","ניהול מקרה של הריון בסיכון גבוה (אשפוז יום)",
    "ניהול מקרה חירום מיילדותי","ניהול לידה מורכבת","ניהול PPH בחדר לידה",
    "Revision","Manual lysis","ניהול לידת תאומים","לידת VACUUM",
    "תפירה מורכבת כולל אבחנה של OASIS","ביצוע קיסרי מורכב","ניהול חדר לידה ותורנות"
  ],
  "GYN": [
    "קבלה במיון נשים","קבלה בטרום ניתוח","מעבר על תיק מטופלת - ובדיקת רשימת תיוג",
    "הכנסת מטופלת לחדר ניתוח, כולל השכבה, SIGN IN, הכנת ציוד ורחצה",
    "הבנה של שלבי הניתוח פשוט","תפירה וקשירה","כתיבת דו\"ח ניתוח",
    "ניהול יום במחלקה (כולל כל שלבי היום)","ניהול ביקור בוקר (הכרת נשים, הצגה, תוכנית, רישום)",
    "מכתבי שחרור","מענה ראשוני למצב חירום","העברת מקל בישיבת העברה",
    "ניהול מקרה במיון הגינקולוגי (ניהול מלא כולל מעבר לחדר ניתוח במידת הצורך)",
    "טיפול במטופלת עם סיבוכי הריון צעיר (הפלה מאיימת, אקטופי מסוגים שונים)",
    "טיפול למטופלת במרפאת נשים","בדיקת PAP/HPV","פיפל","הוצאת IUD","הידרוסונוגרפיה",
    "הפסקת הריון","ייעוץ על מניעת הריון","טיפול בהפלה נדחית","הכנסת IUD",
    "ניתוחים קטנים (גרידות, ברתולין)","עזרה בלפרוסקופיה והיסטרוסקופיה",
    "ניהול מקרה גינקולוגי אמבולטורי מורכב","מקרה ילדות ומתבגרות","קוניזציה",
    "ייעוץ לנשים עם תלונות של רצפת האגן","הערכה לנשים עם אנדומטרוזיס",
    "היסטרוסקופיה ניתוחית","כריתת רחם","ניתוחי של רצפת האגן כולל TVH","ניתוח פתוח",
    "טיפול של סיבוכים של ניתוחים"
  ],
  "IVF": [
    "הערכה של מטופלת/זוג עם אי פוריות כולל תוכנית טיפול",
    "כתיבת הנחיות לפרופיל הורמונלי ופענוח תשובה","הנחיות בדיקת זרע ופענוח בדיקת זרע",
    "הערכה של מדדי רזרבה שחלתית","ביצוע בדיקת US למטופלת פריון: AFC, שחלות, הערכת רחם",
    "הערכה של מטופלת עם הפלות חוזרות/RPF","הערכה של מטופלת לשימור פוריות",
    "הערכת מטופל/ת ל PGT","ניהול מטופלת בתהליך של IVF","בירור אי פוריות גבר",
    "IUI","השראת ביוץ","ניהול סיבוכים של ART"
  ],
  "ONCO": ["מקרה אמבולטורי של ממאירות גינקולוגית","חדר ניתוח","אשפוז יום","מחלקה","קולפוסקופיה"],
  "כללי": [
    "אורך צוואר","הערכת משקל","דופלר של חבל הטבור","הריון צעיר","פתולוגיה בטפולות",
    "מסירת בשורות רעות -תקשורת מתקדמת על בשורות רעות","מחקר, הבנת הספרות","הוראה",
    "ניהול תורנות כתורן ראשון","מחקר ופרסום"
  ]
};

const FORM_TYPES = [
  { value: 'procedural', label: 'טופס 1 - פעולות פרוצדורליות (ניתוח, תפירה, היסטרוסקופיה...)' },
  { value: 'clinical_management', label: 'טופס 2 - ניהול קליני (קבלות, ייעוץ, ניהול מקרה...)' },
  { value: 'ward_management', label: 'טופס 3 - ניהול מחלקה (ניהול יום, תורנות, העברת מקל...)' },
  { value: 'teaching_research', label: 'טופס 4 - הוראה ומחקר' },
  { value: 'communication', label: 'טופס 5 - תקשורת (מסירת בשורות רעות...)' }
];

const RATING_LABELS_1_5 = ['1 - מינימלי', '2', '3', '4', '5 - מצוין'];

function RatingRow({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-700 text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded text-sm font-semibold border transition-colors ${
              value === n
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function generateProcedureCode(count) {
  return `#${String(count + 1).padStart(3, '0')}`;
}

export default function InternSelfFeedbackFormSimple({ internId, internName, experts, onSuccess }) {
  const emptyForm = {
    expert_id: '',
    procedure_category: '',
    procedure_type: '',
    form_type: '',
    procedure_date: '',
    intern_overall_rating: 0,
    intern_knowledge_rating: 0,
    intern_clinical_skill_rating: 0,
    intern_communication_rating: 0,
    intern_independence: null,
    intern_verbal_feedback: ''
  };
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [procedureCode, setProcedureCode] = useState('');

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedExpert = experts.find(ex => ex.id === formData.expert_id);
    const existingFeedbacks = await base44.entities.Feedback.list();
    const code = generateProcedureCode(existingFeedbacks.length);

    const dataToSave = {
      procedure_id_code: code,
      intern_id: internId,
      intern_name: internName,
      expert_id: formData.expert_id,
      expert_name: selectedExpert?.name,
      procedure_category: formData.procedure_category,
      procedure_type: formData.procedure_type,
      form_type: formData.form_type,
      procedure_date: formData.procedure_date,
      intern_verbal_feedback: formData.intern_verbal_feedback,
      intern_submitted_date: new Date().toISOString(),
      status: 'pending_expert_review'
    };

    if (formData.intern_overall_rating > 0) dataToSave.intern_overall_rating = formData.intern_overall_rating;
    if (formData.intern_knowledge_rating > 0) dataToSave.intern_knowledge_rating = formData.intern_knowledge_rating;
    if (formData.intern_clinical_skill_rating > 0) dataToSave.intern_clinical_skill_rating = formData.intern_clinical_skill_rating;
    if (formData.intern_communication_rating > 0) dataToSave.intern_communication_rating = formData.intern_communication_rating;
    if (formData.intern_independence !== null) dataToSave.intern_independence = formData.intern_independence;

    await base44.entities.Feedback.create(dataToSave);
    setProcedureCode(code);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setProcedureCode('');
      setFormData(emptyForm);
      onSuccess?.();
    }, 3000);
    setIsSubmitting(false);
  };

  const formType = formData.form_type;
  const showOverall = ['procedural', 'clinical_management', 'communication'].includes(formType);
  const showKnowledge = ['procedural', 'clinical_management', 'ward_management', 'teaching_research'].includes(formType);
  const showClinicalSkill = ['procedural', 'clinical_management', 'ward_management'].includes(formType);
  const showCommunication = ['procedural', 'clinical_management', 'teaching_research', 'communication'].includes(formType);
  const showIndependence = ['procedural', 'clinical_management'].includes(formType);

  const hasRating = formData.intern_overall_rating > 0 || formData.intern_knowledge_rating > 0 ||
    formData.intern_clinical_skill_rating > 0 || formData.intern_communication_rating > 0;

  const isValid = formData.expert_id && formData.procedure_category && formData.procedure_type &&
    formData.form_type && (hasRating || formData.intern_independence !== null);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">הזנת משוב עצמי חדש</CardTitle>
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
              <p className="text-xl font-semibold text-slate-800 mb-3">המשוב נשמר בהצלחה!</p>
              <div className="bg-teal-50 border-2 border-teal-300 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Hash className="w-6 h-6 text-teal-600" />
                  <p className="text-sm text-slate-600">קוד הפרוצדורה:</p>
                </div>
                <p className="text-3xl font-bold text-teal-700">{procedureCode}</p>
              </div>
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-5">

              {/* מומחה */}
              <div className="space-y-2">
                <Label className="font-medium">מומחה מדריך</Label>
                <Select value={formData.expert_id} onValueChange={v => set('expert_id', v)}>
                  <SelectTrigger className="h-12 bg-white border-slate-200">
                    <SelectValue placeholder="בחר מומחה" />
                  </SelectTrigger>
                  <SelectContent>
                    {experts.map(ex => <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* קטגוריה + פרוצדורה */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">קטגוריה</Label>
                  <Select value={formData.procedure_category} onValueChange={v => setFormData(p => ({ ...p, procedure_category: v, procedure_type: '' }))}>
                    <SelectTrigger className="h-12 bg-white border-slate-200">
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PROCEDURE_CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">פרוצדורה</Label>
                  <Select value={formData.procedure_type} onValueChange={v => set('procedure_type', v)} disabled={!formData.procedure_category}>
                    <SelectTrigger className="h-12 bg-white border-slate-200">
                      <SelectValue placeholder="בחר פרוצדורה" />
                    </SelectTrigger>
                    <SelectContent>
                      {(PROCEDURE_CATEGORIES[formData.procedure_category] || []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* סוג טופס */}
              <div className="space-y-2">
                <Label className="font-medium">סוג הערכה</Label>
                <Select value={formData.form_type} onValueChange={v => set('form_type', v)}>
                  <SelectTrigger className="h-12 bg-white border-slate-200">
                    <SelectValue placeholder="בחר סוג הערכה" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* תאריך */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />תאריך ביצוע
                </Label>
                <Input type="date" value={formData.procedure_date} onChange={e => set('procedure_date', e.target.value)} className="h-12 bg-white border-slate-200" />
              </div>

              {/* שדות דירוג לפי סוג טופס */}
              {formData.form_type && (
                <div className="space-y-4 bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800">הערכה עצמית</p>

                  {showOverall && (
                    <RatingRow
                      label={formType === 'communication' ? 'הערכה כללית' : 'הערכה של הביצוע שלי'}
                      value={formData.intern_overall_rating}
                      onChange={v => set('intern_overall_rating', v)}
                    />
                  )}
                  {showKnowledge && (
                    <RatingRow label="ידע בסיסי וקליני" value={formData.intern_knowledge_rating} onChange={v => set('intern_knowledge_rating', v)} />
                  )}
                  {showClinicalSkill && (
                    <RatingRow
                      label={formType === 'ward_management' ? 'ניהול עבודת צוות' : 'מיומנות קלינית'}
                      value={formData.intern_clinical_skill_rating}
                      onChange={v => set('intern_clinical_skill_rating', v)}
                    />
                  )}
                  {showCommunication && (
                    <RatingRow label="תקשורת בין אישית" value={formData.intern_communication_rating} onChange={v => set('intern_communication_rating', v)} />
                  )}

                  {showIndependence && (
                    <div className="space-y-1">
                      <Label className="text-slate-700 text-sm font-medium">
                        {formType === 'procedural' ? 'האם אני מסוגל לבצע זאת באופן עצמאי?' : 'האם אני מסוגל לנהל זאת באופן עצמאי?'}
                      </Label>
                      <div className="flex gap-3">
                        {[{ val: true, label: 'כן' }, { val: false, label: 'לא' }].map(opt => (
                          <button
                            key={String(opt.val)}
                            type="button"
                            onClick={() => set('intern_independence', opt.val)}
                            className={`flex-1 py-2 rounded border text-sm font-semibold transition-colors ${
                              formData.intern_independence === opt.val
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* הערות */}
              <div className="space-y-2">
                <Label className="font-medium">הערות (אופציונלי)</Label>
                <Textarea
                  value={formData.intern_verbal_feedback}
                  onChange={e => set('intern_verbal_feedback', e.target.value)}
                  placeholder="כתוב על החוויה שלך, מה למדת, מה היה מאתגר..."
                  className="min-h-[80px] bg-white border-slate-200"
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full h-12 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold"
              >
                <Send className="w-5 h-5 ml-2" />
                {isSubmitting ? 'שומר...' : 'שלח משוב'}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}