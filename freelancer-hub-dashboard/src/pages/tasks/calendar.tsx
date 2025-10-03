/**
 * Task Calendar View
 * Displays tasks in a calendar format with drag-and-drop rescheduling
 */

import React, { useMemo, useState, useCallback } from "react";
import { useList, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button, Space, Typography, Tag, Spin } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { getPriorityColor, getStatusColor, tokens } from "../../theme";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import "react-big-calendar/lib/css/react-big-calendar.css";

const { Title } = Typography;

// Setup the localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assignee?: {
    id: number;
    fullName: string;
  };
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

export const TaskCalendar: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const [view, setView] = useState<View>(isMobile ? "agenda" : "month");
  const [date, setDate] = useState(new Date());

  const {
    result: data,
    query: { isLoading },
  } = useList<Task>({
    resource: `projects/${projectId}/tasks`,
    pagination: {
      pageSize: 1000,
    },
  });

  const tasks = data?.data || [];

  // Convert tasks to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const dueDate = new Date(task.dueDate);
        return {
          id: task.id,
          title: task.title,
          start: dueDate,
          end: dueDate,
          resource: task,
        };
      });
  }, [tasks]);

  // Handle event click
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      go({
        to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/${event.id}/edit`,
        type: "push",
      });
    },
    [go, tenantSlug, projectId]
  );

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const task = event.resource;
    const priorityColor = getPriorityColor(task.priority);
    const statusColor = getStatusColor(task.status);

    return {
      style: {
        backgroundColor: `${priorityColor}20`,
        borderLeft: `4px solid ${priorityColor}`,
        color: tokens.colors.text.primary,
        borderRadius: tokens.borderRadius.md,
        padding: "2px 4px",
        fontSize: tokens.typography.fontSize.xs,
      },
    };
  }, []);

  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const goToToday = () => {
      toolbar.onNavigate("TODAY");
    };

    const label = () => {
      const date = toolbar.date;
      return (
        <span
          style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: 600 }}
        >
          {format(date, "MMMM yyyy")}
        </span>
      );
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: tokens.spacing[4],
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.background.paper,
          borderRadius: tokens.borderRadius.lg,
          gap: isMobile ? tokens.spacing[2] : 0,
        }}
      >
        <Space style={{ justifyContent: isMobile ? "center" : "flex-start" }}>
          <Button
            icon={<LeftOutlined />}
            onClick={goToBack}
            size={isMobile ? "small" : "middle"}
          />
          <Button onClick={goToToday} size={isMobile ? "small" : "middle"}>
            Today
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={goToNext}
            size={isMobile ? "small" : "middle"}
          />
        </Space>

        <div style={{ textAlign: "center", fontWeight: 600 }}>{label()}</div>

        <Space
          wrap
          style={{ justifyContent: isMobile ? "center" : "flex-end" }}
        >
          {!isMobile && (
            <Button
              type={view === "month" ? "primary" : "default"}
              onClick={() => setView("month")}
              size="small"
            >
              Month
            </Button>
          )}
          {!isMobile && (
            <Button
              type={view === "week" ? "primary" : "default"}
              onClick={() => setView("week")}
              size="small"
            >
              Week
            </Button>
          )}
          <Button
            type={view === "day" ? "primary" : "default"}
            onClick={() => setView("day")}
            size="small"
          >
            Day
          </Button>
          <Button
            type={view === "agenda" ? "primary" : "default"}
            onClick={() => setView("agenda")}
            size="small"
          >
            Agenda
          </Button>
        </Space>
      </div>
    );
  };

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: isMobile ? tokens.spacing[4] : tokens.spacing[6],
          gap: isMobile ? tokens.spacing[2] : 0,
        }}
      >
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          <CalendarOutlined /> {isMobile ? "Calendar" : "Task Calendar"}
        </Title>

        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
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
            </>
          )}
        </Space>
      </div>

      {/* Calendar */}
      <div
        style={{
          backgroundColor: tokens.colors.background.default,
          borderRadius: tokens.borderRadius.xl,
          padding: isMobile ? tokens.spacing[2] : tokens.spacing[4],
          boxShadow: tokens.shadows.sm,
          minHeight: isMobile ? "400px" : "600px",
          overflowX: isMobile ? "auto" : undefined,
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
          }}
          style={{ height: isMobile ? 400 : 600 }}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: tokens.spacing[4],
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.background.paper,
          borderRadius: tokens.borderRadius.lg,
        }}
      >
        <Space wrap>
          <span style={{ fontWeight: 600 }}>Priority:</span>
          <Tag color={getPriorityColor("urgent")}>Urgent</Tag>
          <Tag color={getPriorityColor("high")}>High</Tag>
          <Tag color={getPriorityColor("medium")}>Medium</Tag>
          <Tag color={getPriorityColor("low")}>Low</Tag>
        </Space>
      </div>
    </ResponsiveContainer>
  );
};

export default TaskCalendar;
