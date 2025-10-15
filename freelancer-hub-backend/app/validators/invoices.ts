import vine from '@vinejs/vine'

/**
 * Validator for creating a manual invoice
 * Supports:
 * - Manual invoices: customerId + items
 * - Single project: projectId + hourlyRate (backward compatibility)
 * - Multiple projects: projectIds array with individual rates
 */
export const createInvoiceValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive().optional(),

    // Old format (backward compatibility): single project
    projectId: vine.number().positive().optional(),
    hourlyRate: vine.number().min(0.01).optional(),

    // New format: multiple projects with individual rates
    projectIds: vine
      .array(
        vine.object({
          projectId: vine.number().positive(),
          hourlyRate: vine.number().min(0.01),
        })
      )
      .optional(),

    duration: vine.enum(['1week', '2weeks', '1month']),
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
