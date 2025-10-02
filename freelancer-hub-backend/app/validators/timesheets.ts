import vine from '@vinejs/vine'

/**
 * Validator for creating a timesheet
 */
export const createTimesheetValidator = vine.compile(
  vine.object({
    weekStartDate: vine.string(),
    weekEndDate: vine.string(),
  })
)

/**
 * Validator for submitting a timesheet
 */
export const submitTimesheetValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
  })
)

/**
 * Validator for approving a timesheet
 */
export const approveTimesheetValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
  })
)

/**
 * Validator for rejecting a timesheet
 */
export const rejectTimesheetValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(10).maxLength(500),
  })
)

/**
 * Validator for updating timesheet time entries
 */
export const updateTimesheetValidator = vine.compile(
  vine.object({
    timeEntries: vine.array(
      vine.object({
        id: vine.number().optional(),
        date: vine.string(),
        startTime: vine.string().optional(),
        endTime: vine.string().optional(),
        durationMinutes: vine.number().positive(),
        taskId: vine.number(),
        billable: vine.boolean().optional(),
        notes: vine.string().trim().optional(),
      })
    ),
  })
)

