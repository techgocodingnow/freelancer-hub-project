import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  notification,
} from "antd";
import { SaveOutlined, BankOutlined } from "@ant-design/icons";
import { useGetIdentity } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import api from "../../services/api/api";
import type { TenantPaymentInfo } from "../../services/api/types";
import { getErrorMessage } from "../../utils/error";

const { Title } = Typography;
const { TextArea } = Input;

export const PaymentInfoSettings: React.FC = () => {
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const { data: identity } = useGetIdentity();
  const [notificationApi, contentHolder] = notification.useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const isOwner = identity?.role === "owner";

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    setIsFetching(true);
    try {
      const response = await api.getTenantPaymentInfo();
      const data: TenantPaymentInfo = response.data.data;

      form.setFieldsValue({
        companyName: data.companyName || "",
        companyAddress: data.companyAddress || "",
        companyEmail: data.companyEmail || "",
        companyPhone: data.companyPhone || "",
        taxId: data.taxId || "",
      });
    } catch (error) {
      notificationApi.error({
        message: getErrorMessage(error),
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isOwner) {
      notificationApi.error({
        message: "Only owners can update payment information",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.updateTenantPaymentInfo({
        companyName: values.companyName || undefined,
        companyAddress: values.companyAddress || undefined,
        companyEmail: values.companyEmail || undefined,
        companyPhone: values.companyPhone || undefined,
        taxId: values.taxId || undefined,
      });
      notificationApi.success({
        message: "Payment information updated successfully",
      });
    } catch (error) {
      notificationApi.error({
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <ResponsiveContainer maxWidth="lg">
        <Card>
          <Alert
            message="Access Denied"
            description="Only tenant owners can view and manage payment information."
            type="warning"
            showIcon
          />
        </Card>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      {contentHolder}
      <Card
        title={
          <Space>
            <BankOutlined />
            <Title level={3} style={{ margin: 0 }}>
              Payment Information
            </Title>
          </Space>
        }
      >
        <Spin spinning={isFetching}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Alert
              message="Invoice Sender Information"
              description="This information will be used as the 'From' details on invoices sent to customers. Make sure to keep it up to date."
              type="info"
              showIcon
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={isLoading || isFetching}
            >
              <Form.Item
                label="Company Name"
                name="companyName"
                rules={[
                  {
                    max: 255,
                    message: "Company name cannot exceed 255 characters",
                  },
                ]}
              >
                <Input placeholder="e.g., Acme Corporation" size="large" />
              </Form.Item>

              <Form.Item label="Company Address" name="companyAddress">
                <TextArea
                  rows={3}
                  placeholder="Full company address including street, city, state, and postal code"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Company Email"
                name="companyEmail"
                rules={[
                  {
                    type: "email",
                    message: "Please enter a valid email address",
                  },
                  { max: 255, message: "Email cannot exceed 255 characters" },
                ]}
              >
                <Input
                  placeholder="billing@example.com"
                  size="large"
                  type="email"
                />
              </Form.Item>

              <Form.Item
                label="Company Phone"
                name="companyPhone"
                rules={[
                  {
                    max: 50,
                    message: "Phone number cannot exceed 50 characters",
                  },
                ]}
              >
                <Input placeholder="+1 (555) 123-4567" size="large" />
              </Form.Item>

              <Form.Item
                label="Tax ID / VAT Number"
                name="taxId"
                rules={[
                  { max: 100, message: "Tax ID cannot exceed 100 characters" },
                ]}
              >
                <Input
                  placeholder="e.g., 123-45-6789 or GB123456789"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={isLoading}
                  size="large"
                  block={isMobile}
                >
                  Save Payment Information
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Spin>
      </Card>
    </ResponsiveContainer>
  );
};
