/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Alert,
  Space,
  Typography,
  AutoComplete,
  Tag,
} from "antd";
import {
  UserAddOutlined,
  MailOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Api } from "../../services/api";
import type { Role, OrganizationMember } from "../../services/api/types";
import { debounce } from "lodash";
import { getErrorMessage } from "../../utils/error";

const { Text } = Typography;

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId?: number;
  projectName?: string;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectId,
  projectName,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [searchResults, setSearchResults] = useState<OrganizationMember[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationMember | null>(
    null
  );
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRoles();
      form.resetFields();
      setSearchResults([]);
      setSelectedUser(null);
      setIsExistingUser(false);
    }
  }, [open, form]);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await Api.getRoles();
      setRoles(response.data.data);
    } catch (error) {
      message.open({
        type: "error",
        content: getErrorMessage(error),
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await Api.searchOrganizationMembers(query);
      setSearchResults(response.data.data);
    } catch (error: any) {
      console.error("Failed to search members:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => searchMembers(query), 300),
    []
  );

  const handleSearch = (value: string) => {
    // Check if it's an email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(value);

    if (isEmail) {
      // If it's a valid email, check if it matches any existing user
      const matchingUser = searchResults.find(
        (user) => user.email.toLowerCase() === value.toLowerCase()
      );
      if (matchingUser) {
        setSelectedUser(matchingUser);
        setIsExistingUser(true);
      } else {
        setSelectedUser(null);
        setIsExistingUser(false);
      }
    } else {
      // If not an email, search for users
      debouncedSearch(value);
      setSelectedUser(null);
      setIsExistingUser(false);
    }
  };

  const handleSelect = (value: string) => {
    const user = searchResults.find((u) => u.email === value);
    if (user) {
      setSelectedUser(user);
      setIsExistingUser(true);
      form.setFieldsValue({ email: user.email });
    }
  };

  const handleSubmit = async (values: { email: string; roleId: number }) => {
    setLoading(true);
    try {
      await Api.createInvitation({
        email: values.email,
        roleId: values.roleId,
        projectId,
      });

      message.open({
        type: "success",
        content: `Invitation sent to ${values.email}${
          projectName ? ` for ${projectName}` : ""
        }`,
      });
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      message.open({
        type: "error",
        content: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (roleName: string): string => {
    const descriptions: Record<string, string> = {
      owner: "Full access to all features and settings",
      admin: "Can manage users, projects, and most settings",
      member: "Standard access to assigned projects and tasks",
      viewer: "Read-only access to resources",
    };
    return descriptions[roleName] || "";
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          <span>
            {projectName ? `Invite to ${projectName}` : "Invite Member"}
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message={
          isExistingUser ? "In-App Notification" : "Send an Email Invitation"
        }
        description={
          isExistingUser
            ? `${
                selectedUser?.fullName || "This user"
              } is already a member of your organization. They will receive an in-app notification to join ${
                projectName ? "this project" : "the organization"
              }.`
            : projectName
            ? `The user will receive an email invitation to join this project. If they don't have an account, they'll be able to create one.`
            : `The user will receive an email invitation to join your organization. If they don't have an account, they'll be able to create one.`
        }
        type={isExistingUser ? "success" : "info"}
        showIcon
        icon={isExistingUser ? <TeamOutlined /> : <InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email Address or Name"
          rules={[
            { required: true, message: "Please enter an email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Start typing to search for existing members or enter a new email
              address
            </Text>
          }
        >
          <AutoComplete
            options={searchResults.map((user) => ({
              value: user.email,
              label: (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <UserOutlined />
                    <div>
                      <div>{user.fullName}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {user.email}
                      </Text>
                    </div>
                  </Space>
                  <Tag color="blue">{user.role.toUpperCase()}</Tag>
                </div>
              ),
            }))}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="Search by name or enter email..."
            notFoundContent={
              searchLoading ? (
                <div style={{ textAlign: "center", padding: "8px" }}>
                  Searching...
                </div>
              ) : null
            }
          >
            <Input prefix={<MailOutlined />} autoFocus />
          </AutoComplete>
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Role"
          rules={[{ required: true, message: "Please select a role" }]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              {form.getFieldValue("roleId") &&
                getRoleDescription(
                  roles.find((r) => r.id === form.getFieldValue("roleId"))
                    ?.name || ""
                )}
            </Text>
          }
        >
          <Select
            placeholder="Select a role"
            size="large"
            loading={loadingRoles}
            suffixIcon={<TeamOutlined />}
          >
            {roles.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                <Space>
                  <span style={{ textTransform: "capitalize" }}>
                    {role.name}
                  </span>
                  {role.name === "owner" && "👑"}
                  {role.name === "admin" && "⚙️"}
                  {role.name === "member" && "👤"}
                  {role.name === "viewer" && "👁️"}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserAddOutlined />}
            >
              Send Invitation
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
