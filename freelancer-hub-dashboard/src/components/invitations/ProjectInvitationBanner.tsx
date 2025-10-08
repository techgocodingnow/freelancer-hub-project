import React, { useState, useEffect } from "react";
import { Alert, Button, Space, Typography, Modal, message } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Api } from "../../services/api";
import type { Invitation } from "../../services/api/types";
import { useNavigate } from "react-router";
import { useTenantSlug } from "../../contexts/tenant";

const { Text } = Typography;
const { confirm } = Modal;

export const ProjectInvitationBanner: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const tenantSlug = useTenantSlug();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await Api.getMyInvitations();
      setInvitations(response.data.data);
    } catch (error: any) {
      console.error("Failed to fetch invitations:", error);
    }
  };

  const handleAccept = async (invitation: Invitation) => {
    setProcessingId(invitation.id);
    setLoading(true);

    try {
      const response = await Api.acceptInvitation(invitation.id);
      message.open({
        type: "success",
        content: `You've joined ${invitation.project?.name || "the project"}!`,
      });

      // Remove invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      // Optionally navigate to the project
      if (invitation.project && tenantSlug) {
        setTimeout(() => {
          navigate(`/tenants/${tenantSlug}/projects/${invitation.project!.id}`);
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || "Failed to accept invitation";
      message.open({
        type: "error",
        content: errorMessage,
      });
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  };

  const handleDecline = (invitation: Invitation) => {
    confirm({
      title: "Decline Invitation",
      icon: <CloseCircleOutlined />,
      content: `Are you sure you want to decline the invitation to join ${
        invitation.project?.name || "this project"
      }?`,
      okText: "Yes, Decline",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setProcessingId(invitation.id);
        setLoading(true);

        try {
          await Api.rejectInvitation(invitation.id);
          message.open({
            type: "success",
            content: "Invitation declined",
          });

          // Remove invitation from list
          setInvitations((prev) =>
            prev.filter((inv) => inv.id !== invitation.id)
          );
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.error || "Failed to decline invitation";
          message.open({
            type: "error",
            content: errorMessage,
          });
        } finally {
          setLoading(false);
          setProcessingId(null);
        }
      },
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {invitations.map((invitation) => (
        <Alert
          key={invitation.id}
          message={
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Space>
                <TeamOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                <div>
                  <Text strong>
                    {invitation.inviter?.fullName || "Someone"} invited you to
                    join{" "}
                    <Text strong style={{ color: "#1890ff" }}>
                      {invitation.project?.name || "a project"}
                    </Text>
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      as {invitation.role?.name.toUpperCase()} •{" "}
                      {getRelativeTime(invitation.createdAt)}
                    </Text>
                  </div>
                </div>
              </Space>
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAccept(invitation)}
                  loading={loading && processingId === invitation.id}
                  disabled={loading && processingId !== invitation.id}
                >
                  Accept
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleDecline(invitation)}
                  loading={loading && processingId === invitation.id}
                  disabled={loading && processingId !== invitation.id}
                >
                  Decline
                </Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon={false}
          closable={false}
          style={{
            marginBottom: 8,
            borderLeft: "4px solid #1890ff",
          }}
        />
      ))}
    </div>
  );
};
