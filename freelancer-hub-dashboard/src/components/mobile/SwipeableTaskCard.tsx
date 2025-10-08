/**
 * Swipeable Task Card
 * Task card with swipe gestures for mobile
 */

import React, { useState } from "react";
import { Card, Typography, Tag, Space, message } from "antd";
import {
  DeleteOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { getPriorityColor, getStatusColor, tokens } from "../../theme";

const { Text } = Typography;

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignee?: {
    id: number;
    fullName: string;
  };
  estimatedHours?: number;
}

interface SwipeableTaskCardProps {
  task: Task;
  onComplete?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onClick?: (taskId: number) => void;
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  onComplete,
  onDelete,
  onClick,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      setIsRevealed(true);
      setSwipeOffset(-120);
    },
    onSwipeRight: () => {
      setIsRevealed(false);
      setSwipeOffset(0);
    },
    minSwipeDistance: 30,
  });

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComplete) {
      onComplete(task.id);
      message.open({
        type: "success",
        content: "Task marked as complete",
      });
    }
    setIsRevealed(false);
    setSwipeOffset(0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
      message.open({
        type: "success",
        content: "Task deleted",
      });
    }
    setIsRevealed(false);
    setSwipeOffset(0);
  };

  const handleCardClick = () => {
    if (isRevealed) {
      setIsRevealed(false);
      setSwipeOffset(0);
    } else if (onClick) {
      onClick(task.id);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        marginBottom: tokens.spacing[3],
        overflow: "hidden",
        borderRadius: tokens.borderRadius.lg,
      }}
    >
      {/* Action buttons (revealed on swipe) */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <button
          onClick={handleComplete}
          style={{
            flex: 1,
            border: "none",
            background: tokens.colors.semantic.success,
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
          aria-label="Mark as complete"
        >
          <CheckOutlined />
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex: 1,
            border: "none",
            background: tokens.colors.semantic.error,
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
          aria-label="Delete task"
        >
          <DeleteOutlined />
        </button>
      </div>

      {/* Task card */}
      <div
        {...swipeHandlers}
        style={{
          position: "relative",
          transform: `translateX(${swipeOffset}px)`,
          transition: isRevealed
            ? "none"
            : `transform ${tokens.transitions.normal}`,
        }}
      >
        <Card
          onClick={handleCardClick}
          style={{
            borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
            cursor: "pointer",
            minHeight: "44px",
          }}
          styles={{ body: { padding: tokens.spacing[3] } }}
        >
          <Space
            direction="vertical"
            style={{ width: "100%" }}
            size={tokens.spacing[2]}
          >
            {/* Task ID and Title */}
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontFamily: tokens.typography.fontFamily.mono,
                }}
              >
                #{task.id}
              </Text>
              <Text
                strong
                style={{
                  display: "block",
                  fontSize: tokens.typography.fontSize.md,
                  marginTop: tokens.spacing[1],
                }}
              >
                {task.title}
              </Text>
            </div>

            {/* Description */}
            {task.description && (
              <Text
                type="secondary"
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {task.description}
              </Text>
            )}

            {/* Metadata */}
            <Space wrap size={tokens.spacing[1]}>
              <Tag
                color={getStatusColor(task.status)}
                style={{ fontSize: tokens.typography.fontSize.xs }}
              >
                {task.status.replace("_", " ").toUpperCase()}
              </Tag>
              <Tag
                color={getPriorityColor(task.priority)}
                style={{ fontSize: tokens.typography.fontSize.xs }}
              >
                {task.priority.toUpperCase()}
              </Tag>
              {task.estimatedHours && (
                <Tag
                  icon={<ClockCircleOutlined />}
                  style={{ fontSize: tokens.typography.fontSize.xs }}
                >
                  {task.estimatedHours}h
                </Tag>
              )}
              {task.assignee && (
                <Tag
                  icon={<UserOutlined />}
                  style={{ fontSize: tokens.typography.fontSize.xs }}
                >
                  {task.assignee.fullName}
                </Tag>
              )}
            </Space>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default SwipeableTaskCard;
