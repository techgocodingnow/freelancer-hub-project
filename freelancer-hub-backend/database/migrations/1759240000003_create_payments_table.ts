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

      // Wise Integration
      table.string('wise_transfer_id').nullable().after('notes')
      table.string('wise_quote_id').nullable().after('wise_transfer_id')
      table.string('wise_status').nullable().after('wise_quote_id')
      table.decimal('wise_fee', 10, 2).nullable().after('wise_status')
      table.decimal('wise_rate', 10, 6).nullable().after('wise_fee')
      table.string('wise_reference').nullable().after('wise_rate')

      // Payroll
      table
        .integer('payroll_batch_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('payroll_batches')
        .onDelete('SET NULL')
        .after('wise_reference')

      // Time Entries (JSON array of IDs)
      table.json('time_entry_ids').nullable().after('payroll_batch_id')

      // Additional fields
      table.string('currency', 3).defaultTo('USD').notNullable().after('amount')
      table.decimal('exchange_rate', 10, 6).nullable().after('currency')
      table.decimal('fee_amount', 10, 2).defaultTo(0).notNullable().after('exchange_rate')
      table.decimal('net_amount', 10, 2).notNullable().after('fee_amount')

      // Indexes
      table.index('payroll_batch_id')
      table.index('wise_transfer_id')

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
