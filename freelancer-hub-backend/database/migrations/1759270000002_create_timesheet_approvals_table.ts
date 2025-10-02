import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'timesheet_approvals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('timesheet_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('timesheets')
        .onDelete('CASCADE')

      table
        .integer('approver_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Action details
      table.enum('action', ['approved', 'rejected', 'reopened']).notNullable()
      table.text('reason').nullable()

      // Metadata
      table.timestamp('created_at').notNullable()

      // Indexes
      table.index('timesheet_id')
      table.index('approver_id')
      table.index(['timesheet_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

