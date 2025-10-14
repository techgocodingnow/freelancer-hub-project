import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Table,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { Api } from "../../services/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

type LineItem = {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export const InvoiceCreate: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [form] = Form.useForm();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      key: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  // Fetch customers on mount
  React.useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await Api.getCustomers({ isActive: true });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      message.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAddLineItem = () => {
    const newKey = String(lineItems.length + 1);
    setLineItems([
      ...lineItems,
      {
        key: newKey,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (key: string) => {
    if (lineItems.length === 1) {
      message.warning("At least one line item is required");
      return;
    }
    setLineItems(lineItems.filter((item) => item.key !== key));
  };

  const handleLineItemChange = (
    key: string,
    field: keyof LineItem,
    value: any
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
  };

  const handleSubmit = async (values: any) => {
    // Validate line items
    const invalidItems = lineItems.filter(
      (item) =>
        !item.description || item.quantity <= 0 || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      message.error(
        "Please fill in all line items with valid quantity and price"
      );
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        customerId: values.customerId,
        duration: values.duration,
        items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await Api.createInvoice(invoiceData);

      message.success("Invoice created successfully");
      navigate(`/tenants/${slug}/invoices`);
    } catch (error: any) {
      console.error("Failed to create invoice:", error);
      message.error(
        error.response?.data?.message || "Failed to create invoice"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const lineItemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "40%",
      render: (text: string, record: LineItem) => (
        <TextArea
          value={text}
          onChange={(e) =>
            handleLineItemChange(record.key, "description", e.target.value)
          }
          placeholder="Service or item description"
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: "15%",
      render: (value: number, record: LineItem) => (
        <InputNumber
          value={value}
          onChange={(val) =>
            handleLineItemChange(record.key, "quantity", val || 0)
          }
          min={1}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: "20%",
      render: (value: number, record: LineItem) => (
        <InputNumber
          value={value}
          onChange={(val) =>
            handleLineItemChange(record.key, "unitPrice", val || 0)
          }
          min={0}
          step={0.01}
          formatter={(value) =>
            `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) =>
            Number(value!.replace(/\$\s?|(,*)/g, "")) as 0
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: "20%",
      render: (_: any, record: LineItem) => {
        const amount = (record.quantity || 0) * (record.unitPrice || 0);
        return (
          <Text strong>
            ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: "5%",
      render: (_: any, record: LineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveLineItem(record.key)}
          disabled={lineItems.length === 1}
        />
      ),
    },
  ];

  const subtotal = calculateSubtotal();

  return (
    <ResponsiveContainer maxWidth="xl">
      <Card
        title={
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              Create New Invoice
            </Title>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Customer"
                name="customerId"
                rules={[
                  { required: true, message: "Please select a customer" },
                ]}
              >
                <Select
                  placeholder="Select a customer"
                  size="large"
                  loading={loadingCustomers}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: customer.company
                      ? `${customer.name} (${customer.company})`
                      : customer.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Duration"
                name="duration"
                rules={[{ required: true, message: "Please select duration" }]}
                initialValue="1month"
              >
                <Select size="large">
                  <Select.Option value="1week">1 Week</Select.Option>
                  <Select.Option value="2weeks">2 Weeks</Select.Option>
                  <Select.Option value="1month">1 Month</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Line Items</Divider>

          <Table
            dataSource={lineItems}
            columns={lineItemColumns}
            pagination={false}
            size="small"
            rowKey="key"
            style={{ marginBottom: 16 }}
          />

          <Button
            type="dashed"
            onClick={handleAddLineItem}
            icon={<PlusOutlined />}
            style={{ marginBottom: 24, width: isMobile ? "100%" : "auto" }}
          >
            Add Line Item
          </Button>

          <Divider />

          <Row justify="end" style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                <Row justify="space-between">
                  <Col>
                    <Text strong>Subtotal:</Text>
                  </Col>
                  <Col>
                    <Text strong style={{ fontSize: 16 }}>
                      $
                      {subtotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Col>
                </Row>
                <Row justify="space-between">
                  <Col>
                    <Text>Tax:</Text>
                  </Col>
                  <Col>
                    <Text>$0.00</Text>
                  </Col>
                </Row>
                <Divider style={{ margin: "8px 0" }} />
                <Row justify="space-between">
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>
                      Total:
                    </Title>
                  </Col>
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>
                      $
                      {subtotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Title>
                  </Col>
                </Row>
              </Space>
            </Col>
          </Row>

          <Form.Item>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoading}
                size="large"
                block={isMobile}
              >
                Create Invoice
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() => navigate(`/tenants/${slug}/invoices`)}
                size="large"
                block={isMobile}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </ResponsiveContainer>
  );
};
