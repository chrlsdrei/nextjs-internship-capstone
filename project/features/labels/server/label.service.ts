import "server-only"

import { recordActivity } from "@/features/activity/server/activity.service"
import { LabelError } from "@/features/labels/label.error"
import {
  createLabelSchema,
  labelIdSchema,
  setTaskLabelsSchema,
  updateLabelSchema,
} from "@/features/labels/label.schema"
import type { LabelDto } from "@/features/labels/label.types"
import {
  deleteLabelRecord,
  findDuplicateLabelRecord,
  findProjectLabelRecord,
  findTaskLabelContext,
  insertLabelRecord,
  listProjectLabelRecords,
  replaceTaskLabelRecords,
  updateLabelRecord,
} from "@/features/labels/server/label.repository"
import { projectIdSchema } from "@/features/projects/project.schema"
import { findProjectById } from "@/features/projects/server/project.repository"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"

type ProjectAccess = Awaited<ReturnType<typeof requireProjectPermission>>
type LabelRecord = NonNullable<Awaited<ReturnType<typeof findProjectLabelRecord>>>

function toLabelDto(label: LabelRecord): LabelDto {
  return {
    id: label.id,
    projectId: label.projectId,
    name: label.name,
    color: label.color,
    createdAt: label.createdAt.toISOString(),
    updatedAt: label.updatedAt.toISOString(),
  }
}

async function activityContext(projectId: string, access: ProjectAccess) {
  const [project, workspace] = await Promise.all([
    findProjectById(projectId),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
  ])
  if (!project || !workspace) throw new ProjectAccessError("Activity context is unavailable", 409)
  return {
    workspaceId: access.workspaceId,
    projectId,
    actorWorkspaceMemberId: access.workspaceMemberId,
    metadata: {
      actorName: access.user.name,
      workspaceName: workspace.name,
      projectTitle: project.title,
    },
  }
}

async function enforceLabelRateLimit(access: ProjectAccess, action: "label.admin" | "label.assign") {
  await enforceRateLimit({ action, actorUserId: access.user.id, workspaceId: access.workspaceId })
}

function duplicateLabelError() {
  return new LabelError("A label with this name already exists in the project", "DUPLICATE_LABEL", 409)
}

function isUniqueViolation(error: unknown) {
  let current: unknown = error
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && current.code === "23505") return true
    current = "cause" in current ? current.cause : null
  }
  return false
}

export async function getProjectLabels(projectId: string): Promise<LabelDto[]> {
  const id = projectIdSchema.parse(projectId)
  await requireProjectPermission(id, "view")
  return (await listProjectLabelRecords(id)).map(toLabelDto)
}

export async function createLabel(projectId: string, input: unknown): Promise<LabelDto> {
  const id = projectIdSchema.parse(projectId)
  const values = createLabelSchema.parse(input)
  const access = await requireProjectPermission(id, "manage")
  await enforceLabelRateLimit(access, "label.admin")
  if (await findDuplicateLabelRecord(id, values.normalizedName)) throw duplicateLabelError()
  const label = await insertLabelRecord(id, access.workspaceMemberId, values)
  if (!label) throw duplicateLabelError()
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: {
      action: "label.created",
      metadata: { ...context.metadata, labelName: label.name, color: label.color },
    },
  })
  return toLabelDto(label)
}

export async function updateLabel(projectId: string, labelId: string, input: unknown): Promise<LabelDto> {
  const id = projectIdSchema.parse(projectId)
  const parsedLabelId = labelIdSchema.parse(labelId)
  const values = updateLabelSchema.parse(input)
  const access = await requireProjectPermission(id, "manage")
  await enforceLabelRateLimit(access, "label.admin")
  const existing = await findProjectLabelRecord(id, parsedLabelId)
  if (!existing) throw new LabelError("Label not found", "LABEL_NOT_FOUND", 404)
  if (values.normalizedName && (await findDuplicateLabelRecord(id, values.normalizedName, parsedLabelId))) {
    throw duplicateLabelError()
  }
  let label: Awaited<ReturnType<typeof updateLabelRecord>>
  try {
    label = await updateLabelRecord(id, parsedLabelId, values)
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateLabelError()
    throw error
  }
  if (!label) throw new LabelError("Label not found", "LABEL_NOT_FOUND", 404)
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: {
      action: "label.updated",
      metadata: { ...context.metadata, labelName: label.name, color: label.color },
    },
  })
  return toLabelDto(label)
}

export async function deleteLabel(projectId: string, labelId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedLabelId = labelIdSchema.parse(labelId)
  const access = await requireProjectPermission(id, "manage")
  await enforceLabelRateLimit(access, "label.admin")
  const label = await deleteLabelRecord(id, parsedLabelId)
  if (!label) throw new LabelError("Label not found", "LABEL_NOT_FOUND", 404)
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: {
      action: "label.deleted",
      metadata: { ...context.metadata, labelName: label.name, color: label.color },
    },
  })
}

export async function setTaskLabels(input: unknown): Promise<LabelDto[]> {
  const values = setTaskLabelsSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "edit")
  await enforceLabelRateLimit(access, "label.assign")
  const contextData = await findTaskLabelContext(values.projectId, values.taskId, values.labelIds)
  if (!contextData.task || contextData.labels.length !== values.labelIds.length) {
    throw new LabelError("Task or label does not belong to this project", "INVALID_TASK_LABELS", 409)
  }
  if (!(await replaceTaskLabelRecords(values, access.workspaceMemberId))) {
    throw new LabelError("Task or label does not belong to this project", "INVALID_TASK_LABELS", 409)
  }
  const context = await activityContext(values.projectId, access)
  await recordActivity({
    ...context,
    taskId: values.taskId,
    event: {
      action: "task.labels_updated",
      metadata: {
        ...context.metadata,
        taskTitle: contextData.task.title,
        labelNames: contextData.labels.map((label) => label.name),
      },
    },
  })
  const labelRecords = await listProjectLabelRecords(values.projectId)
  const selectedIds = new Set(values.labelIds)
  return labelRecords.filter((label) => selectedIds.has(label.id)).map(toLabelDto)
}
