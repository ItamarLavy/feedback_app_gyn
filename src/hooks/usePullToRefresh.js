import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePullToRefresh(queryKey) {
  const queryClient = useQueryClient();
  const startYRef = useRef(0);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentY = 0;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || container.scrollTop > 0) {
        isDraggingRef.current = false;
        return;
      }

      currentY = e.touches[0].clientY - startYRef.current;
      if (currentY > 0) {
        e.preventDefault();
        const opacity = Math.min(currentY / 100, 1);
        
        // Create or update pull indicator
        let indicator = container.querySelector('[data-pull-indicator]');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.setAttribute('data-pull-indicator', 'true');
          indicator.className = 'fixed top-0 left-1/2 -translate-x-1/2 z-50 transition-all';
          container.insertBefore(indicator, container.firstChild);
        }
        
        indicator.style.opacity = opacity;
        indicator.innerHTML = `
          <div class="bg-teal-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
            ${currentY > 80 ? '↑ Release to refresh' : '↓ Pull to refresh'}
          </div>
        `;
        
        container.style.transform = `translateY(${Math.min(currentY, 80)}px)`;
      }
    };

    const handleTouchEnd = async () => {
      isDraggingRef.current = false;
      if (currentY > 80) {
        container.style.transform = 'translateY(0)';
        await queryClient.invalidateQueries({ queryKey });
        currentY = 0;
      } else {
        container.style.transform = 'translateY(0)';
        currentY = 0;
      }
      const indicator = container.querySelector('[data-pull-indicator]');
      if (indicator) indicator.remove();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [queryClient, queryKey]);

  return containerRef;
}