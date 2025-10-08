import React, { useState } from "react";
import { useList, useDelete, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Table,
  Tag,
  Space,
  Button,
  message,
  Modal,
  Typography,
  Select,
  Badge,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useBulkActions } from "../../hooks/useBulkActions";
import { BulkActionsToolbar } from "../../components/tasks/BulkActionsToolbar";
import { useAdvancedFilters } from "../../hooks/useAdvancedFilters";
import { AdvancedFilterPanel } from "../../components/filters/AdvancedFilterPanel";
import { FilterChips } from "../../components/filters/FilterChips";
import { useSavedViewsEnhanced } from "../../hooks/useSavedViewsEnhanced";
import { SavedViewsPanel } from "../../components/views/SavedViewsPanel";
import { useFavorites } from "../../hooks/useFavorites";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { useUIStore } from "../../stores/uiStore";
import { ResponsiveContainer } from "../../components/responsive";

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assignee?: {
    id: number;
    fullName: string;
  };
  estimatedHours?: number;
  actualHours: number;
}

export const TaskList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: deleteTask } = useDelete();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Advanced filtering
  const advancedFilters = useAdvancedFilters();

  // Saved views
  const savedViews = useSavedViewsEnhanced(projectId);

  // Favorites
  const favorites = useFavorites(projectId);

  // UI state from Zustand store
  const filterPanelOpen = useUIStore((state) => state.filterPanelOpen);
  const setFilterPanelOpen = useUIStore((state) => state.setFilterPanelOpen);
  const viewsPanelOpen = useUIStore((state) => state.viewsPanelOpen);
  const setViewsPanelOpen = useUIStore((state) => state.setViewsPanelOpen);

  const {
    result: data,
    query: { isLoading, refetch },
  } = useList<Task>({
    resource: `projects/${projectId}/tasks`,
    pagination: {
      pageSize: 50,
    },
    filters: advancedFilters.refineFilters,
  });

  // Bulk actions
  const bulkActions = useBulkActions({
    resource: `projects/${projectId}/tasks`,
    onSuccess: refetch,
  });

  const handleDelete = (id: number) => {
    confirm({
      title: "Are you sure you want to delete this task?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        deleteTask(
          {
            resource: `projects/${projectId}/tasks`,
            id,
          },
          {
            onSuccess: () => {
              message.open({
                type: "success",
                content: "Task deleted successfully",
              });
              refetch();
            },
            onError: (error: any) => {
              message.open({
                type: "error",
                content: error?.message || "Failed to delete task",
              });
            },
          }
        );
      },
    });
  };

  const columns = [
    {
      title: "",
      key: "favorite",
      width: "50px",
      render: (_: any, record: Task) => (
        <Button
          type="text"
          size="small"
          icon={
            favorites.isFavorite(record.id) ? (
              <StarFilled style={{ color: "#faad14" }} />
            ) : (
              <StarOutlined />
            )
          }
          onClick={(e) => {
            e.stopPropagation();
            favorites.toggleFavorite(record.id);
          }}
          aria-label={
            favorites.isFavorite(record.id)
              ? "Remove from favorites"
              : "Add to favorites"
          }
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "25%",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "12%",
      render: (status: string) => {
        const colors: Record<string, string> = {
          todo: "default",
          in_progress: "blue",
          review: "orange",
          done: "green",
        };
        return (
          <Tag color={colors[status]}>
            {status.replace("_", " ").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "10%",
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: "default",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Assignee",
      dataIndex: ["assignee", "fullName"],
      key: "assignee",
      width: "15%",
      render: (name: string) =>
        name || <Text type="secondary">Unassigned</Text>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: "12%",
      render: (date: string) => {
        if (!date) return "-";
        const dueDate = new Date(date);
        const isOverdue = dueDate < new Date();
        return (
          <Text type={isOverdue ? "danger" : undefined}>
            {dueDate.toLocaleDateString()}
          </Text>
        );
      },
    },
    {
      title: "Hours",
      key: "hours",
      width: "10%",
      render: (_: any, record: Task) => (
        <Text>
          {record.actualHours || 0}
          {record.estimatedHours ? ` / ${record.estimatedHours}` : ""}h
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "16%",
      render: (_: any, record: Task) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/${record.id}/edit`,
                type: "push",
              })
            }
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: isMobile ? "16px" : "24px",
          gap: isMobile ? "12px" : "0",
        }}
      >
        <Title level={isMobile ? 3 : 2}>Tasks</Title>
        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
          <Badge count={advancedFilters.activeFilterCount} offset={[-5, 5]}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterPanelOpen(true)}
              block={isMobile}
            >
              {isMobile ? "Filters" : "Filters"}
            </Button>
          </Badge>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setViewsPanelOpen(true)}
            block={isMobile}
          >
            {isMobile ? "Views" : "Views"}
          </Button>
          {!isMobile && (
            <>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/kanban`,
                    type: "push",
                  })
                }
              >
                Kanban
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/calendar`,
                    type: "push",
                  })
                }
              >
                Calendar
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/timeline`,
                    type: "push",
                  })
                }
              >
                Timeline
              </Button>
            </>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/create`,
                type: "push",
              })
            }
            block={isMobile}
          >
            {isMobile ? "New" : "New Task"}
          </Button>
        </Space>
      </div>

      {/* Filter Chips */}
      <FilterChips
        criteria={advancedFilters.criteria}
        onRemove={(key) => advancedFilters.updateCriteria({ [key]: undefined })}
        onClearAll={advancedFilters.clearCriteria}
      />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkActions.selectedCount}
        isProcessing={bulkActions.isProcessing}
        onClearSelection={bulkActions.clearSelection}
        onUpdateStatus={bulkActions.bulkUpdateStatus}
        onUpdatePriority={bulkActions.bulkUpdatePriority}
        onAssign={bulkActions.bulkAssign}
        onDelete={bulkActions.bulkDelete}
      />

      <Table
        dataSource={(data?.data as any) || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: isMobile ? 1000 : undefined }}
        rowSelection={{
          selectedRowKeys: bulkActions.selectedIds,
          onChange: (selectedRowKeys) => {
            bulkActions.selectAll(selectedRowKeys as number[]);
          },
          onSelect: (record) => {
            bulkActions.toggleSelection(record.id);
          },
        }}
        pagination={{
          pageSize: 20,
          simple: isMobile,
          showSizeChanger: !isMobile,
          showTotal: (total) => `Total ${total} tasks`,
        }}
      />

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        criteria={advancedFilters.criteria}
        onCriteriaChange={advancedFilters.updateCriteria}
        onClear={advancedFilters.clearCriteria}
        savedFilters={advancedFilters.savedFilters}
        onSaveFilter={advancedFilters.saveFilter}
        onLoadFilter={advancedFilters.loadFilter}
        onDeleteFilter={advancedFilters.deleteFilter}
      />

      {/* Saved Views Panel */}
      <SavedViewsPanel
        open={viewsPanelOpen}
        onClose={() => setViewsPanelOpen(false)}
        views={savedViews.views}
        currentViewId={savedViews.currentViewId}
        onLoadView={(viewId) => {
          const view = savedViews.loadView(viewId);
          if (view) {
            advancedFilters.updateCriteria(view.filters);
          }
        }}
        onDeleteView={savedViews.deleteView}
        onToggleFavorite={savedViews.toggleFavorite}
        onSetDefault={savedViews.setDefaultView}
        onDuplicate={savedViews.duplicateView}
      />
    </ResponsiveContainer>
  );
};
