import React, { useState } from "react";
import {
  Card,
  Table,
  Space,
  Button,
  Select,
  Typography,
  Tag,
  Progress,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;

export const ProjectBudgetReport: React.FC = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Filters
  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  // Fetch project budget data
  const {
    query: { data: reportData, isLoading },
  } = useList({
    resource: "reports/project-budget",
    filters: [
      ...(selectedProject
        ? [
            {
              field: "project_id",
              operator: "eq" as const,
              value: selectedProject,
            },
          ]
        : []),
    ],
  });

  // Fetch projects for filter
  const {
    query: { data: projectsData },
  } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  const projects = (reportData as any)?.data?.data || [];

  // Calculate overall statistics
  const totalBudget = projects.reduce(
    (sum: number, p: any) => sum + p.budget,
    0
  );
  const totalBudgetUsed = projects.reduce(
    (sum: number, p: any) => sum + p.budgetUsed,
    0
  );
  const totalBudgetRemaining = projects.reduce(
    (sum: number, p: any) => sum + p.budgetRemaining,
    0
  );
  const avgUtilization =
    projects.length > 0
      ? projects.reduce((sum: number, p: any) => sum + p.budgetUtilization, 0) /
        projects.length
      : 0;

  // Prepare chart data
  const chartData = projects.map((project: any) => ({
    name:
      project.name.length > 20
        ? project.name.substring(0, 20) + "..."
        : project.name,
    budget: project.budget,
    used: project.budgetUsed,
    remaining: project.budgetRemaining,
  }));

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Project",
      "Status",
      "Budget",
      "Budget Used",
      "Budget Remaining",
      "Utilization %",
      "Estimated Hours",
      "Actual Hours",
      "Billable Hours",
      "Hours Variance",
      "Completion %",
    ];
    const rows = projects.map((project: any) => [
      project.name,
      project.status,
      project.budget.toFixed(2),
      project.budgetUsed.toFixed(2),
      project.budgetRemaining.toFixed(2),
      project.budgetUtilization.toFixed(2),
      project.totalEstimatedHours.toFixed(2),
      project.totalActualHours.toFixed(2),
      project.totalBillableHours.toFixed(2),
      project.hoursVariance.toFixed(2),
      project.completionRate.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-budget-report-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "blue",
      active: "green",
      on_hold: "orange",
      completed: "purple",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  // Table columns
  const columns = [
    {
      title: "Project",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
      fixed: isMobile ? undefined : ("left" as any),
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a: any, b: any) => a.budget - b.budget,
    },
    {
      title: "Used",
      dataIndex: "budgetUsed",
      key: "budgetUsed",
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a: any, b: any) => a.budgetUsed - b.budgetUsed,
    },
    {
      title: "Remaining",
      dataIndex: "budgetRemaining",
      key: "budgetRemaining",
      render: (amount: number) => (
        <Text strong style={{ color: amount < 0 ? "#f5222d" : "#52c41a" }}>
          ${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a: any, b: any) => a.budgetRemaining - b.budgetRemaining,
      responsive: ["lg"] as any,
    },
    {
      title: "Utilization",
      dataIndex: "budgetUtilization",
      key: "budgetUtilization",
      render: (percent: number) => (
        <Progress
          percent={Math.min(percent, 100)}
          status={
            percent > 100 ? "exception" : percent > 80 ? "normal" : "active"
          }
          size="small"
        />
      ),
      sorter: (a: any, b: any) => a.budgetUtilization - b.budgetUtilization,
    },
    {
      title: "Hours (Est/Act)",
      key: "hours",
      render: (_: any, record: any) => (
        <Text>
          {record.totalEstimatedHours.toFixed(1)} /{" "}
          {record.totalActualHours.toFixed(1)}
        </Text>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Completion",
      dataIndex: "completionRate",
      key: "completionRate",
      render: (percent: number) => <Progress percent={percent} size="small" />,
      sorter: (a: any, b: any) => a.completionRate - b.completionRate,
      responsive: ["lg"] as any,
    },
  ];

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
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
        <Title level={isMobile ? 3 : 2}>Project Budget Report</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
          size={isMobile ? "middle" : "large"}
          block={isMobile}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: tokens.spacing[6] }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%", flexWrap: "wrap" }}
          size={isMobile ? "middle" : "large"}
        >
          <Select
            placeholder="All Projects"
            style={{ width: isMobile ? "100%" : 300 }}
            allowClear
            onChange={setSelectedProject}
            value={selectedProject}
            size={isMobile ? "middle" : "large"}
          >
            {(projectsData as any)?.data.map((project: any) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={totalBudget}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Budget Used"
              value={totalBudgetUsed}
              precision={2}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Budget Remaining"
              value={totalBudgetRemaining}
              precision={2}
              prefix={
                totalBudgetRemaining < 0 ? (
                  <WarningOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              valueStyle={{
                color: totalBudgetRemaining < 0 ? "#f5222d" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Utilization"
              value={avgUtilization}
              precision={2}
              suffix="%"
              valueStyle={{
                color: avgUtilization > 100 ? "#f5222d" : "#1890ff",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="Budget Overview by Project"
        style={{ marginBottom: tokens.spacing[6] }}
      >
        <RechartsResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#1890ff" name="Budget" />
            <Bar dataKey="used" fill="#faad14" name="Used" />
            <Bar dataKey="remaining" fill="#52c41a" name="Remaining" />
          </BarChart>
        </RechartsResponsiveContainer>
      </Card>

      {/* Projects Table */}
      <Card title="Project Budget Details">
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          scroll={{ x: isMobile ? 1400 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} projects`,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
