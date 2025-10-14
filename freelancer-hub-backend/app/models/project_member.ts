import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import User from '#models/user'

export default class ProjectMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare userId: number

  @column()
  declare role: 'owner' | 'admin' | 'member' | 'viewer'

  @column()
  declare hourlyRate: number | null

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

