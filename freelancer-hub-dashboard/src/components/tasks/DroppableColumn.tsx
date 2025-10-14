import React, { useState } from "react";
import { Card, Badge, Typography, Button, theme } from "antd";
import { useDroppable } from "@dnd-kit/core";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { tokens } from "../../theme";

const { Title } = Typography;
const { useToken } = theme;

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
  wipLimit?: number;
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  title,
  count,
  color,
  children,
  wipLimit,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { token } = useToken();
  const isDarkMode = token.colorBgBase === '#141414';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isOverLimit = wipLimit ? count > wipLimit : false;

  return (
    <div ref={setNodeRef}>
      <Card
        style={{
          height: "100%",
          backgroundColor: isOver
            ? `${color}${isDarkMode ? '25' : '15'}`
            : token.colorBgContainer,
          border: isOver
            ? `2px dashed ${color}`
            : `1px solid ${token.colorBorder}`,
          transition: `all ${tokens.transitions.normal}`,
          borderRadius: tokens.borderRadius.xl,
          boxShadow: isOver ? tokens.shadows.lg : tokens.shadows.sm,
        }}
        styles={{ body: { padding: tokens.spacing[4] } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: tokens.spacing[4],
            paddingBottom: tokens.spacing[3],
            borderBottom: `3px solid ${color}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: tokens.spacing[2],
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              {title}
            </Title>
            <Badge
              count={count}
              style={{
                backgroundColor: isOverLimit
                  ? tokens.colors.semantic.error
                  : color,
              }}
              showZero
            />
            {wipLimit && (
              <span
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: isOverLimit
                    ? tokens.colors.semantic.error
                    : token.colorTextTertiary,
                }}
              >
                (Limit: {wipLimit})
              </span>
            )}
          </div>
          <Button
            type="text"
            size="small"
            icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
        {!isCollapsed && (
          <div
            style={{
              minHeight: isOver ? "100px" : "50px",
              transition: `min-height ${tokens.transitions.normal}`,
            }}
          >
            {children}
          </div>
        )}
        {isCollapsed && (
          <div
            style={{
              textAlign: "center",
              padding: tokens.spacing[2],
              color: token.colorTextTertiary,
              fontSize: tokens.typography.fontSize.sm,
            }}
          >
            {count} task(s) hidden
          </div>
        )}
      </Card>
    </div>
  );
};
