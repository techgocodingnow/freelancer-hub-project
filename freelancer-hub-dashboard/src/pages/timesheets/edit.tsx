import React, { useState, useEffect } from "react";
import { useGo, useOne, useUpdate, useList } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  message,
  Typography,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Switch,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TimeEntry {
  id?: number;
  taskId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  billable: boolean;
  notes: string | null;
  task?: {
    id: number;
    title: string;
    project: {
      id: number;
      name: string;
    };
  };
}

interface Timesheet {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  totalHours: number;
  billableHours: number;
  regularHours: number;
  overtimeHours: number;
  timeEntries: TimeEntry[];
}

export const TimesheetsEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const { data: timesheetData, isLoading } = useOne<Timesheet>({
    resource: "timesheets",
    id: id!,
  });

  const { data: tasksData } = useList({
    resource: "my-tasks",
    pagination: { pageSize: 100 },
  });

  const { mutate: updateTimesheet, isLoading: isUpdating } = useUpdate();

  const timesheet = timesheetData?.data;
  const tasks = tasksData?.data || [];

  useEffect(() => {
    if (timesheet?.timeEntries) {
      setTimeEntries(timesheet.timeEntries);
    }
  }, [timesheet]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      taskId: entry.taskId,
      date: dayjs(entry.date),
      durationMinutes: entry.durationMinutes,
      billable: entry.billable,
      notes: entry.notes,
    });
    setIsModalOpen(true);
  };

  const handleDeleteEntry = (index: number) => {
    const newEntries = timeEntries.filter((_, i) => i !== index);
    setTimeEntries(newEntries);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const newEntry: TimeEntry = {
        id: editingEntry?.id,
        taskId: values.taskId,
        date: values.date.format("YYYY-MM-DD"),
        startTime: null,
        endTime: null,
        durationMinutes: values.durationMinutes,
        billable: values.billable ?? true,
        notes: values.notes || null,
      };

      if (editingEntry) {
        const index = timeEntries.findIndex((e) => e.id === editingEntry.id);
        const newEntries = [...timeEntries];
        newEntries[index] = newEntry;
        setTimeEntries(newEntries);
      } else {
        setTimeEntries([...timeEntries, newEntry]);
      }

      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleSave = () => {
    updateTimesheet(
      {
        resource: "timesheets",
        id: id!,
        values: {
          timeEntries: timeEntries.map((entry) => ({
            id: entry.id,
            taskId: entry.taskId,
            date: entry.date,
            startTime: entry.startTime,
            endTime: entry.endTime,
            durationMinutes: entry.durationMinutes,
            billable: entry.billable,
            notes: entry.notes,
          })),
        },
      },
      {
        onSuccess: () => {
          message.open({
            type: "success",
            content: "Timesheet updated successfully",
          });
        },
        onError: (error: any) => {
          message.open({
            type: "error",
            content:
              error?.response?.data?.error || "Failed to update timesheet",
          });
        },
      }
    );
  };

  const handleSubmit = () => {
    // TODO: Implement submit API call
    message.open({
      type: "success",
      content: "Timesheet submitted for approval",
    });
    go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" });
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Task",
      dataIndex: "taskId",
      key: "task",
      render: (taskId: number, record: TimeEntry) => {
        const task = tasks.find((t: any) => t.id === taskId);
        return task ? (
          <div>
            <div>{task.title}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {task.project?.name}
            </Text>
          </div>
        ) : (
          taskId
        );
      },
    },
    {
      title: "Hours",
      dataIndex: "durationMinutes",
      key: "hours",
      render: (minutes: number) => (Number(minutes || 0) / 60).toFixed(2),
    },
    {
      title: "Billable",
      dataIndex: "billable",
      key: "billable",
      render: (billable: boolean) => (
        <Tag color={billable ? "green" : "default"}>
          {billable ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string | null) => notes || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TimeEntry, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditEntry(record)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEntry(index)}
          />
        </Space>
      ),
    },
  ];

  const totalHours = timeEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes / 60,
    0
  );
  const billableHours = timeEntries
    .filter((e) => e.billable)
    .reduce((sum, entry) => sum + entry.durationMinutes / 60, 0);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" })
          }
        />
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Edit Timesheet
        </Title>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Week"
              value={`${dayjs(timesheet?.weekStartDate).format(
                "MMM DD"
              )} - ${dayjs(timesheet?.weekEndDate).format("MMM DD")}`}
              valueStyle={{ fontSize: "16px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={Number(totalHours || 0).toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Billable Hours"
              value={Number(billableHours || 0).toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Status"
              value={timesheet?.status.replace("_", " ").toUpperCase()}
            />
          </Card>
        </Col>
      </Row>

      {/* Time Entries Table */}
      <Card
        title="Time Entries"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddEntry}
            disabled={timesheet?.status !== "draft"}
          >
            Add Entry
          </Button>
        }
      >
        <Table
          dataSource={timeEntries}
          columns={columns}
          rowKey={(record, index) => record.id?.toString() || `new-${index}`}
          pagination={false}
          scroll={{ x: isMobile ? 800 : undefined }}
        />
      </Card>

      {/* Action Buttons */}
      <Card style={{ marginTop: "16px" }}>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isUpdating}
            disabled={timesheet?.status !== "draft"}
          >
            Save Changes
          </Button>
          <Button
            icon={<SendOutlined />}
            onClick={handleSubmit}
            disabled={timesheet?.status !== "draft" || timeEntries.length === 0}
          >
            Submit for Approval
          </Button>
          <Button
            onClick={() =>
              go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" })
            }
          >
            Cancel
          </Button>
        </Space>
      </Card>

      {/* Add/Edit Entry Modal */}
      <Modal
        title={editingEntry ? "Edit Time Entry" : "Add Time Entry"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={isMobile ? "100%" : 600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Task"
            name="taskId"
            rules={[{ required: true, message: "Please select a task" }]}
          >
            <Select
              placeholder="Select a task"
              showSearch
              optionFilterProp="children"
            >
              {tasks.map((task: any) => (
                <Select.Option key={task.id} value={task.id}>
                  {task.title} - {task.project?.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Duration (minutes)"
            name="durationMinutes"
            rules={[{ required: true, message: "Please enter duration" }]}
          >
            <InputNumber
              min={1}
              max={1440}
              style={{ width: "100%" }}
              placeholder="Enter duration in minutes"
            />
          </Form.Item>

          <Form.Item label="Billable" name="billable" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Add notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </ResponsiveContainer>
  );
};
