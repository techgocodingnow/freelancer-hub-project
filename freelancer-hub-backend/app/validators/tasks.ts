import vine from '@vinejs/vine'

/**
 * Validator for creating a task
 */
export const createTaskValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().optional(),
    status: vine.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: vine.string().optional(),
    estimatedHours: vine.number().positive().optional(),
    assigneeId: vine.number().positive().optional(),
    blockedBy: vine.number().positive().optional(),
    position: vine.number().optional(),
  })
)

/**
 * Validator for updating a task
 */
export const updateTaskValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().optional(),
    status: vine.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: vine.string().optional(),
    estimatedHours: vine.number().positive().optional(),
    assigneeId: vine.number().positive().optional(),
    blockedBy: vine.number().positive().optional(),
    position: vine.number().optional(),
  })
)

/**
 * Validator for updating task status
 */
export const updateTaskStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['todo', 'in_progress', 'review', 'done']),
    position: vine.number().optional(),
  })
)

/**
 * Validator for assigning a task
 */
export const assignTaskValidator = vine.compile(
  vine.object({
    assigneeId: vine.number().positive().nullable(),
  })
)
