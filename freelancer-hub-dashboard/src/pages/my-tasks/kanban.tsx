import React, { useState } from "react";
import { useList, useUpdate, useGo } from "@refinedev/core";
import { Typography, Select, Space, Button, Empty, Segmented } from "antd";
import {
  UnorderedListOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
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
import { useIsMobile } from "../../hooks/useMediaQuery";

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
  };
  project?: {
    id: number;
    name: string;
  };
  estimatedHours?: number;
  actualHours: number;
}

const columns = [
  { id: "todo", title: "To Do", color: "#d9d9d9" },
  { id: "in_progress", title: "In Progress", color: "#1890ff" },
  { id: "review", title: "Review", color: "#faad14" },
  { id: "done", title: "Done", color: "#52c41a" },
];

export const MyTasksKanban: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const { mutate: updateTask } = useUpdate();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [viewFilter, setViewFilter] = useState<"today_overdue" | "assigned">(
    "assigned"
  );

  const {
    result,
    query: { refetch },
  } = useList<Task>({
    resource: "my-tasks",
    pagination: {
      pageSize: 100,
    },
    filters: [
      {
        field: "filter",
        operator: "eq",
        value: viewFilter,
      },
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
    if (!task || !task.project?.id) {
      setActiveId(null);
      return;
    }

    if (task.status !== newStatus) {
      updateTask(
        {
          resource: `projects/${task.project.id}/tasks`,
          id: taskId,
          values: {
            status: newStatus,
          },
        },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }

    setActiveId(null);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
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
        <Title level={isMobile ? 3 : 2}>My Tasks - Kanban</Title>
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
          {!isMobile && (
            <>
              <Button
                icon={<UnorderedListOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/my-tasks`,
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

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            minHeight: "500px",
          }}
        >
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.id
            );

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
                            to: `/tenants/${tenantSlug}/projects/${task.project?.id}/tasks/${task.id}/edit`,
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
          {activeTask ? <TaskCard task={activeTask as any} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
