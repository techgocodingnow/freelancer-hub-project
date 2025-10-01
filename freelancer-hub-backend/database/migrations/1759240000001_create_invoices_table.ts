import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('project_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('projects')
        .onDelete('SET NULL')

      // Invoice details
      table.string('invoice_number').notNullable().unique()
      table
        .enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
        .defaultTo('draft')
        .notNullable()
      table.date('issue_date').notNullable()
      table.date('due_date').notNullable()
      table.date('paid_date').nullable()

      // Amounts
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('tax_rate', 5, 2).defaultTo(0).notNullable()
      table.decimal('tax_amount', 10, 2).defaultTo(0).notNullable()
      table.decimal('discount_amount', 10, 2).defaultTo(0).notNullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.decimal('amount_paid', 10, 2).defaultTo(0).notNullable()

      // Additional info
      table.text('notes').nullable()
      table.string('currency', 3).defaultTo('USD').notNullable()
      table.string('payment_method').nullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('tenant_id')
      table.index('user_id')
      table.index('project_id')
      table.index('status')
      table.index('issue_date')
      table.index('due_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
