import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook for managing tab navigation state
 * Allows resetting to root when tapping active tab, and preserves navigation state per tab
 */
export function useTabNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const stackRef = useRef({});
  const lastTabRef = useRef(null);

  const handleTabPress = (tabPath, rootPath) => {
    const currentPath = location.pathname;

    // If clicking the active tab (same root), reset to root
    if (currentPath.startsWith(rootPath) && lastTabRef.current === rootPath) {
      navigate(rootPath);
      stackRef.current[rootPath] = [rootPath];
      return;
    }

    // If switching to a different tab, navigate to its last visited path or root
    if (lastTabRef.current !== rootPath) {
      const savedPath = stackRef.current[rootPath]?.at(-1) || rootPath;
      navigate(savedPath);
      if (!stackRef.current[rootPath]) {
        stackRef.current[rootPath] = [rootPath];
      }
      lastTabRef.current = rootPath;
      return;
    }

    // Otherwise navigate normally
    navigate(tabPath);
    stackRef.current[rootPath] = [
      ...(stackRef.current[rootPath] || [rootPath]),
      tabPath,
    ];
  };

  const isTabActive = (rootPath) => {
    return location.pathname.startsWith(rootPath);
  };

  return { handleTabPress, isTabActive, stackRef };
}