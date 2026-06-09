import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const POINTS_INFO = [
  { emoji: '📋', text: 'מתמחה ממלא משוב על פרוצדורה', points: 5 },
  { emoji: '✅', text: 'מומחה מאשר משוב – גם למומחה וגם למתמחה', points: 5 },
  { emoji: '🤝', text: 'שיחת משוב (פגישה שנקבעה והתקיימה)', points: 5 },
];

export default function PointsBadge({ userId }) {
  const [points, setPoints] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [diff, setDiff] = useState(0);
  const lastPointsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // טעינה ראשונית אחת בלבד
    base44.entities.UserPoints.filter({ user_id: userId }).then(res => {
      const newPoints = res.length > 0 ? (res[0].total_points || 0) : 0;
      lastPointsRef.current = newPoints;
      setPoints(newPoints);
    });

    // עדכונים בזמן אמת דרך subscribe בלבד
    const unsubscribe = base44.entities.UserPoints.subscribe((event) => {
      if (event.data?.user_id === userId) {
        const newPoints = event.data.total_points || 0;
        const prev = lastPointsRef.current ?? 0;
        if (newPoints > prev) {
          setDiff(newPoints - prev);
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 2500);
        }
        lastPointsRef.current = newPoints;
        setPoints(newPoints);
      }
    });

    return unsubscribe;
  }, [userId]);

  if (points === null) return null;

  return (
    <div className="relative" dir="rtl">
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => setShowInfo(v => !v)}
        className="flex items-center gap-1.5 bg-gradient-to-l from-amber-500 to-yellow-400 text-white px-3 py-1.5 rounded-full shadow-md cursor-pointer select-none"
      >
        <Star className="w-4 h-4 fill-white" />
        <span className="font-bold text-sm">{points}</span>
        <span className="text-xs opacity-80">נקודות</span>
      </motion.div>

      <AnimatePresence>
        {showAnimation && diff > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1.2 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="absolute -top-2 right-0 text-amber-500 font-bold text-lg pointer-events-none z-50"
          >
            +{diff} ⭐
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute top-10 left-0 z-50 bg-white border border-amber-200 rounded-2xl shadow-xl p-4 w-64 text-right"
            >
              <p className="font-bold text-slate-800 mb-3 text-sm">איך מרוויחים נקודות?</p>
              <div className="space-y-2">
                {POINTS_INFO.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-base">{item.emoji}</span>
                    <div className="flex-1">
                      <span className="text-xs text-slate-700">{item.text}</span>
                    </div>
                    <span className="text-amber-600 font-bold text-sm flex-shrink-0">+{item.points}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}