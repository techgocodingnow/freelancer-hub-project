import React from "react";
import { useGo, useList } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Tag,
  Progress,
  Button,
  Space,
  Typography,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { Title, Text } = Typography;

interface Project {
  id: number;
  name: string;
  description: string;
  status: "active" | "archived" | "completed";
  startDate: string;
  endDate: string;
  budget: number;
  tasks: Array<{ status: string }>;
  members: Array<any>;
}

export const ProjectList: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const {
    result,
    query: { isLoading },
  } = useList<Project>({
    resource: "projects",
    pagination: {
      pageSize: 100,
    },
  });

  const projects = result?.data || [];

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

  const calculateProgress = (tasks: Array<{ status: string }>) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "done").length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: isMobile ? "16px" : "24px",
          gap: isMobile ? "12px" : "0",
        }}
      >
        <Title level={isMobile ? 3 : 2}>
          <ProjectOutlined /> Projects
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            go({ to: `/tenants/${tenantSlug}/projects/create`, type: "push" })
          }
          size={isMobile ? "middle" : "large"}
          block={isMobile}
        >
          {isMobile ? "New" : "New Project"}
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Row gutter={isMobile ? [12, 12] : isTablet ? [16, 16] : [24, 24]}>
          {projects.map((project) => {
            const progress = calculateProgress(project.tasks);
            const totalTasks = project.tasks?.length || 0;
            const completedTasks =
              project.tasks?.filter((t) => t.status === "done").length || 0;

            const totalMembers = project.members?.length || 0;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                <Card
                  hoverable
                  onClick={() =>
                    go({
                      to: `/tenants/${tenantSlug}/projects/${project.id}/show`,
                      type: "push",
                    })
                  }
                  style={{ height: "100%" }}
                  actions={[
                    <Button
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        go({
                          to: `/tenants/${tenantSlug}/projects/${project.id}/edit`,
                          type: "push",
                        });
                      }}
                    >
                      Edit
                    </Button>,
                    <Button
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        go({
                          to: `/tenants/${tenantSlug}/projects/${project.id}/show`,
                          type: "push",
                        });
                      }}
                    >
                      View Details
                    </Button>,
                  ]}
                >
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <div>
                      <Title level={4} style={{ marginBottom: 8 }}>
                        {project.name}
                      </Title>
                      <Tag color={getStatusColor(project.status)}>
                        {project.status.toUpperCase()}
                      </Tag>
                    </div>

                    <Text type="secondary" ellipsis>
                      {project.description || "No description"}
                    </Text>

                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Progress
                      </Text>
                      <Progress percent={progress} size="small" />
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Tasks"
                          value={totalTasks}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ fontSize: 16 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Completed"
                          value={completedTasks}
                          valueStyle={{ fontSize: 16, color: "#52c41a" }}
                        />
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Space>
                          <TeamOutlined />
                          <Text type="secondary">
                            {totalMembers}{" "}
                            {totalMembers === 1 ? "member" : "members"}
                          </Text>
                        </Space>
                      </Col>
                      {project.budget && (
                        <Col span={12}>
                          <Text type="secondary">
                            ${project.budget.toLocaleString()}
                          </Text>
                        </Col>
                      )}
                    </Row>

                    <div>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Due:{" "}
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {!isLoading && projects.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <ProjectOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              No projects yet
            </Title>
            <Text type="secondary">
              Create your first project to get started
            </Text>
            <br />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                go({
                  to: `/tenants/${tenantSlug}/projects/create`,
                  type: "push",
                })
              }
              style={{ marginTop: 16 }}
            >
              Create Project
            </Button>
          </div>
        </Card>
      )}
    </ResponsiveContainer>
  );
};
