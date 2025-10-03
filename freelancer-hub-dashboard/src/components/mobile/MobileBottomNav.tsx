/**
 * Mobile Bottom Navigation
 * Provides quick access to main views on mobile devices
 */

import React from 'react';
import { useGo } from '@refinedev/core';
import { useParams, useLocation } from 'react-router-dom';
import {
  UnorderedListOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTenantSlug } from '../../contexts/tenant';
import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useMediaQuery';

export const MobileBottomNav: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const tenantSlug = useTenantSlug();
  const go = useGo();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile || !projectId) return null;

  const navItems = [
    {
      key: 'list',
      icon: <UnorderedListOutlined />,
      label: 'List',
      path: `/tenants/${tenantSlug}/projects/${projectId}/tasks`,
    },
    {
      key: 'kanban',
      icon: <AppstoreOutlined />,
      label: 'Board',
      path: `/tenants/${tenantSlug}/projects/${projectId}/tasks/kanban`,
    },
    {
      key: 'calendar',
      icon: <CalendarOutlined />,
      label: 'Calendar',
      path: `/tenants/${tenantSlug}/projects/${projectId}/tasks/calendar`,
    },
    {
      key: 'timeline',
      icon: <ClockCircleOutlined />,
      label: 'Timeline',
      path: `/tenants/${tenantSlug}/projects/${projectId}/tasks/timeline`,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: tokens.colors.background.paper,
        borderTop: `1px solid ${tokens.colors.border.default}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: tokens.zIndex.sticky,
        boxShadow: tokens.shadows.lg,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.key}
            onClick={() => go({ to: item.path, type: 'push' })}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing[1],
              padding: tokens.spacing[2],
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? tokens.colors.primary.main : tokens.colors.text.secondary,
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: active ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.normal,
              transition: `all ${tokens.transitions.fast}`,
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;

