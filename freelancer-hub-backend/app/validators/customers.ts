import vine from '@vinejs/vine'

/**
 * Validator for creating a customer
 */
export const createCustomerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    email: vine.string().trim().email().optional(),
    phone: vine.string().trim().maxLength(50).optional(),
    company: vine.string().trim().maxLength(255).optional(),
    addressLine1: vine.string().trim().maxLength(255).optional(),
    addressLine2: vine.string().trim().maxLength(255).optional(),
    city: vine.string().trim().maxLength(100).optional(),
    state: vine.string().trim().maxLength(100).optional(),
    postalCode: vine.string().trim().maxLength(20).optional(),
    country: vine.string().trim().maxLength(100).optional(),
    notes: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator for updating a customer
 */
export const updateCustomerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    email: vine.string().trim().email().optional(),
    phone: vine.string().trim().maxLength(50).optional(),
    company: vine.string().trim().maxLength(255).optional(),
    addressLine1: vine.string().trim().maxLength(255).optional(),
    addressLine2: vine.string().trim().maxLength(255).optional(),
    city: vine.string().trim().maxLength(100).optional(),
    state: vine.string().trim().maxLength(100).optional(),
    postalCode: vine.string().trim().maxLength(20).optional(),
    country: vine.string().trim().maxLength(100).optional(),
    notes: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)
