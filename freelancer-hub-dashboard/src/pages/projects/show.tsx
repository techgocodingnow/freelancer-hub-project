import React, { useState, useEffect } from "react";
import { useOne, useDelete, useGo, useGetIdentity } from "@refinedev/core";
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
  Tooltip,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserAddOutlined,
  UserOutlined,
  MailOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { InviteMemberModal } from "../../components/invitations";
import { ProjectMemberModal } from "../../components/projects";
import { Api } from "../../services/api";
import type { Invitation, ProjectMember } from "../../services/api/types";
import { getErrorMessage } from "../../utils/error";

const { Title, Text } = Typography;
const { confirm } = Modal;

export const ProjectShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: deleteProject } = useDelete();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { data: identity } = useGetIdentity();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | undefined>();
  const [projectInvitations, setProjectInvitations] = useState<Invitation[]>(
    []
  );

  const {
    result: project,
    query: { isLoading },
  } = useOne({
    resource: "projects",
    id: id!,
  });

  const isAdmin = identity?.role === "admin" || identity?.role === "owner";

  useEffect(() => {
    if (id && isAdmin) {
      fetchProjectInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  const fetchProjectInvitations = async () => {
    if (!id) return;

    try {
      const response = await Api.getInvitations({
        status: "pending",
        project_id: parseInt(id),
      });
      setProjectInvitations(response.data.data);
    } catch (err) {
      console.error("Failed to fetch project invitations:", err);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      await Api.resendInvitation(invitation.id);
      message.open({
        type: "success",
        content: `Invitation resent to ${invitation.email}`,
      });
      fetchProjectInvitations();
    } catch (err) {
      message.open({
        type: "error",
        content: getErrorMessage(err),
      });
    }
  };

  const handleCancelInvitation = (invitation: Invitation) => {
    confirm({
      title: "Cancel Invitation",
      content: `Are you sure you want to cancel the invitation for ${invitation.email}?`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await Api.cancelInvitation(invitation.id);
          message.open({
            type: "success",
            content: "Invitation cancelled",
          });
          fetchProjectInvitations();
        } catch (err) {
          message.open({
            type: "error",
            content: getErrorMessage(err),
          });
        }
      },
    });
  };

  const handleInviteSuccess = () => {
    fetchProjectInvitations();
  };

  const handleEditMember = (member: ProjectMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleMemberModalClose = () => {
    setShowMemberModal(false);
    setSelectedMember(undefined);
  };

  const handleMemberModalSuccess = () => {
    // Refetch project data to show updated member
    window.location.reload();
  };

  const handleRemoveMember = (member: ProjectMember) => {
    confirm({
      title: "Remove Team Member",
      content: `Are you sure you want to remove ${member.user?.fullName} from this project?`,
      okText: "Yes, Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!id) return;
        try {
          await Api.removeProjectMember(parseInt(id), member.userId);
          message.success("Team member removed successfully");
          // Refetch project data
          window.location.reload();
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      },
    });
  };

  const handleUpdateMemberRate = async (
    memberId: number,
    rate: number | null
  ) => {
    if (!id) return;

    try {
      await Api.updateProjectMemberRate(parseInt(id), memberId, {
        hourlyRate: rate,
      });
      message.success("Member hourly rate updated");
      // Refetch project data to show updated rate
      window.location.reload();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

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
              go({ to: `/tenants/${tenantSlug}/projects`, type: "push" });
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

  const memberColumns: any[] = [
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
      title: "Position",
      dataIndex: "position",
      key: "position",
      render: (position: string | null) => (
        position ? (
          <Text>{position}</Text>
        ) : (
          <Text type="secondary" italic>Not set</Text>
        )
      ),
    },
    {
      title: "Joined",
      dataIndex: "joinedAt",
      key: "joinedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Hourly Rate",
      key: "hourlyRate",
      render: (_: any, record: any) => {
        const projectRate = record.hourlyRate;
        const defaultRate = record.user?.hourlyRate;
        const effectiveRate = projectRate ?? defaultRate;

        return (
          <Space direction="vertical" size={0}>
            {effectiveRate ? (
              <Text>${effectiveRate}/hr</Text>
            ) : (
              <Text type="secondary">Not set</Text>
            )}
            {projectRate && defaultRate && projectRate !== defaultRate && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Override (default: ${defaultRate})
              </Text>
            )}
            {!projectRate && defaultRate && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Using default rate
              </Text>
            )}
          </Space>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            title: "Actions",
            key: "actions",
            width: isMobile ? 80 : 120,
            render: (_: any, record: ProjectMember) => (
              <Space size="small">
                <Tooltip title="Edit member">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditMember(record)}
                  />
                </Tooltip>
                <Tooltip title="Remove member">
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveMember(record)}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]
      : []),
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
                  {project.customer && (
                    <Descriptions.Item label="Customer" span={2}>
                      <Space>
                        <UserOutlined />
                        <Text strong>{project.customer.name}</Text>
                        {project.customer.company && (
                          <Text type="secondary">({project.customer.company})</Text>
                        )}
                      </Space>
                    </Descriptions.Item>
                  )}
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
                  {isAdmin && (
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      style={{ marginBottom: 16 }}
                      block={isMobile}
                      onClick={() => setShowInviteModal(true)}
                    >
                      Invite Member
                    </Button>
                  )}

                  {/* Pending Invitations */}
                  {isAdmin && projectInvitations.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Typography.Title level={5}>
                        <MailOutlined /> Pending Invitations (
                        {projectInvitations.length})
                      </Typography.Title>
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="small"
                      >
                        {projectInvitations.map((invitation) => (
                          <Card
                            key={invitation.id}
                            size="small"
                            style={{ backgroundColor: "#fafafa" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              <Space>
                                <MailOutlined />
                                <Typography.Text strong>
                                  {invitation.email}
                                </Typography.Text>
                                <Tag
                                  icon={<ClockCircleOutlined />}
                                  color="orange"
                                >
                                  Pending
                                </Tag>
                                {invitation.role && (
                                  <Tag color="blue">
                                    {invitation.role.name.toUpperCase()}
                                  </Tag>
                                )}
                              </Space>
                              <Space>
                                <Tooltip title="Resend invitation">
                                  <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() =>
                                      handleResendInvitation(invitation)
                                    }
                                  >
                                    Resend
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Cancel invitation">
                                  <Button
                                    size="small"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() =>
                                      handleCancelInvitation(invitation)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </Tooltip>
                              </Space>
                            </div>
                            <Typography.Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                              }}
                            >
                              Invited by{" "}
                              {invitation.inviter?.fullName || "Unknown"} •
                              Expires{" "}
                              {new Date(
                                invitation.expiresAt
                              ).toLocaleDateString()}
                            </Typography.Text>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  )}

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

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        projectId={id ? parseInt(id) : undefined}
        projectName={project?.name}
      />

      {/* Edit Member Modal */}
      <ProjectMemberModal
        open={showMemberModal}
        onClose={handleMemberModalClose}
        onSuccess={handleMemberModalSuccess}
        projectId={id ? parseInt(id) : 0}
        member={selectedMember}
        isEditMode={true}
      />
    </ResponsiveContainer>
  );
};
