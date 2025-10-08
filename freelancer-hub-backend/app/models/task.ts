import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeUpdate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import User from '#models/user'
import TimeEntry from '#models/time_entry'
import NotificationService from '#services/notification_service'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare status: 'todo' | 'in_progress' | 'review' | 'done'

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'urgent'

  @column.date()
  declare dueDate: DateTime | null

  @column()
  declare estimatedHours: number | null

  @column()
  declare actualHours: number

  @column()
  declare assigneeId: number | null

  @column()
  declare createdBy: number

  @column()
  declare blockedBy: number | null

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  // Relationships
  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User, {
    foreignKey: 'assigneeId',
  })
  declare assignee: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => Task, {
    foreignKey: 'blockedBy',
  })
  declare blockingTask: BelongsTo<typeof Task>

  @hasMany(() => TimeEntry)
  declare timeEntries: HasMany<typeof TimeEntry>

  /**
   * Model Hook: Triggered before a task is updated
   *
   * Automatically creates notifications when:
   * 1. A task is assigned to a user (assigneeId changes)
   * 2. A task is marked as completed (status changes to 'done')
   */
  @beforeUpdate()
  static async handleTaskUpdate(task: Task) {
    // Check if assigneeId has changed (task assignment)
    if (task.$dirty.assigneeId && task.assigneeId) {
      try {
        // Load the project to get tenantId
        await task.load('project')
        const project = task.project

        // Get the current user from the task's context
        // Note: We need to pass the assigner from the controller
        // For now, we'll use the creator as a fallback
        await task.load('creator')
        const assignedBy = task.creator

        // Create task assignment notification
        await NotificationService.notifyTaskAssignment(
          task,
          task.assigneeId,
          assignedBy,
          project.tenantId
        )
      } catch (error) {
        // Log error but don't fail the task update
        console.error('Failed to create task assignment notification:', error)
      }
    }

    // Check if task status changed to 'done' (task completion)
    if (task.$dirty.status && task.status === 'done') {
      try {
        // Load the project to get tenantId
        await task.load('project')
        const project = task.project

        // Load the assignee who completed the task
        if (task.assigneeId) {
          await task.load('assignee')
          const completedBy = task.assignee

          // Create task completion notification
          await NotificationService.notifyTaskCompletion(task, completedBy, project.tenantId)
        }
      } catch (error) {
        // Log error but don't fail the task update
        console.error('Failed to create task completion notification:', error)
      }
    }
  }
}
