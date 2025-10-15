import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop old position string column
      table.dropColumn('position')

      // Add new position_id foreign key
      table
        .integer('position_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('positions')
        .onDelete('SET NULL')

      // Add index
      table.index('position_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Remove position_id
      table.dropColumn('position_id')

      // Restore old position string column
      table.string('position', 255).nullable()
    })
  }
}