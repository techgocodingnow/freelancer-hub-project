import React, { useState } from "react";
import {
  Card,
  Table,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Progress,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  DownloadOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
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

export const TeamUtilizationReport: React.FC = () => {
  const isMobile = useIsMobile();

  // Filters
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();

  // Fetch team utilization data
  const {
    query: { data: reportData, isLoading },
  } = useList({
    resource: "reports/team-utilization",
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
    ],
  });

  // Fetch users for filter
  const {
    query: { data: usersData },
  } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  const teamData = (reportData as any)?.data?.data || [];

  // Calculate overall statistics
  const totalHours = teamData.reduce(
    (sum: number, u: any) => sum + u.totalHours,
    0
  );
  const totalBillableHours = teamData.reduce(
    (sum: number, u: any) => sum + u.billableHours,
    0
  );
  const avgUtilization =
    teamData.length > 0
      ? teamData.reduce((sum: number, u: any) => sum + u.utilizationRate, 0) /
        teamData.length
      : 0;
  const avgHoursPerDay =
    teamData.length > 0
      ? teamData.reduce((sum: number, u: any) => sum + u.avgHoursPerDay, 0) /
        teamData.length
      : 0;

  // Prepare chart data
  const chartData = teamData.map((user: any) => ({
    name: user.userName || user.userEmail,
    billable: user.billableHours,
    nonBillable: user.nonBillableHours,
    utilization: user.utilizationRate,
  }));

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "User",
      "Email",
      "Total Hours",
      "Billable Hours",
      "Non-Billable Hours",
      "Days Worked",
      "Avg Hours/Day",
      "Utilization %",
      "Entries",
    ];
    const rows = teamData.map((user: any) => [
      user.userName,
      user.userEmail,
      user.totalHours.toFixed(2),
      user.billableHours.toFixed(2),
      user.nonBillableHours.toFixed(2),
      user.daysWorked,
      user.avgHoursPerDay.toFixed(2),
      user.utilizationRate.toFixed(2),
      user.entryCount,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-utilization-report-${dayjs().format(
      "YYYY-MM-DD"
    )}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.userEmail}
          </Text>
        </div>
      ),
      fixed: isMobile ? undefined : ("left" as any),
      width: 200,
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (hours: number) => <Text strong>{hours.toFixed(2)}</Text>,
      sorter: (a: any, b: any) => a.totalHours - b.totalHours,
    },
    {
      title: "Billable",
      dataIndex: "billableHours",
      key: "billableHours",
      render: (hours: number) => (
        <Text style={{ color: "#52c41a" }}>{hours.toFixed(2)}</Text>
      ),
      sorter: (a: any, b: any) => a.billableHours - b.billableHours,
      responsive: ["md"] as any,
    },
    {
      title: "Non-Billable",
      dataIndex: "nonBillableHours",
      key: "nonBillableHours",
      render: (hours: number) => (
        <Text style={{ color: "#faad14" }}>{hours.toFixed(2)}</Text>
      ),
      sorter: (a: any, b: any) => a.nonBillableHours - b.nonBillableHours,
      responsive: ["md"] as any,
    },
    {
      title: "Days Worked",
      dataIndex: "daysWorked",
      key: "daysWorked",
      sorter: (a: any, b: any) => a.daysWorked - b.daysWorked,
      responsive: ["lg"] as any,
    },
    {
      title: "Avg Hours/Day",
      dataIndex: "avgHoursPerDay",
      key: "avgHoursPerDay",
      render: (hours: number) => hours.toFixed(2),
      sorter: (a: any, b: any) => a.avgHoursPerDay - b.avgHoursPerDay,
      responsive: ["lg"] as any,
    },
    {
      title: "Utilization",
      dataIndex: "utilizationRate",
      key: "utilizationRate",
      render: (percent: number) => (
        <Progress
          percent={Math.min(percent, 100)}
          status={
            percent < 50 ? "exception" : percent < 75 ? "normal" : "success"
          }
          size="small"
        />
      ),
      sorter: (a: any, b: any) => a.utilizationRate - b.utilizationRate,
    },
    {
      title: "Entries",
      dataIndex: "entryCount",
      key: "entryCount",
      sorter: (a: any, b: any) => a.entryCount - b.entryCount,
      responsive: ["md"] as any,
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
        <Title level={isMobile ? 3 : 2}>Team Utilization Report</Title>
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
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            style={{ width: isMobile ? "100%" : "auto" }}
            size={isMobile ? "middle" : "large"}
          />
          <Select
            placeholder="All Team Members"
            style={{ width: isMobile ? "100%" : 250 }}
            allowClear
            onChange={setSelectedUser}
            value={selectedUser}
            size={isMobile ? "middle" : "large"}
          >
            {(usersData as any)?.data?.data.map((user: any) => (
              <Select.Option key={user.id} value={user.id}>
                {user.fullName}
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
              title="Total Hours"
              value={totalHours}
              precision={2}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Billable Hours"
              value={totalBillableHours}
              precision={2}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
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
              prefix={<RiseOutlined />}
              valueStyle={{
                color: avgUtilization < 50 ? "#f5222d" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Hours/Day"
              value={avgHoursPerDay}
              precision={2}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="Hours Breakdown by Team Member"
        style={{ marginBottom: tokens.spacing[6] }}
      >
        <RechartsResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="billable"
              fill="#52c41a"
              name="Billable Hours"
              stackId="a"
            />
            <Bar
              dataKey="nonBillable"
              fill="#faad14"
              name="Non-Billable Hours"
              stackId="a"
            />
          </BarChart>
        </RechartsResponsiveContainer>
      </Card>

      {/* Team Table */}
      <Card title="Team Member Details">
        <Table
          dataSource={teamData}
          columns={columns}
          rowKey="userId"
          scroll={{ x: isMobile ? 1200 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} team members`,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
