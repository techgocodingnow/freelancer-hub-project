import type { HttpContext } from '@adonisjs/core/http'
import TimeEntry from '#models/time_entry'
import Task from '#models/task'
import { DateTime } from 'luxon'
import {
  createTimeEntryValidator,
  updateTimeEntryValidator,
  startTimerValidator,
} from '#validators/time_entries'

export default class TimeEntriesController {
  /**
   * List all time entries for a task
   */
  async index({ tenant, params, request, response }: HttpContext) {
    // Verify task belongs to tenant (through project)
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const query = TimeEntry.query().where('task_id', task.id)

    // Filters
    const userId = request.input('user_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    if (userId) {
      query.where('user_id', userId)
    }
    if (startDate) {
      query.where('date', '>=', startDate)
    }
    if (endDate) {
      query.where('date', '<=', endDate)
    }

    // Sorting
    const sort = request.input('_sort', 'date')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    // Load user relationship
    query.preload('user')

    const timeEntries = await query.paginate(page, perPage)

    return response.header('x-total-count', timeEntries.total).ok(timeEntries.all())
  }

  /**
   * Create a new time entry
   */
  async store({ tenant, auth, params, request, response }: HttpContext) {
    // Verify task belongs to tenant
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createTimeEntryValidator)

    const timeEntry = await TimeEntry.create({
      taskId: task.id,
      userId: user.id,
      description: data.description,
      startTime: data.startTime ? DateTime.fromISO(data.startTime) : null,
      endTime: data.endTime ? DateTime.fromISO(data.endTime) : null,
      durationMinutes: data.durationMinutes,
      billable: data.billable ?? true,
      date: DateTime.fromISO(data.date),
      isRunning: false,
    })

    // Update task actual hours
    await this.updateTaskActualHours(task.id)

    await timeEntry.load('user')

    return response.created({ data: timeEntry })
  }

  /**
   * Update a time entry
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    // Verify task belongs to tenant
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const timeEntry = await TimeEntry.query()
      .where('task_id', task.id)
      .where('id', params.id)
      .first()

    if (!timeEntry) {
      return response.notFound({ error: 'Time entry not found' })
    }

    // Users can only edit their own time entries
    const user = auth.getUserOrFail()
    if (timeEntry.userId !== user.id) {
      return response.forbidden({ error: 'You can only edit your own time entries' })
    }

    const data = await request.validateUsing(updateTimeEntryValidator)

    // Update fields individually to handle DateTime conversion
    if (data.description !== undefined) timeEntry.description = data.description
    if (data.startTime !== undefined)
      timeEntry.startTime = data.startTime ? DateTime.fromISO(data.startTime) : null
    if (data.endTime !== undefined)
      timeEntry.endTime = data.endTime ? DateTime.fromISO(data.endTime) : null
    if (data.durationMinutes !== undefined) timeEntry.durationMinutes = data.durationMinutes
    if (data.billable !== undefined) timeEntry.billable = data.billable
    if (data.date !== undefined) timeEntry.date = DateTime.fromISO(data.date)

    await timeEntry.save()

    // Update task actual hours
    await this.updateTaskActualHours(task.id)

    await timeEntry.load('user')

    return response.ok({ data: timeEntry })
  }

  /**
   * Delete a time entry
   */
  async destroy({ tenant, auth, params, response }: HttpContext) {
    // Verify task belongs to tenant
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const timeEntry = await TimeEntry.query()
      .where('task_id', task.id)
      .where('id', params.id)
      .first()

    if (!timeEntry) {
      return response.notFound({ error: 'Time entry not found' })
    }

    // Users can only delete their own time entries
    const user = auth.getUserOrFail()
    if (timeEntry.userId !== user.id) {
      return response.forbidden({ error: 'You can only delete your own time entries' })
    }

    await timeEntry.delete()

    // Update task actual hours
    await this.updateTaskActualHours(task.id)

    return response.noContent()
  }

  /**
   * Start a timer for a task
   */
  async start({ tenant, auth, params, request, response }: HttpContext) {
    // Verify task belongs to tenant
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const user = auth.getUserOrFail()

    // Check if user already has a running timer
    const runningTimer = await TimeEntry.query()
      .where('user_id', user.id)
      .where('is_running', true)
      .first()

    if (runningTimer) {
      return response.badRequest({
        error: 'You already have a running timer. Please stop it before starting a new one.',
        runningTimer,
      })
    }

    const data = await request.validateUsing(startTimerValidator)

    const timeEntry = await TimeEntry.create({
      taskId: task.id,
      userId: user.id,
      description: data.description,
      startTime: DateTime.now(),
      durationMinutes: 0,
      date: DateTime.now(),
      isRunning: true,
      billable: true,
    })

    await timeEntry.load('user')
    await timeEntry.load('task')

    return response.created({ data: timeEntry })
  }

  /**
   * Stop the active timer
   */
  async stop({ tenant, auth, params, response }: HttpContext) {
    // Verify task belongs to tenant
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (query) => {
        query.where('tenant_id', tenant.id)
      })
      .first()

    if (!task || !task.project) {
      return response.notFound({ error: 'Task not found' })
    }

    const user = auth.getUserOrFail()

    const runningTimer = await TimeEntry.query()
      .where('task_id', task.id)
      .where('user_id', user.id)
      .where('is_running', true)
      .first()

    if (!runningTimer) {
      return response.notFound({ error: 'No running timer found for this task' })
    }

    const endTime = DateTime.now()
    const durationMinutes = Math.round(endTime.diff(runningTimer.startTime!, 'minutes').minutes)

    runningTimer.endTime = endTime
    runningTimer.durationMinutes = durationMinutes
    runningTimer.isRunning = false
    await runningTimer.save()

    // Update task actual hours
    await this.updateTaskActualHours(task.id)

    await runningTimer.load('user')

    return response.ok({ data: runningTimer })
  }

  /**
   * Get active timer for current user
   */
  async active({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const runningTimer = await TimeEntry.query()
      .where('user_id', user.id)
      .where('is_running', true)
      .preload('task', (query) => {
        query.preload('project')
      })
      .preload('user')
      .first()

    if (!runningTimer) {
      return response.ok({ data: null })
    }

    // Calculate current duration
    const currentDuration = Math.round(
      DateTime.now().diff(runningTimer.startTime!, 'minutes').minutes
    )

    return response.ok({
      data: {
        ...runningTimer.toJSON(),
        currentDuration,
      },
    })
  }

  /**
   * Helper method to update task actual hours
   */
  private async updateTaskActualHours(taskId: number) {
    const task = await Task.find(taskId)
    if (!task) return

    const totalMinutes = await TimeEntry.query()
      .where('task_id', taskId)
      .sum('duration_minutes as total')

    const totalHours = (totalMinutes[0].$extras.total || 0) / 60

    task.actualHours = Number.parseFloat(totalHours.toFixed(2))
    await task.save()
  }
}
