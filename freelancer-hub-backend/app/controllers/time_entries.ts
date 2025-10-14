import type { HttpContext } from '@adonisjs/core/http'
import TimeEntry from '#models/time_entry'
import Task from '#models/task'
import Project from '#models/project'
import TenantUser from '#models/tenant_user'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import {
  createTimeEntryValidator,
  updateTimeEntryValidator,
  startTimerValidator,
} from '#validators/time_entries'
import { parse } from 'csv-parse/sync'

export default class TimeEntriesController {
  /**
   * List time entries
   *
   * If taskId param is provided: List entries for a specific task
   * If no taskId param: List all entries with filtering (global view)
   */
  async index(ctx: HttpContext) {
    // Check if this is a task-scoped request or global request
    const isTaskScoped = !!ctx.params.taskId

    if (isTaskScoped) {
      return this.indexForTask(ctx)
    } else {
      return this.indexGlobal(ctx)
    }
  }

  /**
   * List all time entries for a specific task (task-scoped)
   */
  private async indexForTask({ tenant, params, request, response }: HttpContext) {
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

    return response.ok(timeEntries.serialize())
  }

  /**
   * List all time entries with filtering (global view)
   * Supports daily/weekly grouping and comprehensive filtering
   */
  private async indexGlobal({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const page = request.input('_start', 0) / request.input('_end', 50) + 1 || 1
    const perPage = request.input('_end', 50) - request.input('_start', 0) || 50

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    // Build base query
    const query = TimeEntry.query()
      .select('time_entries.*', 'tasks.id as task_id', 'projects.id as project_id')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)
      .preload('user')
      .preload('task', (taskQuery) => {
        taskQuery.preload('project')
      })

    // Filters
    const viewMode = request.input('view_mode', 'daily')
    const projectId = request.input('project_id')
    const userId = request.input('user_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const billable = request.input('billable')

    // Non-admins can only see their own entries
    if (!isAdmin) {
      query.where('time_entries.user_id', user.id)
    } else if (userId) {
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

    // Calculate aggregated data
    const summaryQuery = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)

    if (!isAdmin) {
      summaryQuery.where('time_entries.user_id', user.id)
    } else if (userId) {
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

    // Get breakdown by project
    const projectBreakdown = await summaryQuery
      .clone()
      .select(
        'projects.id as project_id',
        'projects.name as project_name',
        db.raw('SUM(time_entries.duration_minutes) as total_minutes')
      )
      .groupBy('projects.id', 'projects.name')
      .orderBy('total_minutes', 'desc')

    // Get breakdown by day or week based on view mode
    let timeBreakdown
    if (viewMode === 'weekly') {
      timeBreakdown = await summaryQuery
        .clone()
        .select(
          db.raw("DATE_TRUNC('week', time_entries.date) as period"),
          db.raw('SUM(time_entries.duration_minutes) as total_minutes'),
          db.raw(
            'SUM(CASE WHEN time_entries.billable = true THEN time_entries.duration_minutes ELSE 0 END) as billable_minutes'
          )
        )
        .groupByRaw("DATE_TRUNC('week', time_entries.date)")
        .orderBy('period', 'desc')
    } else {
      timeBreakdown = await summaryQuery
        .clone()
        .select(
          'time_entries.date as period',
          db.raw('SUM(time_entries.duration_minutes) as total_minutes'),
          db.raw(
            'SUM(CASE WHEN time_entries.billable = true THEN time_entries.duration_minutes ELSE 0 END) as billable_minutes'
          )
        )
        .groupBy('time_entries.date')
        .orderBy('period', 'desc')
    }

    return response.ok({
      data: timeEntries.all(),
      meta: {
        total: timeEntries.total,
        perPage: timeEntries.perPage,
        currentPage: timeEntries.currentPage,
        lastPage: timeEntries.lastPage,
      },
      summary: {
        totalHours: Number.parseFloat(((summary?.total_minutes || 0) / 60).toFixed(2)),
        billableHours: Number.parseFloat(((summary?.billable_minutes || 0) / 60).toFixed(2)),
        nonBillableHours: Number.parseFloat(((summary?.non_billable_minutes || 0) / 60).toFixed(2)),
        entryCount: Number.parseInt(summary?.entry_count || 0),
      },
      breakdown: {
        byProject: projectBreakdown.map((row) => ({
          projectId: row.project_id,
          projectName: row.project_name,
          totalHours: Number.parseFloat((row.total_minutes / 60).toFixed(2)),
        })),
        byTime: timeBreakdown.map((row) => ({
          period: row.period,
          totalHours: Number.parseFloat((row.total_minutes / 60).toFixed(2)),
          billableHours: Number.parseFloat((row.billable_minutes / 60).toFixed(2)),
        })),
      },
    })
  }

  /**
   * Create a new time entry
   * Supports both task-scoped (/tasks/:taskId/time-entries) and global (/time-entries) creation
   */
  async store({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const isTaskScoped = !!params.taskId

    let taskId: number

    if (isTaskScoped) {
      // Task-scoped: taskId from URL params
      const task = await Task.query()
        .where('id', params.taskId)
        .preload('project', (query) => {
          query.where('tenant_id', tenant.id)
        })
        .first()

      if (!task || !task.project) {
        return response.notFound({ error: 'Task not found' })
      }

      taskId = task.id
    } else {
      // Global: taskId from request body (with validation)
      const bodyData = request.only(['projectId', 'taskId'])

      if (!bodyData.projectId || !bodyData.taskId) {
        return response.badRequest({
          error: 'projectId and taskId are required when creating time entry globally',
        })
      }

      // Verify project belongs to tenant
      const project = await Project.query()
        .where('id', bodyData.projectId)
        .where('tenant_id', tenant.id)
        .first()

      if (!project) {
        return response.notFound({ error: 'Project not found' })
      }

      // Verify task belongs to project
      const task = await Task.query()
        .where('id', bodyData.taskId)
        .where('project_id', project.id)
        .first()

      if (!task) {
        return response.notFound({ error: 'Task not found in the specified project' })
      }

      taskId = task.id
    }

    const data = await request.validateUsing(createTimeEntryValidator)

    const timeEntry = await TimeEntry.create({
      taskId,
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
    await this.updateTaskActualHours(taskId)

    await timeEntry.load('user')
    await timeEntry.load('task', (taskQuery) => {
      taskQuery.preload('project')
    })

    return response.created({ data: timeEntry })
  }

  /**
   * Update a time entry
   * Supports both task-scoped and global updates
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const isTaskScoped = !!params.taskId

    let timeEntry: TimeEntry | null

    if (isTaskScoped) {
      // Task-scoped: verify task belongs to tenant first
      const task = await Task.query()
        .where('id', params.taskId)
        .preload('project', (query) => {
          query.where('tenant_id', tenant.id)
        })
        .first()

      if (!task || !task.project) {
        return response.notFound({ error: 'Task not found' })
      }

      timeEntry = await TimeEntry.query().where('task_id', task.id).where('id', params.id).first()
    } else {
      // Global: verify time entry belongs to tenant through task->project relationship
      timeEntry = await TimeEntry.query()
        .where('id', params.id)
        .preload('task', (taskQuery) => {
          taskQuery.preload('project', (projectQuery) => {
            projectQuery.where('tenant_id', tenant.id)
          })
        })
        .first()

      if (!timeEntry || !timeEntry.task?.project) {
        return response.notFound({ error: 'Time entry not found' })
      }
    }

    if (!timeEntry) {
      return response.notFound({ error: 'Time entry not found' })
    }

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    // Users can only edit their own entries unless they're admins
    if (!isAdmin && timeEntry.userId !== user.id) {
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
    await this.updateTaskActualHours(timeEntry.taskId)

    await timeEntry.load('user')
    await timeEntry.load('task', (taskQuery) => {
      taskQuery.preload('project')
    })

    return response.ok({ data: timeEntry })
  }

  /**
   * Delete a time entry
   * Supports both task-scoped and global deletion
   */
  async destroy({ tenant, auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const isTaskScoped = !!params.taskId

    let timeEntry: TimeEntry | null

    if (isTaskScoped) {
      // Task-scoped: verify task belongs to tenant first
      const task = await Task.query()
        .where('id', params.taskId)
        .preload('project', (query) => {
          query.where('tenant_id', tenant.id)
        })
        .first()

      if (!task || !task.project) {
        return response.notFound({ error: 'Task not found' })
      }

      timeEntry = await TimeEntry.query().where('task_id', task.id).where('id', params.id).first()
    } else {
      // Global: verify time entry belongs to tenant through task->project relationship
      timeEntry = await TimeEntry.query()
        .where('id', params.id)
        .preload('task', (taskQuery) => {
          taskQuery.preload('project', (projectQuery) => {
            projectQuery.where('tenant_id', tenant.id)
          })
        })
        .first()

      if (!timeEntry || !timeEntry.task?.project) {
        return response.notFound({ error: 'Time entry not found' })
      }
    }

    if (!timeEntry) {
      return response.notFound({ error: 'Time entry not found' })
    }

    // Check if user is admin/owner
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', user.id)
      .preload('role')
      .firstOrFail()

    const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

    // Users can only delete their own entries unless they're admins
    if (!isAdmin && timeEntry.userId !== user.id) {
      return response.forbidden({ error: 'You can only delete your own time entries' })
    }

    const taskId = timeEntry.taskId

    await timeEntry.delete()

    // Update task actual hours
    await this.updateTaskActualHours(taskId)

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
   * Show a specific time entry
   */
  async show({ tenant, params, response }: HttpContext) {
    const timeEntry = await TimeEntry.query()
      .select('time_entries.*', 'tasks.id as task_id', 'projects.id as project_id')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)
      .preload('user')
      .preload('task', (taskQuery) => {
        taskQuery.preload('project')
      })
      .where('time_entries.id', params.id)
      .firstOrFail()
    if (!timeEntry) {
      return response.notFound({ error: 'Time entry not found' })
    }
    return response.ok({ data: timeEntry })
  }

  /**
   * Import time entries from CSV file
   */
  async importCsv({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Validate file upload
    const csvFile = request.file('csv', {
      size: '10mb',
      extnames: ['csv'],
    })

    if (!csvFile) {
      return response.unprocessableEntity({
        errors: [
          {
            message: 'CSV file is required',
          },
        ],
      })
    }

    // Read CSV file content
    const csvContent = await csvFile.tmpPath?.toString()
    if (!csvContent) {
      return response.unprocessableEntity({
        errors: [
          {
            message: 'Failed to read CSV file',
          },
        ],
      })
    }

    const fileContent = await import('fs').then((fs) =>
      fs.promises.readFile(csvContent, 'utf-8')
    )

    // Parse CSV
    let records: any[]
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      return response.unprocessableEntity({
        errors: [
          {
            message: 'Invalid CSV file format',
          },
        ],
      })
    }

    // Get skip invalid flag
    const skipInvalid = request.input('skipInvalid') === 'true'

    // Validate and process records
    const errors: any[] = []
    const validRecords: any[] = []
    const taskIdsToUpdate = new Set<number>()
    const autoCreatedTasks: string[] = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 because row 1 is header and arrays are 0-indexed

      // Validate date
      const dateStr = record['Date']?.trim()
      if (!dateStr || !DateTime.fromISO(dateStr).isValid) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: 'Invalid date format. Use YYYY-MM-DD',
        })
        continue
      }

      // Validate description
      const description = record['Description']?.trim()
      if (!description || description.length < 3) {
        errors.push({
          row: rowNumber,
          field: 'description',
          message: 'Description is required and must be at least 3 characters',
        })
        continue
      }

      // Find project
      const projectName = record['Project']?.trim()
      if (!projectName) {
        errors.push({
          row: rowNumber,
          field: 'project',
          message: 'Project is required',
        })
        continue
      }

      const project = await Project.query()
        .where('tenant_id', tenant.id)
        .where('name', projectName)
        .first()

      if (!project) {
        errors.push({
          row: rowNumber,
          field: 'project',
          message: 'Project not found',
        })
        continue
      }

      // Find or create task
      const taskTitle = record['Task']?.trim()
      if (!taskTitle) {
        errors.push({
          row: rowNumber,
          field: 'task',
          message: 'Task is required',
        })
        continue
      }

      let task = await Task.query()
        .where('project_id', project.id)
        .where('title', taskTitle)
        .first()

      if (!task) {
        // Auto-create task with sensible defaults
        const maxPosition = await Task.query()
          .where('project_id', project.id)
          .max('position as max')

        const position = (maxPosition[0].$extras.max || 0) + 1

        task = await Task.create({
          projectId: project.id,
          title: taskTitle,
          description: `Auto-created from CSV import on ${DateTime.now().toFormat('yyyy-MM-dd')}`,
          status: 'in_progress',
          priority: 'medium',
          position,
          createdBy: user.id,
          assigneeId: user.id,
          actualHours: 0,
          estimatedHours: null,
          dueDate: null,
          blockedBy: null,
        })

        // Track auto-created task
        autoCreatedTasks.push(`${projectName} > ${taskTitle}`)
      }

      // Calculate duration
      let durationMinutes: number
      const startTimeStr = record['Start Time']?.trim()
      const endTimeStr = record['End Time']?.trim()
      const durationStr = record['Duration (minutes)']?.trim()

      if (startTimeStr && endTimeStr) {
        // Parse times and calculate duration
        const [startHour, startMinute] = startTimeStr.split(':').map(Number)
        const [endHour, endMinute] = endTimeStr.split(':').map(Number)

        const date = DateTime.fromISO(dateStr)
        const startTime = date.set({ hour: startHour, minute: startMinute })
        const endTime = date.set({ hour: endHour, minute: endMinute })

        if (endTime <= startTime) {
          errors.push({
            row: rowNumber,
            field: 'time',
            message: 'End time must be after start time',
          })
          continue
        }

        durationMinutes = endTime.diff(startTime, 'minutes').minutes
      } else if (durationStr) {
        durationMinutes = Number.parseInt(durationStr)
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
          errors.push({
            row: rowNumber,
            field: 'duration',
            message: 'Duration must be a positive number',
          })
          continue
        }
      } else {
        errors.push({
          row: rowNumber,
          field: 'duration',
          message: 'Either start/end times or duration is required',
        })
        continue
      }

      // Parse billable flag
      const billableStr = record['Billable']?.trim().toLowerCase()
      const billable = ['yes', 'true', '1'].includes(billableStr) || !billableStr

      // Parse notes
      const notes = record['Notes']?.trim() || null

      validRecords.push({
        taskId: task.id,
        date: DateTime.fromISO(dateStr),
        startTime: startTimeStr ? record['Start Time'] : null,
        endTime: endTimeStr ? record['End Time'] : null,
        durationMinutes,
        description,
        notes,
        billable,
      })

      taskIdsToUpdate.add(task.id)
    }

    // If not skipping invalid and there are errors, return all errors
    if (!skipInvalid && errors.length > 0) {
      return response.unprocessableEntity({
        success: false,
        imported: 0,
        failed: errors.length,
        errors,
      })
    }

    // Import valid records in a transaction
    let importedCount = 0
    if (validRecords.length > 0) {
      await db.transaction(async (trx) => {
        for (const record of validRecords) {
          await TimeEntry.create(
            {
              taskId: record.taskId,
              userId: user.id,
              date: record.date,
              startTime: record.startTime
                ? DateTime.fromISO(`${record.date.toISODate()}T${record.startTime}:00`)
                : null,
              endTime: record.endTime
                ? DateTime.fromISO(`${record.date.toISODate()}T${record.endTime}:00`)
                : null,
              durationMinutes: record.durationMinutes,
              description: record.description,
              notes: record.notes,
              billable: record.billable,
              isRunning: false,
            },
            { client: trx }
          )
          importedCount++
        }
      })

      // Update task actual hours for all affected tasks
      for (const taskId of taskIdsToUpdate) {
        await this.updateTaskActualHours(taskId)
      }
    }

    return response.created({
      success: true,
      imported: importedCount,
      failed: errors.length,
      ...(errors.length > 0 && { errors }),
      ...(autoCreatedTasks.length > 0 && { tasksCreated: autoCreatedTasks }),
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
