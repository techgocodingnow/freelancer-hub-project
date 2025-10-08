import React, { useState } from "react";
import { useList, useGo, useGetIdentity } from "@refinedev/core";
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Typography,
  Select,
  DatePicker,
  Row,
  Col,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
  createdAt: string;
  updatedAt: string;
}

export const TimesheetsList: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const { data: identity } = useGetIdentity();

  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const isAdmin = identity?.role === "admin" || identity?.role === "owner";

  // Build filters
  const filters: any[] = [];
  if (statusFilter) {
    filters.push({
      field: "status",
      operator: "eq",
      value: statusFilter,
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
      pageSize: 20,
    },
    filters,
  });

  const timesheets = result?.data || [];
  const meta = result?.meta;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <EditOutlined />;
      case "submitted":
      case "pending_approval":
        return <ClockCircleOutlined />;
      case "approved":
        return <CheckCircleOutlined />;
      case "rejected":
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      // TODO: Implement submit API call
      message.open({
        type: "success",
        content: "Timesheet submitted successfully",
      });
      refetch();
    } catch {
      message.open({
        type: "error",
        content: "Failed to submit timesheet",
      });
    }
  };

  const columns = [
    {
      title: "Week",
      dataIndex: "weekStartDate",
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
    ...(isAdmin
      ? [
          {
            title: "User",
            dataIndex: ["user", "fullName"],
            key: "user",
            render: (_: any, record: Timesheet) => (
              <div>
                <div>{record.user.fullName}</div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {record.user.email}
                </div>
              </div>
            ),
          },
        ]
      : []),
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
      title: "Regular / OT",
      key: "hours",
      render: (_: any, record: Timesheet) => (
        <div>
          <div>{Number(record.regularHours || 0).toFixed(2)}h</div>
          {Number(record.overtimeHours || 0) > 0 && (
            <div style={{ fontSize: "12px", color: "#ff4d4f" }}>
              +{Number(record.overtimeHours || 0).toFixed(2)}h OT
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Billable",
      dataIndex: "billableHours",
      key: "billableHours",
      render: (hours: number) => `${Number(hours || 0).toFixed(2)}h`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (date: string | null) =>
        date ? dayjs(date).format("MMM DD, YYYY") : "-",
    },
    ...(isAdmin
      ? [
          {
            title: "Approver",
            key: "approver",
            render: (_: any, record: Timesheet) =>
              record.approver ? record.approver.fullName : "-",
          },
        ]
      : []),
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
          {record.status === "draft" && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() =>
                  go({
                    to: `/tenants/${tenantSlug}/timesheets/${record.id}/edit`,
                    type: "push",
                  })
                }
              >
                {isMobile ? "" : "Edit"}
              </Button>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmit(record.id)}
              >
                {isMobile ? "" : "Submit"}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

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
        <Title level={isMobile ? 3 : 2}>
          <ClockCircleOutlined /> Timesheets
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            go({
              to: `/tenants/${tenantSlug}/timesheets/create`,
              type: "push",
            })
          }
          size={isMobile ? "middle" : "large"}
        >
          {isMobile ? "New" : "New Timesheet"}
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "Draft", value: "draft" },
                { label: "Submitted", value: "submitted" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
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

      {/* Table */}
      <Card>
        <Table
          dataSource={timesheets}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: isMobile ? 1000 : undefined }}
          pagination={{
            total: meta?.total,
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} timesheets`,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
