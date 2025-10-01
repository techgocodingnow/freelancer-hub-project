import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'
import TimeEntry from '#models/time_entry'

export default class InvoiceItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare timeEntryId: number | null

  @column()
  declare description: string

  @column()
  declare quantity: number

  @column()
  declare unit: string

  @column()
  declare unitPrice: number

  @column()
  declare amount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => TimeEntry)
  declare timeEntry: BelongsTo<typeof TimeEntry>
}

