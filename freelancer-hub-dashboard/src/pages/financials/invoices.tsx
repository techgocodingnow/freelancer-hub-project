import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Descriptions,
  Spin,
  Progress,
  message,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  FilePdfOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  useList,
  useDelete,
  useCustomMutation,
  useNavigation,
} from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;

export const InvoiceManagement: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams();

  // State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // Build filters
  const filters: any[] = [];
  if (statusFilter) {
    filters.push({
      field: "status",
      operator: "eq",
      value: statusFilter,
    });
  }

  // Fetch invoices
  const {
    query: { data: invoicesData, isLoading, refetch },
  } = useList({
    resource: "invoices",
    pagination: { pageSize: 100 },
    filters,
  });

  // Delete mutation
  const { mutate: deleteInvoice } = useDelete();

  // Send email mutation
  const { mutate: sendEmail } = useCustomMutation();

  // Generate PDF mutation
  const { mutate: generatePDF } = useCustomMutation();

  const invoices = (invoicesData as any)?.data || [];

  // Filter by search text
  const filteredInvoices = invoices.filter((invoice: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
      invoice.clientName?.toLowerCase().includes(searchLower) ||
      invoice.clientEmail?.toLowerCase().includes(searchLower)
    );
  });

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "default",
      sent: "blue",
      paid: "green",
      overdue: "red",
      cancelled: "gray",
    };
    return colors[status] || "default";
  };

  // View invoice details
  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  // Send invoice email
  const handleSendEmail = (invoiceId: number) => {
    Modal.confirm({
      title: "Send Invoice",
      content: "Are you sure you want to send this invoice via email?",
      okText: "Send",
      onOk: () => {
        sendEmail(
          {
            url: "",
            method: "post",
            values: {},
            config: { headers: {} },
            meta: { resource: `invoices/${invoiceId}/send` },
          },
          {
            onSuccess: () => {
              message.success("Invoice sent successfully");
              refetch();
            },
            onError: () => {
              message.error("Failed to send invoice");
            },
          }
        );
      },
    });
  };

  // Generate PDF
  const handleGeneratePDF = (invoiceId: number) => {
    generatePDF(
      {
        url: "",
        method: "post",
        values: {},
        config: { headers: {} },
        meta: { resource: `invoices/${invoiceId}/pdf` },
      },
      {
        onSuccess: (data: any) => {
          message.success("PDF generated successfully");
          // Open PDF in new tab
          if (data.data.pdfUrl) {
            window.open(data.data.pdfUrl, "_blank");
          }
          refetch();
        },
        onError: () => {
          message.error("Failed to generate PDF");
        },
      }
    );
  };

  // Delete invoice
  const handleDelete = (invoiceId: number) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteInvoice(
          {
            resource: "invoices",
            id: invoiceId,
          },
          {
            onSuccess: () => {
              message.success("Invoice deleted successfully");
              refetch();
            },
            onError: () => {
              message.error("Failed to delete invoice");
            },
          }
        );
      },
    });
  };

  // Calculate payment progress
  const getPaymentProgress = (invoice: any) => {
    if (invoice.totalAmount === 0) return 0;
    return (invoice.amountPaid / invoice.totalAmount) * 100;
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text: string) => <Text strong>{text}</Text>,
      fixed: isMobile ? undefined : ("left" as any),
    },
    {
      title: "Client",
      dataIndex: "clientName",
      key: "clientName",
      render: (name: string, record: any) =>
        name || record.user?.fullName || "-",
      responsive: ["md"] as any,
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a: any, b: any) =>
        dayjs(a.issueDate).unix() - dayjs(b.issueDate).unix(),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => {
        const isOverdue =
          dayjs(date).isBefore(dayjs()) && dayjs(date).isValid();
        return (
          <Text type={isOverdue ? "danger" : undefined}>
            {dayjs(date).format("MMM DD, YYYY")}
          </Text>
        );
      },
      responsive: ["lg"] as any,
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: any) => (
        <div>
          <Text strong style={{ color: tokens.colors.semantic.success }}>
            ${amount.toFixed(2)}
          </Text>
          {record.amountPaid > 0 && (
            <div style={{ marginTop: "4px" }}>
              <Progress
                percent={getPaymentProgress(record)}
                size="small"
                showInfo={false}
                strokeColor={tokens.colors.semantic.success}
              />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ${record.amountPaid.toFixed(2)} paid
              </Text>
            </div>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => a.totalAmount - b.totalAmount,
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
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="small" direction={isMobile ? "vertical" : "horizontal"}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            {isMobile ? "" : "View"}
          </Button>
          {record.status === "draft" && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(
                    `/tenants/${slug}/financials/invoices/${record.id}/edit`
                  )
                }
                size="small"
              >
                {isMobile ? "" : "Edit"}
              </Button>
              <Button
                type="link"
                icon={<MailOutlined />}
                onClick={() => handleSendEmail(record.id)}
                size="small"
              >
                {isMobile ? "" : "Send"}
              </Button>
            </>
          )}
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record.id)}
            size="small"
          >
            {isMobile ? "" : "PDF"}
          </Button>
          {record.status === "draft" && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
            >
              {isMobile ? "" : "Delete"}
            </Button>
          )}
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
        <Title level={isMobile ? 3 : 2}>Invoices</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            navigate(`/tenants/${slug}/financials/invoices/create`)
          }
          size={isMobile ? "middle" : "large"}
          block={isMobile}
        >
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
          size="middle"
        >
          <Input
            placeholder="Search by invoice #, client name, or email"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? "100%" : 300 }}
            allowClear
          />

          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: isMobile ? "100%" : 150 }}
            allowClear
          >
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="sent">Sent</Select.Option>
            <Select.Option value="paid">Paid</Select.Option>
            <Select.Option value="overdue">Overdue</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>

          <Button
            onClick={() => {
              setSearchText("");
              setStatusFilter(undefined);
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Total Invoiced</Text>
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "20px",
                    color: tokens.colors.semantic.success,
                  }}
                >
                  $
                  {filteredInvoices
                    .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0)
                    .toFixed(2)}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Total Paid</Text>
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "20px",
                    color: tokens.colors.semantic.success,
                  }}
                >
                  $
                  {filteredInvoices
                    .reduce((sum: number, inv: any) => sum + inv.amountPaid, 0)
                    .toFixed(2)}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Outstanding</Text>
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "20px",
                    color: tokens.colors.semantic.warning,
                  }}
                >
                  $
                  {filteredInvoices
                    .reduce(
                      (sum: number, inv: any) =>
                        sum + (inv.totalAmount - inv.amountPaid),
                      0
                    )
                    .toFixed(2)}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Total Invoices</Text>
              <div>
                <Text strong style={{ fontSize: "20px" }}>
                  {filteredInvoices.length}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Invoices Table */}
      <Card>
        <Table
          dataSource={filteredInvoices}
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

      {/* Invoice Details Modal */}
      <Modal
        title="Invoice Details"
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </Button>,
          selectedInvoice?.status === "draft" && (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                setIsDetailsModalOpen(false);
                navigate(
                  `/tenants/${slug}/financials/invoices/${selectedInvoice.id}/edit`
                );
              }}
            >
              Edit Invoice
            </Button>
          ),
        ]}
        width={isMobile ? "100%" : 700}
      >
        {selectedInvoice && (
          <Descriptions column={isMobile ? 1 : 2} bordered>
            <Descriptions.Item label="Invoice Number" span={2}>
              <Text strong>{selectedInvoice.invoiceNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedInvoice.status)}>
                {selectedInvoice.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Issue Date">
              {dayjs(selectedInvoice.issueDate).format("MMM DD, YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {dayjs(selectedInvoice.dueDate).format("MMM DD, YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {selectedInvoice.paymentTerms || "Net 30"}
            </Descriptions.Item>
            <Descriptions.Item label="Client Name" span={2}>
              {selectedInvoice.clientName ||
                selectedInvoice.user?.fullName ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Client Email" span={2}>
              {selectedInvoice.clientEmail ||
                selectedInvoice.user?.email ||
                "-"}
            </Descriptions.Item>
            {selectedInvoice.clientAddress && (
              <Descriptions.Item label="Client Address" span={2}>
                {selectedInvoice.clientAddress}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Subtotal">
              ${selectedInvoice.subtotal.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Tax ({selectedInvoice.taxRate}%)">
              ${selectedInvoice.taxAmount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Discount">
              ${selectedInvoice.discountAmount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              <Text strong style={{ color: tokens.colors.semantic.success }}>
                ${selectedInvoice.totalAmount.toFixed(2)}{" "}
                {selectedInvoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Amount Paid">
              ${selectedInvoice.amountPaid.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Balance Due">
              <Text strong style={{ color: tokens.colors.semantic.warning }}>
                $
                {(
                  selectedInvoice.totalAmount - selectedInvoice.amountPaid
                ).toFixed(2)}
              </Text>
            </Descriptions.Item>
            {selectedInvoice.sentAt && (
              <>
                <Descriptions.Item label="Sent At">
                  {dayjs(selectedInvoice.sentAt).format("MMM DD, YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Sent To">
                  {selectedInvoice.sentTo}
                </Descriptions.Item>
                <Descriptions.Item label="Email Count">
                  {selectedInvoice.emailCount}
                </Descriptions.Item>
              </>
            )}
            {selectedInvoice.pdfUrl && (
              <Descriptions.Item label="PDF" span={2}>
                <Button
                  type="link"
                  icon={<FilePdfOutlined />}
                  onClick={() => window.open(selectedInvoice.pdfUrl, "_blank")}
                >
                  View PDF
                </Button>
              </Descriptions.Item>
            )}
            {selectedInvoice.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {selectedInvoice.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </ResponsiveContainer>
  );
};
