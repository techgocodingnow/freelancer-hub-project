import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import Project from '#models/project'
import Invoice from '#models/invoice'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column()
  declare name: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare company: string | null

  @column({ columnName: 'address_line1' })
  declare addressLine1: string | null

  @column({ columnName: 'address_line2' })
  declare addressLine2: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string | null

  @column()
  declare country: string | null

  @column()
  declare notes: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => Project)
  declare projects: HasMany<typeof Project>

  @hasMany(() => Invoice)
  declare invoices: HasMany<typeof Invoice>
}