import React, { useState } from "react";
import { List, Button, Typography, Space, Badge } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Notification } from "../../services/api/types";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => Promise<void>;
  onAction?: (notification: Notification, actionType: "primary" | "secondary") => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onAction,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [primaryActionLoading, setPrimaryActionLoading] = useState(false);
  const [secondaryActionLoading, setSecondaryActionLoading] = useState(false);

  const handleClick = async () => {
    if (!notification.isRead) {
      setLoading(true);
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrimaryAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrimaryActionLoading(true);
    try {
      if (onAction) {
        await onAction(notification, "primary");
      } else if (notification.actionUrl) {
        await handleClick();
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error("Failed to execute primary action:", error);
    } finally {
      setPrimaryActionLoading(false);
    }
  };

  const handleSecondaryAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSecondaryActionLoading(true);
    try {
      if (onAction) {
        await onAction(notification, "secondary");
      } else if (notification.secondaryActionUrl) {
        await handleClick();
        navigate(notification.secondaryActionUrl);
      }
    } catch (error) {
      console.error("Failed to execute secondary action:", error);
    } finally {
      setSecondaryActionLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <List.Item
      onClick={handleClick}
      style={{
        cursor: "pointer",
        backgroundColor: notification.isRead ? "transparent" : "#e6f7ff",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "8px",
        border: notification.isRead ? "1px solid #f0f0f0" : "1px solid #91d5ff",
        transition: "all 0.3s ease",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* Header with title and unread indicator */}
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            {!notification.isRead && (
              <Badge
                color="#1890ff"
                style={{ marginTop: "4px" }}
              />
            )}
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: notification.isRead ? "normal" : "bold",
              }}
            >
              {notification.title}
            </Title>
          </Space>
        </Space>

        {/* Message */}
        <Text
          style={{
            display: "block",
            color: "#595959",
            fontWeight: notification.isRead ? "normal" : 500,
          }}
        >
          {notification.message}
        </Text>

        {/* Footer with timestamp and actions */}
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginTop: "8px",
          }}
        >
          <Space size="small">
            <ClockCircleOutlined style={{ color: "#8c8c8c", fontSize: "12px" }} />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {getRelativeTime(notification.createdAt)}
            </Text>
          </Space>

          {/* Action buttons */}
          {(notification.actionLabel || notification.secondaryActionLabel) && (
            <Space size="small">
              {notification.secondaryActionLabel && notification.secondaryActionUrl && (
                <Button
                  size="small"
                  onClick={handleSecondaryAction}
                  loading={secondaryActionLoading}
                >
                  {notification.secondaryActionLabel}
                </Button>
              )}
              {notification.actionLabel && notification.actionUrl && (
                <Button
                  type="primary"
                  size="small"
                  onClick={handlePrimaryAction}
                  loading={primaryActionLoading}
                >
                  {notification.actionLabel}
                </Button>
              )}
            </Space>
          )}
        </Space>
      </Space>
    </List.Item>
  );
};

export default NotificationItem;

