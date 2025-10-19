import type { HttpContext } from '@adonisjs/core/http'
import Invitation from '#models/invitation'
import User from '#models/user'
import TenantUser from '#models/tenant_user'
import ProjectMember from '#models/project_member'
import EmailService from '#services/email_service'
import Notification from '#models/notification'
import { DateTime } from 'luxon'
import env from '#start/env'
import { createInvitationValidator } from '#validators/invitations'
import db from '@adonisjs/lucid/services/db'

export default class InvitationsController {
  /**
   * List all invitations for a tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status', '')
    const projectId = request.input('project_id', '')

    const query = Invitation.query()
      .where('tenant_id', tenant.id)
      .preload('role')
      .preload('inviter')
      .preload('project')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (projectId) {
      query.where('project_id', projectId)
    }

    const invitations = await query.paginate(page, limit)

    return response.ok({
      data: invitations.all(),
      meta: invitations.getMeta(),
    })
  }

  /**
   * Create a new invitation
   */
  async store({ tenant, userRole, auth, request, response }: HttpContext) {
    // Check permission
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can invite users' })
    }

    const data = await request.validateUsing(createInvitationValidator)
    const { email, roleId, projectId } = data

    const normalizedEmail = email.toLowerCase()

    // Check if user already exists in tenant
    const existingUser = await User.query().where('email', normalizedEmail).first()
    let existingTenantUser = null

    if (existingUser) {
      existingTenantUser = await TenantUser.query()
        .where('user_id', existingUser.id)
        .where('tenant_id', tenant.id)
        .first()

      if (existingTenantUser) {
        // If this is a project invitation, check if user is already a project member
        if (projectId) {
          const existingProjectMember = await ProjectMember.query()
            .where('user_id', existingUser.id)
            .where('project_id', projectId)
            .first()

          if (existingProjectMember) {
            return response.conflict({
              error: 'User is already a member of this project',
            })
          }
          // User is in organization but not in this project - allow invitation
        } else {
          // This is an organization-level invitation and user is already in organization
          return response.conflict({
            error: 'User is already a member of this organization',
          })
        }
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.query()
      .where('email', normalizedEmail)
      .where('tenant_id', tenant.id)
      .where('status', 'pending')
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (existingInvitation) {
      if (projectId && existingInvitation.projectId === projectId) {
        return response.conflict({
          error: 'A pending invitation already exists for this email and project',
        })
      } else if (!projectId && !existingInvitation.projectId) {
        return response.conflict({
          error: 'A pending invitation already exists for this email',
        })
      }
    }

    const currentUser = auth.getUserOrFail()

    // Check if this is an existing user in the organization
    const isExistingUser = existingUser && existingTenantUser !== null

    // Create invitation
    const invitation = await Invitation.createInvitation({
      email: normalizedEmail,
      tenantId: tenant.id,
      roleId,
      invitedBy: currentUser.id,
      projectId,
      expiresInDays: 7,
    })

    await invitation.load('role', 'tenant', 'inviter', 'project')

    // Only send email if this is a new user (not in organization)
    // Existing users will see in-app notification
    if (!isExistingUser) {
      try {
        const baseUrl = env.get('FRONTEND_URL', 'http://localhost:5173')
        await EmailService.sendInvitationEmail(invitation, baseUrl)
      } catch (error) {
        console.error('Failed to send invitation email:', error)
        // Don't fail the request if email fails
      }
    } else if (existingUser && projectId) {
      // Create in-app notification for existing users (project invitations only)
      try {
        const tenantSlug = tenant.slug
        await Notification.createNotification({
          userId: existingUser.id,
          tenantId: tenant.id,
          type: 'project_invitation',
          title: `Invitation to join ${invitation.project?.name || 'a project'}`,
          message: `${currentUser.fullName || currentUser.email} invited you to join ${invitation.project?.name || 'a project'} as ${invitation.role.name}`,
          actionUrl: `/tenants/${tenantSlug}/projects/${projectId}`,
          actionLabel: 'View Project',
          relatedId: invitation.id,
          relatedType: 'invitation',
        })
      } catch (error) {
        console.error('Failed to create notification:', error)
        // Don't fail the request if notification creation fails
      }
    }

    return response.created({
      message: isExistingUser
        ? 'Invitation sent. User will see it when they log in.'
        : 'Invitation email sent successfully',
      data: {
        ...invitation.serialize(),
        isExistingUser,
      },
    })
  }

  /**
   * Resend an invitation
   */
  async resend({ tenant, userRole, params, response }: HttpContext) {
    // Check permission
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can resend invitations' })
    }

    const invitation = await Invitation.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('role')
      .preload('tenant')
      .preload('inviter')
      .preload('project')
      .first()

    if (!invitation) {
      return response.notFound({ error: 'Invitation not found' })
    }

    if (invitation.status !== 'pending') {
      return response.badRequest({
        error: 'Only pending invitations can be resent',
      })
    }

    // Extend expiration
    invitation.expiresAt = DateTime.now().plus({ days: 7 })
    await invitation.save()

    // Resend email
    try {
      const baseUrl = env.get('FRONTEND_URL', 'http://localhost:5173')
      await EmailService.sendInvitationEmail(invitation, baseUrl)
    } catch (error) {
      console.error('Failed to resend invitation email:', error)
      return response.internalServerError({
        error: 'Failed to send invitation email',
      })
    }

    return response.ok({
      message: 'Invitation resent successfully',
      data: invitation,
    })
  }

