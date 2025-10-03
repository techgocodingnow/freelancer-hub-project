/**
 * View Store (Zustand)
 * Manages saved view configurations with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterCriteria } from './filterStore';

export interface ViewConfiguration {
  id: string;
  name: string;
  viewType: 'list' | 'kanban' | 'calendar' | 'timeline';
  filters: FilterCriteria;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  displaySettings?: {
    visibleColumns?: string[];
    columnOrder?: string[];
    kanbanCollapsed?: string[];
  };
  isDefault?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewState {
  // State
  views: ViewConfiguration[];
  currentViewId: string | null;

  // Actions
  createView: (config: Omit<ViewConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateView: (viewId: string, updates: Partial<ViewConfiguration>) => void;
  deleteView: (viewId: string) => void;
  loadView: (viewId: string) => ViewConfiguration | null;
  toggleFavorite: (viewId: string) => void;
  setDefaultView: (viewId: string) => void;
  duplicateView: (viewId: string, newName?: string) => string | null;

  // Computed getters
  getDefaultView: () => ViewConfiguration | null;
  getFavoriteViews: () => ViewConfiguration[];
  getCurrentView: () => ViewConfiguration | null;
}

// Factory function to create project-specific store
export const createViewStore = (projectId?: string) => {
  const storageKey = projectId ? `saved_views_enhanced_${projectId}` : 'saved_views_enhanced';

  return create<ViewState>()(
    persist(
      (set, get) => ({
        // Initial state
        views: [],
        currentViewId: null,

        // Actions
        createView: (config) => {
          const newView: ViewConfiguration = {
            ...config,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            views: [...state.views, newView],
          }));

          return newView.id;
        },

        updateView: (viewId, updates) =>
          set((state) => ({
            views: state.views.map((view) =>
              view.id === viewId
                ? { ...view, ...updates, updatedAt: new Date().toISOString() }
                : view
            ),
          })),

        deleteView: (viewId) =>
          set((state) => ({
            views: state.views.filter((view) => view.id !== viewId),
            currentViewId: state.currentViewId === viewId ? null : state.currentViewId,
          })),

        loadView: (viewId) => {
          const view = get().views.find((v) => v.id === viewId);
          if (view) {
            set({ currentViewId: viewId });
            return view;
          }
          return null;
        },

        toggleFavorite: (viewId) =>
          set((state) => ({
            views: state.views.map((view) =>
              view.id === viewId
                ? { ...view, isFavorite: !view.isFavorite, updatedAt: new Date().toISOString() }
                : view
            ),
          })),

        setDefaultView: (viewId) =>
          set((state) => ({
            views: state.views.map((view) => ({
              ...view,
              isDefault: view.id === viewId,
              updatedAt: new Date().toISOString(),
            })),
          })),

        duplicateView: (viewId, newName) => {
          const view = get().views.find((v) => v.id === viewId);
          if (!view) return null;

          const duplicated: ViewConfiguration = {
            ...view,
            id: Date.now().toString(),
            name: newName || `${view.name} (Copy)`,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            views: [...state.views, duplicated],
          }));

          return duplicated.id;
        },

        // Computed getters
        getDefaultView: () => {
          return get().views.find((view) => view.isDefault) || null;
        },

        getFavoriteViews: () => {
          return get().views.filter((view) => view.isFavorite);
        },

        getCurrentView: () => {
          const { views, currentViewId } = get();
          if (!currentViewId) return null;
          return views.find((view) => view.id === currentViewId) || null;
        },
      }),
      {
        name: storageKey, // Project-specific localStorage key
        partialize: (state) => ({
          views: state.views,
          currentViewId: state.currentViewId,
        }),
      }
    )
  );
};

// Store registry to manage multiple project stores
const viewStoreRegistry = new Map<string, ReturnType<typeof createViewStore>>();

export const useViewStore = (projectId?: string) => {
  const key = projectId || 'default';
  
  if (!viewStoreRegistry.has(key)) {
    viewStoreRegistry.set(key, createViewStore(projectId));
  }
  
  return viewStoreRegistry.get(key)!;
};

export default useViewStore;

