import React, { useState, useEffect } from "react";
import { useOne, useUpdate, useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Space,
  Spin,
} from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { Api } from "../../services/api";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: updateProject, mutation } = useUpdate();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const {
    result: project,
    query: { isLoading },
  } = useOne({
    resource: "projects",
    id: id!,
  });

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

  React.useEffect(() => {
    if (project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        status: project.status,
        customerId: project.customerId,
        dateRange:
          project.startDate && project.endDate
            ? [dayjs(project.startDate), dayjs(project.endDate)]
            : undefined,
        budget: project.budget,
      });
    }
  }, [project, form]);

  const onFinish = (values: any) => {
    const projectData = {
      name: values.name,
      description: values.description,
      status: values.status,
      customerId: values.customerId,
      startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
      budget: values.budget,
    };

    updateProject(
      {
        resource: "projects",
        id: id!,
        values: projectData,
      },
      {
        onSuccess: () => {
          go({
            to: `/tenants/${tenantSlug}/projects/${id}/show`,
            type: "push",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Card title="Edit Project">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project Name"
            name="name"
            rules={[{ required: true, message: "Please enter project name" }]}
          >
            <Input placeholder="Enter project name" size="large" />
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
              size="large"
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

          <Form.Item label="Status" name="status">
            <Select size="large">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Project Duration" name="dateRange">
            <RangePicker style={{ width: "100%" }} size="large" />
          </Form.Item>

          <Form.Item label="Budget" name="budget">
            <InputNumber
              style={{ width: "100%" }}
              size="large"
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
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={mutation.isPending}
                size="large"
              >
                Save Changes
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${id}/show`,
                    type: "push",
                  })
                }
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
