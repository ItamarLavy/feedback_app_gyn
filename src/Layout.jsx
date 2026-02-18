import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Shield, Home } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
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
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Home' 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">הזנת משוב</span>
              </Link>
              <Link
                to={createPageUrl('Admin')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentPageName === 'Admin' || currentPageName === 'InternDetails'
                    ? 'bg-teal-100 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">ניהול</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}