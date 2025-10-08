import Notification from '#models/notification'
import Task from '#models/task'
import Project from '#models/project'
import User from '#models/user'
import Tenant from '#models/tenant'

/**
 * NotificationService
 *
 * Centralized service for creating notifications across the application.
 * Handles notification creation with proper tenant scoping and preference checking.
 */
export default class NotificationService {
  /**
   * Create a notification when a user is assigned to a task
   *
   * @param task - The task that was assigned
   * @param assigneeId - The ID of the user being assigned
   * @param assignedBy - The user who made the assignment
   * @param tenantId - The tenant ID for multi-tenant isolation
   */
  static async notifyTaskAssignment(
    task: Task,
    assigneeId: number,
    assignedBy: User,
    tenantId: number
  ): Promise<Notification | null> {
    // Don't notify if user assigns task to themselves
    if (assigneeId === assignedBy.id) {
      return null
    }

    // Load task relationships if not already loaded
    if (!task.project) {
      await task.load('project')
    }

    const project = task.project
    const assignerName = assignedBy.fullName || assignedBy.email

    // Get tenant for slug
    const tenant = await Tenant.find(tenantId)
    if (!tenant) {
      console.error(`Tenant ${tenantId} not found when creating task assignment notification`)
      return null
    }

    // Create notification using the existing helper method
    // This automatically checks user preferences
    return await Notification.createNotification({
      userId: assigneeId,
      tenantId: tenantId,
      type: 'task_assigned',
      title: "You've been assigned to a task",
      message: `${assignerName} assigned you to "${task.title}" in ${project.name}`,
      actionUrl: `/tenants/${tenant.slug}/projects/${project.id}/tasks/${task.id}`,
      actionLabel: 'View Task',
      relatedId: task.id,
      relatedType: 'task',
    })
  }

  /**
   * Create a notification when a task is completed
   *
   * @param task - The task that was completed
   * @param completedBy - The user who completed the task
   * @param tenantId - The tenant ID for multi-tenant isolation
   */
  static async notifyTaskCompletion(
    task: Task,
    completedBy: User,
    tenantId: number
  ): Promise<Notification | null> {
    // Load task relationships if not already loaded
    if (!task.project) {
      await task.load('project')
    }
    if (!task.creator) {
      await task.load('creator')
    }

    const project = task.project
    const creator = task.creator
    const completerName = completedBy.fullName || completedBy.email

    // Don't notify if the creator completed their own task
    if (creator.id === completedBy.id) {
      return null
    }

    // Get tenant for slug
    const tenant = await Tenant.find(tenantId)
    if (!tenant) {
      console.error(`Tenant ${tenantId} not found when creating task completion notification`)
      return null
    }

    // Notify the task creator
    return await Notification.createNotification({
      userId: creator.id,
      tenantId: tenantId,
      type: 'task_completed',
      title: 'Task completed',
      message: `${completerName} completed "${task.title}" in ${project.name}`,
      actionUrl: `/tenants/${tenant.slug}/projects/${project.id}/tasks/${task.id}`,
      actionLabel: 'View Task',
      relatedId: task.id,
      relatedType: 'task',
    })
  }

  /**
   * Create a notification when a project is updated
   *
   * @param project - The project that was updated
   * @param updatedBy - The user who updated the project
   * @param memberIds - Array of member IDs to notify
   * @param updateType - Type of update (e.g., 'status_changed', 'details_updated')
   */
  static async notifyProjectUpdate(
    project: Project,
    updatedBy: User,
    memberIds: number[],
    updateType: string = 'details_updated'
  ): Promise<Array<Notification | null>> {
    const updaterName = updatedBy.fullName || updatedBy.email

    // Get tenant for slug
    const tenant = await Tenant.find(project.tenantId)
    if (!tenant) {
      console.error(
        `Tenant ${project.tenantId} not found when creating project update notification`
      )
      return []
    }

    const notifications: Array<Notification | null> = []

    // Create notification for each member (except the updater)
    for (const memberId of memberIds) {
      if (memberId === updatedBy.id) continue

      const notification = await Notification.createNotification({
        userId: memberId,
        tenantId: project.tenantId,
        type: 'project_updated',
        title: 'Project updated',
        message: `${updaterName} updated ${project.name}`,
        actionUrl: `/tenants/${tenant.slug}/projects/${project.id}`,
        actionLabel: 'View Project',
        relatedId: project.id,
        relatedType: 'project',
      })

      notifications.push(notification)
    }

    return notifications
  }

