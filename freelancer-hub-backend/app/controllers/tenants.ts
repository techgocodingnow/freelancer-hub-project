import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'

export default class TenantsController {
  /**
   * Get all active tenants (public endpoint for registration)
   */
  async list({ response }: HttpContext) {
    const tenants = await Tenant.query().where('is_active', true).orderBy('name', 'asc')

    return response.ok({
      data: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      })),
    })
  }

  /**
   * Get all tenants for the authenticated user
   */
  async index({ auth, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.user!

      // Load user's tenant
      await user.load('tenant')

      // For now, return only the user's tenant
      // In a more complex scenario, users might belong to multiple tenants
      return response.ok({
        data: [user.tenant],
      })
    } catch (error) {
      return response.unauthorized({ error: 'Unauthorized' })
    }
  }

  /**
   * Get a specific tenant by slug
   */
  async show({ params, response }: HttpContext) {
    const tenant = await Tenant.query().where('slug', params.slug).first()

    if (!tenant) {
      return response.notFound({ error: 'Tenant not found' })
    }

    return response.ok({ data: tenant })
  }
}
