import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const PROCEDURES = [
  "לידה רגילה",
  "ניתוח קיסרי", 
  "לפרוסקופיה",
  "היסטרוסקופיה",
  "היסטרקטומיה",
  "כריתת שחלה",
  "אולטרסאונד",
  "אחר"
];

export default function FeedbackForm({ interns, experts, onSuccess }) {
  const [formData, setFormData] = useState({
    intern_id: '',
    expert_id: '',
    procedure_type: '',
    rating: 0,
    verbal_feedback: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedIntern = interns.find(i => i.id === formData.intern_id);
    const selectedExpert = experts.find(e => e.id === formData.expert_id);

    await base44.entities.Feedback.create({
      ...formData,
      intern_name: selectedIntern?.name,
      expert_name: selectedExpert?.name
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        intern_id: '',
        expert_id: '',
        procedure_type: '',
        rating: 0,
        verbal_feedback: ''
      });
      onSuccess?.();
    }, 2000);
    
    setIsSubmitting(false);
  };

  const isValid = formData.intern_id && formData.expert_id && formData.procedure_type && formData.rating > 0;

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

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">סוג פרוצדורה</Label>
                <Select
                  value={formData.procedure_type}
                  onValueChange={(value) => setFormData({ ...formData, procedure_type: value })}
                >
                  <SelectTrigger className="h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                    <SelectValue placeholder="בחר סוג פרוצדורה" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURES.map((proc) => (
                      <SelectItem key={proc} value={proc}>
                        {proc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">דירוג</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoveredRating || formData.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-slate-500">
                  {formData.rating > 0 ? `דירוג: ${formData.rating} מתוך 5` : 'לחץ לדירוג'}
                </p>
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