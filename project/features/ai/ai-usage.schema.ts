import { z } from "zod"

export const AI_QUOTA_KEYS = {
  projectPlanning: "project_planning",
  taskDrafting: "task_drafting",
  workspaceSummary: "workspace_summary",
} as const

export const recordAiUsageSchema = z.object({
  workspaceId: z.uuid("Workspace ID must be a valid UUID"),
  projectId: z.uuid("Project ID must be a valid UUID").nullable().optional(),
  quotaKey: z.string().trim().min(1, "AI quota key is required").max(100),
  action: z.string().trim().min(1, "AI action is required").max(100),
  model: z.string().trim().min(1).max(100).nullable().optional(),
  tokensUsed: z.int().min(0, "Token usage cannot be negative"),
})

export type RecordAiUsageInput = z.infer<typeof recordAiUsageSchema>
