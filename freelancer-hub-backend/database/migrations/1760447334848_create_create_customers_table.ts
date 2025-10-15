import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Tenant relationship
      table
        .integer('tenant_id')
        .unsigned()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
        .notNullable()

      // Basic information
      table.string('name').notNullable()
      table.string('email').nullable()
      table.string('phone').nullable()
      table.string('company').nullable()

      // Address information
      table.string('address_line1').nullable()
      table.string('address_line2').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('postal_code').nullable()
      table.string('country').nullable()

      // Additional info
      table.text('notes').nullable()
      table.boolean('is_active').defaultTo(true).notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes
      table.index(['tenant_id'])
      table.index(['tenant_id', 'email'])
      table.index(['tenant_id', 'name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}