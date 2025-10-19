import { notification } from "antd";
import { NotificationInstance } from "antd/lib/notification/interface";
import { createContext } from "react";

export const NotificationContext = createContext<{
  notificationApi: NotificationInstance;
}>({} as any);

export const NotificationProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [notificationApi, contextHolder] = notification.useNotification();
  return (
    <NotificationContext.Provider value={{ notificationApi }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};
