import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Timesheet from '#models/timesheet'
import User from '#models/user'

export default class TimesheetApproval extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare timesheetId: number

  @column()
  declare approverId: number

  @column()
  declare action: 'approved' | 'rejected' | 'reopened'

  @column()
  declare reason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relationships
  @belongsTo(() => Timesheet)
  declare timesheet: BelongsTo<typeof Timesheet>

  @belongsTo(() => User, {
    foreignKey: 'approverId',
  })
  declare approver: BelongsTo<typeof User>
}

