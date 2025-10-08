import React from "react";
import { useCreate, useList, useGo } from "@refinedev/core";
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
  message,
} from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";

const { TextArea } = Input;

export const TaskCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: createTask, mutation } = useCreate();
  const [form] = Form.useForm();
  const isMobile = useIsMobile();

  // Fetch project members for assignee selection
  const { result: membersData } = useList({
    resource: `projects/${projectId}/members`,
    pagination: { pageSize: 100 },
  });

  const members = membersData?.data || [];

  const onFinish = (values: any) => {
    const taskData = {
      title: values.title,
      description: values.description,
      status: values.status || "todo",
      priority: values.priority || "medium",
      dueDate: values.dueDate?.format("YYYY-MM-DD"),
      estimatedHours: values.estimatedHours,
      assigneeId: values.assigneeId,
    };

    createTask(
      {
        resource: `projects/${projectId}/tasks`,
        values: taskData,
      },
      {
        onSuccess: () => {
          message.open({
            type: "success",
            content: "Task created successfully",
          });
          go({
            to: `/tenants/${tenantSlug}/projects/${projectId}/tasks`,
            type: "push",
          });
        },
        onError: (error: any) => {
          message.open({
            type: "error",
            content: error?.message || "Failed to create task",
          });
        },
      }
    );
  };

  return (
    <ResponsiveContainer maxWidth="lg">
      <Card title="Create New Task">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Task Title"
            name="title"
            rules={[{ required: true, message: "Please enter task title" }]}
          >
            <Input
              placeholder="Enter task title"
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea
              rows={4}
              placeholder="Enter task description"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item label="Status" name="status" initialValue="todo">
            <Select size={isMobile ? "middle" : "large"}>
              <Select.Option value="todo">To Do</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="review">Review</Select.Option>
              <Select.Option value="done">Done</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Priority" name="priority" initialValue="medium">
            <Select size={isMobile ? "middle" : "large"}>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Assignee" name="assigneeId">
            <Select
              size={isMobile ? "middle" : "large"}
              placeholder="Select assignee"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {members.map((member: any) => (
                <Select.Option key={member.user.id} value={member.user.id}>
                  {member.user.fullName} ({member.user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Due Date" name="dueDate">
            <DatePicker
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item label="Estimated Hours" name="estimatedHours">
            <InputNumber
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              min={0}
              step={0.5}
              placeholder="Enter estimated hours"
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
                loading={mutation.isPending}
                size={isMobile ? "middle" : "large"}
                block={isMobile}
              >
                Create Task
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/projects/${projectId}/tasks`,
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
