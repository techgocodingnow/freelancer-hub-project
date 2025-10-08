import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Invitation details
      table.string('email', 254).notNullable()
      table.string('token', 64).notNullable().unique()

      // Tenant relationship
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      // Role for the invitation
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')

      // Optional project relationship (for project-specific invitations)
      table
        .integer('project_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      // Who sent the invitation
      table
        .integer('invited_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Invitation status
      table
        .enum('status', ['pending', 'accepted', 'expired', 'cancelled'])
        .defaultTo('pending')
        .notNullable()

      // Expiration
      table.timestamp('expires_at').notNullable()

      // When accepted
      table.timestamp('accepted_at').nullable()

      // Accepted by user (if different from invited email)
      table
        .integer('accepted_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('email')
      table.index('token')
      table.index('tenant_id')
      table.index('project_id')
      table.index('status')
      table.index(['tenant_id', 'email', 'status'])
      table.index(['project_id', 'email', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

