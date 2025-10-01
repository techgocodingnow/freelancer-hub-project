import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import ProjectMember from '#models/project_member'
import { DateTime } from 'luxon'
import {
  createProjectValidator,
  updateProjectValidator,
  addProjectMemberValidator,
} from '#validators/projects'

export default class ProjectsController {
  /**
   * List all projects for the tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10
    const status = request.input('status')

    const query = Project.query().where('tenant_id', tenant.id)

    // Filter by status if provided
    if (status) {
      query.where('status', status)
    }

    // Sorting
    const sort = request.input('_sort', 'created_at')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    const projects = await query.paginate(page, perPage)

    // Load task counts for each project
    await Promise.all(
      projects.map(async (project) => {
        await project.load('tasks')
        await project.load('members')
      })
    )

    return response.header('x-total-count', projects.total).ok(projects.all())
  }

  /**
   * Get a single project with details
   */
  async show({ tenant, params, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .preload('tasks', (query) => {
        query.preload('assignee')
      })
      .preload('members')
      .preload('projectMembers', (query) => {
        query.preload('user')
      })
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Calculate task statistics
    const taskStats = {
      total: project.tasks.length,
      todo: project.tasks.filter((t) => t.status === 'todo').length,
      inProgress: project.tasks.filter((t) => t.status === 'in_progress').length,
      review: project.tasks.filter((t) => t.status === 'review').length,
      done: project.tasks.filter((t) => t.status === 'done').length,
    }

    return response.ok({
      data: {
        ...project.toJSON(),
        taskStats,
      },
    })
  }

  /**
   * Create a new project
   */
  async store({ tenant, auth, request, response }: HttpContext) {
    const data = await request.validateUsing(createProjectValidator)

    const project = await Project.create({
      tenantId: tenant.id,
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate ? DateTime.fromISO(data.startDate) : null,
      endDate: data.endDate ? DateTime.fromISO(data.endDate) : null,
      budget: data.budget,
    })

    // Add the creator as project owner
    const user = auth.getUserOrFail()
    await ProjectMember.create({
      projectId: project.id,
      userId: user.id,
      role: 'owner',
      joinedAt: DateTime.now(),
    })

    await project.load('projectMembers', (query) => {
      query.preload('user')
    })

    return response.created({ data: project })
  }

  /**
   * Update a project
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
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

    const data = await request.validateUsing(updateProjectValidator)

    // Update fields individually to handle DateTime conversion
    if (data.name !== undefined) project.name = data.name
    if (data.description !== undefined) project.description = data.description
    if (data.status !== undefined) project.status = data.status
    if (data.startDate !== undefined)
      project.startDate = data.startDate ? DateTime.fromISO(data.startDate) : null
    if (data.endDate !== undefined)
      project.endDate = data.endDate ? DateTime.fromISO(data.endDate) : null
    if (data.budget !== undefined) project.budget = data.budget

    await project.save()

    return response.ok({ data: project })
  }

  /**
   * Delete a project
   */
  async destroy({ tenant, auth, params, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Check if user is project owner
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .where('role', 'owner')
      .first()

    if (!membership) {
      return response.forbidden({ error: 'Only project owners can delete projects' })
    }

    await project.delete()
    return response.noContent()
  }

  /**
   * Get project members
   */
  async members({ tenant, params, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    const members = await ProjectMember.query()
      .where('project_id', project.id)
      .preload('user')
      .orderBy('joined_at', 'asc')

    return response.header('x-total-count', members.length).ok(members)
  }

  /**
   * Add a member to project
   */
  async addMember({ tenant, auth, params, request, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Check if current user is project admin or owner
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .whereIn('role', ['owner', 'admin'])
      .first()

    if (!membership) {
      return response.forbidden({ error: 'Only project owners and admins can add members' })
    }

    const data = await request.validateUsing(addProjectMemberValidator)

    // Check if user is already a member
    const existingMember = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', data.userId)
      .first()

    if (existingMember) {
      return response.conflict({ error: 'User is already a project member' })
    }

    const newMember = await ProjectMember.create({
      projectId: project.id,
      userId: data.userId,
      role: data.role || 'member',
      joinedAt: DateTime.now(),
    })

    await newMember.load('user')

    return response.created({ data: newMember })
  }

  /**
   * Remove a member from project
   */
  async removeMember({ tenant, auth, params, response }: HttpContext) {
    const project = await Project.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Check if current user is project admin or owner
    const user = auth.getUserOrFail()
    const membership = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', user.id)
      .whereIn('role', ['owner', 'admin'])
      .first()

    if (!membership) {
      return response.forbidden({ error: 'Only project owners and admins can remove members' })
    }

    const memberToRemove = await ProjectMember.query()
      .where('project_id', project.id)
      .where('user_id', params.userId)
      .first()

    if (!memberToRemove) {
      return response.notFound({ error: 'Member not found' })
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'owner') {
      const ownerCount = await ProjectMember.query()
        .where('project_id', project.id)
        .where('role', 'owner')
        .count('* as total')

      if (ownerCount[0].$extras.total <= 1) {
        return response.badRequest({ error: 'Cannot remove the last project owner' })
      }
    }

    await memberToRemove.delete()
    return response.noContent()
  }
}
