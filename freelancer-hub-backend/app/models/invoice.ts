import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import User from '#models/user'
import Project from '#models/project'
import InvoiceItem from '#models/invoice_item'
import Payment from '#models/payment'
import Customer from '#models/customer'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare userId: number

  @column()
  declare projectId: number | null

  @column()
  declare customerId: number | null

  @column()
  declare invoiceNumber: string

  @column()
  declare status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

  @column.date()
  declare issueDate: DateTime

  @column.date()
  declare dueDate: DateTime

  @column.date()
  declare paidDate: DateTime | null

  @column()
  declare subtotal: number

  @column()
  declare taxRate: number

  @column()
  declare taxAmount: number

  @column()
  declare discountAmount: number

  @column()
  declare totalAmount: number

  @column()
  declare amountPaid: number

  @column()
  declare notes: string | null

  @column()
  declare currency: string

  @column()
  declare paymentMethod: string | null

  // Email Tracking
  @column.dateTime()
  declare sentAt: DateTime | null

  @column()
  declare sentTo: string | null

  @column()
  declare emailCount: number

  @column.dateTime()
  declare lastEmailSentAt: DateTime | null

  // Terms
  @column()
  declare paymentTerms: string | null

  // Client Info
  @column()
  declare clientName: string | null

  @column()
  declare clientEmail: string | null

  @column()
  declare clientAddress: string | null

  // PDF Storage
  @column()
  declare pdfKey: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @manyToMany(() => Project, {
    pivotTable: 'invoice_projects',
    pivotForeignKey: 'invoice_id',
    pivotRelatedForeignKey: 'project_id',
  })
  declare projects: ManyToMany<typeof Project>

  @hasMany(() => InvoiceItem)
  declare items: HasMany<typeof InvoiceItem>

  @hasMany(() => Payment)
  declare payments: HasMany<typeof Payment>
}
