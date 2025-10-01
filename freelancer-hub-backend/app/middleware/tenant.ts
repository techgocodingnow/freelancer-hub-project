import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Tenant from '#models/tenant'
import TenantUser from '#models/tenant_user'
/**
 * Tenant from token middleware
 *
 * This middleware:
 * 1. Gets tenant slug from X-Tenant-Slug header
 * 2. Loads the tenant and verifies it's active
 * 3. Verifies the authenticated user belongs to the tenant
 * 4. Loads the user's role in the tenant
 * 5. Attaches tenant context to the request
 */

/**
 * Tenant middleware extracts the tenant slug from the request
 * and attaches the tenant to the HTTP context
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { response, auth, request } = ctx

    // Ensure user is authenticated
    await auth.authenticate()
    const user = auth.getUserOrFail()

    // Get tenant from header
    const tenantSlug = request.header('x-tenant-slug')

    if (!tenantSlug) {
      return response.badRequest({
        error: 'Tenant context required. Set X-Tenant-Slug header.',
      })
    }

    // Load tenant
    const tenant = await Tenant.query().where('slug', tenantSlug).first()
    if (!tenant) {
      return response.notFound({ error: 'Tenant not found' })
    }

    if (!tenant.isActive) {
      return response.forbidden({ error: 'Tenant is not active' })
    }

    // Verify user belongs to tenant and get their role
    const tenantUser = await TenantUser.query()
      .where('user_id', user.id)
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .preload('role')
      .first()

    if (!tenantUser) {
      return response.forbidden({
        error: 'You do not have access to this tenant',
      })
    }

    // Attach tenant context to the request
    ctx.tenant = tenant
    ctx.tenantUser = tenantUser
    ctx.userRole = tenantUser.role

    await next()
  }
}

// Extend HttpContext to include tenant
declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant: Tenant
  }
}
