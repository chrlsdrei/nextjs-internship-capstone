export type AiUsageDto = {
  id: string
  workspaceId: string
  userId: string
  projectId: string | null
  quotaKey: string
  action: string
  model: string | null
  tokensUsed: number
  createdAt: string
}
