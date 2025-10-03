const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    me: "/auth/me",
    switchTenant: "/auth/switch-tenant",
  },
  projects: {
    list: "/projects",
    create: "/projects",
    one: "/projects/:projectId",
    update: "/projects/:projectId",
    delete: "/projects/:projectId",
  },
  tasks: {
    list: "/projects/:projectId/tasks",
    create: "/projects/:projectId/tasks",
    one: "/projects/:projectId/tasks/:taskId",
    update: "/projects/:projectId/tasks/:taskId",
    delete: "/projects/:projectId/tasks/:taskId",
  },
  myTasks: {
    list: "/my-tasks",
    summary: "/my-tasks/summary",
  },
  timeEntries: {
    get: "/tasks/:taskId/time-entries",
    create: "/tasks/:taskId/time-entries",
    active: "/time-entries/active",
  },
  tenants: {
    list: "/tenants",
    one: "/tenants/:tenantId",
    slug: "/tenants?slug=:tenantSlug",
    create: "/tenants",
    update: "/tenants/:tenantId",
    delete: "/tenants/:tenantId",
  },
  users: {
    list: "/users",
    one: "/users/:userId",
    updateRole: "/users/:userId/role",
    invite: "/users/invite",
    remove: "/users/:userId",
  },
  roles: {
    list: "/roles",
  },
};

export default ENDPOINTS;
