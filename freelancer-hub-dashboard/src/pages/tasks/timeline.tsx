import React, { useMemo, useState } from "react";
import { useList, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Timeline,
  Typography,
  Tag,
  Space,
  Button,
  DatePicker,
  Empty,
  Card,
  Avatar,
  Spin,
  theme,
} from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UserOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { useTenantSlug } from "../../contexts/tenant";
import { getPriorityColor, getStatusColor, tokens } from "../../theme";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useToken } = theme;

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  createdAt: string;
  assignee?: {
    id: number;
    fullName: string;
  };
  estimatedHours?: number;
}

interface GroupedTasks {
  [date: string]: Task[];
}

export const TaskTimeline: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { token } = useToken();
  const isDarkMode = token.colorBgBase === '#141414';

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const {
    result: data,
    query: { isLoading },
  } = useList<Task>({
    resource: `projects/${projectId}/tasks`,
    pagination: {
      pageSize: 1000,
    },
    sorters: [
      {
        field: "dueDate",
        order: "asc",
      },
    ],
  });

  const tasks = data?.data || [];

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return tasks;

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isWithinInterval(taskDate, {
        start: startOfDay(dateRange[0]!),
        end: endOfDay(dateRange[1]!),
      });
    });
  }, [tasks, dateRange]);

  // Group tasks by date
  const groupedTasks: GroupedTasks = useMemo(() => {
    const groups: GroupedTasks = {};

    filteredTasks.forEach((task) => {
      if (!task.dueDate) return;

      const dateKey = format(parseISO(task.dueDate), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Sort dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedTasks).sort();
  }, [groupedTasks]);

  const handleTaskClick = (taskId: number) => {
    go({
      to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/${taskId}/edit`,
      type: "push",
    });
  };

  const getTimelineColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "gray",
      in_progress: "blue",
      review: "orange",
      done: "green",
    };
    return colors[status] || "gray";
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
          <ClockCircleOutlined /> {isMobile ? "Timeline" : "Task Timeline"}
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
            </>
          )}
        </Space>
      </div>

      {/* Date Range Filter */}
      <div
        style={{
          marginBottom: isMobile ? tokens.spacing[4] : tokens.spacing[6],
          padding: tokens.spacing[4],
          backgroundColor: token.colorBgContainer,
          borderRadius: tokens.borderRadius.lg,
        }}
      >
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          <Text strong>Filter by Date Range:</Text>
          <RangePicker
            style={{ width: isMobile ? "100%" : "auto" }}
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]?.toDate() || null,
                  dates[1]?.toDate() || null,
                ]);
              } else {
                setDateRange([null, null]);
              }
            }}
          />
          {dateRange[0] && dateRange[1] && (
            <Button onClick={() => setDateRange([null, null])} block={isMobile}>
              Clear Filter
            </Button>
          )}
        </Space>
      </div>

      {/* Timeline */}
      <div
        style={{
          backgroundColor: token.colorBgElevated,
          borderRadius: tokens.borderRadius.xl,
          padding: isMobile ? tokens.spacing[4] : tokens.spacing[6],
          boxShadow: tokens.shadows.sm,
        }}
      >
        {sortedDates.length === 0 ? (
          <Empty description="No tasks found" />
        ) : (
          <Timeline mode={isMobile ? "left" : "left"}>
            {sortedDates.map((dateKey) => {
              const dateTasks = groupedTasks[dateKey];
              const dateObj = parseISO(dateKey);
              const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;

              return (
                <Timeline.Item
                  key={dateKey}
                  color={isToday ? "blue" : "gray"}
                  label={
                    <div style={{ fontWeight: isToday ? 600 : 400 }}>
                      {format(dateObj, "MMM dd, yyyy")}
                      {isToday && (
                        <Tag
                          color="blue"
                          style={{ marginLeft: tokens.spacing[2] }}
                        >
                          Today
                        </Tag>
                      )}
                    </div>
                  }
                >
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={tokens.spacing[3]}
                  >
                    {dateTasks.map((task) => (
                      <Card
                        key={task.id}
                        size="small"
                        hoverable
                        onClick={() => handleTaskClick(task.id)}
                        style={{
                          borderLeft: `4px solid ${getPriorityColor(
                            task.priority,
                            isDarkMode
                          )}`,
                          cursor: "pointer",
                          backgroundColor: token.colorBgContainer,
                        }}
                      >
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={tokens.spacing[2]}
                        >
                          {/* Task Title */}
                          <Text
                            strong
                            style={{ fontSize: tokens.typography.fontSize.md }}
                          >
                            #{task.id} {task.title}
                          </Text>

                          {/* Task Description */}
                          {task.description && (
                            <Text
                              type="secondary"
                              style={{
                                fontSize: tokens.typography.fontSize.sm,
                              }}
                              ellipsis
                            >
                              {task.description}
                            </Text>
                          )}

                          {/* Task Metadata */}
                          <Space wrap size={tokens.spacing[1]}>
                            <Tag
                              color={getStatusColor(task.status, isDarkMode)}
                              style={{
                                fontSize: tokens.typography.fontSize.xs,
                              }}
                            >
                              {task.status.replace("_", " ").toUpperCase()}
                            </Tag>
                            <Tag
                              icon={<FlagOutlined />}
                              color={getPriorityColor(task.priority, isDarkMode)}
                              style={{
                                fontSize: tokens.typography.fontSize.xs,
                              }}
                            >
                              {task.priority.toUpperCase()}
                            </Tag>
                            {task.estimatedHours && (
                              <Tag
                                icon={<ClockCircleOutlined />}
                                style={{
                                  fontSize: tokens.typography.fontSize.xs,
                                }}
                              >
                                {task.estimatedHours}h
                              </Tag>
                            )}
                          </Space>

                          {/* Assignee */}
                          {task.assignee && (
                            <Space size={tokens.spacing[2]}>
                              <Avatar size={20} icon={<UserOutlined />}>
                                {task.assignee.fullName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: tokens.typography.fontSize.sm,
                                }}
                              >
                                {task.assignee.fullName}
                              </Text>
                            </Space>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: tokens.spacing[4],
          padding: tokens.spacing[4],
          backgroundColor: token.colorBgContainer,
          borderRadius: tokens.borderRadius.lg,
        }}
      >
        <Text type="secondary">
          Showing {filteredTasks.length} task(s)
          {dateRange[0] && dateRange[1] && (
            <>
              {" "}
              from {format(dateRange[0], "MMM dd, yyyy")} to{" "}
              {format(dateRange[1], "MMM dd, yyyy")}
            </>
          )}
        </Text>
      </div>
    </ResponsiveContainer>
  );
};

export default TaskTimeline;
