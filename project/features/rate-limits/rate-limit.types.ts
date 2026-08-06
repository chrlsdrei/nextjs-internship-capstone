export type RateLimitAction =
  | "workspace.create"
  | "workspace.admin"
  | "project.create"
  | "project.admin"
  | "member.admin"
  | "board.list.write"
  | "board.task.write"
  | "board.drag"
  | "invitation.create"
  | "invitation.accept"
  | "comment.write"
  | "attachment.write"

export type RateLimitRule = {
  maxRequests: number
  windowSeconds: number
}

export type RateLimitPolicy = {
  actor: RateLimitRule
  workspace?: RateLimitRule
}

export type RateLimitResult = {
  action: RateLimitAction
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: string
}

export type RateLimitRequirement = RateLimitRule & {
  scope: "actor" | "workspace"
  scopeKey: string
  actorUserId: string | null
  workspaceId: string | null
}
