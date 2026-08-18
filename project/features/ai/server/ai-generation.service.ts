import "server-only"

import {
  AI_FEATURE_ACTIONS,
  AI_QUOTA_KEYS,
  generateBoardSchema,
  generateSummarySchema,
  generateTasksSchema,
} from "@/features/ai/ai-usage.schema"
import type { BoardSummaryDto, BoardSummaryMetricsDto } from "@/features/ai/ai-usage.types"
import {
  insertBoardSummary,
  insertGeneratedBoard,
  insertGeneratedTasks,
  listBoardSummaries,
  listRecentActivityForSummary,
} from "@/features/ai/server/ai-generation.repository"
import { failAiUsage, reserveAiUsage } from "@/features/ai/server/ai-usage.repository"
import { geminiProvider } from "@/features/ai/server/gemini.gateway"
import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import {
  getUserAiEntitlement,
  getUserAiUsagePeriod,
  getWorkspaceAiUsagePeriod,
  getWorkspaceEntitlement,
  requireProjectCapacity,
  requireUserAiFeature,
  requireWorkspaceSummaryFeature,
} from "@/features/billing/server/entitlement.service"
import { readProjectBoard } from "@/features/board/server/board.repository"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { findProjectById } from "@/features/projects/server/project.repository"
import { requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"
import { listWorkspaces } from "@/features/workspaces/server/workspace.service"
import { canCreateProjectInWorkspace, resolveWorkspaceRole } from "@/features/workspaces/workspace.policy"

function modelName() {
  const value = process.env.GEMINI_MODEL
  if (!value) throw new Error("Gemini is not configured")
  return value
}

function summaryDto(row: Awaited<ReturnType<typeof listBoardSummaries>>[number]): BoardSummaryDto {
  return {
    id: row.id,
    projectId: row.projectId,
    metrics: row.metrics as BoardSummaryMetricsDto,
    executiveSummary: row.executiveSummary,
    progress: row.progress,
    deadlineRisks: row.deadlineRisks,
    unassignedWork: row.unassignedWork,
    activityHighlights: row.activityHighlights,
    suggestedActions: row.suggestedActions,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
  }
}

async function reserveUserFeature(input: {
  userId: string
  workspaceId: string
  projectId?: string
  requestKey: string
  feature: "board" | "tasks"
}) {
  await requireUserAiFeature(input.userId, input.feature)
  const period = await getUserAiUsagePeriod(input.userId)
  const quotaKey = input.feature === "board" ? AI_QUOTA_KEYS.projectPlanning : AI_QUOTA_KEYS.taskDrafting
  const action = input.feature === "board" ? AI_FEATURE_ACTIONS.board : AI_FEATURE_ACTIONS.tasks
  const reservation = await reserveAiUsage({
    ...input,
    projectId: input.projectId,
    quotaKey,
    action,
    model: modelName(),
    limit: null,
    scope: "user",
    periodStartsAt: period.startsAt,
    periodEndsAt: period.endsAt,
  })
  if (!reservation) throw new Error("Unable to reserve this AI generation request")
  return reservation
}

export async function getAiNavigationData() {
  const user = await getCurrentDatabaseUser()
  const [entitlement, workspaces] = await Promise.all([getUserAiEntitlement(user.id), listWorkspaces()])
  return {
    entitlement,
    workspaces: workspaces
      .filter(canCreateProjectInWorkspace)
      .map((workspace) => ({ id: workspace.id, name: workspace.name })),
  }
}

export async function generateBoard(input: unknown) {
  const values = generateBoardSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  const workspace = await findActiveWorkspaceAccess(values.workspaceId, user.id)
  if (!workspace) throw new Error("Workspace not found")
  const role = resolveWorkspaceRole(workspace.ownerWorkspaceMemberId, {
    id: workspace.membershipId,
    role: workspace.membershipRole,
    removedAt: workspace.membershipRemovedAt,
  })
  if (
    !role ||
    !canCreateProjectInWorkspace({
      role,
      membersCanCreateProjects: workspace.membersCanCreateProjects,
      status: workspace.status,
    })
  ) {
    throw new Error("You cannot create projects in this workspace")
  }
  await requireProjectCapacity(workspace.id, user.id)
  await enforceRateLimit({ action: "ai.board.generate", actorUserId: user.id, workspaceId: workspace.id })
  const reserved = await reserveUserFeature({
    userId: user.id,
    workspaceId: workspace.id,
    requestKey: values.idempotencyKey,
    feature: "board",
  })
  if (reserved.existing) {
    if (reserved.reservation.status === "succeeded" && reserved.reservation.result_resource_id) {
      return { projectId: reserved.reservation.result_resource_id, duplicate: true }
    }
    throw new Error("This board generation request is already being processed")
  }
  try {
    const generated = await geminiProvider.generateBoard(values)
    const projectId = await insertGeneratedBoard({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      actorName: user.name,
      actorWorkspaceMemberId: workspace.membershipId,
      creatorIsOwner: role === "owner",
      title: values.title,
      description: values.goal.slice(0, 500),
      dueDate: values.dueDate,
      board: generated.data,
      usage: { id: reserved.reservation.id, ...generated },
    })
    if (!projectId) throw new Error("Unable to save the generated board")
    publishProjectEvent(projectId, "project.updated")
    return { projectId, duplicate: false }
  } catch (error) {
    await failAiUsage(reserved.reservation.id, error instanceof Error ? error.name : "AI_GENERATION_FAILED")
    throw error
  }
}

export async function generateTasks(input: unknown) {
  const values = generateTasksSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "edit")
  const [project, workspace] = await Promise.all([
    findProjectById(values.projectId),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
  ])
  if (!project || !workspace) throw new Error("Project not found")
  await enforceRateLimit({ action: "ai.tasks.generate", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const reserved = await reserveUserFeature({
    userId: access.user.id,
    workspaceId: access.workspaceId,
    projectId: values.projectId,
    requestKey: values.idempotencyKey,
    feature: "tasks",
  })
  if (reserved.existing) {
    if (reserved.reservation.status === "succeeded") return { created: values.taskCount, duplicate: true }
    throw new Error("This task generation request is already being processed")
  }
  try {
    const generated = await geminiProvider.generateTasks(values)
    const ids = await insertGeneratedTasks({
      workspaceId: access.workspaceId,
      workspaceName: workspace.name,
      projectId: values.projectId,
      projectTitle: project.title,
      listId: values.listId,
      actorName: access.user.name,
      actorWorkspaceMemberId: access.workspaceMemberId,
      tasks: generated.data,
      usage: { id: reserved.reservation.id, ...generated },
    })
    if (ids.length !== values.taskCount) throw new Error("The selected column is no longer available")
    publishProjectEvent(values.projectId, "board.updated")
    return { created: ids.length, duplicate: false }
  } catch (error) {
    await failAiUsage(reserved.reservation.id, error instanceof Error ? error.name : "AI_GENERATION_FAILED")
    throw error
  }
}

function completionNames() {
  return new Set(["done", "complete", "completed", "finished"])
}

function sanitizedActivityMetadata(metadata: Record<string, unknown>) {
  const safeKeys = new Set([
    "taskTitle",
    "listName",
    "fromListName",
    "toListName",
    "previousListName",
    "labelName",
    "labelNames",
    "assigneeNames",
    "projectTitle",
    "role",
  ])
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => safeKeys.has(key)))
}

