import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import User from '#models/user'
import TimeEntry from '#models/time_entry'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare status: 'todo' | 'in_progress' | 'review' | 'done'

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'urgent'

  @column.date()
  declare dueDate: DateTime | null

  @column()
  declare estimatedHours: number | null

  @column()
  declare actualHours: number

  @column()
  declare assigneeId: number | null

  @column()
  declare createdBy: number

  @column()
  declare blockedBy: number | null

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  // Relationships
  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User, {
    foreignKey: 'assigneeId',
  })
  declare assignee: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => Task, {
    foreignKey: 'blockedBy',
  })
  declare blockingTask: BelongsTo<typeof Task>

  @hasMany(() => TimeEntry)
  declare timeEntries: HasMany<typeof TimeEntry>
}

