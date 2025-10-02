import type { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'
import Invoice from '#models/invoice'
import { DateTime } from 'luxon'

export default class PaymentsController {
  /**
   * List all payments for a tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const query = Payment.query()
      .where('tenant_id', tenant.id)
      .preload('invoice', (invoiceQuery) => {
        invoiceQuery.preload('user').preload('project')
      })

    // Filters
    const status = request.input('status')
    const paymentMethod = request.input('payment_method')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    if (status) {
      query.where('status', status)
    }
    if (paymentMethod) {
      query.where('payment_method', paymentMethod)
    }
    if (startDate) {
      query.where('payment_date', '>=', startDate)
    }
    if (endDate) {
      query.where('payment_date', '<=', endDate)
    }

    // Sorting
    const sort = request.input('_sort', 'payment_date')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    const payments = await query.paginate(page, perPage)

    return response.ok(payments.serialize())
  }

  /**
   * Create a payment
   */
  async store({ tenant, request, response }: HttpContext) {
    const { invoiceId, amount, paymentDate, paymentMethod, transactionId, notes } = request.only([
      'invoiceId',
      'amount',
      'paymentDate',
      'paymentMethod',
      'transactionId',
      'notes',
    ])

    // Verify invoice belongs to tenant
    const invoice = await Invoice.query()
      .where('id', invoiceId)
      .where('tenant_id', tenant.id)
      .first()

    if (!invoice) {
      return response.notFound({ error: 'Invoice not found' })
    }

    // Generate payment number
    const paymentCount = await Payment.query().where('tenant_id', tenant.id).count('* as total')
    const paymentNumber = `PAY-${String(Number(paymentCount[0].$extras.total) + 1).padStart(5, '0')}`

    // Create payment
    const payment = await Payment.create({
      invoiceId,
      tenantId: tenant.id,
      paymentNumber,
      amount,
      paymentDate: DateTime.fromISO(paymentDate),
      paymentMethod,
      status: 'completed',
      transactionId,
      notes,
    })

    // Update invoice amount paid
    invoice.amountPaid += amount

    // Update invoice status if fully paid
    if (invoice.amountPaid >= invoice.totalAmount) {
      invoice.status = 'paid'
      invoice.paidDate = DateTime.fromISO(paymentDate)
    }

    await invoice.save()

    // Load relationships
    await payment.load('invoice', (query) => {
      query.preload('user').preload('project')
    })

    return response.created({ data: payment })
  }

  /**
   * Get a single payment
   */
  async show({ tenant, params, response }: HttpContext) {
    const payment = await Payment.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('invoice', (query) => {
        query.preload('user').preload('project')
      })
      .first()

    if (!payment) {
      return response.notFound({ error: 'Payment not found' })
    }

    return response.ok(payment)
  }

  /**
   * Delete payment
   */
  async destroy({ tenant, params, response }: HttpContext) {
    const payment = await Payment.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('invoice')
      .first()

    if (!payment) {
      return response.notFound({ error: 'Payment not found' })
    }

    // Update invoice amount paid
    const invoice = payment.invoice
    invoice.amountPaid -= payment.amount

    // Update invoice status
    if (invoice.status === 'paid') {
      invoice.status = 'sent'
      invoice.paidDate = null
    }

    await invoice.save()
    await payment.delete()

    return response.noContent()
  }
}
