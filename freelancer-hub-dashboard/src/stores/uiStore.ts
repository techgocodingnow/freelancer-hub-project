/**
 * UI Store (Zustand)
 * Manages UI state (panels, modals, drawers)
 */

import { create } from 'zustand';

interface UIState {
  // Panel states
  filterPanelOpen: boolean;
  viewsPanelOpen: boolean;
  commandPaletteOpen: boolean;

  // Actions
  setFilterPanelOpen: (open: boolean) => void;
  setViewsPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleFilterPanel: () => void;
  toggleViewsPanel: () => void;
  toggleCommandPalette: () => void;
  closeAllPanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  filterPanelOpen: false,
  viewsPanelOpen: false,
  commandPaletteOpen: false,

  // Actions
  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
  setViewsPanelOpen: (open) => set({ viewsPanelOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  toggleFilterPanel: () => set((state) => ({ filterPanelOpen: !state.filterPanelOpen })),
  toggleViewsPanel: () => set((state) => ({ viewsPanelOpen: !state.viewsPanelOpen })),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  closeAllPanels: () =>
    set({
      filterPanelOpen: false,
      viewsPanelOpen: false,
      commandPaletteOpen: false,
    }),
}));

export default useUIStore;

