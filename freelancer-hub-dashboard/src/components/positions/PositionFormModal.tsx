import { Modal, Form, Input, Switch, message } from "antd";
import { useEffect } from "react";
import api from "../../services/api/api";
import { Position, CreatePositionPayload, UpdatePositionPayload } from "../../services/api/types";

type PositionFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  position?: Position;
  isEditMode: boolean;
};

export const PositionFormModal = ({
  open,
  onClose,
  onSuccess,
  position,
  isEditMode,
}: PositionFormModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && isEditMode && position) {
      form.setFieldsValue({
        name: position.name,
        description: position.description || "",
        isActive: position.isActive,
      });
    } else if (open && !isEditMode) {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
      });
    }
  }, [open, isEditMode, position, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditMode && position) {
        const updateData: UpdatePositionPayload = {
          name: values.name,
          description: values.description || undefined,
          isActive: values.isActive,
        };
        await api.updatePosition(position.id, updateData);
        message.success("Position updated successfully");
      } else {
        const createData: CreatePositionPayload = {
          name: values.name,
          description: values.description || undefined,
        };
        await api.createPosition(createData);
        message.success("Position created successfully");
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.errorFields) {
        message.error("Please check the form for errors");
      } else {
        message.error(`Failed to ${isEditMode ? "update" : "create"} position`);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isEditMode ? "Edit Position" : "Create Position"}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText={isEditMode ? "Update" : "Create"}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isActive: true,
        }}
      >
        <Form.Item
          label="Position Name"
          name="name"
          rules={[
            { required: true, message: "Please enter position name" },
            { max: 100, message: "Position name cannot exceed 100 characters" },
          ]}
        >
          <Input placeholder="e.g., Senior Developer, Project Manager" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 500, message: "Description cannot exceed 500 characters" },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Optional description of the position"
          />
        </Form.Item>

        {isEditMode && (
          <Form.Item
            label="Active"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
