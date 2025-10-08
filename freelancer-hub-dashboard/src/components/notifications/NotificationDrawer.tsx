import React, { useState } from "react";
import { Drawer, Button, List, Empty, Typography, Space, message } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useLiveQuery } from "@tanstack/react-db";
import NotificationItem from "./NotificationItem";
import Api from "../../services/api/api";

const { Title } = Typography;

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notificationCollection: ReturnType<
    typeof import("../../services/notifications/collection").getNotificationCollection
  > | null;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notificationCollection,
}) => {
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Real-time query for all notifications using Electric
  const { data: allNotifications = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ notification: notificationCollection! })
        .orderBy(({ notification }) => notification.createdAt, "desc")
        .limit(100) // Show last 100 notifications
  );

  // Only show notifications when drawer is open and collection is available
  const notifications = notificationCollection && open ? allNotifications : [];

  const handleMarkAsRead = async (id: number) => {
    try {
      if (!notificationCollection) {
        console.error("Notification collection not available");
        return;
      }

      // Check if notification exists in collection
      const notification = notificationCollection.get(id);
      if (!notification) {
        console.error("Notification not found in collection:", id);
        message.open({
          type: "error",
          content: "Notification not found",
        });
        return;
      }

      // Optimistic update: Update the local collection immediately
      // This bypasses schema validation and updates the synced data directly
      notificationCollection.utils.writeUpdate({
        ...notification,
        isRead: true,
        readAt: new Date().toISOString(),
      });

      // Then sync with backend
      // Electric will reconcile any differences
      await Api.markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      message.open({
        type: "error",
        content: "Failed to mark notification as read",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      const response = await Api.markAllNotificationsAsRead();
      const txid = response.data.txid;

      // Wait for Electric to sync the changes
      if (notificationCollection) {
        await notificationCollection.utils.awaitTxId(parseInt(txid, 10));
      }

      message.open({
        type: "success",
        content: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      message.open({
        type: "error",
        content: "Failed to mark all notifications as read",
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Drawer
      title={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={4} style={{ margin: 0 }}>
            Notifications
          </Title>
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
              loading={markingAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={window.innerWidth < 768 ? "100%" : 400}
      styles={{
        body: { padding: "16px" },
      }}
    >
      {isLoading && notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Empty description="Loading notifications..." />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          image={<BellOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description="No notifications yet"
          style={{ marginTop: "40px" }}
        />
      ) : (
        <>
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            )}
            style={{ marginBottom: "16px" }}
          />

          {notifications.length > 0 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                color: "#8c8c8c",
              }}
            >
              Showing {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

export default NotificationDrawer;
