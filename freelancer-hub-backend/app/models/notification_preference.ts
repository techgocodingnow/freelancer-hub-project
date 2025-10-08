import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tenant from '#models/tenant'
import { type NotificationType } from '#models/notification'

export default class NotificationPreference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tenantId: number

  @column()
  declare notificationType: NotificationType

  @column()
  declare inAppEnabled: boolean

  @column()
  declare emailEnabled: boolean

  @column()
  declare isMuted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  // Query scopes
  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })

  static byTenant = scope((query, tenantId: number) => {
    query.where('tenant_id', tenantId)
  })

  static byType = scope((query, type: NotificationType) => {
    query.where('notification_type', type)
  })

  static muted = scope((query) => {
    query.where('is_muted', true)
  })

  static inAppEnabled = scope((query) => {
    query.where('in_app_enabled', true)
  })

  static emailEnabled = scope((query) => {
    query.where('email_enabled', true)
  })

  /**
   * Get or create default preferences for a user in a tenant
   */
  static async getOrCreateDefaults(userId: number, tenantId: number) {
    const notificationTypes: NotificationType[] = [
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
    ]

    const preferences: NotificationPreference[] = []

    for (const type of notificationTypes) {
      const preference = await NotificationPreference.firstOrCreate(
        {
          userId,
          tenantId,
          notificationType: type,
        },
        {
          userId,
          tenantId,
          notificationType: type,
          inAppEnabled: true, // Default: in-app enabled
          emailEnabled: false, // Default: email disabled
          isMuted: false,
        }
      )
      preferences.push(preference)
    }

    return preferences
  }

  /**
   * Get preference for a specific notification type
   */
  static async getPreference(userId: number, tenantId: number, type: NotificationType) {
    return await NotificationPreference.query()
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .where('notification_type', type)
      .first()
  }

  /**
   * Check if notification should be sent (in-app)
   */
  static async shouldSendInApp(userId: number, tenantId: number, type: NotificationType) {
    const preference = await this.getPreference(userId, tenantId, type)

    if (!preference) {
      return true // Default: send in-app if no preference set
    }

    return preference.inAppEnabled && !preference.isMuted
  }

  /**
   * Check if notification should be sent (email)
   */
  static async shouldSendEmail(userId: number, tenantId: number, type: NotificationType) {
    const preference = await this.getPreference(userId, tenantId, type)

    if (!preference) {
      return false // Default: don't send email if no preference set
    }

    return preference.emailEnabled && !preference.isMuted
  }

  /**
   * Mute all notifications for a user in a tenant
   */
  static async muteAll(userId: number, tenantId: number) {
    await NotificationPreference.query()
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .update({ isMuted: true })
  }

  /**
   * Unmute all notifications for a user in a tenant
   */
  static async unmuteAll(userId: number, tenantId: number) {
    await NotificationPreference.query()
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .update({ isMuted: false })
  }
}
