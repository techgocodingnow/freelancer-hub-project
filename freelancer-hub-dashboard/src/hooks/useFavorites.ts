/**
 * Favorites Hook (Zustand Wrapper)
 * Maintains backward compatibility while using Zustand store
 */

import { useFavoriteStore } from '../stores/favoriteStore';

export const useFavorites = (projectId?: string) => {
  // Get the project-specific store
  const store = useFavoriteStore(projectId);

  // Get state and actions from Zustand store using selectors
  const favoriteIds = store((state) => state.favoriteIds);
  const toggleFavorite = store((state) => state.toggleFavorite);
  const addFavorite = store((state) => state.addFavorite);
  const removeFavorite = store((state) => state.removeFavorite);
  const clearFavorites = store((state) => state.clearFavorites);
  const isFavorite = store((state) => state.isFavorite);
  const getFavoriteIds = store((state) => state.getFavoriteIds);
  const getFavoriteCount = store((state) => state.getFavoriteCount);

  // Convert array to Set for backward compatibility
  const favorites = new Set(favoriteIds);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoriteIds,
    favoriteCount: getFavoriteCount(),
  };
};

export default useFavorites;
