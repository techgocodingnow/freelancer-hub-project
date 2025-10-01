import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role authorization middleware
 *
 * This middleware checks if the user has one of the required roles in the current tenant.
 * Must be used after tenant_context middleware.
 *
 * Usage:
 *   router.get('/admin-only', [Controller, 'method'])
 *     .use(middleware.tenantContext())
 *     .use(middleware.requireRole(['admin', 'owner']))
 */
export default class RequireRoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles: string[]
    }
  ) {
    const { response, userRole } = ctx

    // Ensure tenant context middleware has run
    if (!userRole) {
      return response.internalServerError({
        error: 'Tenant context not loaded. Ensure tenant_context middleware runs before require_role.',
      })
    }

    // Check if user has one of the required roles
    const hasRequiredRole = options.roles.includes(userRole.name)

    if (!hasRequiredRole) {
      return response.forbidden({
        error: `This action requires one of the following roles: ${options.roles.join(', ')}`,
        requiredRoles: options.roles,
        userRole: userRole.name,
      })
    }

    await next()
  }
}