  /**
   * Cancel an invitation
   */
  async cancel({ tenant, userRole, params, response }: HttpContext) {
    // Check permission
    if (!userRole.canManageUsers()) {
      return response.forbidden({ error: 'Only admins and owners can cancel invitations' })
    }

    const invitation = await Invitation.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!invitation) {
      return response.notFound({ error: 'Invitation not found' })
    }

    try {
      await invitation.cancel()
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }

    return response.ok({
      message: 'Invitation cancelled successfully',
      data: invitation,
    })
  }

  /**
   * Validate an invitation token (public endpoint)
   */
  async validate({ params, response }: HttpContext) {
    const invitation = await Invitation.query()
      .where('token', params.token)
      .preload('tenant')
      .preload('role')
      .preload('project')
      .first()

    if (!invitation) {
      return response.notFound({ error: 'Invitation not found' })
    }

    if (!invitation.canBeAccepted()) {
      const reason = invitation.isExpired() ? 'expired' : 'already used or cancelled'
      return response.badRequest({
        error: `This invitation has ${reason}`,
        status: invitation.status,
      })
    }

    return response.ok({
      data: {
        email: invitation.email,
        tenant: {
          id: invitation.tenant.id,
          name: invitation.tenant.name,
          slug: invitation.tenant.slug,
        },
        role: {
          id: invitation.role.id,
          name: invitation.role.name,
        },
        project: invitation.project
          ? {
              id: invitation.project.id,
              name: invitation.project.name,
            }
          : null,
        expiresAt: invitation.expiresAt,
      },
    })
  }

  /**
   * Get current user's pending project invitations
   */
  async myInvitations({ auth, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const invitations = await Invitation.query()
      .where('email', currentUser.email)
      .where('status', 'pending')
      .whereNotNull('project_id') // Only project invitations
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('tenant')
      .preload('role')
      .preload('project')
      .preload('inviter')
      .orderBy('created_at', 'desc')

    return response.ok({
      data: invitations,
    })
  }

  /**
   * Accept a project invitation
   */
  async acceptInvitation({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const invitation = await Invitation.query()
      .where('id', params.id)
      .preload('tenant')
      .preload('role')
      .preload('project')
      .first()

    if (!invitation) {
      return response.notFound({ error: 'Invitation not found' })
    }

    // Verify invitation belongs to current user
    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      return response.forbidden({ error: 'This invitation is not for you' })
    }

    // Verify invitation can be accepted
    if (!invitation.canBeAccepted()) {
      const reason = invitation.isExpired() ? 'expired' : 'already used or cancelled'
      return response.badRequest({ error: `This invitation has ${reason}` })
    }

    // Verify it's a project invitation
    if (!invitation.projectId) {
      return response.badRequest({ error: 'This is not a project invitation' })
    }

    // Check if user is already a project member
    const existingMember = await ProjectMember.query()
      .where('user_id', currentUser.id)
      .where('project_id', invitation.projectId)
      .first()

    if (existingMember) {
      return response.conflict({ error: 'You are already a member of this project' })
    }

    // Use transaction to ensure atomicity
    const trx = await db.transaction()

    try {
      // Add user to project
      await ProjectMember.create(
        {
          projectId: invitation.projectId,
          userId: currentUser.id,
          role: invitation.role.name as 'owner' | 'admin' | 'member' | 'viewer',
          joinedAt: DateTime.now(),
        },
        { client: trx }
      )

      // Mark invitation as accepted
      await invitation.accept(currentUser.id, { client: trx })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    return response.ok({
      message: 'Invitation accepted successfully',
      data: {
        project: invitation.project,
        role: invitation.role,
      },
    })
  }

  /**
   * Reject a project invitation
   */
  async rejectInvitation({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const invitation = await Invitation.query().where('id', params.id).first()

    if (!invitation) {
      return response.notFound({ error: 'Invitation not found' })
    }

    // Verify invitation belongs to current user
    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      return response.forbidden({ error: 'This invitation is not for you' })
    }

    // Verify invitation is pending
    if (invitation.status !== 'pending') {
      return response.badRequest({ error: 'This invitation cannot be rejected' })
    }

    // Reject invitation
    await invitation.reject(currentUser.id)

    return response.ok({
      message: 'Invitation rejected successfully',
    })
  }
}
