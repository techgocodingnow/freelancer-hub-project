import React, { useState } from "react";
import {
  Modal,
  Upload,
  Button,
  Alert,
  Table,
  Space,
  Switch,
  Typography,
  message,
  Spin,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useApiUrl } from "@refinedev/core";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { TOKEN_KEY, TENANT_SLUG_KEY } from "../../constants/auth";
import dayjs from "dayjs";

const { Dragger } = Upload;
const { Text, Title } = Typography;

type CsvUploadModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ParsedRow = {
  Date: string;
  Project: string;
  Task: string;
  "Start Time"?: string;
  "End Time"?: string;
  "Duration (minutes)"?: string;
  Description: string;
  Notes?: string;
  Billable: string;
};

type ImportError = {
  row: number;
  field: string;
  message: string;
};

type ImportResponse = {
  success: boolean;
  imported: number;
  failed: number;
  errors?: ImportError[];
  tasksCreated?: string[];
};

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const isMobile = useIsMobile();
  const apiUrl = useApiUrl();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [autoCreatedTasks, setAutoCreatedTasks] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleClose = () => {
    setFileList([]);
    setPreviewData([]);
    setImportErrors([]);
    setAutoCreatedTasks([]);
    setSkipInvalid(false);
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      "Date",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Duration (minutes)",
      "Description",
      "Notes",
      "Billable",
    ];
    const exampleRow = [
      dayjs().format("YYYY-MM-DD"),
      "Project Name",
      "Task Name (will be auto-created if doesn't exist)",
      "09:00",
      "12:00",
      "",
      "Description of work done",
      "Optional notes",
      "Yes",
    ];

    const csvContent = [headers, exampleRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `time-entries-template-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success("Template downloaded successfully");
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const uploadProps: UploadProps = {
    accept: ".csv",
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
      if (!isCSV) {
        message.error("You can only upload CSV files!");
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("CSV file must be smaller than 10MB!");
        return false;
      }

      // Read and preview CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseCSV(text);
          setPreviewData(parsed);
          setFileList([file]);
        } catch (error) {
          message.error("Failed to parse CSV file");
          console.error(error);
        }
      };
      reader.readAsText(file);

      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
      setPreviewData([]);
      setImportErrors([]);
    },
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    setImportErrors([]);

    const formData = new FormData();
    formData.append("csv", fileList[0] as any);
    if (skipInvalid) {
      formData.append("skipInvalid", "true");
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);

      const response = await fetch(`${apiUrl}/time-entries/import`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-Slug": tenantSlug || "",
        },
        body: formData,
      });

      const data: ImportResponse = await response.json();

      if (response.ok) {
        // Set auto-created tasks if any
        if (data.tasksCreated && data.tasksCreated.length > 0) {
          setAutoCreatedTasks(data.tasksCreated);
        }

        if (data.failed > 0 && data.errors) {
          setImportErrors(data.errors);
          message.warning(
            `Imported ${data.imported} entries, ${data.failed} failed`
          );
        } else {
          const taskMsg = data.tasksCreated && data.tasksCreated.length > 0
            ? ` (${data.tasksCreated.length} new task${data.tasksCreated.length > 1 ? 's' : ''} created)`
            : '';
          message.success(`Successfully imported ${data.imported} time entries${taskMsg}`);

          // Only close if there are no auto-created tasks to show
          if (!data.tasksCreated || data.tasksCreated.length === 0) {
            handleClose();
            onSuccess();
          } else {
            // Keep modal open to show auto-created tasks
            onSuccess();
          }
        }
      } else {
        if (data.errors) {
          setImportErrors(data.errors);
        }
        message.error("Failed to import CSV file");
      }
    } catch (error) {
      console.error("Import error:", error);
      message.error("An error occurred while importing");
    } finally {
      setImporting(false);
    }
  };

  const previewColumns = [
    {
      title: "Date",
      dataIndex: "Date",
      key: "date",
      width: 120,
    },
    {
      title: "Project",
      dataIndex: "Project",
      key: "project",
      width: 150,
    },
    {
      title: "Task",
      dataIndex: "Task",
      key: "task",
      width: 150,
    },
    {
      title: "Duration",
      key: "duration",
      width: 100,
      render: (_: any, record: ParsedRow) => {
        if (record["Start Time"] && record["End Time"]) {
          return `${record["Start Time"]} - ${record["End Time"]}`;
        }
        return record["Duration (minutes)"] ? `${record["Duration (minutes)"]} min` : "-";
      },
    },
    {
      title: "Description",
      dataIndex: "Description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Billable",
      dataIndex: "Billable",
      key: "billable",
      width: 80,
    },
  ];

  const errorColumns = [
    {
      title: "Row",
      dataIndex: "row",
      key: "row",
      width: 80,
    },
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
      width: 120,
    },
    {
      title: "Error Message",
      dataIndex: "message",
      key: "message",
    },
  ];

  return (
    <Modal
      title={<Title level={3}>Import Time Entries from CSV</Title>}
      open={visible}
      onCancel={handleClose}
      width={isMobile ? "100%" : 900}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Template Download */}
        <Alert
          message="Download Template"
          description="Download the CSV template to ensure correct formatting"
          type="info"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
            >
              Download Template
            </Button>
          }
        />

        {/* Auto-Creation Info */}
        <Alert
          message="Automatic Task Creation"
          description="Tasks that don't exist in the project will be automatically created with default values (status: In Progress, priority: Medium, assigned to you)"
          type="info"
          showIcon
        />

        {/* File Upload */}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag CSV file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single CSV file upload. Maximum file size: 10MB
          </p>
        </Dragger>

        {/* Preview */}
        {previewData.length > 0 && (
          <>
            <div>
              <Title level={5}>
                Preview ({previewData.length} entries)
              </Title>
              <Table
                dataSource={previewData.slice(0, 10)} // Show first 10 rows
                columns={previewColumns}
                size="small"
                pagination={false}
                scroll={{ x: 800 }}
                rowKey={(_, index) => index!}
              />
              {previewData.length > 10 && (
                <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                  Showing first 10 of {previewData.length} entries
                </Text>
              )}
            </div>

            {/* Import Options */}
            <Space align="center">
              <Text>Skip invalid rows:</Text>
              <Switch checked={skipInvalid} onChange={setSkipInvalid} />
              <Text type="secondary">
                (If enabled, valid rows will be imported even if some rows have
                errors)
              </Text>
            </Space>
          </>
        )}

        {/* Auto-Created Tasks */}
        {autoCreatedTasks.length > 0 && (
          <Alert
            message="Tasks Auto-Created"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  The following tasks were automatically created during import:
                </p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  {autoCreatedTasks.map((task, index) => (
                    <li key={index}>{task}</li>
                  ))}
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                  <Text type="secondary">
                    These tasks have been created with status "In Progress", priority "Medium", and assigned to you.
                  </Text>
                </p>
              </div>
            }
            type="success"
            showIcon
          />
        )}

        {/* Errors */}
        {importErrors.length > 0 && (
          <>
            <Alert
              message="Import Errors"
              description={`${importErrors.length} row(s) have errors. ${
                skipInvalid
                  ? "Valid rows were imported successfully."
                  : "Please fix the errors and try again."
              }`}
              type="error"
              showIcon
            />
            <Table
              dataSource={importErrors}
              columns={errorColumns}
              size="small"
              pagination={{ pageSize: 5 }}
              rowKey={(record) => `${record.row}-${record.field}`}
            />
          </>
        )}

        {/* Actions */}
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button icon={<CloseOutlined />} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={importing ? <Spin size="small" /> : <UploadOutlined />}
            onClick={handleImport}
            disabled={fileList.length === 0 || importing}
            loading={importing}
          >
            Import {previewData.length > 0 && `(${previewData.length} entries)`}
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};
