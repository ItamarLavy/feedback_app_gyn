import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';

/**
 * AlertsBadge - מציג מספר התראות פתוחות לאדם (מומחה או מתמחה)
 * 
 * למומחה: משובים שממתינים למילוי שלו
 * למתמחה: אם לא העלה טבלה החודש (מה-1 לחודש)
 */
export default function AlertsBadge({ personId, role = 'expert', className = '' }) {
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // למומחה - ספור משובים ממתינים
  const { data: pendingFeedbacks = [] } = useQuery({
    queryKey: ['pending-feedbacks-expert', personId],
    queryFn: () => base44.entities.Feedback.filter({ expert_id: personId, status: 'pending_expert_review' }),
    enabled: !!personId && role === 'expert'
  });

  // למתמחה - בדוק אם העלה טבלה החודש
  const { data: monthlyUploads = [] } = useQuery({
    queryKey: ['monthly-uploads-check', personId],
    queryFn: () => base44.entities.MonthlyProcedureUpload.filter({ intern_id: personId }),
    enabled: !!personId && role === 'intern'
  });

  let alertCount = 0;

  if (role === 'expert') {
    alertCount = pendingFeedbacks.length;
  } else if (role === 'intern') {
    // התראה אם: עברנו ה-1 לחודש ועדיין לא העלה
    const today = new Date();
    const dayOfMonth = today.getDate();
    if (dayOfMonth >= 1) {
      const uploaded = monthlyUploads.some(u => u.year_month === currentYearMonth);
      alertCount = uploaded ? 0 : 1;
    }
  }

  if (alertCount === 0) return null;

  return (
    <span
      className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-md ${className}`}
      title={role === 'expert' ? `${alertCount} משובים ממתינים למילוי` : 'לא העלית טבלת פרוצדורות החודש'}
    >
      {alertCount > 9 ? '9+' : alertCount}
    </span>
  );
}