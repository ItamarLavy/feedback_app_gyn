import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2, ChevronLeft, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Interns() {
  const { user, isAuthenticated } = useAuth();

  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list(),
    enabled: isAuthenticated
  });

  // מצא את המתמחה שתואם למייל המחובר
  const myIntern = interns.find(i => i.email === user?.email);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">יש להתחבר כדי לגשת לעמוד זה</p>
        </div>
      </div>
    );
  }

  if (interns.length > 0 && !myIntern) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8 max-w-md">
          <UserCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700 text-lg font-medium mb-2">לא נמצא פרופיל מתמחה עבורך</p>
          <p className="text-slate-500 text-sm">המייל שלך ({user?.email}) לא מופיע ברשימת המתמחים. פנה למנהל לשיוך החשבון שלך.</p>
        </div>
      </div>
    );
  }

  if (!myIntern) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  // הפנה ישירות לעמוד האישי
  window.location.replace(createPageUrl('InternProfile') + `?id=${myIntern.id}`);
  return null;
}