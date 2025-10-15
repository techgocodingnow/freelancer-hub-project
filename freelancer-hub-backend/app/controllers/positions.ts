import type { HttpContext } from '@adonisjs/core/http'
import Position from '#models/position'
import { createPositionValidator, updatePositionValidator } from '#validators/positions'

export default class PositionsController {
  /**
   * List all positions for the tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const showInactive = request.input('showInactive', false)

    const query = Position.query().where('tenant_id', tenant.id)

    // Filter by active status unless explicitly requesting all
    if (!showInactive) {
      query.where('is_active', true)
    }

    query.orderBy('name', 'asc')

    const positions = await query

    return response.ok({ data: positions })
  }

  /**
   * Create a new position
   */
  async store({ tenant, request, response }: HttpContext) {
    const data = await request.validateUsing(createPositionValidator)

    // Check if position name already exists for this tenant
    const existing = await Position.query()
      .where('tenant_id', tenant.id)
      .where('name', data.name)
      .first()

    if (existing) {
      return response.conflict({ error: 'A position with this name already exists' })
    }

    const position = await Position.create({
      tenantId: tenant.id,
      name: data.name,
      description: data.description || null,
      isActive: true,
    })

    return response.created({ data: position })
  }

  /**
   * Update a position
   */
  async update({ tenant, params, request, response }: HttpContext) {
    const position = await Position.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!position) {
      return response.notFound({ error: 'Position not found' })
    }

    const data = await request.validateUsing(updatePositionValidator)

    // If updating name, check for duplicates
    if (data.name && data.name !== position.name) {
      const existing = await Position.query()
        .where('tenant_id', tenant.id)
        .where('name', data.name)
        .whereNot('id', position.id)
        .first()

      if (existing) {
        return response.conflict({ error: 'A position with this name already exists' })
      }
    }

    // Update fields
    if (data.name !== undefined) position.name = data.name
    if (data.description !== undefined) position.description = data.description || null
    if (data.isActive !== undefined) position.isActive = data.isActive

    await position.save()

    return response.ok({ data: position })
  }

  /**
   * Soft delete (deactivate) a position
   */
  async destroy({ tenant, params, response }: HttpContext) {
    const position = await Position.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!position) {
      return response.notFound({ error: 'Position not found' })
    }

    // Soft delete by setting is_active to false
    await position.deactivate()

    return response.ok({ data: position, message: 'Position deactivated successfully' })
  }

  /**
   * Restore (reactivate) a position
   */
  async restore({ tenant, params, response }: HttpContext) {
    const position = await Position.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!position) {
      return response.notFound({ error: 'Position not found' })
    }

    await position.activate()

    return response.ok({ data: position, message: 'Position restored successfully' })
  }
}
