import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenant_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

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

      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')

      // Additional fields
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('joined_at').notNullable().defaultTo(this.now())

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Constraints
      table.unique(['user_id', 'tenant_id'], {
        indexName: 'tenant_users_user_tenant_unique',
      })

      // Indexes for performance
      table.index('user_id', 'tenant_users_user_id_index')
      table.index('tenant_id', 'tenant_users_tenant_id_index')
      table.index('role_id', 'tenant_users_role_id_index')
      table.index('is_active', 'tenant_users_is_active_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
