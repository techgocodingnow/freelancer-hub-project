import React, { useState, useEffect } from "react";
import {
  Card,
  Switch,
  Button,
  message,
  Spin,
  Typography,
  Divider,
  Space,
  Alert,
} from "antd";
import { BellOutlined, MailOutlined, SoundOutlined } from "@ant-design/icons";
import Api from "../../services/api/api";
import type {
  NotificationPreference,
  NotificationType,
} from "../../services/api/types";

const { Title, Text } = Typography;

const NOTIFICATION_TYPE_LABELS: Record<
  NotificationType,
  { label: string; description: string }
> = {
  project_invitation: {
    label: "Project Invitations",
    description: "When you're invited to join a project",
  },
  task_assigned: {
    label: "Task Assignments",
    description: "When a task is assigned to you",
  },
  task_completed: {
    label: "Task Completions",
    description: "When a task you're involved with is completed",
  },
  payment_received: {
    label: "Payments",
    description: "When you receive a payment",
  },
  timesheet_approved: {
    label: "Timesheet Approvals",
    description: "When your timesheet is approved",
  },
  timesheet_rejected: {
    label: "Timesheet Rejections",
    description: "When your timesheet is rejected",
  },
  project_updated: {
    label: "Project Updates",
    description: "When a project you're part of is updated",
  },
  member_added: {
    label: "New Members",
    description: "When a new member joins a project you're in",
  },
  member_removed: {
    label: "Member Removals",
    description: "When a member leaves a project you're in",
  },
  general: {
    label: "General Notifications",
    description: "Other important notifications",
  },
};

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [allMuted, setAllMuted] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await Api.getNotificationPreferences();
      setPreferences(response.data.data);

      // Check if all are muted
      const allAreMuted = response.data.data.every((p) => p.isMuted);
      setAllMuted(allAreMuted);
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      message.open({
        type: "error",
        content: "Failed to load notification preferences",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    type: NotificationType,
    field: "inAppEnabled" | "emailEnabled" | "isMuted",
    value: boolean
  ) => {
    setUpdating(type);
    try {
      await Api.updateNotificationPreference(type, { [field]: value });

      // Update local state
      setPreferences((prev) =>
        prev.map((p) =>
          p.notificationType === type ? { ...p, [field]: value } : p
        )
      );

      message.open({
        type: "success",
        content: "Preference updated",
      });
    } catch (error) {
      console.error("Failed to update preference:", error);
      message.open({
        type: "error",
        content: "Failed to update preference",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleMuteAll = async () => {
    setLoading(true);
    try {
      if (allMuted) {
        await Api.unmuteAllNotifications();
        message.open({
          type: "success",
          content: "All notifications unmuted",
        });
      } else {
        await Api.muteAllNotifications();
        message.open({
          type: "success",
          content: "All notifications muted",
        });
      }

      // Refresh preferences
      await fetchPreferences();
    } catch (error) {
      console.error("Failed to mute/unmute all:", error);
      message.open({
        type: "error",
        content: "Failed to update preferences",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && preferences.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <Title level={2}>
        <BellOutlined /> Notification Preferences
      </Title>
      <Text type="secondary">
        Control how and when you receive notifications
      </Text>

      <Divider />

      {/* Mute All Section */}
      <Card style={{ marginBottom: "24px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <SoundOutlined /> Mute All Notifications
              </Title>
              <Text type="secondary">
                Temporarily disable all notifications
              </Text>
            </div>
            <Switch
              checked={allMuted}
              onChange={handleMuteAll}
              loading={loading}
              checkedChildren="Muted"
              unCheckedChildren="Active"
            />
          </div>

          {allMuted && (
            <Alert
              message="All notifications are currently muted"
              description="You won't receive any in-app or email notifications until you unmute them."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* Individual Preferences */}
      <Card title="Notification Types">
        <div style={{ opacity: allMuted ? 0.5 : 1 }}>
          {preferences.map((preference) => {
            const config =
              NOTIFICATION_TYPE_LABELS[preference.notificationType];
            const isUpdating = updating === preference.notificationType;

            return (
              <div
                key={preference.id}
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {config.label}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {config.description}
                  </Text>
                </div>

                <Space size="large">
                  {/* In-App Toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <BellOutlined />
                    <Text>In-App</Text>
                    <Switch
                      checked={preference.inAppEnabled}
                      onChange={(checked) =>
                        handleToggle(
                          preference.notificationType,
                          "inAppEnabled",
                          checked
                        )
                      }
                      loading={isUpdating}
                      disabled={allMuted}
                    />
                  </div>

                  {/* Email Toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MailOutlined />
                    <Text>Email</Text>
                    <Switch
                      checked={preference.emailEnabled}
                      onChange={(checked) =>
                        handleToggle(
                          preference.notificationType,
                          "emailEnabled",
                          checked
                        )
                      }
                      loading={isUpdating}
                      disabled={allMuted}
                    />
                  </div>
                </Space>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Help Text */}
      <Alert
        message="About Notification Preferences"
        description={
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>
              <strong>In-App:</strong> Notifications appear in the app with a
              badge count
            </li>
            <li>
              <strong>Email:</strong> Notifications are sent to your email
              address
            </li>
            <li>
              <strong>Mute All:</strong> Temporarily disable all notifications
              without changing individual settings
            </li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginTop: "24px" }}
      />
    </div>
  );
};

export default NotificationPreferences;
