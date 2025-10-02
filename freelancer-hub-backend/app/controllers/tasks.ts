import type { HttpContext } from '@adonisjs/core/http'
import Task from '#models/task'
import Project from '#models/project'
import ProjectMember from '#models/project_member'
import { DateTime } from 'luxon'
import {
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  assignTaskValidator,
} from '#validators/tasks'

export default class TasksController {
  /**
   * List all tasks for a project
   */
  async index({ tenant, params, request, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const query = Task.query().where('project_id', project.id)

    // Filters
    const status = request.input('status')
    const assigneeId = request.input('assignee_id')
    const priority = request.input('priority')

    if (status) {
      query.where('status', status)
    }
    if (assigneeId) {
      query.where('assignee_id', assigneeId)
    }
    if (priority) {
      query.where('priority', priority)
    }

    // Sorting
    const sort = request.input('_sort', 'position')
    const order = request.input('_order', 'ASC')
    query.orderBy(sort, order)

    // Load relationships
    query.preload('assignee').preload('creator').preload('timeEntries')

    const tasks = await query.paginate(page, perPage)

    const result = tasks.serialize()
    return response.ok({
      ...result,
      meta: {
        ...result.meta,
        overdueCount: 0,
        todayCount: 0,
      },
    })
  }

  /**
   * Get a single task with details
   */
  async show({ tenant, params, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const task = await Task.query()
      .where('project_id', project.id)
      .where('id', params.id)
      .preload('assignee')
      .preload('creator')
      .preload('blockingTask')
      .preload('timeEntries', (query) => {
        query.preload('user').orderBy('date', 'desc')
      })
      .first()

    if (!task) {
      return response.notFound({ error: 'Task not found' })
    }

    // Calculate total time spent
    const totalMinutes = task.timeEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const totalHours = (totalMinutes / 60).toFixed(2)

    return response.ok({
      data: {
        ...task.toJSON(),
        totalTimeSpent: {
          minutes: totalMinutes,
          hours: Number.parseFloat(totalHours),
        },
      },
    })
  }

  /**
   * Create a new task
   */
  async store({ tenant, auth, params, request, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Check if user is a project member
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ error: 'You are not a member of this project' })
    }

    const data = await request.validateUsing(createTaskValidator)

    // Get the highest position for new task
    const maxPosition = await Task.query().where('project_id', project.id).max('position as max')

    const position = data.position ?? (maxPosition[0].$extras.max || 0) + 1

    const task = await Task.create({
      projectId: project.id,
      createdBy: user.id,
      position,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? DateTime.fromISO(data.dueDate) : null,
      estimatedHours: data.estimatedHours,
      assigneeId: data.assigneeId,
      blockedBy: data.blockedBy,
    })

    await task.load('assignee')
    await task.load('creator')

    return response.created({ data: task })
  }

  /**
   * Update a task
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const task = await Task.query().where('project_id', project.id).where('id', params.id).first()

    if (!task) {
      return response.notFound({ error: 'Task not found' })
    }

    // Check if user is a project member
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ error: 'You are not a member of this project' })
    }

    const data = await request.validateUsing(updateTaskValidator)

    // Update fields individually to handle DateTime conversion
    if (data.title !== undefined) task.title = data.title
    if (data.description !== undefined) task.description = data.description
    if (data.priority !== undefined) task.priority = data.priority
    if (data.dueDate !== undefined)
      task.dueDate = data.dueDate ? DateTime.fromISO(data.dueDate) : null
    if (data.estimatedHours !== undefined) task.estimatedHours = data.estimatedHours
    if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId
    if (data.blockedBy !== undefined) task.blockedBy = data.blockedBy
    if (data.position !== undefined) task.position = data.position

    // If status is being changed to 'done', set completedAt
    if (data.status === 'done' && task.status !== 'done') {
      task.completedAt = DateTime.now()
      task.status = data.status
    } else if (data.status && data.status !== 'done') {
      task.completedAt = null
      task.status = data.status
    }

    await task.save()

    await task.load('assignee')
    await task.load('creator')

    return response.ok({ data: task })
  }

  /**
   * Delete a task
   */
  async destroy({ tenant, auth, params, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const task = await Task.query().where('project_id', project.id).where('id', params.id).first()

    if (!task) {
      return response.notFound({ error: 'Task not found' })
    }

    // Check if user is a project member
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ error: 'You are not a member of this project' })
    }

    await task.delete()
    return response.noContent()
  }

  /**
   * Update task status (for Kanban drag-and-drop)
   */
  async updateStatus({ tenant, auth, params, request, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const task = await Task.query().where('project_id', project.id).where('id', params.id).first()

    if (!task) {
      return response.notFound({ error: 'Task not found' })
    }

    // Check if user is a project member
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ error: 'You are not a member of this project' })
    }

    const data = await request.validateUsing(updateTaskStatusValidator)

    task.status = data.status
    if (data.position !== undefined) {
      task.position = data.position
    }

    // Set completedAt if status is 'done'
    if (data.status === 'done' && task.status !== 'done') {
      task.completedAt = DateTime.now()
    } else if (data.status !== 'done') {
      task.completedAt = null
    }

    await task.save()
    await task.load('assignee')

    return response.ok({ data: task })
  }

  /**
   * Assign task to a user
   */
  async assign({ tenant, auth, params, request, response }: HttpContext) {
    // Verify project belongs to tenant
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.projectId)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const task = await Task.query().where('project_id', project.id).where('id', params.id).first()

    if (!task) {
      return response.notFound({ error: 'Task not found' })
    }

    // Check if user is a project member
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.forbidden({ error: 'You are not a member of this project' })
    }

    const data = await request.validateUsing(assignTaskValidator)

    task.assigneeId = data.assigneeId
    await task.save()
    await task.load('assignee')

    return response.ok({ data: task })
  }
}
