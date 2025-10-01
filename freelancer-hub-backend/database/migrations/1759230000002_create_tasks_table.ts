import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Project relationship
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      // Task fields
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table
        .enum('status', ['todo', 'in_progress', 'review', 'done'])
        .defaultTo('todo')
        .notNullable()
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium').notNullable()
      table.date('due_date').nullable()
      table.decimal('estimated_hours', 8, 2).nullable()
      table.decimal('actual_hours', 8, 2).defaultTo(0).notNullable()

      // User relationships
      table
        .integer('assignee_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table
        .integer('created_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Task dependencies (optional)
      table
        .integer('blocked_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('tasks')
        .onDelete('SET NULL')

      // Display order for Kanban
      table.integer('position').defaultTo(0).notNullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('completed_at').nullable()

      // Indexes
      table.index('project_id')
      table.index(['project_id', 'status'])
      table.index(['project_id', 'assignee_id'])
      table.index(['project_id', 'priority'])
      table.index(['project_id', 'due_date'])
      table.index('assignee_id')
      table.index('created_by')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
