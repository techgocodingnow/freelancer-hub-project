import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import Project from '#models/project'
import Invoice from '#models/invoice'
import { createCustomerValidator, updateCustomerValidator } from '#validators/customers'

export default class CustomersController {
  /**
   * List all customers for the tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10
    const search = request.input('search', '')
    const isActive = request.input('isActive')

    const query = Customer.query().where('tenant_id', tenant.id)

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.where('is_active', isActive === 'true')
    }

    // Search by name, email, or company
    if (search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('company', `%${search}%`)
      })
    }

    // Sorting
    const sort = request.input('_sort', 'created_at')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    const customers = await query.paginate(page, perPage)

    // Load related counts for each customer
    await Promise.all(
      customers.map(async (customer) => {
        await customer.load('projects')
        await customer.load('invoices')
      })
    )

    return response.ok(customers.serialize())
  }

  /**
   * Get a single customer with details
   */
  async show({ tenant, params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .preload('projects')
      .preload('invoices')
      .first()

    if (!customer) {
      return response.notFound({ error: 'Customer not found' })
    }

    return response.ok({ data: customer })
  }

  /**
   * Create a new customer
   */
  async store({ tenant, request, response }: HttpContext) {
    const data = await request.validateUsing(createCustomerValidator)

    const customer = await Customer.create({
      tenantId: tenant.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      notes: data.notes,
      isActive: data.isActive !== undefined ? data.isActive : true,
    })

    return response.created({ data: customer })
  }

  /**
   * Update a customer
   */
  async update({ tenant, params, request, response }: HttpContext) {
    const customer = await Customer.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!customer) {
      return response.notFound({ error: 'Customer not found' })
    }

    const data = await request.validateUsing(updateCustomerValidator)

    // Update fields individually
    if (data.name !== undefined) customer.name = data.name
    if (data.email !== undefined) customer.email = data.email
    if (data.phone !== undefined) customer.phone = data.phone
    if (data.company !== undefined) customer.company = data.company
    if (data.addressLine1 !== undefined) customer.addressLine1 = data.addressLine1
    if (data.addressLine2 !== undefined) customer.addressLine2 = data.addressLine2
    if (data.city !== undefined) customer.city = data.city
    if (data.state !== undefined) customer.state = data.state
    if (data.postalCode !== undefined) customer.postalCode = data.postalCode
    if (data.country !== undefined) customer.country = data.country
    if (data.notes !== undefined) customer.notes = data.notes
    if (data.isActive !== undefined) customer.isActive = data.isActive

    await customer.save()

    return response.ok({ data: customer })
  }

  /**
   * Delete a customer (with project validation)
   */
  async destroy({ tenant, params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('tenant_id', tenant.id)
      .where('id', params.id)
      .first()

    if (!customer) {
      return response.notFound({ error: 'Customer not found' })
    }

    // Check if customer has any projects
    const projectCount = await Project.query().where('customer_id', customer.id).count('* as total')

    if (projectCount[0].$extras.total > 0) {
      return response.badRequest({
        error: 'Cannot delete customer with active projects',
        projectCount: projectCount[0].$extras.total,
      })
    }

    // Check if customer has any invoices (optional - you might want to allow this)
    const invoiceCount = await Invoice.query().where('customer_id', customer.id).count('* as total')

    if (invoiceCount[0].$extras.total > 0) {
      return response.badRequest({
        error: 'Cannot delete customer with invoices',
        invoiceCount: invoiceCount[0].$extras.total,
      })
    }

    await customer.delete()
    return response.noContent()
  }

  /**
   * Search customers for autocomplete
   */
  async search({ tenant, request, response }: HttpContext) {
    const query = request.input('q', '')
    const limit = request.input('limit', 10)

    if (!query || query.length < 2) {
      return response.ok({ data: [] })
    }

    const customers = await Customer.query()
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .where((builder) => {
        builder
          .whereILike('name', `%${query}%`)
          .orWhereILike('email', `%${query}%`)
          .orWhereILike('company', `%${query}%`)
      })
      .limit(limit)
      .select('id', 'name', 'email', 'company')

    return response.ok({ data: customers })
  }
}
