/**
 * Bulk Actions Hook
 * Manages multi-select and batch operations for tasks
 */

import { useState, useCallback } from "react";
import { useUpdate, useDelete } from "@refinedev/core";
import { message } from "antd";

export interface BulkActionOptions {
  resource: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useBulkActions = (options: BulkActionOptions) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate: updateTask } = useUpdate();
  const { mutate: deleteTask } = useDelete();

  // Select/deselect individual item
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Select all items
  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(ids);
  }, []);

  // Deselect all items
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Check if item is selected
  const isSelected = useCallback(
    (id: number) => selectedIds.includes(id),
    [selectedIds]
  );

  // Bulk update status
  const bulkUpdateStatus = useCallback(
    async (status: string) => {
      if (selectedIds.length === 0) {
        message.open({
          type: "warning",
          content: "No tasks selected",
        });
        return;
      }

      setIsProcessing(true);
      const hideLoading = message.loading(
        `Updating ${selectedIds.length} task(s)...`,
        0
      );

      try {
        const promises = selectedIds.map(
          (id) =>
            new Promise((resolve, reject) => {
              updateTask(
                {
                  resource: options.resource,
                  id,
                  values: { status },
                },
                {
                  onSuccess: resolve,
                  onError: reject,
                }
              );
            })
        );

        await Promise.all(promises);
        hideLoading();
        message.open({
          type: "success",
          content: `Successfully updated ${selectedIds.length} task(s)`,
        });
        clearSelection();
        options.onSuccess?.();
      } catch (error: any) {
        hideLoading();
        message.open({
          type: "error",
          content: error?.message || "Failed to update tasks",
        });
        options.onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, updateTask, options, clearSelection]
  );

  // Bulk update priority
  const bulkUpdatePriority = useCallback(
    async (priority: string) => {
      if (selectedIds.length === 0) {
        message.open({
          type: "warning",
          content: "No tasks selected",
        });
        return;
      }

      setIsProcessing(true);
      const hideLoading = message.loading(
        `Updating ${selectedIds.length} task(s)...`,
        0
      );

      try {
        const promises = selectedIds.map(
          (id) =>
            new Promise((resolve, reject) => {
              updateTask(
                {
                  resource: options.resource,
                  id,
                  values: { priority },
                },
                {
                  onSuccess: resolve,
                  onError: reject,
                }
              );
            })
        );

        await Promise.all(promises);
        hideLoading();
        message.open({
          type: "success",
          content: `Successfully updated ${selectedIds.length} task(s)`,
        });
        clearSelection();
        options.onSuccess?.();
      } catch (error: any) {
        hideLoading();
        message.open({
          type: "error",
          content: error?.message || "Failed to update tasks",
        });
        options.onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, updateTask, options, clearSelection]
  );

  // Bulk assign to user
  const bulkAssign = useCallback(
    async (assigneeId: number) => {
      if (selectedIds.length === 0) {
        message.open({
          type: "warning",
          content: "No tasks selected",
        });
        return;
      }

      setIsProcessing(true);
      const hideLoading = message.loading(
        `Assigning ${selectedIds.length} task(s)...`,
        0
      );

      try {
        const promises = selectedIds.map(
          (id) =>
            new Promise((resolve, reject) => {
              updateTask(
                {
                  resource: options.resource,
                  id,
                  values: { assignee_id: assigneeId },
                },
                {
                  onSuccess: resolve,
                  onError: reject,
                }
              );
            })
        );

        await Promise.all(promises);
        hideLoading();
        message.open({
          type: "success",
          content: `Successfully assigned ${selectedIds.length} task(s)`,
        });
        clearSelection();
        options.onSuccess?.();
      } catch (error: any) {
        hideLoading();
        message.open({
          type: "error",
          content: error?.message || "Failed to assign tasks",
        });
        options.onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, updateTask, options, clearSelection]
  );

  // Bulk delete
  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.open({
        type: "warning",
        content: "No tasks selected",
      });
      return;
    }

    setIsProcessing(true);
    const hideLoading = message.loading(
      `Deleting ${selectedIds.length} task(s)...`,
      0
    );

    try {
      const promises = selectedIds.map(
        (id) =>
          new Promise((resolve, reject) => {
            deleteTask(
              {
                resource: options.resource,
                id,
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
      );

      await Promise.all(promises);
      hideLoading();
      message.open({
        type: "success",
        content: `Successfully deleted ${selectedIds.length} task(s)`,
      });
      clearSelection();
      options.onSuccess?.();
    } catch (error: any) {
      hideLoading();
      message.open({
        type: "error",
        content: error?.message || "Failed to delete tasks",
      });
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, deleteTask, options, clearSelection]);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    isProcessing,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkAssign,
    bulkDelete,
  };
};

export default useBulkActions;
