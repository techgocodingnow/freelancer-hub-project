import vine from '@vinejs/vine'

/**
 * Validator for updating tenant payment info
 */
export const updateTenantPaymentInfoValidator = vine.compile(
  vine.object({
    companyName: vine.string().trim().maxLength(255).optional(),
    companyAddress: vine.string().trim().optional(),
    companyEmail: vine.string().trim().email().maxLength(255).optional(),
    companyPhone: vine.string().trim().maxLength(50).optional(),
    taxId: vine.string().trim().maxLength(100).optional(),
  })
)
