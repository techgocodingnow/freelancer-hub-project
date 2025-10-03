import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
} from "antd";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { TenantSelector } from "../tenant-selector";
import { useIsMobile } from "../../hooks/useMediaQuery";

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
          {!isMobile && (
            <Space style={{ marginLeft: "8px" }} size="middle">
              {user?.name && <Text strong>{user.name}</Text>}
              {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
            </Space>
          )}
          {isMobile && user?.avatar && (
            <Avatar src={user?.avatar} alt={user?.name} size="small" />
          )}
        </Space>
      </div>
    </AntdLayout.Header>
  );
};
