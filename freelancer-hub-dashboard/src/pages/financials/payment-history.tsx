import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  DatePicker,
  Select,
  Typography,
  Input,
  Row,
  Col,
  Descriptions,
  Spin,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const PaymentHistory: React.FC = () => {
  const isMobile = useIsMobile();

  // State
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [methodFilter, setMethodFilter] = useState<string | undefined>(
    undefined
  );

  // Build filters
  const filters: any[] = [];
  if (dateRange) {
    filters.push({
      field: "payment_date_start",
      operator: "eq",
      value: dateRange[0].format("YYYY-MM-DD"),
    });
    filters.push({
      field: "payment_date_end",
      operator: "eq",
      value: dateRange[1].format("YYYY-MM-DD"),
    });
  }
  if (statusFilter) {
    filters.push({
      field: "status",
      operator: "eq",
      value: statusFilter,
    });
  }
  if (methodFilter) {
    filters.push({
      field: "payment_method",
      operator: "eq",
      value: methodFilter,
    });
  }

  // Fetch payments
  const {
    query: { data: paymentsData, isLoading },
  } = useList({
    resource: "payments",
    pagination: { pageSize: 100 },
    filters,
  });

  const payments = (paymentsData as any)?.data || [];

  // Filter by search text (client-side)
  const filteredPayments = payments.filter((payment: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      payment.paymentNumber?.toLowerCase().includes(searchLower) ||
      payment.notes?.toLowerCase().includes(searchLower) ||
      payment.transactionId?.toLowerCase().includes(searchLower)
    );
  });

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      completed: "green",
      failed: "red",
      refunded: "purple",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      check: "Check",
      bank_transfer: "Bank Transfer",
      credit_card: "Credit Card",
      paypal: "PayPal",
      stripe: "Stripe",
      wise: "Wise",
      other: "Other",
    };
    return labels[method] || method;
  };

  // View payment details
  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchText("");
    setDateRange(null);
    setStatusFilter(undefined);
    setMethodFilter(undefined);
  };

  // Table columns
  const columns = [
    {
      title: "Payment #",
      dataIndex: "paymentNumber",
      key: "paymentNumber",
      render: (text: string) => <Text strong>{text}</Text>,
      fixed: isMobile ? undefined : ("left" as any),
    },
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a: any, b: any) =>
        dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix(),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: any) => (
        <Text strong style={{ color: tokens.colors.semantic.success }}>
          ${amount.toFixed(2)} {record.currency || "USD"}
        </Text>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => <Tag>{getPaymentMethodLabel(method)}</Tag>,
      responsive: ["md"] as any,
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
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      render: (id: string) => id || "-",
      responsive: ["lg"] as any,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            {isMobile ? "" : "View"}
          </Button>
        </Space>
      ),
      fixed: isMobile ? undefined : ("right" as any),
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
        <Title level={isMobile ? 3 : 2}>Payment History</Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
          size="middle"
        >
          <Input
            placeholder="Search by payment #, transaction ID, or notes"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? "100%" : 300 }}
            allowClear
          />

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: isMobile ? "100%" : "auto" }}
            placeholder={["Start Date", "End Date"]}
          />

          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: isMobile ? "100%" : 150 }}
            allowClear
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="processing">Processing</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="failed">Failed</Select.Option>
            <Select.Option value="refunded">Refunded</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>

          <Select
            placeholder="Method"
            value={methodFilter}
            onChange={setMethodFilter}
            style={{ width: isMobile ? "100%" : 150 }}
            allowClear
          >
            <Select.Option value="cash">Cash</Select.Option>
            <Select.Option value="check">Check</Select.Option>
            <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
            <Select.Option value="credit_card">Credit Card</Select.Option>
            <Select.Option value="paypal">PayPal</Select.Option>
            <Select.Option value="stripe">Stripe</Select.Option>
            <Select.Option value="wise">Wise</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>

          <Button onClick={handleClearFilters}>Clear Filters</Button>
        </Space>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <DollarOutlined
                style={{
                  fontSize: "24px",
                  color: tokens.colors.semantic.success,
                }}
              />
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary">Total Paid</Text>
                <div>
                  <Text strong style={{ fontSize: "20px" }}>
                    $
                    {filteredPayments
                      .filter((p: any) => p.status === "completed")
                      .reduce((sum: number, p: any) => sum + p.amount, 0)
                      .toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <FilterOutlined
                style={{ fontSize: "24px", color: tokens.colors.primary.main }}
              />
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary">Total Payments</Text>
                <div>
                  <Text strong style={{ fontSize: "20px" }}>
                    {filteredPayments.length}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <DollarOutlined
                style={{
                  fontSize: "24px",
                  color: tokens.colors.semantic.warning,
                }}
              />
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary">Pending</Text>
                <div>
                  <Text strong style={{ fontSize: "20px" }}>
                    $
                    {filteredPayments
                      .filter((p: any) => p.status === "pending")
                      .reduce((sum: number, p: any) => sum + p.amount, 0)
                      .toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Payments Table */}
      <Card>
        <Table
          dataSource={filteredPayments}
          columns={columns}
          rowKey="id"
          scroll={{ x: isMobile ? 1000 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} payments`,
          }}
        />
      </Card>

      {/* Payment Details Modal */}
      <Modal
        title="Payment Details"
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              // TODO: Implement receipt download
              console.log("Download receipt for payment:", selectedPayment?.id);
            }}
          >
            Download Receipt
          </Button>,
        ]}
        width={isMobile ? "100%" : 700}
      >
        {selectedPayment && (
          <Descriptions column={isMobile ? 1 : 2} bordered>
            <Descriptions.Item label="Payment Number" span={2}>
              <Text strong>{selectedPayment.paymentNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedPayment.status)}>
                {selectedPayment.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Date">
              {dayjs(selectedPayment.paymentDate).format("MMM DD, YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: tokens.colors.semantic.success }}>
                ${selectedPayment.amount.toFixed(2)}{" "}
                {selectedPayment.currency || "USD"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Fee Amount">
              ${selectedPayment.feeAmount?.toFixed(2) || "0.00"}
            </Descriptions.Item>
            <Descriptions.Item label="Net Amount">
              <Text strong>
                $
                {selectedPayment.netAmount?.toFixed(2) ||
                  selectedPayment.amount.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              {getPaymentMethodLabel(selectedPayment.paymentMethod)}
            </Descriptions.Item>
            <Descriptions.Item label="Transaction ID">
              {selectedPayment.transactionId || "-"}
            </Descriptions.Item>
            {selectedPayment.wiseTransferId && (
              <>
                <Descriptions.Item label="Wise Transfer ID">
                  {selectedPayment.wiseTransferId}
                </Descriptions.Item>
                <Descriptions.Item label="Wise Status">
                  {selectedPayment.wiseStatus || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">
                  {selectedPayment.wiseRate || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Wise Fee">
                  ${selectedPayment.wiseFee?.toFixed(2) || "0.00"}
                </Descriptions.Item>
              </>
            )}
            {selectedPayment.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {selectedPayment.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created At">
              {dayjs(selectedPayment.createdAt).format("MMM DD, YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {dayjs(selectedPayment.updatedAt).format("MMM DD, YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ResponsiveContainer>
  );
};
