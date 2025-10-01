import vine from '@vinejs/vine'

/**
 * Validator for updating user role
 */
export const updateUserRoleValidator = vine.compile(
  vine.object({
    role: vine.enum(['admin', 'member']),
  })
)

