import type { HttpContext } from '@adonisjs/core/http'
import Notification from '#models/notification'
import db from '@adonisjs/lucid/services/db'

export default class NotificationsController {
  /**
   * Get current Postgres transaction ID
   * This is used by Electric to sync changes to clients
   */
  private async getCurrentTxId(): Promise<string> {
    const result = await db.rawQuery('SELECT pg_current_xact_id()::xid::text as txid')
    return result.rows[0]?.txid || '0'
  }
  /**
   * Get all notifications for the current user with pagination
   */
  async index({ auth, tenant, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const filter = request.input('filter', 'all') // all, unread, read
    const type = request.input('type', null)

    const query = Notification.query()
      .where('user_id', currentUser.id)
      .where('tenant_id', tenant.id)
      .orderBy('created_at', 'desc')

    // Apply filters
    if (filter === 'unread') {
      query.where('is_read', false)
    } else if (filter === 'read') {
      query.where('is_read', true)
    }

    if (type) {
      query.where('type', type)
    }

    const notifications = await query.paginate(page, limit)

    return response.ok({
      data: notifications.all(),
      meta: notifications.getMeta(),
    })
  }

  /**
   * Get unread notification count for the current user
   */
  async unreadCount({ auth, tenant, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const count = await Notification.getUnreadCount(currentUser.id, tenant.id)

    return response.ok({
      count,
    })
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead({ auth, tenant, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', currentUser.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!notification) {
      return response.notFound({
        error: 'Notification not found',
      })
    }

    await notification.markAsRead()
    const txid = await this.getCurrentTxId()

    return response.ok({
      message: 'Notification marked as read',
      data: notification,
      txid,
    })
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead({ auth, tenant, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const count = await Notification.markAllAsReadForUser(currentUser.id, tenant.id)
    const txid = await this.getCurrentTxId()

    return response.ok({
      message: `${count} notification(s) marked as read`,
      count,
      txid,
    })
  }

  /**
   * Delete a notification
   */
  async destroy({ auth, tenant, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', currentUser.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!notification) {
      return response.notFound({
        error: 'Notification not found',
      })
    }

    await notification.delete()
    const txid = await this.getCurrentTxId()

    return response.ok({
      message: 'Notification deleted successfully',
      txid,
    })
  }

  /**
   * Get a single notification
   */
  async show({ auth, tenant, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', currentUser.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!notification) {
      return response.notFound({
        error: 'Notification not found',
      })
    }

    return response.ok({
      data: notification,
    })
  }
}
