import React, { useState } from "react";
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
} from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ["#52c41a", "#1890ff", "#faad14", "#f5222d", "#722ed1"];

export const InvoicesPaymentsReport: React.FC = () => {
  const isMobile = useIsMobile();

  // Filters
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  // Fetch invoices and payments data
  const {
    query: { data: reportData, isLoading },
  } = useList({
    resource: "reports/invoices-payments",
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
      ...(selectedStatus
        ? [{ field: "status", operator: "eq" as const, value: selectedStatus }]
        : []),
    ],
  });

  // Fetch users for filter
  const { result: usersData } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  // Fetch projects for filter
  const { result: projectsData } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  const invoices = reportData?.data || [];
  const summary = reportData?.summary || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    paidCount: 0,
    sentCount: 0,
    overdueCount: 0,
    draftCount: 0,
    totalCount: 0,
  };

  // Prepare chart data
  const statusData = [
    { name: "Paid", value: summary.paidCount, color: "#52c41a" },
    { name: "Sent", value: summary.sentCount, color: "#1890ff" },
    { name: "Overdue", value: summary.overdueCount, color: "#f5222d" },
    { name: "Draft", value: summary.draftCount, color: "#d9d9d9" },
  ].filter((item) => item.value > 0);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Invoice Number",
      "User",
      "Project",
      "Issue Date",
      "Due Date",
      "Status",
      "Total Amount",
      "Amount Paid",
      "Outstanding",
    ];
    const rows = invoices.map((invoice: any) => [
      invoice.invoiceNumber,
      invoice.user?.fullName || "",
      invoice.project?.name || "N/A",
      dayjs(invoice.issueDate).format("YYYY-MM-DD"),
      dayjs(invoice.dueDate).format("YYYY-MM-DD"),
      invoice.status,
      invoice.totalAmount.toFixed(2),
      invoice.amountPaid.toFixed(2),
      (invoice.totalAmount - invoice.amountPaid).toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-payments-report-${dayjs().format(
      "YYYY-MM-DD"
    )}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "green",
      sent: "blue",
      overdue: "red",
      draft: "default",
      cancelled: "gray",
    };
    return colors[status] || "default";
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "User",
      dataIndex: ["user", "fullName"],
      key: "user",
      responsive: ["md"] as any,
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      responsive: ["lg"] as any,
      render: (name: string) => name || "N/A",
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      responsive: ["md"] as any,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      responsive: ["lg"] as any,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a: any, b: any) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (amount: number) => `$${amount.toFixed(2)}`,
      responsive: ["md"] as any,
    },
    {
      title: "Outstanding",
      key: "outstanding",
      render: (_: any, record: any) => {
        const outstanding = record.totalAmount - record.amountPaid;
        return (
          <Text
            strong
            style={{ color: outstanding > 0 ? "#f5222d" : "#52c41a" }}
          >
            ${outstanding.toFixed(2)}
          </Text>
        );
      },
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
        <Title level={isMobile ? 3 : 2}>Invoices & Payments Report</Title>
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
            placeholder="All Users"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedUser}
            value={selectedUser}
            size={isMobile ? "middle" : "large"}
          >
            {usersData?.data.map((user: any) => (
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
          <Select
            placeholder="All Statuses"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedStatus}
            value={selectedStatus}
            size={isMobile ? "middle" : "large"}
          >
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="sent">Sent</Select.Option>
            <Select.Option value="paid">Paid</Select.Option>
            <Select.Option value="overdue">Overdue</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoiced"
              value={summary.totalInvoiced}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Paid"
              value={summary.totalPaid}
              precision={2}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Outstanding"
              value={summary.totalOutstanding}
              precision={2}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={summary.totalCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="Invoice Status Distribution"
        style={{ marginBottom: tokens.spacing[6] }}
      >
        <RechartsResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={isMobile ? 60 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </RechartsResponsiveContainer>
      </Card>

      {/* Invoices Table */}
      <Card title="Invoices">
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          scroll={{ x: isMobile ? 1200 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} invoices`,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
