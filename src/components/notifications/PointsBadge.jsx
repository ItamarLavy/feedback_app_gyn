import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PointsBadge({ userId }) {
  const [points, setPoints] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
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
        className="flex items-center gap-1.5 bg-gradient-to-l from-amber-500 to-yellow-400 text-white px-3 py-1.5 rounded-full shadow-md cursor-default select-none"
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
    </div>
  );
}