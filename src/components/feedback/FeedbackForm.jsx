import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Calendar, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { getFormTypeForProcedure } from '@/lib/epaFormTypeMapping';

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
  { value: 'procedural', label: 'טופס 1 - פעולות פרוצדורליות' },
  { value: 'clinical_management', label: 'טופס 2 - ניהול קליני' },
  { value: 'ward_management', label: 'טופס 3 - ניהול מחלקה' },
  { value: 'teaching_research', label: 'טופס 4 - הוראה ומחקר' },
  { value: 'communication', label: 'טופס 5 - תקשורת' }
];

function RatingRow({ label, value, onChange, options }) {
  const descriptions = options || [
    '1 - הייתי צריך לעשות את רוב הפעולה',
    '2 - הייתי צריך להדריך באופן פעיל',
    '3 - הייתי צריך להדריך מפעם לפעם',
    '4 - הייתי צריך להיות שם ליתר ביטחון',
    '5 - לא הייתי צריך להיות שם'
  ];
  return (
    <div className="space-y-1">
      <Label className="text-slate-700 text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            title={descriptions[n - 1]}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded text-sm font-semibold border transition-colors ${
              value === n
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-slate-500">{descriptions[value - 1]}</p>
      )}
    </div>
  );
}

export default function FeedbackForm({ interns, experts, onSuccess }) {
  const emptyForm = {
    intern_id: '',
    expert_id: '',
    procedure_category: '',
    procedure_type: '',
    form_type: '',
    procedure_date: '',
    expert_overall_rating: 0,
    expert_knowledge_rating: 0,
    expert_clinical_skill_rating: 0,
    expert_communication_rating: 0,
    expert_independence: null,
    expert_professionalism_concern: false,
    expert_professionalism_details: '',
    expert_verbal_feedback: ''
  };
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedIntern = interns.find(i => i.id === formData.intern_id);
    const selectedExpert = experts.find(ex => ex.id === formData.expert_id);

    const dataToSave = {
      intern_id: formData.intern_id,
      intern_name: selectedIntern?.name,
      expert_id: formData.expert_id,
      expert_name: selectedExpert?.name,
      procedure_category: formData.procedure_category,
      procedure_type: formData.procedure_type,
      form_type: formData.form_type,
      procedure_date: formData.procedure_date,
      expert_verbal_feedback: formData.expert_verbal_feedback,
      expert_professionalism_concern: formData.expert_professionalism_concern,
      expert_professionalism_details: formData.expert_professionalism_details,
      expert_submitted_date: new Date().toISOString(),
      status: 'completed'
    };

    if (formData.expert_overall_rating > 0) dataToSave.expert_overall_rating = formData.expert_overall_rating;
    if (formData.expert_knowledge_rating > 0) dataToSave.expert_knowledge_rating = formData.expert_knowledge_rating;
    if (formData.expert_clinical_skill_rating > 0) dataToSave.expert_clinical_skill_rating = formData.expert_clinical_skill_rating;
    if (formData.expert_communication_rating > 0) dataToSave.expert_communication_rating = formData.expert_communication_rating;
    if (formData.expert_independence !== null) dataToSave.expert_independence = formData.expert_independence;

    await base44.entities.Feedback.create(dataToSave);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData(emptyForm);
      onSuccess?.();
    }, 2000);
    setIsSubmitting(false);
  };

  const formType = formData.form_type;
  const showOverall = ['procedural', 'clinical_management', 'communication'].includes(formType);
  const showKnowledge = ['procedural', 'clinical_management', 'ward_management', 'teaching_research'].includes(formType);
  const showClinicalSkill = ['procedural', 'clinical_management', 'ward_management'].includes(formType);
  const showCommunication = ['procedural', 'clinical_management', 'teaching_research', 'communication'].includes(formType);
  const showIndependence = ['procedural', 'clinical_management', 'ward_management'].includes(formType);

  const overallLabels = {
    procedural: ['1 - הייתי צריך לעשות את רוב הפעולה','2 - הייתי צריך להיות נוכח ולהדריך','3 - הדרכה מפעם לפעם','4 - הייתי שם ליתר ביטחון','5 - לא הייתי צריך להיות שם'],
    clinical_management: ['1 - הייתי צריך לנהל את רוב הסיטואציה','2 - הדרכה פעילה','3 - הדרכה מפעם לפעם','4 - ליתר ביטחון','5 - לא הייתי צריך להיות שם'],
    communication: ['1 - הייתי צריך לעשות את רוב השיחה','2 - הדרכה פעילה','3 - הדרכה מפעם לפעם','4 - ליתר ביטחון','5 - לא הייתי צריך להיות שם']
  };
  const knowledgeLabels = ['1 - חסר ידע בסיסי','2 - ידע חלקי עם פערים','3 - ידע טוב','4 - ידע מעמיק','5 - ידע ברמת מומחה'];
  const clinicalLabels = {
    procedural: ['1 - טכניקה לא נכונה','2 - בסיסי עם טעויות תכופות','3 - נכון, זקוק לפיקוח','4 - מצוין','5 - מושלם'],
    clinical_management: ['1 - קבלת החלטות לקויה','2 - בסיסי עם פערים','3 - טוב','4 - מעולה','5 - מושלם'],
    ward_management: ['1 - לא מתאם צוות','2 - תיאום חלקי','3 - תיאום יעיל','4 - תיאום מצוין','5 - ניהול מושלם']
  };
  const commLabels = ['1 - לא מסביר באופן מובן','2 - הסבר טכני מדי','3 - הסבר ברור','4 - הסבר מעולה','5 - תקשורת מושלמת'];
  const teachLabels = ['צריך הדרכה','','עצמאי','','מוביל אחרים'];

  const hasRating = formData.expert_overall_rating > 0 || formData.expert_knowledge_rating > 0 ||
    formData.expert_clinical_skill_rating > 0 || formData.expert_communication_rating > 0;

  const isValid = formData.intern_id && formData.expert_id && formData.procedure_category &&
    formData.procedure_type && formData.form_type && (hasRating || formData.expert_independence !== null);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800 text-center">הזנת משוב חדש</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-xl font-semibold text-slate-800">המשוב נשמר בהצלחה!</p>
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-5">

              {/* מתמחה + מומחה */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">מתמחה</Label>
                  <Select value={formData.intern_id} onValueChange={v => set('intern_id', v)}>
                    <SelectTrigger className="h-12 bg-white border-slate-200">
                      <SelectValue placeholder="בחר מתמחה" />
                    </SelectTrigger>
                    <SelectContent>
                      {interns.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">מומחה</Label>
                  <Select value={formData.expert_id} onValueChange={v => set('expert_id', v)}>
                    <SelectTrigger className="h-12 bg-white border-slate-200">
                      <SelectValue placeholder="בחר מומחה" />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map(ex => <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* קטגוריה + פרוצדורה */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">קטגוריית פרוצדורה</Label>
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
                  <Select value={formData.procedure_type} onValueChange={v => {
                    const autoFormType = getFormTypeForProcedure(v);
                    setFormData(p => ({ ...p, procedure_type: v, form_type: autoFormType || p.form_type }));
                  }} disabled={!formData.procedure_category}>
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
                <Label className="font-medium flex items-center gap-2">
                  סוג הערכה (GynStones CBD)
                  {formData.form_type && getFormTypeForProcedure(formData.procedure_type) && (
                    <span className="flex items-center gap-1 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />נבחר אוטומטית
                    </span>
                  )}
                </Label>
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
                <div className="space-y-4 bg-teal-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-teal-800">הערכת המתמחה</p>

                  {showOverall && (
                    <RatingRow
                      label={formType === 'communication' ? 'הערכה כללית' : 'הערכה של המתמחה'}
                      value={formData.expert_overall_rating}
                      onChange={v => set('expert_overall_rating', v)}
                      options={overallLabels[formType]}
                    />
                  )}
                  {showKnowledge && (
                    <RatingRow label="ידע בסיסי וקליני" value={formData.expert_knowledge_rating} onChange={v => set('expert_knowledge_rating', v)} options={knowledgeLabels} />
                  )}
                  {showClinicalSkill && (
                    <RatingRow
                      label={formType === 'ward_management' ? 'ניהול עבודת צוות' : 'מיומנות קלינית'}
                      value={formData.expert_clinical_skill_rating}
                      onChange={v => set('expert_clinical_skill_rating', v)}
                      options={clinicalLabels[formType] || clinicalLabels.procedural}
                    />
                  )}
                  {showCommunication && (
                    <RatingRow
                      label={formType === 'teaching_research' ? 'כישורי הוראה ומחקר' : 'תקשורת בין אישית'}
                      value={formData.expert_communication_rating}
                      onChange={v => set('expert_communication_rating', v)}
                      options={formType === 'teaching_research' ? teachLabels.map((l, i) => l || String(i + 1)) : commLabels}
                    />
                  )}

                  {showIndependence && (
                    <div className="space-y-1">
                      <Label className="text-slate-700 text-sm font-medium">
                        {formType === 'ward_management' ? 'רמת תפקוד' : (formType === 'clinical_management' ? 'האם המתמחה מסוגל לנהל זאת באופן עצמאי?' : 'האם המתמחה מסוגל לבצע זאת באופן עצמאי?')}
                      </Label>
                      <div className="flex gap-3">
                        {formType === 'ward_management'
                          ? [{ val: false, label: 'לא מסוגל' }, { val: true, label: 'מסוגל עם גיבוי' }].map(opt => (
                            <button key={String(opt.val)} type="button" onClick={() => set('expert_independence', opt.val)}
                              className={`flex-1 py-2 rounded border text-sm font-semibold transition-colors ${formData.expert_independence === opt.val ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                              {opt.label}
                            </button>
                          ))
                          : [{ val: true, label: 'כן' }, { val: false, label: 'לא' }].map(opt => (
                            <button key={String(opt.val)} type="button" onClick={() => set('expert_independence', opt.val)}
                              className={`flex-1 py-2 rounded border text-sm font-semibold transition-colors ${formData.expert_independence === opt.val ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                              {opt.label}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* מקצועיות */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">האם יש חשש לגבי מקצועיות?</Label>
                    <div className="flex gap-3">
                      {[{ val: false, label: 'לא' }, { val: true, label: 'כן' }].map(opt => (
                        <button key={String(opt.val)} type="button" onClick={() => set('expert_professionalism_concern', opt.val)}
                          className={`flex-1 py-2 rounded border text-sm font-semibold transition-colors ${
                            formData.expert_professionalism_concern === opt.val
                              ? (opt.val ? 'bg-red-600 text-white border-red-600' : 'bg-teal-600 text-white border-teal-600')
                              : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {formData.expert_professionalism_concern && (
                      <Input
                        placeholder="פרט את החשש..."
                        value={formData.expert_professionalism_details}
                        onChange={e => set('expert_professionalism_details', e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* הערות */}
              <div className="space-y-2">
                <Label className="font-medium">הערות נוספות (אופציונלי)</Label>
                <Textarea
                  value={formData.expert_verbal_feedback}
                  onChange={e => set('expert_verbal_feedback', e.target.value)}
                  placeholder="הוסף הערות..."
                  className="min-h-[100px] bg-white border-slate-200 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full h-14 bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-lg shadow-lg"
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