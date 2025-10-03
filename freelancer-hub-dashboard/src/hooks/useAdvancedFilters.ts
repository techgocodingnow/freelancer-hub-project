/**
 * Advanced Filters Hook (Zustand Wrapper)
 * Maintains backward compatibility while using Zustand store
 */

import { useMemo } from "react";
import { useFilterStore } from "../stores/filterStore";

// Re-export types for backward compatibility
export type { FilterCriteria, SavedFilter } from "../stores/filterStore";

export const useAdvancedFilters = () => {
  // Get state and actions from Zustand store using selectors
  const criteria = useFilterStore((state) => state.criteria);
  const savedFilters = useFilterStore((state) => state.savedFilters);
  const updateCriteria = useFilterStore((state) => state.updateCriteria);
  const clearCriteria = useFilterStore((state) => state.clearCriteria);
  const saveFilter = useFilterStore((state) => state.saveFilter);
  const loadFilter = useFilterStore((state) => state.loadFilter);
  const deleteFilter = useFilterStore((state) => state.deleteFilter);
  const updateFilter = useFilterStore((state) => state.updateFilter);

  // Computed values using Zustand getters
  const activeFilterCount = useMemo(
    () => useFilterStore.getState().getActiveFilterCount(),
    []
  );

  const refineFilters = useMemo(
    () => useFilterStore.getState().getRefineFilters(),
    []
  );

  return {
    criteria,
    updateCriteria,
    clearCriteria,
    savedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    updateFilter,
    activeFilterCount,
    refineFilters,
  };
};

export default useAdvancedFilters;
