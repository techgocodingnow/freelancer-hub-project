import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('invoice_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')

      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('RESTRICT')

      table.decimal('hourly_rate', 10, 2).nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Unique constraint: same project can't be added twice to same invoice
      table.unique(['invoice_id', 'project_id'])

      // Indexes for performance
      table.index('invoice_id')
      table.index('project_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}