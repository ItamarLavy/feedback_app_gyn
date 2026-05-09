import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, User, UserCheck, Calendar, Trash2, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

function RatingDisplay({ label, internValue, expertValue }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-600 font-medium">{label}</div>
      <div className="flex items-center gap-3 text-sm">
        {internValue > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">מתמחה:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= internValue ? 'fill-blue-400 text-blue-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        {expertValue > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">מומחה:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= expertValue ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackCardDetailed({ feedback, onDelete, showDelete = false }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('האם אתה בטוח שברצונך למחוק משוב זה?')) {
      onDelete?.(feedback.id);
    }
  };

  const isPendingExpert = feedback.status === 'pending_expert_review';

  return (
    <Card className={`bg-white border-0 shadow-md hover:shadow-lg transition-shadow ${
      isPendingExpert ? 'border-2 border-amber-300' : ''
    }`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-slate-500" />
              <span className="font-mono text-teal-700 font-semibold">{feedback.procedure_id_code}</span>
              {isPendingExpert && (
                <Badge className="bg-amber-600 text-xs">
                  <AlertCircle className="w-3 h-3 ml-1" />
                  ממתין למשוב מומחה
                </Badge>
              )}
              {!isPendingExpert && (
                <Badge className="bg-green-600 text-xs">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  הושלם
                </Badge>
              )}
              {feedback.is_imported && (
                <Badge className="bg-slate-400 text-xs">מיובא</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-teal-600" />
              <span className="font-medium">{feedback.intern_name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <UserCheck className="w-4 h-4" />
              <span>מומחה: {feedback.expert_name}</span>
            </div>
          </div>
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

        <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-3">
          {feedback.procedure_type}
        </div>

        {/* Rating Details */}
        <div className="space-y-3 mb-3">
          {(feedback.intern_knowledge_rating > 0 || feedback.expert_knowledge_rating > 0) && (
            <RatingDisplay 
              label="ידע" 
              internValue={feedback.intern_knowledge_rating} 
              expertValue={feedback.expert_knowledge_rating} 
            />
          )}
          {(feedback.intern_manual_skill_rating > 0 || feedback.expert_manual_skill_rating > 0) && (
            <RatingDisplay 
              label="מיומנות מנואלית" 
              internValue={feedback.intern_manual_skill_rating} 
              expertValue={feedback.expert_manual_skill_rating} 
            />
          )}
          {(feedback.intern_professionalism_rating > 0 || feedback.expert_professionalism_rating > 0) && (
            <RatingDisplay 
              label="מקצועיות" 
              internValue={feedback.intern_professionalism_rating} 
              expertValue={feedback.expert_professionalism_rating} 
            />
          )}
          {(feedback.intern_independence_rating > 0 || feedback.expert_independence_rating > 0) && (
            <RatingDisplay 
              label="עצמאות" 
              internValue={feedback.intern_independence_rating} 
              expertValue={feedback.expert_independence_rating} 
            />
          )}
        </div>

        {/* Verbal Feedback */}
        {(feedback.intern_verbal_feedback || feedback.expert_verbal_feedback) && (
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
            {feedback.intern_verbal_feedback && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-semibold mb-1">משוב עצמי:</p>
                <p className="text-sm text-slate-700">{feedback.intern_verbal_feedback}</p>
              </div>
            )}
            {feedback.expert_verbal_feedback && (
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-700 font-semibold mb-1">משוב מומחה:</p>
                <p className="text-sm text-slate-700">{feedback.expert_verbal_feedback}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-400 text-xs mt-4">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(feedback.created_date), 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </CardContent>
    </Card>
  );
}