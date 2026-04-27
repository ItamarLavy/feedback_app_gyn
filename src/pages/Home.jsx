import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [targetUrl, setTargetUrl] = useState(null);
  const [userType, setUserType] = useState(null); // 'manager' | 'intern' | 'expert' | 'unknown'
  const [userName, setUserName] = useState('');
  const pullToRefreshRef = usePullToRefresh(['user']);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      setChecking(false);
      return;
    }
    checkUserRole();
  }, [isAuthenticated, user?.email]);

  const checkUserRole = async () => {
    const email = user.email;

    if (MANAGER_EMAILS.includes(email) || user.role === 'admin') {
      setUserType('manager');
      setUserName(user.full_name || '');
      setChecking(false);
      return;
    }

    const interns = await base44.entities.Intern.filter({ email });
    if (interns.length > 0) {
      setUserType('intern');
      setUserName(interns[0].name || user.full_name || '');
      setTargetUrl(createPageUrl('InternProfile') + `?id=${interns[0].id}`);
      setChecking(false);
      return;
    }

    const experts = await base44.entities.Expert.filter({ email });
    if (experts.length > 0) {
      setUserType('expert');
      setUserName(experts[0].name || user.full_name || '');
      setTargetUrl(createPageUrl('ExpertFeedbackDetailWithAuth') + `?id=${experts[0].id}`);
      setChecking(false);
      return;
    }

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

  // מתמחה / מומחה – דף ברוך הבא עם כפתור כניסה
  if (userType === 'intern' || userType === 'expert') {
    const isIntern = userType === 'intern';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-6">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ברוך הבא, {userName}!
          </h1>
          <p className="text-slate-500 mb-8 text-lg">
            {isIntern ? 'אתה מחובר כמתמחה' : 'אתה מחובר כמומחה'}
          </p>
          <Button
            onClick={() => navigate(targetUrl)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6 h-auto rounded-xl shadow-lg"
          >
            {isIntern ? 'כניסה לעמוד המתמחה שלי' : 'כניסה לעמוד המומחה שלי'}
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    );
  }

  // מנהל – דף הבית המלא
  return (
    <div ref={pullToRefreshRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 overflow-y-auto" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-6">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            {userName ? `ברוך הבא, ${userName}` : 'מערכת משוב אגף נשים'}
          </h1>
          <p className="text-xl text-teal-700 font-medium mb-2">הדסה הר הצופים</p>
          <p className="text-lg text-slate-600">מערכת לניהול ומעקב אחר התקדמות מתמחים</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to={createPageUrl('Admin')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                    <Shield className="w-7 h-7 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל ניהול</h3>
                    <p className="text-slate-600">צפייה בכל המשובים, ניהול מתמחים ומומחים</p>
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
                    <p className="text-slate-600">מדריך מפורט לשימוש במערכת</p>
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