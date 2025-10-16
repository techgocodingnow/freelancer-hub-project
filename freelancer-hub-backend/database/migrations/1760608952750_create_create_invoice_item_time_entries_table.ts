import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_item_time_entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('invoice_item_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('invoice_items')
        .onDelete('CASCADE')
      table
        .integer('time_entry_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('time_entries')
        .onDelete('RESTRICT')

      // Metadata
      table.timestamp('created_at').notNullable()

      // Indexes
      table.index('invoice_item_id')
      table.index('time_entry_id')
      table.unique(['invoice_item_id', 'time_entry_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}