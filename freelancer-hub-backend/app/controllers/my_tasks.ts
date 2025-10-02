import type { HttpContext } from '@adonisjs/core/http'
import Task from '#models/task'
import { DateTime } from 'luxon'

export default class MyTasksController {
  /**
   * Get all tasks for the authenticated user
   * Supports filtering by:
   * - assigned: Tasks assigned to the user
   * - today_overdue: Tasks due today or overdue (excluding completed)
   * - all: All tasks the user has access to
   */
  async index({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    // Build base query - tasks from projects in the current tenant
    const query = Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .preload('assignee')
      .preload('creator')
      .preload('project')
      .preload('timeEntries')

    // Apply filter
    const filter = request.input('filter')

    switch (filter) {
      case 'assigned':
        // All tasks assigned to the user
        query.where('assignee_id', user.id)
        break

      case 'today_overdue':
        // Tasks assigned to user that are due today or overdue (excluding completed)
        query
          .where('assignee_id', user.id)
          .where((subQuery) => {
            subQuery.where('due_date', '<=', DateTime.now().toSQLDate()).whereNotNull('due_date')
          })
          .whereNot('status', 'done')
          .whereNull('completed_at')
        break

      case 'all':
        // All tasks from projects the user is a member of
        // (already filtered by tenant via the whereHas above)
        break

      default:
        // Default to today_overdue
        query
          .where('assignee_id', user.id)
          .where((subQuery) => {
            subQuery.where('due_date', '<=', DateTime.now().toSQLDate()).whereNotNull('due_date')
          })
          .whereNot('status', 'done')
          .whereNull('completed_at')
    }

    // Additional filters
    const status = request.input('status')
    const priority = request.input('priority')
    const projectId = request.input('project_id')

    if (status) {
      query.where('status', status)
    }
    if (priority) {
      query.where('priority', priority)
    }
    if (projectId) {
      query.where('project_id', projectId)
    }

    // Sorting
    const sort = request.input('_sort', 'due_date')
    const order = request.input('_order', 'ASC')
    query.orderBy(sort, order)

    // Execute query with pagination
    const tasks = await query.paginate(page, perPage)

    // Calculate metadata counts
    const todayCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .where('due_date', DateTime.now().toSQLDate())
      .whereNot('status', 'done')
      .whereNull('completed_at')
      .count('* as total')
    console.log('🚀 ~ MyTasksController ~ index ~ todayCount:', todayCount)

    const overdueCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .where('due_date', '<', DateTime.now().toSQLDate())
      .whereNot('status', 'done')
      .whereNull('completed_at')
      .count('* as total')
    console.log('🚀 ~ MyTasksController ~ index ~ overdueCount:', overdueCount)

    const result = tasks.serialize()
    console.log('🚀 ~ MyTasksController ~ index ~ result:', result)
    return response.ok({
      ...result,
      meta: {
        ...result.meta,
        todayCount: Number(todayCount[0].$extras.total),
        overdueCount: Number(overdueCount[0].$extras.total),
      },
    })
  }

  /**
   * Get summary statistics for the user's tasks
   */
  async summary({ tenant, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Count tasks by different criteria
    const assignedCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .whereNot('status', 'done')
      .count('* as total')

    const todayCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .where('due_date', DateTime.now().toSQLDate())
      .whereNot('status', 'done')
      .count('* as total')

    const overdueCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .where('due_date', '<', DateTime.now().toSQLDate())
      .whereNot('status', 'done')
      .whereNull('completed_at')
      .count('* as total')

    const upcomingCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .where('due_date', '>', DateTime.now().toSQLDate())
      .whereNot('status', 'done')
      .count('* as total')

    const highPriorityCount = await Task.query()
      .whereHas('project', (projectQuery) => {
        projectQuery.where('tenant_id', tenant.id)
      })
      .where('assignee_id', user.id)
      .whereIn('priority', ['high', 'urgent'])
      .whereNot('status', 'done')
      .count('* as total')

    return response.ok({
      data: {
        assigned: Number(assignedCount[0].$extras.total),
        today: Number(todayCount[0].$extras.total),
        overdue: Number(overdueCount[0].$extras.total),
        upcoming: Number(upcomingCount[0].$extras.total),
        highPriority: Number(highPriorityCount[0].$extras.total),
      },
    })
  }
}
