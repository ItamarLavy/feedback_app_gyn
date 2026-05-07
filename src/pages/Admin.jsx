import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import AnomalousReports from '../components/admin/AnomalousReports';
import DepartmentPanel from '../components/admin/DepartmentPanel';
import PointsLeaderboard from '../components/admin/PointsLeaderboard';
import InternProgressBadges from '../components/intern/InternProgressBadges';
import AccessRequestsPanel from '../components/admin/AccessRequestsPanel';
import MentoringMeetingManager from '../components/admin/MentoringMeetingManager';
import { 
  Shield, Users, ClipboardList, ArrowLeft, 
  Star, Search, Filter, Clock, Key, BookOpen, Hash, User, Stethoscope, Trash2, X, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInHours } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];
const MANAGER_NAMES = ['יובל לביא', 'רונית גלעד', 'צביקה שמעונוביץ'];
const RATING_KEYS = ['knowledge_rating', 'manual_skill_rating', 'professionalism_rating', 'independence_rating'];

export default function Admin() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('all');
  const [showAdminInstructions, setShowAdminInstructions] = useState(false);
  const [showInternsList, setShowInternsList] = useState(false);
  const [selectedModal, setSelectedModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();
  const pullToRefreshRef = usePullToRefresh(['feedbacks']);
  const accessRequestsRef = useRef(null);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: isAuthenticated
  });

  // שלח התראות למנהלים על משובים שלא נענו מעל שבוע
  useEffect(() => {
    if (!isAuthenticated || feedbacks.length === 0 || !user?.id) return;
    const isManager = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';
    if (!isManager) return;

    const checkOverdue = async () => {
      const overdue = feedbacks.filter(f =>
        f.status === 'pending_expert_review' &&
        f.intern_submitted_date &&
        differenceInHours(new Date(), new Date(f.intern_submitted_date)) > 168
      );
      for (const f of overdue) {
        const alreadyAlerted = await base44.entities.Notification.filter({
          recipient_user_id: user.id,
          type: 'manager_alert_overdue',
          feedback_id: f.id,
          is_read: false
        });
        if (alreadyAlerted.length === 0) {
          await base44.entities.Notification.create({
            recipient_user_id: user.id,
            recipient_role: 'manager',
            type: 'manager_alert_overdue',
            message: `🚨 ${f.intern_name} ביקש משוב מ-${f.expert_name} לפני ${Math.round(differenceInHours(new Date(), new Date(f.intern_submitted_date)) / 24)} ימים ועדיין לא קיבל תגובה.`,
            feedback_id: f.id,
            intern_name: f.intern_name,
            expert_name: f.expert_name,
            is_read: false,
            sent_at: new Date().toISOString()
          });
        }
      }
    };
    checkOverdue().catch(console.warn);
  }, [isAuthenticated, feedbacks, user?.id]);

  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list(),
    enabled: isAuthenticated
  });

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  const { data: userPoints = [] } = useQuery({
    queryKey: ['userPoints'],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.list();
      return points;
    },
    enabled: isAuthenticated
  });

  const handleDeleteFeedback = async (feedbackId) => {
    await base44.entities.Feedback.delete(feedbackId);
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  };

  const procedures = [...new Set(feedbacks.map(f => f.procedure_type))];

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.intern_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.expert_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.procedure_id_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProcedure = filterProcedure === 'all' || f.procedure_type === filterProcedure;
    return matchesSearch && matchesProcedure;
  });

  // Count pending expert reviews
  const pendingExpertReviews = feedbacks.filter(f => f.status === 'pending_expert_review').length;
  const completedReviews = feedbacks.filter(f => f.status === 'completed').length;

  // Stats - Only expert ratings
  const totalFeedbacks = feedbacks.length;
  const expertRatings = [];
  feedbacks.forEach(f => {
    ['expert_knowledge_rating', 'expert_manual_skill_rating', 'expert_professionalism_rating', 'expert_independence_rating'].forEach(key => {
      if (f[key] && f[key] > 0) expertRatings.push(f[key]);
    });
  });
  const avgRating = expertRatings.length > 0 
    ? (expertRatings.reduce((a, b) => a + b, 0) / expertRatings.length).toFixed(1)
    : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">אין לך הרשאה לצפות בדף זה</p>
          <p className="text-slate-400 text-sm mt-2">דף זה מיועד למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50/40 to-cyan-100" dir="rtl">
      <div ref={pullToRefreshRef} className="max-w-6xl mx-auto px-5 py-8 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800">פאנל ניהול</h1>
              <p className="text-slate-500 text-sm">צפייה בכל המשובים</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => accessRequestsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold gap-2 h-11 flex-1 sm:flex-none shadow-md"
            >
              <Mail className="w-5 h-5" />
              בקשות חדשות
            </Button>
            <Link 
              to={createPageUrl('Home')}
              className="flex items-center justify-center gap-2 px-4 h-11 rounded-lg text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
            >
              חזרה
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
         <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
           <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50 hover:shadow-xl transition-shadow">
             <CardContent className="p-4 md:p-5">
               <div className="flex flex-col gap-2">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center">
                   <ClipboardList className="w-5 h-5 text-teal-700" />
                 </div>
                 <div>
                   <p className="text-slate-500 text-xs">סה"כ משובים</p>
                   <p className="text-xl md:text-2xl font-bold text-slate-800">{totalFeedbacks}</p>
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${pendingExpertReviews > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400' : 'bg-gradient-to-br from-white to-yellow-50'}`}>
             <CardContent className="p-4 md:p-5">
               <div className="flex flex-col gap-2">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingExpertReviews > 0 ? 'bg-gradient-to-br from-amber-300 to-orange-400' : 'bg-gradient-to-br from-orange-200 to-yellow-300'}`}>
                   <Clock className={`w-5 h-5 ${pendingExpertReviews > 0 ? 'text-amber-800' : 'text-orange-700'}`} />
                 </div>
                 <div>
                   <p className="text-slate-500 text-xs">ממתינים למומחה</p>
                   <p className={`text-xl md:text-2xl font-bold ${pendingExpertReviews > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{pendingExpertReviews}</p>
                 </div>
               </div>
             </CardContent>
           </Card>

           <Link to={createPageUrl('InternPasswords')} className="no-underline">
             <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-cyan-50 hover:shadow-xl hover:bg-gradient-to-br hover:from-cyan-50 hover:to-sky-100 transition-all cursor-pointer h-full">
               <CardContent className="p-4 md:p-5">
                 <div className="flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-200 to-sky-300 flex items-center justify-center">
                     <Users className="w-5 h-5 text-cyan-700" />
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs">מתמחים</p>
                     <p className="text-xl md:text-2xl font-bold text-slate-800">{interns.length}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </Link>

           <Link to={createPageUrl('ExpertPasswords')} className="no-underline">
             <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-100 transition-all cursor-pointer h-full">
               <CardContent className="p-4 md:p-5">
                 <div className="flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-200 to-violet-300 flex items-center justify-center">
                     <Stethoscope className="w-5 h-5 text-purple-700" />
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs">מומחים</p>
                     <p className="text-xl md:text-2xl font-bold text-slate-800">{experts.length}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </Link>

           <Link to={createPageUrl('ManagerEmails')} className="no-underline">
             <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-teal-50 hover:shadow-xl hover:bg-gradient-to-br hover:from-teal-50 hover:to-emerald-100 transition-all cursor-pointer h-full">
               <CardContent className="p-4 md:p-5">
                 <div className="flex flex-col gap-2">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center">
                     <Shield className="w-5 h-5 text-teal-700" />
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs">מנהלים</p>
                     <p className="text-xl md:text-2xl font-bold text-slate-800">{MANAGER_EMAILS.length}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </Link>
         </div>

        {/* Admin Instructions - Collapsible */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader
            className="bg-teal-50 border-b border-teal-100 cursor-pointer select-none hover:bg-teal-100 transition-colors rounded-xl"
            onClick={() => setShowAdminInstructions(!showAdminInstructions)}
          >
            <CardTitle className="flex items-center justify-between text-teal-900">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                הוראות למנהלים
              </div>
              <span className="text-teal-500 text-lg">{showAdminInstructions ? '▲' : '▼'}</span>
            </CardTitle>
          </CardHeader>
          {showAdminInstructions && (
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">צפייה בכל המשובים</h4>
                    <p className="text-sm text-slate-600">בפאנל הניהול תוכל לראות את כל המשובים במערכת, לחפש ולסנן לפי מתמחה/מומחה/פרוצדורה, ולמחוק משובים במידת הצורך.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">אישור בקשות גישה</h4>
                    <p className="text-sm text-slate-600">כאשר משתמש חדש נכנס עם גוגל ואין לו גישה, הבקשה שלו תופיע בראש הדף. בחר תפקיד (מתמחה/מומחה), בחר את הרשומה המתאימה, ולחץ "אשר" – המייל יתעדכן אוטומטית.</p>
                    <p className="text-sm text-slate-600 mt-1">ניתן גם להוסיף מיילים מראש דרך כפתורי <strong>"מיילים מתמחים"</strong> / <strong>"מיילים מומחים"</strong>.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">עדכון מיילים מראש</h4>
                    <p className="text-sm text-slate-600">ניתן לרשום את המייל של כל מתמחה/מומחה מראש דרך כפתורי <strong>"מיילים מתמחים"</strong> / <strong>"מיילים מומחים"</strong>. כך הם יזוהו אוטומטית בכניסה הראשונה.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">4</div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">ניהול שוטף</h4>
                    <p className="text-sm text-slate-600">לחץ על שם מתמחה לצפייה מפורטת. ניתן לתזמן פגישות מנטורינג, לצפות בסיכומי AI ובדוחות חריגים, ולמחוק משובים במידת הצורך.</p>
                  </div>
                </div>

              </div>
            </CardContent>
          )}
        </Card>

        {/* Access Requests */}
        <div ref={accessRequestsRef}>
          <AccessRequestsPanel interns={interns} experts={experts} queryClient={queryClient} />
        </div>

        {/* Mentoring Meetings */}
        <MentoringMeetingManager interns={interns} experts={experts} />

        {/* Points Leaderboard */}
        <PointsLeaderboard />

        {/* Anomalous Reports */}
        <div className="mb-8">
          <AnomalousReports feedbacks={feedbacks} interns={interns} />
        </div>

        {/* Department Panels */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            מעקב לפי מחלקה
          </h2>
          <DepartmentPanel department="מיילדות" label="מיילדות" interns={interns} />
          <DepartmentPanel department="גניקולוגיה" label="גניקולוגיה" interns={interns} />
          <DepartmentPanel department="פוריות" label="פוריות" interns={interns} />
          <DepartmentPanel department="אונקולוגיה" label="אונקולוגיה" interns={interns} />
          <DepartmentPanel department="רוטציה חיצונית" label="רוטציה חיצונית" interns={interns} />
        </div>

        {/* Interns List - Collapsible */}
         <Card className="border-0 shadow-lg mb-8">
           <CardHeader
             className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl"
             onClick={() => setShowInternsList(prev => !prev)}
           >
             <CardTitle className="flex items-center justify-between text-lg">
               <div className="flex items-center gap-2">
                 <Users className="w-5 h-5 text-teal-600" />
                 מתמחים ({interns.length})
               </div>
               <span className="text-slate-400 text-lg">{showInternsList ? '▲' : '▼'}</span>
             </CardTitle>
           </CardHeader>
           {showInternsList && <CardContent>
             <div className="flex flex-col gap-3">
                  {interns.map(intern => {
                    const internFeedbacks = feedbacks.filter(f => f.intern_id === intern.id);
                    const internRatings = [];
                    internFeedbacks.forEach(f => {
                      RATING_KEYS.forEach(key => {
                        if (f[key] && f[key] > 0) internRatings.push(f[key]);
                      });
                    });
                    const avg = internRatings.length > 0
                      ? (internRatings.reduce((a, b) => a + b, 0) / internRatings.length).toFixed(1)
                      : '-';

                    // בדיקה אם עבר שבוע מאז המשוב האחרון
                    const lastFeedback = internFeedbacks[0]; // feedbacks ממוינים לפי תאריך
                    const needsReminder = lastFeedback 
                      ? (Date.now() - new Date(lastFeedback.created_date).getTime()) > 7 * 24 * 60 * 60 * 1000
                      : internFeedbacks.length > 0;

                    return (
                      <Link
                        key={intern.id}
                        to={createPageUrl('InternDetails') + `?id=${intern.id}`}
                        className={`flex items-start gap-3 p-4 rounded-xl transition-all border ${
                          needsReminder 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-200 hover:border-amber-300 shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {needsReminder && (
                            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          )}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {intern.name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{intern.name}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                              <span>{avg}</span>
                              <span className="text-slate-300">•</span>
                              <span>{internFeedbacks.length} משובים</span>
                            </div>
                            {needsReminder && (
                              <p className="text-xs text-amber-700 mt-1 font-medium">⚠ עבר שבוע מהמשוב האחרון</p>
                            )}
                            <div className="mt-2">
                              <InternProgressBadges feedbacks={internFeedbacks} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {interns.length === 0 && (
                    <p className="text-center text-slate-500 py-8">אין מתמחים במערכת</p>
                  )}
                </div>
           </CardContent>}
         </Card>





        {/* Filters */}
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            חיפוש לפי שם מתמחה, מומחה, או קוד פרוצדורה (לדוגמה: #001)
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="חיפוש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 bg-white border-slate-200"
              />
            </div>
            <Select value={filterProcedure} onValueChange={setFilterProcedure}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-white border-slate-200">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="סנן לפי פרוצדורה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הפרוצדורות</SelectItem>
                {procedures.map(proc => (
                  <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feedbacks List - Compact */}
         <div className="space-y-2 mt-6">
           {filteredFeedbacks.map(feedback => (
             <div key={feedback.id} className="bg-white rounded-lg p-2 md:p-3 border border-slate-200 hover:border-teal-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3 text-sm md:text-base">
               <div className="flex flex-wrap items-center gap-2 flex-1">
                 <span className="font-mono text-teal-700 font-semibold">{feedback.procedure_id_code}</span>
                 <span className="text-slate-700 font-medium truncate">{feedback.intern_name}</span>
                 <span className="text-slate-600 truncate hidden sm:inline">{feedback.expert_name}</span>
                 <span className="text-slate-600 truncate">{feedback.procedure_type}</span>
                 {feedback.procedure_date && (
                   <span className="text-xs text-slate-500">{format(new Date(feedback.procedure_date), 'dd/MM/yyyy')}</span>
                 )}
                 <Badge className={`text-xs ${feedback.status === 'completed' ? 'bg-green-600' : 'bg-amber-600'}`}>
                   {feedback.status === 'completed' ? 'הושלם' : 'ממתין'}
                 </Badge>
               </div>

               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => handleDeleteFeedback(feedback.id)}
                 className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </div>
           ))}
           {filteredFeedbacks.length === 0 && (
             <div className="text-center py-12 text-slate-500">
               לא נמצאו משובים
             </div>
           )}
         </div>


      </div>
    </div>
  );
}