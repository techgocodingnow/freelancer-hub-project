import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import ProjectMember from '#models/project_member'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import {
  createProjectValidator,
  updateProjectValidator,
  addProjectMemberValidator,
  updateProjectMemberRateValidator,
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

    return response.ok(projects.serialize())
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
      ...project.toJSON(),
      taskStats,
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

    return response.ok({ data: members })
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
      hourlyRate: data.hourlyRate || null,
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

  /**
   * Update a project member's hourly rate
   */
  async updateMemberRate({ tenant, auth, params, request, response }: HttpContext) {
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
      return response.forbidden({ error: 'Only project owners and admins can update member rates' })
    }

    const data = await request.validateUsing(updateProjectMemberRateValidator)

    const memberToUpdate = await ProjectMember.query()
      .where('project_id', project.id)
      .where('id', params.memberId)
      .first()

    if (!memberToUpdate) {
      return response.notFound({ error: 'Member not found' })
    }

    memberToUpdate.hourlyRate = data.hourlyRate || null
    await memberToUpdate.save()
    await memberToUpdate.load('user')

    return response.ok({ data: memberToUpdate })
  }

  /**
   * Get time summary for a project within a date range
   * Returns total hours and breakdown by team member
   */
  async timeSummary({ tenant, params, request, response }: HttpContext) {
    const projectId = params.id
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    // Validate project exists and belongs to tenant
    const project = await Project.query()
      .where('id', projectId)
      .where('tenant_id', tenant.id)
      .first()

    if (!project) {
      return response.notFound({ error: 'Project not found' })
    }

    // Query billable time entries for this project within date range
    // Join with project_members and users to get both project-specific and default hourly rates
    const timeEntriesQuery = db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('users', 'time_entries.user_id', 'users.id')
      .leftJoin('project_members', function() {
        this.on('project_members.user_id', 'users.id')
          .andOn('project_members.project_id', 'tasks.project_id')
      })
      .where('tasks.project_id', projectId)
      .where('time_entries.billable', true)

    if (startDate) {
      timeEntriesQuery.where('time_entries.date', '>=', startDate)
    }

    if (endDate) {
      timeEntriesQuery.where('time_entries.date', '<=', endDate)
    }

    const timeEntries = await timeEntriesQuery.select(
      'time_entries.user_id',
      'users.full_name as user_name',
      'users.hourly_rate as user_default_rate',
      'project_members.hourly_rate as project_specific_rate',
      db.raw('SUM(time_entries.duration_minutes) as total_minutes')
    ).groupBy(
      'time_entries.user_id',
      'users.full_name',
      'users.hourly_rate',
      'project_members.hourly_rate'
    )

    // Calculate totals
    const totalMinutes = timeEntries.reduce(
      (sum, entry) => sum + Number(entry.total_minutes),
      0
    )
    const totalHours = totalMinutes / 60

    // Format per-member breakdown with rate information
    const memberBreakdown = timeEntries.map((entry) => {
      const hours = Number(entry.total_minutes) / 60
      const projectSpecificRate = entry.project_specific_rate ? Number(entry.project_specific_rate) : null
      const defaultRate = entry.user_default_rate ? Number(entry.user_default_rate) : null
      const effectiveRate = projectSpecificRate ?? defaultRate

      return {
        userId: entry.user_id,
        userName: entry.user_name,
        hours,
        effectiveRate,
        projectSpecificRate,
        defaultRate,
      }
    })

    return response.ok({
      projectId,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimals
      memberCount: timeEntries.length,
      memberBreakdown,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    })
  }
}
