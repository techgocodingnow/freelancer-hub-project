import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  message,
  Typography,
  Space,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useCreate, useList, useGo } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import { useTenantSlug } from "../../contexts/tenant";

const { Title } = Typography;
const { TextArea } = Input;

export const TimeEntryCreate: React.FC = () => {
  const [form] = Form.useForm();
  const isMobile = useIsMobile();
  const go = useGo();
  const tenantSlug = useTenantSlug();
  const { mutate: createEntry, isLoading: isCreating } = useCreate();

  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  // Fetch projects
  const { data: projectsData } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  // Fetch tasks for selected project
  const { data: tasksData } = useList({
    resource: `projects/${selectedProject}/tasks`,
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: !!selectedProject,
    },
  });

  const handleSubmit = (values: any) => {
    const startTime = dayjs(values.date)
      .hour(values.startTime.hour())
      .minute(values.startTime.minute())
      .second(0);
    const endTime = dayjs(values.date)
      .hour(values.endTime.hour())
      .minute(values.endTime.minute())
      .second(0);

    // Validate end time is after start time
    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      message.error("End time must be after start time");
      return;
    }

    const payload = {
      project_id: values.project_id,
      task_id: values.task_id,
      date: values.date.format("YYYY-MM-DD"),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      description: values.description,
      notes: values.notes || null,
      billable: values.billable ?? true,
    };

    createEntry(
      {
        resource: "time-entries",
        values: payload,
      },
      {
        onSuccess: () => {
          message.success("Time entry created successfully");
          go({
            to: `/tenants/${tenantSlug}/time-entries`,
            type: "push",
          });
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to create time entry");
        },
      }
    );
  };

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: isMobile ? "16px" : "24px",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            go({ to: `/tenants/${tenantSlug}/time-entries`, type: "push" })
          }
        />
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Add Time Entry
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            billable: true,
          }}
        >
          <Form.Item
            label="Project"
            name="project_id"
            rules={[{ required: true, message: "Please select a project" }]}
          >
            <Select
              placeholder="Select project"
              size="large"
              onChange={(value) => {
                setSelectedProject(value);
                form.setFieldValue("task_id", undefined);
              }}
              showSearch
              optionFilterProp="children"
            >
              {projectsData?.data?.map((project: any) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Task"
            name="task_id"
            rules={[{ required: true, message: "Please select a task" }]}
          >
            <Select
              placeholder="Select task"
              size="large"
              disabled={!selectedProject}
              showSearch
              optionFilterProp="children"
            >
              {tasksData?.data?.map((task: any) => (
                <Select.Option key={task.id} value={task.id}>
                  {task.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker size="large" style={{ width: "100%" }} />
          </Form.Item>

          <Space
            direction={isMobile ? "vertical" : "horizontal"}
            style={{ width: "100%", marginBottom: "24px" }}
            size="large"
          >
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: true, message: "Please select start time" }]}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <TimePicker
                format="HH:mm"
                size="large"
                style={{ width: isMobile ? "100%" : "200px" }}
              />
            </Form.Item>

            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ required: true, message: "Please select end time" }]}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <TimePicker
                format="HH:mm"
                size="large"
                style={{ width: isMobile ? "100%" : "200px" }}
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please enter a description" },
              { min: 3, message: "Description must be at least 3 characters" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="What did you work on?"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Notes (Optional)" name="notes">
            <TextArea rows={2} placeholder="Additional notes..." size="large" />
          </Form.Item>

          <Form.Item label="Billable" name="billable" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={isCreating}
              >
                Create Time Entry
              </Button>
              <Button
                size="large"
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/time-entries`,
                    type: "push",
                  })
                }
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
