import React, { useState } from "react";
import {
  Table,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  Card,
  Empty,
  Alert,
  Modal,
  message,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  CrownOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Api } from "../../services/api";
import type { TenantUser, RoleName } from "../../services/api/types";
import { useGetIdentity } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { Title } = Typography;
const { confirm } = Modal;

export const UserList: React.FC = () => {
  const { data: identity } = useGetIdentity();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const isMobile = useIsMobile();

  const isAdmin = identity?.role === "admin" || identity?.role === "owner";

  const fetchUsers = async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.getUsers({
        page,
        limit,
        search: searchText,
        role: roleFilter,
      });

      setUsers(response.data.data);
      setPagination({
        current: response.data.meta.currentPage,
        pageSize: response.data.meta.perPage,
        total: response.data.meta.total,
      });
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, roleFilter]);

  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const handleRoleChange = (userId: number, newRole: RoleName) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    confirm({
      title: "Change User Role",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to change ${
        user.fullName || user.email
      }'s role to ${newRole}?`,
      okText: "Yes",
      okType: "primary",
      cancelText: "No",
      onOk: async () => {
        try {
          await Api.updateUserRole(userId, { role: newRole });
          message.success("User role updated successfully");
          fetchUsers(pagination.current, pagination.pageSize);
        } catch (err: any) {
          message.error(
            err?.response?.data?.error || "Failed to update user role"
          );
        }
      },
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string | null) => (
        <Space>
          <UserOutlined />
          <span>{text || "N/A"}</span>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: RoleName) => {
        const roleConfig = {
          owner: { icon: <CrownOutlined />, color: "gold" },
          admin: { icon: <CrownOutlined />, color: "blue" },
          member: { icon: <TeamOutlined />, color: "green" },
          viewer: { icon: <UserOutlined />, color: "default" },
        };
        const config = roleConfig[role] || roleConfig.member;
        return (
          <Tag icon={config.icon} color={config.color}>
            {role.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TenantUser) => {
        // Don't show actions if not admin or if it's the current user
        if (!isAdmin || record.id === identity?.id) {
          return null;
        }

        return (
          <Select
            value={record.role}
            onChange={(value) => handleRoleChange(record.id, value)}
            style={{ width: 120 }}
          >
            <Select.Option value="viewer">Viewer</Select.Option>
            <Select.Option value="member">Member</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="owner">Owner</Select.Option>
          </Select>
        );
      },
    },
  ];

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isMobile ? "16px" : "24px",
        }}
      >
        <Title level={isMobile ? 3 : 2}>
          <TeamOutlined /> Users
        </Title>
      </div>

      {!isAdmin && (
        <Alert
          message="View Only"
          description="You need admin privileges to manage user roles."
          type="info"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: "16px" }}
        />
      )}

      <Card>
        <Space
          style={{ marginBottom: "16px", width: "100%" }}
          direction="vertical"
        >
          <Space wrap style={{ width: "100%" }}>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: isMobile ? "100%" : 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: isMobile ? "100%" : 150 }}
              allowClear
            >
              <Select.Option value="owner">Owner</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Space>
        </Space>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: isMobile ? 800 : undefined }}
          pagination={{
            ...pagination,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} users`,
            pageSizeOptions: ["10", "20", "50", "100"],
            simple: isMobile,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                description={
                  searchText || roleFilter
                    ? "No users found matching your filters"
                    : "No users in this tenant"
                }
              />
            ),
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
