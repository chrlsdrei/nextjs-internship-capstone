import type { RateLimitAction, RateLimitPolicy } from "@/features/rate-limits/rate-limit.types"

const minute = 60
const hour = 60 * minute

export const rateLimitPolicies = {
  "workspace.create": { actor: { maxRequests: 5, windowSeconds: hour } },
  "workspace.admin": {
    actor: { maxRequests: 60, windowSeconds: 5 * minute },
    workspace: { maxRequests: 240, windowSeconds: 5 * minute },
  },
  "project.create": {
    actor: { maxRequests: 20, windowSeconds: hour },
    workspace: { maxRequests: 100, windowSeconds: hour },
  },
  "project.admin": {
    actor: { maxRequests: 60, windowSeconds: 5 * minute },
    workspace: { maxRequests: 240, windowSeconds: 5 * minute },
  },
  "member.admin": {
    actor: { maxRequests: 40, windowSeconds: 5 * minute },
    workspace: { maxRequests: 160, windowSeconds: 5 * minute },
  },
  "board.list.write": {
    actor: { maxRequests: 60, windowSeconds: minute },
    workspace: { maxRequests: 300, windowSeconds: minute },
  },
  "board.task.write": {
    actor: { maxRequests: 120, windowSeconds: minute },
    workspace: { maxRequests: 600, windowSeconds: minute },
  },
  "board.drag": {
    actor: { maxRequests: 240, windowSeconds: minute },
    workspace: { maxRequests: 1_200, windowSeconds: minute },
  },
  "invitation.create": {
    actor: { maxRequests: 10, windowSeconds: hour },
    workspace: { maxRequests: 50, windowSeconds: hour },
  },
  "invitation.resend": {
    actor: { maxRequests: 10, windowSeconds: hour },
    workspace: { maxRequests: 30, windowSeconds: hour },
  },
  "invitation.revoke": {
    actor: { maxRequests: 30, windowSeconds: 5 * minute },
    workspace: { maxRequests: 120, windowSeconds: 5 * minute },
  },
  "invitation.accept": { actor: { maxRequests: 20, windowSeconds: hour } },
  "comment.write": {
    actor: { maxRequests: 30, windowSeconds: minute },
    workspace: { maxRequests: 180, windowSeconds: minute },
  },
  "attachment.write": {
    actor: { maxRequests: 20, windowSeconds: 5 * minute },
    workspace: { maxRequests: 100, windowSeconds: 5 * minute },
  },
} satisfies Record<RateLimitAction, RateLimitPolicy>

export function getRateLimitPolicy(action: RateLimitAction): RateLimitPolicy {
  return rateLimitPolicies[action]
}
