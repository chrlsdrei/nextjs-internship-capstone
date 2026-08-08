import { z } from "zod"

const snapshotName = z.string().trim().min(1).max(200)
const emailSnapshot = z.string().trim().email().max(320)
const role = z.string().trim().min(1).max(50)
const labelColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const actorSnapshot = z.strictObject({ actorName: snapshotName })
const workspaceSnapshot = actorSnapshot.extend({ workspaceName: snapshotName })
const projectSnapshot = workspaceSnapshot.extend({ projectTitle: snapshotName })
const taskSnapshot = projectSnapshot.extend({ taskTitle: snapshotName })

export const activityEventSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("workspace.created"), metadata: workspaceSnapshot }),
  z.object({ action: z.literal("workspace.updated"), metadata: workspaceSnapshot }),
  z.object({
    action: z.literal("workspace.settings_updated"),
    metadata: workspaceSnapshot.extend({ membersCanCreateProjects: z.boolean() }),
  }),
  z.object({
    action: z.literal("workspace.member_role_updated"),
    metadata: workspaceSnapshot.extend({ memberName: snapshotName, previousRole: role, role }),
  }),
  z.object({
    action: z.literal("workspace.member_removed"),
    metadata: workspaceSnapshot.extend({ memberName: snapshotName }),
  }),
  z.object({
    action: z.literal("workspace.ownership_transferred"),
    metadata: workspaceSnapshot.extend({ previousOwnerName: snapshotName, newOwnerName: snapshotName }),
  }),
  z.object({
    action: z.enum(["invitation.created", "invitation.resent", "invitation.revoked", "invitation.accepted"]),
    metadata: workspaceSnapshot.extend({
      invitedEmail: emailSnapshot,
      invitationKind: z.enum(["workspace", "project"]),
      projectTitle: snapshotName.nullable(),
    }),
  }),
  z.object({ action: z.literal("project.created"), metadata: projectSnapshot }),
  z.object({ action: z.literal("project.updated"), metadata: projectSnapshot }),
  z.object({
    action: z.literal("project.settings_updated"),
    metadata: projectSnapshot.extend({ editorsCanAssignTasks: z.boolean() }),
  }),
  z.object({ action: z.literal("project.deleted"), metadata: projectSnapshot }),
  z.object({
    action: z.enum(["project.member_added", "project.member_role_updated", "project.member_removed"]),
    metadata: projectSnapshot.extend({ memberName: snapshotName, memberEmail: emailSnapshot, role }),
  }),
  z.object({
    action: z.enum(["list.created", "list.renamed", "list.deleted"]),
    metadata: projectSnapshot.extend({ listName: snapshotName }),
  }),
  z.object({
    action: z.literal("list.reordered"),
    metadata: projectSnapshot.extend({ listCount: z.number().int().nonnegative() }),
  }),
  z.object({
    action: z.enum(["label.created", "label.updated", "label.deleted"]),
    metadata: projectSnapshot.extend({ labelName: snapshotName, color: labelColor }),
  }),
  z.object({
    action: z.enum(["task.created", "task.updated", "task.deleted"]),
    metadata: taskSnapshot,
  }),
  z.object({
    action: z.literal("task.moved"),
    metadata: taskSnapshot.extend({ sourceListName: snapshotName, targetListName: snapshotName }),
  }),
  z.object({
    action: z.literal("task.reordered"),
    metadata: projectSnapshot.extend({ listName: snapshotName, taskCount: z.number().int().nonnegative() }),
  }),
  z.object({
    action: z.literal("task.labels_updated"),
    metadata: taskSnapshot.extend({ labelNames: z.array(snapshotName).max(50) }),
  }),
])

export const createActivitySchema = z.object({
  workspaceId: z.uuid(),
  projectId: z.uuid().nullable().default(null),
  taskId: z.uuid().nullable().default(null),
  actorWorkspaceMemberId: z.uuid().nullable(),
  event: activityEventSchema,
})

export const activityPageSchema = z.object({
  projectId: z.uuid(),
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.object({ createdAt: z.coerce.date(), id: z.uuid() }).optional(),
})

export type ActivityEvent = z.infer<typeof activityEventSchema>
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type ActivityPageInput = z.infer<typeof activityPageSchema>
