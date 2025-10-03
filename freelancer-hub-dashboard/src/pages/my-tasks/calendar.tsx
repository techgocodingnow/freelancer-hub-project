import React, { useState } from "react";
import { useList, useGo } from "@refinedev/core";
import { Calendar, Badge, Typography, Space, Button, Segmented } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  UnorderedListOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
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

const priorityColors = {
  low: "default",
  medium: "blue",
  high: "orange",
  urgent: "red",
} as const;

export const MyTasksCalendar: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();

  const [viewFilter, setViewFilter] = useState<"today_overdue" | "assigned">(
    "assigned"
  );

  const { result: data } = useList<Task>({
    resource: "my-tasks",
    pagination: {
      pageSize: 200,
    },
    filters: [
      {
        field: "filter",
        operator: "eq",
        value: viewFilter,
      },
    ],
  });

  const tasks = data?.data || [];

  const getTasksForDate = (date: Dayjs) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return dayjs(task.dueDate).isSame(date, "day");
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const tasksForDate = getTasksForDate(value);
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {tasksForDate.map((task) => (
          <li key={task.id} style={{ marginBottom: 4 }}>
            <Badge
              status={
                task.priority === "urgent" || task.priority === "high"
                  ? "error"
                  : task.priority === "medium"
                  ? "warning"
                  : "default"
              }
              text={
                <span
                  style={{
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration:
                      task.status === "done" ? "line-through" : "none",
                  }}
                  onClick={() =>
                    go({
                      to: `/tenants/${tenantSlug}/projects/${task.project?.id}/tasks/${task.id}/edit`,
                      type: "push",
                    })
                  }
                >
                  {task.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const monthCellRender = (value: Dayjs) => {
    const tasksInMonth = tasks.filter((task) => {
      if (!task.dueDate) return false;
      return dayjs(task.dueDate).isSame(value, "month");
    });

    if (tasksInMonth.length === 0) return null;

    return (
      <div style={{ textAlign: "center" }}>
        <Badge
          count={tasksInMonth.length}
          style={{ backgroundColor: "#1890ff" }}
        />
      </div>
    );
  };

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
        <Title level={isMobile ? 3 : 2}>My Tasks - Calendar</Title>
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
            </>
          )}
        </Space>
      </div>

      {/* Calendar */}
      <Calendar
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
        style={{
          backgroundColor: "white",
          padding: isMobile ? "8px" : "16px",
          borderRadius: "8px",
        }}
      />
    </div>
  );
};
