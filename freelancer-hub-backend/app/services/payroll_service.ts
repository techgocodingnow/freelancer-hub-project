import TimeEntry from '#models/time_entry'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export interface PayrollCalculation {
  userId: number
  userName: string
  userEmail: string
  hourlyRate: number
  totalHours: number
  billableHours: number
  nonBillableHours: number
  totalAmount: number
  timeEntryIds: number[]
}

export interface PayrollSummary {
  totalAmount: number
  totalHours: number
  totalBillableHours: number
  userCount: number
  calculations: PayrollCalculation[]
}

export class PayrollService {
  /**
   * Calculate payroll for a single user
   */
  async calculateForUser(
    userId: number,
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<PayrollCalculation | null> {
    // Get user with hourly rate
    const user = await User.find(userId)
    if (!user) {
      return null
    }

    const hourlyRate = user.hourlyRate || 0

    // Get time entries for the period
    const timeEntries = await TimeEntry.query()
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenantId)
      .where('time_entries.user_id', userId)
      .where('time_entries.date', '>=', startDate)
      .where('time_entries.date', '<=', endDate)
      .select('time_entries.*')

    // Calculate totals
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const billableMinutes = timeEntries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const nonBillableMinutes = totalMinutes - billableMinutes

    const totalHours = totalMinutes / 60
    const billableHours = billableMinutes / 60
    const nonBillableHours = nonBillableMinutes / 60

    // Calculate amount (only billable hours)
    const totalAmount = billableHours * hourlyRate

    return {
      userId: user.id,
      userName: user.fullName || 'Unknown',
      userEmail: user.email,
      hourlyRate,
      totalHours: Number.parseFloat(totalHours.toFixed(2)),
      billableHours: Number.parseFloat(billableHours.toFixed(2)),
      nonBillableHours: Number.parseFloat(nonBillableHours.toFixed(2)),
      totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
      timeEntryIds: timeEntries.map((entry) => entry.id),
    }
  }

  /**
   * Calculate payroll for multiple users
   */
  async calculateForUsers(
    userIds: number[],
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<PayrollSummary> {
    const calculations: PayrollCalculation[] = []

    for (const userId of userIds) {
      const calculation = await this.calculateForUser(userId, tenantId, startDate, endDate)
      if (calculation && calculation.totalAmount > 0) {
        calculations.push(calculation)
      }
    }

    const totalAmount = calculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
    const totalHours = calculations.reduce((sum, calc) => sum + calc.totalHours, 0)
    const totalBillableHours = calculations.reduce((sum, calc) => sum + calc.billableHours, 0)

    return {
      totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
      totalHours: Number.parseFloat(totalHours.toFixed(2)),
      totalBillableHours: Number.parseFloat(totalBillableHours.toFixed(2)),
      userCount: calculations.length,
      calculations,
    }
  }

  /**
   * Calculate payroll for all users in a tenant
   */
  async calculateForAllUsers(
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<PayrollSummary> {
    // Get all users with time entries in the period
    const usersWithTime = await db
      .from('time_entries')
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenantId)
      .where('time_entries.date', '>=', startDate)
      .where('time_entries.date', '<=', endDate)
      .distinct('time_entries.user_id')
      .pluck('time_entries.user_id')

    return this.calculateForUsers(usersWithTime, tenantId, startDate, endDate)
  }

  /**
   * Get payroll summary for a batch
   */
  async getBatchSummary(batchId: number): Promise<any> {
    const batch = await db.from('payroll_batches').where('id', batchId).first()

    if (!batch) {
      return null
    }

    const payments = await db.from('payments').where('payroll_batch_id', batchId).select('*')

    const completedPayments = payments.filter((p) => p.status === 'completed').length
    const pendingPayments = payments.filter((p) => p.status === 'pending').length
    const failedPayments = payments.filter((p) => p.status === 'failed').length

    return {
      ...batch,
      payments,
      completedPayments,
      pendingPayments,
      failedPayments,
    }
  }
}

export default new PayrollService()
