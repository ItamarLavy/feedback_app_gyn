import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, BookOpen, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useQuery } from '@tanstack/react-query';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [targetUrl, setTargetUrl] = useState(null);
  const [userType, setUserType] = useState(null); // 'manager' | 'intern' | 'expert' | 'unknown'
  const [userName, setUserName] = useState('');
  const pullToRefreshRef = usePullToRefresh(['user']);
  const [internId, setInternId] = useState(null);

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: () => base44.entities.UserPoints.filter({ user_id: user?.id }),
    enabled: !!user?.id && (userType === 'intern' || userType === 'expert')
  });

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
      setInternId(interns[0].id);
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

  // מתמחה / מומחה – דף הבית עם נקודות ופנלים
  if (userType === 'intern' || userType === 'expert') {
    const isIntern = userType === 'intern';
    const points = userPoints?.[0]?.total_points || 0;
    const weeklyRecord = userPoints?.[0]?.weekly_record || 0;
    
    return (
      <div ref={pullToRefreshRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 overflow-y-auto" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header with Points */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              ברוך הבא, {userName}!
            </h1>
            
            {/* Points Display */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-slate-600 text-sm">סה"כ נקודות</p>
                      <p className="text-3xl font-bold text-amber-600">{points}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="w-8 h-8 text-teal-500" />
                    <div>
                      <p className="text-slate-600 text-sm">השבוע</p>
                      <p className="text-3xl font-bold text-teal-600">{weeklyRecord}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Panel */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link to={targetUrl}>
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-opacity-20 transition-colors ${
                      isIntern 
                        ? 'bg-blue-100 group-hover:bg-blue-200' 
                        : 'bg-purple-100 group-hover:bg-purple-200'
                    }`}>
                      <Stethoscope className={`w-7 h-7 ${isIntern ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {isIntern ? 'מלא משוב כמתמחה' : 'מלא משוב כמומחה'}
                      </h3>
                      <p className="text-slate-600">
                        {isIntern ? 'שלח משוב עצמי על פרוצדורה' : 'בדוק משובים הממתינים'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('Instructions')}>
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full">
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