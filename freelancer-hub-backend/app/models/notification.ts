import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tenant from '#models/tenant'
import NotificationPreference from '#models/notification_preference'

export type NotificationType =
  | 'project_invitation'
  | 'task_assigned'
  | 'task_completed'
  | 'payment_received'
  | 'timesheet_approved'
  | 'timesheet_rejected'
  | 'project_updated'
  | 'member_added'
  | 'member_removed'
  | 'general'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tenantId: number

  @column()
  declare type: NotificationType

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare actionUrl: string | null

  @column()
  declare actionLabel: string | null

  @column()
  declare secondaryActionUrl: string | null

  @column()
  declare secondaryActionLabel: string | null

  @column()
  declare relatedId: number | null

  @column()
  declare relatedType: string | null

  @column()
  declare isRead: boolean

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  // Query scopes
  static unread = (query: any) => {
    query.where('is_read', false)
  }

  static read = (query: any) => {
    query.where('is_read', true)
  }

  static byType = (query: any, type: NotificationType) => {
    query.where('type', type)
  }

  static byTenant = (query: any, tenantId: number) => {
    query.where('tenant_id', tenantId)
  }

  static byUser = (query: any, userId: number) => {
    query.where('user_id', userId)
  }

  static recent = (query: any) => {
    query.orderBy('created_at', 'desc')
  }

  // Instance methods
  async markAsRead(): Promise<void> {
    if (!this.isRead) {
      this.isRead = true
      this.readAt = DateTime.now()
      await this.save()
    }
  }

  async markAsUnread(): Promise<void> {
    if (this.isRead) {
      this.isRead = false
      this.readAt = null
      await this.save()
    }
  }

  // Static helper methods
  static async createNotification(data: {
    userId: number
    tenantId: number
    type: NotificationType
    title: string
    message: string
    actionUrl?: string
    actionLabel?: string
    secondaryActionUrl?: string
    secondaryActionLabel?: string
    relatedId?: number
    relatedType?: string
  }): Promise<Notification | null> {
    // Check user preferences before creating notification
    const shouldSend = await NotificationPreference.shouldSendInApp(
      data.userId,
      data.tenantId,
      data.type
    )

    if (!shouldSend) {
      // User has disabled this notification type or muted all notifications
      return null
    }

    return await Notification.create({
      userId: data.userId,
      tenantId: data.tenantId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl || null,
      actionLabel: data.actionLabel || null,
      secondaryActionUrl: data.secondaryActionUrl || null,
      secondaryActionLabel: data.secondaryActionLabel || null,
      relatedId: data.relatedId || null,
      relatedType: data.relatedType || null,
      isRead: false,
    })
  }

  static async markAllAsReadForUser(userId: number, tenantId: number): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: DateTime.now().toSQL(),
      })

    return result[0] || 0
  }

  static async getUnreadCount(userId: number, tenantId: number): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .where('is_read', false)
      .count('* as total')

    return Number(result[0].$extras.total) || 0
  }
}
