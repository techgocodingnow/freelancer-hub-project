import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('company_name', 255).nullable()
      table.text('company_address').nullable()
      table.string('company_email', 255).nullable()
      table.string('company_phone', 50).nullable()
      table.string('tax_id', 100).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('company_name')
      table.dropColumn('company_address')
      table.dropColumn('company_email')
      table.dropColumn('company_phone')
      table.dropColumn('tax_id')
    })
  }
}