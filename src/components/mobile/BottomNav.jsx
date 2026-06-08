import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Shield, Settings, Lightbulb, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import ImprovementSuggestionModal from '@/components/feedback/ImprovementSuggestionModal';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function BottomNav({ currentPageName }) {
  const { user } = useAuth();
  const location = useLocation();
  const { handleTabPress, isTabActive } = useTabNavigation();
  const isManager = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';
  const [showSuggestion, setShowSuggestion] = useState(false);

  const userRole = isManager ? 'manager' : 'unknown';

  const navItems = isManager
    ? [
        { label: 'דף הבית', icon: Home, path: '/', id: 'home', root: '/' },
        { label: 'ניהול', icon: Shield, path: createPageUrl('Admin'), id: 'admin', root: '/Admin' },
        { label: 'חשבון', icon: Settings, path: '/UserSettings', id: 'settings', root: '/UserSettings' }
      ]
    : [
        { label: 'דף הבית', icon: Home, path: '/', id: 'home', root: '/' },
        { label: 'נקודות', icon: Star, path: '/PointsTracker', id: 'points', root: '/PointsTracker' },
        { label: 'חשבון', icon: Settings, path: '/UserSettings', id: 'settings', root: '/UserSettings' }
      ];

  const handleNavClick = (item) => {
    handleTabPress(item.path, item.root);
  };

  return (
    <>
      {showSuggestion && (
        <ImprovementSuggestionModal onClose={() => setShowSuggestion(false)} userRole={userRole} />
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16" dir="rtl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isTabActive(item.root);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowSuggestion(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-white/70 hover:text-white"
          >
            <Lightbulb className="w-5 h-5 text-white/70" />
            <span className="text-xs font-medium text-white/70">הצעות</span>
          </button>
        </div>
      </nav>
    </>
  );
}