import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import ProjectMember from '#models/project_member'

export default class Position extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => ProjectMember)
  declare projectMembers: HasMany<typeof ProjectMember>

  // Scopes
  static activeOnly(query: any) {
    return query.where('is_active', true)
  }

  // Helper methods
  async deactivate() {
    this.isActive = false
    await this.save()
  }

  async activate() {
    this.isActive = true
    await this.save()
  }
}
