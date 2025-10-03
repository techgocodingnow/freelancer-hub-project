import React from "react";
import {
  useGo,
  useOne,
  useCustomMutation,
  useGetIdentity,
} from "@refinedev/core";
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
  Descriptions,
  Modal,
  Form,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TimeEntry {
  id: number;
  taskId: number;
  date: string;
  durationMinutes: number;
  billable: boolean;
  notes: string | null;
  task: {
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
  userId: number;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  weekStartDate: string;
  weekEndDate: string;
  status: "draft" | "submitted" | "pending_approval" | "approved" | "rejected";
  totalHours: number;
  billableHours: number;
  regularHours: number;
  overtimeHours: number;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  approverId: number | null;
  approver: {
    id: number;
    fullName: string;
  } | null;
  rejectionReason: string | null;
  timeEntries: TimeEntry[];
}

export const TimesheetsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const { data: identity } = useGetIdentity<any>();
  const [rejectForm] = Form.useForm();
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);

  const {
    data: timesheetData,
    isLoading,
    refetch,
  } = useOne<Timesheet>({
    resource: "timesheets",
    id: id!,
  });

  const { mutate: approveTimesheet } = useCustomMutation();
  const { mutate: rejectTimesheet } = useCustomMutation();
  const { mutate: reopenTimesheet } = useCustomMutation();

  const timesheet = timesheetData?.data;
  const isAdmin = identity?.role === "admin" || identity?.role === "owner";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "submitted":
      case "pending_approval":
        return "processing";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const handleApprove = () => {
    approveTimesheet(
      {
        url: `${import.meta.env.VITE_API_URL}/timesheets/${id}/approve`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Timesheet approved successfully");
          refetch();
        },
        onError: (error: any) => {
          message.error(
            error?.response?.data?.error || "Failed to approve timesheet"
          );
        },
      }
    );
  };

  const handleReject = () => {
    rejectForm.validateFields().then((values) => {
      rejectTimesheet(
        {
          url: `${import.meta.env.VITE_API_URL}/timesheets/${id}/reject`,
          method: "post",
          values: {
            reason: values.reason,
          },
        },
        {
          onSuccess: () => {
            message.success("Timesheet rejected");
            setIsRejectModalOpen(false);
            rejectForm.resetFields();
            refetch();
          },
          onError: (error: any) => {
            message.error(
              error?.response?.data?.error || "Failed to reject timesheet"
            );
          },
        }
      );
    });
  };

  const handleReopen = () => {
    reopenTimesheet(
      {
        url: `${import.meta.env.VITE_API_URL}/timesheets/${id}/reopen`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Timesheet reopened");
          refetch();
        },
        onError: (error: any) => {
          message.error(
            error?.response?.data?.error || "Failed to reopen timesheet"
          );
        },
      }
    );
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY (ddd)"),
    },
    {
      title: "Task",
      key: "task",
      render: (_: any, record: TimeEntry) => (
        <div>
          <div>{record.task.title}</div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.task.project.name}
          </Text>
        </div>
      ),
    },
    {
      title: "Hours",
      dataIndex: "durationMinutes",
      key: "hours",
      render: (minutes: number) => (
        <span style={{ fontWeight: 500 }}>
          {(Number(minutes || 0) / 60).toFixed(2)}h
        </span>
      ),
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
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!timesheet) {
    return <div>Timesheet not found</div>;
  }

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" })
            }
          />
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Timesheet Details
          </Title>
        </div>
        <Space>
          {timesheet.status === "draft" && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                go({
                  to: `/tenants/${tenantSlug}/timesheets/${id}/edit`,
                  type: "push",
                })
              }
            >
              Edit
            </Button>
          )}
          {isAdmin && timesheet.status === "submitted" && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setIsRejectModalOpen(true)}
              >
                Reject
              </Button>
            </>
          )}
          {isAdmin &&
            (timesheet.status === "approved" ||
              timesheet.status === "rejected") && (
              <Button icon={<UndoOutlined />} onClick={handleReopen}>
                Reopen
              </Button>
            )}
        </Space>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={Number(timesheet.totalHours || 0).toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Billable Hours"
              value={Number(timesheet.billableHours || 0).toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Regular Hours"
              value={Number(timesheet.regularHours || 0).toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overtime Hours"
              value={Number(timesheet.overtimeHours || 0).toFixed(2)}
              suffix="h"
              valueStyle={{
                color:
                  Number(timesheet.overtimeHours || 0) > 0
                    ? "#ff4d4f"
                    : undefined,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Timesheet Info */}
      <Card title="Timesheet Information" style={{ marginBottom: "16px" }}>
        <Descriptions column={isMobile ? 1 : 2} bordered>
          <Descriptions.Item label="Week">
            {dayjs(timesheet.weekStartDate).format("MMM DD")} -{" "}
            {dayjs(timesheet.weekEndDate).format("MMM DD, YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(timesheet.status)}>
              {timesheet.status.replace("_", " ").toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="User">
            <div>
              <div>{timesheet.user.fullName}</div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {timesheet.user.email}
              </Text>
            </div>
          </Descriptions.Item>
          {timesheet.submittedAt && (
            <Descriptions.Item label="Submitted At">
              {dayjs(timesheet.submittedAt).format("MMM DD, YYYY HH:mm")}
            </Descriptions.Item>
          )}
          {timesheet.approver && (
            <Descriptions.Item label="Approver">
              {timesheet.approver.fullName}
            </Descriptions.Item>
          )}
          {timesheet.approvedAt && (
            <Descriptions.Item label="Approved At">
              {dayjs(timesheet.approvedAt).format("MMM DD, YYYY HH:mm")}
            </Descriptions.Item>
          )}
          {timesheet.rejectionReason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
              <Text type="danger">{timesheet.rejectionReason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Time Entries */}
      <Card title="Time Entries">
        <Table
          dataSource={timesheet.timeEntries}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: isMobile ? 800 : undefined }}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Timesheet"
        open={isRejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="Reason for Rejection"
            name="reason"
            rules={[
              { required: true, message: "Please provide a reason" },
              { min: 10, message: "Reason must be at least 10 characters" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why this timesheet is being rejected..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </ResponsiveContainer>
  );
};
