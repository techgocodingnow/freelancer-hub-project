/**
 * Filter Chips Component
 * Displays active filters as removable chips
 */

import React from 'react';
import { Space, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { FilterCriteria } from '../../hooks/useAdvancedFilters';
import { tokens } from '../../theme';

interface FilterChipsProps {
  criteria: FilterCriteria;
  onRemove: (key: keyof FilterCriteria) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  criteria,
  onRemove,
  onClearAll,
}) => {
  const chips: Array<{ key: keyof FilterCriteria; label: string }> = [];

  if (criteria.status && criteria.status.length > 0) {
    chips.push({
      key: 'status',
      label: `Status: ${criteria.status.join(', ')}`,
    });
  }

  if (criteria.priority && criteria.priority.length > 0) {
    chips.push({
      key: 'priority',
      label: `Priority: ${criteria.priority.join(', ')}`,
    });
  }

  if (criteria.assigneeId && criteria.assigneeId.length > 0) {
    chips.push({
      key: 'assigneeId',
      label: `Assignee: ${criteria.assigneeId.length} selected`,
    });
  }

  if (criteria.dueDateFrom || criteria.dueDateTo) {
    const from = criteria.dueDateFrom || 'any';
    const to = criteria.dueDateTo || 'any';
    chips.push({
      key: 'dueDateFrom',
      label: `Due: ${from} to ${to}`,
    });
  }

  if (criteria.estimatedHoursMin !== undefined || criteria.estimatedHoursMax !== undefined) {
    const min = criteria.estimatedHoursMin ?? 0;
    const max = criteria.estimatedHoursMax ?? '∞';
    chips.push({
      key: 'estimatedHoursMin',
      label: `Hours: ${min} - ${max}`,
    });
  }

  if (criteria.searchText) {
    chips.push({
      key: 'searchText',
      label: `Search: "${criteria.searchText}"`,
    });
  }

  if (criteria.isFavorite) {
    chips.push({
      key: 'isFavorite',
      label: 'Favorites only',
    });
  }

  if (chips.length === 0) return null;

  return (
    <Space wrap style={{ marginBottom: tokens.spacing[3] }}>
      {chips.map((chip) => (
        <Tag
          key={chip.key}
          closable
          onClose={() => onRemove(chip.key)}
          closeIcon={<CloseOutlined />}
          color="blue"
          style={{ fontSize: tokens.typography.fontSize.sm }}
        >
          {chip.label}
        </Tag>
      ))}
      <Tag
        onClick={onClearAll}
        style={{
          cursor: 'pointer',
          fontSize: tokens.typography.fontSize.sm,
          borderStyle: 'dashed',
        }}
      >
        Clear all
      </Tag>
    </Space>
  );
};

export default FilterChips;

