import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'time_entries'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Link time entries to timesheets
      table
        .integer('timesheet_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('timesheets')
        .onDelete('SET NULL')
        .after('user_id')

      // Additional fields for timesheet functionality
      table.text('notes').nullable().after('billable')

      // Index for timesheet relationship
      table.index('timesheet_id')
      table.index(['timesheet_id', 'date'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('timesheet_id')
      table.dropColumn('notes')
    })
  }
}

