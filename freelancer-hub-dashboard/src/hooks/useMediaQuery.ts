/**
 * Media Query Hook
 * Detects screen size and provides responsive breakpoints
 */

import { useState, useEffect } from 'react';
import { tokens } from '../theme';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${tokens.breakpoints.md}px)`);
};

export const useIsTablet = (): boolean => {
  return useMediaQuery(
    `(min-width: ${tokens.breakpoints.md}px) and (max-width: ${tokens.breakpoints.lg}px)`
  );
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery(`(min-width: ${tokens.breakpoints.lg}px)`);
};

export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
};

export default useMediaQuery;

