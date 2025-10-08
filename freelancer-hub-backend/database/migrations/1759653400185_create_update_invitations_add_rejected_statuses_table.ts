import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    // Add 'rejected' to the status enum
    this.schema.raw(`
      ALTER TABLE invitations
      DROP CONSTRAINT IF EXISTS invitations_status_check;

      ALTER TABLE invitations
      ADD CONSTRAINT invitations_status_check
      CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled', 'rejected'));
    `)
  }

  async down() {
    // Revert to original status enum
    this.schema.raw(`
      ALTER TABLE invitations
      DROP CONSTRAINT IF EXISTS invitations_status_check;

      ALTER TABLE invitations
      ADD CONSTRAINT invitations_status_check
      CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
    `)
  }
}
