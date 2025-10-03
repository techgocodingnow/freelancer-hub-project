import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  Spin,
  InputNumber,
  Alert,
} from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useTenant } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
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
const { RangePicker } = DatePicker;

export const PaymentsReport: React.FC = () => {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Filters
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [hourlyRate, setHourlyRate] = useState<number>(50); // Default hourly rate

  // Fetch time summary
  const {
    query: { data: timeSummaryData, isLoading },
  } = useList({
    resource: "reports/time-summary",
    filters: [
      {
        field: "start_date",
        operator: "eq",
        value: dateRange[0].format("YYYY-MM-DD"),
      },
      {
        field: "end_date",
        operator: "eq",
        value: dateRange[1].format("YYYY-MM-DD"),
      },
      ...(selectedUser
        ? [{ field: "user_id", operator: "eq" as const, value: selectedUser }]
        : []),
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

  // Fetch users for filter
  const {
    query: { data: usersData },
  } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  // Fetch projects for filter
  const {
    query: { data: projectsData },
  } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  const summaryData = (timeSummaryData as any)?.data || {};
  const byUser = summaryData.byUser || [];
  const byProject = summaryData.byProject || [];
  const totals = summaryData.totals || { totalHours: 0 };

  // Calculate payment amounts
  const paymentsByUser = useMemo(() => {
    return byUser.map((user: any) => ({
      ...user,
      billableAmount: user.totalHours * hourlyRate,
    }));
  }, [byUser, hourlyRate]);

  const paymentsByProject = useMemo(() => {
    return byProject.map((project: any) => ({
      ...project,
      billableAmount: project.totalHours * hourlyRate,
    }));
  }, [byProject, hourlyRate]);

  const totalBillableAmount = totals.totalHours * hourlyRate;

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["User", "Total Hours", "Hourly Rate", "Amount Due"];
    const rows = paymentsByUser.map((user: any) => [
      user.userName,
      user.totalHours.toFixed(2),
      hourlyRate.toFixed(2),
      user.billableAmount.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-report-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // User payments table columns
  const userColumns = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {!isMobile && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.userEmail}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (hours: number) => `${hours.toFixed(2)}h`,
      sorter: (a: any, b: any) => a.totalHours - b.totalHours,
    },
    {
      title: "Entries",
      dataIndex: "entryCount",
      key: "entryCount",
      responsive: ["md"] as any,
    },
    {
      title: "Rate",
      key: "rate",
      render: () => `$${hourlyRate.toFixed(2)}/h`,
      responsive: ["lg"] as any,
    },
    {
      title: "Amount Due",
      dataIndex: "billableAmount",
      key: "billableAmount",
      render: (amount: number) => (
        <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
          ${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a: any, b: any) => a.billableAmount - b.billableAmount,
    },
  ];

  // Project payments table columns
  const projectColumns = [
    {
      title: "Project",
      dataIndex: "projectName",
      key: "projectName",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (hours: number) => `${hours.toFixed(2)}h`,
      sorter: (a: any, b: any) => a.totalHours - b.totalHours,
    },
    {
      title: "Entries",
      dataIndex: "entryCount",
      key: "entryCount",
      responsive: ["md"] as any,
    },
    {
      title: "Amount",
      dataIndex: "billableAmount",
      key: "billableAmount",
      render: (amount: number) => (
        <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
          ${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a: any, b: any) => a.billableAmount - b.billableAmount,
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
        <Title level={isMobile ? 3 : 2}>Payments Report</Title>
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

      {/* Info Alert */}
      <Alert
        message="Payment Calculation"
        description="This report calculates payments based on tracked billable hours and the hourly rate you set below. Actual invoicing and payment tracking features are coming soon."
        type="info"
        showIcon
        style={{ marginBottom: tokens.spacing[6] }}
      />

      {/* Filters */}
      <Card style={{ marginBottom: tokens.spacing[6] }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%", flexWrap: "wrap" }}
          size={isMobile ? "middle" : "large"}
        >
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            style={{ width: isMobile ? "100%" : "auto" }}
            size={isMobile ? "middle" : "large"}
          />
          <Select
            placeholder="All Users"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedUser}
            value={selectedUser}
            size={isMobile ? "middle" : "large"}
          >
            {((usersData as any)?.data || []).map((user: any) => (
              <Select.Option key={user.id} value={user.id}>
                {user.fullName}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="All Projects"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedProject}
            value={selectedProject}
            size={isMobile ? "middle" : "large"}
          >
            {projectsData?.data.map((project: any) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
          <div>
            <Text strong style={{ marginRight: "8px" }}>
              Hourly Rate:
            </Text>
            <InputNumber
              value={hourlyRate}
              onChange={(value) => setHourlyRate(value || 50)}
              min={0}
              step={5}
              prefix="$"
              suffix="/h"
              style={{ width: isMobile ? "100%" : 150 }}
              size={isMobile ? "middle" : "large"}
            />
          </div>
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Amount Due"
              value={totalBillableAmount}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Billable Hours"
              value={totals.totalHours}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Hourly Rate"
              value={hourlyRate}
              precision={2}
              prefix="$"
              suffix="/h"
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="Payments by Team Member"
        style={{ marginBottom: tokens.spacing[6] }}
      >
        <RechartsResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={paymentsByUser}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userName" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="billableAmount" fill="#52c41a" name="Amount Due" />
          </BarChart>
        </RechartsResponsiveContainer>
      </Card>

      {/* Payments by User Table */}
      <Card
        title="Payments by Team Member"
        style={{ marginBottom: tokens.spacing[6] }}
      >
        <Table
          dataSource={paymentsByUser}
          columns={userColumns}
          rowKey="userId"
          scroll={{ x: isMobile ? 800 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
          }}
        />
      </Card>

      {/* Payments by Project Table */}
      <Card title="Payments by Project">
        <Table
          dataSource={paymentsByProject}
          columns={projectColumns}
          rowKey="projectId"
          scroll={{ x: isMobile ? 600 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
