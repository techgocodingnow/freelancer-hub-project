import React from "react";
import { Card, Typography, Row, Col } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { tokens } from "../../theme/tokens";

const { Title, Text, Paragraph } = Typography;

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export const ReportsIndex: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const reports: ReportCard[] = [
    {
      id: "time-activity",
      title: "Time & Activity Report",
      description:
        "View detailed time tracking data with breakdowns by user, project, and task. Includes billable vs non-billable hours analysis and daily activity charts.",
      icon: <ClockCircleOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "time-activity",
      color: "#1890ff",
    },
    {
      id: "daily-totals",
      title: "Daily Totals Report",
      description:
        "Weekly calendar grid showing daily time totals for each team member. Color-coded cells indicate hours logged with billable/non-billable breakdown.",
      icon: <CalendarOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "daily-totals",
      color: "#52c41a",
    },
    {
      id: "payments",
      title: "Payments Report",
      description:
        "Calculate payment amounts based on tracked billable hours and configurable hourly rates. View payments by team member and project.",
      icon: <DollarOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "payments",
      color: "#faad14",
    },
    {
      id: "invoices-payments",
      title: "Invoices & Payments Report",
      description:
        "Track actual invoices and payments with status monitoring. View total invoiced, paid, and outstanding amounts with invoice status distribution.",
      icon: <FileTextOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "invoices-payments",
      color: "#722ed1",
    },
    {
      id: "project-budget",
      title: "Project Budget Report",
      description:
        "Monitor project budgets with budget vs actual spending analysis. Track budget utilization, hours variance, and project completion rates.",
      icon: <ProjectOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "project-budget",
      color: "#eb2f96",
    },
    {
      id: "team-utilization",
      title: "Team Utilization Report",
      description:
        "Analyze team member productivity with utilization rates, billable vs non-billable hours, average hours per day, and days worked metrics.",
      icon: <TeamOutlined style={{ fontSize: isMobile ? 32 : 40 }} />,
      path: "team-utilization",
      color: "#13c2c2",
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(`/tenants/${slug}/reports/${path}`);
  };

  return (
    <ResponsiveContainer>
      {/* Header */}
      <div
        style={{
          marginBottom: isMobile ? "24px" : "32px",
        }}
      >
        <Title level={isMobile ? 3 : 2}>Reports</Title>
        <Paragraph
          style={{
            fontSize: isMobile ? "14px" : "16px",
            color: tokens.colors.text.secondary,
            marginBottom: 0,
          }}
        >
          Select a report to view detailed analytics and insights about your
          projects, team, and finances.
        </Paragraph>
      </div>

      {/* Report Cards Grid */}
      <Row gutter={[16, 16]}>
        {reports.map((report) => (
          <Col xs={24} sm={24} md={12} lg={8} key={report.id}>
            <Card
              hoverable
              onClick={() => handleCardClick(report.path)}
              style={{
                height: "100%",
                borderRadius: tokens.borderRadius.lg,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              styles={{
                body: {
                  padding: isMobile ? "20px" : "24px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                },
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0, 0, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }
              }}
            >
              {/* Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? 60 : 72,
                  height: isMobile ? 60 : 72,
                  borderRadius: tokens.borderRadius.lg,
                  backgroundColor: `${report.color}15`,
                  color: report.color,
                  marginBottom: isMobile ? "16px" : "20px",
                }}
              >
                {report.icon}
              </div>

              {/* Title */}
              <Title
                level={isMobile ? 5 : 4}
                style={{
                  marginBottom: isMobile ? "8px" : "12px",
                  marginTop: 0,
                }}
              >
                {report.title}
              </Title>

              {/* Description */}
              <Paragraph
                style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: tokens.colors.text.secondary,
                  marginBottom: 0,
                  flex: 1,
                  lineHeight: 1.6,
                }}
              >
                {report.description}
              </Paragraph>

              {/* View Report Link */}
              <div
                style={{
                  marginTop: isMobile ? "16px" : "20px",
                  paddingTop: isMobile ? "16px" : "20px",
                  borderTop: `1px solid ${tokens.colors.border}`,
                }}
              >
                <Text
                  strong
                  style={{
                    color: report.color,
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                >
                  View Report →
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </ResponsiveContainer>
  );
};