async function boardSummaryMetrics(projectId: string, projectTitle: string): Promise<BoardSummaryMetricsDto> {
  const now = new Date()
  const startsAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const [board, recentActivity] = await Promise.all([
    readProjectBoard(projectId),
    listRecentActivityForSummary(projectId, startsAt),
  ])
  const finishedLists = completionNames()
  const listById = new Map(board.listRows.map((list) => [list.id, list]))
  const assignedIds = new Set(board.taskAssigneeRows.map((row) => row.taskId))
  const finishedTasks = board.taskRows.filter((task) =>
    finishedLists.has(listById.get(task.listId)?.name.trim().toLowerCase() ?? ""),
  ).length
  const upcoming = board.taskRows
    .map((task) => task.dueDate)
    .filter((date): date is Date => Boolean(date && date >= now))
    .sort((left, right) => left.getTime() - right.getTime())
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    projectTitle,
    generatedAt: now.toISOString(),
    totalLists: board.listRows.length,
    totalTasks: board.taskRows.length,
    finishedTasks,
    unfinishedTasks: board.taskRows.length - finishedTasks,
    unassignedTasks: board.taskRows.filter((task) => !assignedIds.has(task.id)).length,
    overdueTasks: board.taskRows.filter((task) => task.dueDate && task.dueDate < now).length,
    nearestDeadline: upcoming[0]?.toISOString() ?? null,
    dueWithinSevenDays: upcoming.filter((date) => date <= sevenDays).length,
    tasksByPriority: {
      low: board.taskRows.filter((task) => task.priority === "low").length,
      medium: board.taskRows.filter((task) => task.priority === "medium").length,
      high: board.taskRows.filter((task) => task.priority === "high").length,
    },
    tasksByList: board.listRows.map((list) => ({
      listName: list.name,
      taskCount: board.taskRows.filter((task) => task.listId === list.id).length,
      finished: finishedLists.has(list.name.trim().toLowerCase()),
    })),
    recentActivity: recentActivity.map((activity) => ({
      action: activity.action,
      metadata: sanitizedActivityMetadata(activity.metadata),
      createdAt: activity.createdAt.toISOString(),
    })),
  }
}

