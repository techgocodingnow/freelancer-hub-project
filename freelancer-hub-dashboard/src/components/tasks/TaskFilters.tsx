/**
 * Enhanced Task Filters Component
 * Provides advanced filtering with saved views
 */

import React, { useState } from 'react';
import { Space, Select, Button, Popover, Input, Tag, Tooltip } from 'antd';
import {
  FilterOutlined,
  SaveOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { tokens } from '../../theme';

const { Option } = Select;

export interface TaskFilter {
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: TaskFilter;
  isFavorite?: boolean;
}

interface TaskFiltersProps {
  filters: TaskFilter;
  onFiltersChange: (filters: TaskFilter) => void;
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: TaskFilter) => void;
  onDeleteView?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  savedViews = [],
  onSaveView,
  onDeleteView,
  onToggleFavorite,
}) => {
  const [saveViewVisible, setSaveViewVisible] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleSaveView = () => {
    if (viewName.trim() && onSaveView) {
      onSaveView(viewName, filters);
      setViewName('');
      setSaveViewVisible(false);
    }
  };

  const handleLoadView = (view: SavedView) => {
    onFiltersChange(view.filters);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const saveViewContent = (
    <div style={{ width: 250 }}>
      <Input
        placeholder="View name"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        onPressEnter={handleSaveView}
        style={{ marginBottom: tokens.spacing[2] }}
      />
      <Button
        type="primary"
        size="small"
        block
        onClick={handleSaveView}
        disabled={!viewName.trim()}
      >
        Save View
      </Button>
    </div>
  );

  return (
    <div>
      {/* Quick Filters */}
      <Space wrap style={{ marginBottom: tokens.spacing[4] }}>
        {/* Search */}
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ width: 200 }}
          allowClear
        />

        {/* Status Filter */}
        <Select
          placeholder="Status"
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="todo">To Do</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="review">Review</Option>
          <Option value="done">Done</Option>
        </Select>

        {/* Priority Filter */}
        <Select
          placeholder="Priority"
          value={filters.priority}
          onChange={(value) => handleFilterChange('priority', value)}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="urgent">Urgent</Option>
          <Option value="high">High</Option>
          <Option value="medium">Medium</Option>
          <Option value="low">Low</Option>
        </Select>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button onClick={handleClearFilters}>
            Clear Filters ({activeFilterCount})
          </Button>
        )}

        {/* Save View */}
        {onSaveView && (
          <Popover
            content={saveViewContent}
            title="Save Current View"
            trigger="click"
            open={saveViewVisible}
            onOpenChange={setSaveViewVisible}
          >
            <Button icon={<SaveOutlined />}>Save View</Button>
          </Popover>
        )}
      </Space>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <Space wrap style={{ marginBottom: tokens.spacing[3] }}>
          <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.secondary }}>
            Saved Views:
          </span>
          {savedViews.map((view) => (
            <Tag
              key={view.id}
              style={{
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: tokens.borderRadius.md,
              }}
              onClick={() => handleLoadView(view)}
            >
              <Space size={4}>
                {view.isFavorite ? (
                  <StarFilled
                    style={{ color: tokens.colors.semantic.warning }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(view.id);
                    }}
                  />
                ) : (
                  <StarOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(view.id);
                    }}
                  />
                )}
                <span>{view.name}</span>
                {onDeleteView && (
                  <DeleteOutlined
                    style={{ color: tokens.colors.semantic.error }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteView(view.id);
                    }}
                  />
                )}
              </Space>
            </Tag>
          ))}
        </Space>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Space wrap style={{ marginBottom: tokens.spacing[2] }}>
          <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.secondary }}>
            Active Filters:
          </span>
          {filters.status && (
            <Tag closable onClose={() => handleFilterChange('status', undefined)}>
              Status: {filters.status}
            </Tag>
          )}
          {filters.priority && (
            <Tag closable onClose={() => handleFilterChange('priority', undefined)}>
              Priority: {filters.priority}
            </Tag>
          )}
          {filters.assignee && (
            <Tag closable onClose={() => handleFilterChange('assignee', undefined)}>
              Assignee: {filters.assignee}
            </Tag>
          )}
          {filters.search && (
            <Tag closable onClose={() => handleFilterChange('search', undefined)}>
              Search: "{filters.search}"
            </Tag>
          )}
        </Space>
      )}
    </div>
  );
};

export default TaskFilters;

