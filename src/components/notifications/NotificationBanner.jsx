import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NotificationBanner({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState([]);
  const debounceRef = useRef(null);

  const fetchUnread = async () => {
    if (!userId) return;
    const res = await base44.entities.Notification.filter({
      recipient_user_id: userId,
      is_read: false
    }, '-created_date', 10);
    // רק אלה שאין להם scheduled_for (כלומר כבר הגיע זמנם) או שזמנם עבר
    const now = new Date();
    const due = res.filter(n => !n.scheduled_for || new Date(n.scheduled_for) <= now);
    setNotifications(due);
    setVisible(due.map(n => n.id));
  };

  const debouncedFetch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchUnread, 2000);
  };

  useEffect(() => {
    fetchUnread();
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_user_id === userId && !event.data?.is_read) {
        debouncedFetch();
      }
    });
    return () => {
      unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userId]);

  const dismiss = async (id) => {
    setVisible(prev => prev.filter(v => v !== id));
    await base44.entities.Notification.update(id, { is_read: true });
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 400);
  };

  const visibleNotifications = notifications.filter(n => visible.includes(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm" dir="rtl">
      <AnimatePresence>
        {visibleNotifications.slice(0, 3).map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.9 }}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm ${getBannerStyle(notification.type)}`}
          >
            <Bell className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-80" />
            <p className="flex-1 leading-snug">{notification.message}</p>
            <button
              onClick={() => dismiss(notification.id)}
              className="opacity-60 hover:opacity-100 flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function getBannerStyle(type) {
  switch (type) {
    case 'feedback_request': return 'bg-teal-600 text-white border-teal-700';
    case 'reminder_24h': return 'bg-amber-500 text-white border-amber-600';
    case 'reminder_48h': return 'bg-orange-600 text-white border-orange-700';
    case 'reminder_1week': return 'bg-blue-600 text-white border-blue-700';
    case 'manager_alert_overdue': return 'bg-red-600 text-white border-red-700';
    case 'bravo_first': return 'bg-emerald-500 text-white border-emerald-600';
    case 'bravo_double': return 'bg-purple-600 text-white border-purple-700';
    case 'weekly_record_intern': return 'bg-gradient-to-l from-amber-500 to-yellow-400 text-white border-amber-500';
    case 'weekly_summary_intern':
    case 'weekly_summary_expert': return 'bg-slate-700 text-white border-slate-800';
    default: return 'bg-white text-slate-800 border-slate-200';
  }
}