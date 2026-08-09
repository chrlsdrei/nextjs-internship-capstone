import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { and, eq, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  addTaskAssigneeRecord,
  removeTaskAssigneeRecord,
  replaceTaskAssignees,
} from "../../features/assignments/server/assignment.repository"
import { softRemoveMemberAndUnassignTasks } from "../../features/members/server/member.repository"
import { insertProject } from "../../features/projects/server/project.repository"
import * as schema from "../../server/db/schema"
import {
  activityLogs,
  lists,
  projectMembers,
  taskAssignees,
  tasks,
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

async function addExplicitProjectMember(projectId: string, workspaceId: string, userId: string) {
  const [workspaceMember] = await database.insert(workspaceMembers).values({ workspaceId, userId }).returning()
  const [projectMember] = await database
    .insert(projectMembers)
    .values({ projectId, workspaceId, workspaceMemberId: workspaceMember.id, role: "editor" })
    .returning()
  return { workspaceMember, projectMember }
}

describe("multiple task assignees", () => {
  let owner: typeof users.$inferSelect
  let workspace: { workspaceId: string; ownerMembershipId: string }
  let project: typeof schema.projects.$inferSelect
  let task: typeof tasks.$inferSelect
  let firstMember: Awaited<ReturnType<typeof addExplicitProjectMember>>
  let secondMember: Awaited<ReturnType<typeof addExplicitProjectMember>>

  beforeEach(async () => {
    owner = await createUser("assignment-owner")
    const firstUser = await createUser("assignment-first")
    const secondUser = await createUser("assignment-second")
    workspace = await createWorkspace(owner.id, "assignments")
    const createdProject = await insertProject(workspace.ownerMembershipId, true, {
      workspaceId: workspace.workspaceId,
      title: "Assignment project",
    })
    if (!createdProject) throw new Error("Expected project creation")
    project = createdProject
    firstMember = await addExplicitProjectMember(project.id, workspace.workspaceId, firstUser.id)
    secondMember = await addExplicitProjectMember(project.id, workspace.workspaceId, secondUser.id)
    const [list] = await database.insert(lists).values({ projectId: project.id, name: "To do" }).returning()
    ;[task] = await database
      .insert(tasks)
      .values({ projectId: project.id, listId: list.id, title: "Assignment test" })
      .returning()
  })

  afterEach(async () => {
    await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
    if (createdWorkspaceIds.size > 0) {
      await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
      createdWorkspaceIds.clear()
    }
    if (createdUserIds.size > 0) {
      await database.delete(users).where(inArray(users.id, [...createdUserIds]))
      createdUserIds.clear()
    }
  })

  it("supports zero, one, or many assignments and prevents duplicates", async () => {
    expect(
      await replaceTaskAssignees(project.id, owner.id, task.id, [
        firstMember.projectMember.id,
        secondMember.projectMember.id,
      ]),
    ).not.toBeNull()
    expect(await database.select().from(taskAssignees).where(eq(taskAssignees.taskId, task.id))).toHaveLength(2)

    expect(await replaceTaskAssignees(project.id, owner.id, task.id, [])).not.toBeNull()
    expect(await database.select().from(taskAssignees).where(eq(taskAssignees.taskId, task.id))).toHaveLength(0)

    await addTaskAssigneeRecord(project.id, owner.id, task.id, firstMember.projectMember.id)
    await addTaskAssigneeRecord(project.id, owner.id, task.id, firstMember.projectMember.id)
    expect(await database.select().from(taskAssignees).where(eq(taskAssignees.taskId, task.id))).toHaveLength(1)

    await removeTaskAssigneeRecord(project.id, owner.id, task.id, firstMember.projectMember.id)
    expect(await database.select().from(taskAssignees).where(eq(taskAssignees.taskId, task.id))).toHaveLength(0)
  })

  it("rejects implicit owners, inactive memberships, and cross-project assignments", async () => {
    expect(await replaceTaskAssignees(project.id, owner.id, task.id, [workspace.ownerMembershipId])).toBeNull()

    const secondProject = await insertProject(workspace.ownerMembershipId, true, {
      workspaceId: workspace.workspaceId,
      title: "Other project",
    })
    if (!secondProject) throw new Error("Expected second project creation")
    const [crossProjectMember] = await database
      .insert(projectMembers)
      .values({
        projectId: secondProject.id,
        workspaceId: workspace.workspaceId,
        workspaceMemberId: secondMember.workspaceMember.id,
        role: "viewer",
      })
      .returning()

    expect(await replaceTaskAssignees(project.id, owner.id, task.id, [crossProjectMember.id])).toBeNull()
    await expect(
      database.insert(taskAssignees).values({
        projectId: project.id,
        taskId: task.id,
        projectMemberId: crossProjectMember.id,
      }),
    ).rejects.toThrow()

    await database
      .update(projectMembers)
      .set({ removedAt: new Date() })
      .where(eq(projectMembers.id, firstMember.projectMember.id))
    expect(await replaceTaskAssignees(project.id, owner.id, task.id, [firstMember.projectMember.id])).toBeNull()
    await expect(
      database.insert(taskAssignees).values({
        projectId: project.id,
        taskId: task.id,
        projectMemberId: firstMember.projectMember.id,
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } })
  })

  it("clears assignments on member removal while retaining assignment history", async () => {
    await database.insert(taskAssignees).values({
      projectId: project.id,
      taskId: task.id,
      projectMemberId: firstMember.projectMember.id,
      assignedByWorkspaceMemberId: workspace.ownerMembershipId,
    })

    await softRemoveMemberAndUnassignTasks(project.id, owner.id, firstMember.projectMember.id)

    const [remainingAssignments, history] = await Promise.all([
      database.select().from(taskAssignees).where(eq(taskAssignees.taskId, task.id)),
      database
        .select()
        .from(activityLogs)
        .where(and(eq(activityLogs.taskId, task.id), eq(activityLogs.action, "task.assignees_updated"))),
    ])
    expect(remainingAssignments).toHaveLength(0)
    expect(history).toHaveLength(1)
    expect(history[0]?.metadata).toMatchObject({ taskTitle: task.title, assigneeNames: [] })
  })
})
