import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import AlertsBadge from '../components/notifications/AlertsBadge';
import InternsPanel from '../components/admin/InternsPanel';
import PointsLeaderboard from '../components/admin/PointsLeaderboard';
import {
  Shield, Users, ClipboardList,
  Search, Filter, Clock, Stethoscope, Trash2,
  Trophy, ChevronDown, ChevronUp, X, MessageSquare
} from 'lucide-react';
import FeedbackMeetingManager from '../components/admin/FeedbackMeetingManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInHours } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function Admin() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('all');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [showMeetings, setShowMeetings] = useState(false);

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.filter({ role: 'admin' }),
    enabled: isAuthenticated
  });
  const queryClient = useQueryClient();
  const pullToRefreshRef = usePullToRefresh(['feedbacks']);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (!isAuthenticated || feedbacks.length === 0 || !user?.id) return;
    if (!(MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin')) return;
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

  const pendingExpertReviews = feedbacks.filter(f => f.status === 'pending_expert_review').length;
  const totalFeedbacks = feedbacks.length;

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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">פאנל ניהול</h1>
            <p className="text-slate-500 text-sm">צפייה בכל המשובים</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-1.5 md:gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50">
            <CardContent className="p-2 md:p-5">
              <div className="flex flex-col items-center md:items-start gap-1 md:gap-2">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 md:w-5 md:h-5 text-teal-700" />
                </div>
                <div className="text-center md:text-right">
                  <p className="text-slate-500 text-[10px] md:text-xs leading-tight">סה"כ<br className="md:hidden"/> משובים</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-800">{totalFeedbacks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-md ${pendingExpertReviews > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300' : 'bg-gradient-to-br from-white to-yellow-50'}`}>
            <CardContent className="p-2 md:p-5">
              <div className="flex flex-col items-center md:items-start gap-1 md:gap-2">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${pendingExpertReviews > 0 ? 'bg-gradient-to-br from-amber-300 to-orange-400' : 'bg-gradient-to-br from-orange-200 to-yellow-300'}`}>
                  <Clock className={`w-3.5 h-3.5 md:w-5 md:h-5 ${pendingExpertReviews > 0 ? 'text-amber-800' : 'text-orange-700'}`} />
                </div>
                <div className="text-center md:text-right">
                  <p className="text-slate-500 text-[10px] md:text-xs leading-tight">ממתינים<br className="md:hidden"/> למומחה</p>
                  <p className={`text-lg md:text-2xl font-bold ${pendingExpertReviews > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{pendingExpertReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to={createPageUrl('InternPasswords')} className="no-underline">
            <Card className="border-0 shadow-md bg-gradient-to-br from-white to-cyan-50 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-2 md:p-5">
                <div className="flex flex-col items-center md:items-start gap-1 md:gap-2">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-200 to-sky-300 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 md:w-5 md:h-5 text-cyan-700" />
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-slate-500 text-[10px] md:text-xs leading-tight">מתמחים</p>
                    <p className="text-lg md:text-2xl font-bold text-slate-800">{interns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ExpertPasswords')} className="no-underline">
            <Card className="border-0 shadow-md bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-2 md:p-5">
                <div className="flex flex-col items-center md:items-start gap-1 md:gap-2">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-200 to-violet-300 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5 md:w-5 md:h-5 text-purple-700" />
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-slate-500 text-[10px] md:text-xs leading-tight">מומחים</p>
                    <p className="text-lg md:text-2xl font-bold text-slate-800">{experts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <div className="no-underline cursor-pointer" onClick={() => setShowAdmins(true)}>
            <Card className="border-0 shadow-md bg-gradient-to-br from-white to-teal-50 hover:shadow-lg transition-all h-full">
              <CardContent className="p-2 md:p-5">
                <div className="flex flex-col items-center md:items-start gap-1 md:gap-2">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 md:w-5 md:h-5 text-teal-700" />
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-slate-500 text-[10px] md:text-xs leading-tight">מנהלים</p>
                    <p className="text-lg md:text-2xl font-bold text-slate-800">{adminUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admins Modal */}
          {showAdmins && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setShowAdmins(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" dir="rtl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-600" /> מנהלים ({adminUsers.length})
                  </h2>
                  <button onClick={() => setShowAdmins(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {adminUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {u.full_name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                  {adminUsers.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm">אין מנהלים רשומים</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Interns Panel */}
        <InternsPanel interns={interns} feedbacks={feedbacks} />

        {/* שיחות משוב */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl" onClick={() => setShowMeetings(p => !p)}>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                שיחות משוב
              </div>
              {showMeetings ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </CardTitle>
          </CardHeader>
          {showMeetings && (
            <CardContent className="pt-0">
              <FeedbackMeetingManager interns={interns} experts={experts} />
            </CardContent>
          )}
        </Card>

        {/* Points Leaderboard */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl" onClick={() => setShowLeaderboard(p => !p)}>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                לוח ניקוד
              </div>
              {showLeaderboard ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </CardTitle>
          </CardHeader>
          {showLeaderboard && <CardContent className="pt-0"><PointsLeaderboard /></CardContent>}
        </Card>

        {/* Feedbacks Search + List */}
        <div className="space-y-4">
          <p className="text-xs text-slate-500">חיפוש לפי שם מתמחה, מומחה, או קוד פרוצדורה (לדוגמה: #001)</p>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10 h-12 bg-white border-slate-200" />
            </div>
            <Select value={filterProcedure} onValueChange={setFilterProcedure}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-white border-slate-200">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="סנן לפי פרוצדורה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הפרוצדורות</SelectItem>
                {procedures.map(proc => <SelectItem key={proc} value={proc}>{proc}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

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
              <Button variant="ghost" size="icon" onClick={() => handleDeleteFeedback(feedback.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {filteredFeedbacks.length === 0 && (
            <div className="text-center py-12 text-slate-500">לא נמצאו משובים</div>
          )}
        </div>

      </div>
    </div>
  );
}