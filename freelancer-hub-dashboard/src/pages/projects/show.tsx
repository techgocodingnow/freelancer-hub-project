import React from "react";
import { useOne, useDelete, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Progress,
  Statistic,
  Row,
  Col,
  message,
  Modal,
  Spin,
  Typography,
  Table,
  Avatar,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { Title, Text } = Typography;
const { confirm } = Modal;

export const ProjectShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: deleteProject } = useDelete();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const {
    result: project,
    query: { isLoading },
  } = useOne({
    resource: "projects",
    id: id!,
  });

  const handleDelete = () => {
    confirm({
      title: "Are you sure you want to delete this project?",
      content:
        "This action cannot be undone. All tasks and time entries will be deleted.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        deleteProject(
          {
            resource: "projects",
            id: id!,
          },
          {
            onSuccess: () => {
              message.success("Project deleted successfully");
              go({ to: `/tenants/${tenantSlug}/projects`, type: "push" });
            },
            onError: (error: any) => {
              message.error(error?.message || "Failed to delete project");
            },
          }
        );
      },
    });
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (!project) {
    return (
      <ResponsiveContainer>
        <Card>
          <Text>Project not found</Text>
        </Card>
      </ResponsiveContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "blue";
      case "completed":
        return "green";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const taskStats = project.taskStats || {
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  };

  const progress =
    taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

  const memberColumns = [
    {
      title: "Name",
      dataIndex: ["user", "fullName"],
      key: "name",
      render: (text: string, record: any) => (
        <Space>
          <Avatar>{text?.charAt(0)?.toUpperCase()}</Avatar>
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag
          color={
            role === "owner" ? "gold" : role === "admin" ? "blue" : "default"
          }
        >
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "joinedAt",
      key: "joinedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const taskColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          todo: "default",
          in_progress: "blue",
          review: "orange",
          done: "green",
        };
        return (
          <Tag color={colors[status]}>
            {status.replace("_", " ").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: "default",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Assignee",
      dataIndex: ["assignee", "fullName"],
      key: "assignee",
      render: (name: string) =>
        name || <Text type="secondary">Unassigned</Text>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "-",
    },
  ];

  return (
    <ResponsiveContainer>
      <Card>
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "12px" : "0",
            }}
          >
            <div>
              <Title level={isMobile ? 3 : 2} style={{ marginBottom: 8 }}>
                {project.name}
              </Title>
              <Tag color={getStatusColor(project.status)}>
                {project.status.toUpperCase()}
              </Tag>
            </div>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${id}/edit`,
                    type: "push",
                  })
                }
                size={isMobile ? "middle" : "large"}
                block={isMobile}
              >
                Edit
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                size={isMobile ? "middle" : "large"}
                block={isMobile}
              >
                Delete
              </Button>
            </Space>
          </div>
        </div>

        <Row
          gutter={isMobile ? [12, 12] : isTablet ? [16, 16] : [24, 24]}
          style={{ marginBottom: isMobile ? 16 : 24 }}
        >
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tasks"
                value={taskStats.total}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={taskStats.done}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={taskStats.inProgress}
                valueStyle={{ color: "#1890ff" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card>
              <Statistic
                title="Team Members"
                value={project.projectMembers?.length || 0}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">Overall Progress</Text>
          <Progress
            percent={progress}
            status={progress === 100 ? "success" : "active"}
          />
        </div>

        <Tabs
          defaultActiveKey="overview"
          size={isMobile ? "small" : "middle"}
          items={[
            {
              key: "overview",
              label: "Overview",
              children: (
                <Descriptions bordered column={isMobile ? 1 : 2}>
                  <Descriptions.Item label="Description" span={2}>
                    {project.description || (
                      <Text type="secondary">No description</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(project.status)}>
                      {project.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Budget">
                    {project.budget ? (
                      <Space>
                        <DollarOutlined />
                        {project.budget.toLocaleString()}
                      </Space>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Date">
                    {project.startDate ? (
                      <Space>
                        <CalendarOutlined />
                        {new Date(project.startDate).toLocaleDateString()}
                      </Space>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="End Date">
                    {project.endDate ? (
                      <Space>
                        <CalendarOutlined />
                        {new Date(project.endDate).toLocaleDateString()}
                      </Space>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: "tasks",
              label: `Tasks (${taskStats.total})`,
              children: (
                <div>
                  <Space
                    style={{
                      marginBottom: 16,
                      width: isMobile ? "100%" : "auto",
                    }}
                    direction={isMobile ? "vertical" : "horizontal"}
                    wrap={!isMobile}
                  >
                    <Button
                      type="primary"
                      onClick={() =>
                        go({
                          to: `/tenants/${tenantSlug}/projects/${id}/tasks/create`,
                          type: "push",
                        })
                      }
                      block={isMobile}
                    >
                      Add Task
                    </Button>
                    <Button
                      onClick={() =>
                        go({
                          to: `/tenants/${tenantSlug}/projects/${id}/tasks`,
                          type: "push",
                        })
                      }
                      block={isMobile}
                    >
                      View All Tasks
                    </Button>
                    <Button
                      onClick={() =>
                        go({
                          to: `/tenants/${tenantSlug}/projects/${id}/tasks/kanban`,
                          type: "push",
                        })
                      }
                      block={isMobile}
                    >
                      Kanban Board
                    </Button>
                  </Space>
                  <Table
                    dataSource={project.tasks || []}
                    columns={taskColumns}
                    rowKey="id"
                    scroll={{ x: isMobile ? 800 : undefined }}
                    pagination={{
                      pageSize: 10,
                      simple: isMobile,
                      showSizeChanger: !isMobile,
                    }}
                  />
                </div>
              ),
            },
            {
              key: "members",
              label: `Team (${project.projectMembers?.length || 0})`,
              children: (
                <div>
                  <Button
                    type="primary"
                    style={{ marginBottom: 16 }}
                    block={isMobile}
                  >
                    Add Member
                  </Button>
                  <Table
                    dataSource={project.projectMembers || []}
                    columns={memberColumns}
                    rowKey="id"
                    scroll={{ x: isMobile ? 600 : undefined }}
                    pagination={{
                      pageSize: 10,
                      simple: isMobile,
                      showSizeChanger: !isMobile,
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </ResponsiveContainer>
  );
};
