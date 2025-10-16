import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 255).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.text('description').nullable()
      table.boolean('is_active').defaultTo(true).notNullable()

      table.string('company_name', 255).nullable()
      table.text('company_address').nullable()
      table.string('company_email', 255).nullable()
      table.string('company_phone', 50).nullable()
      table.string('tax_id', 100).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
