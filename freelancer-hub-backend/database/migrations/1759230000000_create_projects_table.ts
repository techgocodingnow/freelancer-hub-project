import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Tenant relationship
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      // Project fields
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.enum('status', ['active', 'archived', 'completed']).defaultTo('active').notNullable()
      table.date('start_date').nullable()
      table.date('end_date').nullable()
      table.decimal('budget', 12, 2).nullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('tenant_id')
      table.index(['tenant_id', 'status'])
      table.index(['tenant_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
