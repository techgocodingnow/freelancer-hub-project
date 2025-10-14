/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import openapi from '#config/openapi'
import AutoSwagger from 'adonis-autoswagger'

const TenantsController = () => import('#controllers/tenants')
const AuthController = () => import('#controllers/auth')
const ProjectsController = () => import('#controllers/projects')
const TasksController = () => import('#controllers/tasks')
const MyTasksController = () => import('#controllers/my_tasks')
const TimeEntriesController = () => import('#controllers/time_entries')
const ReportsController = () => import('#controllers/reports')
const UsersController = () => import('#controllers/users')
const InvoicesController = () => import('#controllers/invoices')
const PaymentsController = () => import('#controllers/payments')
const PayrollController = () => import('#controllers/payroll')
const WiseAccountsController = () => import('#controllers/wise_accounts')
const TimesheetsController = () => import('#controllers/timesheets')
const InvitationsController = () => import('#controllers/invitations')
const NotificationsController = () => import('#controllers/notifications_controller')
const ElectricProxyController = () => import('#controllers/electric_proxy_controller')
const NotificationPreferencesController = () =>
  import('#controllers/notification_preferences_controller')

// Health check (outside API versioning for monitoring)
router.get('/', async () => {
  return {
    hello: 'world',
    message: 'Freelancer Hub API',
    version: 'v1',
  }
})

