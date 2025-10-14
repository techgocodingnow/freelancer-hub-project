import vine from '@vinejs/vine'

/**
 * Validator for creating a manual invoice
 * Supports both manual invoices (customerId + items) and project-based invoices (projectId + hourlyRate)
 */
export const createInvoiceValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive().optional(),
    projectId: vine.number().positive().optional(),
    duration: vine.enum(['1week', '2weeks', '1month']),
    hourlyRate: vine.number().min(0.01).optional(),
    toEmail: vine.string().email().optional(),
    items: vine
      .array(
        vine.object({
          description: vine.string().trim().minLength(1),
          quantity: vine.number().min(1),
          unitPrice: vine.number().min(0.01),
        })
      )
      .minLength(1),
  })
)
