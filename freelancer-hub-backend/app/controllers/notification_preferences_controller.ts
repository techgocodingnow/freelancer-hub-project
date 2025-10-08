import type { HttpContext } from '@adonisjs/core/http'
import NotificationPreference from '#models/notification_preference'
import { NotificationType } from '#models/notification'
import vine from '@vinejs/vine'

export default class NotificationPreferencesController {
  /**
   * Get all notification preferences for the current user
   */
  async index({ auth, tenant, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    // Get or create default preferences
    const preferences = await NotificationPreference.getOrCreateDefaults(currentUser.id, tenant.id)

    return response.ok({
      data: preferences,
    })
  }

  /**
   * Update a specific notification preference
   */
  async update({ auth, tenant, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    // Validate request
    const updatePreferenceSchema = vine.compile(
      vine.object({
        inAppEnabled: vine.boolean().optional(),
        emailEnabled: vine.boolean().optional(),
        isMuted: vine.boolean().optional(),
      })
    )

    const payload = await request.validateUsing(updatePreferenceSchema)

    // Get or create preference
    const preference = await NotificationPreference.firstOrCreate(
      {
        userId: currentUser.id,
        tenantId: tenant.id,
        notificationType: params.type as NotificationType,
      },
      {
        userId: currentUser.id,
        tenantId: tenant.id,
        notificationType: params.type as NotificationType,
        inAppEnabled: true,
        emailEnabled: false,
        isMuted: false,
      }
    )

    // Update preference
    if (payload.inAppEnabled !== undefined) {
      preference.inAppEnabled = payload.inAppEnabled
    }
    if (payload.emailEnabled !== undefined) {
      preference.emailEnabled = payload.emailEnabled
    }
    if (payload.isMuted !== undefined) {
      preference.isMuted = payload.isMuted
    }

    await preference.save()

    return response.ok({
      message: 'Preference updated successfully',
      data: preference,
    })
  }

  /**
   * Mute all notifications
   */
  async muteAll({ auth, tenant, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await NotificationPreference.muteAll(currentUser.id, tenant.id)

    return response.ok({
      message: 'All notifications muted',
    })
  }

  /**
   * Unmute all notifications
   */
  async unmuteAll({ auth, tenant, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await NotificationPreference.unmuteAll(currentUser.id, tenant.id)

    return response.ok({
      message: 'All notifications unmuted',
    })
  }

  /**
   * Get default preferences (for reference)
   */
  async defaults({ response }: HttpContext) {
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

    const defaults = notificationTypes.map((type) => ({
      notificationType: type,
      inAppEnabled: true,
      emailEnabled: false,
      isMuted: false,
    }))

    return response.ok({
      data: defaults,
    })
  }
}
