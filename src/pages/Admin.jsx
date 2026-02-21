import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PasswordModal from '../components/admin/PasswordModal';
import FeedbackCardDetailed from '../components/feedback/FeedbackCardDetailed';
import AnomalousReports from '../components/admin/AnomalousReports';
import FeedbackMeetingManager from '../components/admin/FeedbackMeetingManager';
import SystemAISummary from '../components/admin/SystemAISummary';
import { 
  Shield, Users, ClipboardList, ArrowLeft, 
  Star, Search, Filter, Clock, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RATING_KEYS = ['knowledge_rating', 'manual_skill_rating', 'professionalism_rating', 'independence_rating'];

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('all');
  const queryClient = useQueryClient();

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: isAuthenticated
  });

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

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.FeedbackMeeting.list(),
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">פאנל ניהול</h1>
              <p className="text-slate-500 text-sm">צפייה בכל המשובים</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to={createPageUrl('EmailManagement')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Mail className="w-4 h-4" />
              ניהול מיילים
            </Link>
            <Link 
              to={createPageUrl('Home')}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              חזרה לדף הבית
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">סה"כ משובים</p>
                  <p className="text-3xl font-bold text-slate-800">{totalFeedbacks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">דירוג ממוצע מומחים</p>
                  <p className="text-3xl font-bold text-slate-800">{avgRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${pendingExpertReviews > 0 ? 'bg-amber-50 border-2 border-amber-300' : 'bg-white'}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  pendingExpertReviews > 0 ? 'bg-amber-200' : 'bg-orange-100'
                }`}>
                  <Clock className={`w-6 h-6 ${pendingExpertReviews > 0 ? 'text-amber-700' : 'text-orange-600'}`} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">ממתינים למומחה</p>
                  <p className={`text-3xl font-bold ${pendingExpertReviews > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                    {pendingExpertReviews}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">מתמחים</p>
                  <p className="text-3xl font-bold text-slate-800">{interns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System AI Summary */}
        <div className="mb-8">
          <SystemAISummary feedbacks={feedbacks} interns={interns} meetings={meetings} />
        </div>

        {/* Feedback Meeting Manager */}
        <div className="mb-8">
          <FeedbackMeetingManager interns={interns} experts={experts} />
        </div>

        {/* Anomalous Reports */}
        <div className="mb-8">
          <AnomalousReports feedbacks={feedbacks} interns={interns} />
        </div>



        {/* Interns List */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg">מתמחים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${
                      needsReminder 
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300' 
                        : 'bg-slate-50 hover:bg-teal-50 border-slate-100 hover:border-teal-200'
                    }`}
                  >
                    {needsReminder && (
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
                      {intern.name?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{intern.name}</p>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{avg}</span>
                        <span className="text-slate-300 mx-1">•</span>
                        <span>{internFeedbacks.length} משובים</span>
                      </div>
                      {needsReminder && (
                        <p className="text-xs text-amber-700 mt-1">עבר שבוע מהמשוב האחרון</p>
                      )}
                    </div>
                  </Link>
                );
              })}
              {interns.length === 0 && (
                <p className="text-slate-500">אין מתמחים במערכת</p>
              )}
            </div>
          </CardContent>
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

        {/* Feedbacks List */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {filteredFeedbacks.map(feedback => (
            <FeedbackCardDetailed 
              key={feedback.id} 
              feedback={feedback} 
              showDelete={true}
              onDelete={handleDeleteFeedback}
            />
          ))}
          {filteredFeedbacks.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              לא נמצאו משובים
            </div>
          )}
        </div>
      </div>
    </div>
  );
}