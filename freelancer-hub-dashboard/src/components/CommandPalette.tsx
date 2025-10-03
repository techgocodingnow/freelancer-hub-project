/**
 * Command Palette Component
 * Universal search and action interface (Linear-inspired)
 */

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Input, List, Typography, Tag, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useTenantSlug } from "../contexts/tenant";
import {
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: "navigation" | "action" | "create" | "view";
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const tenantSlug = useTenantSlug();

  // Define all available commands
  const commands: Command[] = useMemo(
    () => [
      // Create Commands
      {
        id: "create-task",
        title: "Create New Task",
        description: "Add a new task to your project",
        icon: <PlusOutlined />,
        keywords: ["new", "task", "create", "add"],
        action: () => navigate(`/tenants/${tenantSlug}/projects`),
        category: "create",
      },
      {
        id: "create-project",
        title: "Create New Project",
        description: "Start a new project",
        icon: <FileOutlined />,
        keywords: ["new", "project", "create"],
        action: () => navigate(`/tenants/${tenantSlug}/projects/create`),
        category: "create",
      },

      // Navigation Commands
      {
        id: "go-projects",
        title: "Go to Projects",
        icon: <FileOutlined />,
        keywords: ["projects", "go", "navigate"],
        action: () => navigate(`/tenants/${tenantSlug}/projects`),
        category: "navigation",
      },
      {
        id: "go-users",
        title: "Go to Users",
        icon: <UserOutlined />,
        keywords: ["users", "team", "go", "navigate"],
        action: () => navigate(`/tenants/${tenantSlug}/users`),
        category: "navigation",
      },

      // View Commands
      {
        id: "view-kanban",
        title: "Switch to Kanban View",
        description: "View tasks in kanban board",
        icon: <AppstoreOutlined />,
        keywords: ["kanban", "board", "view"],
        action: () => {
          // This would need project context
          console.log("Switch to kanban view");
        },
        category: "view",
      },
      {
        id: "view-list",
        title: "Switch to List View",
        description: "View tasks in list format",
        icon: <UnorderedListOutlined />,
        keywords: ["list", "table", "view"],
        action: () => {
          console.log("Switch to list view");
        },
        category: "view",
      },
    ],
    [navigate, tenantSlug]
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.keywords.some((kw) => kw.includes(searchLower))
    );
  }, [search, commands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex]);

  const handleCommandSelect = (command: Command) => {
    command.action();
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setSelectedIndex(0);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      navigation: "blue",
      action: "green",
      create: "purple",
      view: "orange",
    };
    return colors[category] || "default";
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
      closable={false}
      styles={{ body: { padding: 0 } }}
      style={{ top: 100 }}
      destroyOnHidden
    >
      <Input
        size="large"
        placeholder="Type a command or search..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        style={{
          borderRadius: 0,
          border: "none",
          borderBottom: "1px solid #f0f0f0",
        }}
      />

      <List
        dataSource={filteredCommands}
        style={{ maxHeight: 400, overflow: "auto" }}
        renderItem={(command, index) => (
          <List.Item
            onClick={() => handleCommandSelect(command)}
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              backgroundColor:
                index === selectedIndex ? "#f5f5f5" : "transparent",
              transition: "background-color 150ms",
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                {command.icon}
                <div>
                  <Text strong>{command.title}</Text>
                  {command.description && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {command.description}
                      </Text>
                    </div>
                  )}
                </div>
              </Space>
              <Tag color={getCategoryColor(command.category)}>
                {command.category}
              </Tag>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: "No commands found" }}
      />

      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid #f0f0f0",
          fontSize: 12,
          color: "#8c8c8c",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space split="•">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </Space>
      </div>
    </Modal>
  );
};

export default CommandPalette;
