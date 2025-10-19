import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Spin,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import { tokens } from "../../theme/tokens";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;

export const FinancialDashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams();

  // Fetch invoices
  const {
    query: { data: invoicesData, isLoading: invoicesLoading },
  } = useList({
    resource: "invoices",
    pagination: { pageSize: 100 },
  });

  // Fetch payments
  const {
    query: { data: paymentsData, isLoading: paymentsLoading },
  } = useList({
    resource: "payments",
    pagination: { pageSize: 100 },
  });

  // Fetch payroll batches
  const {
    query: { data: batchesData, isLoading: batchesLoading },
  } = useList({
    resource: "payroll/batches",
    pagination: { pageSize: 50 },
  });

  const invoices = (invoicesData as any)?.data || [];
  const payments = (paymentsData as any)?.data || [];
  const batches = (batchesData as any)?.data || [];

  const isLoading = invoicesLoading || paymentsLoading || batchesLoading;

  // Calculate statistics
  const totalInvoiced = invoices.reduce(
    (sum: number, inv: any) => sum + inv.totalAmount,
    0
  );
  const totalPaid = invoices.reduce(
    (sum: number, inv: any) => sum + inv.amountPaid,
    0
  );
  const totalOutstanding = totalInvoiced - totalPaid;
  const overdueInvoices = invoices.filter(
    (inv: any) =>
      inv.status === "overdue" ||
      (dayjs(inv.dueDate).isBefore(dayjs()) && inv.status === "sent")
  );
  const totalOverdue = overdueInvoices.reduce(
    (sum: number, inv: any) => sum + (inv.totalAmount - inv.amountPaid),
    0
  );

  const totalPayments = payments.reduce(
    (sum: number, pay: any) => sum + pay.amount,
    0
  );
  const completedPayments = payments.filter(
    (p: any) => p.status === "completed"
  );
  const pendingPayments = payments.filter((p: any) => p.status === "pending");

  // Invoice status distribution
  const invoiceStatusData = [
    {
      name: "Draft",
      value: invoices.filter((i: any) => i.status === "draft").length,
      color: "#8c8c8c",
    },
    {
      name: "Sent",
      value: invoices.filter((i: any) => i.status === "sent").length,
      color: "#1890ff",
    },
    {
      name: "Paid",
      value: invoices.filter((i: any) => i.status === "paid").length,
      color: "#52c41a",
    },
    { name: "Overdue", value: overdueInvoices.length, color: "#ff4d4f" },
  ].filter((item) => item.value > 0);

  // Monthly revenue (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = dayjs().subtract(i, "month");
    const monthInvoices = invoices.filter((inv: any) =>
      dayjs(inv.issueDate).isSame(month, "month")
    );
    const monthPayments = payments.filter(
      (pay: any) =>
        dayjs(pay.paymentDate).isSame(month, "month") &&
        pay.status === "completed"
    );

    monthlyData.push({
      month: month.format("MMM"),
      invoiced: monthInvoices.reduce(
        (sum: number, inv: any) => sum + inv.totalAmount,
        0
      ),
      paid: monthPayments.reduce(
        (sum: number, pay: any) => sum + pay.amount,
        0
      ),
    });
  }

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort(
      (a: any, b: any) => dayjs(b.issueDate).unix() - dayjs(a.issueDate).unix()
    )
    .slice(0, 5);

  // Recent payments
  const recentPayments = [...payments]
    .sort(
      (a: any, b: any) =>
        dayjs(b.paymentDate).unix() - dayjs(a.paymentDate).unix()
    )
    .slice(0, 5);

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
      <Title
        level={isMobile ? 3 : 2}
        style={{ marginBottom: isMobile ? "16px" : "24px" }}
      >
        Financial Dashboard
      </Title>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoiced"
              value={totalInvoiced}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: tokens.colors.semantic.success }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {invoices.length} invoices
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Paid"
              value={totalPaid}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: tokens.colors.semantic.success }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {completedPayments.length} payments
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Outstanding"
              value={totalOutstanding}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: tokens.colors.semantic.warning }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {invoices.filter((i: any) => i.status === "sent").length} unpaid
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={totalOverdue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: tokens.colors.semantic.error }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {overdueInvoices.length} invoices
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Trend (Last 6 Months)">
            <RechartsResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar
                  dataKey="invoiced"
                  fill={tokens.colors.primary.main}
                  name="Invoiced"
                />
                <Bar
                  dataKey="paid"
                  fill={tokens.colors.semantic.success}
                  name="Paid"
                />
              </BarChart>
            </RechartsResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Invoice Status Distribution">
            <RechartsResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </RechartsResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <FileTextOutlined
                style={{ fontSize: "32px", color: tokens.colors.primary.main }}
              />
              <Title level={4}>Invoices</Title>
              <Text type="secondary">Manage and track invoices</Text>
              <Button
                type="primary"
                block
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/tenants/${slug}/financials/invoices`)}
              >
                View Invoices
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <CreditCardOutlined
                style={{
                  fontSize: "32px",
                  color: tokens.colors.semantic.success,
                }}
              />
              <Title level={4}>Payments</Title>
              <Text type="secondary">Track payment history</Text>
              <Button
                type="primary"
                block
                icon={<ArrowRightOutlined />}
                onClick={() =>
                  navigate(`/tenants/${slug}/financials/payments/history`)
                }
              >
                View Payments
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <TeamOutlined
                style={{ fontSize: "32px", color: tokens.colors.semantic.info }}
              />
              <Title level={4}>Payroll</Title>
              <Text type="secondary">Manage team payroll</Text>
              <Button
                type="primary"
                block
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/tenants/${slug}/financials/payroll`)}
              >
                View Payroll
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Recent Invoices"
            extra={
              <Button
                type="link"
                onClick={() => navigate(`/tenants/${slug}/financials/invoices`)}
              >
                View All
              </Button>
            }
          >
            <Table
              dataSource={recentInvoices}
              columns={[
                {
                  title: "Invoice #",
                  dataIndex: "invoiceNumber",
                  key: "invoiceNumber",
                  render: (text: string) => <Text strong>{text}</Text>,
                },
                {
                  title: "Amount",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  render: (amount: number) => (
                    <Text style={{ color: tokens.colors.semantic.success }}>
                      ${amount.toFixed(2)}
                    </Text>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      draft: "default",
                      sent: "blue",
                      paid: "green",
                      overdue: "red",
                    };
                    return (
                      <Tag color={colors[status]}>{status.toUpperCase()}</Tag>
                    );
                  },
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Recent Payments"
            extra={
              <Button
                type="link"
                onClick={() =>
                  navigate(`/tenants/${slug}/financials/payments/history`)
                }
              >
                View All
              </Button>
            }
          >
            <Table
              dataSource={recentPayments}
              columns={[
                {
                  title: "Payment #",
                  dataIndex: "paymentNumber",
                  key: "paymentNumber",
                  render: (text: string) => <Text strong>{text}</Text>,
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  key: "amount",
                  render: (amount: number) => (
                    <Text style={{ color: tokens.colors.semantic.success }}>
                      ${amount.toFixed(2)}
                    </Text>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      pending: "orange",
                      processing: "blue",
                      completed: "green",
                      failed: "red",
                    };
                    return (
                      <Tag color={colors[status]}>{status.toUpperCase()}</Tag>
                    );
                  },
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </ResponsiveContainer>
  );
};
