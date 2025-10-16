import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

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

      // Notification content
      table
        .enum('type', [
          'project_invitation',
          'task_assigned',
          'task_completed',
          'payment_received',
          'timesheet_approved',
          'timesheet_rejected',
          'project_updated',
          'member_added',
          'member_removed',
          'general',
        ])
        .notNullable()
      table.string('title', 255).notNullable()
      table.text('message').notNullable()

      // Optional action buttons
      table.string('action_url', 500).nullable()
      table.string('action_label', 100).nullable()
      table.string('secondary_action_url', 500).nullable()
      table.string('secondary_action_label', 100).nullable()

      // Metadata
      table.integer('related_id').unsigned().nullable() // ID of related entity (project, task, etc.)
      table.string('related_type', 50).nullable() // Type of related entity

      // Status
      table.boolean('is_read').defaultTo(false).notNullable()
      table.timestamp('read_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes for performance
      table.index(['user_id', 'tenant_id'], 'notifications_user_tenant_index')
      table.index(['user_id', 'is_read'], 'notifications_user_read_index')
      table.index(['tenant_id', 'type'], 'notifications_tenant_type_index')
      table.index('created_at', 'notifications_created_at_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
