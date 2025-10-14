import React, { useState, useEffect } from "react";
import { useCustom, useCreate, useUpdate } from "@refinedev/core";
import {
  Card,
  Button,
  Typography,
  Space,
  Select,
  Input,
  message,
  FloatButton,
  Modal,
  Statistic,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ActiveTimer {
  id: number;
  taskId: number;
  description: string;
  startTime: string;
  task: {
    id: number;
    title: string;
    project: {
      id: number;
      name: string;
    };
  };
}

export const TimerWidget: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [description, setDescription] = useState("");

  const { mutate: startTimer } = useCreate();
  const { mutate: stopTimer } = useUpdate();

  // Fetch active timer
  const {
    result: activeTimerData,
    query: { refetch },
  } = useCustom<{
    data: ActiveTimer | null;
  }>({
    url: "/time-entries/active",
    method: "get",
  });

  const activeTimer = activeTimerData?.data?.data;

  // Update duration every second
  useEffect(() => {
    if (!activeTimer) {
      setDuration(0);
      return;
    }

    const updateDuration = () => {
      const start = new Date(activeTimer.startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      setDuration(diff);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!selectedTaskId) {
      message.open({
        type: "error",
        content: "Please select a task",
      });
      return;
    }

    startTimer(
      {
        resource: `tasks/${selectedTaskId}/time-entries/start`,
        values: {
          description: description || "Working on task",
        },
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setDescription("");
          setSelectedTaskId(undefined);
          refetch();
        },
      }
    );
  };

  const handleStop = () => {
    if (!activeTimer) return;

    stopTimer(
      {
        resource: `tasks/${activeTimer.taskId}/time-entries/stop`,
        id: activeTimer.id,
        values: {},
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  return (
    <>
      {/* Floating Timer Button */}
      {activeTimer ? (
        <FloatButton
          icon={<ClockCircleOutlined />}
          type="primary"
          style={{ right: 24, bottom: 24 }}
          badge={{ count: formatDuration(duration), color: "green" }}
          onClick={() => setIsModalOpen(true)}
        />
      ) : (
        <FloatButton
          icon={<PlayCircleOutlined />}
          type="default"
          style={{ right: 24, bottom: 24 }}
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {/* Timer Modal */}
      <Modal
        title={activeTimer ? "Active Timer" : "Start Timer"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        {activeTimer ? (
          <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text type="secondary">Project</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {activeTimer.task.project.name}
                </Title>
              </div>

              <div>
                <Text type="secondary">Task</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {activeTimer.task.title}
                </Title>
              </div>

              <div>
                <Text type="secondary">Description</Text>
                <Text>{activeTimer.description}</Text>
              </div>

              <Statistic
                title="Duration"
                value={formatDuration(duration)}
                valueStyle={{ fontSize: 32, color: "#52c41a" }}
              />

              <Button
                type="primary"
                danger
                size="large"
                icon={<PauseCircleOutlined />}
                onClick={handleStop}
                block
              >
                Stop Timer
              </Button>
            </Space>
          </Card>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text>Select Task</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Select a task to track time"
                value={selectedTaskId}
                onChange={setSelectedTaskId}
                showSearch
                optionFilterProp="children"
              >
                {/* Note: In a real app, you'd fetch available tasks here */}
                <Select.Option value={1}>Sample Task 1</Select.Option>
                <Select.Option value={2}>Sample Task 2</Select.Option>
              </Select>
            </div>

            <div>
              <Text>Description (optional)</Text>
              <TextArea
                rows={3}
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              block
            >
              Start Timer
            </Button>
          </Space>
        )}
      </Modal>
    </>
  );
};
