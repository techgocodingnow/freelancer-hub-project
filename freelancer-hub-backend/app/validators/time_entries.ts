import vine from '@vinejs/vine'

/**
 * Validator for creating a time entry
 */
export const createTimeEntryValidator = vine.compile(
  vine.object({
    description: vine.string().trim().optional(),
    startTime: vine.string().optional(),
    endTime: vine.string().optional(),
    durationMinutes: vine.number().positive(),
    billable: vine.boolean().optional(),
    date: vine.string(),
  })
)

/**
 * Validator for updating a time entry
 */
export const updateTimeEntryValidator = vine.compile(
  vine.object({
    description: vine.string().trim().optional(),
    startTime: vine.string().optional(),
    endTime: vine.string().optional(),
    durationMinutes: vine.number().positive().optional(),
    billable: vine.boolean().optional(),
    date: vine.string().optional(),
  })
)

/**
 * Validator for starting a timer
 */
export const startTimerValidator = vine.compile(
  vine.object({
    description: vine.string().trim().optional(),
  })
)
