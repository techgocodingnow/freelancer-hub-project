import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Descriptions,
  Modal,
  message,
  Divider,
  Tag,
} from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useCustom, useCustomMutation } from "@refinedev/core";
import { useParams } from "react-router";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { tokens } from "../../theme/tokens";

const { Title, Text, Paragraph } = Typography;

interface WiseAccountInfo {
  recipientId: number | null;
  accountHolderName: string;
  currency: string;
  accountType: string;
  country: string;
  verified: boolean;
  connectedAt: string;
  accountDetails?: any;
}

interface AccountRequirement {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  fields?: AccountRequirement[];
}

export const WiseAccountSetup: React.FC = () => {
  const isMobile = useIsMobile();
  const { slug } = useParams();
  const [form] = Form.useForm();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [accountRequirements, setAccountRequirements] = useState<any>(null);

  // Get current user ID from auth context (you'll need to implement this)
  // For now, using a placeholder
  const currentUserId = 1; // TODO: Get from auth context

  // Fetch Wise account info
  const {
    query: {
      data: wiseAccountData,
      isLoading: isLoadingAccount,
      refetch: refetchAccount,
    },
  } = useCustom({
    url: "",
    method: "get",
    config: { headers: {} },
    meta: { resource: `users/${currentUserId}/wise-account` },
  });

  const wiseAccount: WiseAccountInfo | null =
    (wiseAccountData?.data as WiseAccountInfo) || null;

  // Fetch account requirements
  const {
    query: { refetch: fetchRequirements },
  } = useCustom({
    url: "",
    method: "get",
    config: {
      headers: {},
      query: {
        currency: selectedCurrency,
        country: selectedCountry,
      },
    },
    meta: { resource: "wise/requirements" },
    queryOptions: {
      enabled: false,
    },
  });

  // Save Wise account mutation
  const { mutate: saveWiseAccount } = useCustomMutation();
  const [isSaving, setIsSaving] = useState(false);

  // Delete Wise account mutation
  const { mutate: deleteWiseAccount } = useCustomMutation();

  // Load requirements when currency/country changes
  useEffect(() => {
    if (selectedCurrency && selectedCountry) {
      fetchRequirements().then((result: any) => {
        setAccountRequirements(result.data?.data);
      });
    }
  }, [selectedCurrency, selectedCountry]);

  // Initialize form with existing data
  useEffect(() => {
    if (wiseAccount && !isEditing) {
      form.setFieldsValue({
        accountHolderName: wiseAccount.accountHolderName,
        currency: wiseAccount.currency,
        country: wiseAccount.country,
        ...wiseAccount.accountDetails,
      });
      setSelectedCurrency(wiseAccount.currency);
      setSelectedCountry(wiseAccount.country);
    }
  }, [wiseAccount, isEditing, form]);

  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    // Reset account details when currency changes
    const currentValues = form.getFieldsValue();
    form.setFieldsValue({
      accountHolderName: currentValues.accountHolderName,
      currency,
      country: currentValues.country,
    });
  };

  // Handle form submission
  const handleSubmit = (values: any) => {
    const { accountHolderName, currency, country, ...accountDetails } = values;

    setIsSaving(true);
    saveWiseAccount(
      {
        url: "",
        method: "post",
        values: {
          accountHolderName,
          currency,
          accountType: accountRequirements?.accountType || "email",
          country,
          accountDetails,
        },
        config: { headers: {} },
        meta: { resource: `users/${currentUserId}/wise-account` },
      },
      {
        onSuccess: () => {
          message.open({
            type: "success",
            content: "Wise account saved successfully",
          });
          setIsEditing(false);
          setIsSaving(false);
          refetchAccount();
        },
        onError: () => {
          message.open({
            type: "error",
            content: "Failed to save Wise account",
          });
          setIsSaving(false);
        },
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    Modal.confirm({
      title: "Remove Wise Account",
      content:
        "Are you sure you want to remove your Wise account? This action cannot be undone.",
      okText: "Remove",
      okType: "danger",
      onOk: () => {
        deleteWiseAccount(
          {
            url: "",
            method: "delete",
            values: {},
            config: { headers: {} },
            meta: { resource: `users/${currentUserId}/wise-account` },
          },
          {
            onSuccess: () => {
              message.open({
                type: "success",
                content: "Wise account removed successfully",
              });
              refetchAccount();
              form.resetFields();
            },
            onError: () => {
              message.open({
                type: "error",
                content: "Failed to remove Wise account",
              });
            },
          }
        );
      },
    });
  };

  // Render account detail fields based on requirements
  const renderAccountFields = () => {
    if (!accountRequirements || !accountRequirements.fields) {
      return null;
    }

    return accountRequirements.fields.map((field: AccountRequirement) => {
      if (field.type === "select") {
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={[
              {
                required: field.required,
                message: `${field.label} is required`,
              },
            ]}
          >
            <Select size="large" placeholder={`Select ${field.label}`}>
              {field.options?.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      }

      if (field.type === "object" && field.fields) {
        return (
          <div key={field.name}>
            <Divider orientation="left">{field.label}</Divider>
            {field.fields.map((subField: AccountRequirement) => (
              <Form.Item
                key={`${field.name}.${subField.name}`}
                label={subField.label}
                name={[field.name, subField.name]}
                rules={[
                  {
                    required: subField.required,
                    message: `${subField.label} is required`,
                  },
                ]}
              >
                <Input size="large" placeholder={subField.label} />
              </Form.Item>
            ))}
          </div>
        );
      }

      return (
        <Form.Item
          key={field.name}
          label={field.label}
          name={field.name}
          rules={[
            { required: field.required, message: `${field.label} is required` },
            field.type === "email"
              ? { type: "email", message: "Invalid email address" }
              : {},
          ]}
        >
          <Input size="large" type={field.type} placeholder={field.label} />
        </Form.Item>
      );
    });
  };

  // Render existing account view
  const renderAccountView = () => {
    if (!wiseAccount) {
      return (
        <Alert
          message="No Wise Account Connected"
          description="Connect your Wise account to receive international payments quickly and securely."
          type="info"
          showIcon
          icon={<BankOutlined />}
          action={
            <Button type="primary" onClick={() => setIsEditing(true)}>
              Connect Wise Account
            </Button>
          }
        />
      );
    }

    return (
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BankOutlined
              style={{ fontSize: "24px", color: tokens.colors.primary.main }}
            />
            <Title level={4} style={{ margin: 0 }}>
              Wise Account Connected
            </Title>
            {wiseAccount.verified && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Verified
              </Tag>
            )}
          </div>
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Remove
            </Button>
          </Space>
        </div>

        <Descriptions column={isMobile ? 1 : 2} bordered>
          <Descriptions.Item label="Account Holder">
            {wiseAccount.accountHolderName}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {wiseAccount.currency}
          </Descriptions.Item>
          <Descriptions.Item label="Country">
            {wiseAccount.country}
          </Descriptions.Item>
          <Descriptions.Item label="Account Type">
            {wiseAccount.accountType}
          </Descriptions.Item>
          <Descriptions.Item label="Connected At" span={2}>
            {new Date(wiseAccount.connectedAt).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  return (
    <ResponsiveContainer>
      <Title
        level={isMobile ? 3 : 2}
        style={{ marginBottom: isMobile ? "16px" : "24px" }}
      >
        Wise Account Settings
      </Title>

      <Paragraph>
        Connect your Wise account to receive international payments with low
        fees and fast transfers. Your account information is securely stored and
        encrypted.
      </Paragraph>

      {!isEditing && renderAccountView()}

      {isEditing && (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              currency: "USD",
              country: "US",
            }}
          >
            {/* Basic Information */}
            <Title level={5}>Basic Information</Title>

            <Form.Item
              label="Account Holder Name"
              name="accountHolderName"
              rules={[
                { required: true, message: "Account holder name is required" },
              ]}
            >
              <Input size="large" placeholder="John Doe" />
            </Form.Item>

            <Form.Item
              label="Currency"
              name="currency"
              rules={[{ required: true, message: "Currency is required" }]}
            >
              <Select
                size="large"
                placeholder="Select currency"
                onChange={handleCurrencyChange}
              >
                <Select.Option value="USD">USD - US Dollar</Select.Option>
                <Select.Option value="EUR">EUR - Euro</Select.Option>
                <Select.Option value="GBP">GBP - British Pound</Select.Option>
                <Select.Option value="CAD">CAD - Canadian Dollar</Select.Option>
                <Select.Option value="AUD">
                  AUD - Australian Dollar
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Country"
              name="country"
              rules={[{ required: true, message: "Country is required" }]}
            >
              <Select
                size="large"
                placeholder="Select country"
                onChange={setSelectedCountry}
              >
                <Select.Option value="US">United States</Select.Option>
                <Select.Option value="GB">United Kingdom</Select.Option>
                <Select.Option value="DE">Germany</Select.Option>
                <Select.Option value="FR">France</Select.Option>
                <Select.Option value="CA">Canada</Select.Option>
                <Select.Option value="AU">Australia</Select.Option>
              </Select>
            </Form.Item>

            {/* Account Details */}
            <Divider />
            <Title level={5}>Account Details</Title>

            {accountRequirements ? (
              renderAccountFields()
            ) : (
              <Alert
                message="Loading account requirements..."
                type="info"
                showIcon
              />
            )}

            {/* Form Actions */}
            <Divider />
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
                  loading={isSaving}
                  block={isMobile}
                >
                  Save Wise Account
                </Button>
                <Button
                  size="large"
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setIsEditing(false);
                    form.resetFields();
                  }}
                  block={isMobile}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </ResponsiveContainer>
  );
};
