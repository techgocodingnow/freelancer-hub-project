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
} from "antd";
import {
  DownloadOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
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

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Color palette for charts
const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

export const TimeActivityReport: React.FC = () => {
  const isMobile = useIsMobile();

  // Filters
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("week"),
    dayjs().endOf("week"),
  ]);
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [billableFilter, setBillableFilter] = useState<string | undefined>();

  // Fetch time entries using the new global endpoint
  const {
    query: { data: timeEntriesData, isLoading },
  } = useList({
    resource: "time-entries",
    filters: [
      {
        field: "view_mode",
        operator: "eq",
        value: "daily",
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

  // Fetch users for filter
  const {
    query: { data: usersData },
  } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  // Fetch projects for filter
  const {
    query: { data: projectsData },
  } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  const timeEntries = timeEntriesData?.data || [];
  const summary = (timeEntriesData as any)?.summary || {
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    entryCount: 0,
  };
  const breakdown = (timeEntriesData as any)?.breakdown || {
    byProject: [],
    byTime: [],
  };

  // Prepare chart data from API breakdown
  const hoursByDay = React.useMemo(() => {
    return breakdown.byTime.map((item: any) => ({
      date: dayjs(item.period).format("MMM DD"),
      hours: item.totalHours,
    }));
  }, [breakdown.byTime]);

  const hoursByProject = React.useMemo(() => {
    return breakdown.byProject.map((item: any) => ({
      name: item.projectName,
      value: item.totalHours,
    }));
  }, [breakdown.byProject]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "User",
      "Project",
      "Task",
      "Duration (hours)",
      "Billable",
      "Description",
    ];
    const rows = timeEntries.map((entry: any) => [
      dayjs(entry.date).format("YYYY-MM-DD"),
      entry.user?.fullName || "",
      entry.task?.project?.name || "",
      entry.task?.title || "",
      (entry.durationMinutes / 60).toFixed(2),
      entry.billable ? "Yes" : "No",
      entry.description || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `time-activity-report-${dayjs().format("YYYY-MM-DD")}.csv`;
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
    {
      title: "User",
      dataIndex: ["user", "fullName"],
      key: "user",
      responsive: ["md"] as any,
    },
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
      title: "Duration",
      dataIndex: "durationMinutes",
      key: "duration",
      render: (minutes: number) => `${(minutes / 60).toFixed(2)}h`,
      sorter: true,
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
        <Title level={isMobile ? 3 : 2}>Time & Activity Report</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
          size={isMobile ? "middle" : "large"}
          block={isMobile}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: tokens.spacing[6] }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%", flexWrap: "wrap" }}
          size={isMobile ? "middle" : "large"}
        >
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            style={{ width: isMobile ? "100%" : "auto" }}
            size={isMobile ? "middle" : "large"}
          />
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
          <Select
            placeholder="All Projects"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedProject}
            value={selectedProject}
            size={isMobile ? "middle" : "large"}
          >
            {projectsData?.data?.map((project: any) => (
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
          <Card title="Hours by Day">
            <RechartsResponsiveContainer
              width="100%"
              height={isMobile ? 250 : 300}
            >
              <BarChart data={hoursByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill={COLORS[0]} name="Hours" />
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
                  data={hoursByProject}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}h`}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {hoursByProject.map((_entry, index) => (
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
