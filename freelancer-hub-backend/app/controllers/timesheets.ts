import type { HttpContext } from '@adonisjs/core/http'
import Timesheet from '#models/timesheet'
import TimeEntry from '#models/time_entry'
import TenantUser from '#models/tenant_user'
import { DateTime } from 'luxon'
import {
  createTimesheetValidator,
  submitTimesheetValidator,
  approveTimesheetValidator,
  rejectTimesheetValidator,
  updateTimesheetValidator,
} from '#validators/timesheets'

export default class TimesheetsController {
  /**
   * List all timesheets for the tenant
   */
  async index({ tenant, auth, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const user = auth.getUserOrFail()

    // Check if user is admin/owner (can see all timesheets)
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    const query = Timesheet.query().where('tenant_id', tenant.id)

    // Non-admins can only see their own timesheets
    if (!isAdmin) {
      query.where('user_id', user.id)
    }

    // Filters
    const status = request.input('status')
    const userId = request.input('user_id')
    const weekStartDate = request.input('week_start_date')
    const weekEndDate = request.input('week_end_date')

    if (status) {
      query.where('status', status)
    }

    if (userId && isAdmin) {
      query.where('user_id', userId)
    }

    if (weekStartDate) {
      query.where('week_start_date', '>=', weekStartDate)
    }

    if (weekEndDate) {
      query.where('week_end_date', '<=', weekEndDate)
    }

    // Sorting
    const sort = request.input('_sort', 'week_start_date')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    // Load relationships
    query.preload('user').preload('approver')

    const timesheets = await query.paginate(page, perPage)

    return response.ok({
      data: timesheets.all(),
      meta: {
        total: timesheets.total,
        perPage: timesheets.perPage,
        currentPage: timesheets.currentPage,
        lastPage: timesheets.lastPage,
      },
    })
  }

  /**
   * Get a single timesheet with all time entries
   */
  async show({ tenant, auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .preload('user')
      .preload('approver')
      .preload('timeEntries', (query) => {
        query.preload('task', (taskQuery) => {
          taskQuery.preload('project')
        })
        query.orderBy('date', 'asc')
      })
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    // Check authorization
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    if (!isAdmin && timesheet.userId !== user.id) {
      return response.forbidden({ error: 'You can only view your own timesheets' })
    }

    return response.ok({ data: timesheet })
  }

  /**
   * Create a new timesheet
   */
  async store({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createTimesheetValidator)

    const weekStartDate = DateTime.fromISO(data.weekStartDate)
    const weekEndDate = DateTime.fromISO(data.weekEndDate)

    // Check if timesheet already exists for this week
    const existing = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .where('week_start_date', weekStartDate.toSQLDate()!)
      .first()

    if (existing) {
      return response.conflict({ error: 'Timesheet already exists for this week' })
    }

    const timesheet = await Timesheet.create({
      tenantId: tenant.id,
      userId: user.id,
      weekStartDate,
      weekEndDate,
      status: 'draft',
      totalHours: 0,
      billableHours: 0,
      regularHours: 0,
      overtimeHours: 0,
    })

    // Link existing time entries for this week
    await TimeEntry.query()
      .where('user_id', user.id)
      .whereBetween('date', [weekStartDate.toSQLDate()!, weekEndDate.toSQLDate()!])
      .whereNull('timesheet_id')
      .update({ timesheetId: timesheet.id })

    // Calculate hours
    await timesheet.calculateHours()
    await timesheet.load('user')

    return response.created({ data: timesheet })
  }

  /**
   * Update timesheet time entries
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    // Only owner can edit their own timesheet, and only if it's editable
    if (timesheet.userId !== user.id) {
      return response.forbidden({ error: 'You can only edit your own timesheets' })
    }

    if (!timesheet.isEditable()) {
      return response.forbidden({
        error: 'Timesheet cannot be edited in its current state',
        status: timesheet.status,
      })
    }

    const data = await request.validateUsing(updateTimesheetValidator)

    // Update time entries
    for (const entryData of data.timeEntries) {
      if (entryData.id) {
        // Update existing entry
        const entry = await TimeEntry.find(entryData.id)
        if (entry && entry.timesheetId === timesheet.id) {
          entry.date = DateTime.fromISO(entryData.date)
          entry.startTime = entryData.startTime ? DateTime.fromISO(entryData.startTime) : null
          entry.endTime = entryData.endTime ? DateTime.fromISO(entryData.endTime) : null
          entry.durationMinutes = entryData.durationMinutes
          entry.billable = entryData.billable ?? true
          entry.notes = entryData.notes ?? null
          await entry.save()
        }
      } else {
        // Create new entry
        await TimeEntry.create({
          timesheetId: timesheet.id,
          userId: user.id,
          taskId: entryData.taskId,
          date: DateTime.fromISO(entryData.date),
          startTime: entryData.startTime ? DateTime.fromISO(entryData.startTime) : null,
          endTime: entryData.endTime ? DateTime.fromISO(entryData.endTime) : null,
          durationMinutes: entryData.durationMinutes,
          billable: entryData.billable ?? true,
          notes: entryData.notes ?? null,
          isRunning: false,
        })
      }
    }

    // Recalculate hours
    await timesheet.calculateHours()
    await timesheet.load('user')
    await timesheet.load('timeEntries')

    return response.ok({ data: timesheet })
  }

  /**
   * Submit timesheet for approval
   */
  async submit({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await request.validateUsing(submitTimesheetValidator)

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    if (timesheet.userId !== user.id) {
      return response.forbidden({ error: 'You can only submit your own timesheets' })
    }

    try {
      await timesheet.submit()
      await timesheet.load('user')

      return response.ok({ data: timesheet, message: 'Timesheet submitted successfully' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Approve timesheet (admin/owner only)
   */
  async approve({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await request.validateUsing(approveTimesheetValidator)

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    if (!isAdmin) {
      return response.forbidden({ error: 'Only admins can approve timesheets' })
    }

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    try {
      await timesheet.approve(user.id)
      await timesheet.load('user')
      await timesheet.load('approver')

      return response.ok({ data: timesheet, message: 'Timesheet approved successfully' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Reject timesheet (admin/owner only)
   */
  async reject({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(rejectTimesheetValidator)

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    if (!isAdmin) {
      return response.forbidden({ error: 'Only admins can reject timesheets' })
    }

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    try {
      await timesheet.reject(user.id, data.reason)
      await timesheet.load('user')
      await timesheet.load('approver')

      return response.ok({ data: timesheet, message: 'Timesheet rejected' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Reopen timesheet (admin/owner only)
   */
  async reopen({ tenant, auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    if (!isAdmin) {
      return response.forbidden({ error: 'Only admins can reopen timesheets' })
    }

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    try {
      await timesheet.reopen(user.id)
      await timesheet.load('user')

      return response.ok({ data: timesheet, message: 'Timesheet reopened' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Delete a timesheet
   */
  async destroy({ tenant, auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const timesheet = await Timesheet.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!timesheet) {
      return response.notFound({ error: 'Timesheet not found' })
    }

    // Only owner can delete their own draft timesheets
    if (timesheet.userId !== user.id) {
      return response.forbidden({ error: 'You can only delete your own timesheets' })
    }

    if (timesheet.status !== 'draft') {
      return response.forbidden({ error: 'Only draft timesheets can be deleted' })
    }

    // Unlink time entries
    await TimeEntry.query().where('timesheet_id', timesheet.id).update({ timesheetId: null })

    await timesheet.delete()
    return response.noContent()
  }

  /**
   * Get timesheet summary statistics
   */
  async summary({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    const query = Timesheet.query().where('tenant_id', tenant.id)

    // Non-admins can only see their own stats
    if (!isAdmin) {
      query.where('user_id', user.id)
    }

    // Apply filters
    const userId = request.input('user_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    if (userId && isAdmin) {
      query.where('user_id', userId)
    }

    if (startDate) {
      query.where('week_start_date', '>=', startDate)
    }

    if (endDate) {
      query.where('week_end_date', '<=', endDate)
    }

    const timesheets = await query

    // Calculate statistics
    const stats = {
      total: timesheets.length,
      draft: timesheets.filter((t) => t.status === 'draft').length,
      submitted: timesheets.filter((t) => t.status === 'submitted').length,
      approved: timesheets.filter((t) => t.status === 'approved').length,
      rejected: timesheets.filter((t) => t.status === 'rejected').length,
      totalHours: timesheets.reduce((sum, t) => sum + t.totalHours, 0),
      billableHours: timesheets.reduce((sum, t) => sum + t.billableHours, 0),
      regularHours: timesheets.reduce((sum, t) => sum + t.regularHours, 0),
      overtimeHours: timesheets.reduce((sum, t) => sum + t.overtimeHours, 0),
    }

    return response.ok({ data: stats })
  }
}
