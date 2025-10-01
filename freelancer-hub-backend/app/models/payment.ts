import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'
import Tenant from '#models/tenant'
import PayrollBatch from '#models/payroll_batch'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare tenantId: number

  @column()
  declare paymentNumber: string

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare exchangeRate: number | null

  @column()
  declare feeAmount: number

  @column()
  declare netAmount: number

  @column.date()
  declare paymentDate: DateTime

  @column()
  declare paymentMethod:
    | 'cash'
    | 'check'
    | 'bank_transfer'
    | 'credit_card'
    | 'paypal'
    | 'stripe'
    | 'wise'
    | 'other'

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'

  @column()
  declare transactionId: string | null

  @column()
  declare notes: string | null

  // Wise Integration
  @column()
  declare wiseTransferId: string | null

  @column()
  declare wiseQuoteId: string | null

  @column()
  declare wiseStatus: string | null

  @column()
  declare wiseFee: number | null

  @column()
  declare wiseRate: number | null

  @column()
  declare wiseReference: string | null

  // Payroll
  @column()
  declare payrollBatchId: number | null

  // Time Entries
  @column({
    prepare: (value: number[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare timeEntryIds: number[] | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => PayrollBatch)
  declare payrollBatch: BelongsTo<typeof PayrollBatch>
}
