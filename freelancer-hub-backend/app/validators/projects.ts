import vine from '@vinejs/vine'

/**
 * Validator for creating a project
 */
export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().optional(),
    status: vine.enum(['active', 'archived', 'completed']).optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
    budget: vine.number().positive().optional(),
  })
)

/**
 * Validator for updating a project
 */
export const updateProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().optional(),
    status: vine.enum(['active', 'archived', 'completed']).optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
    budget: vine.number().positive().optional(),
  })
)

/**
 * Validator for adding a project member
 */
export const addProjectMemberValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    role: vine.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  })
)
