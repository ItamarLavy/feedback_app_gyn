import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePullToRefresh(queryKey) {
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentYRef = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // רק כשהעמוד בראש הגלילה
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = true;
        currentYRef.current = 0;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return;

      // אם גללנו למטה – בטל
      if (window.scrollY > 0) {
        isDraggingRef.current = false;
        return;
      }

      const deltaY = e.touches[0].clientY - startYRef.current;

      // אם הצבע זז למעלה – בטל
      if (deltaY <= 0) {
        isDraggingRef.current = false;
        return;
      }

      currentYRef.current = deltaY;

      // הצג אינדיקטור pull-to-refresh
      const container = containerRef.current;
      if (!container) return;

      let indicator = document.getElementById('ptr-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ptr-indicator';
        indicator.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;transition:opacity 0.2s';
        document.body.appendChild(indicator);
      }
      const opacity = Math.min(deltaY / 80, 1);
      indicator.style.opacity = opacity;
      indicator.innerHTML = `<div style="background:#0d9488;color:white;padding:6px 16px;border-radius:999px;font-size:13px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${deltaY > 80 ? '↑ שחרר לרענון' : '↓ משוך לרענון'}</div>`;
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const indicator = document.getElementById('ptr-indicator');
      if (indicator) indicator.remove();

      if (currentYRef.current > 80) {
        await queryClient.invalidateQueries({ queryKey });
      }
      currentYRef.current = 0;
    };

    // מאזינים על window, לא על container – כדי לא להפריע לגלילה של תריסים/טבלאות
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      const indicator = document.getElementById('ptr-indicator');
      if (indicator) indicator.remove();
    };
  }, [queryClient, JSON.stringify(queryKey)]);

  return containerRef;
}