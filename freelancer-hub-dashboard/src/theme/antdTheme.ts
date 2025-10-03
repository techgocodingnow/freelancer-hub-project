/**
 * Ant Design Theme Configuration
 * Customizes Ant Design components with our design tokens
 */

import type { ThemeConfig } from "antd";
import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { tokens } from "./tokens";

export const lightTheme: ThemeConfig = {
  token: {
    // Color Tokens
    colorPrimary: colors.primary.main,
    colorSuccess: colors.semantic.success,
    colorWarning: colors.semantic.warning,
    colorError: colors.semantic.error,
    colorInfo: colors.semantic.info,

    // Typography
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.md,
    fontSizeHeading1: typography.fontSize["5xl"],
    fontSizeHeading2: typography.fontSize["4xl"],
    fontSizeHeading3: typography.fontSize["3xl"],
    fontSizeHeading4: typography.fontSize["2xl"],
    fontSizeHeading5: typography.fontSize.xl,

    // Border Radius
    borderRadius: tokens.borderRadius.lg,
    borderRadiusLG: tokens.borderRadius.xl,
    borderRadiusSM: tokens.borderRadius.md,

    // Spacing
    padding: spacing[4],
    paddingLG: spacing[6],
    paddingSM: spacing[3],
    paddingXS: spacing[2],

    margin: spacing[4],
    marginLG: spacing[6],
    marginSM: spacing[3],
    marginXS: spacing[2],

    // Shadows
    boxShadow: tokens.shadows.sm,
    boxShadowSecondary: tokens.shadows.md,

    // Line Height
    lineHeight: typography.lineHeight.normal,

    // Control Heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },

  components: {
    // Button Component
    Button: {
      borderRadius: tokens.borderRadius.lg,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      fontWeight: typography.fontWeight.medium,
    },

    // Card Component
    Card: {
      borderRadiusLG: tokens.borderRadius.xl,
      boxShadowTertiary: tokens.shadows.sm,
    },

    // Table Component
    Table: {
      borderRadius: tokens.borderRadius.lg,
      headerBg: colors.gray[50],
      headerColor: colors.text.primary,
      rowHoverBg: colors.background.hover,
    },

    // Tag Component
    Tag: {
      borderRadiusSM: tokens.borderRadius.md,
      fontSizeSM: typography.fontSize.xs,
    },

    // Modal Component
    Modal: {
      borderRadiusLG: tokens.borderRadius.xl,
    },

    // Input Component
    Input: {
      borderRadius: tokens.borderRadius.lg,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },

    // Select Component
    Select: {
      borderRadius: tokens.borderRadius.lg,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },

    // Layout Component
    Layout: {
      headerBg: colors.background.default,
      headerHeight: 64,
      headerPadding: `0 ${spacing[6]}px`,
      siderBg: colors.background.paper,
      bodyBg: colors.background.default,
    },

    // Menu Component
    Menu: {
      itemBorderRadius: tokens.borderRadius.lg,
      itemHeight: 40,
      itemMarginInline: spacing[2],
    },
  },
};

export const darkTheme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    colorBgBase: colors.dark.bg.primary,
    colorTextBase: colors.dark.text.primary,
  },
  components: {
    ...lightTheme.components,
    Layout: {
      ...lightTheme.components?.Layout,
      headerBg: colors.dark.bg.secondary,
      siderBg: colors.dark.bg.secondary,
      bodyBg: colors.dark.bg.primary,
    },
    Table: {
      ...lightTheme.components?.Table,
      headerBg: colors.dark.bg.tertiary,
      headerColor: colors.dark.text.primary,
      rowHoverBg: colors.dark.bg.tertiary,
    },
  },
};

export default lightTheme;
