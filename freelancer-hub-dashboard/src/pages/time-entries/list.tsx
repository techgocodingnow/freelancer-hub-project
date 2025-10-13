import React, { useState } from "react";
import {
  Card,
  Table,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  Spin,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  useList,
  useDelete,
  useGo,
  useGetIdentity,
  useInvalidate,
} from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { useTenantSlug } from "../../contexts/tenant";
import dayjs, { Dayjs } from "dayjs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Color palette for charts
const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

interface TimeEntry {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
  notes?: string;
  billable: boolean;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  task: {
    id: number;
    title: string;
    project: {
      id: number;
      name: string;
    };
  };
}

export const TimeEntriesList: React.FC = () => {
  const isMobile = useIsMobile();
  const go = useGo();
  const tenantSlug = useTenantSlug();
  const { data: identity } = useGetIdentity();
  const { mutate: deleteEntry } = useDelete();
  const invalidate = useInvalidate();

  // Filters
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("week"),
    dayjs().endOf("week"),
  ]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [billableFilter, setBillableFilter] = useState<string | undefined>();

  // Check if user is admin
  const isAdmin =
    identity?.role?.name === "admin" || identity?.role?.name === "owner";

  // Fetch time entries using the new global endpoint
  const {
    result: timeEntriesData,
    query: { isLoading, refetch },
  } = useList<TimeEntry>({
    resource: "time-entries",
    filters: [
      {
        field: "view_mode",
        operator: "eq",
        value: viewMode,
      },
      {
        field: "start_date",
        operator: "eq",
        value: dateRange[0].format("YYYY-MM-DD"),
      },
      {
        field: "end_date",
        operator: "eq",
        value: dateRange[1].format("YYYY-MM-DD"),
      },
      ...(selectedUser
        ? [{ field: "user_id", operator: "eq" as const, value: selectedUser }]
        : []),
      ...(selectedProject
        ? [
            {
              field: "project_id",
              operator: "eq" as const,
              value: selectedProject,
            },
          ]
        : []),
      ...(billableFilter
        ? [
            {
              field: "billable",
              operator: "eq" as const,
              value: billableFilter,
            },
          ]
        : []),
    ],
    pagination: {
      pageSize: 50,
    },
  });

  // Fetch users for filter (admin only)
  const { result: usersData } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: isAdmin,
    },
  });

  // Fetch projects for filter
  const { result: projectsData } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  const timeEntries = timeEntriesData?.data || [];
  const summary = timeEntriesData?.summary || {
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    entryCount: 0,
  };
  const breakdown = timeEntriesData?.breakdown || {
    byProject: [],
    byTime: [],
  };

  // Handle delete
  const handleDelete = (id: number) => {
    deleteEntry(
      {
        resource: "time-entries",
        id,
      },
      {
        onSuccess: () => {
          message.success("Time entry deleted successfully");
          // Invalidate the time-entries list query to trigger a refetch
          invalidate({
            resource: "time-entries",
            invalidates: ["list"],
          });
          // Also refetch to ensure immediate update
          refetch();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to delete time entry");
        },
      }
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "User",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Duration (hours)",
      "Billable",
      "Description",
      "Notes",
    ];
    const rows = timeEntries.map((entry) => [
      dayjs(entry.date).format("YYYY-MM-DD"),
      entry.user?.fullName || "",
      entry.task?.project?.name || "",
      entry.task?.title || "",
      dayjs(entry.startTime).format("HH:mm"),
      dayjs(entry.endTime).format("HH:mm"),
      (entry.durationMinutes / 60).toFixed(2),
      entry.billable ? "Yes" : "No",
      entry.description || "",
      entry.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `time-entries-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: true,
    },
    ...(isAdmin
      ? [
          {
            title: "User",
            dataIndex: ["user", "fullName"],
            key: "user",
            responsive: ["md"] as any,
          },
        ]
      : []),
    {
      title: "Project",
      dataIndex: ["task", "project", "name"],
      key: "project",
      responsive: ["lg"] as any,
    },
    {
      title: "Task",
      dataIndex: ["task", "title"],
      key: "task",
    },
    {
      title: "Time",
      key: "time",
      render: (_: any, record: TimeEntry) => (
        <div>
          <div>
            {dayjs(record.startTime).format("HH:mm")} -{" "}
            {dayjs(record.endTime).format("HH:mm")}
          </div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {(record.durationMinutes / 60).toFixed(2)}h
          </Text>
        </div>
      ),
    },
    {
      title: "Billable",
      dataIndex: "billable",
      key: "billable",
      render: (billable: boolean) => (
        <Tag color={billable ? "green" : "orange"}>
          {billable ? "Billable" : "Non-Billable"}
        </Tag>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      responsive: ["xl"] as any,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TimeEntry) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/time-entries/${record.id}/edit`,
                type: "push",
              })
            }
          >
            {isMobile ? "" : "Edit"}
          </Button>
          <Popconfirm
            title="Delete time entry"
            description="Are you sure you want to delete this time entry?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {isMobile ? "" : "Delete"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: isMobile ? "16px" : "24px",
          gap: isMobile ? "12px" : "0",
        }}
      >
        <Title level={isMobile ? 3 : 2}>Time Entries</Title>
        <Space>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
            size={isMobile ? "middle" : "large"}
          >
            Export
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              go({
                to: `/tenants/${tenantSlug}/time-entries/create`,
                type: "push",
              })
            }
            size={isMobile ? "middle" : "large"}
          >
            Add Entry
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: tokens.spacing[6] }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%", flexWrap: "wrap" }}
          size={isMobile ? "middle" : "large"}
        >
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: isMobile ? "100%" : 150 }}
            size={isMobile ? "middle" : "large"}
          >
            <Select.Option value="daily">Daily View</Select.Option>
            <Select.Option value="weekly">Weekly View</Select.Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            style={{ width: isMobile ? "100%" : "auto" }}
            size={isMobile ? "middle" : "large"}
          />
          {isAdmin && (
            <Select
              placeholder="All Users"
              style={{ width: isMobile ? "100%" : 200 }}
              allowClear
              onChange={setSelectedUser}
              value={selectedUser}
              size={isMobile ? "middle" : "large"}
            >
              {usersData?.data?.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.fullName}
                </Select.Option>
              ))}
            </Select>
          )}
          <Select
            placeholder="All Projects"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedProject}
            value={selectedProject}
            size={isMobile ? "middle" : "large"}
          >
            {projectsData?.data?.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="All Entries"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setBillableFilter}
            value={billableFilter}
            size={isMobile ? "middle" : "large"}
          >
            <Select.Option value="true">Billable Only</Select.Option>
            <Select.Option value="false">Non-Billable Only</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={summary.totalHours}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Billable Hours"
              value={summary.billableHours}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="h"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Non-Billable Hours"
              value={summary.nonBillableHours}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="h"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Entries"
              value={summary.entryCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} lg={12}>
          <Card title={`Hours by ${viewMode === "daily" ? "Day" : "Week"}`}>
            <RechartsResponsiveContainer
              width="100%"
              height={isMobile ? 250 : 300}
            >
              <BarChart data={breakdown.byTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(value) =>
                    dayjs(value).format(
                      viewMode === "daily" ? "MMM DD" : "MMM DD"
                    )
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) =>
                    dayjs(value).format(
                      viewMode === "daily" ? "MMM DD, YYYY" : "Week of MMM DD"
                    )
                  }
                />
                <Legend />
                <Bar dataKey="totalHours" fill={COLORS[0]} name="Total Hours" />
                <Bar
                  dataKey="billableHours"
                  fill={COLORS[1]}
                  name="Billable Hours"
                />
              </BarChart>
            </RechartsResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Hours by Project">
            <RechartsResponsiveContainer
              width="100%"
              height={isMobile ? 250 : 300}
            >
              <PieChart>
                <Pie
                  data={breakdown.byProject}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.projectName}: ${entry.totalHours}h`
                  }
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="totalHours"
                >
                  {breakdown.byProject.map((_entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </RechartsResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card title="Time Entries">
        <Table
          dataSource={timeEntries}
          columns={columns}
          rowKey="id"
          scroll={{ x: isMobile ? 1000 : undefined }}
          pagination={{
            pageSize: 50,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} entries`,
          }}
        />
      </Card>
    </ResponsiveContainer>
  );
};
