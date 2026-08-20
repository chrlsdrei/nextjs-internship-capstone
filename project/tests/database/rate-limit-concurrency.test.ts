import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { and, eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"
import { reserveAiUsage } from "../../features/ai/repositories/ai-usage.repository"
import type { RateLimitRequirement } from "../../features/rate-limits/rate-limit.types"
import { consumeRateLimitBuckets } from "../../features/rate-limits/repositories/rate-limit.repository"
import * as schema from "../../server/db/schema"
import {
  aiUsageLogs,
  projects,
  rateLimitBuckets,
  users,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createUser(label: string) {
  const suffix = `${label}-${randomUUID()}`
  const email = `${suffix}@projectflow.test`.toLowerCase()
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${suffix}`, email, normalizedEmail: email, name: `Test ${label}` })
    .returning()
  createdUserIds.add(user.id)
  return user
}

async function createWorkspace(ownerUserId: string, label: string) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()
  await database.batch([
    database
      .insert(workspaces)
      .values({ id: workspaceId, name: `Workspace ${label}`, ownerWorkspaceMemberId: ownerMembershipId }),
    database
      .insert(workspaceMembers)
      .values({ id: ownerMembershipId, workspaceId, userId: ownerUserId, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])
  createdWorkspaceIds.add(workspaceId)
  return { workspaceId, ownerMembershipId }
}

function actorRequirement(actorUserId: string, maxRequests: number): RateLimitRequirement {
  return {
    scope: "actor",
    scopeKey: actorUserId,
    actorUserId,
    workspaceId: null,
    maxRequests,
    windowSeconds: 3_600,
  }
}

function workspaceRequirement(workspaceId: string, maxRequests: number): RateLimitRequirement {
  return {
    scope: "workspace",
    scopeKey: workspaceId,
    actorUserId: null,
    workspaceId,
    maxRequests,
    windowSeconds: 3_600,
  }
}

afterEach(async () => {
  if (createdWorkspaceIds.size > 0) {
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
    createdWorkspaceIds.clear()
  }
  if (createdUserIds.size > 0) {
    await database.delete(users).where(inArray(users.id, [...createdUserIds]))
    createdUserIds.clear()
  }
})

describe("database-backed rate limiting", () => {
  it("does not allow parallel requests to exceed actor or workspace limits", async () => {
    const actor = await createUser("parallel")
    const workspace = await createWorkspace(actor.id, "parallel")
    const action = `test.parallel.${randomUUID()}`
    const requirements = [actorRequirement(actor.id, 5), workspaceRequirement(workspace.workspaceId, 5)]

    const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimitBuckets(action, requirements)))

    expect(results.filter((result) => result.allowed)).toHaveLength(5)
    expect(results.filter((result) => !result.allowed)).toHaveLength(15)
    expect(results.find((result) => !result.allowed)?.retryAfterSeconds).toBeGreaterThan(0)

    const buckets = await database.select().from(rateLimitBuckets).where(eq(rateLimitBuckets.action, action))
    expect(buckets).toHaveLength(2)
    expect(buckets.map((bucket) => bucket.requestCount)).toEqual([5, 5])
  })

  it("shares a workspace limit across different actors", async () => {
    const firstActor = await createUser("shared-first")
    const secondActor = await createUser("shared-second")
    const workspace = await createWorkspace(firstActor.id, "shared")
    await database.insert(workspaceMembers).values({
      workspaceId: workspace.workspaceId,
      userId: secondActor.id,
      role: "member",
    })
    const action = `test.shared.${randomUUID()}`

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) => {
        const actorId = index % 2 === 0 ? firstActor.id : secondActor.id
        return consumeRateLimitBuckets(action, [
          actorRequirement(actorId, 10),
          workspaceRequirement(workspace.workspaceId, 3),
        ])
      }),
    )

    expect(results.filter((result) => result.allowed)).toHaveLength(3)
    const [workspaceBucket] = await database
      .select()
      .from(rateLimitBuckets)
      .where(and(eq(rateLimitBuckets.action, action), eq(rateLimitBuckets.scope, "workspace")))
    expect(workspaceBucket.requestCount).toBe(3)
  })
})

describe("AI usage persistence", () => {
  it("allows unlimited Pro AI reservations while retaining unique request keys", async () => {
    const actor = await createUser("ai-quota")
    const workspace = await createWorkspace(actor.id, "ai-quota")
    const startsAt = new Date(Date.UTC(2026, 0, 1))
    const endsAt = new Date(Date.UTC(2027, 0, 1))

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        reserveAiUsage({
          workspaceId: workspace.workspaceId,
          userId: actor.id,
          quotaKey: "parallel_board_generation",
          action: "ai.board.generate",
          requestKey: randomUUID(),
          model: "test-model",
          limit: null,
          scope: "user",
          periodStartsAt: startsAt,
          periodEndsAt: endsAt,
        }),
      ),
    )

    expect(results.filter(Boolean)).toHaveLength(20)
  })

  it("records usage and rejects projects from another workspace", async () => {
    const firstOwner = await createUser("ai-first")
    const secondOwner = await createUser("ai-second")
    const firstWorkspace = await createWorkspace(firstOwner.id, "ai-first")
    const secondWorkspace = await createWorkspace(secondOwner.id, "ai-second")
    const [project] = await database
      .insert(projects)
      .values({
        workspaceId: firstWorkspace.workspaceId,
        createdByWorkspaceMemberId: firstWorkspace.ownerMembershipId,
        title: "AI project",
      })
      .returning()

    const [usage] = await database
      .insert(aiUsageLogs)
      .values({
        workspaceId: firstWorkspace.workspaceId,
        userId: firstOwner.id,
        projectId: project.id,
        quotaKey: "task_drafting",
        action: "draft",
        tokensUsed: 25,
      })
      .returning()
    expect(usage.tokensUsed).toBe(25)

    await expect(
      database.insert(aiUsageLogs).values({
        workspaceId: secondWorkspace.workspaceId,
        userId: secondOwner.id,
        projectId: project.id,
        quotaKey: "task_drafting",
        action: "invalid-cross-workspace",
        tokensUsed: 1,
      }),
    ).rejects.toThrow()
  })
})
