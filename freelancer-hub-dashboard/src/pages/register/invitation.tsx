import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Spin,
  Divider,
  Tag,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Api } from "../../services/api";
import type { ValidateInvitationResponse } from "../../services/api/types";

const { Title, Text, Paragraph } = Typography;

export const InvitationRegister: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitationData, setInvitationData] =
    useState<ValidateInvitationResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError("Invalid invitation link");
      setValidating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateInvitation = async () => {
    if (!token) return;

    setValidating(true);
    setError(null);

    try {
      const response = await Api.validateInvitationToken(token);
      setInvitationData(response.data.data);
      // Pre-fill email
      form.setFieldsValue({ email: response.data.data.email });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "Invalid or expired invitation";
      setError(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const onFinish = async (values: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await Api.register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        invitationToken: token,
      });

      // Store auth data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect to tenant
      const tenantSlug = response.data.user.defaultTenant?.slug;
      if (tenantSlug) {
        localStorage.setItem("tenantSlug", tenantSlug);
        navigate(`/tenants/${tenantSlug}/projects`);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Card style={{ width: 400, textAlign: "center" }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>
            Validating invitation...
          </Paragraph>
        </Card>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Card style={{ width: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <CloseCircleOutlined
              style={{ fontSize: 64, color: "#ff4d4f" }}
            />
            <Title level={3} style={{ marginTop: 16 }}>
              Invalid Invitation
            </Title>
          </div>
          <Alert
            message="Invitation Error"
            description={error}
            type="error"
            showIcon
          />
          <Button
            type="primary"
            block
            size="large"
            style={{ marginTop: 24 }}
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 500 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <CheckCircleOutlined
            style={{ fontSize: 64, color: "#52c41a" }}
          />
          <Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
            You're Invited!
          </Title>
          <Text type="secondary">
            Complete your registration to join the team
          </Text>
        </div>

        {invitationData && (
          <Alert
            message="Invitation Details"
            description={
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div>
                  <TeamOutlined /> <strong>Organization:</strong>{" "}
                  {invitationData.tenant.name}
                </div>
                <div>
                  <UserOutlined /> <strong>Role:</strong>{" "}
                  <Tag color="blue">
                    {invitationData.role.name.toUpperCase()}
                  </Tag>
                </div>
                {invitationData.project && (
                  <div>
                    <strong>Project:</strong> {invitationData.project.name}
                  </div>
                )}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Expires:{" "}
                    {new Date(invitationData.expiresAt).toLocaleDateString()}
                  </Text>
                </div>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
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
              disabled
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

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Create Account & Join
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary">
            Already have an account?{" "}
            <a href="/login">Sign in instead</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

