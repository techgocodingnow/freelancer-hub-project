import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  message,
  Space,
  InputNumber,
  Alert,
  FormInstance,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { BaseRecord } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import dayjs, { Dayjs } from "dayjs";

const { TextArea } = Input;

export interface TimeEntryFormValues {
  projectId: number;
  taskId: number;
  date: Dayjs;
  startTime?: Dayjs;
  endTime?: Dayjs;
  durationMinutes?: number;
  description: string;
  notes?: string;
  billable: boolean;
}

export interface TimeEntryFormProps {
  form: FormInstance<TimeEntryFormValues>;
  initialValues?: Partial<TimeEntryFormValues>;
  onFinish: (values: TimeEntryFormValues) => void;
  submitButtonText: string;
  submitButtonLoading: boolean;
  onCancel: () => void;
  projects: BaseRecord[];
  tasks: BaseRecord[];
  selectedProject?: number;
  onProjectChange: (projectId: number) => void;
  isLoadingProjects?: boolean;
  isLoadingTasks?: boolean;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  form,
  initialValues,
  onFinish,
  submitButtonText,
  submitButtonLoading,
  onCancel,
  projects,
  tasks,
  selectedProject,
  onProjectChange,
}) => {
  const isMobile = useIsMobile();
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    null
  );

  // Calculate duration when start/end times change
  const handleTimeChange = () => {
    const startTime = form.getFieldValue("startTime");
    const endTime = form.getFieldValue("endTime");
    const date = form.getFieldValue("date") || dayjs();

    if (startTime && endTime) {
      const start = dayjs(date)
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0);
      const end = dayjs(date)
        .hour(endTime.hour())
        .minute(endTime.minute())
        .second(0);

      if (end.isAfter(start)) {
        const durationMinutes = end.diff(start, "minutes");
        setCalculatedDuration(durationMinutes);
        form.setFieldValue("durationMinutes", durationMinutes);
      } else if (end.isBefore(start) || end.isSame(start)) {
        setCalculatedDuration(null);
        message.warning("End time must be after start time");
      }
    } else {
      setCalculatedDuration(null);
    }
  };

  const handleProjectChangeInternal = (value: number) => {
    onProjectChange(value);
    // Clear task selection when project changes
    form.setFieldValue("taskId", undefined);
  };

  return (
    <>
      <Alert
        message="Time Entry Options"
        description="You can either specify start and end times (which will auto-calculate duration), or directly enter the duration in minutes."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Form.Item
          label="Project"
          name="projectId"
          rules={[{ required: true, message: "Please select a project" }]}
        >
          <Select
            placeholder="Select project"
            size="large"
            onChange={handleProjectChangeInternal}
            showSearch
            optionFilterProp="children"
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Task"
          name="taskId"
          rules={[{ required: true, message: "Please select a task" }]}
        >
          <Select
            placeholder="Select task"
            size="large"
            disabled={!selectedProject}
            showSearch
            optionFilterProp="children"
          >
            {tasks.map((task) => (
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
            label="Start Time (Optional)"
            name="startTime"
            style={{ marginBottom: 0, flex: 1 }}
          >
            <TimePicker
              format="HH:mm"
              size="large"
              style={{ width: isMobile ? "100%" : "200px" }}
              onChange={handleTimeChange}
            />
          </Form.Item>

          <Form.Item
            label="End Time (Optional)"
            name="endTime"
            style={{ marginBottom: 0, flex: 1 }}
          >
            <TimePicker
              format="HH:mm"
              size="large"
              style={{ width: isMobile ? "100%" : "200px" }}
              onChange={handleTimeChange}
            />
          </Form.Item>
        </Space>

        {calculatedDuration !== null && (
          <Alert
            message={`Calculated Duration: ${(calculatedDuration / 60).toFixed(
              2
            )} hours (${calculatedDuration} minutes)`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form.Item
          label="Duration (Minutes)"
          name="durationMinutes"
          help="Enter duration directly if you don't specify start/end times"
        >
          <InputNumber
            min={1}
            max={1440}
            size="large"
            style={{ width: "100%" }}
            placeholder="Enter duration in minutes"
            disabled={calculatedDuration !== null}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please enter a description" },
            { min: 3, message: "Description must be at least 3 characters" },
          ]}
        >
          <TextArea rows={3} placeholder="What did you work on?" size="large" />
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
              loading={submitButtonLoading}
            >
              {submitButtonText}
            </Button>
            <Button size="large" onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};
