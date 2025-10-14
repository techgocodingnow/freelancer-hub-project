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
      paper: '#1f1f1f',
      hover: '#2d2d2d',
      active: '#343434',
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
      default: '#2d2d2d',
      light: '#262626',
      medium: '#434343',
      dark: '#595959',
    },
    // Dark mode specific priority colors (slightly muted for better contrast)
    priority: {
      urgent: '#ff7875',
      high: '#ffa940',
      medium: '#40a9ff',
      low: '#bfbfbf',
    },
    // Dark mode specific status colors
    status: {
      todo: '#bfbfbf',
      in_progress: '#40a9ff',
      review: '#ffc53d',
      done: '#73d13d',
      blocked: '#ff7875',
    },
    // Dark mode specific due date colors
    dueDate: {
      overdue: '#ff7875',
      dueToday: '#ffc53d',
      dueSoon: '#40a9ff',
      onTrack: '#73d13d',
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
export const getPriorityColor = (priority: string, isDarkMode = false): string => {
  const priorityColors = isDarkMode ? colors.dark.priority : colors.priority;
  const priorityMap: Record<string, string> = {
    urgent: priorityColors.urgent,
    high: priorityColors.high,
    medium: priorityColors.medium,
    low: priorityColors.low,
  };
  return priorityMap[priority] || priorityColors.medium;
};

// Helper function to get status color
export const getStatusColor = (status: string, isDarkMode = false): string => {
  const statusColors = isDarkMode ? colors.dark.status : colors.status;
  const statusMap: Record<string, string> = {
    todo: statusColors.todo,
    in_progress: statusColors.in_progress,
    review: statusColors.review,
    done: statusColors.done,
    blocked: statusColors.blocked,
  };
  return statusMap[status] || statusColors.todo;
};

// Helper function to get due date color
export const getDueDateColor = (dueDate: string, isDarkMode = false): string => {
  const dueDateColors = isDarkMode ? colors.dark.dueDate : colors.dueDate;
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return dueDateColors.overdue;
  if (diffDays === 0) return dueDateColors.dueToday;
  if (diffDays <= 3) return dueDateColors.dueSoon;
  return dueDateColors.onTrack;
};

export default colors;

