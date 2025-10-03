/**
 * Saved Views Hook
 * Manages saved filter views with localStorage persistence
 */

import { useState, useEffect } from 'react';
import type { TaskFilter, SavedView } from '../components/tasks/TaskFilters';

const STORAGE_KEY = 'task_saved_views';

export const useSavedViews = () => {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // Load saved views from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedViews(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse saved views:', error);
      }
    }
  }, []);

  // Save to localStorage whenever views change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  const saveView = (name: string, filters: TaskFilter) => {
    const newView: SavedView = {
      id: Date.now().toString(),
      name,
      filters,
      isFavorite: false,
    };
    setSavedViews((prev) => [...prev, newView]);
  };

  const deleteView = (id: string) => {
    setSavedViews((prev) => prev.filter((view) => view.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setSavedViews((prev) =>
      prev.map((view) =>
        view.id === id ? { ...view, isFavorite: !view.isFavorite } : view
      )
    );
  };

  const updateView = (id: string, updates: Partial<SavedView>) => {
    setSavedViews((prev) =>
      prev.map((view) => (view.id === id ? { ...view, ...updates } : view))
    );
  };

  return {
    savedViews,
    saveView,
    deleteView,
    toggleFavorite,
    updateView,
  };
};

export default useSavedViews;

