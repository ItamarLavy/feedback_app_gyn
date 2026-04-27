import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Notebook, Stethoscope, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function BottomNav({ currentPageName }) {
  const { user } = useAuth();
  const isManager = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-lg border-t border-slate-200/50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16">
        <Link
          to={createPageUrl('Home')}
          className={`flex flex-col items-center gap-1 px-3 py-2 ${
            currentPageName === 'Home' ? 'text-teal-600' : 'text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">דף הבית</span>
        </Link>

        {!isManager && (
          <>
            <Link
              to={createPageUrl('Interns')}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                currentPageName === 'Interns' ? 'text-teal-600' : 'text-slate-600'
              }`}
            >
              <Notebook className="w-5 h-5" />
              <span className="text-xs">מתמחים</span>
            </Link>

            <Link
              to={createPageUrl('Experts')}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                currentPageName === 'Experts' ? 'text-teal-600' : 'text-slate-600'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span className="text-xs">מומחים</span>
            </Link>
          </>
        )}

        {isManager && (
          <>
            <Link
              to={createPageUrl('Admin')}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                currentPageName === 'Admin' ? 'text-teal-600' : 'text-slate-600'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs">ניהול</span>
            </Link>

            <Link
              to={createPageUrl('Instructions')}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                currentPageName === 'Instructions' ? 'text-teal-600' : 'text-slate-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">הוראות</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}