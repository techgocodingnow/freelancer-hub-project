import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
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
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('wise_recipient_id')
      table.dropColumn('wise_account_holder_name')
      table.dropColumn('wise_currency')
      table.dropColumn('wise_account_type')
      table.dropColumn('wise_country')
      table.dropColumn('wise_account_details')
      table.dropColumn('wise_verified')
      table.dropColumn('wise_connected_at')
      table.dropColumn('wise_updated_at')
    })
  }
}

