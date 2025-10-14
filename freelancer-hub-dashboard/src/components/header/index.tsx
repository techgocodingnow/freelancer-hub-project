import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Dropdown,
  type MenuProps,
} from "antd";
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { ColorModeContext } from "../../contexts/color-mode";
import { TenantSelector } from "../tenant-selector";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { NotificationBell } from "../notifications";
import { useTenant } from "../../contexts/tenant";
import { useLogout } from "@refinedev/core";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { mutate: logout } = useLogout();

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: isMobile ? "0px 12px" : "0px 24px",
    height: isMobile ? "56px" : "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  const menuItems: MenuProps["items"] = [
    {
      key: "notifications",
      icon: <BellOutlined />,
      label: "Notification Preferences",
      onClick: () => {
        if (tenant) {
          navigate(`/tenants/${tenant.slug}/settings/notifications`);
        }
      },
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => {
        if (tenant) {
          navigate(`/tenants/${tenant.slug}/settings/wise-account`);
        }
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => {
        logout();
      },
    },
  ];

  return (
    <AntdLayout.Header style={headerStyles}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <TenantSelector />
        <Space size={isMobile ? "small" : "middle"}>
          <Switch
            checkedChildren="🌛"
            unCheckedChildren="🔆"
            onChange={() => setMode(mode === "light" ? "dark" : "light")}
            defaultChecked={mode === "dark"}
            size={isMobile ? "small" : "default"}
          />
          <NotificationBell />
          {!isMobile && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Space
                style={{ marginLeft: "8px", cursor: "pointer" }}
                size="middle"
              >
                {user?.name && <Text strong>{user.name}</Text>}
                <Avatar
                  src={user?.avatar}
                  alt={user?.name}
                  icon={!user?.avatar && <UserOutlined />}
                />
              </Space>
            </Dropdown>
          )}
          {isMobile && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                size="small"
                icon={!user?.avatar && <UserOutlined />}
                style={{ cursor: "pointer" }}
              />
            </Dropdown>
          )}
        </Space>
      </div>
    </AntdLayout.Header>
  );
};
