import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import Task from '#models/task'
import User from '#models/user'
import ProjectMember from '#models/project_member'
import Customer from '#models/customer'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare customerId: number | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare status: 'active' | 'archived' | 'completed'

  @column.date()
  declare startDate: DateTime | null

  @column.date()
  declare endDate: DateTime | null

  @column()
  declare budget: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  @hasMany(() => ProjectMember)
  declare projectMembers: HasMany<typeof ProjectMember>

  @manyToMany(() => User, {
    pivotTable: 'project_members',
    pivotForeignKey: 'project_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role', 'position_id', 'joined_at', 'hourly_rate'],
  })
  declare members: ManyToMany<typeof User>
}

