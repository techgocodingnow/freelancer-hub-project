import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tenant from '#models/tenant'
import Role from '#models/role'
import Project from '#models/project'
import crypto from 'node:crypto'

export default class Invitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare token: string

  @column()
  declare tenantId: number

  @column()
  declare roleId: number

  @column()
  declare projectId: number | null

  @column()
  declare invitedBy: number

  @column()
  declare status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'rejected'

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @column()
  declare acceptedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User, {
    foreignKey: 'invitedBy',
  })
  declare inviter: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'acceptedBy',
  })
  declare acceptor: BelongsTo<typeof User>

  // Scopes
  static pending = scope((query) => {
    query.where('status', 'pending').where('expires_at', '>', DateTime.now().toSQL())
  })

  static expired = scope((query) => {
    query.where('status', 'pending').where('expires_at', '<=', DateTime.now().toSQL())
  })

  static byTenant = scope((query, tenantId: number) => {
    query.where('tenant_id', tenantId)
  })

  static byProject = scope((query, projectId: number) => {
    query.where('project_id', projectId)
  })

  static byEmail = scope((query, email: string) => {
    query.where('email', email)
  })

  // Static methods
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static async createInvitation(data: {
    email: string
    tenantId: number
    roleId: number
    invitedBy: number
    projectId?: number
    expiresInDays?: number
  }): Promise<Invitation> {
    const token = this.generateToken()
    const expiresAt = DateTime.now().plus({ days: data.expiresInDays || 7 })

    return await this.create({
      email: data.email.toLowerCase(),
      token,
      tenantId: data.tenantId,
      roleId: data.roleId,
      invitedBy: data.invitedBy,
      projectId: data.projectId || null,
      status: 'pending',
      expiresAt,
    })
  }

  // Instance methods
  isExpired(): boolean {
    return this.expiresAt <= DateTime.now()
  }

  isPending(): boolean {
    return this.status === 'pending' && !this.isExpired()
  }

  canBeAccepted(): boolean {
    return this.isPending()
  }

  async accept(userId: number, options?: { client?: any }): Promise<void> {
    if (!this.canBeAccepted()) {
      throw new Error('Invitation cannot be accepted')
    }

    this.status = 'accepted'
    this.acceptedAt = DateTime.now()
    this.acceptedBy = userId

    if (options?.client) {
      this.useTransaction(options.client)
    }

    await this.save()
  }

  async cancel(options?: { client?: any }): Promise<void> {
    if (this.status !== 'pending') {
      throw new Error('Only pending invitations can be cancelled')
    }

    this.status = 'cancelled'

    if (options?.client) {
      this.useTransaction(options.client)
    }

    await this.save()
  }

  async markAsExpired(options?: { client?: any }): Promise<void> {
    if (this.status === 'pending' && this.isExpired()) {
      this.status = 'expired'

      if (options?.client) {
        this.useTransaction(options.client)
      }

      await this.save()
    }
  }

  async reject(userId: number, options?: { client?: any }): Promise<void> {
    if (this.status !== 'pending') {
      throw new Error('Only pending invitations can be rejected')
    }

    this.status = 'rejected'
    this.acceptedBy = userId
    this.acceptedAt = DateTime.now()

    if (options?.client) {
      this.useTransaction(options.client)
    }

    await this.save()
  }

  getRegistrationUrl(baseUrl: string): string {
    return `${baseUrl}/register/invitation/${this.token}`
  }
}
