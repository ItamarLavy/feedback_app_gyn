import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield } from 'lucide-react';

export default function Experts() {
  const { user, isAuthenticated } = useAuth();

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  // מצא את המומחה שתואם למייל המחובר
  const myExpert = experts.find(e => e.email === user?.email);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">יש להתחבר כדי לגשת לעמוד זה</p>
        </div>
      </div>
    );
  }

  if (experts.length > 0 && !myExpert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8 max-w-md">
          <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700 text-lg font-medium mb-2">לא נמצא פרופיל מומחה עבורך</p>
          <p className="text-slate-500 text-sm">המייל שלך ({user?.email}) לא מופיע ברשימת המומחים. פנה למנהל לשיוך החשבון שלך.</p>
        </div>
      </div>
    );
  }

  if (!myExpert) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  // הפנה ישירות לעמוד האישי
  window.location.replace(createPageUrl('ExpertFeedbackDetail') + `?id=${myExpert.id}`);
  return null;
}