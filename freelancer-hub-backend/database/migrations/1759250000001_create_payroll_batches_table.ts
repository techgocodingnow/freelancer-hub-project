import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payroll_batches'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table
        .integer('created_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      // Batch details
      table.string('batch_number').notNullable().unique()
      table.date('pay_period_start').notNullable()
      table.date('pay_period_end').notNullable()
      table
        .enum('status', ['draft', 'pending', 'processing', 'completed', 'failed', 'cancelled'])
        .defaultTo('draft')
        .notNullable()

      // Amounts
      table.decimal('total_amount', 10, 2).notNullable()
      table.string('currency', 3).defaultTo('USD').notNullable()
      table.integer('payment_count').defaultTo(0).notNullable()

      // Processing
      table.timestamp('processed_at').nullable()
      table.text('notes').nullable()
      table.text('error_message').nullable()

      // Metadata
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index('tenant_id')
      table.index('created_by')
      table.index('status')
      table.index('pay_period_start')
      table.index('pay_period_end')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

