import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Info, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import RatingCategory from './RatingCategory';

const PROCEDURE_CATEGORIES = {
  "אבנים בנשים": [
    "אדר חמרני",
    "אלומה בר",
    "אלון קס",
    "ג'ולנאר מוסטאפא",
    "גילה כהן",
    "דימא פארוג'ה",
    "דניאל ויקטור",
    "דר נוי",
    "מעיין יוגב",
    "נטלי ביבר",
    "פארוג'ה נטור דימא",
    "קארן הורביץ",
    "קרן מרקס",
    "שבית אסולין",
    "שלהבת פרנק",
    "שני מושקוביץ",
    "תמר אליישיב"
  ],
  "גלעד רונית": [
    "דן וולסקי",
    "דנה לסרי",
    "הלן מיסמה",
    "חגי אמסלם",
    "יהודית זנגי",
    "יובל לביא",
    "יעקב בנטוב",
    "ישי סומפולינסקי",
    "לויט לורין",
    "לילך מור",
    "מאור קבסה",
    "מיכל נובוסלסקי",
    "נעם כהן",
    "עובדיה רוזנבלו",
    "עפר בהריר",
    "פרץ אדווה",
    "צביקה שמעונוביץ",
    "רחל פרנקל",
    "אדר חמרני",
    "קרן מרקס",
    "שני מושקוביץ"
  ]
};

const RATING_CATEGORIES = [
  { key: 'knowledge_rating', label: 'ידע', description: 'רמת הידע התיאורטי והקליני של המתמחה' },
  { key: 'manual_skill_rating', label: 'מיומנות מנואלית', description: 'יכולת ביצוע טכני של הפרוצדורה' },
  { key: 'professionalism_rating', label: 'מקצועיות', description: 'התנהלות מקצועית, תקשורת עם הצוות והמטופלת' },
  { key: 'independence_rating', label: 'עצמאות', description: 'האם המתמחה יוכל להיות עצמאי בפרוצדורה זו' }
];

export default function FeedbackForm({ interns, experts, onSuccess }) {
  const [formData, setFormData] = useState({
    intern_id: '',
    expert_id: '',
    procedure_category: '',
    procedure_type: '',
    procedure_date: '',
    knowledge_rating: 0,
    manual_skill_rating: 0,
    professionalism_rating: 0,
    independence_rating: 0,
    verbal_feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedIntern = interns.find(i => i.id === formData.intern_id);
    const selectedExpert = experts.find(e => e.id === formData.expert_id);

    const dataToSave = {
      intern_id: formData.intern_id,
      intern_name: selectedIntern?.name,
      expert_id: formData.expert_id,
      expert_name: selectedExpert?.name,
      procedure_category: formData.procedure_category,
      procedure_type: formData.procedure_type,
      procedure_date: formData.procedure_date,
      verbal_feedback: formData.verbal_feedback
    };

    if (formData.knowledge_rating > 0) dataToSave.knowledge_rating = formData.knowledge_rating;
    if (formData.manual_skill_rating > 0) dataToSave.manual_skill_rating = formData.manual_skill_rating;
    if (formData.professionalism_rating > 0) dataToSave.professionalism_rating = formData.professionalism_rating;
    if (formData.independence_rating > 0) dataToSave.independence_rating = formData.independence_rating;

    await base44.entities.Feedback.create(dataToSave);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        intern_id: '',
        expert_id: '',
        procedure_category: '',
        procedure_type: '',
        procedure_date: '',
        knowledge_rating: 0,
        manual_skill_rating: 0,
        professionalism_rating: 0,
        independence_rating: 0,
        verbal_feedback: ''
      });
      onSuccess?.();
    }, 2000);
    
    setIsSubmitting(false);
  };

  const hasAtLeastOneRating = formData.knowledge_rating > 0 || 
                               formData.manual_skill_rating > 0 || 
                               formData.professionalism_rating > 0 || 
                               formData.independence_rating > 0;

  const isValid = formData.intern_id && formData.expert_id && formData.procedure_category && 
                  formData.procedure_type && hasAtLeastOneRating;

  const availableProcedures = formData.procedure_category 
    ? PROCEDURE_CATEGORIES[formData.procedure_category] || []
    : [];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800 text-center">
          הזנת משוב חדש
        </CardTitle>
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
              <p className="text-xl font-semibold text-slate-800">המשוב נשמר בהצלחה!</p>
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
                  <Label className="text-slate-700 font-medium">מתמחה</Label>
                  <Select
                    value={formData.intern_id}
                    onValueChange={(value) => setFormData({ ...formData, intern_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="בחר מתמחה" />
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
                  <Label className="text-slate-700 font-medium">מומחה</Label>
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

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">הוראות דירוג:</p>
                  <p>דרג את המתמחה בכל קטגוריה רלוונטית. אם קטגוריה מסוימת אינה רלוונטית לפרוצדורה זו, השאר אותה ריקה (ללא כוכבים). יש לדרג לפחות קטגוריה אחת.</p>
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
                <Label className="text-slate-700 font-medium">משוב מילולי (אופציונלי)</Label>
                <Textarea
                  value={formData.verbal_feedback}
                  onChange={(e) => setFormData({ ...formData, verbal_feedback: e.target.value })}
                  placeholder="הוסף משוב מילולי..."
                  className="min-h-[120px] bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full h-14 bg-gradient-to-l from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-teal-500/25 transition-all"
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