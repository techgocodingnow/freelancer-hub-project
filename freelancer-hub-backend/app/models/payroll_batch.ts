import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import User from '#models/user'
import Payment from '#models/payment'

export default class PayrollBatch extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare createdBy: number

  @column()
  declare batchNumber: string

  @column.date()
  declare payPeriodStart: DateTime

  @column.date()
  declare payPeriodEnd: DateTime

  @column()
  declare status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  @column()
  declare totalAmount: number

  @column()
  declare currency: string

  @column()
  declare paymentCount: number

  @column.dateTime()
  declare processedAt: DateTime | null

  @column()
  declare notes: string | null

  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Payment)
  declare payments: HasMany<typeof Payment>
}

