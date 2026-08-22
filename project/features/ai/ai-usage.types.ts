import type { GeneratedBoard, GeneratedBoardSummary, GeneratedTask } from "@/features/ai/ai-usage.schema"

export type AiUsageDto = {
  id: string
  workspaceId: string
  userId: string
  projectId: string | null
  quotaKey: string
  action: string
  status: "pending" | "succeeded" | "failed"
  model: string | null
  inputTokens: number
  outputTokens: number
  tokensUsed: number
  createdAt: string
}

export type AiProviderResult<T> = {
  data: T
  model: string
  providerRequestId: string | null
  inputTokens: number
  outputTokens: number
}

export type BoardGenerationPrompt = {
  projectTitle: string
  goal: string
  listCount: number
  taskCount: number
}
export type TaskGenerationPrompt = {
  projectTitle: string
  columnName: string
  goal: string
  taskCount: number
}

export type BoardSummaryMetricsDto = {
  projectTitle: string
  generatedAt: string
  totalLists: number
  totalTasks: number
  finishedTasks: number
  unfinishedTasks: number
  unassignedTasks: number
  overdueTasks: number
  nearestDeadline: string | null
  dueWithinSevenDays: number
  tasksByPriority: Record<"low" | "medium" | "high", number>
  tasksByList: Array<{ listName: string; taskCount: number; finished: boolean }>
  recentActivity: Array<{ action: string; metadata: Record<string, unknown>; createdAt: string }>
}

export type BoardSummaryPrompt = { metrics: BoardSummaryMetricsDto }

export type AiGenerationProvider = {
  generateBoard(input: BoardGenerationPrompt): Promise<AiProviderResult<GeneratedBoard>>
  generateTasks(input: TaskGenerationPrompt): Promise<AiProviderResult<GeneratedTask[]>>
  summarizeBoard(input: BoardSummaryPrompt): Promise<AiProviderResult<GeneratedBoardSummary>>
}

export type BoardSummaryDto = {
  id: string
  projectId: string
  metrics: BoardSummaryMetricsDto
  executiveSummary: string
  progress: string
  deadlineRisks: string
  unassignedWork: string
  activityHighlights: string[]
  suggestedActions: string[]
  model: string
  createdAt: string
}
