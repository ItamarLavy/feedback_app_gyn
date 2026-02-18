import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star, User, UserCheck, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function FeedbackCard({ feedback }) {
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
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= feedback.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-3">
          {feedback.procedure_type}
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