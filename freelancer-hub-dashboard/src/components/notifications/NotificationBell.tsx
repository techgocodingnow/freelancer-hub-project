import { useState } from "react";
import { Badge, Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { eq, useLiveQuery } from "@tanstack/react-db";
import NotificationDrawer from "./NotificationDrawer";
import { getNotificationCollection } from "../../services/notifications/collection";
import { useMemo } from "react";

const NotificationBell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const notificationCollection = useMemo(() => getNotificationCollection(), []);

  // Real-time query for unread count using Electric
  const { data: unreadNotifications = [] } = useLiveQuery((q) => {
    const collection = notificationCollection;
    if (!collection) {
      return null;
    }
    return q
      .from({ notification: collection })
      .where(({ notification }) => eq(notification.isRead, false));
  });

  const unreadCount = unreadNotifications.length;

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <>
      <Badge count={displayCount} offset={[-5, 5]} color="#ff4d4f">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: "20px" }} />}
          onClick={handleOpenDrawer}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "40px",
            width: "40px",
          }}
        />
      </Badge>

      <NotificationDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        notificationCollection={notificationCollection}
      />
    </>
  );
};

export default NotificationBell;
