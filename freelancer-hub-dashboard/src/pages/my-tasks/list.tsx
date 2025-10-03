import React, { useState } from "react";
import { useList, useDelete, useGo } from "@refinedev/core";
import {
  Table,
  Tag,
  Space,
  Button,
  message,
  Modal,
  Typography,
  Badge,
  Card,
  Statistic,
  Row,
  Col,
  Segmented,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useAdvancedFilters } from "../../hooks/useAdvancedFilters";
import { AdvancedFilterPanel } from "../../components/filters/AdvancedFilterPanel";
import { useUIStore } from "../../stores/uiStore";

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
  project?: {
    id: number;
    name: string;
  };
  estimatedHours?: number;
  actualHours: number;
  completedAt?: string;
}

const statusColors = {
  todo: "default",
  in_progress: "processing",
  review: "warning",
  done: "success",
} as const;

const priorityColors = {
  low: "default",
  medium: "blue",
  high: "orange",
  urgent: "red",
} as const;

export const MyTasksList: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: deleteTask } = useDelete();
  const isMobile = useIsMobile();

  const [viewFilter, setViewFilter] = useState<"today_overdue" | "assigned">(
    "today_overdue"
  );

  // Advanced filtering
  const advancedFilters = useAdvancedFilters();

  // UI state from Zustand store
  const filterPanelOpen = useUIStore((state) => state.filterPanelOpen);
  const setFilterPanelOpen = useUIStore((state) => state.setFilterPanelOpen);

  const {
    result,
    query: { isLoading, refetch },
  } = useList<Task>({
    resource: "my-tasks",
    pagination: {
      pageSize: 50,
    },
    filters: [
      {
        field: "filter",
        operator: "eq",
        value: viewFilter,
      },
      ...advancedFilters.refineFilters,
    ],
  });

  const tasks = result?.data || [];
  const meta = result?.meta;

  const handleDelete = (id: number) => {
    confirm({
      title: "Are you sure you want to delete this task?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No, cancel",
      onOk() {
        // Find the task to get its project ID
        const task = tasks.find((t) => t.id === id);
        if (!task?.project?.id) {
          message.error("Cannot delete task: project information missing");
          return;
        }

        deleteTask(
          {
            resource: `projects/${task.project.id}/tasks`,
            id,
          },
          {
            onSuccess: () => {
              message.success("Task deleted successfully");
              refetch();
            },
            onError: () => {
              message.error("Failed to delete task");
            },
          }
        );
      },
    });
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Task) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.project && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.project.name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Task["status"]) => (
        <Tag color={statusColors[status]}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: Task["priority"]) => (
        <Tag color={priorityColors[priority]} icon={<FlagOutlined />}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => {
        if (!date) return <Text type="secondary">No due date</Text>;
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === new Date().toDateString();

        return (
          <Text type={isOverdue ? "danger" : isToday ? "warning" : undefined}>
            {dueDate.toLocaleDateString()}
          </Text>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Task) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/projects/${record.project?.id}/tasks/${record.id}/edit`,
                type: "push",
              })
            }
          >
            {!isMobile && "View"}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/projects/${record.project?.id}/tasks/${record.id}/edit`,
                type: "push",
              })
            }
          >
            {!isMobile && "Edit"}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            {!isMobile && "Delete"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      {/* Statistics Cards */}
      {meta && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Today"
                value={meta.todayCount || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Overdue"
                value={meta.overdueCount || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="Total"
                value={meta.total || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: 24,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "16px" : "0",
        }}
      >
        <Title level={isMobile ? 3 : 2}>My Tasks</Title>
        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
          <Segmented
            options={[
              {
                label: "Today & Overdue",
                value: "today_overdue",
                icon: <ClockCircleOutlined />,
              },
              {
                label: "Assigned to Me",
                value: "assigned",
                icon: <CheckCircleOutlined />,
              },
            ]}
            value={viewFilter}
            onChange={(value) =>
              setViewFilter(value as "today_overdue" | "assigned")
            }
            block={isMobile}
          />
          <Badge count={advancedFilters.activeFilterCount} offset={[-5, 5]}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterPanelOpen(true)}
              block={isMobile}
            >
              {isMobile ? "Filters" : "Filters"}
            </Button>
          </Badge>
          {!isMobile && (
            <>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/my-tasks/kanban`,
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
                    to: `/tenants/${tenantSlug}/my-tasks/calendar`,
                    type: "push",
                  })
                }
              >
                Calendar
              </Button>
            </>
          )}
        </Space>
      </div>

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

      {/* Tasks Table */}
      <Table
        dataSource={tasks ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: meta?.total,
          pageSize: 50,
          showSizeChanger: false,
        }}
        scroll={{ x: isMobile ? 800 : undefined }}
      />
    </div>
  );
};
