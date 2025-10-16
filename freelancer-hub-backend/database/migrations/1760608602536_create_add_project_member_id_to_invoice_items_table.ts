import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('project_member_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('project_members')
        .onDelete('SET NULL')

      table.index('project_member_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('project_member_id')
    })
  }
}