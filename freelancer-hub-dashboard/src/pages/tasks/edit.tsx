import React from "react";
import { useOne, useUpdate, useGo, useList } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Space,
  Spin,
} from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import {
  parseDurationToHours,
  formatHoursToDuration,
} from "../../utils/duration";

const { TextArea } = Input;

export const TaskEdit: React.FC = () => {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const { mutate: updateTask, mutation } = useUpdate();
  const [form] = Form.useForm();
  const isMobile = useIsMobile();

  const {
    result: data,
    query: { isPending: isPendingTasks },
  } = useOne({
    resource: `projects/${projectId}/tasks`,
    id: id!,
  });

  // Fetch project members for assignee selection
  const {
    result: membersData,
    query: { isPending: isPendingMembers },
  } = useList({
    resource: `projects/${projectId}/members`,
    pagination: { pageSize: 100 },
  });

  const task = data?.data;
  const members = membersData?.data || [];

  React.useEffect(() => {
    if (task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
        estimatedHours: formatHoursToDuration(task.estimatedHours) || "",
        assigneeId: task.assignee?.id,
      });
    }
  }, [task, form]);

  const onFinish = (values: any) => {
    const taskData = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate?.format("YYYY-MM-DD"),
      estimatedHours: parseDurationToHours(values.estimatedHours),
      assigneeId: values.assigneeId,
    };

    updateTask(
      {
        resource: `projects/${projectId}/tasks`,
        id: id!,
        values: taskData,
      },
      {
        onSuccess: () => {
          go({
            to: `/tenants/${tenantSlug}/projects/${projectId}/tasks`,
            type: "push",
          });
        },
      }
    );
  };

  if (isPendingTasks || isPendingMembers) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      <Card title="Edit Task">
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

          <Form.Item label="Status" name="status">
            <Select size={isMobile ? "middle" : "large"}>
              <Select.Option value="todo">To Do</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="review">Review</Select.Option>
              <Select.Option value="done">Done</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Priority" name="priority">
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

          <Form.Item
            label="Estimated Hours (e.g., 2h, 1d, 1w, 1h 30m)"
            name="estimatedHours"
          >
            <Input
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              placeholder="e.g., 2h, 1d, 1w, 1h 30m"
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
                Save Changes
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
