import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Email Tracking
      table.timestamp('sent_at').nullable().after('notes')
      table.string('sent_to').nullable().after('sent_at')
      table.integer('email_count').defaultTo(0).notNullable().after('sent_to')
      table.timestamp('last_email_sent_at').nullable().after('email_count')

      // PDF
      table.string('pdf_url').nullable().after('last_email_sent_at')
      table.timestamp('pdf_generated_at').nullable().after('pdf_url')

      // Terms
      table.string('payment_terms').nullable().after('pdf_generated_at')

      // Client Info
      table.string('client_name').nullable().after('payment_terms')
      table.string('client_email').nullable().after('client_name')
      table.text('client_address').nullable().after('client_email')

      // Indexes
      table.index('sent_at')
      table.index('client_email')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sent_at')
      table.dropColumn('sent_to')
      table.dropColumn('email_count')
      table.dropColumn('last_email_sent_at')
      table.dropColumn('pdf_url')
      table.dropColumn('pdf_generated_at')
      table.dropColumn('payment_terms')
      table.dropColumn('client_name')
      table.dropColumn('client_email')
      table.dropColumn('client_address')
    })
  }
}

