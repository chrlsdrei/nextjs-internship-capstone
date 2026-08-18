import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import { insertGeneratedBoard, insertGeneratedTasks } from "@/features/ai/server/ai-generation.repository"
import * as schema from "@/server/db/schema"
import { aiUsageLogs, lists, projects, tasks, users, workspaceMembers, workspaces } from "@/server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdUserIds = new Set<string>()
const createdWorkspaceIds = new Set<string>()

async function createOwnerAndWorkspace() {
  const suffix = randomUUID()
  const email = `ai-generation-${suffix}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${suffix}`, email, normalizedEmail: email, name: "AI Test Owner" })
    .returning()
  const workspaceId = randomUUID()
  const membershipId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({ id: workspaceId, name: "AI Test", ownerWorkspaceMemberId: membershipId }),
    database.insert(workspaceMembers).values({ id: membershipId, workspaceId, userId: user.id, role: "admin" }),
  ])
  createdUserIds.add(user.id)
  createdWorkspaceIds.add(workspaceId)
  return { user, workspaceId, membershipId }
}

async function createUsage(workspaceId: string, userId: string, projectId?: string) {
  const [usage] = await database
    .insert(aiUsageLogs)
    .values({
      workspaceId,
      userId,
      projectId,
      quotaKey: projectId ? "task_drafting" : "project_planning",
      action: projectId ? "ai.tasks.generate" : "ai.board.generate",
      requestKey: randomUUID(),
      model: "test-model",
    })
    .returning()
  return usage
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  if (createdWorkspaceIds.size > 0) {
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
  }
  if (createdUserIds.size > 0) {
    await database.delete(users).where(inArray(users.id, [...createdUserIds]))
  }
  createdWorkspaceIds.clear()
  createdUserIds.clear()
})

describe("AI generation persistence", () => {
  it("atomically persists a generated board and subsequent generated tasks", async () => {
    const owner = await createOwnerAndWorkspace()
    const boardUsage = await createUsage(owner.workspaceId, owner.user.id)
    const projectId = await insertGeneratedBoard({
      workspaceId: owner.workspaceId,
      workspaceName: "AI Test",
      actorName: owner.user.name,
      actorWorkspaceMemberId: owner.membershipId,
      creatorIsOwner: true,
      title: "Generated board",
      description: "Generated board description",
      board: {
        lists: [
          {
            name: "To Do",
            tasks: [{ title: "First generated task", description: "Generated description" }],
          },
        ],
      },
      usage: { id: boardUsage.id, providerRequestId: "provider-board", inputTokens: 10, outputTokens: 20 },
    })

    expect(projectId).toBeTruthy()
    const [project] = await database
      .select()
      .from(projects)
      .where(eq(projects.id, projectId as string))
    const [list] = await database.select().from(lists).where(eq(lists.projectId, project.id))
    expect(project.title).toBe("Generated board")
    expect(list.name).toBe("To Do")
    expect(await database.select().from(tasks).where(eq(tasks.projectId, project.id))).toHaveLength(1)

    const taskUsage = await createUsage(owner.workspaceId, owner.user.id, project.id)
    const taskIds = await insertGeneratedTasks({
      workspaceId: owner.workspaceId,
      workspaceName: "AI Test",
      projectId: project.id,
      projectTitle: project.title,
      listId: list.id,
      actorName: owner.user.name,
      actorWorkspaceMemberId: owner.membershipId,
      tasks: [{ title: "Second generated task", description: "Another generated description" }],
      usage: { id: taskUsage.id, providerRequestId: "provider-tasks", inputTokens: 5, outputTokens: 10 },
    })

    expect(taskIds).toHaveLength(1)
    const completedUsage = await database
      .select()
      .from(aiUsageLogs)
      .where(inArray(aiUsageLogs.id, [boardUsage.id, taskUsage.id]))
    expect(completedUsage.every((usage) => usage.status === "succeeded")).toBe(true)
  })
})
