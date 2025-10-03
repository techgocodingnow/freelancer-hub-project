/**
 * Saved Views Panel
 * UI for managing saved view configurations
 */

import React, { useState } from 'react';
import {
  Drawer,
  Space,
  Button,
  Input,
  List,
  Typography,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  CopyOutlined,
  CheckOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ViewConfiguration } from '../../hooks/useSavedViewsEnhanced';
import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useMediaQuery';

const { Title, Text } = Typography;

interface SavedViewsPanelProps {
  open: boolean;
  onClose: () => void;
  views: ViewConfiguration[];
  currentViewId: string | null;
  onLoadView: (viewId: string) => void;
  onDeleteView: (viewId: string) => void;
  onToggleFavorite: (viewId: string) => void;
  onSetDefault: (viewId: string) => void;
  onDuplicate: (viewId: string, newName?: string) => void;
}

export const SavedViewsPanel: React.FC<SavedViewsPanelProps> = ({
  open,
  onClose,
  views,
  currentViewId,
  onLoadView,
  onDeleteView,
  onToggleFavorite,
  onSetDefault,
  onDuplicate,
}) => {
  const isMobile = useIsMobile();
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const handleDuplicate = (viewId: string) => {
    if (duplicateName.trim()) {
      onDuplicate(viewId, duplicateName.trim());
      setDuplicateName('');
      setDuplicatingId(null);
      message.success('View duplicated successfully');
    }
  };

  const handleSetDefault = (viewId: string) => {
    onSetDefault(viewId);
    message.success('Default view updated');
  };

  const handleDelete = (viewId: string) => {
    onDeleteView(viewId);
    message.success('View deleted');
  };

  const sortedViews = [...views].sort((a, b) => {
    // Favorites first
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // Then by updated date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <Drawer
      title={
        <Space>
          <EyeOutlined />
          <span>Saved Views</span>
        </Space>
      }
      placement={isMobile ? 'bottom' : 'right'}
      onClose={onClose}
      open={open}
      width={isMobile ? '100%' : 400}
      height={isMobile ? '80%' : undefined}
    >
      {views.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: tokens.spacing[8],
            color: tokens.colors.text.secondary,
          }}
        >
          <Text type="secondary">No saved views yet</Text>
          <br />
          <Text type="secondary" style={{ fontSize: tokens.typography.fontSize.sm }}>
            Create a view to save your current filters and settings
          </Text>
        </div>
      ) : (
        <List
          dataSource={sortedViews}
          renderItem={(view) => (
            <List.Item
              key={view.id}
              style={{
                padding: tokens.spacing[3],
                backgroundColor:
                  currentViewId === view.id
                    ? tokens.colors.primary.light
                    : 'transparent',
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing[2],
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={tokens.spacing[2]}>
                {/* View Name and Tags */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Text strong>{view.name}</Text>
                    <div style={{ marginTop: tokens.spacing[1] }}>
                      <Space size={tokens.spacing[1]} wrap>
                        <Tag color="blue" style={{ fontSize: tokens.typography.fontSize.xs }}>
                          {view.viewType}
                        </Tag>
                        {view.isDefault && (
                          <Tag color="green" style={{ fontSize: tokens.typography.fontSize.xs }}>
                            Default
                          </Tag>
                        )}
                        {currentViewId === view.id && (
                          <Tag color="purple" style={{ fontSize: tokens.typography.fontSize.xs }}>
                            Active
                          </Tag>
                        )}
                      </Space>
                    </div>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={view.isFavorite ? <StarFilled /> : <StarOutlined />}
                    onClick={() => onToggleFavorite(view.id)}
                    style={{ color: view.isFavorite ? tokens.colors.semantic.warning : undefined }}
                    aria-label={view.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  />
                </div>

                {/* Actions */}
                <Space size={tokens.spacing[1]} wrap>
                  <Button
                    size="small"
                    onClick={() => onLoadView(view.id)}
                    disabled={currentViewId === view.id}
                  >
                    Load
                  </Button>
                  {!view.isDefault && (
                    <Button
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleSetDefault(view.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  {duplicatingId === view.id ? (
                    <Space.Compact size="small">
                      <Input
                        placeholder="New name"
                        value={duplicateName}
                        onChange={(e) => setDuplicateName(e.target.value)}
                        onPressEnter={() => handleDuplicate(view.id)}
                        style={{ width: '120px' }}
                      />
                      <Button onClick={() => handleDuplicate(view.id)}>OK</Button>
                      <Button onClick={() => setDuplicatingId(null)}>Cancel</Button>
                    </Space.Compact>
                  ) : (
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => setDuplicatingId(view.id)}
                    >
                      Duplicate
                    </Button>
                  )}
                  <Popconfirm
                    title="Delete this view?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(view.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>

                {/* Metadata */}
                <Text
                  type="secondary"
                  style={{ fontSize: tokens.typography.fontSize.xs }}
                >
                  Updated: {new Date(view.updatedAt).toLocaleDateString()}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default SavedViewsPanel;

