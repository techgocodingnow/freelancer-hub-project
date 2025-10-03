/**
 * Bulk Actions Toolbar Component
 * Provides UI for batch operations on selected tasks
 */

import React, { useState } from "react";
import { Space, Button, Select, Modal, Typography } from "antd";
import {
  DeleteOutlined,
  CheckOutlined,
  FlagOutlined,
  UserOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { tokens } from "../../theme";

const { Option } = Select;
const { Text } = Typography;
const { confirm } = Modal;

interface BulkActionsToolbarProps {
  selectedCount: number;
  isProcessing: boolean;
  onClearSelection: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdatePriority: (priority: string) => void;
  onAssign: (assigneeId: number) => void;
  onDelete: () => void;
  users?: Array<{ id: number; fullName: string }>;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  isProcessing,
  onClearSelection,
  onUpdateStatus,
  onUpdatePriority,
  onAssign,
  onDelete,
  users = [],
}) => {
  const [statusValue, setStatusValue] = useState<string | undefined>();
  const [priorityValue, setPriorityValue] = useState<string | undefined>();
  const [assigneeValue, setAssigneeValue] = useState<number | undefined>();

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    onUpdateStatus(value);
    setStatusValue(undefined);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityValue(value);
    onUpdatePriority(value);
    setPriorityValue(undefined);
  };

  const handleAssignChange = (value: number) => {
    setAssigneeValue(value);
    onAssign(value);
    setAssigneeValue(undefined);
  };

  const handleDelete = () => {
    confirm({
      title: `Delete ${selectedCount} task(s)?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: onDelete,
    });
  };

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: tokens.zIndex.sticky,
        backgroundColor: tokens.colors.primary.light,
        border: `1px solid ${tokens.colors.primary.main}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing[4],
        marginBottom: tokens.spacing[4],
        boxShadow: tokens.shadows.md,
      }}
    >
      <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
        <Space>
          <Text strong style={{ color: tokens.colors.primary.main }}>
            {selectedCount} task(s) selected
          </Text>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear
          </Button>
        </Space>

        <Space wrap>
          {/* Update Status */}
          <Select
            placeholder="Update Status"
            value={statusValue}
            onChange={handleStatusChange}
            style={{ width: 150 }}
            disabled={isProcessing}
            suffixIcon={<CheckOutlined />}
          >
            <Option value="todo">To Do</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="review">Review</Option>
            <Option value="done">Done</Option>
          </Select>

          {/* Update Priority */}
          <Select
            placeholder="Update Priority"
            value={priorityValue}
            onChange={handlePriorityChange}
            style={{ width: 150 }}
            disabled={isProcessing}
            suffixIcon={<FlagOutlined />}
          >
            <Option value="urgent">Urgent</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>

          {/* Assign to User */}
          {users.length > 0 && (
            <Select
              placeholder="Assign to..."
              value={assigneeValue}
              onChange={handleAssignChange}
              style={{ width: 150 }}
              disabled={isProcessing}
              suffixIcon={<UserOutlined />}
              showSearch
              filterOption={(input, option) => {
                if (!option || !option.children) return false;
                const label = String(option.children);
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.fullName}
                </Option>
              ))}
            </Select>
          )}

          {/* Delete */}
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            disabled={isProcessing}
          >
            Delete
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export default BulkActionsToolbar;
