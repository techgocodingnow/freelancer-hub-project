import TimeEntry from '#models/time_entry'
import Project from '#models/project'
import ProjectMember from '#models/project_member'
import User from '#models/user'
import Invoice from '#models/invoice'
import { DateTime } from 'luxon'

export type GeneratedLineItem = {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
  projectMemberId: number
  timeEntryIds: number[]
}

export type InvoiceGenerationResult = {
  lineItems: GeneratedLineItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  warnings: string[]
}

export type GenerateInvoiceOptions = {
  customerId: number
  projectIds: number[]
  startDate: DateTime
  endDate: DateTime
  tenantId: number
  taxRate?: number
  discountAmount?: number
}

export class InvoiceService {
  async generateLineItems(options: GenerateInvoiceOptions): Promise<InvoiceGenerationResult> {
    const { projectIds, startDate, endDate, tenantId, taxRate = 0, discountAmount = 0 } = options

    const timeEntries = await this.queryBillableTimeEntries(
      projectIds,
      startDate,
      endDate,
      tenantId
    )

    const grouped = this.groupTimeEntriesByProjectAndMember(timeEntries)

    const lineItems: GeneratedLineItem[] = []
    const warnings: string[] = []

    for (const [key, entries] of grouped) {
      const [projectId, userId] = key.split('-').map(Number)

      const project = await Project.find(projectId)
      const user = await User.find(userId)

      if (!project || !user) {
        continue
      }

      const projectMember = await ProjectMember.query()
        .where('project_id', projectId)
        .where('user_id', userId)
        .first()

      if (!projectMember) {
        warnings.push(
          `User ${user.fullName || user.email} is not a member of project ${project.name}. Their time entries were excluded.`
        )
        continue
      }

      if (!projectMember.hourlyRate || projectMember.hourlyRate <= 0) {
        warnings.push(
          `Project member ${user.fullName || user.email} on ${project.name} has no hourly rate set. Their time entries were excluded from this invoice.`
        )
        continue
      }

      const lineItem = this.generateLineItemFromGroup(project, user, entries, projectMember)
      lineItems.push(lineItem)
    }

    const totals = this.calculateInvoiceTotals(lineItems, taxRate, discountAmount)

    return {
      lineItems,
      ...totals,
      warnings,
    }
  }

  async queryBillableTimeEntries(
    projectIds: number[],
    startDate: DateTime,
    endDate: DateTime,
    tenantId: number
  ): Promise<TimeEntry[]> {
    const timeEntries = await TimeEntry.query()
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenantId)
      .whereIn('tasks.project_id', projectIds)
      .where('time_entries.billable', true)
      .where('time_entries.date', '>=', startDate.toFormat('yyyy-MM-dd'))
      .where('time_entries.date', '<=', endDate.toFormat('yyyy-MM-dd'))
      .preload('task', (taskQuery) => {
        taskQuery.preload('project')
      })
      .preload('user')
      .select('time_entries.*')

    return timeEntries
  }

  groupTimeEntriesByProjectAndMember(
    timeEntries: TimeEntry[]
  ): Map<string, TimeEntry[]> {
    const grouped = new Map<string, TimeEntry[]>()

    for (const entry of timeEntries) {
      const projectId = entry.task.projectId
      const userId = entry.userId
      const key = `${projectId}-${userId}`

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }

      grouped.get(key)!.push(entry)
    }

    return grouped
  }

  generateLineItemFromGroup(
    project: Project,
    user: User,
    timeEntries: TimeEntry[],
    projectMember: ProjectMember
  ): GeneratedLineItem {
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const totalHours = totalMinutes / 60
    const quantity = Number.parseFloat(totalHours.toFixed(2))

    const unitPrice = projectMember.hourlyRate!
    const amount = Number.parseFloat((quantity * unitPrice).toFixed(2))

    return {
      description: `${project.name} - ${user.fullName || user.email}`,
      quantity,
      unit: 'hours',
      unitPrice,
      amount,
      projectMemberId: projectMember.id,
      timeEntryIds: timeEntries.map((entry) => entry.id),
    }
  }

  calculateInvoiceTotals(
    lineItems: GeneratedLineItem[],
    taxRate: number,
    discountAmount: number
  ): { subtotal: number; taxAmount: number; discountAmount: number; total: number } {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)

    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount - discountAmount

    return {
      subtotal: Number.parseFloat(subtotal.toFixed(2)),
      taxAmount: Number.parseFloat(taxAmount.toFixed(2)),
      discountAmount: Number.parseFloat(discountAmount.toFixed(2)),
      total: Number.parseFloat(total.toFixed(2)),
    }
  }

  async generateInvoiceNumber(tenantId: number): Promise<string> {
    const result = await Invoice.query()
      .where('tenant_id', tenantId)
      .orderBy('id', 'desc')
      .first()

    if (!result) {
      return 'INV-00001'
    }

    const lastNumber = result.invoiceNumber || 'INV-00000'
    const match = lastNumber.match(/INV-(\d+)/)

    if (!match) {
      return 'INV-00001'
    }

    const nextNumber = Number.parseInt(match[1], 10) + 1
    return `INV-${String(nextNumber).padStart(5, '0')}`
  }
}

export default new InvoiceService()
