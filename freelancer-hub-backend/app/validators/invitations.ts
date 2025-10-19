import vine from '@vinejs/vine'

/**
 * Validator for creating an invitation
 *
 * Validates invitation data including:
 * - Email (required, must be valid email format)
 * - Role ID (required, must be a positive number)
 * - Project ID (optional, must be a positive number if provided)
 */
export const createInvitationValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    roleId: vine.number().positive(),
    projectId: vine.number().positive().optional(),
  })
)

/**
 * Validator for resending an invitation
 *
 * No body validation needed - invitation ID comes from route params
 */
export const resendInvitationValidator = vine.compile(vine.object({}))

/**
 * Validator for canceling an invitation
 *
 * No body validation needed - invitation ID comes from route params
 */
export const cancelInvitationValidator = vine.compile(vine.object({}))
