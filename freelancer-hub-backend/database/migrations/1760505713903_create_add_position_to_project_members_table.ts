import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('position', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('position')
    })
  }
}