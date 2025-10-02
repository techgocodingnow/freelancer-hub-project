import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tenant from '#models/tenant'
import TimeEntry from '#models/time_entry'
import TimesheetApproval from '#models/timesheet_approval'

export default class Timesheet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tenantId: number

  @column.date()
  declare weekStartDate: DateTime

  @column.date()
  declare weekEndDate: DateTime

  @column()
  declare status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected'

  @column()
  declare totalHours: number

  @column()
  declare billableHours: number

  @column()
  declare regularHours: number

  @column()
  declare overtimeHours: number

  @column.dateTime()
  declare submittedAt: DateTime | null

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime()
  declare rejectedAt: DateTime | null

  @column()
  declare approverId: number | null

  @column()
  declare rejectionReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => User, {
    foreignKey: 'approverId',
  })
  declare approver: BelongsTo<typeof User>

  @hasMany(() => TimeEntry)
  declare timeEntries: HasMany<typeof TimeEntry>

  @hasMany(() => TimesheetApproval)
  declare approvals: HasMany<typeof TimesheetApproval>

  // Helper methods
  canBeSubmitted(): boolean {
    return this.status === 'draft' && this.totalHours > 0
  }

  canBeApproved(): boolean {
    return this.status === 'submitted' || this.status === 'pending_approval'
  }

  canBeRejected(): boolean {
    return this.status === 'submitted' || this.status === 'pending_approval'
  }

  canBeReopened(): boolean {
    return this.status === 'approved' || this.status === 'rejected'
  }

  isEditable(): boolean {
    return this.status === 'draft' || this.status === 'rejected'
  }

  async submit(): Promise<void> {
    if (!this.canBeSubmitted()) {
      throw new Error('Timesheet cannot be submitted in its current state')
    }

    this.status = 'submitted'
    this.submittedAt = DateTime.now()
    await this.save()
  }

  async approve(approverId: number): Promise<void> {
    if (!this.canBeApproved()) {
      throw new Error('Timesheet cannot be approved in its current state')
    }

    this.status = 'approved'
    this.approvedAt = DateTime.now()
    this.approverId = approverId
    this.rejectionReason = null
    await this.save()

    // Create approval record
    await TimesheetApproval.create({
      timesheetId: this.id,
      approverId,
      action: 'approved',
      reason: null,
    })
  }

  async reject(approverId: number, reason: string): Promise<void> {
    if (!this.canBeRejected()) {
      throw new Error('Timesheet cannot be rejected in its current state')
    }

    this.status = 'rejected'
    this.rejectedAt = DateTime.now()
    this.approverId = approverId
    this.rejectionReason = reason
    await this.save()

    // Create approval record
    await TimesheetApproval.create({
      timesheetId: this.id,
      approverId,
      action: 'rejected',
      reason,
    })
  }

  async reopen(approverId: number): Promise<void> {
    if (!this.canBeReopened()) {
      throw new Error('Timesheet cannot be reopened in its current state')
    }

    this.status = 'draft'
    this.submittedAt = null
    this.approvedAt = null
    this.rejectedAt = null
    this.rejectionReason = null
    await this.save()

    // Create approval record
    await TimesheetApproval.create({
      timesheetId: this.id,
      approverId,
      action: 'reopened',
      reason: null,
    })
  }

  async calculateHours(): Promise<void> {
    await this.load('timeEntries')

    let totalMinutes = 0
    let billableMinutes = 0

    for (const entry of this.timeEntries) {
      totalMinutes += entry.durationMinutes
      if (entry.billable) {
        billableMinutes += entry.durationMinutes
      }
    }

    this.totalHours = Number((totalMinutes / 60).toFixed(2))
    this.billableHours = Number((billableMinutes / 60).toFixed(2))

    // Calculate regular vs overtime (assuming 40 hours/week is regular)
    const regularMinutes = Math.min(totalMinutes, 40 * 60)
    const overtimeMinutes = Math.max(0, totalMinutes - 40 * 60)

    this.regularHours = Number((regularMinutes / 60).toFixed(2))
    this.overtimeHours = Number((overtimeMinutes / 60).toFixed(2))

    await this.save()
  }
}

