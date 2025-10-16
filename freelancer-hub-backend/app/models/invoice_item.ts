import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'
import TimeEntry from '#models/time_entry'
import ProjectMember from '#models/project_member'

export default class InvoiceItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceId: number

  @column()
  declare timeEntryId: number | null

  @column()
  declare projectMemberId: number | null

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

  @belongsTo(() => ProjectMember)
  declare projectMember: BelongsTo<typeof ProjectMember>

  @manyToMany(() => TimeEntry, {
    pivotTable: 'invoice_item_time_entries',
    localKey: 'id',
    pivotForeignKey: 'invoice_item_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'time_entry_id',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  })
  declare timeEntries: ManyToMany<typeof TimeEntry>
}

