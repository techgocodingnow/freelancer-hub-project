import React, { useState, useEffect } from "react";
import { useRegister, useGo } from "@refinedev/core";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Radio,
  Select,
  Alert,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { Api } from "../../services/api";
import { useIsMobile } from "../../hooks/useMediaQuery";

const { Title, Text, Link } = Typography;
const { Option } = Select;

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

export const Register = () => {
  const { mutate: register, isPending } = useRegister();
  const go = useGo();
  const [form] = Form.useForm();
  const [registrationType, setRegistrationType] = useState<"create" | "join">(
    "create"
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch available tenants for joining
  useEffect(() => {
    if (registrationType === "join") {
      fetchTenants();
    }
  }, [registrationType]);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const tenantList = await Api.getTenants();
      const tenants = tenantList.data.data;
      setTenants(tenants || []);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const onFinish = (values: any) => {
    setError(null);

    const registrationData: any = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    };

    if (registrationType === "create") {
      // Creating a new tenant
      registrationData.tenantName = values.tenantName;
      registrationData.tenantSlug = values.tenantSlug;
    } else {
      // Joining an existing tenant
      registrationData.tenantId = values.tenantId;
    }

    register(registrationData, {
      onError: (error: any) => {
        setError(error?.message || "Registration failed");
      },
    });
  };

  // Auto-generate slug from tenant name
  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setFieldsValue({ tenantSlug: slug });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
        padding: isMobile ? "16px" : "24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Space
          direction="vertical"
          size={isMobile ? "middle" : "large"}
          style={{ width: "100%" }}
        >
          <div style={{ textAlign: "center" }}>
            <Title level={isMobile ? 3 : 2}>Create Account</Title>
            <Text type="secondary">
              Join Freelancer Hub and start managing your projects
            </Text>
          </div>

          {error && (
            <Alert
              message="Registration Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            {/* User Information */}
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter your full name" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="John Doe"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="john@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
                {
                  min: 8,
                  message: "Password must be at least 8 characters",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Minimum 8 characters"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Re-enter your password"
                size="large"
              />
            </Form.Item>

            <Divider />

            {/* Tenant Selection */}
            <Form.Item label="Organization Setup">
              <Radio.Group
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio value="create">
                    <Space>
                      <TeamOutlined />
                      Create a new organization
                    </Space>
                  </Radio>
                  <Radio value="join">
                    <Space>
                      <GlobalOutlined />
                      Join an existing organization
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {registrationType === "create" && (
              <>
                <Form.Item
                  name="tenantName"
                  label="Organization Name"
                  rules={[
                    {
                      required: true,
                      message: "Please enter organization name",
                    },
                  ]}
                >
                  <Input
                    prefix={<TeamOutlined />}
                    placeholder="Acme Corporation"
                    size="large"
                    onChange={handleTenantNameChange}
                  />
                </Form.Item>

                <Form.Item
                  name="tenantSlug"
                  label="Organization URL"
                  extra="This will be used in your organization's URL"
                  rules={[
                    {
                      required: true,
                      message: "Please enter organization URL",
                    },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message:
                        "Only lowercase letters, numbers, and hyphens allowed",
                    },
                  ]}
                >
                  <Input
                    prefix={<GlobalOutlined />}
                    placeholder="acme-corp"
                    size="large"
                    addonBefore="/"
                  />
                </Form.Item>
              </>
            )}

            {registrationType === "join" && (
              <Form.Item
                name="tenantId"
                label="Select Organization"
                rules={[
                  {
                    required: true,
                    message: "Please select an organization",
                  },
                ]}
              >
                <Select
                  placeholder="Choose an organization to join"
                  size="large"
                  loading={loadingTenants}
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children as unknown;
                    if (typeof children === "string") {
                      return children
                        .toLowerCase()
                        .includes(input.toLowerCase());
                    }
                    return false;
                  }}
                >
                  {tenants.map((tenant) => (
                    <Option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isPending}
              >
                Create Account
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text>
                Already have an account?{" "}
                <Link onClick={() => go({ to: "/login", type: "push" })}>
                  Sign in
                </Link>
              </Text>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
