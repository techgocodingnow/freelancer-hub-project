import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 50).notNullable().unique()
      table.string('description', 255).nullable()
      table.json('permissions').nullable() // For future extensibility
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Seed default roles
    this.defer(async (db) => {
      await db.table('roles').multiInsert([
        {
          name: 'owner',
          description: 'Full access to tenant, can manage all users and settings',
          permissions: JSON.stringify({ all: true }),
          created_at: new Date(),
        },
        {
          name: 'admin',
          description: 'Can manage users, projects, and most tenant settings',
          permissions: JSON.stringify({
            users: ['read', 'create', 'update', 'delete'],
            projects: ['read', 'create', 'update', 'delete'],
            tasks: ['read', 'create', 'update', 'delete'],
          }),
          created_at: new Date(),
        },
        {
          name: 'member',
          description: 'Standard user with access to assigned projects and tasks',
          permissions: JSON.stringify({
            projects: ['read'],
            tasks: ['read', 'create', 'update'],
          }),
          created_at: new Date(),
        },
        {
          name: 'viewer',
          description: 'Read-only access to tenant resources',
          permissions: JSON.stringify({
            projects: ['read'],
            tasks: ['read'],
          }),
          created_at: new Date(),
        },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

