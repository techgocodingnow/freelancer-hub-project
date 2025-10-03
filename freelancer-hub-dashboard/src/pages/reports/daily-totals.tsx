import React, { useState, useMemo } from "react";
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
  Tooltip,
} from "antd";
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useTenant } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import { tokens } from "../../theme/tokens";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const { Title, Text } = Typography;

export const DailyTotalsReport: React.FC = () => {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Week navigation
  const [currentWeek, setCurrentWeek] = useState<Dayjs>(dayjs());
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  const weekStart = currentWeek.startOf("isoWeek");
  const weekEnd = currentWeek.endOf("isoWeek");

  // Fetch daily totals
  const {
    query: { data: dailyTotalsData, isLoading },
  } = useList({
    resource: "reports/daily-totals",
    filters: [
      {
        field: "start_date",
        operator: "eq",
        value: weekStart.format("YYYY-MM-DD"),
      },
      {
        field: "end_date",
        operator: "eq",
        value: weekEnd.format("YYYY-MM-DD"),
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
    ],
    pagination: {
      pageSize: 1000,
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

  const dailyTotals = dailyTotalsData?.data || [];

  // Transform data for weekly grid
  const weeklyData = useMemo(() => {
    const userMap: Record<
      number,
      {
        userId: number;
        userName: string;
        userEmail: string;
        days: Record<string, { totalHours: number; billableHours: number }>;
        weekTotal: number;
      }
    > = {};

    dailyTotals.forEach((entry: any) => {
      if (!userMap[entry.userId]) {
        userMap[entry.userId] = {
          userId: entry.userId,
          userName: entry.userName,
          userEmail: entry.userEmail,
          days: {},
          weekTotal: 0,
        };
      }

      const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
      userMap[entry.userId].days[dateKey] = {
        totalHours: entry.totalHours,
        billableHours: entry.billableHours,
      };
      userMap[entry.userId].weekTotal += entry.totalHours;
    });

    return Object.values(userMap);
  }, [dailyTotals]);

  // Calculate daily totals (all users combined)
  const dailyTotalsRow = useMemo(() => {
    const totals: Record<string, number> = {};
    let weekTotal = 0;

    dailyTotals.forEach((entry: any) => {
      const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
      totals[dateKey] = (totals[dateKey] || 0) + entry.totalHours;
      weekTotal += entry.totalHours;
    });

    return { totals, weekTotal };
  }, [dailyTotals]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.add(i, "day"));
    }
    return days;
  }, [weekStart]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "User",
      ...weekDays.map((d) => d.format("MMM DD")),
      "Week Total",
    ];
    const rows = weeklyData.map((user) => [
      user.userName,
      ...weekDays.map((day) => {
        const dateKey = day.format("YYYY-MM-DD");
        return user.days[dateKey]?.totalHours.toFixed(2) || "0.00";
      }),
      user.weekTotal.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-totals-report-${weekStart.format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get cell color based on hours
  const getCellColor = (hours: number) => {
    if (hours === 0) return tokens.colors.gray[100];
    if (hours < 4) return "#fff7e6"; // Light orange
    if (hours < 8) return "#e6f7ff"; // Light blue
    return "#f6ffed"; // Light green
  };

  // Table columns
  const columns = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      fixed: isMobile ? false : ("left" as const),
      width: isMobile ? 120 : 200,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {!isMobile && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.userEmail}
            </Text>
          )}
        </div>
      ),
    },
    ...weekDays.map((day) => ({
      title: isMobile ? day.format("ddd") : day.format("ddd, MMM DD"),
      dataIndex: ["days", day.format("YYYY-MM-DD")],
      key: day.format("YYYY-MM-DD"),
      width: isMobile ? 60 : 120,
      align: "center" as const,
      render: (dayData: any) => {
        const hours = dayData?.totalHours || 0;
        const billableHours = dayData?.billableHours || 0;
        return (
          <Tooltip
            title={
              hours > 0
                ? `Total: ${hours.toFixed(
                    2
                  )}h | Billable: ${billableHours.toFixed(2)}h`
                : "No time logged"
            }
          >
            <div
              style={{
                backgroundColor: getCellColor(hours),
                padding: isMobile ? "4px" : "8px",
                borderRadius: tokens.borderRadius.md,
                fontWeight: hours > 0 ? 600 : 400,
                color:
                  hours > 0
                    ? tokens.colors.text.primary
                    : tokens.colors.text.secondary,
              }}
            >
              {hours > 0 ? `${hours.toFixed(1)}h` : "-"}
            </div>
          </Tooltip>
        );
      },
    })),
    {
      title: "Week Total",
      dataIndex: "weekTotal",
      key: "weekTotal",
      width: isMobile ? 80 : 120,
      align: "center" as const,
      fixed: isMobile ? false : ("right" as const),
      render: (total: number) => (
        <div style={{ fontWeight: 700, fontSize: isMobile ? "14px" : "16px" }}>
          {total.toFixed(1)}h
        </div>
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
        <Title level={isMobile ? 3 : 2}>Daily Totals Report</Title>
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

      {/* Filters & Week Navigation */}
      <Card style={{ marginBottom: tokens.spacing[6] }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{
            width: "100%",
            flexWrap: "wrap",
            marginBottom: tokens.spacing[4],
          }}
          size={isMobile ? "middle" : "large"}
        >
          <Select
            placeholder="All Users"
            style={{ width: isMobile ? "100%" : 200 }}
            allowClear
            onChange={setSelectedUser}
            value={selectedUser}
            size={isMobile ? "middle" : "large"}
          >
            {usersData?.data.map((user: any) => (
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
            {projectsData?.data.map((project: any) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Space>

        {/* Week Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: tokens.spacing[4],
          }}
        >
          <Button
            icon={<LeftOutlined />}
            onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}
            size={isMobile ? "small" : "middle"}
          >
            {!isMobile && "Previous"}
          </Button>
          <div style={{ textAlign: "center" }}>
            <Text strong style={{ fontSize: isMobile ? "14px" : "16px" }}>
              {weekStart.format("MMM DD")} - {weekEnd.format("MMM DD, YYYY")}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Week {currentWeek.isoWeek()}
            </Text>
          </div>
          <Button
            icon={<RightOutlined />}
            onClick={() => setCurrentWeek(currentWeek.add(1, "week"))}
            size={isMobile ? "small" : "middle"}
          >
            {!isMobile && "Next"}
          </Button>
        </div>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing[6] }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Week Hours"
              value={dailyTotalsRow.weekTotal}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Team Members" value={weeklyData.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Average Hours/Day"
              value={dailyTotalsRow.weekTotal / 7}
              precision={2}
              suffix="h"
            />
          </Card>
        </Col>
      </Row>

      {/* Weekly Grid Table */}
      <Card title="Weekly Time Grid">
        <Table
          dataSource={weeklyData}
          columns={columns}
          rowKey="userId"
          scroll={{ x: isMobile ? 800 : undefined }}
          pagination={false}
        />

        {/* Daily Totals Row */}
        <div
          style={{
            marginTop: tokens.spacing[4],
            padding: tokens.spacing[4],
            backgroundColor: tokens.colors.background.hover,
            borderRadius: tokens.borderRadius.lg,
          }}
        >
          <Row gutter={[8, 8]}>
            <Col span={isMobile ? 24 : 4}>
              <Text strong>Daily Totals:</Text>
            </Col>
            {weekDays.map((day) => (
              <Col key={day.format("YYYY-MM-DD")} span={isMobile ? 8 : 2}>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {day.format("ddd")}
                  </Text>
                  <br />
                  <Text strong>
                    {(
                      dailyTotalsRow.totals[day.format("YYYY-MM-DD")] || 0
                    ).toFixed(1)}
                    h
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Card>
    </ResponsiveContainer>
  );
};
