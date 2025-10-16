import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'time_entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Task relationship
      table
        .integer('task_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tasks')
        .onDelete('CASCADE')

      // User relationship
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

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

      // Time entry fields
      table.text('description').nullable()
      table.timestamp('start_time').nullable()
      table.timestamp('end_time').nullable()
      table.integer('duration_minutes').notNullable()
      table.boolean('billable').defaultTo(true).notNullable()
      table.date('date').notNullable()

      // Timer state (for active timers)
      table.boolean('is_running').defaultTo(false).notNullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('task_id')
      table.index('user_id')
      table.index(['user_id', 'date'])
      table.index(['task_id', 'date'])
      table.index(['user_id', 'is_running']) // For finding active timers
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
