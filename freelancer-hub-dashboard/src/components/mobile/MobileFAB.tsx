/**
 * Mobile Floating Action Button (FAB)
 * Quick access to create new tasks on mobile
 */

import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useGo } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { useTenantSlug } from '../../contexts/tenant';
import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useMediaQuery';

export const MobileFAB: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const isMobile = useIsMobile();

  if (!isMobile || !projectId) return null;

  const handleClick = () => {
    go({
      to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/create`,
      type: 'push',
    });
  };

  return (
    <Button
      type="primary"
      shape="circle"
      size="large"
      icon={<PlusOutlined style={{ fontSize: '24px' }} />}
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '80px', // Above bottom nav
        right: tokens.spacing[4],
        width: '56px',
        height: '56px',
        zIndex: tokens.zIndex.modal - 1,
        boxShadow: tokens.shadows.xl,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Create new task"
    />
  );
};

export default MobileFAB;

