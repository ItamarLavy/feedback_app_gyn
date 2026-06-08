import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, BookOpen, Loader2, ArrowLeft, Zap, Users, Settings } from 'lucide-react';
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
  const [expertId, setExpertId] = useState(null);

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
      const intern = interns[0];
      setInternId(intern.id);
      setUserName(intern.name || user.full_name || '');
      // תורן 1 מתקדם - יכול גם לגשת כמנטור
      if (intern.stage === 'תורן 1 מתקדם') {
        setUserType('senior_intern');
        setTargetUrl(createPageUrl('InternProfile') + `?id=${intern.id}`);
        // חפש גם ב-Expert entity לצורך כפתור המנטור
        const experts = await base44.entities.Expert.filter({ email });
        if (experts.length > 0) {
          setExpertId(experts[0].id);
        }
      } else {
        setUserType('intern');
        setTargetUrl(createPageUrl('InternProfile') + `?id=${intern.id}`);
      }
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
  if (userType === 'intern' || userType === 'expert' || userType === 'senior_intern') {
    const isIntern = userType === 'intern' || userType === 'senior_intern';
    const isSeniorIntern = userType === 'senior_intern';
    const points = userPoints?.[0]?.total_points || 0;
    const weeklyRecord = userPoints?.[0]?.weekly_record || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
        <div ref={pullToRefreshRef} className="max-w-4xl mx-auto px-5 py-8 w-full pb-40">
          {/* Header with Points */}
          <div className="text-center mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 md:mb-4">
              ברוך הבא, {userName}!
            </h1>
            
  
          </div>

          {/* Action Panel */}
          <div className="grid md:grid-cols-2 gap-3 md:gap-6 mb-8">
            {targetUrl && <Link to={targetUrl}>
              <Card className="border-2 border-blue-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-4 md:p-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:shadow-lg transition-all bg-gradient-to-br from-blue-200 to-cyan-200 group-hover:from-blue-300 group-hover:to-cyan-300">
                      <Stethoscope className="w-5 h-5 md:w-7 md:h-7 text-blue-800" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">
                       {isIntern ? 'פרופיל מתמחה' : 'פרופיל בכיר'}
                      </h3>
                      <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">
                       {isIntern ? 'צפה בפרופיל שלך ומלא משוב עצמי על פרוצדורה' : 'צפה בפרופיל שלך ובמשובים הממתינים לאישורך'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>}
            {/* תורן 1 מתקדם - גישה נוספת כמומחה */}
            {isSeniorIntern && (
              <Link to={expertId ? createPageUrl('ExpertFeedbackDetailWithAuth') + `?id=${expertId}` : createPageUrl('ExpertFeedbackDetailWithAuth')}>
                <Card className="border-2 border-purple-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="p-4 md:p-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:shadow-lg transition-all bg-gradient-to-br from-purple-200 to-pink-200 group-hover:from-purple-300 group-hover:to-pink-300">
                        <Stethoscope className="w-5 h-5 md:w-7 md:h-7 text-purple-800" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">פרופיל בכיר</h3>
                        <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">צפה בפרופיל הבכיר שלך ואשר משובים הממתינים</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
            {!targetUrl && (
              <Card className="border-0 shadow-xl bg-slate-50">
                <CardContent className="p-4 md:p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
                  <p className="text-slate-600">טוען...</p>
                </CardContent>
              </Card>
            )}

            <Link to={createPageUrl('Instructions')}>
              <Card className="border-2 border-amber-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardContent className="p-4 md:p-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center group-hover:from-amber-300 group-hover:to-yellow-400 transition-colors shadow-md">
                      <BookOpen className="w-5 h-5 md:w-7 md:h-7 text-amber-800" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-slate-800 mb-0.5 md:mb-2">הוראות שימוש</h3>
                      <p className="text-sm text-slate-600 md:font-medium md:text-slate-700">מדריך מפורט לשימוש במערכת</p>
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
  const isManager = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';
  
  if (isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
        <div ref={pullToRefreshRef} className="max-w-4xl mx-auto px-4 py-6 md:py-12 w-full pb-40">
          <div className="text-center mb-6 md:mb-12">
             <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-3 md:mb-6">
               <Stethoscope className="w-7 h-7 md:w-10 md:h-10 text-white" />
             </div>
             <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-1 md:mb-3">
               ברוך הבא, {userName}
             </h1>
             <p className="text-base md:text-xl text-teal-700 font-medium mb-0.5 md:mb-2">הדסה הר הצופים</p>
             <p className="text-sm md:text-lg text-slate-600">מערכת לניהול ומעקב אחר התקדמות מתמחים</p>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
             <Link to={createPageUrl('Interns')}>
               <Card className="border-2 border-teal-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-teal-50 to-emerald-50">
                 <CardContent className="p-4 md:p-8">
                   <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center group-hover:from-teal-400 group-hover:to-emerald-500 transition-colors flex-shrink-0 shadow-md">
                       <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
                     </div>
                     <div>
                       <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">פרופיל מתמחה</h3>
                       <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">צפה בפרופיל המתמחה ומלא משוב עצמי על פרוצדורה</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </Link>

             <Link to={createPageUrl('Experts')}>
               <Card className="border-2 border-teal-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-teal-50 to-emerald-50">
                 <CardContent className="p-4 md:p-8">
                   <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center group-hover:from-teal-400 group-hover:to-emerald-500 transition-colors flex-shrink-0 shadow-md">
                       <Stethoscope className="w-5 h-5 md:w-7 md:h-7 text-white" />
                     </div>
                     <div>
                       <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">פרופיל בכיר</h3>
                       <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">צפה בפרופיל הבכיר ואשר משובים הממתינים</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </Link>

             <Link to={createPageUrl('Instructions')}>
               <Card className="border-2 border-teal-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-teal-50 to-emerald-50">
                 <CardContent className="p-4 md:p-8">
                   <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center group-hover:from-teal-400 group-hover:to-emerald-500 transition-colors flex-shrink-0 shadow-md">
                       <BookOpen className="w-5 h-5 md:w-7 md:h-7 text-white" />
                     </div>
                     <div>
                       <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">הוראות שימוש</h3>
                       <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">מדריך מפורט לשימוש במערכת</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </Link>

             <Link to={createPageUrl('Admin')}>
               <Card className="border-2 border-teal-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full bg-gradient-to-br from-teal-50 to-emerald-50">
                 <CardContent className="p-4 md:p-8">
                   <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center group-hover:from-teal-400 group-hover:to-emerald-500 transition-colors flex-shrink-0 shadow-md">
                       <Shield className="w-5 h-5 md:w-7 md:h-7 text-white" />
                     </div>
                     <div>
                       <h3 className="text-base md:text-xl font-bold text-slate-900 mb-0.5 md:mb-2">פאנל ניהול</h3>
                       <p className="text-sm text-slate-600 md:font-medium md:text-slate-800">צפייה בכל המשובים, ניהול מתמחים ומומחים</p>
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

            // ברירת מחדל עבור משתמשים לא מוכרים
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
      <div className="text-center px-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-slate-600">טוען...</p>
      </div>
    </div>
  );
}