  /**
   * Create a notification when a member is added to a project
   *
   * @param project - The project the member was added to
   * @param newMemberId - The ID of the newly added member
   * @param addedBy - The user who added the member
   */
  static async notifyMemberAdded(
    project: Project,
    newMemberId: number,
    addedBy: User
  ): Promise<Notification | null> {
    const adderName = addedBy.fullName || addedBy.email

    // Get tenant for slug
    const tenant = await Tenant.find(project.tenantId)
    if (!tenant) {
      console.error(`Tenant ${project.tenantId} not found when creating member added notification`)
      return null
    }

    return await Notification.createNotification({
      userId: newMemberId,
      tenantId: project.tenantId,
      type: 'member_added',
      title: 'Added to project',
      message: `${adderName} added you to ${project.name}`,
      actionUrl: `/tenants/${tenant.slug}/projects/${project.id}`,
      actionLabel: 'View Project',
      relatedId: project.id,
      relatedType: 'project',
    })
  }

  /**
   * Create a notification when a timesheet is approved
   *
   * @param timesheetId - The ID of the approved timesheet
   * @param userId - The user whose timesheet was approved
   * @param tenantId - The tenant ID
   * @param approvedBy - The user who approved the timesheet
   */
  static async notifyTimesheetApproved(
    timesheetId: number,
    userId: number,
    tenantId: number,
    approvedBy: User
  ): Promise<Notification | null> {
    const approverName = approvedBy.fullName || approvedBy.email

    // Get tenant for slug
    const tenant = await Tenant.find(tenantId)
    if (!tenant) {
      console.error(`Tenant ${tenantId} not found when creating timesheet approval notification`)
      return null
    }

    return await Notification.createNotification({
      userId: userId,
      tenantId: tenantId,
      type: 'timesheet_approved',
      title: 'Timesheet approved',
      message: `${approverName} approved your timesheet`,
      actionUrl: `/tenants/${tenant.slug}/timesheets/${timesheetId}`,
      actionLabel: 'View Timesheet',
      relatedId: timesheetId,
      relatedType: 'timesheet',
    })
  }

  /**
   * Create a notification when a timesheet is rejected
   *
   * @param timesheetId - The ID of the rejected timesheet
   * @param userId - The user whose timesheet was rejected
   * @param tenantId - The tenant ID
   * @param rejectedBy - The user who rejected the timesheet
   * @param reason - Optional rejection reason
   */
  static async notifyTimesheetRejected(
    timesheetId: number,
    userId: number,
    tenantId: number,
    rejectedBy: User,
    reason?: string
  ): Promise<Notification | null> {
    const rejecterName = rejectedBy.fullName || rejectedBy.email
    const message = reason
      ? `${rejecterName} rejected your timesheet: ${reason}`
      : `${rejecterName} rejected your timesheet`

    // Get tenant for slug
    const tenant = await Tenant.find(tenantId)
    if (!tenant) {
      console.error(`Tenant ${tenantId} not found when creating timesheet rejection notification`)
      return null
    }

    return await Notification.createNotification({
      userId: userId,
      tenantId: tenantId,
      type: 'timesheet_rejected',
      title: 'Timesheet rejected',
      message: message,
      actionUrl: `/tenants/${tenant.slug}/timesheets/${timesheetId}`,
      actionLabel: 'View Timesheet',
      secondaryActionUrl: `/tenants/${tenant.slug}/timesheets/${timesheetId}/edit`,
      secondaryActionLabel: 'Edit Timesheet',
      relatedId: timesheetId,
      relatedType: 'timesheet',
    })
  }

  /**
   * Create a notification when a payment is received
   *
   * @param paymentId - The ID of the payment
   * @param userId - The user who received the payment
   * @param tenantId - The tenant ID
   * @param amount - The payment amount
   * @param currency - The payment currency
   */
  static async notifyPaymentReceived(
    paymentId: number,
    userId: number,
    tenantId: number,
    amount: number,
    currency: string = 'USD'
  ): Promise<Notification | null> {
    // Get tenant for slug
    const tenant = await Tenant.find(tenantId)
    if (!tenant) {
      console.error(`Tenant ${tenantId} not found when creating payment notification`)
      return null
    }

    return await Notification.createNotification({
      userId: userId,
      tenantId: tenantId,
      type: 'payment_received',
      title: 'Payment received',
      message: `You received a payment of ${currency} ${amount.toFixed(2)}`,
      actionUrl: `/tenants/${tenant.slug}/payments/${paymentId}`,
      actionLabel: 'View Payment',
      relatedId: paymentId,
      relatedType: 'payment',
    })
  }
}
