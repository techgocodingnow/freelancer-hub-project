import React from "react";
import { Card, Form, message, Typography, Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useUpdate, useOne, useList, useGo, useDelete } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import { useTenantSlug } from "../../contexts/tenant";
import dayjs from "dayjs";
import {
  TimeEntryForm,
  TimeEntryFormValues,
} from "../../components/time-entries";

const { Title } = Typography;

export const TimeEntryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<TimeEntryFormValues>();
  const isMobile = useIsMobile();
  const go = useGo();
  const tenantSlug = useTenantSlug();
  const {
    mutate: updateEntry,
    mutation: { isPending: isUpdating },
  } = useUpdate();
  const {
    mutate: deleteEntry,
    mutation: { isPending: isDeleting },
  } = useDelete();

  // Fetch time entry
  const {
    result: timeEntryData,
    query: { isLoading: isLoadingEntry },
  } = useOne({
    resource: "time-entries",
    id: id!,
  });

  const timeEntry = timeEntryData?.data;

  // Set selected project from loaded data (for fetching tasks)
  const selectedProject = timeEntry?.task?.project?.id;

  // Fetch projects
  const {
    result: projectsData,
    query: { isLoading: isLoadingProjects },
  } = useList({
    resource: "projects",
    pagination: { pageSize: 100 },
  });

  // Fetch tasks for selected project (only when we have a project ID)
  const {
    result: tasksData,
    query: { isLoading: isLoadingTasks },
  } = useList({
    resource: `projects/${selectedProject}/tasks`,
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: !!selectedProject,
    },
  });

  // Prepare initial form values from loaded data
  const initialValues = React.useMemo(() => {
    if (!timeEntry) return undefined;

    const formValues: Partial<TimeEntryFormValues> = {
      projectId: timeEntry.task?.project?.id,
      taskId: timeEntry.task?.id,
      date: dayjs(timeEntry.date),
      description: timeEntry.description,
      notes: timeEntry.notes,
      billable: timeEntry.billable,
      durationMinutes: timeEntry.durationMinutes,
    };

    // Only set time fields if they exist
    if (timeEntry.startTime) {
      formValues.startTime = dayjs(timeEntry.startTime);
    }
    if (timeEntry.endTime) {
      formValues.endTime = dayjs(timeEntry.endTime);
    }

    return formValues;
  }, [timeEntry]);

  // Combined loading state - wait for all required data
  const isLoading =
    isLoadingEntry ||
    isLoadingProjects ||
    (!!selectedProject && isLoadingTasks);

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

      updateEntry(
        {
          resource: "time-entries",
          id: id!,
          values: payload,
        },
        {
          onSuccess: () => {
            message.success("Time entry updated successfully");
            go({
              to: `/tenants/${tenantSlug}/time-entries`,
              type: "push",
            });
          },
          onError: (error) => {
            message.error(error?.message || "Failed to update time entry");
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

      updateEntry(
        {
          resource: "time-entries",
          id: id!,
          values: payload,
        },
        {
          onSuccess: () => {
            message.success("Time entry updated successfully");
            go({
              to: `/tenants/${tenantSlug}/time-entries`,
              type: "push",
            });
          },
          onError: (error) => {
            message.error(error?.message || "Failed to update time entry");
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

  const handleProjectChange = () => {
    // Clear task selection when project changes
    form.setFieldValue("taskId", undefined);
  };

  const handleDelete = () => {
    deleteEntry(
      {
        resource: "time-entries",
        id: id!,
      },
      {
        onSuccess: () => {
          go({
            to: `/tenants/${tenantSlug}/time-entries`,
            type: "push",
          });
        },
        onError: (error) => {
          message.error(error?.message || "Failed to delete time entry");
        },
      }
    );
  };

  // Show loader while data is being fetched
  if (isLoading || !initialValues) {
    return (
      <ResponsiveContainer>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading time entry..." />
        </div>
      </ResponsiveContainer>
    );
  }

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
          Edit Time Entry
        </Title>
      </div>

      <Card>
        <TimeEntryForm
          form={form}
          initialValues={initialValues}
          onFinish={handleSubmit}
          submitButtonText="Update Time Entry"
          submitButtonLoading={isUpdating}
          onCancel={handleCancel}
          projects={projectsData?.data || []}
          tasks={tasksData?.data || []}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </Card>
    </ResponsiveContainer>
  );
};
