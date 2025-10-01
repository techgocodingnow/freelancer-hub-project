import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare permissions: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @manyToMany(() => User, {
    pivotTable: 'tenant_users',
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  // Helper methods
  isAdmin(): boolean {
    return this.name === 'admin' || this.name === 'owner'
  }

  isOwner(): boolean {
    return this.name === 'owner'
  }

  isMember(): boolean {
    return this.name === 'member'
  }

  isViewer(): boolean {
    return this.name === 'viewer'
  }

  canManageUsers(): boolean {
    return this.name === 'admin' || this.name === 'owner'
  }

  canManageProjects(): boolean {
    return this.name === 'admin' || this.name === 'owner'
  }

  hasPermission(resource: string, action: string): boolean {
    if (!this.permissions) return false

    // Owner has all permissions
    if (this.permissions.all === true) return true

    const resourcePermissions = this.permissions[resource]
    if (!resourcePermissions) return false

    return Array.isArray(resourcePermissions) && resourcePermissions.includes(action)
  }
}

