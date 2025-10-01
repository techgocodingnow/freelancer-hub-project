import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Task from '#models/task'
import User from '#models/user'

export default class TimeEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare taskId: number

  @column()
  declare userId: number

  @column()
  declare description: string | null

  @column.dateTime()
  declare startTime: DateTime | null

  @column.dateTime()
  declare endTime: DateTime | null

  @column()
  declare durationMinutes: number

  @column()
  declare billable: boolean

  @column.date()
  declare date: DateTime

  @column()
  declare isRunning: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

