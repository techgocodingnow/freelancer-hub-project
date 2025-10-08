import vine from '@vinejs/vine'

/**
 * Validator for user registration
 *
 * Validates user registration data including:
 * - Email (required, must be valid email format)
 * - Password (required, minimum 8 characters)
 * - Full name (required, trimmed, minimum 1 character)
 * - Invitation token (optional, for invitation-based registration)
 * - Tenant ID (optional, for joining existing tenant)
 * - Tenant name (optional, for creating new tenant)
 * - Tenant slug (optional, for creating new tenant)
 */
export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8),
    fullName: vine.string().trim().minLength(1),
    invitationToken: vine.string().trim().optional(),
    tenantId: vine.number().optional(),
    tenantName: vine.string().trim().optional(),
    tenantSlug: vine.string().trim().optional(),
  })
)

/**
 * Validator for user login
 *
 * Validates user login credentials:
 * - Email (required, must be valid email format)
 * - Password (required)
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)
