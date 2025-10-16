import React, { useState } from "react";
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Descriptions,
  Table,
  Divider,
  Spin,
  Modal,
  message,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useShow, useDelete, useCustomMutation } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { SendInvoiceModal } from "../../components/SendInvoiceModal";
import dayjs from "dayjs";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;

export const InvoiceShow: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug, id } = useParams();

  // State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Fetch invoice
  const { query } = useShow({
    resource: "invoices",
    id,
  });

  const { data, isLoading, refetch } = query;
  const invoice = data?.data;

  // Delete mutation
  const { mutate: deleteInvoice } = useDelete();

  // Send email mutation
  const { mutate: sendEmail } = useCustomMutation();

  // Generate PDF mutation
  const { mutate: generatePDF } = useCustomMutation();

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

  // Handle send invoice form submission
  const handleSendInvoiceSubmit = async (values: {
    email: string;
    ccEmails?: string[];
    subject?: string;
    message?: string;
  }) => {
    return new Promise<void>((resolve, reject) => {
      sendEmail(
        {
          url: "",
          method: "post",
          values: {
            email: values.email,
            ccEmails: values.ccEmails?.filter((email) => email && email.trim()),
            subject: values.subject,
            message: values.message,
          },
          config: { headers: {} },
          meta: { resource: `invoices/${id}/send` },
        },
        {
          onSuccess: () => {
            refetch();
            setIsSendModalOpen(false);
            message.success("Invoice sent successfully");
            resolve();
          },
          onError: (error: any) => {
            reject(new Error(error?.message || "Failed to send invoice"));
          },
        }
      );
    });
  };

  // Download PDF
  const handleDownloadPDF = () => {
    generatePDF(
      {
        url: "",
        method: "post",
        values: {},
        config: { headers: {} },
        meta: { resource: `invoices/${id}/pdf` },
      },
      {
        onSuccess: async (data: any) => {
          // Download PDF - check both possible response structures
          const pdfUrl = data.pdfUrl || data.data?.pdfUrl;

          if (pdfUrl) {
            try {
              // Try to fetch with credentials for same-origin requests
              const response = await fetch(pdfUrl, {
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `invoice-${invoice?.invoiceNumber || id}.pdf`;
              a.style.display = "none";
              document.body.appendChild(a);
              a.click();

              // Clean up after a short delay
              setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }, 100);

              message.success("PDF downloaded successfully");
            } catch (error) {
              console.error("PDF download error:", error);

              // Fallback: Open in new tab if download fails (CORS issue)
              message.warning("Opening PDF in new tab instead");
              window.open(pdfUrl, "_blank");
            }
          } else {
            console.error("No PDF URL in response:", data);
            message.error("PDF URL not found in response");
          }
          refetch();
        },
        onError: (error: any) => {
          console.error("PDF generation error:", error);
          message.error("Failed to generate PDF");
        },
      }
    );
  };

  // Delete invoice
  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteInvoice(
          {
            resource: "invoices",
            id: id!,
          },
          {
            onSuccess: () => {
              message.success("Invoice deleted successfully");
              navigate(`/tenants/${slug}/financials/invoices`);
            },
            onError: () => {
              message.error("Failed to delete invoice");
            },
          }
        );
      },
    });
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (!invoice) {
    return (
      <ResponsiveContainer>
        <Alert
          message="Invoice not found"
          description="The invoice you are looking for does not exist."
          type="error"
          showIcon
        />
      </ResponsiveContainer>
    );
  }

  // Convert string values to numbers for calculations and display
  const subtotal = Number(invoice.subtotal);
  const taxAmount = Number(invoice.taxAmount);
  const discountAmount = Number(invoice.discountAmount);
  const totalAmount = Number(invoice.totalAmount);
  const amountPaid = Number(invoice.amountPaid);
  const balanceDue = totalAmount - amountPaid;

  // Line items columns
  const lineItemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "50%",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: "15%",
      render: (qty: number, record: any) => `${qty} ${record.unit || ""}`,
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: "15%",
      render: (price: number) => `$${Number(price).toFixed(2)}`,
      align: "right" as const,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: "20%",
      render: (amount: number) => (
        <Text strong>${Number(amount).toFixed(2)}</Text>
      ),
      align: "right" as const,
    },
  ];

  // Payment history columns
  const paymentColumns = [
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong style={{ color: tokens.colors.semantic.success }}>
          ${Number(amount).toFixed(2)}
        </Text>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Reference",
      dataIndex: "referenceNumber",
      key: "referenceNumber",
    },
  ];

  return (
    <ResponsiveContainer>
      <div className="invoice-show-container">
        {/* Header Actions */}
        <div
          className="no-print"
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            marginBottom: "24px",
            gap: isMobile ? "12px" : "0",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/tenants/${slug}/financials/invoices`)}
            size={isMobile ? "middle" : "large"}
          >
            Back to Invoices
          </Button>

          <Space wrap size="middle">
            {invoice.status === "draft" && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate(
                      `/tenants/${slug}/financials/invoices/${id}/edit`
                    )
                  }
                  size={isMobile ? "middle" : "large"}
                >
                  {isMobile ? "" : "Edit"}
                </Button>
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={() => setIsSendModalOpen(true)}
                  size={isMobile ? "middle" : "large"}
                >
                  {isMobile ? "" : "Send"}
                </Button>
              </>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
              size={isMobile ? "middle" : "large"}
            >
              {isMobile ? "" : "Download PDF"}
            </Button>
            {invoice.status === "draft" && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                size={isMobile ? "middle" : "large"}
              >
                {isMobile ? "" : "Delete"}
              </Button>
            )}
          </Space>
        </div>

        {/* Invoice Card */}
        <Card className="invoice-card">
          {/* Invoice Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "32px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <Title level={1} style={{ margin: 0, marginBottom: "8px" }}>
                Invoice
              </Title>
              <Text strong style={{ fontSize: "20px" }}>
                {invoice.invoiceNumber}
              </Text>
              <div style={{ marginTop: "8px" }}>
                <Tag color={getStatusColor(invoice.status)} style={{ fontSize: "14px" }}>
                  {invoice.status.toUpperCase()}
                </Tag>
              </div>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <Text strong>Issue Date: </Text>
              <Text>{dayjs(invoice.issueDate).format("MMM DD, YYYY")}</Text>
              <br />
              <Text strong>Due Date: </Text>
              <Text
                type={
                  dayjs(invoice.dueDate).isBefore(dayjs()) &&
                  invoice.status !== "paid"
                    ? "danger"
                    : undefined
                }
              >
                {dayjs(invoice.dueDate).format("MMM DD, YYYY")}
              </Text>
              <br />
              {invoice.paidDate && (
                <>
                  <Text strong>Paid Date: </Text>
                  <Text>{dayjs(invoice.paidDate).format("MMM DD, YYYY")}</Text>
                </>
              )}
            </div>
          </div>

          <Divider />

          {/* Client and Company Info */}
          <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
            <Col xs={24} md={12}>
              <div>
                <Text strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
                  Bill To:
                </Text>
                <Text strong style={{ fontSize: "16px", display: "block" }}>
                  {invoice.clientName || invoice.customer?.name || "-"}
                </Text>
                {invoice.clientEmail && (
                  <Text type="secondary" style={{ display: "block" }}>
                    {invoice.clientEmail}
                  </Text>
                )}
                {invoice.clientAddress && (
                  <Text type="secondary" style={{ display: "block", marginTop: "4px" }}>
                    {invoice.clientAddress}
                  </Text>
                )}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ textAlign: isMobile ? "left" : "right" }}>
                <Text strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
                  From:
                </Text>
                <Text strong style={{ fontSize: "16px", display: "block" }}>
                  {invoice.user?.fullName || "-"}
                </Text>
                {invoice.user?.email && (
                  <Text type="secondary" style={{ display: "block" }}>
                    {invoice.user.email}
                  </Text>
                )}
              </div>
            </Col>
          </Row>

          {/* Projects Section */}
          {invoice.projects && invoice.projects.length > 0 && (
            <>
              <Divider orientation="left">Projects</Divider>
              <div style={{ marginBottom: "24px" }}>
                <Space wrap>
                  {invoice.projects.map((project: any) => (
                    <Tag key={project.id} color="blue" style={{ fontSize: "14px" }}>
                      {project.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          {/* Line Items */}
          <Divider orientation="left">Line Items</Divider>
          <Table
            dataSource={invoice.items || []}
            columns={lineItemColumns}
            pagination={false}
            rowKey="id"
            style={{ marginBottom: "24px" }}
            summary={() => (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong>Subtotal:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>${subtotal.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                {taxAmount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text>Tax ({invoice.taxRate}%):</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text>${taxAmount.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
                {discountAmount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text>Discount:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text style={{ color: tokens.colors.semantic.success }}>
                        -${discountAmount.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong style={{ fontSize: "16px" }}>
                      Total:
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text
                      strong
                      style={{
                        fontSize: "18px",
                        color: tokens.colors.semantic.success,
                      }}
                    >
                      ${totalAmount.toFixed(2)} {invoice.currency}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                {amountPaid > 0 && (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text>Amount Paid:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text>${amountPaid.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text strong style={{ fontSize: "16px" }}>
                          Balance Due:
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text
                          strong
                          style={{
                            fontSize: "18px",
                            color: tokens.colors.semantic.warning,
                          }}
                        >
                          ${balanceDue.toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </>
            )}
          />

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <>
              <Divider orientation="left">Payment History</Divider>
              <Table
                dataSource={invoice.payments}
                columns={paymentColumns}
                pagination={false}
                rowKey="id"
                style={{ marginBottom: "24px" }}
              />
            </>
          )}

          {/* Notes and Terms */}
          {(invoice.notes || invoice.paymentTerms) && (
            <>
              <Divider />
              <Row gutter={[24, 24]}>
                {invoice.notes && (
                  <Col xs={24} md={12}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>
                      Notes:
                    </Text>
                    <Text>{invoice.notes}</Text>
                  </Col>
                )}
                {invoice.paymentTerms && (
                  <Col xs={24} md={12}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>
                      Payment Terms:
                    </Text>
                    <Text>{invoice.paymentTerms}</Text>
                  </Col>
                )}
              </Row>
            </>
          )}

          {/* Email Tracking Info */}
          {invoice.sentAt && (
            <>
              <Divider />
              <Descriptions column={isMobile ? 1 : 3} size="small">
                <Descriptions.Item label="Sent At">
                  {dayjs(invoice.sentAt).format("MMM DD, YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Sent To">
                  {invoice.sentTo}
                </Descriptions.Item>
                <Descriptions.Item label="Email Count">
                  {invoice.emailCount || 0}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Card>

        {/* Send Invoice Modal */}
        <SendInvoiceModal
          visible={isSendModalOpen}
          invoiceId={invoice.id as number}
          invoiceNumber={invoice.invoiceNumber}
          defaultEmail={invoice.clientEmail || invoice.sentTo}
          onCancel={() => setIsSendModalOpen(false)}
          onSubmit={handleSendInvoiceSubmit}
        />
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .invoice-card {
              box-shadow: none !important;
              border: none !important;
            }
            .invoice-show-container {
              padding: 0 !important;
            }
          }
        `}
      </style>
    </ResponsiveContainer>
  );
};
