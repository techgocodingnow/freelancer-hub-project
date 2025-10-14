import vine from '@vinejs/vine'

/**
 * Validator for creating a manual invoice
 */
export const createInvoiceValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive(),
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
