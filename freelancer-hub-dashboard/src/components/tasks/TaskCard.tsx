import React from "react";
import { Card, Tag, Avatar, Space, Typography, Progress } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getPriorityColor, getDueDateColor } from "../../theme";
import { tokens } from "../../theme/tokens";

const { Text } = Typography;

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status?: string;
  dueDate?: string;
  assignee?: {
    id: number;
    fullName: string;
    email: string;
    avatar?: string;
  };
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: Array<{ id: number; completed: boolean }>;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const formatDueDate = (dueDate: string) => {
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};

const calculateProgress = (
  subtasks?: Array<{ id: number; completed: boolean }>
) => {
  if (!subtasks || subtasks.length === 0) return 0;
  const completed = subtasks.filter((st) => st.completed).length;
  return Math.round((completed / subtasks.length) * 100);
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const overdue = isOverdue(task.dueDate);
  const priorityColor = getPriorityColor(task.priority);
  const dueDateColor = task.dueDate ? getDueDateColor(task.dueDate) : undefined;
  const progress = calculateProgress(task.subtasks);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        hoverable
        onClick={onClick}
        style={{
          marginBottom: 0,
          borderLeft: `4px solid ${priorityColor}`,
          borderRadius: tokens.borderRadius.lg,
          boxShadow: tokens.shadows.xs,
          transition: `all ${tokens.transitions.normal}`,
        }}
        styles={{ body: { padding: tokens.spacing[3] } }}
      >
        <Space
          direction="vertical"
          size={tokens.spacing[2]}
          style={{ width: "100%" }}
        >
          {/* Task ID Badge (Linear-style) */}
          <Text
            type="secondary"
            style={{
              fontSize: tokens.typography.fontSize.xs,
              fontFamily: tokens.typography.fontFamily.mono,
              color: tokens.colors.text.tertiary,
            }}
          >
            #{task.id}
          </Text>

          {/* Task Title */}
          <div
            style={{
              fontSize: tokens.typography.fontSize.md,
              lineHeight: tokens.typography.lineHeight.tight,
              fontWeight: tokens.typography.fontWeight.semibold,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {task.title}
          </div>

          {/* Task Description */}
          {task.description && (
            <div
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.text.secondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {task.description}
            </div>
          )}

          {/* Metadata Tags */}
          <Space size={tokens.spacing[1]} wrap>
            <Tag
              icon={<FlagOutlined />}
              style={{
                margin: 0,
                fontSize: tokens.typography.fontSize.xs,
                backgroundColor: `${priorityColor}15`,
                color: priorityColor,
                border: `1px solid ${priorityColor}40`,
                borderRadius: tokens.borderRadius.md,
              }}
            >
              {task.priority.toUpperCase()}
            </Tag>

            {task.dueDate && (
              <Tag
                icon={<CalendarOutlined />}
                style={{
                  margin: 0,
                  fontSize: tokens.typography.fontSize.xs,
                  backgroundColor: dueDateColor
                    ? `${dueDateColor}15`
                    : undefined,
                  color: dueDateColor,
                  border: dueDateColor
                    ? `1px solid ${dueDateColor}40`
                    : undefined,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                {formatDueDate(task.dueDate)}
              </Tag>
            )}

            {(task.estimatedHours || task.actualHours) && (
              <Tag
                icon={<ClockCircleOutlined />}
                style={{
                  margin: 0,
                  fontSize: tokens.typography.fontSize.xs,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                {task.actualHours || 0}/{task.estimatedHours || 0}h
              </Tag>
            )}
          </Space>

          {/* Assignee */}
          {task.assignee && (
            <Space size={tokens.spacing[2]}>
              <Avatar
                size={24}
                src={task.assignee.avatar}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: tokens.colors.primary.main,
                }}
              >
                {task.assignee.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Text
                type="secondary"
                style={{ fontSize: tokens.typography.fontSize.sm }}
              >
                {task.assignee.fullName}
              </Text>
            </Space>
          )}

          {/* Subtask Progress */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <Progress
                percent={progress}
                size="small"
                showInfo={false}
                strokeColor={tokens.colors.primary.main}
                trailColor={tokens.colors.gray[200]}
              />
              <Text
                type="secondary"
                style={{ fontSize: tokens.typography.fontSize.xs }}
              >
                {task.subtasks.filter((st) => st.completed).length}/
                {task.subtasks.length} subtasks
              </Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};
