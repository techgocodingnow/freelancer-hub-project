import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Project from '#models/project'
import Role from '#models/role'
import TenantUser from '#models/tenant_user'

export default class Tenant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @manyToMany(() => User, {
    pivotTable: 'tenant_users',
    pivotForeignKey: 'tenant_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role_id', 'is_active', 'joined_at'],
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => Project)
  declare projects: HasMany<typeof Project>

  // Helper methods
  async getUsersWithRole(roleName: string): Promise<User[]> {
    const tenantUsers = await TenantUser.query()
      .where('tenant_id', this.id)
      .where('is_active', true)
      .whereHas('role', (roleQuery) => {
        roleQuery.where('name', roleName)
      })
      .preload('user')

    return tenantUsers.map((tu) => tu.user)
  }

  async getAdmins(): Promise<User[]> {
    const tenantUsers = await TenantUser.query()
      .where('tenant_id', this.id)
      .where('is_active', true)
      .whereHas('role', (roleQuery) => {
        roleQuery.whereIn('name', ['admin', 'owner'])
      })
      .preload('user')

    return tenantUsers.map((tu) => tu.user)
  }

  async getOwners(): Promise<User[]> {
    return await this.getUsersWithRole('owner')
  }

  async addUser(userId: number, roleId: number): Promise<TenantUser> {
    return await TenantUser.create({
      userId,
      tenantId: this.id,
      roleId,
      isActive: true,
      joinedAt: DateTime.now(),
    })
  }

  async removeUser(userId: number): Promise<void> {
    await TenantUser.query().where('user_id', userId).where('tenant_id', this.id).delete()
  }

  async deactivateUser(userId: number): Promise<void> {
    await TenantUser.query()
      .where('user_id', userId)
      .where('tenant_id', this.id)
      .update({ isActive: false })
  }

  async activateUser(userId: number): Promise<void> {
    await TenantUser.query()
      .where('user_id', userId)
      .where('tenant_id', this.id)
      .update({ isActive: true })
  }

  async updateUserRole(userId: number, roleId: number): Promise<void> {
    await TenantUser.query().where('user_id', userId).where('tenant_id', this.id).update({ roleId })
  }
}
