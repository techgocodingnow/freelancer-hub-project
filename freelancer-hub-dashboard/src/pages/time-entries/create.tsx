import React, { useState } from "react";
import { Card, Form, message, Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useCreate, useList, useGo } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs from "dayjs";
import { useTenantSlug } from "../../contexts/tenant";
import {
  TimeEntryForm,
  TimeEntryFormValues,
} from "../../components/time-entries";

const { Title } = Typography;

export const TimeEntryCreate: React.FC = () => {
  const [form] = Form.useForm<TimeEntryFormValues>();
  const isMobile = useIsMobile();
  const go = useGo();
  const tenantSlug = useTenantSlug();
  const {
    mutate: createEntry,
    mutation: { isPending: isCreating },
  } = useCreate();

  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  // Fetch projects
  const { result: projectsData } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  // Fetch tasks for selected project
  const { result: tasksData } = useList({
    resource: `projects/${selectedProject}/tasks`,
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: !!selectedProject,
    },
  });

  const handleSubmit = (values: TimeEntryFormValues) => {
    // Validate that we have either times OR duration
    const hasStartTime = !!values.startTime;
    const hasEndTime = !!values.endTime;
    const hasDuration = !!values.durationMinutes;

    // If both times are provided, validate them
    if (hasStartTime && hasEndTime && values.startTime && values.endTime) {
      const startTime = dayjs(values.date)
        .hour(values.startTime.hour())
        .minute(values.startTime.minute())
        .second(0);
      const endTime = dayjs(values.date)
        .hour(values.endTime.hour())
        .minute(values.endTime.minute())
        .second(0);

      // Validate end time is after start time
      if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
        message.error("End time must be after start time");
        return;
      }

      const payload = {
        projectId: values.projectId,
        taskId: values.taskId,
        date: values.date.format("YYYY-MM-DD"),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: endTime.diff(startTime, "minutes"),
        description: values.description,
        notes: values.notes || null,
        billable: values.billable ?? true,
      };

      createEntry(
        {
          resource: "time-entries",
          values: payload,
        },
        {
          onSuccess: () => {
            go({
              to: `/tenants/${tenantSlug}/time-entries`,
              type: "push",
            });
          },
          onError: (error) => {
            message.error(error?.message || "Failed to create time entry");
          },
        }
      );
    } else if (hasDuration && !hasStartTime && !hasEndTime) {
      // Duration only - no start/end times
      const payload = {
        projectId: values.projectId,
        taskId: values.taskId,
        date: values.date.format("YYYY-MM-DD"),
        durationMinutes: values.durationMinutes,
        description: values.description,
        notes: values.notes || null,
        billable: values.billable ?? true,
      };

      createEntry(
        {
          resource: "time-entries",
          values: payload,
        },
        {
          onSuccess: () => {
            go({
              to: `/tenants/${tenantSlug}/time-entries`,
              type: "push",
            });
          },
          onError: (error) => {
            message.error(error?.message || "Failed to create time entry");
          },
        }
      );
    } else if ((hasStartTime && !hasEndTime) || (!hasStartTime && hasEndTime)) {
      message.error(
        "Please provide both start and end times, or use the duration field"
      );
      return;
    } else {
      message.error("Please provide either start/end times OR duration");
      return;
    }
  };

  const handleCancel = () => {
    go({
      to: `/tenants/${tenantSlug}/time-entries`,
      type: "push",
    });
  };

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: isMobile ? "16px" : "24px",
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancel} />
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Add Time Entry
        </Title>
      </div>

      <Card>
        <TimeEntryForm
          form={form}
          initialValues={{
            date: dayjs(),
            billable: true,
          }}
          onFinish={handleSubmit}
          submitButtonText="Create Time Entry"
          submitButtonLoading={isCreating}
          onCancel={handleCancel}
          projects={projectsData?.data || []}
          tasks={tasksData?.data || []}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />
      </Card>
    </ResponsiveContainer>
  );
};
