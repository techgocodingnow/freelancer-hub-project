import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Typography,
} from "antd";
import { Api } from "../../services/api";
import { getErrorMessage } from "../../utils/error";
import type { ProjectMember, RoleName, Position } from "../../services/api/types";

const { Text } = Typography;

type ProjectMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  member?: ProjectMember;
  isEditMode?: boolean;
  tenantUsers?: Array<{
    id: number;
    fullName: string;
    email: string;
    hourlyRate: number | null;
  }>;
};

export const ProjectMemberModal: React.FC<ProjectMemberModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectId,
  member,
  isEditMode = false,
  tenantUsers = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedUserRate, setSelectedUserRate] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  // Fetch positions when modal opens
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await Api.getPositions({ showInactive: false });
        setPositions(response.data.data);
      } catch (error: any) {
        message.error("Failed to fetch positions");
      }
    };

    if (open) {
      fetchPositions();
    }
  }, [open]);

  useEffect(() => {
    if (open && isEditMode && member) {
      form.setFieldsValue({
        role: member.role,
        positionId: member.positionId,
        hourlyRate: member.hourlyRate,
      });
      setSelectedUserRate(member.user?.hourlyRate || null);
    } else if (open && !isEditMode) {
      form.resetFields();
      setSelectedUserRate(null);
    }
  }, [open, isEditMode, member, form]);

  const handleUserChange = (userId: number) => {
    const user = tenantUsers.find((u) => u.id === userId);
    if (user?.hourlyRate) {
      setSelectedUserRate(user.hourlyRate);
      // Optionally pre-fill hourly rate with user's default
      form.setFieldValue("hourlyRate", user.hourlyRate);
    } else {
      setSelectedUserRate(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEditMode && member) {
        // Update existing member
        await Api.updateProjectMember(projectId, member.id, {
          role: values.role,
          positionId: values.positionId || null,
          hourlyRate: values.hourlyRate || null,
        });
        message.success("Team member updated successfully");
      } else {
        // Add new member via invitation (handled by InviteMemberModal)
        // This modal is primarily for editing, but kept flexible
        message.info("Use the Invite Member button to add new members");
      }

      form.resetFields();
      setSelectedUserRate(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.errorFields) {
        // Validation error
        return;
      }
      message.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedUserRate(null);
    onClose();
  };

  return (
    <Modal
      title={isEditMode ? "Edit Team Member" : "Add Team Member"}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
      width={500}
    >
      <Form form={form} layout="vertical" preserve={false}>
        {!isEditMode && (
          <Form.Item
            label="Team Member"
            name="userId"
            rules={[{ required: true, message: "Please select a member" }]}
          >
            <Select
              placeholder="Select a team member"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={tenantUsers.map((user) => ({
                value: user.id,
                label: `${user.fullName} (${user.email})`,
              }))}
              onChange={handleUserChange}
            />
          </Form.Item>
        )}

        {isEditMode && member && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Member: </Text>
            <Text>{member.user?.fullName || "Unknown"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {member.user?.email}
            </Text>
          </div>
        )}

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role" }]}
          initialValue="member"
        >
          <Select placeholder="Select role">
            <Select.Option value="owner">Owner</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="member">Member</Select.Option>
            <Select.Option value="viewer">Viewer</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Position"
          name="positionId"
          tooltip="The member's position/title in the project"
        >
          <Select
            placeholder="Select a position (optional)"
            showSearch
            allowClear
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={positions.map((pos) => ({
              value: pos.id,
              label: pos.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Hourly Rate (Project-specific)"
          name="hourlyRate"
          tooltip="Project-specific rate overrides the member's default rate"
        >
          <InputNumber
            prefix="$"
            min={0.01}
            step={0.01}
            style={{ width: "100%" }}
            placeholder={
              selectedUserRate
                ? `Default: $${selectedUserRate}/hr`
                : "Enter hourly rate"
            }
          />
        </Form.Item>

        {selectedUserRate && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Member's default rate: ${selectedUserRate}/hr. Leave empty to use
            default.
          </Text>
        )}
      </Form>
    </Modal>
  );
};
