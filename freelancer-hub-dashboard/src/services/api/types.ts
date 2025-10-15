// Role types
export type RoleName = "owner" | "admin" | "member" | "viewer";

export type Role = {
  id: number;
  name: RoleName;
  description: string;
  permissions?: Record<string, any>;
};

// Tenant membership
export type TenantMembership = {
  tenant: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  };
  role: Role;
  isActive: boolean;
  joinedAt: string;
};

// User with multi-tenant support
export type User = {
  id: number;
  email: string;
  fullName: string;
  tenants: TenantMembership[];
  defaultTenant?: {
    id: number;
    name: string;
    slug: string;
  };
};

// User in a specific tenant context
export type TenantUser = {
  id: number;
  email: string;
  fullName: string;
  role: RoleName;
  roleId: number;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
};
export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: User;
  currentTenantSlug?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  invitationToken?: string;
  tenantId?: number;
  tenantName?: string;
  tenantSlug?: string;
};

export type RegisterResponse = {
  token: string;
  user: User;
  currentTenantSlug?: string;
};

// Projects
export type Project = {
  id: number;
  name: string;
  slug: string;
  tenantId: number;
};

export type CreateProjectPayload = {
  name: string;
  slug: string;
};

export type UpdateProjectPayload = {
  name: string;
  slug: string;
};

// Project Members
export type ProjectMember = {
  id: number;
  projectId: number;
  userId: number;
  role: RoleName;
  position: string | null;
  hourlyRate: number | null;
  joinedAt: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    hourlyRate: number | null;
  };
};

export type AddProjectMemberPayload = {
  userId: number;
  role?: RoleName;
  position?: string;
  hourlyRate?: number;
};

export type UpdateProjectMemberPayload = {
  role?: RoleName;
  position?: string;
  hourlyRate?: number;
};

// Tasks
export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: number;
  assignee: {
    id: number;
    fullName: string;
  };
  estimatedHours: number;
  actualHours: number;
  project?: {
    id: number;
    name: string;
  };
  completedAt?: string;
};

export type CreateTaskPayload = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: number;
  estimatedHours: number;
};

export type UpdateTaskPayload = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: number;
  estimatedHours: number;
};

// My Tasks
export type MyTasksFilter = "assigned" | "today_overdue" | "all";

export type MyTasksResponse = {
  data: Task[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    todayCount: number;
    overdueCount: number;
  };
};

export type MyTasksSummary = {
  data: {
    assigned: number;
    today: number;
    overdue: number;
    upcoming: number;
    highPriority: number;
  };
};

// Time entries
export type TimeEntry = {
  id: number;
  taskId: number;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string;
};

export type CreateTimeEntryPayload = {
  taskId: number;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string;
};

export type UpdateTimeEntryPayload = {
  taskId: number;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string;
};

// Tenants
export type Tenant = {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

export type CreateTenantPayload = {
  name: string;
  slug: string;
  description: string;
};

export type GetTenantsResponse = {
  data: Tenant[];
};

export type GetTenantBySlugResponse = Tenant;

export type CreateTenantResponse = Tenant;

export type UpdateTenantPayload = {
  name: string;
  slug: string;
  description: string;
};

export type TenantResponse = {
  data: Tenant[];
};

export type TenantOneResponse = {
  data: Tenant;
};

// Users
export type GetUsersResponse = {
  data: TenantUser[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasMorePages: boolean;
  };
};

export type GetUserResponse = {
  data: TenantUser;
};

export type UpdateUserRolePayload = {
  role: RoleName;
};

export type InviteUserPayload = {
  email: string;
  roleId: number;
  projectId?: number;
};

export type RemoveUserResponse = {
  message: string;
};

export type GetRolesResponse = {
  data: Role[];
};

// Invitations
export type Invitation = {
  id: number;
  email: string;
  token: string;
  tenantId: number;
  roleId: number;
  projectId: number | null;
  invitedBy: number;
  status: "pending" | "accepted" | "expired" | "cancelled" | "rejected";
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: number | null;
  createdAt: string;
  updatedAt: string | null;
  isExistingUser?: boolean;
  role?: Role;
  inviter?: {
    id: number;
    email: string;
    fullName: string;
  };
  project?: {
    id: number;
    name: string;
  };
  tenant?: Tenant;
};

export type GetInvitationsResponse = {
  data: Invitation[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
};

export type CreateInvitationPayload = {
  email: string;
  roleId: number;
  projectId?: number;
};

export type ValidateInvitationResponse = {
  data: {
    email: string;
    tenant: {
      id: number;
      name: string;
      slug: string;
    };
    role: {
      id: number;
      name: string;
    };
    project: {
      id: number;
      name: string;
    } | null;
    expiresAt: string;
  };
};

export type OrganizationMember = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  roleId: number;
};

export type SearchMembersResponse = {
  data: OrganizationMember[];
};

export type MyInvitationsResponse = {
  data: Invitation[];
};

export type AcceptInvitationResponse = {
  message: string;
  data: {
    project: {
      id: number;
      name: string;
    };
    role: {
      id: number;
      name: string;
    };
  };
};

export type RejectInvitationResponse = {
  message: string;
};

// Tenant switching
export type SwitchTenantPayload = {
  tenantId: number;
};

export type SwitchTenantResponse = {
  token: string;
  tenant: Tenant;
  role: Role;
  currentTenantSlug: string;
};

// Notification types
export type NotificationType =
  | "project_invitation"
  | "task_assigned"
  | "task_completed"
  | "payment_received"
  | "timesheet_approved"
  | "timesheet_rejected"
  | "project_updated"
  | "member_added"
  | "member_removed"
  | "general";

export type Notification = {
  id: number;
  userId: number;
  tenantId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  secondaryActionUrl: string | null;
  secondaryActionLabel: string | null;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type NotificationListResponse = {
  data: Notification[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
};

export type UnreadCountResponse = {
  count: number;
};

export type MarkAsReadResponse = {
  message: string;
  data: Notification;
  txid: string;
};

export type MarkAllAsReadResponse = {
  message: string;
  count: number;
  txid: string;
};

export type DeleteNotificationResponse = {
  message: string;
  txid: string;
};

// Notification Preferences
export type NotificationPreference = {
  id: number;
  userId: number;
  tenantId: number;
  notificationType: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferencesResponse = {
  data: NotificationPreference[];
};

export type UpdatePreferenceRequest = {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  isMuted?: boolean;
};

export type UpdatePreferenceResponse = {
  message: string;
  data: NotificationPreference;
};

export type MuteAllResponse = {
  message: string;
};

export type DefaultPreferencesResponse = {
  data: Array<{
    notificationType: NotificationType;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    isMuted: boolean;
  }>;
};
