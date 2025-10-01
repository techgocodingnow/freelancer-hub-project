import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
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
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('wise_transfer_id')
      table.dropColumn('wise_quote_id')
      table.dropColumn('wise_status')
      table.dropColumn('wise_fee')
      table.dropColumn('wise_rate')
      table.dropColumn('wise_reference')
      table.dropColumn('payroll_batch_id')
      table.dropColumn('time_entry_ids')
      table.dropColumn('currency')
      table.dropColumn('exchange_rate')
      table.dropColumn('fee_amount')
      table.dropColumn('net_amount')
    })
  }
}

