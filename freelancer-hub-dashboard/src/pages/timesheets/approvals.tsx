import React, { useState } from "react";
import {
  useList,
  useGo,
  useCustomMutation,
  useGetIdentity,
} from "@refinedev/core";
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Typography,
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  message,
  Select,
  Checkbox,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

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
  createdAt: string;
  updatedAt: string;
}

export const TimesheetsApprovals: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const { data: identity } = useGetIdentity();
  const [rejectForm] = Form.useForm();

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [userFilter, setUserFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("submitted");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingTimesheetId, setRejectingTimesheetId] = useState<
    number | null
  >(null);

  const isAdmin = identity?.role === "admin" || identity?.role === "owner";

  // Redirect if not admin
  React.useEffect(() => {
    if (identity && !isAdmin) {
      message.error("You don't have permission to access this page");
      go({ to: `/tenants/${tenantSlug}/timesheets`, type: "replace" });
    }
  }, [identity, isAdmin, go, tenantSlug]);

  // Build filters
  const filters: any[] = [
    {
      field: "status",
      operator: "eq",
      value: statusFilter,
    },
  ];

  if (userFilter) {
    filters.push({
      field: "user_id",
      operator: "eq",
      value: userFilter,
    });
  }

  if (dateRange) {
    filters.push({
      field: "week_start_date",
      operator: "gte",
      value: dateRange[0].format("YYYY-MM-DD"),
    });
    filters.push({
      field: "week_end_date",
      operator: "lte",
      value: dateRange[1].format("YYYY-MM-DD"),
    });
  }

  const {
    result,
    query: { isLoading, refetch },
  } = useList<Timesheet>({
    resource: "timesheets",
    pagination: {
      pageSize: 50,
    },
    filters,
  });

  const { mutate: approveTimesheet, isLoading: isApproving } =
    useCustomMutation();
  const { mutate: rejectTimesheet, isLoading: isRejecting } =
    useCustomMutation();

  const timesheets = result?.data || [];
  const meta = result?.meta;

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Map(timesheets.map((t) => [t.userId, t.user])).values()
  );

  const handleApprove = (id: number) => {
    Modal.confirm({
      title: "Approve Timesheet",
      content: "Are you sure you want to approve this timesheet?",
      okText: "Approve",
      okType: "primary",
      onOk: () => {
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
              setSelectedRowKeys(selectedRowKeys.filter((key) => key !== id));
            },
            onError: (error: any) => {
              message.error(
                error?.response?.data?.error || "Failed to approve timesheet"
              );
            },
          }
        );
      },
    });
  };

  const handleReject = (id: number) => {
    setRejectingTimesheetId(id);
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = () => {
    rejectForm.validateFields().then((values) => {
      if (!rejectingTimesheetId) return;

      rejectTimesheet(
        {
          url: `${
            import.meta.env.VITE_API_URL
          }/timesheets/${rejectingTimesheetId}/reject`,
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
            setRejectingTimesheetId(null);
            refetch();
            setSelectedRowKeys(
              selectedRowKeys.filter((key) => key !== rejectingTimesheetId)
            );
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

  const handleBulkApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select timesheets to approve");
      return;
    }

    Modal.confirm({
      title: "Bulk Approve Timesheets",
      content: `Are you sure you want to approve ${selectedRowKeys.length} timesheet(s)?`,
      okText: "Approve All",
      okType: "primary",
      onOk: async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const id of selectedRowKeys) {
          try {
            await new Promise((resolve, reject) => {
              approveTimesheet(
                {
                  url: `${
                    import.meta.env.VITE_API_URL
                  }/timesheets/${id}/approve`,
                  method: "post",
                  values: {},
                },
                {
                  onSuccess: () => {
                    successCount++;
                    resolve(true);
                  },
                  onError: () => {
                    errorCount++;
                    reject();
                  },
                }
              );
            });
          } catch (error) {
            // Error already counted
          }
        }

        if (successCount > 0) {
          message.success(`${successCount} timesheet(s) approved successfully`);
        }
        if (errorCount > 0) {
          message.error(`Failed to approve ${errorCount} timesheet(s)`);
        }

        refetch();
        setSelectedRowKeys([]);
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: any, record: Timesheet) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            <UserOutlined style={{ marginRight: "8px" }} />
            {record.user.fullName}
          </div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.user.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Week",
      key: "week",
      render: (_: any, record: Timesheet) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {dayjs(record.weekStartDate).format("MMM DD")} -{" "}
            {dayjs(record.weekEndDate).format("MMM DD, YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (hours: number) => (
        <span style={{ fontWeight: 500 }}>
          {Number(hours || 0).toFixed(2)}h
        </span>
      ),
    },
    {
      title: "Billable",
      dataIndex: "billableHours",
      key: "billableHours",
      render: (hours: number) => `${Number(hours || 0).toFixed(2)}h`,
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (date: string | null) =>
        date ? dayjs(date).format("MMM DD, YYYY HH:mm") : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Timesheet) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/timesheets/${record.id}`,
                type: "push",
              })
            }
          >
            {isMobile ? "" : "View"}
          </Button>
          {record.status === "submitted" && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
                style={{ color: "#52c41a" }}
              >
                {isMobile ? "" : "Approve"}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
              >
                {isMobile ? "" : "Reject"}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const pendingCount = timesheets.filter(
    (t) => t.status === "submitted"
  ).length;
  const totalHours = timesheets.reduce(
    (sum, t) => sum + Number(t.totalHours || 0),
    0
  );
  const billableHours = timesheets.reduce(
    (sum, t) => sum + Number(t.billableHours || 0),
    0
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: "24px",
          gap: isMobile ? "12px" : "0",
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
            <ClockCircleOutlined /> Timesheet Approvals
          </Title>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Hours"
              value={totalHours.toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Billable Hours"
              value={billableHours.toFixed(2)}
              suffix="h"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "Submitted", value: "submitted" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by user"
              allowClear
              showSearch
              style={{ width: "100%" }}
              value={userFilter}
              onChange={setUserFilter}
              optionFilterProp="children"
            >
              {uniqueUsers.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.fullName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              format="MMM DD, YYYY"
            />
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: "16px", backgroundColor: "#e6f7ff" }}>
          <Space>
            <Text strong>{selectedRowKeys.length} selected</Text>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleBulkApprove}
              loading={isApproving}
            >
              Approve Selected
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>
              Clear Selection
            </Button>
          </Space>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          dataSource={timesheets}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: isMobile ? 1000 : undefined }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== "submitted",
            }),
          }}
          pagination={{
            total: meta?.total,
            pageSize: 50,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} timesheets`,
          }}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Timesheet"
        open={isRejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setIsRejectModalOpen(false);
          rejectForm.resetFields();
          setRejectingTimesheetId(null);
        }}
        okText="Reject"
        okButtonProps={{ danger: true, loading: isRejecting }}
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
