import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_items'

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
        .integer('time_entry_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('time_entries')
        .onDelete('SET NULL')

      // Item details
      table.string('description').notNullable()
      table.decimal('quantity', 10, 2).notNullable()
      table.string('unit').defaultTo('hours').notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('amount', 10, 2).notNullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('invoice_id')
      table.index('time_entry_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
