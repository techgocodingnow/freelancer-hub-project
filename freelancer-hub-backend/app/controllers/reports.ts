import type { HttpContext } from '@adonisjs/core/http'
import Task from '#models/task'
import Project from '#models/project'
import TimeEntry from '#models/time_entry'
import Invoice from '#models/invoice'
import Payment from '#models/payment'
import db from '@adonisjs/lucid/services/db'

export default class ReportsController {
  /**
   * Get time tracking summary
   */
  async timeSummary({ tenant, request, response }: HttpContext) {
    const userId = request.input('user_id')
    const projectId = request.input('project_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    // Build query for time entries through tasks and projects
    const query = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)

    if (userId) {
      query.where('time_entries.user_id', userId)
    }
    if (projectId) {
      query.where('projects.id', projectId)
    }
    if (startDate) {
      query.where('time_entries.date', '>=', startDate)
    }
    if (endDate) {
      query.where('time_entries.date', '<=', endDate)
    }

    // Get summary by user
    const byUser = await db
      .from(query.clone().as('filtered_entries'))
      .join('users', 'filtered_entries.user_id', 'users.id')
      .select('users.id', 'users.full_name', 'users.email')
      .sum('filtered_entries.duration_minutes as total_minutes')
      .count('* as entry_count')
      .groupBy('users.id', 'users.full_name', 'users.email')

    // Get summary by project
    const byProject = await db
      .from(query.clone().as('filtered_entries'))
      .join('projects', 'filtered_entries.project_id', 'projects.id')
      .select('projects.id', 'projects.name')
      .sum('filtered_entries.duration_minutes as total_minutes')
      .count('* as entry_count')
      .groupBy('projects.id', 'projects.name')

    // Get summary by date
    const byDate = await db
      .from(query.clone().as('filtered_entries'))
      .select('filtered_entries.date')
      .sum('filtered_entries.duration_minutes as total_minutes')
      .count('* as entry_count')
      .groupBy('filtered_entries.date')
      .orderBy('filtered_entries.date', 'desc')

    // Calculate totals
    const totals = await db
      .from(query.clone().as('filtered_entries'))
      .sum('filtered_entries.duration_minutes as total_minutes')
      .count('* as entry_count')
      .first()

    return response.ok({
      data: {
        byUser: byUser.map((row) => ({
          userId: row.id,
          userName: row.full_name,
          userEmail: row.email,
          totalMinutes: Number.parseInt(row.total_minutes || 0),
          totalHours: Number.parseFloat(((row.total_minutes || 0) / 60).toFixed(2)),
          entryCount: Number.parseInt(row.entry_count),
        })),
        byProject: byProject.map((row) => ({
          projectId: row.id,
          projectName: row.name,
          totalMinutes: Number.parseInt(row.total_minutes || 0),
          totalHours: Number.parseFloat(((row.total_minutes || 0) / 60).toFixed(2)),
          entryCount: Number.parseInt(row.entry_count),
        })),
        byDate: byDate.map((row) => ({
          date: row.date,
          totalMinutes: Number.parseInt(row.total_minutes || 0),
          totalHours: Number.parseFloat(((row.total_minutes || 0) / 60).toFixed(2)),
          entryCount: Number.parseInt(row.entry_count),
        })),
        totals: {
          totalMinutes: Number.parseInt(totals?.total_minutes || 0),
          totalHours: Number.parseFloat(((totals?.total_minutes || 0) / 60).toFixed(2)),
          entryCount: Number.parseInt(totals?.entry_count || 0),
        },
      },
    })
  }

  /**
   * Get task statistics
   */
  async taskStatistics({ tenant, request, response }: HttpContext) {
    const projectId = request.input('project_id')
    const userId = request.input('user_id')

    const query = Task.query()
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)

    if (projectId) {
      query.where('tasks.project_id', projectId)
    }
    if (userId) {
      query.where('tasks.assignee_id', userId)
    }

    // Get counts by status
    const byStatus = await query
      .clone()
      .select('tasks.status')
      .count('* as count')
      .groupBy('tasks.status')

    // Get counts by priority
    const byPriority = await query
      .clone()
      .select('tasks.priority')
      .count('* as count')
      .groupBy('tasks.priority')

    // Get overdue tasks
    const overdueTasks = await query
      .clone()
      .whereNotIn('tasks.status', ['done'])
      .where('tasks.due_date', '<', new Date().toISOString().split('T')[0])
      .count('* as count')
      .first()