export async function generateBoardSummary(input: unknown): Promise<BoardSummaryDto> {
  const values = generateSummarySchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "view")
  const project = await findProjectById(values.projectId)
  if (!project) throw new Error("Project not found")
  await requireWorkspaceSummaryFeature(access.workspaceId, access.user.id)
  await enforceRateLimit({ action: "ai.board.summarize", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const period = await getWorkspaceAiUsagePeriod(access.workspaceId)
  const reservation = await reserveAiUsage({
    workspaceId: access.workspaceId,
    userId: access.user.id,
    projectId: values.projectId,
    quotaKey: AI_QUOTA_KEYS.workspaceSummary,
    action: AI_FEATURE_ACTIONS.summary,
    requestKey: values.idempotencyKey,
    model: modelName(),
    limit: null,
    scope: "workspace",
    periodStartsAt: period.startsAt,
    periodEndsAt: period.endsAt,
  })
  if (!reservation) throw new Error("Unable to reserve this AI summary request")
  if (reservation.existing) {
    const existing = (await listBoardSummaries(values.projectId)).find(
      (summary) => summary.id === reservation.reservation.result_resource_id,
    )
    if (existing) return summaryDto(existing)
    throw new Error("This summary request is already being processed")
  }
  try {
    const metrics = await boardSummaryMetrics(project.id, project.title)
    const generated = await geminiProvider.summarizeBoard({ metrics })
    const endsAt = new Date()
    const startsAt = new Date(endsAt.getTime() - 7 * 24 * 60 * 60 * 1000)
    const saved = await insertBoardSummary({
      workspaceId: access.workspaceId,
      projectId: project.id,
      userId: access.user.id,
      usageId: reservation.reservation.id,
      metrics,
      summary: generated.data,
      startsAt,
      endsAt,
      model: generated.model,
      providerRequestId: generated.providerRequestId,
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens,
    })
    if (!saved) throw new Error("Unable to save the board summary")
    return summaryDto(saved)
  } catch (error) {
    await failAiUsage(reservation.reservation.id, error instanceof Error ? error.name : "AI_GENERATION_FAILED")
    throw error
  }
}

export async function getBoardAiData(projectId: string) {
  const access = await requireProjectPermission(projectId, "view")
  const [userEntitlement, workspaceEntitlement, summaries] = await Promise.all([
    getUserAiEntitlement(access.user.id),
    getWorkspaceEntitlement(access.workspaceId, access.user.id),
    listBoardSummaries(projectId),
  ])
  return { userEntitlement, workspaceEntitlement, summaries: summaries.map(summaryDto) }
}
