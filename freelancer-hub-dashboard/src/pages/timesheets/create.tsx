import React, { useState } from "react";
import { useGo, useCreate } from "@refinedev/core";
import { Card, Form, DatePicker, Button, Typography, Space } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useTenantSlug } from "../../contexts/tenant";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResponsiveContainer } from "../../components/responsive";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const { Title } = Typography;

export const TimesheetsCreate: React.FC = () => {
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const {
    mutate: createTimesheet,
    mutation: { isPending },
  } = useCreate();

  const [selectedWeek, setSelectedWeek] = useState<Dayjs | null>(null);

  const handleWeekChange = (date: Dayjs | null) => {
    if (date) {
      const weekStart = date.startOf("isoWeek");
      const weekEnd = date.endOf("isoWeek");
      setSelectedWeek(date);
      form.setFieldsValue({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
      });
    }
  };

  const onFinish = (values: any) => {
    const weekStart = values.weekStartDate.format("YYYY-MM-DD");
    const weekEnd = values.weekEndDate.format("YYYY-MM-DD");

    createTimesheet(
      {
        resource: "timesheets",
        values: {
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
        },
      },
      {
        onSuccess: (data) => {
          go({
            to: `/tenants/${tenantSlug}/timesheets/${data.data.data.id}/edit`,
            type: "push",
          });
        },
      }
    );
  };

  return (
    <ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" })
          }
        />
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Create New Timesheet
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            weekStartDate: dayjs().startOf("isoWeek"),
            weekEndDate: dayjs().endOf("isoWeek"),
          }}
        >
          <Form.Item
            label="Select Week"
            help="Select any day in the week to create a timesheet for that week"
          >
            <DatePicker
              style={{ width: "100%" }}
              value={selectedWeek}
              onChange={handleWeekChange}
              format="MMM DD, YYYY"
              placeholder="Select a date"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Week Start Date"
            name="weekStartDate"
            rules={[{ required: true, message: "Week start date is required" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="MMM DD, YYYY (dddd)"
              disabled
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Week End Date"
            name="weekEndDate"
            rules={[{ required: true, message: "Week end date is required" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="MMM DD, YYYY (dddd)"
              disabled
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isPending}
                size="large"
              >
                Create Timesheet
              </Button>
              <Button
                onClick={() =>
                  go({ to: `/tenants/${tenantSlug}/timesheets`, type: "push" })
                }
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </ResponsiveContainer>
  );
};
