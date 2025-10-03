/**
 * Favorite Store (Zustand)
 * Manages favorite tasks with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteState {
  // State (stored as array for JSON serialization)
  favoriteIds: number[];

  // Actions
  toggleFavorite: (taskId: number) => void;
  addFavorite: (taskId: number) => void;
  removeFavorite: (taskId: number) => void;
  clearFavorites: () => void;

  // Computed getters
  isFavorite: (taskId: number) => boolean;
  getFavoriteIds: () => number[];
  getFavoriteCount: () => number;
}

// Factory function to create project-specific store
export const createFavoriteStore = (projectId?: string) => {
  const storageKey = projectId ? `favorite_tasks_${projectId}` : 'favorite_tasks';

  return create<FavoriteState>()(
    persist(
      (set, get) => ({
        // Initial state
        favoriteIds: [],

        // Actions
        toggleFavorite: (taskId) =>
          set((state) => {
            const exists = state.favoriteIds.includes(taskId);
            return {
              favoriteIds: exists
                ? state.favoriteIds.filter((id) => id !== taskId)
                : [...state.favoriteIds, taskId],
            };
          }),

        addFavorite: (taskId) =>
          set((state) => {
            if (state.favoriteIds.includes(taskId)) {
              return state; // Already exists, no change
            }
            return {
              favoriteIds: [...state.favoriteIds, taskId],
            };
          }),

        removeFavorite: (taskId) =>
          set((state) => ({
            favoriteIds: state.favoriteIds.filter((id) => id !== taskId),
          })),

        clearFavorites: () => set({ favoriteIds: [] }),

        // Computed getters
        isFavorite: (taskId) => {
          return get().favoriteIds.includes(taskId);
        },

        getFavoriteIds: () => {
          return get().favoriteIds;
        },

        getFavoriteCount: () => {
          return get().favoriteIds.length;
        },
      }),
      {
        name: storageKey, // Project-specific localStorage key
        partialize: (state) => ({
          favoriteIds: state.favoriteIds,
        }),
      }
    )
  );
};

// Store registry to manage multiple project stores
const favoriteStoreRegistry = new Map<string, ReturnType<typeof createFavoriteStore>>();

export const useFavoriteStore = (projectId?: string) => {
  const key = projectId || 'default';
  
  if (!favoriteStoreRegistry.has(key)) {
    favoriteStoreRegistry.set(key, createFavoriteStore(projectId));
  }
  
  return favoriteStoreRegistry.get(key)!;
};

export default useFavoriteStore;

