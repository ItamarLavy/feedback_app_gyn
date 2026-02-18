import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, User, UserCheck, Calendar, Trash2, BookOpen, Hand, Award, UserCog } from 'lucide-react';
import { format } from 'date-fns';

const RATING_LABELS = {
  knowledge_rating: { label: 'ידע', icon: BookOpen },
  manual_skill_rating: { label: 'מיומנות', icon: Hand },
  professionalism_rating: { label: 'מקצועיות', icon: Award },
  independence_rating: { label: 'עצמאות', icon: UserCog }
};

function RatingDisplay({ label, value, Icon }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-slate-600">{label}:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeedbackCard({ feedback, onDelete, showDelete = false }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('האם אתה בטוח שברצונך למחוק משוב זה?')) {
      onDelete?.(feedback.id);
    }
  };

  // Calculate average rating from available ratings
  const ratings = [
    feedback.knowledge_rating,
    feedback.manual_skill_rating,
    feedback.professionalism_rating,
    feedback.independence_rating
  ].filter(r => r && r > 0);
  
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
    : null;

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-teal-600" />
              <span className="font-medium">{feedback.intern_name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <UserCheck className="w-4 h-4" />
              <span>מאת: {feedback.expert_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {avgRating && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <span className="font-semibold text-amber-700">{avgRating}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-3">
          {feedback.procedure_type}
        </div>

        {/* Rating Details */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Object.entries(RATING_LABELS).map(([key, { label, icon }]) => (
            <RatingDisplay 
              key={key} 
              label={label} 
              value={feedback[key]} 
              Icon={icon} 
            />
          ))}
        </div>

        {feedback.verbal_feedback && (
          <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3 mt-3">
            {feedback.verbal_feedback}
          </p>
        )}

        <div className="flex items-center gap-2 text-slate-400 text-xs mt-4">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(feedback.created_date), 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </CardContent>
    </Card>
  );
}