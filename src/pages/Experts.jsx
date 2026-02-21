import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PasswordModal from '../components/admin/PasswordModal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function Experts() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: isAuthenticated
  });

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  // חישוב תזכורות לכל מומחה
  const expertReminders = experts.map(expert => {
    const expertFeedbacks = feedbacks.filter(f => f.expert_id === expert.id);
    const lastFeedback = expertFeedbacks[0];
    
    let reminderStatus = 'none';
    let daysSinceLastFeedback = 0;
    
    if (lastFeedback) {
      daysSinceLastFeedback = differenceInDays(new Date(), new Date(lastFeedback.created_date));
      
      if (daysSinceLastFeedback >= 2) {
        reminderStatus = 'urgent'; // תזכורת דחופה - 2 ימים ומעלה
      }
    }
    
    return {
      expert,
      reminderStatus,
      daysSinceLastFeedback,
      lastFeedback,
      totalFeedbacks: expertFeedbacks.length
    };
  });

  // מיון לפי דחיפות
  const sortedExperts = [...expertReminders].sort((a, b) => {
    if (a.reminderStatus === 'urgent' && b.reminderStatus !== 'urgent') return -1;
    if (a.reminderStatus !== 'urgent' && b.reminderStatus === 'urgent') return 1;
    return b.daysSinceLastFeedback - a.daysSinceLastFeedback;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <PasswordModal
          open={showPasswordModal}
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">פאנל מומחים</h1>
              <p className="text-slate-500 text-sm">תזכורות למילוי משובים</p>
            </div>
          </div>
        </div>

        {/* Experts List with Reminders */}
        <div className="space-y-4">
          {sortedExperts.map(({ expert, reminderStatus, daysSinceLastFeedback, lastFeedback, totalFeedbacks }) => (
            <Card 
              key={expert.id} 
              className={`border-0 shadow-lg transition-all ${
                reminderStatus === 'urgent' 
                  ? 'bg-red-50 border-2 border-red-300' 
                  : 'bg-white'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold flex-shrink-0">
                      {expert.name?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">{expert.name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-slate-600">
                          {totalFeedbacks} משובים כתובים
                        </Badge>
                        {lastFeedback && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            משוב אחרון: {format(new Date(lastFeedback.created_date), 'dd/MM/yyyy')}
                          </Badge>
                        )}
                      </div>

                      {reminderStatus === 'urgent' && (
                        <div className="flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-800">תזכורת למילוי משוב</p>
                            <p className="text-sm text-red-700">
                              {daysSinceLastFeedback === 2 
                                ? 'עברו יומיים מהמשוב האחרון' 
                                : `עברו ${daysSinceLastFeedback} ימים מהמשוב האחרון`}
                            </p>
                          </div>
                        </div>
                      )}

                      {reminderStatus === 'none' && lastFeedback && (
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>עדכני - משוב אחרון לפני {daysSinceLastFeedback} {daysSinceLastFeedback === 1 ? 'יום' : 'ימים'}</span>
                        </div>
                      )}

                      {!lastFeedback && (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>עדיין לא נכתבו משובים</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {experts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>אין מומחים במערכת</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}