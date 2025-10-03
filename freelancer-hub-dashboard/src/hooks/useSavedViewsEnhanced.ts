/**
 * Saved Views Hook (Zustand Wrapper)
 * Maintains backward compatibility while using Zustand store
 */

import { useViewStore } from '../stores/viewStore';

// Re-export types for backward compatibility
export type { ViewConfiguration } from '../stores/viewStore';

export const useSavedViewsEnhanced = (projectId?: string) => {
  // Get the project-specific store
  const store = useViewStore(projectId);

  // Get state and actions from Zustand store using selectors
  const views = store((state) => state.views);
  const currentViewId = store((state) => state.currentViewId);
  const createView = store((state) => state.createView);
  const updateView = store((state) => state.updateView);
  const deleteView = store((state) => state.deleteView);
  const loadView = store((state) => state.loadView);
  const toggleFavorite = store((state) => state.toggleFavorite);
  const setDefaultView = store((state) => state.setDefaultView);
  const duplicateView = store((state) => state.duplicateView);
  const getDefaultView = store((state) => state.getDefaultView);
  const getFavoriteViews = store((state) => state.getFavoriteViews);
  const getCurrentView = store((state) => state.getCurrentView);

  return {
    views,
    currentViewId,
    createView,
    updateView,
    deleteView,
    loadView,
    toggleFavorite,
    setDefaultView,
    getDefaultView,
    getFavoriteViews,
    getCurrentView,
    duplicateView,
  };
};

export default useSavedViewsEnhanced;
