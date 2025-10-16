import React, { useState } from "react";
import { Modal, Form, Input, Button, message, Select, Space, Typography } from "antd";
import { MailOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

interface SendInvoiceModalProps {
  visible: boolean;
  invoiceId: number | null;
  invoiceNumber?: string;
  defaultEmail?: string;
  onCancel: () => void;
  onSubmit: (values: {
    email: string;
    ccEmails?: string[];
    subject?: string;
    message?: string;
  }) => Promise<void>;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  visible,
  invoiceId,
  invoiceNumber,
  defaultEmail,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
      message.success("Invoice sent successfully");
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error from form
        return;
      }
      message.error(error.message || "Failed to send invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          <span>Send Invoice {invoiceNumber}</span>
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText="Send Invoice"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          email: defaultEmail,
          ccEmails: [],
        }}
      >
        <Form.Item
          name="email"
          label="Recipient Email"
          rules={[
            { required: true, message: "Please enter recipient email" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="customer@example.com" prefix={<MailOutlined />} />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>CC Recipients (Optional)</span>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Max 10 recipients
              </Text>
            </Space>
          }
        >
          <Form.List name="ccEmails">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      rules={[
                        { type: "email", message: "Please enter a valid email address" },
                      ]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Input placeholder="cc@example.com" prefix={<MailOutlined />} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                ))}
                {fields.length < 10 && (
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add CC Recipient
                  </Button>
                )}
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          name="subject"
          label="Email Subject (Optional)"
          rules={[
            { max: 255, message: "Subject must not exceed 255 characters" },
          ]}
        >
          <Input placeholder={`Invoice ${invoiceNumber} from Freelancer Hub`} />
        </Form.Item>

        <Form.Item
          name="message"
          label="Custom Message (Optional)"
          rules={[
            { max: 1000, message: "Message must not exceed 1000 characters" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Add a custom message to include in the email (optional)"
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: "12px" }}>
          Note: The invoice PDF will be automatically attached to the email.
        </Text>
      </Form>
    </Modal>
  );
};
