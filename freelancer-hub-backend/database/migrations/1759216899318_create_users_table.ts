import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.decimal('hourly_rate', 10, 2).nullable().after('email')
      // Wise recipient account ID from Wise API
      table.integer('wise_recipient_id').unsigned().nullable()

      // Account holder name
      table.string('wise_account_holder_name').nullable()

      // Preferred currency for Wise transfers
      table.string('wise_currency', 3).nullable()

      // Account type (bank_account, email, etc.)
      table.string('wise_account_type').nullable()

      // Country code for the account
      table.string('wise_country', 2).nullable()

      // Account details (IBAN, account number, routing number, etc.)
      // Stored as JSON for flexibility across different account types
      table.json('wise_account_details').nullable()

      // Verification status
      table.boolean('wise_verified').defaultTo(false).notNullable()

      // Timestamps for tracking
      table.timestamp('wise_connected_at').nullable()
      table.timestamp('wise_updated_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