    // Get completion rate
    const totalTasks = await query.clone().count('* as count').first()
    const completedTasks = await query
      .clone()
      .where('tasks.status', 'done')
      .count('* as count')
      .first()

    const completionRate =
      totalTasks && totalTasks.$extras.count > 0
        ? ((completedTasks?.$extras.count || 0) / totalTasks.$extras.count) * 100
        : 0

    return response.ok({
      data: {
        byStatus: byStatus.map((row) => ({
          status: row.status,
          count: Number.parseInt(row.$extras.count),
        })),
        byPriority: byPriority.map((row) => ({
          priority: row.priority,
          count: Number.parseInt(row.$extras.count),
        })),
        overdue: Number.parseInt(overdueTasks?.$extras.count || 0),
        total: Number.parseInt(totalTasks?.$extras.count || 0),
        completed: Number.parseInt(completedTasks?.$extras.count || 0),
        completionRate: Number.parseFloat(completionRate.toFixed(2)),
      },
    })
  }

  /**
   * Get project progress overview
   */
  async projectProgress({ tenant, response }: HttpContext) {
    const projects = await Project.query()
      .where('tenant_id', tenant.id)
      .preload('tasks')
      .orderBy('created_at', 'desc')

    const projectData = projects.map((project) => {
      const tasks = project.tasks
      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t) => t.status === 'done').length
      const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
      const todoTasks = tasks.filter((t) => t.status === 'todo').length
      const reviewTasks = tasks.filter((t) => t.status === 'review').length

      const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
      const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0)

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      const overdueTasks = tasks.filter(
        (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate.toISO()!) < new Date()
      ).length

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        overdueTasks,
        completionRate: Number.parseFloat(completionRate.toFixed(2)),
        totalEstimatedHours: Number.parseFloat(totalEstimatedHours.toFixed(2)),
        totalActualHours: Number.parseFloat(totalActualHours.toFixed(2)),
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
      }
    })

    return response.ok({ data: projectData })
  }

  /**
   * Get detailed time and activity report
   */
  async timeActivity({ tenant, request, response }: HttpContext) {
    const userId = request.input('user_id')
    const projectId = request.input('project_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const billable = request.input('billable')
    const page = request.input('_start', 0) / request.input('_end', 50) + 1 || 1
    const perPage = request.input('_end', 50) - request.input('_start', 0) || 50

    // Build query for time entries
    const query = TimeEntry.query()
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)
      .preload('user')
      .preload('task', (taskQuery) => {
        taskQuery.preload('project')
      })

    if (userId) {
      query.where('time_entries.user_id', userId)
    }
    if (projectId) {
      query.where('projects.id', projectId)
    }
    if (startDate) {
      query.where('time_entries.date', '>=', startDate)
    }
    if (endDate) {
      query.where('time_entries.date', '<=', endDate)
    }
    if (billable !== undefined && billable !== null) {
      query.where('time_entries.billable', billable === 'true' || billable === true)
    }

    // Sorting
    const sort = request.input('_sort', 'date')
    const order = request.input('_order', 'DESC')
    query.orderBy(`time_entries.${sort}`, order)

    const timeEntries = await query.paginate(page, perPage)

    // Calculate summary statistics
    const summaryQuery = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)

    if (userId) {
      summaryQuery.where('time_entries.user_id', userId)
    }
    if (projectId) {
      summaryQuery.where('projects.id', projectId)
    }
    if (startDate) {
      summaryQuery.where('time_entries.date', '>=', startDate)
    }
    if (endDate) {
      summaryQuery.where('time_entries.date', '<=', endDate)
    }
    if (billable !== undefined && billable !== null) {
      summaryQuery.where('time_entries.billable', billable === 'true' || billable === true)
    }

    const summary = await summaryQuery
      .select(
        db.raw('SUM(duration_minutes) as total_minutes'),
        db.raw(
          'SUM(CASE WHEN billable = true THEN duration_minutes ELSE 0 END) as billable_minutes'
        ),
        db.raw(
          'SUM(CASE WHEN billable = false THEN duration_minutes ELSE 0 END) as non_billable_minutes'
        ),
        db.raw('COUNT(*) as entry_count')
      )
      .first()

    return response.header('x-total-count', timeEntries.total).ok({
      data: timeEntries.all(),
      summary: {
        totalHours: Number.parseFloat(((summary?.total_minutes || 0) / 60).toFixed(2)),
        billableHours: Number.parseFloat(((summary?.billable_minutes || 0) / 60).toFixed(2)),
        nonBillableHours: Number.parseFloat(((summary?.non_billable_minutes || 0) / 60).toFixed(2)),
        entryCount: Number.parseInt(summary?.entry_count || 0),
      },
    })
  }

  /**
   * Get daily totals report (weekly view)
   */
  async dailyTotals({ tenant, request, response }: HttpContext) {
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const userId = request.input('user_id')
    const projectId = request.input('project_id')

    // Build query for time entries grouped by user and date
    const query = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .join('users', 'time_entries.user_id', 'users.id')
      .where('projects.tenant_id', tenant.id)

    if (userId) {
      query.where('time_entries.user_id', userId)
    }
    if (projectId) {
      query.where('projects.id', projectId)
    }
    if (startDate) {
      query.where('time_entries.date', '>=', startDate)
    }
    if (endDate) {
      query.where('time_entries.date', '<=', endDate)
    }

    const dailyTotals = await query
      .select(
        'users.id as user_id',
        'users.full_name as user_name',
        'users.email as user_email',
        'time_entries.date',
        db.raw('SUM(time_entries.duration_minutes) as total_minutes'),
        db.raw(
          'SUM(CASE WHEN time_entries.billable = true THEN time_entries.duration_minutes ELSE 0 END) as billable_minutes'
        ),
        db.raw('COUNT(*) as entry_count')
      )
      .groupBy('users.id', 'users.full_name', 'users.email', 'time_entries.date')
      .orderBy('users.full_name', 'asc')
      .orderBy('time_entries.date', 'asc')

    // Format data for weekly grid
    const formattedData = dailyTotals.map((row) => ({
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      date: row.date,
      totalHours: Number.parseFloat((row.total_minutes / 60).toFixed(2)),
      billableHours: Number.parseFloat((row.billable_minutes / 60).toFixed(2)),
      entryCount: Number.parseInt(row.entry_count),
    }))

    return response.ok({ data: formattedData })
  }

  /**
   * Get invoice and payment report
   */
  async invoicesPayments({ tenant, request, response }: HttpContext) {
    const userId = request.input('user_id')
    const projectId = request.input('project_id')
    const status = request.input('status')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    // Build query for invoices
    const query = Invoice.query()
      .where('tenant_id', tenant.id)
      .preload('user')
      .preload('project')
      .preload('payments')

    if (userId) {
      query.where('user_id', userId)
    }
    if (projectId) {
      query.where('project_id', projectId)
    }
    if (status) {
      query.where('status', status)
    }
    if (startDate) {
      query.where('issue_date', '>=', startDate)
    }
    if (endDate) {
      query.where('issue_date', '<=', endDate)
    }

    const invoices = await query.orderBy('issue_date', 'desc')

    // Calculate summary statistics
    const summaryQuery = db.from('invoices').where('tenant_id', tenant.id)

    if (userId) {
      summaryQuery.where('user_id', userId)
    }
    if (projectId) {
      summaryQuery.where('project_id', projectId)
    }
    if (status) {
      summaryQuery.where('status', status)
    }
    if (startDate) {
      summaryQuery.where('issue_date', '>=', startDate)
    }
    if (endDate) {
      summaryQuery.where('issue_date', '<=', endDate)
    }

    const summary = await summaryQuery
      .select(
        db.raw('SUM(total_amount) as total_invoiced'),
        db.raw('SUM(amount_paid) as total_paid'),
        db.raw('SUM(total_amount - amount_paid) as total_outstanding'),
        db.raw("COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count"),
        db.raw("COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count"),
        db.raw("COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count"),
        db.raw("COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count"),
        db.raw('COUNT(*) as total_count')
      )
      .first()

    return response.ok({
      data: invoices,
      summary: {
        totalInvoiced: Number.parseFloat(summary?.total_invoiced || 0),
        totalPaid: Number.parseFloat(summary?.total_paid || 0),
        totalOutstanding: Number.parseFloat(summary?.total_outstanding || 0),
        paidCount: Number.parseInt(summary?.paid_count || 0),
        sentCount: Number.parseInt(summary?.sent_count || 0),
        overdueCount: Number.parseInt(summary?.overdue_count || 0),
        draftCount: Number.parseInt(summary?.draft_count || 0),
        totalCount: Number.parseInt(summary?.total_count || 0),
      },
    })
  }

  /**
   * Get project budget report
   */
  async projectBudget({ tenant, request, response }: HttpContext) {
    const projectId = request.input('project_id')

    const query = Project.query()
      .where('tenant_id', tenant.id)
      .preload('tasks', (taskQuery) => {
        taskQuery.preload('timeEntries')
      })

    if (projectId) {
      query.where('id', projectId)
    }

    const projects = await query

    const projectData = projects.map((project) => {
      const tasks = project.tasks
      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t) => t.status === 'done').length

      // Calculate time and budget
      const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
      const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0)

      // Calculate billable hours from time entries
      let totalBillableHours = 0
      tasks.forEach((task) => {
        if (task.timeEntries) {
          totalBillableHours += task.timeEntries
            .filter((entry) => entry.billable)
            .reduce((sum, entry) => sum + entry.durationMinutes / 60, 0)
        }
      })

      const budget = project.budget || 0
      const budgetUsed = totalActualHours * 50 // Assuming $50/hour default rate
      const budgetRemaining = budget - budgetUsed
      const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const hoursVariance = totalActualHours - totalEstimatedHours
      const hoursVariancePercent =
        totalEstimatedHours > 0 ? (hoursVariance / totalEstimatedHours) * 100 : 0

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        budget,
        budgetUsed: Number.parseFloat(budgetUsed.toFixed(2)),
        budgetRemaining: Number.parseFloat(budgetRemaining.toFixed(2)),
        budgetUtilization: Number.parseFloat(budgetUtilization.toFixed(2)),
        totalEstimatedHours: Number.parseFloat(totalEstimatedHours.toFixed(2)),
        totalActualHours: Number.parseFloat(totalActualHours.toFixed(2)),
        totalBillableHours: Number.parseFloat(totalBillableHours.toFixed(2)),
        hoursVariance: Number.parseFloat(hoursVariance.toFixed(2)),
        hoursVariancePercent: Number.parseFloat(hoursVariancePercent.toFixed(2)),
        totalTasks,
        completedTasks,
        completionRate: Number.parseFloat(completionRate.toFixed(2)),
        startDate: project.startDate,
        endDate: project.endDate,
      }
    })

    return response.ok({ data: projectData })
  }

  /**
   * Get team utilization report
   */
  async teamUtilization({ tenant, request, response }: HttpContext) {
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const userId = request.input('user_id')

    // Get time entries grouped by user
    const query = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .join('users', 'time_entries.user_id', 'users.id')
      .where('projects.tenant_id', tenant.id)

    if (userId) {
      query.where('time_entries.user_id', userId)
    }
    if (startDate) {
      query.where('time_entries.date', '>=', startDate)
    }
    if (endDate) {
      query.where('time_entries.date', '<=', endDate)
    }

    const utilization = await query
      .select(
        'users.id as user_id',
        'users.full_name as user_name',
        'users.email as user_email',
        db.raw('SUM(time_entries.duration_minutes) as total_minutes'),
        db.raw(
          'SUM(CASE WHEN time_entries.billable = true THEN time_entries.duration_minutes ELSE 0 END) as billable_minutes'
        ),
        db.raw(
          'SUM(CASE WHEN time_entries.billable = false THEN time_entries.duration_minutes ELSE 0 END) as non_billable_minutes'
        ),
        db.raw('COUNT(DISTINCT time_entries.date) as days_worked'),
        db.raw('COUNT(*) as entry_count')
      )
      .groupBy('users.id', 'users.full_name', 'users.email')
      .orderBy('total_minutes', 'desc')

    // Calculate utilization metrics
    const formattedData = utilization.map((row) => {
      const totalHours = row.total_minutes / 60
      const billableHours = row.billable_minutes / 60
      const nonBillableHours = row.non_billable_minutes / 60
      const daysWorked = Number.parseInt(row.days_worked)
      const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0
      const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

      return {
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        totalHours: Number.parseFloat(totalHours.toFixed(2)),
        billableHours: Number.parseFloat(billableHours.toFixed(2)),
        nonBillableHours: Number.parseFloat(nonBillableHours.toFixed(2)),
        daysWorked,
        avgHoursPerDay: Number.parseFloat(avgHoursPerDay.toFixed(2)),
        utilizationRate: Number.parseFloat(utilizationRate.toFixed(2)),
        entryCount: Number.parseInt(row.entry_count),
      }
    })

    return response.ok({ data: formattedData })
  }
}
