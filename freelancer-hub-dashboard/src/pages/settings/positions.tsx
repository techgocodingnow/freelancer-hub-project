import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Position } from "../../services/api/types";
import api from "../../services/api/api";
import { PositionFormModal } from "../../components/positions/PositionFormModal";

const { Title, Text } = Typography;

export const PositionList = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await api.getPositions({ showInactive });
      setPositions(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [showInactive]);

  const handleCreate = () => {
    setEditingPosition(undefined);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = async (position: Position) => {
    try {
      await api.deletePosition(position.id);
      message.success("Position deactivated successfully");
      fetchPositions();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to deactivate position");
    }
  };

  const handleRestore = async (position: Position) => {
    try {
      await api.restorePosition(position.id);
      message.success("Position restored successfully");
      fetchPositions();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to restore position");
    }
  };

  const handleModalSuccess = () => {
    fetchPositions();
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Position) => (
        <Space>
          <Text strong={record.isActive}>{name}</Text>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string | null) => (
        <Text type="secondary">{description || "—"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Position) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Deactivate Position"
              description="Are you sure you want to deactivate this position?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleRestore(record)}
            >
              Restore
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Positions
              </Title>
              <Text type="secondary">
                Manage position titles for your team members
              </Text>
            </div>
            <Space>
              <Space>
                <Text>Show Inactive:</Text>
                <Switch
                  checked={showInactive}
                  onChange={setShowInactive}
                />
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Position
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={positions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} positions`,
            }}
          />
        </Space>
      </Card>

      <PositionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        position={editingPosition}
        isEditMode={isEditMode}
      />
    </div>
  );
};
