import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('hourly_rate', 10, 2).nullable().after('role')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('hourly_rate')
    })
  }
}
