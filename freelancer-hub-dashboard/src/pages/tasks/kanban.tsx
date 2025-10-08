import React, { useState } from "react";
import { useList, useUpdate, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { Space, Typography, Button, Select, Spin, Empty, message } from "antd";
import {
  PlusOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTenantSlug } from "../../contexts/tenant";
import { TaskCard } from "../../components/tasks/TaskCard";
import { DroppableColumn } from "../../components/tasks/DroppableColumn";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { Title } = Typography;

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
    email: string;
  };
  estimatedHours?: number;
  actualHours: number;
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "#d9d9d9" },
  { id: "in_progress", title: "In Progress", color: "#1890ff" },
  { id: "review", title: "Review", color: "#faad14" },
  { id: "done", title: "Done", color: "#52c41a" },
];

export const TaskKanban: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: updateTask } = useUpdate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<number | undefined>();
  const [filterPriority, setFilterPriority] = useState<string | undefined>();

  const {
    result,
    query: { isLoading, refetch },
  } = useList<Task>({
    resource: `projects/${projectId}/tasks`,
    pagination: {
      pageSize: 100,
    },
    filters: [
      ...(filterAssignee
        ? [
            {
              field: "assignee_id",
              operator: "eq" as const,
              value: filterAssignee,
            },
          ]
        : []),
      ...(filterPriority
        ? [
            {
              field: "priority",
              operator: "eq" as const,
              value: filterPriority,
            },
          ]
        : []),
    ],
  });

  const tasks = result?.data || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as number;
    const newStatus = over.id as Task["status"];

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) {
      setActiveId(null);
      return;
    }

    updateTask(
      {
        resource: `projects/${projectId}/tasks`,
        id: taskId,
        values: {
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          message.open({
            type: "success",
            content: "Task status updated",
          });
          refetch();
        },
        onError: (error: any) => {
          message.open({
            type: "error",
            content: error?.message || "Failed to update task",
          });
        },
      }
    );

    setActiveId(null);
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  // Get unique assignees for filter
  const assignees = Array.from(
    new Map(
      tasks.filter((t) => t.assignee).map((t) => [t.assignee!.id, t.assignee!])
    ).values()
  );

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

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
        <Title level={isMobile ? 3 : 2}>Task Board</Title>
        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
          <Select
            placeholder="Filter by assignee"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setFilterAssignee}
          >
            {assignees.map((assignee) => (
              <Select.Option key={assignee.id} value={assignee.id}>
                {assignee.fullName}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by priority"
            style={{ width: isMobile ? "100%" : 150 }}
            allowClear
            onChange={setFilterPriority}
          >
            <Select.Option value="low">Low</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="urgent">Urgent</Select.Option>
          </Select>
          {!isMobile && (
            <>
              <Button
                icon={<UnorderedListOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${projectId}/tasks`,
                    type: "push",
                  })
                }
              >
                List
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

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: isMobile ? "flex" : "grid",
            flexDirection: isMobile ? "column" : undefined,
            gridTemplateColumns: isMobile
              ? undefined
              : isTablet
              ? "repeat(2, 1fr)"
              : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
            minHeight: "calc(100vh - 200px)",
            overflowX: isMobile ? "auto" : undefined,
          }}
        >
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id as Task["status"]);

            return (
              <DroppableColumn
                key={column.id}
                id={column.id}
                title={column.title}
                count={columnTasks.length}
                color={column.color}
              >
                <SortableContext
                  items={columnTasks
                    .map((t) => t.id)
                    .filter((id): id is number => id !== undefined)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task as any}
                        onClick={() =>
                          go({
                            to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/${task.id}/show`,
                            type: "push",
                          })
                        }
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No tasks"
                        style={{ marginTop: 20 }}
                      />
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ cursor: "grabbing" }}>
              <TaskCard task={activeTask as any} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ResponsiveContainer>
  );
};
