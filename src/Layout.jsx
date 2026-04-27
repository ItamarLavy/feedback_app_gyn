import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, Home, BookOpen, Notebook } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import PointsBadge from '@/components/notifications/PointsBadge';
import NotificationBanner from '@/components/notifications/NotificationBanner';
import { processPendingNotifications, sendFridayManagerSummary, sendFridayChampionMessage } from '@/hooks/useNotifications';

const MANAGER_NAMES = ['יובל לביא', 'רונית גלעד', 'צביקה שמעונוביץ'];
import { useEffect } from 'react';

export default function Layout({ children, currentPageName }) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      processPendingNotifications(user.id, user.email).catch(() => {});
      // שישי 8:00: הודעת אלוף לכל משתמש
      sendFridayChampionMessage(user.id, user.email).catch(() => {});
      // שישי 8:00: סיכום מנהלים
      if (MANAGER_NAMES.some(name => user.full_name?.includes(name))) {
        sendFridayManagerSummary(user.id, user.email).catch(() => {});
      }
    }
  }, [isAuthenticated, user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16" dir="rtl">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-800">משוב אגף נשים - הדסה</span>
            </Link>

            <div className="flex items-center gap-2">
              {isAuthenticated && user?.id && (
                <PointsBadge userId={user.id} />
              )}
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Home' 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">דף הבית</span>
              </Link>
              <Link
                to={createPageUrl('Interns')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Interns' || currentPageName === 'InternProfile'
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Notebook className="w-4 h-4" />
                <span className="hidden sm:inline">מתמחים</span>
              </Link>
              <Link
                to={createPageUrl('Experts')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Experts' || currentPageName === 'ExpertFeedbackDetail'
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">מומחים</span>
              </Link>
              <Link
                to={createPageUrl('Admin')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Admin' || currentPageName === 'InternDetails' || currentPageName === 'InternPasswords' || currentPageName === 'ExpertPasswords'
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">ניהול</span>
              </Link>
              <Link
                to={createPageUrl('Instructions')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Instructions'
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">הוראות</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Notification Banners */}
      {isAuthenticated && user?.id && (
        <NotificationBanner userId={user.id} />
      )}
    </div>
  );
}