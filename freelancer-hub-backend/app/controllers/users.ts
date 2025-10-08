import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import TenantUser from '#models/tenant_user'
import Role from '#models/role'
import { updateUserRoleValidator } from '#validators/users'
import { DateTime } from 'luxon'

export default class UsersController {
  /**
   * Get all users in the tenant with pagination and filtering
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')
    const roleName = request.input('role', '')

    // Query tenant_users instead of users directly
    const query = TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .preload('user')
      .preload('role')

    // Apply search filter on user fields
    if (search) {
      query.whereHas('user', (userQuery) => {
        userQuery.where((builder) => {
          builder.whereILike('full_name', `%${search}%`).orWhereILike('email', `%${search}%`)
        })
      })
    }

    // Apply role filter
    if (roleName) {
      query.whereHas('role', (roleQuery) => {
        roleQuery.where('name', roleName)
      })
    }

    // Order by joined date (newest first)
    query.orderBy('joined_at', 'desc')

    // Paginate results
    const tenantUsers = await query.paginate(page, limit)

    return response.ok({
      data: tenantUsers.all().map((tu) => ({
        id: tu.user.id,
        fullName: tu.user.fullName,
        email: tu.user.email,
        role: tu.role.name,
        roleId: tu.role.id,
        isActive: tu.isActive,
        joinedAt: tu.joinedAt,
        createdAt: tu.user.createdAt,
        updatedAt: tu.user.updatedAt,
      })),
      meta: {
        total: tenantUsers.total,
        perPage: tenantUsers.perPage,
        currentPage: tenantUsers.currentPage,
        lastPage: tenantUsers.lastPage,
        hasMorePages: tenantUsers.hasMorePages,
      },
    })
  }

  /**
   * Get a single user by ID
   */
  async show({ tenant, params, response }: HttpContext) {
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', params.id)
      .where('is_active', true)
      .preload('user')
      .preload('role')
      .first()

    if (!tenantUser) {
      return response.notFound({ error: 'User not found in this tenant' })
    }

    return response.ok({
      data: {
        id: tenantUser.user.id,
        fullName: tenantUser.user.fullName,
        email: tenantUser.user.email,
        role: tenantUser.role.name,
        roleId: tenantUser.role.id,
        isActive: tenantUser.isActive,
        joinedAt: tenantUser.joinedAt,
        createdAt: tenantUser.user.createdAt,
        updatedAt: tenantUser.user.updatedAt,
      },
    })
  }

  /**
   * Update user role (admin only)
   */
  async updateRole({ tenant, userRole, auth, params, request, response }: HttpContext) {
    // Check if current user has permission to manage users
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can update user roles' })
    }

    const currentUser = auth.getUserOrFail()

    // Find the tenant-user relationship to update
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', params.id)
      .where('is_active', true)
      .preload('user')
      .preload('role')
      .first()

    if (!tenantUser) {
      return response.notFound({ error: 'User not found in this tenant' })
    }

    // Prevent users from changing their own role
    if (tenantUser.user.id === currentUser.id) {
      return response.badRequest({ error: 'You cannot change your own role' })
    }

    // Validate and get new role
    const data = await request.validateUsing(updateUserRoleValidator)
    const newRole = await Role.query().where('name', data.role).firstOrFail()

    // Update the role in tenant_users
    tenantUser.roleId = newRole.id
    await tenantUser.save()

    // Reload the role relationship
    await tenantUser.load('role')

    return response.ok({
      data: {
        id: tenantUser.user.id,
        fullName: tenantUser.user.fullName,
        email: tenantUser.user.email,
        role: tenantUser.role.name,
        roleId: tenantUser.role.id,
        isActive: tenantUser.isActive,
        joinedAt: tenantUser.joinedAt,
        createdAt: tenantUser.user.createdAt,
        updatedAt: tenantUser.user.updatedAt,
      },
    })
  }

  /**
   * Invite a user to the tenant (admin only)
   */
  async invite({ tenant, userRole, request, response }: HttpContext) {
    // Check permission
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can invite users' })
    }

    const { email, roleId } = request.only(['email', 'roleId'])

    // Check if user exists
    let user = await User.query().where('email', email).first()

    // If user doesn't exist, create them (they'll need to set password on first login)
    if (!user) {
      user = await User.create({
        email,
        fullName: email.split('@')[0], // Temporary name
        password: Math.random().toString(36).slice(-12), // Temporary password
      })
    }

    // Check if user is already in this tenant
    const existingTenantUser = await TenantUser.query()
      .where('user_id', user.id)
      .where('tenant_id', tenant.id)
      .first()

    if (existingTenantUser) {
      if (existingTenantUser.isActive) {
        return response.conflict({ error: 'User is already a member of this tenant' })
      } else {
        // Reactivate the user
        existingTenantUser.isActive = true
        existingTenantUser.roleId = roleId
        await existingTenantUser.save()
        await existingTenantUser.load('role')

        return response.ok({
          message: 'User reactivated in tenant',
          data: {
            id: user.id,
            email: user.email,
            role: existingTenantUser.role.name,
          },
        })
      }
    }

    // Add user to tenant
    const tenantUser = await TenantUser.create({
      userId: user.id,
      tenantId: tenant.id,
      roleId,
      isActive: true,
      joinedAt: DateTime.now(),
    })

    await tenantUser.load('role')

    return response.created({
      message: 'User invited to tenant',
      data: {
        id: user.id,
        email: user.email,
        role: tenantUser.role.name,
      },
    })
  }

  /**
   * Remove a user from the tenant (admin only)
   */
  async remove({ tenant, userRole, auth, params, response }: HttpContext) {
    // Check permission
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can remove users' })
    }

    const currentUser = auth.getUserOrFail()

    // Prevent removing yourself
    if (Number(params.id) === currentUser.id) {
      return response.badRequest({ error: 'You cannot remove yourself from the tenant' })
    }

    // Find the tenant-user relationship
    const tenantUser = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('user_id', params.id)
      .first()

    if (!tenantUser) {
      return response.notFound({ error: 'User not found in this tenant' })
    }

    // Soft delete by setting is_active to false
    tenantUser.isActive = false
    await tenantUser.save()

    return response.ok({
      message: 'User removed from tenant',
    })
  }

  /**
   * Get available roles
   */
  async getRoles({ response }: HttpContext) {
    const roles = await Role.query().select('id', 'name', 'description').orderBy('name', 'asc')

    return response.ok({
      data: roles,
    })
  }

  /**
   * Search organization members for autocomplete
   */
  async search({ tenant, request, response }: HttpContext) {
    const query = request.input('q', '')
    const limit = request.input('limit', 10)

    if (!query || query.length < 2) {
      return response.ok({ data: [] })
    }

    // Search tenant users by name or email
    const tenantUsers = await TenantUser.query()
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .preload('user')
      .preload('role')
      .whereHas('user', (userQuery) => {
        userQuery.where((builder) => {
          builder.whereILike('full_name', `%${query}%`).orWhereILike('email', `%${query}%`)
        })
      })
      .limit(limit)

    const users = tenantUsers.map((tu) => ({
      id: tu.user.id,
      fullName: tu.user.fullName,
      email: tu.user.email,
      role: tu.role.name,
      roleId: tu.roleId,
    }))

    return response.ok({ data: users })
  }
}
