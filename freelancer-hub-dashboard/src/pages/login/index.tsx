import React, { useState } from "react";
import { useGo, useLogin } from "@refinedev/core";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Checkbox,
} from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useIsMobile } from "../../hooks/useMediaQuery";

const { Title, Text, Link } = Typography;

export const Login = () => {
  const { mutate: login, isPending } = useLogin();
  const go = useGo();
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const onFinish = (values: any) => {
    setError(null);
    login(
      {
        email: values.email,
        password: values.password,
      },
      {
        onError: (error: any) => {
          setError(error?.message || "Login failed");
        },
      }
    );
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
          maxWidth: "400px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Space
          direction="vertical"
          size={isMobile ? "middle" : "large"}
          style={{ width: "100%" }}
        >
          <div style={{ textAlign: "center" }}>
            <Title level={isMobile ? 3 : 2}>Welcome Back</Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
            <Alert
              message="Login Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{
              remember: true,
            }}
          >
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
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Link>Forgot password?</Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isPending}
              >
                Sign In
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text>
                Don't have an account?{" "}
                <Link onClick={() => go({ to: "/register", type: "push" })}>
                  Sign up
                </Link>
              </Text>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
