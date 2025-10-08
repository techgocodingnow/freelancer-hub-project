import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Descriptions,
  message,
  Radio,
  Tag,
} from "antd";
import {
  DollarOutlined,
  SaveOutlined,
  CalculatorOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  useCreate,
  useList,
  useCustomMutation,
  useCustom,
} from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const PaymentCreate: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [form] = Form.useForm();

  // State
  const [amountSource, setAmountSource] = useState<"manual" | "calculated">(
    "manual"
  );
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // Fetch users
  const {
    query: { data: usersData },
  } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  // Fetch invoices
  const {
    query: { data: invoicesData },
  } = useList({
    resource: "invoices",
    pagination: { pageSize: 100 },
    filters: [
      {
        field: "status",
        operator: "in",
        value: ["draft", "sent"],
      },
    ],
  });

  // Create payment mutation
  const { mutate: createPayment } = useCreate();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate amount from hours
  const { mutate: calculateFromHours } = useCustomMutation();

  const users = (usersData as any)?.data || [];
  const invoices = (invoicesData as any)?.data || [];

  // Calculate amount from time entries
  const handleCalculateAmount = () => {
    const userId = form.getFieldValue("userId");
    if (!userId || !dateRange) {
      message.open({
        type: "error",
        content: "Please select a user and date range",
      });
      return;
    }

    setIsCalculating(true);
    calculateFromHours(
      {
        url: "",
        method: "post",
        values: {
          startDate: dateRange[0].format("YYYY-MM-DD"),
          endDate: dateRange[1].format("YYYY-MM-DD"),
          userIds: [userId],
        },
        config: { headers: {} },
        meta: { resource: "payroll/calculate" },
      },
      {
        onSuccess: (data: any) => {
          const calculation = data.data.data.calculations[0];
          if (calculation) {
            setCalculatedAmount(calculation.totalAmount);
            form.setFieldsValue({ amount: calculation.totalAmount });
            message.open({
              type: "success",
              content: `Calculated: $${calculation.totalAmount.toFixed(2)} (${
                calculation.billableHours
              } billable hours)`,
            });
          } else {
            message.open({
              type: "warning",
              content: "No billable hours found for this period",
            });
          }
          setIsCalculating(false);
        },
        onError: () => {
          message.open({
            type: "error",
            content: "Failed to calculate amount",
          });
          setIsCalculating(false);
        },
      }
    );
  };

  // Fetch user's Wise account when selected
  const {
    query: { data: wiseAccountData, refetch: fetchWiseAccount },
  } = useCustom({
    url: "",
    method: "get",
    config: { headers: {} },
    meta: {
      resource: selectedUser ? `users/${selectedUser.id}/wise-account` : "",
    },
    queryOptions: {
      enabled: false,
    },
  });

  const wiseAccount = wiseAccountData?.data;

  // Handle user selection
  const handleUserChange = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    setSelectedUser(user);

    // Fetch Wise account for selected user
    if (user) {
      fetchWiseAccount();
    }
  };

  // Handle form submission
  const handleSubmit = (values: any) => {
    setIsLoading(true);
    createPayment(
      {
        resource: "payments",
        values: {
          ...values,
          paymentDate: values.paymentDate.format("YYYY-MM-DD"),
          currency: values.currency || "USD",
          feeAmount: values.feeAmount || 0,
          netAmount: values.amount - (values.feeAmount || 0),
        },
      },
      {
        onSuccess: () => {
          message.open({
            type: "success",
            content: "Payment created successfully",
          });
          setIsLoading(false);
          navigate(`/tenants/${slug}/financials/payments/history`);
        },
        onError: () => {
          message.open({
            type: "error",
            content: "Failed to create payment",
          });
          setIsLoading(false);
        },
      }
    );
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
        <Title level={isMobile ? 3 : 2}>Create Payment</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                paymentDate: dayjs(),
                paymentMethod: "bank_transfer",
                status: "pending",
                currency: "USD",
                feeAmount: 0,
              }}
            >
              {/* Recipient Selection */}
              <Form.Item
                label="Recipient"
                name="userId"
                rules={[
                  { required: true, message: "Please select a recipient" },
                ]}
              >
                <Select
                  placeholder="Select team member"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleUserChange}
                  suffixIcon={<UserOutlined />}
                >
                  {users.map((user: any) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Amount Source */}
              <Form.Item label="Amount Source">
                <Radio.Group
                  value={amountSource}
                  onChange={(e) => setAmountSource(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="manual">Manual Entry</Radio.Button>
                  <Radio.Button value="calculated">
                    Calculate from Hours
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {/* Calculate from Hours */}
              {amountSource === "calculated" && (
                <Card
                  size="small"
                  style={{
                    marginBottom: "16px",
                    background: tokens.colors.background.paper,
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>Calculate Amount from Time Entries</Text>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) =>
                        setDateRange(dates as [Dayjs, Dayjs])
                      }
                      style={{ width: "100%" }}
                    />
                    <Button
                      icon={<CalculatorOutlined />}
                      onClick={handleCalculateAmount}
                      loading={isCalculating}
                      block
                    >
                      Calculate Amount
                    </Button>
                    {calculatedAmount !== null && (
                      <Alert
                        message={`Calculated Amount: $${calculatedAmount.toFixed(
                          2
                        )}`}
                        type="success"
                        showIcon
                      />
                    )}
                  </Space>
                </Card>
              )}

              {/* Amount */}
              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true, message: "Please enter amount" }]}
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  style={{ width: "100%" }}
                  size="large"
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Currency" name="currency">
                    <Select size="large">
                      <Select.Option value="USD">USD</Select.Option>
                      <Select.Option value="EUR">EUR</Select.Option>
                      <Select.Option value="GBP">GBP</Select.Option>
                      <Select.Option value="CAD">CAD</Select.Option>
                      <Select.Option value="AUD">AUD</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Fee Amount" name="feeAmount">
                    <InputNumber
                      prefix={<DollarOutlined />}
                      style={{ width: "100%" }}
                      size="large"
                      min={0}
                      precision={2}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Wise Account Status */}
              {selectedUser && (
                <Alert
                  message={
                    wiseAccount ? (
                      <Space>
                        <CheckCircleOutlined />
                        <Text>
                          Wise account connected for {selectedUser.fullName}
                        </Text>
                        <Tag color="success">Verified</Tag>
                      </Space>
                    ) : (
                      <Space>
                        <WarningOutlined />
                        <Text>No Wise account connected</Text>
                        <Button
                          type="link"
                          size="small"
                          onClick={() =>
                            navigate(`/tenants/${slug}/settings/wise-account`)
                          }
                        >
                          Set up Wise account
                        </Button>
                      </Space>
                    )
                  }
                  type={wiseAccount ? "success" : "warning"}
                  showIcon={false}
                  style={{ marginBottom: "16px" }}
                />
              )}

              {/* Payment Details */}
              <Divider>Payment Details</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Payment Date"
                    name="paymentDate"
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Payment Method"
                    name="paymentMethod"
                    rules={[{ required: true }]}
                  >
                    <Select size="large">
                      <Select.Option value="bank_transfer">
                        Bank Transfer
                      </Select.Option>
                      <Select.Option value="wise">Wise</Select.Option>
                      <Select.Option value="paypal">PayPal</Select.Option>
                      <Select.Option value="stripe">Stripe</Select.Option>
                      <Select.Option value="check">Check</Select.Option>
                      <Select.Option value="cash">Cash</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Invoice Linking */}
              <Form.Item label="Link to Invoice (Optional)" name="invoiceId">
                <Select
                  placeholder="Select invoice"
                  size="large"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {invoices.map((invoice: any) => (
                    <Select.Option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - $
                      {invoice.totalAmount.toFixed(2)} ({invoice.status})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Transaction ID */}
              <Form.Item label="Transaction ID (Optional)" name="transactionId">
                <Input size="large" placeholder="Enter transaction ID" />
              </Form.Item>

              {/* Notes */}
              <Form.Item label="Notes" name="notes">
                <TextArea rows={4} placeholder="Add payment notes..." />
              </Form.Item>

              {/* Submit */}
              <Form.Item>
                <Space
                  style={{ width: "100%" }}
                  direction={isMobile ? "vertical" : "horizontal"}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="large"
                    loading={isLoading}
                    block={isMobile}
                  >
                    Create Payment
                  </Button>
                  <Button
                    size="large"
                    onClick={() =>
                      navigate(`/tenants/${slug}/financials/payments/history`)
                    }
                    block={isMobile}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Preview Panel */}
        <Col xs={24} lg={8}>
          <Card
            title="Payment Preview"
            style={{ position: isMobile ? "relative" : "sticky", top: 24 }}
          >
            {selectedUser ? (
              <>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Recipient">
                    <Text strong>{selectedUser.fullName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedUser.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hourly Rate">
                    ${selectedUser.hourlyRate?.toFixed(2) || "0.00"}
                  </Descriptions.Item>
                  {wiseAccount && (
                    <Descriptions.Item label="Wise Account">
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Connected
                      </Tag>
                      <div style={{ marginTop: "4px", fontSize: "12px" }}>
                        <Text type="secondary">{wiseAccount.currency}</Text>
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            ) : (
              <Text type="secondary">Select a recipient to see details</Text>
            )}

            <Divider />

            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <Text>Amount:</Text>
                <Text strong>
                  ${form.getFieldValue("amount")?.toFixed(2) || "0.00"}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <Text>Fee:</Text>
                <Text>
                  ${form.getFieldValue("feeAmount")?.toFixed(2) || "0.00"}
                </Text>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>Net Amount:</Text>
                <Text
                  strong
                  style={{
                    color: tokens.colors.semantic.success,
                    fontSize: "18px",
                  }}
                >
                  $
                  {(
                    (form.getFieldValue("amount") || 0) -
                    (form.getFieldValue("feeAmount") || 0)
                  ).toFixed(2)}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </ResponsiveContainer>
  );
};
