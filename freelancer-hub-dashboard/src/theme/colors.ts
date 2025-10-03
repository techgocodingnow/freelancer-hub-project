/**
 * Color System for Freelancer Hub
 * Based on research from Linear, Asana, Monday.com, and other leading platforms
 */

export const colors = {
  // Primary Colors
  primary: {
    main: '#1890ff',
    hover: '#40a9ff',
    active: '#096dd9',
    light: '#e6f7ff',
    dark: '#0050b3',
  },

  // Priority Colors (Task Management)
  priority: {
    urgent: '#ff4d4f',
    high: '#fa8c16',
    medium: '#1890ff',
    low: '#d9d9d9',
  },

  // Status Colors (Workflow States)
  status: {
    todo: '#8c8c8c',
    in_progress: '#1890ff',
    review: '#faad14',
    done: '#52c41a',
    blocked: '#ff4d4f',
  },

  // Semantic Colors
  semantic: {
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
  },

  // Due Date Colors
  dueDate: {
    overdue: '#ff4d4f',
    dueToday: '#faad14',
    dueSoon: '#1890ff',
    onTrack: '#52c41a',
  },

  // Neutral Grays (Light Mode)
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    950: '#141414',
  },

  // Dark Mode Colors
  dark: {
    bg: {
      primary: '#141414',
      secondary: '#1f1f1f',
      tertiary: '#262626',
      elevated: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#d9d9d9',
      tertiary: '#8c8c8c',
      disabled: '#595959',
    },
    border: {
      primary: '#434343',
      secondary: '#2d2d2d',
    },
  },

  // Background Colors
  background: {
    default: '#ffffff',
    paper: '#fafafa',
    elevated: '#ffffff',
    hover: '#f5f5f5',
    active: '#f0f0f0',
  },

  // Text Colors
  text: {
    primary: '#262626',
    secondary: '#595959',
    tertiary: '#8c8c8c',
    disabled: '#bfbfbf',
    inverse: '#ffffff',
  },

  // Border Colors
  border: {
    default: '#f0f0f0',
    light: '#f5f5f5',
    medium: '#d9d9d9',
    dark: '#bfbfbf',
  },
} as const;

// Helper function to get priority color
export const getPriorityColor = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    urgent: colors.priority.urgent,
    high: colors.priority.high,
    medium: colors.priority.medium,
    low: colors.priority.low,
  };
  return priorityMap[priority] || colors.priority.medium;
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    todo: colors.status.todo,
    in_progress: colors.status.in_progress,
    review: colors.status.review,
    done: colors.status.done,
    blocked: colors.status.blocked,
  };
  return statusMap[status] || colors.status.todo;
};

// Helper function to get due date color
export const getDueDateColor = (dueDate: string): string => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return colors.dueDate.overdue;
  if (diffDays === 0) return colors.dueDate.dueToday;
  if (diffDays <= 3) return colors.dueDate.dueSoon;
  return colors.dueDate.onTrack;
};

export default colors;

