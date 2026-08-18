import "server-only"

import { BillingError } from "@/features/billing/billing.error"
import { DEFAULT_SUBSCRIPTION_LIMITS, tierGrantsAccess } from "@/features/billing/billing.policy"
import type { UserAiEntitlementDto, WorkspaceEntitlementDto } from "@/features/billing/billing.types"
import {
  countWorkspaceCapacity,
  findFreeBillingPlan,
  findPaidBillingPlan,
  findUserSubscriptionTier,
  findWorkspaceOwnerUserId,
  findWorkspaceSubscriptionTier,
} from "@/features/billing/server/billing.repository"

async function userTierContext(userId: string) {
  const tierState = await findUserSubscriptionTier(userId)
  const subscribed = Boolean(tierState && tierGrantsAccess(tierState.tier, tierState.endsAt))
  return { tierState, subscribed }
}

async function workspaceTierContext(workspaceId: string) {
  const tierState = await findWorkspaceSubscriptionTier(workspaceId)
  const subscribed = Boolean(tierState && tierGrantsAccess(tierState.tier, tierState.endsAt))
  return { tierState, subscribed }
}

export async function getUserAiEntitlement(userId: string): Promise<UserAiEntitlementDto> {
  const { tierState, subscribed } = await userTierContext(userId)
  return {
    tier: subscribed ? "pro" : "free",
    subscribed,
    periodEndsAt: subscribed ? (tierState?.endsAt?.toISOString() ?? null) : null,
  }
}

export async function getWorkspaceEntitlement(
  workspaceId: string,
  actorUserId: string,
): Promise<WorkspaceEntitlementDto> {
  const [{ tierState, subscribed }, freePlan, paidPlan, capacity, ownerUserId] = await Promise.all([
    workspaceTierContext(workspaceId),
    findFreeBillingPlan("workspace"),
    findPaidBillingPlan("workspace"),
    countWorkspaceCapacity(workspaceId),
    findWorkspaceOwnerUserId(workspaceId),
  ])
  const maxProjects = subscribed
    ? (paidPlan?.maxProjects ?? DEFAULT_SUBSCRIPTION_LIMITS.workspace.proMaxProjects)
    : (freePlan?.maxProjects ?? DEFAULT_SUBSCRIPTION_LIMITS.workspace.freeMaxProjects)
  const maxMembers = subscribed
    ? (paidPlan?.maxMembers ?? DEFAULT_SUBSCRIPTION_LIMITS.workspace.proMaxMembers)
    : (freePlan?.maxMembers ?? DEFAULT_SUBSCRIPTION_LIMITS.workspace.freeMaxMembers)
  const readOnly = !subscribed && (capacity.projectCount > maxProjects || capacity.memberCount > maxMembers)
  return {
    tier: subscribed ? "pro" : "free",
    subscribed,
    maxProjects,
    maxMembers,
    ...capacity,
    readOnly,
    canManageBilling: ownerUserId === actorUserId,
    periodEndsAt: subscribed ? (tierState?.endsAt?.toISOString() ?? null) : null,
  }
}

export async function getUserAiUsagePeriod(userId: string) {
  const { tierState, subscribed } = await userTierContext(userId)
  if (!subscribed || !tierState?.startsAt || !tierState.endsAt) {
    throw new BillingError("A user AI subscription is required", "SUBSCRIPTION_REQUIRED")
  }
  return { startsAt: tierState.startsAt, endsAt: tierState.endsAt }
}

export async function getWorkspaceAiUsagePeriod(workspaceId: string) {
  const { tierState, subscribed } = await workspaceTierContext(workspaceId)
  if (!subscribed || !tierState?.startsAt || !tierState.endsAt) {
    throw new BillingError("A workspace subscription is required", "WORKSPACE_SUBSCRIPTION_REQUIRED")
  }
  return { startsAt: tierState.startsAt, endsAt: tierState.endsAt }
}

export async function requireUserAiFeature(userId: string, _feature: "board" | "tasks") {
  const entitlement = await getUserAiEntitlement(userId)
  if (!entitlement.subscribed) throw new BillingError("A user AI subscription is required", "SUBSCRIPTION_REQUIRED")
  return entitlement
}

export async function requireWorkspaceSummaryFeature(workspaceId: string, userId: string) {
  const entitlement = await getWorkspaceEntitlement(workspaceId, userId)
  if (!entitlement.subscribed) {
    throw new BillingError("A workspace subscription is required", "WORKSPACE_SUBSCRIPTION_REQUIRED")
  }
  return entitlement
}

export async function requireWorkspaceWritable(workspaceId: string, userId: string) {
  const entitlement = await getWorkspaceEntitlement(workspaceId, userId)
  if (entitlement.readOnly) {
    throw new BillingError(
      "This workspace is read-only because it exceeds its current plan limits",
      "WORKSPACE_READ_ONLY",
    )
  }
  return entitlement
}

export async function requireProjectCapacity(workspaceId: string, userId: string) {
  const entitlement = await requireWorkspaceWritable(workspaceId, userId)
  if (entitlement.maxProjects !== null && entitlement.projectCount >= entitlement.maxProjects) {
    throw new BillingError("This workspace has reached its project limit", "PROJECT_LIMIT_REACHED")
  }
  return entitlement
}

export async function requireMemberCapacity(workspaceId: string, userId: string) {
  const entitlement = await requireWorkspaceWritable(workspaceId, userId)
  if (entitlement.maxMembers !== null && entitlement.memberCount >= entitlement.maxMembers) {
    throw new BillingError("This workspace has reached its member limit", "MEMBER_LIMIT_REACHED")
  }
  return entitlement
}
