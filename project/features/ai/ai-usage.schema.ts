import { z } from "zod"

export const AI_QUOTA_KEYS = {
  projectPlanning: "project_planning",
  taskDrafting: "task_drafting",
  workspaceSummary: "workspace_summary",
} as const

export const AI_FEATURE_ACTIONS = {
  board: "ai.board.generate",
  tasks: "ai.tasks.generate",
  summary: "ai.board.summarize",
} as const

const idempotencyKey = z.string().trim().min(16, "Request key is invalid").max(200)

export const generateBoardSchema = z.object({
  workspaceId: z.uuid("Workspace ID must be a valid UUID"),
  title: z.string().trim().min(1, "Project title is required").max(200),
  goal: z.string().trim().min(10, "Describe the project goal in at least 10 characters").max(4000),
  listCount: z.coerce.number().int().min(1).max(3),
  taskCount: z.coerce.number().int().min(1).max(15),
  dueDate: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.date().optional()),
  idempotencyKey,
})

export const generateTasksSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  listId: z.uuid("List ID must be a valid UUID"),
  goal: z.string().trim().min(10, "Describe the goal in at least 10 characters").max(4000),
  taskCount: z.coerce.number().int().min(1).max(5),
  idempotencyKey,
})

export const generateSummarySchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  idempotencyKey,
})

export const generatedTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
})

export const generatedBoardSchema = z.object({
  lists: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        tasks: z.array(generatedTaskSchema),
      }),
    )
    .min(1)
    .max(3),
})

export const generatedSummarySchema = z.object({
  executiveSummary: z.string().trim().min(1).max(2000),
  progress: z.string().trim().min(1).max(2000),
  deadlineRisks: z.string().trim().min(1).max(2000),
  unassignedWork: z.string().trim().min(1).max(2000),
  activityHighlights: z.array(z.string().trim().min(1).max(500)).max(10),
  suggestedActions: z.array(z.string().trim().min(1).max(500)).max(10),
})

export const recordAiUsageSchema = z.object({
  workspaceId: z.uuid(),
  projectId: z.uuid().nullable().optional(),
  quotaKey: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100).nullable().optional(),
  tokensUsed: z.int().min(0),
})

export type GenerateBoardInput = z.infer<typeof generateBoardSchema>
export type GenerateTasksInput = z.infer<typeof generateTasksSchema>
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>
export type GeneratedTask = z.infer<typeof generatedTaskSchema>
export type GeneratedBoard = z.infer<typeof generatedBoardSchema>
export type GeneratedBoardSummary = z.infer<typeof generatedSummarySchema>
export type RecordAiUsageInput = z.infer<typeof recordAiUsageSchema>
