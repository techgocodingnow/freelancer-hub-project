import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  DatePicker,
  Select,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import {
  useList,
  useCreate,
  useDelete,
  useCustomMutation,
} from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
import { tokens } from "../../theme/tokens";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const PayrollManagement: React.FC = () => {
  const isMobile = useIsMobile();

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [payrollPreview, setPayrollPreview] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch payroll batches
  const {
    query: {
      data: batchesData,
      isLoading: isBatchesLoading,
      refetch: refetchBatches,
    },
  } = useList({
    resource: "payroll/batches",
    pagination: { pageSize: 50 },
  });

  // Fetch users for selection
  const { result: usersData } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
  });

  // Create batch mutation
  const { mutate: createBatch } = useCreate();
  const [isCreating, setIsCreating] = useState(false);

  // Delete batch mutation
  const { mutate: deleteBatch } = useDelete();

  // Custom mutation for processing batch
  const { mutate: processBatch } = useCustomMutation();

  // Custom mutation for calculating payroll
  const { mutate: calculatePayroll } = useCustomMutation();

  const batches = batchesData?.data || [];
  const users = usersData?.data || [];

  // Calculate payroll preview
  const handleCalculatePayroll = async () => {
    setIsCalculating(true);

    calculatePayroll(
      {
        url: "",
        method: "post",
        values: {
          startDate: dateRange[0].format("YYYY-MM-DD"),
          endDate: dateRange[1].format("YYYY-MM-DD"),
          userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
        },
        config: {
          headers: {},
        },
        meta: {
          resource: "payroll/calculate",
        },
      },
      {
        onSuccess: (data: any) => {
          setPayrollPreview(data.data.data);
          setIsPreviewModalOpen(true);
          setIsCalculating(false);
        },
        onError: () => {
          setIsCalculating(false);
        },
      }
    );
  };

  // Create payroll batch
  const handleCreateBatch = () => {
    if (!payrollPreview) {
      message.open({
        type: "error",
        content: "Please calculate payroll first",
      });
      return;
    }

    setIsCreating(true);
    createBatch(
      {
        resource: "payroll/batches",
        values: {
          startDate: dateRange[0].format("YYYY-MM-DD"),
          endDate: dateRange[1].format("YYYY-MM-DD"),
          userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
          notes: `Payroll for ${dateRange[0].format(
            "MMM DD"
          )} - ${dateRange[1].format("MMM DD, YYYY")}`,
        },
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setIsPreviewModalOpen(false);
          setPayrollPreview(null);
          setSelectedUsers([]);
          setIsCreating(false);
          refetchBatches();
        },
        onError: () => {
          setIsCreating(false);
        },
      }
    );
  };

  // Process batch
  const handleProcessBatch = (batchId: number) => {
    Modal.confirm({
      title: "Process Payroll Batch",
      content:
        "Are you sure you want to process this payroll batch? This action cannot be undone.",
      okText: "Process",
      okType: "primary",
      onOk: () => {
        processBatch(
          {
            url: "",
            method: "post",
            values: {},
            config: {
              headers: {},
            },
            meta: {
              resource: `payroll/batches/${batchId}/process`,
            },
          },
          {
            onSuccess: () => {
              refetchBatches();
            },
          }
        );
      },
    });
  };

  // Delete batch
  const handleDeleteBatch = (batchId: number) => {
    Modal.confirm({
      title: "Delete Payroll Batch",
      content: "Are you sure you want to delete this draft batch?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteBatch(
          {
            resource: "payroll/batches",
            id: batchId,
          },
          {
            onSuccess: () => {
              refetchBatches();
            },
          }
        );
      },
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "default",
      pending: "blue",
      processing: "orange",
      completed: "green",
      failed: "red",
      cancelled: "gray",
    };
    return colors[status] || "default";
  };

  // Table columns
  const columns = [
    {
      title: "Batch #",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Pay Period",
      key: "payPeriod",
      render: (_: any, record: any) => (
        <Text>
          {dayjs(record.payPeriodStart).format("MMM DD")} -{" "}
          {dayjs(record.payPeriodEnd).format("MMM DD, YYYY")}
        </Text>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: any) => (
        <Text strong>
          ${amount.toFixed(2)} {record.currency}
        </Text>
      ),
      sorter: (a: any, b: any) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Payments",
      dataIndex: "paymentCount",
      key: "paymentCount",
      responsive: ["lg"] as any,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      responsive: ["lg"] as any,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === "draft" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleProcessBatch(record.id)}
              >
                {isMobile ? "" : "Process"}
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleDeleteBatch(record.id)}
              >
                Delete
              </Button>
            </>
          )}
          {record.status === "completed" && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Completed
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  if (isBatchesLoading) {
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
        <Title level={isMobile ? 3 : 2}>Payroll Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          size={isMobile ? "middle" : "large"}
          block={isMobile}
        >
          Create Payroll Batch
        </Button>
      </div>

      {/* Batches Table */}
      <Card>
        <Table
          dataSource={batches}
          columns={columns}
          rowKey="id"
          scroll={{ x: isMobile ? 1000 : undefined }}
          pagination={{
            pageSize: 20,
            simple: isMobile,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Total ${total} batches`,
          }}
        />
      </Card>

      {/* Create Batch Modal */}
      <Modal
        title="Create Payroll Batch"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setPayrollPreview(null);
        }}
        footer={null}
        width={isMobile ? "100%" : 600}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong>Pay Period</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) =>
                dates && setDateRange(dates as [Dayjs, Dayjs])
              }
              style={{ width: "100%", marginTop: "8px" }}
              size="large"
            />
          </div>

          <div>
            <Text strong>Team Members (Optional)</Text>
            <Select
              mode="multiple"
              placeholder="All team members"
              style={{ width: "100%", marginTop: "8px" }}
              value={selectedUsers}
              onChange={setSelectedUsers}
              size="large"
            >
              {users?.data?.map((user: any) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.fullName}
                </Select.Option>
              ))}
            </Select>
          </div>

          <Button
            type="primary"
            block
            size="large"
            onClick={handleCalculatePayroll}
            loading={isCalculating}
          >
            Calculate Payroll
          </Button>
        </Space>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Payroll Preview"
        open={isPreviewModalOpen}
        onCancel={() => setIsPreviewModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPreviewModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={handleCreateBatch}
            loading={isCreating}
          >
            Create Batch
          </Button>,
        ]}
        width={isMobile ? "100%" : 800}
      >
        {payrollPreview && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Summary Statistics */}
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Total Amount"
                    value={payrollPreview.totalAmount}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: tokens.colors.semantic.success }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Team Members"
                    value={payrollPreview.userCount}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Total Hours"
                    value={payrollPreview.totalHours}
                    prefix={<ClockCircleOutlined />}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Billable Hours"
                    value={payrollPreview.totalBillableHours}
                    prefix={<CheckCircleOutlined />}
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            {/* Individual Calculations */}
            <div>
              <Title level={5}>Payment Breakdown</Title>
              {payrollPreview.calculations.map((calc: any, index: number) => (
                <Card key={index} style={{ marginBottom: "12px" }} size="small">
                  <Descriptions column={isMobile ? 1 : 2} size="small">
                    <Descriptions.Item label="Team Member">
                      <Text strong>{calc.userName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {calc.userEmail}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hourly Rate">
                      ${calc.hourlyRate.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Hours">
                      {calc.totalHours.toFixed(2)} hrs
                    </Descriptions.Item>
                    <Descriptions.Item label="Billable Hours">
                      {calc.billableHours.toFixed(2)} hrs
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      <Text
                        strong
                        style={{ color: tokens.colors.semantic.success }}
                      >
                        ${calc.totalAmount.toFixed(2)}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </div>
          </Space>
        )}
      </Modal>
    </ResponsiveContainer>
  );
};
