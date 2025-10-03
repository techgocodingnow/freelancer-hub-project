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
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
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
};

export type RemoveUserResponse = {
  message: string;
};

export type GetRolesResponse = {
  data: Role[];
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
