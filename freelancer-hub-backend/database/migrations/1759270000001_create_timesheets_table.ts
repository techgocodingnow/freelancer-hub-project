import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'timesheets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      // Week period
      table.date('week_start_date').notNullable()
      table.date('week_end_date').notNullable()

      // Status
      table
        .enum('status', ['draft', 'submitted', 'pending_approval', 'approved', 'rejected'])
        .defaultTo('draft')
        .notNullable()

      // Hours tracking
      table.decimal('total_hours', 10, 2).defaultTo(0).notNullable()
      table.decimal('billable_hours', 10, 2).defaultTo(0).notNullable()
      table.decimal('regular_hours', 10, 2).defaultTo(0).notNullable()
      table.decimal('overtime_hours', 10, 2).defaultTo(0).notNullable()

      // Approval tracking
      table.timestamp('submitted_at').nullable()
      table.timestamp('approved_at').nullable()
      table.timestamp('rejected_at').nullable()

      table
        .integer('approver_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.text('rejection_reason').nullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('user_id')
      table.index('tenant_id')
      table.index('status')
      table.index('week_start_date')
      table.index(['user_id', 'week_start_date'])
      table.index(['tenant_id', 'status'])
      table.index(['tenant_id', 'week_start_date'])

      // Unique constraint: one timesheet per user per week
      table.unique(['user_id', 'week_start_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

