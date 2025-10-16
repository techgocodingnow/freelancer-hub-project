import vine from '@vinejs/vine'

/**
 * Validator for creating a manual invoice
 * Supports:
 * - Manual invoices: customerId + items
 * - Single project: projectId (backward compatibility)
 * - Multiple projects: projectIds array
 * - Custom date ranges or predefined durations
 * - Flexible tax and discount options
 * - Invoice metadata (issue date, due date, notes)
 */
export const createInvoiceValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive().optional(),

    // Old format (backward compatibility): single project
    projectId: vine.number().positive().optional(),

    // New format: multiple projects
    projectIds: vine
      .array(
        vine.object({
          projectId: vine.number().positive(),
        })
      )
      .optional(),

    // Date range options
    duration: vine.enum(['1week', '2weeks', '1month', '3months', '6months', '1year']).optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),

    // Tax options (either percentage or fixed amount)
    taxRate: vine.number().min(0).max(100).optional(),
    taxAmount: vine.number().min(0).optional(),

    // Discount options (either percentage or fixed amount)
    discountRate: vine.number().min(0).max(100).optional(),
    discountAmount: vine.number().min(0).optional(),

    // Invoice metadata
    issueDate: vine.date().optional(),
    dueDate: vine.date().optional(),
    notes: vine.string().trim().optional(),

    items: vine
      .array(
        vine.object({
          description: vine.string().trim().minLength(1),
          quantity: vine.number().min(1),
          unitPrice: vine.number().min(0.01),
        })
      )
      .optional(),
  })
)
