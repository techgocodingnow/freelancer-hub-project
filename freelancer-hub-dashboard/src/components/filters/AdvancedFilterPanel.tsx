/**
 * Advanced Filter Panel
 * Comprehensive filtering UI with multiple criteria
 */

import React, { useState, useMemo } from "react";
import {
  Drawer,
  Space,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Divider,
  Typography,
  Tag,
  Checkbox,
} from "antd";
import {
  FilterOutlined,
  CloseOutlined,
  SaveOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { FilterCriteria, SavedFilter } from "../../hooks/useAdvancedFilters";
import { tokens } from "../../theme";
import { useIsMobile } from "../../hooks/useMediaQuery";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedFilterPanelProps {
  open: boolean;
  onClose: () => void;
  criteria: FilterCriteria;
  onCriteriaChange: (criteria: Partial<FilterCriteria>) => void;
  onClear: () => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string) => void;
  onLoadFilter: (filterId: string) => void;
  onDeleteFilter: (filterId: string) => void;
  users?: Array<{ id: number; fullName: string }>;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  open,
  onClose,
  criteria = {}, // Add default empty object
  onCriteriaChange,
  onClear,
  savedFilters = [], // Add default empty array
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  users = [],
}) => {
  const isMobile = useIsMobile();
  const [filterName, setFilterName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Normalize array values to ensure they're always arrays
  const normalizeArrayValue = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value]; // Convert single value to array
  };

  // Normalize criteria to ensure array fields are always arrays
  // Use useMemo to prevent unnecessary re-renders and ensure stable references
  const normalizedCriteria = useMemo(
    () => ({
      ...criteria,
      status: normalizeArrayValue(criteria?.status),
      priority: normalizeArrayValue(criteria?.priority),
      assigneeId: normalizeArrayValue(criteria?.assigneeId),
    }),
    [criteria]
  );

  const handleSave = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim());
      setFilterName("");
      setShowSaveInput(false);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <FilterOutlined />
          <span>Advanced Filters</span>
        </Space>
      }
      placement={isMobile ? "bottom" : "right"}
      onClose={onClose}
      open={open}
      width={isMobile ? "100%" : 400}
      height={isMobile ? "80%" : undefined}
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          aria-label="Close filters"
        />
      }
    >
      <Space
        direction="vertical"
        style={{ width: "100%" }}
        size={tokens.spacing[4]}
      >
        {/* Saved Filters */}
        {savedFilters && savedFilters.length > 0 && (
          <>
            <div>
              <Title level={5}>Saved Filters</Title>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size={tokens.spacing[2]}
              >
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: tokens.spacing[2],
                      backgroundColor: tokens.colors.background.default,
                      borderRadius: tokens.borderRadius.md,
                    }}
                  >
                    <Button
                      type="link"
                      onClick={() => onLoadFilter(filter.id)}
                      style={{ padding: 0 }}
                    >
                      {filter.name}
                      {filter.isDefault && (
                        <Tag
                          color="blue"
                          style={{ marginLeft: tokens.spacing[2] }}
                        >
                          Default
                        </Tag>
                      )}
                    </Button>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => onDeleteFilter(filter.id)}
                      aria-label={`Delete ${filter.name}`}
                    />
                  </div>
                ))}
              </Space>
            </div>
            <Divider />
          </>
        )}

        {/* Search */}
        <div>
          <Text strong>Search</Text>
          <Input
            placeholder="Search tasks..."
            value={criteria.searchText}
            onChange={(e) => onCriteriaChange({ searchText: e.target.value })}
            allowClear
            style={{ marginTop: tokens.spacing[2] }}
          />
        </div>

        {/* Status */}
        <div>
          <Text strong>Status</Text>
          <Select
            mode="multiple"
            placeholder="Select status"
            value={normalizedCriteria.status || []}
            onChange={(value) => onCriteriaChange({ status: value || [] })}
            style={{ width: "100%", marginTop: tokens.spacing[2] }}
            allowClear
          >
            <Option value="todo">To Do</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="review">Review</Option>
            <Option value="done">Done</Option>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <Text strong>Priority</Text>
          <Select
            mode="multiple"
            placeholder="Select priority"
            value={normalizedCriteria.priority || []}
            onChange={(value) => onCriteriaChange({ priority: value || [] })}
            style={{ width: "100%", marginTop: tokens.spacing[2] }}
            allowClear
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </div>

        {/* Assignee */}
        {users.length > 0 && (
          <div>
            <Text strong>Assignee</Text>
            <Select
              mode="multiple"
              placeholder="Select assignee"
              value={normalizedCriteria.assigneeId || []}
              onChange={(value) =>
                onCriteriaChange({ assigneeId: value || [] })
              }
              style={{ width: "100%", marginTop: tokens.spacing[2] }}
              allowClear
              showSearch
              filterOption={(input, option) => {
                const label = String(option?.children || "");
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.fullName}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* Due Date Range */}
        <div>
          <Text strong>Due Date Range</Text>
          <RangePicker
            value={[
              criteria.dueDateFrom ? dayjs(criteria.dueDateFrom) : null,
              criteria.dueDateTo ? dayjs(criteria.dueDateTo) : null,
            ]}
            onChange={(dates) => {
              onCriteriaChange({
                dueDateFrom: dates?.[0]?.format("YYYY-MM-DD"),
                dueDateTo: dates?.[1]?.format("YYYY-MM-DD"),
              });
            }}
            style={{ width: "100%", marginTop: tokens.spacing[2] }}
          />
        </div>

        {/* Estimated Hours Range */}
        <div>
          <Text strong>Estimated Hours</Text>
          <Space style={{ width: "100%", marginTop: tokens.spacing[2] }}>
            <InputNumber
              placeholder="Min"
              value={criteria.estimatedHoursMin}
              onChange={(value) =>
                onCriteriaChange({ estimatedHoursMin: value || undefined })
              }
              min={0}
              style={{ width: "100%" }}
            />
            <span>to</span>
            <InputNumber
              placeholder="Max"
              value={criteria.estimatedHoursMax}
              onChange={(value) =>
                onCriteriaChange({ estimatedHoursMax: value || undefined })
              }
              min={0}
              style={{ width: "100%" }}
            />
          </Space>
        </div>

        {/* Favorites */}
        <div>
          <Checkbox
            checked={criteria.isFavorite}
            onChange={(e) => onCriteriaChange({ isFavorite: e.target.checked })}
          >
            Show only favorites
          </Checkbox>
        </div>

        <Divider />

        {/* Save Filter */}
        {showSaveInput ? (
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Filter name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onPressEnter={handleSave}
            />
            <Button type="primary" onClick={handleSave}>
              Save
            </Button>
            <Button onClick={() => setShowSaveInput(false)}>Cancel</Button>
          </Space.Compact>
        ) : (
          <Button
            icon={<SaveOutlined />}
            onClick={() => setShowSaveInput(true)}
            block
          >
            Save Current Filter
          </Button>
        )}

        {/* Actions */}
        <Space style={{ width: "100%" }}>
          <Button onClick={onClear} block>
            Clear All
          </Button>
          <Button type="primary" onClick={onClose} block>
            Apply Filters
          </Button>
        </Space>
      </Space>
    </Drawer>
  );
};

export default AdvancedFilterPanel;
