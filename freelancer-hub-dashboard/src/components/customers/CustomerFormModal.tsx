import React, { useEffect } from "react";
import { Modal, Form, Input, Switch, Row, Col, message } from "antd";

type CustomerFormData = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
};

type CustomerFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormData) => Promise<void>;
  initialValues?: Partial<CustomerFormData>;
  isEditMode?: boolean;
  loading?: boolean;
};

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isEditMode = false,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={isEditMode ? "Edit Customer" : "New Customer"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditMode ? "Update" : "Create"}
      cancelText="Cancel"
      width={800}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true }}
        style={{ marginTop: 24 }}
      >
        {/* Basic Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: "Please enter customer name" },
                { max: 255, message: "Name must be less than 255 characters" },
              ]}
            >
              <Input placeholder="Enter customer name" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Company"
              name="company"
              rules={[
                { max: 255, message: "Company must be less than 255 characters" },
              ]}
            >
              <Input placeholder="Enter company name" size="large" />
            </Form.Item>
          </Col>
        </Row>

        {/* Contact Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="customer@example.com" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { max: 50, message: "Phone must be less than 50 characters" },
              ]}
            >
              <Input placeholder="+1 555-0100" size="large" />
            </Form.Item>
          </Col>
        </Row>

        {/* Address Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Address Line 1"
              name="addressLine1"
              rules={[
                { max: 255, message: "Address must be less than 255 characters" },
              ]}
            >
              <Input placeholder="Street address" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Address Line 2"
              name="addressLine2"
              rules={[
                { max: 255, message: "Address must be less than 255 characters" },
              ]}
            >
              <Input placeholder="Apt, suite, etc. (optional)" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="City"
              name="city"
              rules={[
                { max: 100, message: "City must be less than 100 characters" },
              ]}
            >
              <Input placeholder="City" size="large" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="State/Province"
              name="state"
              rules={[
                { max: 100, message: "State must be less than 100 characters" },
              ]}
            >
              <Input placeholder="State" size="large" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Postal Code"
              name="postalCode"
              rules={[
                { max: 20, message: "Postal code must be less than 20 characters" },
              ]}
            >
              <Input placeholder="12345" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Country"
              name="country"
              rules={[
                { max: 100, message: "Country must be less than 100 characters" },
              ]}
            >
              <Input placeholder="Country" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Status"
              name="isActive"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Notes */}
        <Form.Item label="Notes" name="notes">
          <Input.TextArea
            placeholder="Additional notes about this customer..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
