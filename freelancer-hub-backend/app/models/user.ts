import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Tenant from '#models/tenant'
import Role from '#models/role'
import TenantUser from '#models/tenant_user'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare hourlyRate: number | null

  @column({ serializeAs: null })
  declare password: string

  // Wise account fields
  @column()
  declare wiseRecipientId: number | null

  @column()
  declare wiseAccountHolderName: string | null

  @column()
  declare wiseCurrency: string | null

  @column()
  declare wiseAccountType: string | null

  @column()
  declare wiseCountry: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare wiseAccountDetails: any | null

  @column()
  declare wiseVerified: boolean

  @column.dateTime()
  declare wiseConnectedAt: DateTime | null

  @column.dateTime()
  declare wiseUpdatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @manyToMany(() => Tenant, {
    pivotTable: 'tenant_users',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'tenant_id',
    pivotColumns: ['role_id', 'is_active', 'joined_at'],
  })
  declare tenants: ManyToMany<typeof Tenant>

  @manyToMany(() => Role, {
    pivotTable: 'tenant_users',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  // Helper methods for multi-tenant operations
  async getTenants(): Promise<Tenant[]> {
    const tenantUsers = await TenantUser.query().where('user_id', this.id).preload('tenant')

    return tenantUsers.map((tu) => tu.tenant)
  }

  async getActiveTenants(): Promise<Tenant[]> {
    const tenantUsers = await TenantUser.query()
      .where('user_id', this.id)
      .where('is_active', true)
      .preload('tenant')

    return tenantUsers.map((tu) => tu.tenant)
  }

  async getRoleInTenant(tenantId: number): Promise<Role | null> {
    const tenantUser = await TenantUser.query()
      .where('user_id', this.id)
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .preload('role')
      .first()

    return tenantUser?.role || null
  }

  async hasRoleInTenant(tenantId: number, roleName: string): Promise<boolean> {
    const role = await this.getRoleInTenant(tenantId)
    return role?.name === roleName
  }

  async isAdminInTenant(tenantId: number): Promise<boolean> {
    const role = await this.getRoleInTenant(tenantId)
    return role?.isAdmin() || false
  }

  async isOwnerInTenant(tenantId: number): Promise<boolean> {
    const role = await this.getRoleInTenant(tenantId)
    return role?.isOwner() || false
  }

  async canManageUsersInTenant(tenantId: number): Promise<boolean> {
    const role = await this.getRoleInTenant(tenantId)
    return role?.canManageUsers() || false
  }

  async getTenantUser(tenantId: number): Promise<TenantUser | null> {
    return await TenantUser.query()
      .where('user_id', this.id)
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .first()
  }

  // Wise account helper methods
  hasWiseAccount(): boolean {
    return !!this.wiseRecipientId && !!this.wiseAccountHolderName
  }

  getWiseAccountInfo() {
    if (!this.hasWiseAccount()) {
      return null
    }

    return {
      recipientId: this.wiseRecipientId,
      accountHolderName: this.wiseAccountHolderName,
      currency: this.wiseCurrency,
      accountType: this.wiseAccountType,
      country: this.wiseCountry,
      verified: this.wiseVerified,
      connectedAt: this.wiseConnectedAt,
    }
  }
}