// API v1 routes
router
  .group(() => {
    // Auth routes (no tenant required)
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/login', [AuthController, 'login'])
    router.post('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
    router.get('/auth/me', [AuthController, 'me']).use(middleware.auth())
    router.post('/auth/switch-tenant', [AuthController, 'switchTenant']).use(middleware.auth())

    // Public invitation routes
    router.get('/invitations/validate/:token', [InvitationsController, 'validate'])

    // Authenticated invitation routes (not tenant-scoped)
    router
      .get('/invitations/my-invitations', [InvitationsController, 'myInvitations'])
      .use(middleware.auth())
    router
      .post('/invitations/:id/accept', [InvitationsController, 'acceptInvitation'])
      .use(middleware.auth())
    router
      .post('/invitations/:id/reject', [InvitationsController, 'rejectInvitation'])
      .use(middleware.auth())

    // Public tenant routes
    router.get('/tenants/list', [TenantsController, 'list'])
    router.get('/tenants/:slug', [TenantsController, 'show'])

    // Authenticated tenant routes
    router.get('/tenants', [TenantsController, 'index']).use(middleware.auth())

    // Tenant-scoped routes (requires both tenant and auth)
    router
      .group(() => {
        // Projects
        router.get('/projects', [ProjectsController, 'index'])
        router.get('/projects/:id', [ProjectsController, 'show'])
        router.post('/projects', [ProjectsController, 'store'])
        router.put('/projects/:id', [ProjectsController, 'update'])
        router.patch('/projects/:id', [ProjectsController, 'update'])
        router.delete('/projects/:id', [ProjectsController, 'destroy'])

        // Project members
        router.get('/projects/:id/members', [ProjectsController, 'members'])
        router.post('/projects/:id/members', [ProjectsController, 'addMember'])
        router.delete('/projects/:id/members/:userId', [ProjectsController, 'removeMember'])

        // Tasks
        router.get('/projects/:projectId/tasks', [TasksController, 'index'])
        router.get('/projects/:projectId/tasks/:id', [TasksController, 'show'])
        router.post('/projects/:projectId/tasks', [TasksController, 'store'])
        router.put('/projects/:projectId/tasks/:id', [TasksController, 'update'])
        router.patch('/projects/:projectId/tasks/:id', [TasksController, 'update'])
        router.delete('/projects/:projectId/tasks/:id', [TasksController, 'destroy'])
        router.patch('/projects/:projectId/tasks/:id/status', [TasksController, 'updateStatus'])
        router.patch('/projects/:projectId/tasks/:id/assign', [TasksController, 'assign'])

        // My Tasks (user's personal task view across all projects)
        router.get('/my-tasks', [MyTasksController, 'index'])
        router.get('/my-tasks/summary', [MyTasksController, 'summary'])

        // Time entries
        router.get('/tasks/:taskId/time-entries', [TimeEntriesController, 'index'])
        router.post('/tasks/:taskId/time-entries', [TimeEntriesController, 'store'])
        router.put('/tasks/:taskId/time-entries/:id', [TimeEntriesController, 'update'])
        router.patch('/tasks/:taskId/time-entries/:id', [TimeEntriesController, 'update'])
        router.delete('/tasks/:taskId/time-entries/:id', [TimeEntriesController, 'destroy'])
        router.post('/tasks/:taskId/time-entries/start', [TimeEntriesController, 'start'])
        router.post('/tasks/:taskId/time-entries/stop', [TimeEntriesController, 'stop'])

        // Time Entries Management (global time entry CRUD - unified controller)
        // Note: /active and /import must come before /:id to avoid route conflicts
        router.get('/time-entries/active', [TimeEntriesController, 'active'])
        router.post('/time-entries/import', [TimeEntriesController, 'importCsv'])
        router.get('/time-entries/:id', [TimeEntriesController, 'show'])
        router.get('/time-entries', [TimeEntriesController, 'index'])
        router.post('/time-entries', [TimeEntriesController, 'store'])
        router.put('/time-entries/:id', [TimeEntriesController, 'update'])
        router.patch('/time-entries/:id', [TimeEntriesController, 'update'])
        router.delete('/time-entries/:id', [TimeEntriesController, 'destroy'])

        // Timesheets
        router.get('/timesheets/time-entries', [TimesheetsController, 'index'])
        router.get('/timesheets', [TimesheetsController, 'index'])
        router.get('/timesheets/summary', [TimesheetsController, 'summary'])
        router.get('/timesheets/:id', [TimesheetsController, 'show'])
        router.post('/timesheets', [TimesheetsController, 'store'])
        router.put('/timesheets/:id', [TimesheetsController, 'update'])
        router.patch('/timesheets/:id', [TimesheetsController, 'update'])
        router.delete('/timesheets/:id', [TimesheetsController, 'destroy'])
        router.post('/timesheets/:id/submit', [TimesheetsController, 'submit'])
        router.post('/timesheets/:id/approve', [TimesheetsController, 'approve'])
        router.post('/timesheets/:id/reject', [TimesheetsController, 'reject'])
        router.post('/timesheets/:id/reopen', [TimesheetsController, 'reopen'])

        // Reports
        router.get('/reports/time-summary', [ReportsController, 'timeSummary'])
        router.get('/reports/task-statistics', [ReportsController, 'taskStatistics'])
        router.get('/reports/project-progress', [ReportsController, 'projectProgress'])
        router.get('/reports/time-activity', [ReportsController, 'timeActivity'])
        router.get('/reports/daily-totals', [ReportsController, 'dailyTotals'])
        router.get('/reports/invoices-payments', [ReportsController, 'invoicesPayments'])
        router.get('/reports/project-budget', [ReportsController, 'projectBudget'])
        router.get('/reports/team-utilization', [ReportsController, 'teamUtilization'])

        // Invoices
        router.get('/invoices', [InvoicesController, 'index'])
        router.get('/invoices/:id', [InvoicesController, 'show'])
        router.post('/invoices/generate', [InvoicesController, 'generateFromTimeEntries'])
        router.patch('/invoices/:id/status', [InvoicesController, 'updateStatus'])
        router.post('/invoices/:id/send', [InvoicesController, 'send'])
        router.post('/invoices/:id/pdf', [InvoicesController, 'generatePdf'])
        router.delete('/invoices/:id', [InvoicesController, 'destroy'])

        // Payments
        router.get('/payments', [PaymentsController, 'index'])
        router.get('/payments/:id', [PaymentsController, 'show'])
        router.post('/payments', [PaymentsController, 'store'])
        router.delete('/payments/:id', [PaymentsController, 'destroy'])

        // Payroll
        router.get('/payroll/batches', [PayrollController, 'index'])
        router.get('/payroll/batches/:id', [PayrollController, 'show'])
        router.post('/payroll/calculate', [PayrollController, 'calculate'])
        router.post('/payroll/batches', [PayrollController, 'store'])
        router.post('/payroll/batches/:id/process', [PayrollController, 'process'])
        router.delete('/payroll/batches/:id', [PayrollController, 'destroy'])

        // Users (tenant-scoped with role-based access)
        router.get('/users', [UsersController, 'index'])
        router.get('/users/search', [UsersController, 'search'])
        router.get('/users/:id', [UsersController, 'show'])
        router.get('/roles', [UsersController, 'getRoles'])
        router
          .patch('/users/:id/role', [UsersController, 'updateRole'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))
        router
          .post('/users/invite', [UsersController, 'invite'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))
        router
          .delete('/users/:id', [UsersController, 'remove'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))

        // Wise Accounts
        router.get('/users/:id/wise-account', [WiseAccountsController, 'show'])
        router.post('/users/:id/wise-account', [WiseAccountsController, 'store'])
        router.delete('/users/:id/wise-account', [WiseAccountsController, 'destroy'])
        router.get('/wise/requirements', [WiseAccountsController, 'requirements'])

        // Invitations (tenant-scoped)
        router.get('/invitations', [InvitationsController, 'index'])
        router
          .post('/invitations', [InvitationsController, 'store'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))
        router
          .post('/invitations/:id/resend', [InvitationsController, 'resend'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))
        router
          .delete('/invitations/:id', [InvitationsController, 'cancel'])
          .use(middleware.requireRole({ roles: ['admin', 'owner'] }))

        // Notifications (tenant-scoped)
        router.get('/notifications', [NotificationsController, 'index'])
        router.get('/notifications/unread-count', [NotificationsController, 'unreadCount'])
        router.get('/notifications/:id', [NotificationsController, 'show'])
        router.patch('/notifications/:id/read', [NotificationsController, 'markAsRead'])
        router.patch('/notifications/mark-all-read', [NotificationsController, 'markAllAsRead'])
        router.delete('/notifications/:id', [NotificationsController, 'destroy'])

        // Electric sync proxy for real-time notifications
        router.get('/electric/notifications', [ElectricProxyController, 'notifications'])

        // Notification Preferences (tenant-scoped)
        router.get('/notification-preferences', [NotificationPreferencesController, 'index'])
        router.get('/notification-preferences/defaults', [
          NotificationPreferencesController,
          'defaults',
        ])
        router.patch('/notification-preferences/:type', [
          NotificationPreferencesController,
          'update',
        ])
        router.patch('/notification-preferences/mute/all', [
          NotificationPreferencesController,
          'muteAll',
        ])
        router.patch('/notification-preferences/unmute/all', [
          NotificationPreferencesController,
          'unmuteAll',
        ])
      })
      .use([middleware.tenant()])
  })
  .prefix('/api/v1')

// Returns the OpenAPI file as YAML
router.get('/openapi', async () => {
  return AutoSwagger.default.docs(router.toJSON(), openapi)
})
// Renders the API reference with Scalar
router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/openapi')
})
