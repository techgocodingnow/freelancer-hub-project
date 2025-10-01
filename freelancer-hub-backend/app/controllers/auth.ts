import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Tenant from '#models/tenant'
import TenantUser from '#models/tenant_user'
import Role from '#models/role'
import db from '@adonisjs/lucid/services/db'
import { registerValidator, loginValidator } from '#validators/auth'
import { DateTime } from 'luxon'

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    // Check if user already exists
    const existingUser = await User.query().where('email', data.email).first()
    if (existingUser) {
      return response.conflict({
        error: 'User with this email already exists',
      })
    }

    // Use transaction to ensure atomicity
    const trx = await db.transaction()

    try {
      let tenant: Tenant
      let isNewTenant = false

      // Scenario 1: User joins existing tenant
      if (data.tenantId) {
        const existingTenant = await Tenant.find(data.tenantId)
        if (!existingTenant || !existingTenant.isActive) {
          await trx.rollback()
          return response.notFound({
            error: 'Tenant not found or inactive',
          })
        }
        tenant = existingTenant
      }
      // Scenario 2: User creates new tenant
      else if (data.tenantName && data.tenantSlug) {
        // Check if tenant slug already exists
        const existingTenant = await Tenant.query().where('slug', data.tenantSlug).first()
        if (existingTenant) {
          await trx.rollback()
          return response.conflict({
            error: 'Tenant with this slug already exists',
          })
        }

        tenant = await Tenant.create(
          {
            name: data.tenantName,
            slug: data.tenantSlug,
            isActive: true,
          },
          { client: trx }
        )
        isNewTenant = true
      } else {
        await trx.rollback()
        return response.badRequest({
          error: 'Either tenantId or both tenantName and tenantSlug must be provided',
        })
      }

      // Create user (without tenant_id and role - those are in pivot table now)
      const user = await User.create(
        {
          email: data.email,
          password: data.password, // Will be hashed by model hook
          fullName: data.fullName,
        },
        { client: trx }
      )

      // Get the appropriate role
      // If creating new tenant, user becomes owner; otherwise member
      const roleName = isNewTenant ? 'owner' : 'member'
      const role = await Role.query().where('name', roleName).firstOrFail()

      // Create tenant-user relationship
      await TenantUser.create(
        {
          userId: user.id,
          tenantId: tenant.id,
          roleId: role.id,
          isActive: true,
          joinedAt: DateTime.now(),
        },
        { client: trx }
      )

      await trx.commit()

      // Create access token
      const token = await User.accessTokens.create(user)

      // Get user's tenants with roles
      const tenants = await this.getUserTenantsWithRoles(user.id)

      return response.created({
        token: token.value!.release(),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          tenants,
          defaultTenant: tenant,
        },
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Login user and return access token
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)

      // Get user's tenants with roles
      const tenants = await this.getUserTenantsWithRoles(user.id)

      // Get default tenant (first active tenant or first tenant)
      const activeTenants = tenants.filter((t) => t.isActive)
      const defaultTenant = activeTenants.length > 0 ? activeTenants[0].tenant : tenants[0]?.tenant

      return response.ok({
        token: token.value!.release(),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          tenants,
          defaultTenant,
        },
      })
    } catch (error) {
      return response.badRequest({
        errors: [{ message: 'Invalid user credentials' }],
      })
    }
  }

  /**
   * Logout user
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.ok({ message: 'Logged out successfully' })
  }

  /**
   * Get current user
   */
  async me({ auth, response }: HttpContext) {
    await auth.authenticate()
    const user = auth.user!

    // Get user's tenants with roles
    const tenants = await this.getUserTenantsWithRoles(user.id)

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenants,
      },
    })
  }

  /**
   * Switch tenant context
   */
  async switchTenant({ auth, request, response }: HttpContext) {
    await auth.authenticate()
    const user = auth.user!
    const { tenantId } = request.only(['tenantId'])

    // Verify user belongs to the tenant
    const tenantUser = await TenantUser.query()
      .where('user_id', user.id)
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .preload('tenant')
      .preload('role')
      .first()

    if (!tenantUser) {
      return response.forbidden({
        error: 'You do not have access to this tenant',
      })
    }

    return response.ok({
      tenant: tenantUser.tenant,
      role: tenantUser.role,
    })
  }

  /**
   * Helper method to get user's tenants with roles
   */
  private async getUserTenantsWithRoles(userId: number) {
    const tenantUsers = await TenantUser.query()
      .where('user_id', userId)
      .preload('tenant')
      .preload('role')
      .orderBy('joined_at', 'asc')

    return tenantUsers.map((tu) => ({
      tenant: tu.tenant,
      role: tu.role,
      isActive: tu.isActive,
      joinedAt: tu.joinedAt,
    }))
  }
}
