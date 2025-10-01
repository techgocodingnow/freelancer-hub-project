import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tenant from '#models/tenant'
import Role from '#models/role'

export default class TenantUser extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tenantId: number

  @column()
  declare roleId: number

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  // Scopes
  static active = scope((query) => {
    query.where('is_active', true)
  })

  static byTenant = scope((query, tenantId: number) => {
    query.where('tenant_id', tenantId)
  })

  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })

  static byRole = scope((query, roleName: string) => {
    query.whereHas('role', (roleQuery) => {
      roleQuery.where('name', roleName)
    })
  })

  // Helper methods
  async hasRole(roleName: string): Promise<boolean> {
    await this.load('role')
    return this.role.name === roleName
  }

  async isAdmin(): Promise<boolean> {
    await this.load('role')
    return this.role.isAdmin()
  }

  async isOwner(): Promise<boolean> {
    await this.load('role')
    return this.role.isOwner()
  }

  async canManageUsers(): Promise<boolean> {
    await this.load('role')
    return this.role.canManageUsers()
  }

  async canManageProjects(): Promise<boolean> {
    await this.load('role')
    return this.role.canManageProjects()
  }

  async hasPermission(resource: string, action: string): Promise<boolean> {
    await this.load('role')
    return this.role.hasPermission(resource, action)
  }
}

