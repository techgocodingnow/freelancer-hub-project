import React, { useState, useEffect } from "react";
import { useCreate, useGo } from "@refinedev/core";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Space,
  message,
} from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { Api } from "../../services/api";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const ProjectCreate: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const {
    mutate: createProject,
    mutation: { isPending },
  } = useCreate();
  const [form] = Form.useForm();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await Api.getCustomers({ isActive: true });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const onFinish = (values: {
    name: string;
    description: string;
    status: string;
    dateRange: [any, any];
    budget: number;
    customerId?: number;
  }) => {
    const projectData = {
      name: values.name,
      description: values.description,
      status: values.status || "active",
      startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
      budget: values.budget,
      customerId: values.customerId,
    };

    createProject(
      {
        resource: "projects",
        values: projectData,
      },
      {
        onSuccess: () => {
          go({ to: `/tenants/${tenantSlug}/projects`, type: "push" });
        },
      }
    );
  };

  return (
    <ResponsiveContainer maxWidth="lg">
      <Card title="Create New Project">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project Name"
            name="name"
            rules={[{ required: true, message: "Please enter project name" }]}
          >
            <Input
              placeholder="Enter project name"
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea
              rows={4}
              placeholder="Enter project description"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item label="Customer" name="customerId">
            <Select
              placeholder="Select a customer (optional)"
              size={isMobile ? "middle" : "large"}
              loading={loadingCustomers}
              showSearch
              allowClear
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

          <Form.Item label="Status" name="status" initialValue="active">
            <Select size={isMobile ? "middle" : "large"}>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Project Duration" name="dateRange">
            <RangePicker
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item label="Budget" name="budget">
            <InputNumber
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              min={0}
              step={100}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) as 0}
              placeholder="Enter budget"
            />
          </Form.Item>

          <Form.Item>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isPending}
                size={isMobile ? "middle" : "large"}
                block={isMobile}
              >
                Create Project
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects`,
                    type: "push",
                  })
                }
                size={isMobile ? "middle" : "large"}
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
