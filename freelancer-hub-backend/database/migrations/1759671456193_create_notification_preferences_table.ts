import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_preferences'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys
      table.integer('user_id').unsigned().notNullable()
      table.integer('tenant_id').unsigned().notNullable()

      // Notification type (matches NotificationType enum)
      table
        .enum('notification_type', [
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

      // Preference settings
      table.boolean('in_app_enabled').defaultTo(true).notNullable()
      table.boolean('email_enabled').defaultTo(false).notNullable()
      table.boolean('is_muted').defaultTo(false).notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign key constraints
      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.foreign('tenant_id').references('tenants.id').onDelete('CASCADE')

      // Indexes
      table.index(['user_id', 'tenant_id'], 'user_tenant_idx')
      table.index(['user_id', 'notification_type'], 'user_type_idx')

      // Unique constraint: one preference per user per tenant per type
      table.unique(['user_id', 'tenant_id', 'notification_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
