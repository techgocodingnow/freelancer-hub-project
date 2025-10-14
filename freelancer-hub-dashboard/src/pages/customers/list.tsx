import React, { useState } from "react";
import { useGo, useList } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Empty,
  Modal,
  message,
  Tooltip,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { CustomerFormModal } from "../../components/customers";
import { Api } from "../../services/api";
import { getErrorMessage } from "../../utils/error";
import { exportToCSV, formatCustomersForExport } from "../../utils/export";

const { Title, Text } = Typography;
const { Search } = Input;
const { confirm } = Modal;

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  projects?: Array<any>;
  invoices?: Array<any>;
};

export const CustomerList: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [searchText, setSearchText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    result,
    query: { isLoading, refetch },
  } = useList<Customer>({
    resource: "customers",
    pagination: {
      pageSize: 100,
    },
    filters: searchText
      ? [{ field: "search", operator: "contains", value: searchText }]
      : [],
  });

  const customers = result?.data || [];

  const handleCreate = () => {
    setFormData({});
    setIsEditMode(false);
    setShowFormModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setIsEditMode(true);
    setShowFormModal(true);
  };

  const handleDelete = (customer: Customer) => {
    confirm({
      title: "Delete Customer",
      content: `Are you sure you want to delete ${customer.name}? This action cannot be undone if the customer has no projects.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await Api.deleteCustomer(customer.id);
          message.success("Customer deleted successfully");
          refetch();
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || getErrorMessage(err);
          message.error(errorMsg);
        }
      },
    });
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleSaveCustomer = async () => {
    try {
      if (isEditMode && formData.id) {
        await Api.updateCustomer(formData.id, formData);
        message.success("Customer updated successfully");
      } else {
        await Api.createCustomer(formData);
        message.success("Customer created successfully");
      }
      setShowFormModal(false);
      refetch();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const handleExportCSV = () => {
    const formattedData = formatCustomersForExport(customers);
    const filename = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    exportToCSV(formattedData, filename);
    message.success(`Exported ${customers.length} customers to CSV`);
  };

  return (
    <ResponsiveContainer>
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
        <Title level={isMobile ? 3 : 2}>
          <UserOutlined /> Customers
        </Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            size={isMobile ? "middle" : "large"}
            disabled={customers.length === 0}
          >
            {!isMobile && "Export CSV"}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size={isMobile ? "middle" : "large"}
          >
            {isMobile ? "New" : "New Customer"}
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Search
          placeholder="Search by name, email, or company"
          allowClear
          size="large"
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        />
      </Card>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Row gutter={isMobile ? [12, 12] : isTablet ? [16, 16] : [24, 24]}>
          {customers.map((customer) => {
            const projectCount = customer.projects?.length || 0;
            const invoiceCount = customer.invoices?.length || 0;

            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={customer.id}>
                <Card
                  hoverable
                  onClick={() => handleViewDetails(customer)}
                  style={{ height: "100%" }}
                  actions={[
                    <Tooltip title="View Details">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(customer);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="Edit">
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="Delete">
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer);
                        }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <div>
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {customer.name}
                      </Title>
                      {customer.company && (
                        <Text type="secondary">{customer.company}</Text>
                      )}
                    </div>

                    {customer.email && (
                      <Space>
                        <MailOutlined />
                        <Text ellipsis>{customer.email}</Text>
                      </Space>
                    )}

                    {customer.phone && (
                      <Space>
                        <PhoneOutlined />
                        <Text>{customer.phone}</Text>
                      </Space>
                    )}

                    {(customer.city || customer.state || customer.country) && (
                      <Space>
                        <HomeOutlined />
                        <Text type="secondary">
                          {[customer.city, customer.state, customer.country]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </Space>
                    )}

                    <Row gutter={16}>
                      <Col span={12}>
                        <Space>
                          <FolderOutlined />
                          <Text type="secondary">
                            {projectCount} {projectCount === 1 ? "project" : "projects"}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Space>
                          <FileTextOutlined />
                          <Text type="secondary">
                            {invoiceCount} {invoiceCount === 1 ? "invoice" : "invoices"}
                          </Text>
                        </Space>
                      </Col>
                    </Row>

                    <Tag color={customer.isActive ? "green" : "default"}>
                      {customer.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {!isLoading && customers.length === 0 && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchText
                ? "No customers found matching your search"
                : "No customers yet"
            }
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Customer
              </Button>
            )}
          </Empty>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        title="Customer Details"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setShowDetailModal(false);
              selectedCustomer && handleEdit(selectedCustomer);
            }}
          >
            Edit
          </Button>,
        ]}
        width={700}
      >
        {selectedCustomer && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Name">
              {selectedCustomer.name}
            </Descriptions.Item>
            {selectedCustomer.company && (
              <Descriptions.Item label="Company">
                {selectedCustomer.company}
              </Descriptions.Item>
            )}
            {selectedCustomer.email && (
              <Descriptions.Item label="Email">
                {selectedCustomer.email}
              </Descriptions.Item>
            )}
            {selectedCustomer.phone && (
              <Descriptions.Item label="Phone">
                {selectedCustomer.phone}
              </Descriptions.Item>
            )}
            {(selectedCustomer.addressLine1 ||
              selectedCustomer.city ||
              selectedCustomer.state) && (
              <Descriptions.Item label="Address">
                {[
                  selectedCustomer.addressLine1,
                  selectedCustomer.addressLine2,
                  selectedCustomer.city,
                  selectedCustomer.state,
                  selectedCustomer.postalCode,
                  selectedCustomer.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Descriptions.Item>
            )}
            {selectedCustomer.notes && (
              <Descriptions.Item label="Notes">
                {selectedCustomer.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color={selectedCustomer.isActive ? "green" : "default"}>
                {selectedCustomer.isActive ? "Active" : "Inactive"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Projects">
              {selectedCustomer.projects?.length || 0} projects
            </Descriptions.Item>
            <Descriptions.Item label="Invoices">
              {selectedCustomer.invoices?.length || 0} invoices
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Form Modal */}
      <CustomerFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSaveCustomer}
        initialValues={formData}
        isEditMode={isEditMode}
      />
    </ResponsiveContainer>
  );
};
