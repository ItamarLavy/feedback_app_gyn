import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Notebook, Users, Shield, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    checkUserRole();
  }, [isAuthenticated, user?.email]);

  const checkUserRole = async () => {
    setChecking(true);
    const email = user.email;

    // מנהל?
    if (MANAGER_EMAILS.includes(email) || user.role === 'admin') {
      setChecking(false);
      return; // נשאר בדף הבית עם כל הכפתורים
    }

    // מתמחה?
    const interns = await base44.entities.Intern.filter({ email });
    if (interns.length > 0) {
      navigate(createPageUrl('InternProfile') + `?id=${interns[0].id}`);
      return;
    }

    // מומחה?
    const experts = await base44.entities.Expert.filter({ email });
    if (experts.length > 0) {
      navigate(createPageUrl('ExpertFeedbackDetailWithAuth') + `?id=${experts[0].id}`);
      return;
    }

    // לא מוכר – שלח לדף המתנה
    navigate(createPageUrl('PendingAccess'));
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-600">מאמת הרשאות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-6">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            מערכת משוב אגף נשים
          </h1>
          <p className="text-xl text-teal-700 font-medium mb-2">הדסה הר הצופים</p>
          <p className="text-lg text-slate-600">
            מערכת לניהול ומעקב אחר התקדמות מתמחים
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link to={createPageUrl('Interns')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Notebook className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל מתמחים</h3>
                    <p className="text-slate-600">
                      כניסה לעמוד אישי, הזנת משוב עצמי ומעקב אחר התקדמות
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Experts')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Stethoscope className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל מומחים</h3>
                    <p className="text-slate-600">
                      מילוי משובים על מתמחים וצפייה במשובים שהושלמו
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Admin')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                    <Shield className="w-7 h-7 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל ניהול</h3>
                    <p className="text-slate-600">
                      צפייה בכל המשובים, ניהול מתמחים ומומחים
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Instructions')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <BookOpen className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">הוראות שימוש</h3>
                    <p className="text-slate-600">
                      מדריך מפורט לשימוש במערכת
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}