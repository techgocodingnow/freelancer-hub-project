import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "project_invitation",
  "task_assigned",
  "task_completed",
  "payment_received",
  "timesheet_approved",
  "timesheet_rejected",
  "project_updated",
  "member_added",
  "member_removed",
  "general",
]);

export const notificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  tenantId: z.number(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().nullable(),
  actionLabel: z.string().nullable(),
  secondaryActionUrl: z.string().nullable(),
  secondaryActionLabel: z.string().nullable(),
  relatedId: z.number().nullable(),
  relatedType: z.string().nullable(),
  isRead: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type NotificationSchema = z.infer<typeof notificationSchema>;
