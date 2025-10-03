/**
 * Filter Store (Zustand)
 * Manages advanced filtering state with persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CrudFilters } from "@refinedev/core";

export interface FilterCriteria {
  status?: string[];
  priority?: string[];
  assigneeId?: number[];
  dueDateFrom?: string;
  dueDateTo?: string;
  estimatedHoursMin?: number;
  estimatedHoursMax?: number;
  searchText?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  isDefault?: boolean;
  createdAt: string;
}

interface FilterState {
  // State
  criteria: FilterCriteria;
  savedFilters: SavedFilter[];

  // Actions
  updateCriteria: (newCriteria: Partial<FilterCriteria>) => void;
  clearCriteria: () => void;
  saveFilter: (name: string, isDefault?: boolean) => void;
  loadFilter: (filterId: string) => void;
  deleteFilter: (filterId: string) => void;
  updateFilter: (filterId: string, updates: Partial<SavedFilter>) => void;

  // Computed (getters)
  getActiveFilterCount: () => number;
  getRefineFilters: () => CrudFilters;
}

// Helper function to convert criteria to Refine filters
const toRefineFilters = (filterCriteria: FilterCriteria): CrudFilters => {
  const filters: CrudFilters = [];

  if (filterCriteria.status && filterCriteria.status.length > 0) {
    filters.push({
      field: "status",
      operator: "in" as const,
      value: filterCriteria.status,
    });
  }

  if (filterCriteria.priority && filterCriteria.priority.length > 0) {
    filters.push({
      field: "priority",
      operator: "in" as const,
      value: filterCriteria.priority,
    });
  }

  if (filterCriteria.assigneeId && filterCriteria.assigneeId.length > 0) {
    filters.push({
      field: "assignee_id",
      operator: "in" as const,
      value: filterCriteria.assigneeId,
    });
  }

  if (filterCriteria.dueDateFrom) {
    filters.push({
      field: "dueDate",
      operator: "gte" as const,
      value: filterCriteria.dueDateFrom,
    });
  }

  if (filterCriteria.dueDateTo) {
    filters.push({
      field: "dueDate",
      operator: "lte" as const,
      value: filterCriteria.dueDateTo,
    });
  }

  if (filterCriteria.estimatedHoursMin !== undefined) {
    filters.push({
      field: "estimatedHours",
      operator: "gte" as const,
      value: filterCriteria.estimatedHoursMin,
    });
  }

  if (filterCriteria.estimatedHoursMax !== undefined) {
    filters.push({
      field: "estimatedHours",
      operator: "lte" as const,
      value: filterCriteria.estimatedHoursMax,
    });
  }

  if (filterCriteria.searchText) {
    filters.push({
      field: "q",
      operator: "contains" as const,
      value: filterCriteria.searchText,
    });
  }

  if (filterCriteria.isFavorite) {
    filters.push({
      field: "isFavorite",
      operator: "eq" as const,
      value: true,
    });
  }

  return filters;
};

// Helper function to normalize array values
const normalizeArrayValue = <T>(value: T | T[] | undefined | null): T[] => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

// Helper function to normalize criteria to ensure array fields are arrays
const normalizeCriteria = (criteria: FilterCriteria): FilterCriteria => {
  return {
    ...criteria,
    status: criteria.status ? normalizeArrayValue(criteria.status) : undefined,
    priority: criteria.priority
      ? normalizeArrayValue(criteria.priority)
      : undefined,
    assigneeId: criteria.assigneeId
      ? normalizeArrayValue(criteria.assigneeId)
      : undefined,
    tags: criteria.tags ? normalizeArrayValue(criteria.tags) : undefined,
  };
};

// Helper function to count active filters
const countActiveFilters = (criteria: FilterCriteria): number => {
  let count = 0;
  if (
    criteria.status &&
    Array.isArray(criteria.status) &&
    criteria.status.length > 0
  )
    count++;
  if (
    criteria.priority &&
    Array.isArray(criteria.priority) &&
    criteria.priority.length > 0
  )
    count++;
  if (
    criteria.assigneeId &&
    Array.isArray(criteria.assigneeId) &&
    criteria.assigneeId.length > 0
  )
    count++;
  if (criteria.dueDateFrom || criteria.dueDateTo) count++;
  if (
    criteria.estimatedHoursMin !== undefined ||
    criteria.estimatedHoursMax !== undefined
  )
    count++;
  if (criteria.searchText) count++;
  if (criteria.isFavorite) count++;
  return count;
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      criteria: {},
      savedFilters: [],

      // Actions
      updateCriteria: (newCriteria) =>
        set((state) => ({
          criteria: normalizeCriteria({ ...state.criteria, ...newCriteria }),
        })),

      clearCriteria: () => set({ criteria: {} }),

      saveFilter: (name, isDefault = false) =>
        set((state) => {
          const newFilter: SavedFilter = {
            id: Date.now().toString(),
            name,
            criteria: normalizeCriteria(state.criteria),
            isDefault,
            createdAt: new Date().toISOString(),
          };
          return {
            savedFilters: [...state.savedFilters, newFilter],
          };
        }),

      loadFilter: (filterId) => {
        const filter = get().savedFilters.find((f) => f.id === filterId);
        if (filter) {
          set({ criteria: normalizeCriteria(filter.criteria) });
        }
      },

      deleteFilter: (filterId) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== filterId),
        })),

      updateFilter: (filterId, updates) =>
        set((state) => ({
          savedFilters: state.savedFilters.map((f) =>
            f.id === filterId ? { ...f, ...updates } : f
          ),
        })),

      // Computed getters
      getActiveFilterCount: () => countActiveFilters(get().criteria),

      getRefineFilters: () => toRefineFilters(get().criteria),
    }),
    {
      name: "advanced_filters", // localStorage key (backward compatible)
      partialize: (state) => ({
        criteria: state.criteria,
        savedFilters: state.savedFilters,
      }),
      // Migrate/normalize data when loading from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Normalize criteria on load
          state.criteria = normalizeCriteria(state.criteria);
          // Normalize all saved filters
          state.savedFilters = state.savedFilters.map((filter) => ({
            ...filter,
            criteria: normalizeCriteria(filter.criteria),
          }));
        }
      },
    }
  )
);

export default useFilterStore;
