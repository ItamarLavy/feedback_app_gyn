import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, Home, BookOpen, Notebook, ArrowLeft, Settings, Lightbulb } from 'lucide-react';
import ImprovementSuggestionModal from '@/components/feedback/ImprovementSuggestionModal';

import { useAuth } from '@/lib/AuthContext';
import PointsBadge from '@/components/notifications/PointsBadge';
import NotificationBanner from '@/components/notifications/NotificationBanner';
import BottomNav from '@/components/mobile/BottomNav';
import PageTransition from '@/components/mobile/PageTransition';
import { processPendingNotifications, sendFridayManagerSummary, sendFridayChampionMessage } from '@/hooks/useNotifications';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];
const MANAGER_NAMES = ['יובל לביא', 'רונית גלעד', 'צביקה שמעונוביץ'];

// דפים שבהם לא מציגים כפתור חזור
const NO_BACK_PAGES = ['Home', 'Admin'];

// מפה: מאיזה דף מגיעים ולאן חוזרים (fallback אם אין היסטוריה)
const BACK_FALLBACK = {
  'InternDetails': '/Admin',
  'InternPasswords': '/Admin',
  'ExpertPasswords': '/Admin',
  'ManagerEmails': '/Admin',
  'FeedbackMeetingsManagement': '/Admin',
  'ExpertFeedbackDetail': '/',
  'InternProfile': '/',
  'Instructions': '/',
};

function BackButton({ currentPageName }) {
  const navigate = useNavigate();
  const fallback = BACK_FALLBACK[currentPageName] || '/';
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };
  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-white hover:text-slate-100 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-medium">חזור</span>
    </button>
  );
}

export default function Layout({ children, currentPageName }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const isHomePage = location.pathname === '/';
  const showBackButton = !NO_BACK_PAGES.includes(currentPageName) && !isHomePage;
  const isManager = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100">
      {showSuggestion && (
        <ImprovementSuggestionModal onClose={() => setShowSuggestion(false)} />
      )}
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
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
              {isManager && (
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
              )}
              <Link
                to="/UserSettings"
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'UserSettings'
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">חשבון</span>
              </Link>
              <button
                onClick={() => setShowSuggestion(true)}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-amber-600 hover:bg-amber-50"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">הצעות לשיפור</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header with Back Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shadow-md" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between h-16 px-4" dir="rtl">
          {showBackButton && (
            <BackButton currentPageName={currentPageName} />
          )}
          {(isHomePage || !showBackButton) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">משוב הדסה</span>
            </div>
          )}
          {isAuthenticated && user?.id && (
            <PointsBadge userId={user.id} />
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="hidden md:block pt-16">
        {children}
      </main>

      {/* Mobile Main Content */}
      <main className="md:hidden pt-24 pb-24">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Notification Banners */}
      {isAuthenticated && user?.id && (
        <NotificationBanner userId={user.id} />
      )}

      {/* Bottom Navigation for Mobile */}
      {isAuthenticated && (
        <BottomNav currentPageName={currentPageName} />
      )}
    </div>
  );
}