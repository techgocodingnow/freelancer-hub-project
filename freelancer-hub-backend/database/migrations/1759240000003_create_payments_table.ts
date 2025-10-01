import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('invoice_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      // Payment details
      table.string('payment_number').notNullable().unique()
      table.decimal('amount', 10, 2).notNullable()
      table.date('payment_date').notNullable()
      table
        .enum('payment_method', [
          'cash',
          'check',
          'bank_transfer',
          'credit_card',
          'paypal',
          'stripe',
          'other',
        ])
        .notNullable()
      table
        .enum('status', ['pending', 'completed', 'failed', 'refunded'])
        .defaultTo('completed')
        .notNullable()

      // Additional info
      table.string('transaction_id').nullable()
      table.text('notes').nullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('invoice_id')
      table.index('tenant_id')
      table.index('payment_date')
      table.index('status')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
