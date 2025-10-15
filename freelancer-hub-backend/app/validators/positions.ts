import vine from '@vinejs/vine'

/**
 * Validator for creating a position
 */
export const createPositionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().optional(),
  })
)

/**
 * Validator for updating a position
 */
export const updatePositionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)
