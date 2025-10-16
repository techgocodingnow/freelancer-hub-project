import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice'
import Project from '#models/project'

export default class InvoiceProject extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'invoice_id' })
  declare invoiceId: number

  @column({ columnName: 'project_id' })
  declare projectId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>
}
